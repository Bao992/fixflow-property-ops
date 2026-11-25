-- FixFlow RLS and trigger regression tests.
-- Run only against the local Supabase database with: npx supabase test db
-- All fixtures are created inside this transaction and rolled back at the end.

begin;

set local search_path = public, extensions;

select plan(18);

-- Deterministic fixture identities. The auth trigger creates tenant profiles.
insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
   'security-manager-one@example.test', '', now(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('10000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated',
   'security-manager-two@example.test', '', now(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('10000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated',
   'security-tenant-one@example.test', '', now(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
  ('10000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated',
   'security-tenant-two@example.test', '', now(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

update public.profiles
set role = 'manager'
where id in (
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002'
);

insert into public.properties (id, manager_id, name, address_line_1)
values
  ('20000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000001', 'Security Test Property One', '1 Test Street'),
  ('20000000-0000-4000-8000-000000000002',
   '10000000-0000-4000-8000-000000000002', 'Security Test Property Two', '2 Test Street');

insert into public.units (id, property_id, unit_label)
values
  ('30000000-0000-4000-8000-000000000001',
   '20000000-0000-4000-8000-000000000001', 'A1'),
  ('30000000-0000-4000-8000-000000000002',
   '20000000-0000-4000-8000-000000000002', 'B1');

insert into public.unit_tenants (id, unit_id, tenant_id, active)
values
  ('40000000-0000-4000-8000-000000000001',
   '30000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000003', true),
  ('40000000-0000-4000-8000-000000000002',
   '30000000-0000-4000-8000-000000000002',
   '10000000-0000-4000-8000-000000000004', true);

insert into public.maintenance_requests (
  id, unit_id, created_by, title, description, status,
  verified_by, verified_at
)
values
  ('50000000-0000-4000-8000-000000000001',
   '30000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000003',
   'Tenant One Test Request', 'Test request for tenant one', 'Submitted', null, null),
  ('50000000-0000-4000-8000-000000000002',
   '30000000-0000-4000-8000-000000000002',
   '10000000-0000-4000-8000-000000000004',
   'Tenant Two Test Request', 'Test request for tenant two', 'Submitted', null, null),
  ('50000000-0000-4000-8000-000000000003',
   '30000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000003',
   'Completed Test Request', 'Completed request for verification test', 'Completed',
   '10000000-0000-4000-8000-000000000001', now());

insert into public.request_activity (
  id, request_id, actor_id, event_type, summary
)
values (
  '60000000-0000-4000-8000-000000000001',
  '50000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'status_note', 'Security test activity'
);

-- Tenant one can see their own request but not tenant two's request.
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  (select count(*)::integer from public.maintenance_requests
   where id = '50000000-0000-4000-8000-000000000001'),
  1,
  'tenant can read their own request while their tenancy is active'
);
select is(
  (select count(*)::integer from public.maintenance_requests
   where id = '50000000-0000-4000-8000-000000000002'),
  0,
  'tenant cannot read another tenant request'
);

select is(
  (select count(*)::integer from public.request_activity
   where request_id = '50000000-0000-4000-8000-000000000001'
     and event_type = 'request_created'
     and tenant_visible = true
     and actor_id = '10000000-0000-4000-8000-000000000003'),
  1,
  'tenant can see the automatically recorded request submission event'
);

reset role;

-- End tenant one's link as the trusted database owner, then verify access ends.
update public.unit_tenants
set active = false, end_at = now()
where id = '40000000-0000-4000-8000-000000000001';

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  (select count(*)::integer from public.maintenance_requests
   where id = '50000000-0000-4000-8000-000000000001'),
  0,
  'former tenant loses access to their previous request'
);

select is(
  (select count(*)::integer from public.request_activity
   where request_id = '50000000-0000-4000-8000-000000000001'
     and tenant_visible = true),
  0,
  'former tenant loses access to the request timeline'
);

-- Manager one sees their own request but not manager two's request.
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select is(
  (select count(*)::integer from public.maintenance_requests
   where id = '50000000-0000-4000-8000-000000000001'),
  1,
  'manager can read a request in a unit they manage'
);
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select is(
  (select count(*)::integer from public.maintenance_requests
   where id = '50000000-0000-4000-8000-000000000001'),
  0,
  'manager cannot read a request belonging to another manager'
);

-- Switch back to manager one for mutation-policy and trigger checks.
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

select throws_ok(
  $$update public.unit_tenants
    set tenant_id = '10000000-0000-4000-8000-000000000004'
    where id = '40000000-0000-4000-8000-000000000001'$$,
  'P0001',
  'Tenancy link identity and start date cannot be changed',
  'manager cannot rewrite the identity of a tenancy link'
);

update public.request_activity
set summary = 'tampered'
where id = '60000000-0000-4000-8000-000000000001';

select is(
  (select count(*)::integer
   from public.request_activity
   where id = '60000000-0000-4000-8000-000000000001'
     and summary = 'Security test activity'),
  1,
  'manager cannot update an existing activity record'
);

delete from public.request_activity
where id = '60000000-0000-4000-8000-000000000001';

select is(
  (select count(*)::integer
   from public.request_activity
   where id = '60000000-0000-4000-8000-000000000001'),
  1,
  'manager cannot delete an existing activity record'
);

select throws_ok(
  $$update public.maintenance_requests
    set created_by = '10000000-0000-4000-8000-000000000004'
    where id = '50000000-0000-4000-8000-000000000001'$$,
  'P0001',
  'A maintenance request creator cannot be changed',
  'manager cannot change the request creator'
);
select throws_ok(
  $$update public.maintenance_requests
    set unit_id = '30000000-0000-4000-8000-000000000002'
    where id = '50000000-0000-4000-8000-000000000001'$$,
  'P0001',
  'A maintenance request cannot be moved to another unit',
  'manager cannot move a request to another unit'
);
select throws_ok(
  $$update public.maintenance_requests
    set verified_by = '10000000-0000-4000-8000-000000000002'
    where id = '50000000-0000-4000-8000-000000000003'$$,
  'P0001',
  'Completion verification cannot be altered after completion',
  'manager cannot overwrite an existing completion verification'
);

-- Reopening is permitted, and the trigger clears the old verification fields.
update public.maintenance_requests
set status = 'In Progress'
where id = '50000000-0000-4000-8000-000000000003';

select is(
  (select count(*)::integer
   from public.maintenance_requests
   where id = '50000000-0000-4000-8000-000000000003'
     and status = 'In Progress'
     and verified_by is null
     and verified_at is null),
  1,
  'manager can reopen a completed request and verification is cleared'
);

select is(
  (select count(*)::integer
   from public.request_activity
   where request_id = '50000000-0000-4000-8000-000000000003'
     and event_type = 'status_changed'
     and from_status = 'Completed'
     and to_status = 'In Progress'
     and actor_id = '10000000-0000-4000-8000-000000000001'
     and tenant_visible = true),
  1,
  'status change automatically records the manager and transition for the tenant'
);

select is(
  (select count(*)::integer
   from public.request_activity
   where request_id = '50000000-0000-4000-8000-000000000001'
     and event_type = 'request_created'),
  1,
  'request submission creates exactly one automatic timeline event'
);

-- A no-op status update must not create another timeline event.
update public.maintenance_requests
set status = status
where id = '50000000-0000-4000-8000-000000000001';

select is(
  (select count(*)::integer
   from public.request_activity
   where request_id = '50000000-0000-4000-8000-000000000001'
     and event_type = 'status_changed'),
  0,
  'updating a request without changing its status creates no activity event'
);

-- Trigger failure must abort the parent request update as part of the same transaction.
-- DDL requires the table owner, so briefly leave the authenticated role.
reset role;
alter table public.request_activity
  add constraint request_activity_test_force_failure
  check (summary <> 'Request status changed from Submitted to Under Review');

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select throws_ok(
  $$update public.maintenance_requests
    set status = 'Under Review'
    where id = '50000000-0000-4000-8000-000000000001'$$,
  '23514',
  null,
  'status update fails when its audit event cannot be inserted'
);

select is(
  (select count(*)::integer
   from public.maintenance_requests
   where id = '50000000-0000-4000-8000-000000000001'
     and status = 'Submitted'),
  1,
  'failed activity insertion rolls back the maintenance request status update'
);

select * from finish();
rollback;
