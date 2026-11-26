-- Private photo evidence storage for tenant maintenance reports.
-- Object paths use: <request_id>/<random-file-name>
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'maintenance-evidence',
  'maintenance-evidence',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- A tenant may upload evidence only to a request they created for a linked unit.
drop policy if exists "tenant_upload_own_request_evidence" on storage.objects;
create policy "tenant_upload_own_request_evidence"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'maintenance-evidence'
  and (storage.foldername(name))[1] is not null
  and exists (
    select 1
    from public.maintenance_requests r
    where r.id::text = (storage.foldername(name))[1]
      and r.created_by = (select auth.uid())
      and public.is_linked_tenant(r.unit_id)
  )
);

-- Managers can read evidence for requests belonging to properties they manage.
drop policy if exists "manager_read_property_request_evidence" on storage.objects;
create policy "manager_read_property_request_evidence"
on storage.objects for select to authenticated
using (
  bucket_id = 'maintenance-evidence'
  and exists (
    select 1
    from public.maintenance_requests r
    join public.units u on u.id = r.unit_id
    join public.properties p on p.id = u.property_id
    where r.id::text = (storage.foldername(name))[1]
      and p.manager_id = (select auth.uid())
      and public.current_app_role() = 'manager'
  )
);

-- Tenants can read only the evidence they uploaded for their own requests.
drop policy if exists "tenant_read_own_request_evidence" on storage.objects;
create policy "tenant_read_own_request_evidence"
on storage.objects for select to authenticated
using (
  bucket_id = 'maintenance-evidence'
  and owner_id = (select auth.uid())::text
  and exists (
    select 1
    from public.maintenance_requests r
    where r.id::text = (storage.foldername(name))[1]
      and r.created_by = (select auth.uid())
  )
);

-- Keep attachment metadata aligned with the same tenant ownership boundary.
drop policy if exists "attachments_tenant_insert_own" on public.request_attachments;
create policy "attachments_tenant_insert_own"
on public.request_attachments for insert to authenticated
with check (
  uploader_id = (select auth.uid())
  and exists (
    select 1 from public.maintenance_requests r
    where r.id = request_id
      and r.created_by = (select auth.uid())
      and public.is_linked_tenant(r.unit_id)
  )
);
