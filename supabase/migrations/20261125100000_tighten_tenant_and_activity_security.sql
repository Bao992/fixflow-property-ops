-- Tighten request access, tenant linking and append-only activity history.
-- This migration is additive and intentionally preserves existing production rows.

-- A tenant's access ends when their active unit relationship ends. Managers
-- retain access only to requests in units they currently manage.
create or replace function public.can_access_request(target_request_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.maintenance_requests r
    where r.id = target_request_id
      and (
        (
          public.current_app_role() = 'manager'
          and public.manages_unit(r.unit_id)
        )
        or (
          public.current_app_role() = 'tenant'
          and r.created_by = (select auth.uid())
          and public.is_linked_tenant(r.unit_id)
        )
      )
  )
$$;

-- Managers may inspect and create tenancy links for their own units, but cannot
-- assign a manager account to a unit or bypass the tenant role restriction.
drop policy if exists "unit_tenants_manager_all" on public.unit_tenants;
create policy "unit_tenants_manager_select"
  on public.unit_tenants for select to authenticated
  using (
    public.current_app_role() = 'manager'
    and public.manages_unit(unit_id)
  );
create policy "unit_tenants_manager_insert"
  on public.unit_tenants for insert to authenticated
  with check (
    public.current_app_role() = 'manager'
    and public.manages_unit(unit_id)
    and exists (
      select 1 from public.profiles p
      where p.id = tenant_id and p.role = 'tenant'
    )
    and active = true
    and end_at is null
  );
create policy "unit_tenants_manager_update"
  on public.unit_tenants for update to authenticated
  using (
    public.current_app_role() = 'manager'
    and public.manages_unit(unit_id)
  )
  with check (
    public.current_app_role() = 'manager'
    and public.manages_unit(unit_id)
    and exists (
      select 1 from public.profiles p
      where p.id = tenant_id and p.role = 'tenant'
    )
    and (active = false or end_at is null)
  );
-- No manager DELETE policy: retain tenancy history instead of erasing it.

-- Tenancy links are historical records. A manager may end an active link,
-- but cannot rewrite its parties/start date or reactivate an ended record.
create or replace function public.guard_unit_tenant_link_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $
begin
  if new.unit_id is distinct from old.unit_id
     or new.tenant_id is distinct from old.tenant_id
     or new.start_at is distinct from old.start_at
     or new.created_at is distinct from old.created_at then
    raise exception 'Tenancy link identity and start date cannot be changed';
  end if;

  if (not old.active or old.end_at is not null)
     and (new.active or new.end_at is null) then
    raise exception 'An ended tenancy link cannot be reactivated; create a new link';
  end if;

  if not new.active and new.end_at is null then
    new.end_at := now();
  end if;

  if new.active and new.end_at is not null then
    raise exception 'An active tenancy link cannot have an end date';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_unit_tenant_link_update on public.unit_tenants;
create trigger guard_unit_tenant_link_update
  before update on public.unit_tenants
  for each row execute function public.guard_unit_tenant_link_update();

-- Request activity is an audit trail. Managers can read and append events;
-- neither managers nor tenants can rewrite or delete existing events.
drop policy if exists "activity_manager_all" on public.request_activity;
create policy "activity_manager_select"
  on public.request_activity for select to authenticated
  using (
    public.current_app_role() = 'manager'
    and public.can_access_request(request_id)
  );
create policy "activity_manager_insert"
  on public.request_activity for insert to authenticated
  with check (
    public.current_app_role() = 'manager'
    and public.can_access_request(request_id)
    and actor_id = (select auth.uid())
  );

-- Replace broad attachment manager mutation access with read/append access.
drop policy if exists "attachments_manager_all" on public.request_attachments;
create policy "attachments_manager_select"
  on public.request_attachments for select to authenticated
  using (
    public.current_app_role() = 'manager'
    and public.can_access_request(request_id)
  );
create policy "attachments_manager_insert"
  on public.request_attachments for insert to authenticated
  with check (
    public.current_app_role() = 'manager'
    and public.can_access_request(request_id)
    and uploader_id = (select auth.uid())
  );
drop policy if exists "attachments_tenant_select_own" on public.request_attachments;
create policy "attachments_tenant_select_own"
  on public.request_attachments for select to authenticated
  using (
    uploader_id = (select auth.uid())
    and public.can_access_request(request_id)
  );
drop policy if exists "attachments_tenant_insert_own" on public.request_attachments;
create policy "attachments_tenant_insert_own"
  on public.request_attachments for insert to authenticated
  with check (
    uploader_id = (select auth.uid())
    and public.can_access_request(request_id)
  );

-- Prevent managers from silently moving a request to another unit or changing
-- its creator. A contractor must belong to the same manager as the request.
create or replace function public.guard_maintenance_request_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  request_manager_id uuid;
  contractor_manager_id uuid;
begin
  if new.unit_id <> old.unit_id then
    raise exception 'A maintenance request cannot be moved to another unit';
  end if;

  if new.created_by <> old.created_by then
    raise exception 'A maintenance request creator cannot be changed';
  end if;

  if new.created_at <> old.created_at then
    raise exception 'A maintenance request creation time cannot be changed';
  end if;

  select p.manager_id into request_manager_id
  from public.units u
  join public.properties p on p.id = u.property_id
  where u.id = new.unit_id;

  if new.contractor_id is not null then
    select c.manager_id into contractor_manager_id
    from public.contractors c
    where c.id = new.contractor_id;

    if contractor_manager_id is null or contractor_manager_id <> request_manager_id then
      raise exception 'Contractor must belong to the property manager';
    end if;
  end if;

  -- Reopening a completed request clears its previous verification fields.
  -- A later completion must be verified again by the authenticated manager.
  if old.status = 'Completed' and new.status <> 'Completed' then
    new.verified_by := null;
    new.verified_at := null;
  end if;

  if new.status = 'Completed' then
    if old.status = 'Completed' then
      -- Preserve the original verification record when editing an already
      -- completed request; do not silently replace who verified it or when.
      if new.verified_by is distinct from old.verified_by
         or new.verified_at is distinct from old.verified_at then
        raise exception 'Completion verification cannot be altered after completion';
      end if;
    elsif new.verified_by is distinct from (select auth.uid())
       or new.verified_at is null then
      raise exception 'Completion must be verified by the authenticated manager';
    end if;
  elsif new.verified_by is not null or new.verified_at is not null then
    raise exception 'Clear completion verification when reopening a request';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_maintenance_request_update on public.maintenance_requests;
create trigger guard_maintenance_request_update
  before update on public.maintenance_requests
  for each row execute function public.guard_maintenance_request_update();

-- Keep helper execution limited to authenticated application sessions.
revoke all on function public.can_access_request(uuid) from public;
grant execute on function public.can_access_request(uuid) to authenticated;
