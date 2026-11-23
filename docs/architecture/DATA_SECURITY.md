# FixFlow data model and authorization notes

## Scope

Migration `20261123140000_create_core_schema_and_rls.sql` creates the first hosted-Supabase schema for the MVP:

- profiles and application roles
- properties and units
- tenant-to-unit occupancy links
- contractors
- maintenance requests
- request attachments (metadata only)
- request activity
- Scout/Flow analysis records

Notifications are intentionally deferred as a Should-have feature.

## Identity and role provisioning

A trigger creates a profile for each new Supabase Auth user with the least-privileged role, `tenant`. The client cannot update the profile role. Manager accounts must be promoted through a trusted administrative process (for example, the Supabase SQL Editor used by a project owner or a server-side service-role operation). Never expose the service-role key to the browser.

Example administrative operation after confirming the Auth user ID:

```sql
update public.profiles
set role = 'manager'
where id = '<confirmed-auth-user-uuid>';
```

Do not run this for an unverified user. Tenant-to-unit links are created by a Manager after the tenant account exists.

## Access matrix

| Data | Anonymous | Manager | Tenant |
|---|---|---|---|
| Profile | none | own profile | own profile |
| Properties | none | own portfolio | none |
| Units | none | units in own portfolio | currently linked units |
| UnitTenant links | none | links for own units | own links |
| Contractors | none | own directory | none |
| Maintenance requests | none | requests in own portfolio | own requests for linked units |
| Attachments | none | attachments for own portfolio | own uploaded attachment metadata |
| Request activity | none | activity for own portfolio | tenant-visible activity for own requests |
| AI analyses | none | analyses for own portfolio | none |

RLS is enabled on every application table in this migration. Helper functions use a fixed empty search path and are granted only to authenticated users.

## Important implementation boundaries

- RLS is the database boundary; frontend route guards are only a usability feature.
- Manager status transitions must still be validated by the API against the PRD transition map. The initial schema does not implement a database transition trigger.
- Tenant completion responses require a narrow server-side operation in a later migration. There is deliberately no tenant UPDATE policy on maintenance requests.
- Activity summaries must be explicitly classified and sanitized before setting `tenant_visible = true`.
- Attachment rows store metadata only. A private Storage bucket and object-level Storage policies must be added before enabling uploads.
- The API must validate contractor ownership, quote fields, status transitions, activity creation and all AI input/output schemas.
- The profile trigger assigns new users the tenant role. Manager promotion is a trusted administrative action only.

## Required security verification before production

Use two Managers (A and B) and two Tenants (A and B), each tenant linked to a separate unit. Verify all of the following using authenticated sessions, not the SQL Editor's elevated role:

1. Anonymous users cannot select any application data.
2. Manager A can read and write only Manager A's properties, units, contractor records and requests.
3. Manager A cannot read, update or delete Manager B's records.
4. Tenant A can read only their linked unit, their own requests and tenant-visible activity.
5. Tenant A cannot read Tenant B's unit, request, attachment metadata or activity.
6. A Tenant cannot insert a request for an unlinked unit or impersonate another creator.
7. A Tenant cannot update request status, contractor, quote, manager notes or verification fields.
8. A Tenant cannot read contractor records or AI analysis output.
9. A Manager cannot promote a profile through the client.
10. Invalid status transitions are rejected by the API, and every accepted transition creates an activity record.

The migration must be applied to a disposable/test Supabase project and these negative tests must pass before the schema is treated as production-ready.
