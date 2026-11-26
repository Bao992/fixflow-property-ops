-- Automatically maintain an append-only, tenant-visible request timeline.
-- SECURITY DEFINER is required because tenant clients cannot insert activity rows
-- directly; the trigger derives the actor from the authenticated JWT context.

create or replace function public.record_maintenance_request_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_actor uuid;
begin
  event_actor := (select auth.uid());

  if tg_op = 'INSERT' then
    insert into public.request_activity (
      request_id, actor_id, event_type, from_status, to_status,
      tenant_visible, summary
    ) values (
      new.id,
      coalesce(event_actor, new.created_by),
      'request_created',
      null,
      new.status,
      true,
      'Maintenance request submitted'
    );

    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.request_activity (
      request_id, actor_id, event_type, from_status, to_status,
      tenant_visible, summary
    ) values (
      new.id,
      event_actor,
      'status_changed',
      old.status,
      new.status,
      true,
      'Request status changed from ' || old.status::text || ' to ' || new.status::text
    );
  end if;

  return new;
end;
$$;

revoke all on function public.record_maintenance_request_activity() from public;

drop trigger if exists maintenance_request_activity_after_insert
  on public.maintenance_requests;
create trigger maintenance_request_activity_after_insert
  after insert on public.maintenance_requests
  for each row execute function public.record_maintenance_request_activity();

drop trigger if exists maintenance_request_activity_after_status_update
  on public.maintenance_requests;
create trigger maintenance_request_activity_after_status_update
  after update of status on public.maintenance_requests
  for each row
  when (old.status is distinct from new.status)
  execute function public.record_maintenance_request_activity();
