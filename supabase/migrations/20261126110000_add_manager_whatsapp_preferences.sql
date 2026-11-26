-- Per-manager WhatsApp notification preferences. Credentials remain server-side secrets.
create table public.manager_notification_settings (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null unique references public.profiles(id) on delete cascade,
  whatsapp_number text not null check (whatsapp_number ~ '^\+[1-9][0-9]{7,14}$'),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.manager_notification_settings enable row level security;
create policy "manager_notification_settings_select_own"
  on public.manager_notification_settings for select to authenticated
  using (manager_id = (select auth.uid()) and public.current_app_role() = 'manager');
create policy "manager_notification_settings_insert_own"
  on public.manager_notification_settings for insert to authenticated
  with check (manager_id = (select auth.uid()) and public.current_app_role() = 'manager');
create policy "manager_notification_settings_update_own"
  on public.manager_notification_settings for update to authenticated
  using (manager_id = (select auth.uid()) and public.current_app_role() = 'manager')
  with check (manager_id = (select auth.uid()) and public.current_app_role() = 'manager');

grant select, insert, update on public.manager_notification_settings to authenticated;
