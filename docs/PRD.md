# FixFlow — Product Requirements Document

**Template basis:** Melsoft PRD Template — Student Copy  
**Product:** FixFlow (provisional working name)  
**Version:** v0.2  
**Date:** 23 November 2026  
**Status:** Draft for review  
**Author:** Bao Kekana  
**Course:** AI Engineering  
**Facilitator / reviewer:** Mnelisi Maswanganyi  
**GitHub profile:** https://github.com/Bao992  
**GitHub repository:** https://github.com/Bao992/fixflow-property-ops  
**Approval:** Not yet approved. Treat this document as the product source of truth after review and confirmation of the open decisions below.

## Change log

| Version | Date | Change |
|---|---|---|
| v0.1 | 23 Nov 2026 | Initial structured draft |
| v0.2 | 23 Nov 2026 | Updated repository details and clarified tenant verification response versus Manager-controlled status changes |

# 1. Product overview

## 1.1 Product name and pitch

**FixFlow** is a provisional name pending brand, domain and trademark clearance.

**One-line pitch:** FixFlow helps small property managers resolve maintenance requests so tenants stay informed and every repair has a clear owner, next action, history and verified outcome.

## 1.2 Problem statement

Independent landlords and small residential property managers often coordinate repairs through separate messages, calls, email and spreadsheets. A request may wait for review, access, contractor assignment, a quotation, approval or completion checks without a clear view of who must act next. This can lead to missed follow-ups, slow repairs, poor tenant communication and limited visibility into recurring faults and costs.

These are customer-discovery hypotheses. They must be validated through interviews and pilot use; the product must not present them as proven market statistics.

## 1.3 Solution

FixFlow provides a shared, role-based maintenance workflow. Tenants submit and track problems. Managers manage properties and units, review requests, use advisory AI recommendations, coordinate contractors and approvals, update progress, record evidence and verify outcomes. Dashboards highlight outstanding work and stalled requests. A request activity history makes important actions traceable.

## 1.4 Platform and vision

The MVP is a responsive browser-based web app. Manager screens are desktop/tablet-first; tenant screens are mobile-first. The longer-term vision is a maintenance operations platform that can support small property operators in multiple countries, after validating the initial workflow.

## 1.5 Terms

| Term | Meaning |
|---|---|
| Property | A building or rental asset managed in FixFlow |
| Unit | Separately occupied rental space belonging to a Property |
| Tenant | Signed-in user linked to a Unit |
| Manager | Signed-in user responsible for one or more Properties |
| Maintenance Request | Reported repair or maintenance problem at a Unit |
| Contractor | Service provider record managed by a Manager |
| Activity | Timestamped record of an action or status change |
| Scout | AI assistant for understanding a maintenance report |
| Flow | AI assistant for identifying stalled work and suggesting next actions |

# 2. Users, personas and roles

## 2.1 Primary and secondary users

The primary user is an independent landlord or small residential property manager managing approximately 5–50 rental units. The initial discovery focus may be South Africa, while the product should avoid hard-coding a single currency, time zone or address format.

Tenants are secondary users. Contractor accounts are out of scope for v1; managers maintain contractor records and coordinate assignments.

## 2.2 Example personas

These personas are fictional design aids, not research participants.

**Thabo Mokoena — Manager, 42:** manages 18 rental units. Uses a Windows laptop and Android phone. He needs to know which repairs are waiting for his action and which contractors need follow-up.

**Lerato Nkosi — Tenant, 31:** uses an Android phone and prepaid mobile data. She wants a simple way to report a problem, attach a photo and see whether the Manager has received it.

**Aisha Patel — Manager, 37:** manages 35 units across several buildings. She wants to identify overdue jobs, repeat faults and maintenance costs across her portfolio.

## 2.3 Roles and permissions

| Capability | Manager | Tenant |
|---|---:|---:|
| View assigned properties and units | Yes | Only linked unit summary |
| Create/edit properties and units | Yes, within own portfolio | No |
| Link tenant accounts to units | Yes, controlled invitation/link flow | No |
| Create maintenance request | Yes, for managed properties | Yes, for linked unit |
| View maintenance requests | All requests for own portfolio | Own requests only |
| View Manager-only notes and quote details | Yes | No |
| Manage contractor records and assignments | Yes | No |
| Change request status | Yes, within allowed transitions | No |
| Add tenant completion response | Review response | Confirm or dispute own request |
| View operational dashboard | Yes, own portfolio | No |
| View other users' records | No, unless explicitly in own portfolio | No |

A System Administrator screen is not included. Initial support and project administration occur through secured provider dashboards.

## 2.4 Authentication and invitation

A user must authenticate before accessing private app data. Manager onboarding is invite-only or owner-provisioned in the capstone. A Manager links a Tenant account to a specific Unit. A Tenant cannot self-assign to a Unit or change their role.

# 3. Goals, metrics and non-goals

## 3.1 Goals

| ID | Goal | Acceptance metric | Target |
|---|---|---|---|
| G1 | Trace requests from submission to outcome | Each request has creator, unit, current status and timestamps | 100% |
| G2 | Protect user and portfolio data | Defined cross-role and cross-owner access tests pass | 100% |
| G3 | Provide reviewable AI suggestions | Valid structured output in the agreed test set; Manager can edit/dismiss | At least 95% schema-valid; all editable |
| G4 | Provide reliable operations visibility | Dashboard counts match persisted test fixtures | All tested totals reconcile |

Targets are capstone test targets, not measured customer outcomes.

## 3.2 Non-goals

- Rent collection, accounting or lease management.
- Autonomous contractor booking, payments or spending approval.
- Emergency dispatch or professional safety diagnosis.
- Full contractor self-service portal.
- Complex third-party integrations or predictive maintenance claims without sufficient data.

# 4. Features, business rules and notifications

## 4.1 Feature list

| ID | Feature | Priority | Goals | Main stories | Screens |
|---|---|---|---|---|---|
| F1 | Authentication and role access | Must | G2 | US1, US2 | S1–S4 |
| F2 | Property and Unit management | Must | G1, G2 | US3 | S4, S5 |
| F3 | Maintenance Request workflow | Must | G1, G2 | US4–US6 | S3, S4, S6–S8 |
| F4 | AI maintenance assistance (Scout and Flow) | Must | G3 | US7, US8 | S4, S7 |
| F5 | Contractor directory and operations dashboard | Must | G1, G4 | US9, US10 | S4, S8, S9 |
| F6 | In-app notifications | Should | G1 | US11 | S3, S4, S6 |
| F7 | Tenant completion response and expanded insights | Should | G1, G4 | US12 | S4, S6, S9 |

## 4.2 Business rules

| ID | Rule |
|---|---|
| BR1 | Every authenticated user has one active application role: Manager or Tenant. |
| BR2 | A Manager may access only Properties and related records assigned to that Manager. |
| BR3 | A Tenant account must be linked to a Unit before it can submit a request. |
| BR4 | A Tenant can create requests only for their currently linked Unit(s). |
| BR5 | A Tenant can read only their own requests and tenant-visible activity. |
| BR6 | Manager-only notes, quote details and internal operational metadata are not returned to Tenant clients. |
| BR7 | All private database tables use Row Level Security; API handlers also check role and ownership. |
| BR8 | Only a Manager may change the request status. The API validates every transition against the allowed transition map. |
| BR9 | Allowed statuses are Submitted, Under Review, Awaiting Contractor, Awaiting Approval, Approved, In Progress, Awaiting Verification, Completed, Rejected and Cancelled. |
| BR10 | A new request starts as Submitted and stores its creator, Unit and creation timestamp. |
| BR11 | A transition to Completed is permitted only after the Manager records verification. |
| BR12 | A Tenant completion response is a separate confirmation/dispute record; it does not directly change status. A Manager reviews a dispute and may return the request to In Progress. |
| BR13 | Every status change stores the prior status, new status, actor and timestamp in request activity. |
| BR14 | A Contractor assignment must reference a contractor record visible to the owning Manager. |
| BR15 | Quote and approval information is Manager-only. The app does not execute payments. |
| BR16 | Scout outputs are suggestions. A Manager must review and explicitly save any chosen category, urgency or next step. |
| BR17 | Scout must not make a final safety determination or replace qualified inspection. A possible safety flag is precautionary and directs the Manager to follow appropriate procedures. |
| BR18 | Flow may flag a request when it has remained in the same status for more than 48 hours without newer activity; the threshold should be configurable. |
| BR19 | Flow recommendations do not update status, assign contractors, approve expenditure or send messages automatically. |
| BR20 | AI requests and responses are validated against server-side schemas. Provider keys are never exposed to the browser. |

## 4.3 Status workflow

| Current status | Allowed next status | Actor |
|---|---|---|
| Submitted | Under Review, Rejected, Cancelled | Manager |
| Under Review | Awaiting Contractor, Awaiting Approval, In Progress, Rejected, Cancelled | Manager |
| Awaiting Contractor | Awaiting Approval, In Progress, Cancelled | Manager |
| Awaiting Approval | Approved, Under Review, Rejected, Cancelled | Manager |
| Approved | In Progress, Cancelled | Manager |
| In Progress | Awaiting Verification, Awaiting Contractor, Cancelled | Manager |
| Awaiting Verification | Completed, In Progress | Manager |
| Completed | No further transition in MVP | — |
| Rejected | No further transition in MVP | — |
| Cancelled | No further transition in MVP | — |

A Tenant may submit a completion response while a request is Awaiting Verification. The response is stored separately; the Manager controls the final status transition.

## 4.4 Notifications

Should-have notifications may be generated for request received, Manager update, status change, contractor assignment (Manager only), approval required (Manager only) and completion response. Notification content must be role-safe and must not expose internal notes.

# 5. Accounts and sign-in

- Sign-in uses Supabase Auth.
- The authenticated identity is mapped to an application Profile containing role and account metadata.
- Manager onboarding is controlled by invitation or initial provisioning.
- Tenant invitation/linking is performed by a Manager.
- Sign-out clears the active application session.
- Private routes redirect unauthenticated users to sign-in.
- Role-aware navigation improves usability but is not a security boundary; all API/database requests enforce access.
- Password recovery should use the provider's supported secure flow if enabled within the capstone schedule.

# 6. User stories, acceptance criteria and edge cases

## 6.1 User stories

**US1 — Sign in (F1).** As a registered user, I want to sign in securely so I can access my FixFlow workspace.
- Given valid credentials, when I sign in, then I reach the correct role home.
- Invalid credentials show a clear error without exposing account secrets.
- Expired sessions require re-authentication before private data is returned.

**US2 — Role-scoped access (F1).** As a user, I want to see only the functions and records permitted to my role.
- Manager routes and API actions reject Tenant accounts.
- Tenant reads are restricted to linked units, own requests and tenant-safe activity.
- Direct API calls cannot bypass role or ownership restrictions.

**US3 — Manage properties and units (F2).** As a Manager, I want to create and update Properties and Units.
- Required fields are validated.
- Units belong to a Property owned by the Manager.
- A Manager cannot access or alter another Manager's portfolio.
- A Unit cannot be linked to an arbitrary Tenant by the Tenant themselves.

**US4 — Submit maintenance request (F3).** As a Tenant, I want to report a problem for my Unit.
- A valid request stores its linked Unit, creator, description and initial status.
- Description validation prevents empty submissions.
- Optional attachments are limited to configured file types and size.
- A Tenant without a linked Unit cannot submit a request.

**US5 — Track request (F3).** As a Tenant, I want to see progress on my own request.
- The request list contains only the Tenant's own requests.
- The timeline shows tenant-visible events in time order.
- Manager-only notes and internal costs are excluded from responses.

**US6 — Coordinate a repair (F3).** As a Manager, I want to review and progress a request.
- Manager can change status only through allowed transitions.
- Manager can assign a contractor from their directory.
- Quote/approval details are stored as private Manager data.
- Every important change creates an activity entry.

**US7 — Use Scout (F4).** As a Manager, I want AI assistance to understand a report.
- Scout returns structured summary, category/trade suggestion, urgency suggestion, missing information and a next action.
- Manager can accept, edit or dismiss the output.
- Provider failure or invalid output produces a recoverable error, not a false successful analysis.
- Scout does not autonomously change status or approve spend.

**US8 — Use Flow (F4).** As a Manager, I want to find requests that may be stalled.
- Flow uses request age, current status and latest activity.
- A surfaced item explains why it was flagged and suggests a next action.
- Manager can dismiss or mark the recommendation as reviewed.
- Flow does not autonomously update records or contact people.

**US9 — Manage contractors (F5).** As a Manager, I want to maintain a contractor directory.
- Manager can create, edit and deactivate contractor records in their portfolio.
- Contractor details are validated.
- Tenant clients cannot read private contractor contact or commercial data unless a specific safe field is intentionally exposed.

**US10 — View operations dashboard (F5).** As a Manager, I want a reliable view of maintenance operations.
- Counts are derived from persisted data.
- Filters and totals are scoped to the Manager's portfolio.
- Empty states are shown when there are no requests or properties.
- Dashboard metrics reconcile with known fixtures.

**US11 — See notifications (F6, Should).** As a user, I want relevant updates surfaced in the app.
- A notification is visible only to its intended recipient.
- Notification links open the permitted request view.
- Read/unread state is persisted.

**US12 — Respond to completion and review insights (F7, Should).** As a Tenant, I want to confirm or dispute a reported completion; as a Manager, I want to review basic trends.
- Tenant response is stored against their own request and does not directly change status.
- Manager can review response and decide whether to complete or return the request to In Progress.
- Basic insight metrics are based on persisted request/activity records.

## 6.2 Edge cases

- No properties or units yet: show a clear Manager onboarding empty state.
- Tenant not linked to a Unit: explain that the Manager must complete linking.
- No maintenance requests: show a helpful empty state and submission action for Tenant.
- Duplicate report: allow the Manager to identify and manage possible duplicates; do not silently merge.
- Unsupported, oversized or failed attachment: show actionable validation/retry feedback.
- Invalid status transition: reject server-side and return a clear message.
- Contractor becomes inactive after assignment: preserve history and require Manager review.
- AI provider unavailable or rate-limited: preserve request data and allow manual workflow.
- AI output fails schema validation: reject it and log a safe diagnostic.
- User loses connection during save: show retry state and avoid duplicate submissions where feasible.
- Concurrent Manager updates: prevent stale overwrites using updated timestamps or optimistic concurrency.
- Tenant disputes completion: reopen operational review for Manager; retain the prior completion attempt and evidence.
- Deleted or deactivated account: preserve required audit history while applying the retention policy.

# 7. User flows and navigation map

## 7.1 Main flows

1. **Authentication:** Welcome → Sign in → role check → Manager Dashboard or Tenant Home.
2. **Tenant reporting:** Tenant Home → New Request → validate details/attachment → create request → Request Tracking.
3. **Manager triage:** Manager Dashboard → Request Inbox → Request Workspace → review Scout → set priority/category → choose next action.
4. **Repair coordination:** Request Workspace → assign Contractor → record quote/approval → In Progress → Awaiting Verification → Manager verification → Completed.
5. **Stalled work:** Manager Dashboard → Flow recommendation → inspect reason/history → take or dismiss suggested action.
6. **Tenant completion response:** Request Tracking → confirm/dispute completion → Manager reviews response → completes or returns request to In Progress.

## 7.2 Navigation

- Public: Welcome, Sign in, Password recovery.
- Manager: Dashboard, Requests, Properties & Units, Contractors, Insights, Account.
- Tenant: Home, New Request, My Requests, Request Tracking, Account.

# 8. Screen inventory and specifications

Nine core screens are required; sign-in/recovery and the Welcome page may be combined in the visual design where appropriate.

| ID | Screen | Role | Purpose and key elements |
|---|---|---|---|
| S1 | Welcome / Sign in | Public | Product value, sign-in form, password recovery entry, validation and loading states |
| S2 | Password recovery | Public | Email entry, neutral confirmation and error feedback |
| S3 | Tenant Home | Tenant | Linked unit summary, open requests, recent tenant-safe updates, new request action |
| S4 | Manager Dashboard | Manager | New/active/overdue/awaiting-approval KPIs, request queue, property attention list, Flow suggestions |
| S5 | Properties and Units | Manager | Property list/detail, units, tenant links, create/edit forms and empty states |
| S6 | Tenant Request Form and Tracking | Tenant | Request category/description/area, optional photo, submission state, own request timeline and completion response |
| S7 | Manager Request Workspace | Manager | Report and attachments, Scout panel, status controls, contractor, quote/approval, activity timeline, notes and verification |
| S8 | Contractor Directory | Manager | Contractor search/list, trade, service area, contact information, active state and create/edit form |
| S9 | Operations Insights | Manager | Spend recorded, resolution duration, overdue requests, repeat issues and filters |

## 8.1 Shared components

- Responsive application shell and role-aware navigation.
- Status and priority badges with text labels, not colour alone.
- Request card/table, filter controls and search.
- Activity timeline with actor and timestamp.
- Form controls with labels, validation and accessible focus states.
- Attachment uploader with file type/size guidance.
- Confirmation dialogs for destructive or consequential actions.
- Loading skeletons, empty states, error states and retry controls.
- AI suggestion card with advisory label, rationale and accept/edit/dismiss controls.

## 8.2 Sample data

Use clearly fictional sample properties, units, requests and contractors. Do not use real tenant data, personal contact details or real addresses in public screenshots. Sample data should cover each status, an overdue request, a repeat issue and a request awaiting verification.

# 9. Design direction

Create a polished, trustworthy PropTech SaaS interface: clean light surfaces, deep navy text, restrained teal/blue accent, consistent spacing, subtle borders and clear typography. Manager workspace is desktop/tablet-first; Tenant reporting and tracking are mobile-first.

Design requirements:
- responsive desktop, tablet and mobile layouts;
- accessible contrast, labelled controls and visible keyboard focus;
- consistent status semantics with labels and icons in addition to colour;
- informative loading, empty, validation and error states;
- concise forms and mobile-friendly photo attachment;
- AI panels clearly described as suggestions, with human control;
- avoid excessive gradients, glassmorphism and decorative AI motifs.

Stitch handoff prompt and screen checklist are maintained in [docs/designs/README.md](designs/README.md). Exported screens should be saved in that folder and linked from the root README.

# 10. Data model

## 10.1 Core entities

| Entity | Key fields (indicative) | Purpose |
|---|---|---|
| Profile | id (auth user FK), role, display_name, created_at | Application role/profile |
| Property | id, manager_id, name, address fields, timezone, currency, created_at | Managed property |
| Unit | id, property_id, unit_label, description, active | Rental unit |
| UnitTenant | id, unit_id, tenant_id, start_at, end_at, active | Tenant-to-unit association history |
| Contractor | id, manager_id, name, trades, service_area, contact details, active | Manager's contractor directory |
| MaintenanceRequest | id, unit_id, created_by, title, description, category, priority, status, contractor_id, quote_amount, currency, timestamps | Maintenance case |
| RequestAttachment | id, request_id, uploader_id, storage_path, mime_type, created_at | Evidence metadata |
| RequestActivity | id, request_id, actor_id, event_type, from_status, to_status, tenant_visible, summary, created_at | Audit/activity timeline |
| AIAnalysis | id, request_id, agent, provider, model, input_summary, structured_output, reviewed_by, review_outcome, created_at | AI suggestion record |
| Notification | id, recipient_id, request_id, type, read_at, created_at | In-app notification (Should) |

Exact column types and constraints belong in the Supabase migrations.

## 10.2 Relationships

- One Manager owns many Properties.
- One Property contains many Units.
- A Unit may have multiple historical Tenant links; enforce at most the intended active tenancy arrangement.
- A Tenant may have access to only explicitly linked active Unit(s).
- A Unit has many Maintenance Requests.
- A Maintenance Request may have zero or one active Contractor assignment at a time in the MVP.
- A Maintenance Request has many Attachments, Activities and AIAnalyses.
- A User may have many Notifications.

## 10.3 Data integrity

Use foreign keys, not-null constraints for required relations, indexes for common filters, timestamps stored consistently (UTC) and explicit currency/time-zone metadata where needed. Do not rely on UI validation for database integrity.

# 11. Tech stack and architecture

## 11.1 Proposed stack

- Frontend: React, Vite, TypeScript and Tailwind CSS.
- Backend: Node.js 22 LTS, Express and TypeScript.
- Data/auth/storage: hosted Supabase PostgreSQL, Auth, Storage and RLS.
- AI: one server-side LLM provider with structured output validation.
- Tests: Vitest, React Testing Library and Supertest; Playwright only if schedule permits.
- CI: GitHub Actions.
- Hosting: Vercel for frontend and a hosted Node API.

Use hosted Supabase; do not make local Docker a project prerequisite.

## 11.2 Architecture

Browser client → Express API → Supabase Auth/PostgreSQL/Storage and approved LLM provider. The browser may use Supabase Auth client capabilities for session management, but all sensitive business operations must be authorised by the API and RLS policies. Secrets remain in server or deployment configuration.

## 11.3 Suggested source layout

```text
client/
server/
supabase/migrations/
docs/PRD.md
docs/designs/
.github/workflows/
BUSINESS.md
IMPLEMENTATION_PLAN.md
README.md
```

# 12. Quality, errors, security and privacy

## 12.1 Quality requirements

- Responsive and usable at common mobile, tablet and desktop widths.
- Consistent form validation and understandable error messages.
- No private page should rely on hidden navigation as access control.
- Dashboard totals must be derived from persisted records.
- All important request state changes produce traceable activity.
- AI provider failure must not block manual maintenance workflow.

## 12.2 Security requirements

- Supabase Auth for identity; validate session/token server-side.
- Enforce role and record ownership in every protected API handler.
- Enable RLS for all tables containing user, property, tenant, request or attachment data.
- Never expose service-role keys or LLM API keys to the browser.
- Validate and size-limit uploads; use private storage buckets and signed access where appropriate.
- Validate payloads server-side and use parameterised queries/provider SDKs.
- Apply rate limits to authentication-sensitive and AI endpoints.
- Avoid logging passwords, tokens, tenant personal data or full sensitive prompts.
- Keep dependency versions reviewed and run automated checks on PRs.

## 12.3 Privacy and POPIA considerations

The product may process tenant names, contact information, property/unit details, maintenance descriptions and photos. Treat these as personal or potentially identifying data.

- Collect only information needed to coordinate maintenance.
- Tell users why information is collected and how it is used.
- Restrict access by role, portfolio ownership and unit association.
- Do not place real personal data in seed data, public screenshots or repository fixtures.
- Establish retention and deletion procedures before a real pilot.
- Use appropriate safeguards for uploaded images and AI provider payloads.
- Review processor terms and cross-border data handling before commercial deployment.

This section is a product-design checklist, not legal advice or a claim of POPIA compliance.

## 12.4 Error handling

Return consistent API error shapes with a safe user message and a diagnostic/request identifier. Distinguish validation errors, permission failures, missing records, conflicts, provider failures and unexpected server errors. Preserve user-entered form data where safe and provide retry guidance.

# 13. Assumptions, risks, open questions and milestones

## 13.1 Assumptions and risks

| Item | Mitigation / validation |
|---|---|
| Small operators experience fragmented maintenance follow-up | Interview 10–15 target customers |
| Small operators will adopt a focused maintenance tool | Pilot with 3–5 operators |
| AI suggestions are useful and trusted | Test 10+ fictional/anonymised examples; keep review mandatory |
| AI may be wrong about trade or urgency | Show advisory status and require Manager review |
| Tenant data could be exposed through faulty permissions | RLS and negative access tests |
| Product name may conflict with existing marks | Brand/domain/trademark checks before launch |
| Time and laptop resources are constrained | Focus on the end-to-end Must workflow; use hosted services and a single LLM provider |

## 13.2 Open questions

1. Which LLM provider/model fits the available budget and capstone environment?
2. What is the simplest secure invitation process for linking tenant accounts to Units?
3. Are attachments included in the first end-to-end workflow or deferred if storage setup takes too long?
4. Will Tenant completion confirmation remain Should or be promoted to Must by the assessor?
5. Which hosted platform will run the Express API?
6. What is the exact retention policy for attachments and AI analysis records?

## 13.3 Milestones

| Milestone | Deliverable | Target checkpoint |
|---|---|---|
| M1 | Public repo, BUSINESS.md, README pitch, PRD and Stitch designs | Mon 23 Nov 2026, 10:00 SAST |
| M2 | Implementation plan merged, issues created and frontend started through PRs | Mon 23 Nov 2026, 15:30 SAST |
| M3 | Hosted database, migrations, auth/roles and CI underway | Tue 24 Nov 2026, 10:00 SAST |
| M4 | Deployed app with login, database and first Must features; portfolio first version deployed | Tue 24 Nov 2026, 15:30 SAST |
| M5 | Must features live, tests passing and README near complete | Wed 25 Nov 2026, 10:00 SAST |
| M6 | Final capstone submission | Wed 25 Nov 2026, 15:30 SAST |

# 14. Using this PRD with AI and design/build tools

This PRD is the product source of truth. Use the following sequence:
1. Review and approve the scope, business rules and open decisions.
2. Generate Stitch screens using the design brief; map each screen to its S-ID.
3. Export screens into docs/designs and update the README with the Stitch project URL.
4. Convert approved requirements into GitHub Issues and an implementation plan.
5. Build one vertical slice at a time; do not create UI-only permission assumptions.
6. After each phase, run tests, inspect the live workflow, update this PRD if requirements change and commit a clear change log entry.

AI coding tools must not silently expand scope or invent business rules. Ask for review when a requirement is ambiguous. Never use real tenant personal information in prompts or sample fixtures.

## 14.1 Five-minute demo script

| Time | Demonstration |
|---|---|
| 0:00–0:30 | State the problem, target customer and resolution-accountability proposition |
| 0:30–1:10 | Sign in as Tenant and submit a maintenance request |
| 1:10–2:00 | Sign in as Manager, review request and inspect Scout suggestions |
| 2:00–2:50 | Assign contractor, record approval and progress the request |
| 2:50–3:30 | Show Flow identifying a deliberately stalled request |
| 3:30–4:10 | Verify completion and show tenant-safe tracking |
| 4:10–4:40 | Show dashboard figures and activity history |
| 4:40–5:00 | Demonstrate a denied cross-role access attempt and close with value proposition |

## 14.2 PRD acceptance checklist

- [ ] Product problem and target customer reviewed.
- [ ] Personas and role permissions reviewed.
- [ ] Five Must and up to three Should features confirmed.
- [ ] Each Must feature maps to a story and screen.
- [ ] Status transitions and business rules implemented and tested.
- [ ] Data model, relationships and RLS policies reviewed.
- [ ] Nine screen specifications represented in Stitch.
- [ ] Error, security, privacy and POPIA considerations reviewed.
- [ ] Open questions resolved or explicitly documented.
- [ ] README, implementation plan and demo script kept aligned.

## 14.3 Glossary

**RLS:** PostgreSQL Row Level Security, used to restrict which records a database role/user may access.  
**SaaS:** Software as a Service, normally delivered through a recurring subscription.  
**POPIA:** Protection of Personal Information Act (South Africa).  
**MVP:** Minimum Viable Product, the smallest release that demonstrates the core value proposition.  
**Verified resolution:** a maintenance request for which the Manager has recorded completion verification and the supporting outcome.
