-- FixFlow core schema and role/ownership security.
-- Manager profiles must be provisioned by a trusted administrator/service role.
-- New Auth users receive the least-privileged tenant role by default.

create extension if not exists pgcrypto;

create type public.app_role as enum ('manager', 'tenant');
create type public.maintenance_status as enum (
  'Submitted',
  'Under Review',
  'Awaiting Contractor',
  'Awaiting Approval',
  'Approved',
  'In Progress',
  'Awaiting Verification',
  'Completed',
  'Rejected',
  'Cancelled'
);
create type public.maintenance_priority as enum ('Low', 'Medium', 'High', 'Critical');
create type public.ai_agent as enum ('scout', 'flow');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'tenant',
  display_name text,
  created_at timestamptz not null default now()
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references public.profiles(id) on delete restrict,
  name text not null check (length(trim(name)) between 1 and 120),
  address_line_1 text not null,
  address_line_2 text,
  locality text,
  region text,
  postal_code text,
  country_code char(2),
  timezone text not null default 'Africa/Johannesburg',
  currency_code char(3) not null default 'ZAR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.units (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  unit_label text not null check (length(trim(unit_label)) between 1 and 80),
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (property_id, unit_label),
  unique (id, property_id)
);

create table public.unit_tenants (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete restrict,
  tenant_id uuid not null references public.profiles(id) on delete restrict,
  start_at timestamptz not null default now(),
  end_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (end_at is null or end_at >= start_at)
);

create unique index unit_tenants_one_active_link
  on public.unit_tenants(unit_id, tenant_id) where active and end_at is null;
create index unit_tenants_tenant_active_idx
  on public.unit_tenants(tenant_id, unit_id) where active and end_at is null;

create table public.contractors (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references public.profiles(id) on delete restrict,
  name text not null check (length(trim(name)) between 1 and 160),
  trades text[] not null default '{}',
  service_area text,
  email text,
  phone text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete restrict,
  created_by uuid not null references public.profiles(id) on delete restrict,
  title text not null check (length(trim(title)) between 1 and 160),
  description text not null check (length(trim(description)) between 1 and 10000),
  category text,
  priority public.maintenance_priority not null default 'Medium',
  status public.maintenance_status not null default 'Submitted',
  contractor_id uuid references public.contractors(id) on delete set null,
  quote_amount numeric(12,2) check (quote_amount is null or quote_amount >= 0),
  currency_code char(3),
  manager_notes text,
  tenant_completion_response text check (tenant_completion_response is null or length(tenant_completion_response) <= 2000),
  tenant_completion_responded_at timestamptz,
  verified_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status <> 'Completed') or
    (verified_by is not null and verified_at is not null)
  )
);

create index maintenance_requests_unit_created_idx
  on public.maintenance_requests(unit_id, created_at desc);
create index maintenance_requests_status_updated_idx
  on public.maintenance_requests(status, updated_at);
create index maintenance_requests_contractor_idx
  on public.maintenance_requests(contractor_id) where contractor_id is not null;

create table public.request_attachments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.maintenance_requests(id) on delete cascade,
  uploader_id uuid not null references public.profiles(id) on delete restrict,
  storage_path text not null unique,
  mime_type text not null,
  file_size_bytes bigint check (file_size_bytes is null or file_size_bytes > 0),
  created_at timestamptz not null default now()
);

create table public.request_activity (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.maintenance_requests(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null check (length(trim(event_type)) between 1 and 80),
  from_status public.maintenance_status,
  to_status public.maintenance_status,
  tenant_visible boolean not null default false,
  summary text not null check (length(trim(summary)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index request_activity_request_created_idx
  on public.request_activity(request_id, created_at);

create table public.ai_analyses (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.maintenance_requests(id) on delete cascade,
  agent public.ai_agent not null,
  provider text,
  model text,
  input_summary text not null,
  structured_output jsonb not null,
  reviewed_by uuid references public.profiles(id) on delete set null,
  review_outcome text check (review_outcome in ('accepted', 'edited', 'dismissed')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index ai_analyses_request_created_idx
  on public.ai_analyses(request_id, created_at desc);

-- Authorization helpers are SECURITY DEFINER to avoid recursive RLS evaluation.
create or replace function public.current_app_role()
returns public.app_role
language sql stable security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = (select auth.uid())
$$;

create or replace function public.manages_property(target_property_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.properties p
    where p.id = target_property_id and p.manager_id = (select auth.uid())
  )
$$;

create or replace function public.manages_unit(target_unit_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.units u
    join public.properties p on p.id = u.property_id
    where u.id = target_unit_id and p.manager_id = (select auth.uid())
  )
$$;

create or replace function public.is_linked_tenant(target_unit_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.unit_tenants ut
    where ut.unit_id = target_unit_id
      and ut.tenant_id = (select auth.uid())
      and ut.active = true
      and ut.end_at is null
  )
$$;

create or replace function public.can_access_request(target_request_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.maintenance_requests r
    join public.units u on u.id = r.unit_id
    join public.properties p on p.id = u.property_id
    where r.id = target_request_id
      and (
        p.manager_id = (select auth.uid())
        or r.created_by = (select auth.uid())
      )
  )
$$;

revoke all on function public.current_app_role() from public;
revoke all on function public.manages_property(uuid) from public;
revoke all on function public.manages_unit(uuid) from public;
revoke all on function public.is_linked_tenant(uuid) from public;
revoke all on function public.can_access_request(uuid) from public;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.manages_property(uuid) to authenticated;
grant execute on function public.manages_unit(uuid) to authenticated;
grant execute on function public.is_linked_tenant(uuid) to authenticated;
grant execute on function public.can_access_request(uuid) to authenticated;

-- Every new auth user receives the least-privileged role. Promote managers only
-- through a trusted administrative operation, never from the client.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, display_name)
  values (
    new.id,
    'tenant',
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_fixflow on auth.users;
create trigger on_auth_user_created_fixflow
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

-- RLS is enabled on all private application tables.
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.units enable row level security;
alter table public.unit_tenants enable row level security;
alter table public.contractors enable row level security;
alter table public.maintenance_requests enable row level security;
alter table public.request_attachments enable row level security;
alter table public.request_activity enable row level security;
alter table public.ai_analyses enable row level security;

create policy "profiles_select_self"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "properties_manager_select"
  on public.properties for select to authenticated
  using (manager_id = (select auth.uid()));
create policy "properties_manager_insert"
  on public.properties for insert to authenticated
  with check (manager_id = (select auth.uid()) and public.current_app_role() = 'manager');
create policy "properties_manager_update"
  on public.properties for update to authenticated
  using (manager_id = (select auth.uid()) and public.current_app_role() = 'manager')
  with check (manager_id = (select auth.uid()) and public.current_app_role() = 'manager');
create policy "properties_manager_delete"
  on public.properties for delete to authenticated
  using (manager_id = (select auth.uid()) and public.current_app_role() = 'manager');

create policy "units_manager_all"
  on public.units for all to authenticated
  using (public.manages_property(property_id) and public.current_app_role() = 'manager')
  with check (public.manages_property(property_id) and public.current_app_role() = 'manager');
create policy "units_tenant_select_linked"
  on public.units for select to authenticated
  using (public.is_linked_tenant(id));

create policy "unit_tenants_manager_all"
  on public.unit_tenants for all to authenticated
  using (public.manages_unit(unit_id) and public.current_app_role() = 'manager')
  with check (public.manages_unit(unit_id) and public.current_app_role() = 'manager');
create policy "unit_tenants_tenant_select_self"
  on public.unit_tenants for select to authenticated
  using (tenant_id = (select auth.uid()));

create policy "contractors_manager_all"
  on public.contractors for all to authenticated
  using (manager_id = (select auth.uid()) and public.current_app_role() = 'manager')
  with check (manager_id = (select auth.uid()) and public.current_app_role() = 'manager');

create policy "requests_manager_all"
  on public.maintenance_requests for all to authenticated
  using (public.manages_unit(unit_id) and public.current_app_role() = 'manager')
  with check (public.manages_unit(unit_id) and public.current_app_role() = 'manager');
create policy "requests_tenant_select_own"
  on public.maintenance_requests for select to authenticated
  using (created_by = (select auth.uid()) and public.is_linked_tenant(unit_id));
create policy "requests_tenant_insert_linked"
  on public.maintenance_requests for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and public.current_app_role() = 'tenant'
    and public.is_linked_tenant(unit_id)
    and status = 'Submitted'
    and contractor_id is null
    and quote_amount is null
    and manager_notes is null
  );
-- Tenant completion response is intentionally handled by a narrow server-side
-- API operation in a later migration; tenants receive no UPDATE policy here.

create policy "attachments_manager_all"
  on public.request_attachments for all to authenticated
  using (
    public.current_app_role() = 'manager'
    and public.can_access_request(request_id)
  )
  with check (
    public.current_app_role() = 'manager'
    and public.can_access_request(request_id)
    and uploader_id = (select auth.uid())
  );
create policy "attachments_tenant_select_own"
  on public.request_attachments for select to authenticated
  using (
    uploader_id = (select auth.uid())
    and public.can_access_request(request_id)
  );
create policy "attachments_tenant_insert_own"
  on public.request_attachments for insert to authenticated
  with check (
    uploader_id = (select auth.uid())
    and public.can_access_request(request_id)
  );

create policy "activity_manager_all"
  on public.request_activity for all to authenticated
  using (
    public.current_app_role() = 'manager'
    and public.can_access_request(request_id)
  )
  with check (
    public.current_app_role() = 'manager'
    and public.can_access_request(request_id)
    and actor_id = (select auth.uid())
  );
create policy "activity_tenant_select_visible"
  on public.request_activity for select to authenticated
  using (
    tenant_visible = true
    and public.can_access_request(request_id)
  );

create policy "ai_analyses_manager_all"
  on public.ai_analyses for all to authenticated
  using (
    public.current_app_role() = 'manager'
    and public.can_access_request(request_id)
  )
  with check (
    public.current_app_role() = 'manager'
    and public.can_access_request(request_id)
  );

-- Keep table access explicit; RLS policies further narrow each operation.
grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.properties, public.units,
  public.unit_tenants, public.contractors, public.maintenance_requests,
  public.request_attachments, public.request_activity, public.ai_analyses
  to authenticated;

-- updated_at is maintained by the API for now; this schema intentionally does
-- not create broad client-side mutation policies for tenant-sensitive columns.
