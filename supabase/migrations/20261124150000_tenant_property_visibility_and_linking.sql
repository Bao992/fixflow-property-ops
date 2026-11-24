-- Tenant visibility and secure manager-to-tenant unit linking.
-- Managers can only link existing tenant accounts to units they own.

create policy "properties_tenant_select_linked"
  on public.properties for select to authenticated
  using (
    exists (
      select 1
      from public.units u
      join public.unit_tenants ut on ut.unit_id = u.id
      where u.property_id = properties.id
        and ut.tenant_id = (select auth.uid())
        and ut.active = true
        and ut.end_at is null
    )
  );

create or replace function public.manager_link_tenant_by_email(
  target_unit_id uuid,
  tenant_email text
)
returns table (
  tenant_id uuid,
  display_name text,
  unit_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  matched_tenant_id uuid;
  matched_display_name text;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  if public.current_app_role() <> 'manager' then
    raise exception 'Only property managers can link tenants';
  end if;

  if not public.manages_unit(target_unit_id) then
    raise exception 'You do not manage this unit';
  end if;

  if tenant_email is null or length(trim(tenant_email)) = 0 then
    raise exception 'Tenant email is required';
  end if;

  select p.id, p.display_name
    into matched_tenant_id, matched_display_name
  from auth.users au
  join public.profiles p on p.id = au.id
  where lower(au.email) = lower(trim(tenant_email))
    and p.role = 'tenant'
  limit 1;

  if matched_tenant_id is null then
    raise exception 'No registered tenant account was found for that email';
  end if;

  if exists (
    select 1
    from public.unit_tenants ut
    where ut.unit_id = target_unit_id
      and ut.tenant_id = matched_tenant_id
      and ut.active = true
      and ut.end_at is null
  ) then
    return query
      select matched_tenant_id, matched_display_name, target_unit_id;
    return;
  end if;

  insert into public.unit_tenants (unit_id, tenant_id, active)
  values (target_unit_id, matched_tenant_id, true);

  return query
    select matched_tenant_id, matched_display_name, target_unit_id;
end;
$$;

revoke all on function public.manager_link_tenant_by_email(uuid, text) from public;
grant execute on function public.manager_link_tenant_by_email(uuid, text) to authenticated;
