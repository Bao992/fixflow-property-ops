# FixFlow — Implementation Plan

**Project:** FixFlow (provisional name)  
**Repository:** https://github.com/Bao992/fixflow-property-ops  
**Course:** AI Engineering  
**Facilitator:** Mnelisi Maswanganyi  
**Status:** Draft implementation plan, to be refined as the Stitch designs and technical choices are confirmed.

## 1. Delivery objective
Deliver a deployed, responsive web application demonstrating the full maintenance-resolution workflow for Manager and Tenant roles, with hosted persistence, backend-enforced permissions, reviewable AI assistance, automated quality checks and a concise demo.

## 2. Scope
### Must-have release
1. Authentication and role access.
2. Manager property and unit management.
3. Tenant maintenance submission and tracking.
4. Manager request workflow, activity history and completion verification.
5. Scout and Flow AI assistance with human review.
6. Contractor directory and operations dashboard.

### Should-have, only after Must features work
- In-app notifications.
- Tenant completion confirmation and expanded insights.

Defer contractor sign-in, autonomous booking, payments, accounting, external messaging and complex integrations.

## 3. Proposed architecture
- **Client:** React, Vite, TypeScript and Tailwind CSS.
- **API:** Node.js 22 LTS, Express and TypeScript.
- **Database and identity:** hosted Supabase PostgreSQL and Supabase Auth.
- **Authorization:** API-level role/ownership checks plus PostgreSQL Row Level Security (RLS). Client route guards are UX only, not security controls.
- **AI:** one server-side LLM provider with structured response validation. Keep API keys server-side.
- **Testing:** Vitest, React Testing Library and Supertest; Playwright only if time allows.
- **CI:** GitHub Actions for pull requests and pushes to main.
- **Deployment:** Vercel frontend and hosted Node API.

Use hosted Supabase rather than depending on local Docker. Keep development lightweight because the laptop has limited spare RAM.

## 4. Proposed repository structure
```text
.
├── client/
├── server/
├── supabase/
│   └── migrations/
├── docs/
│   ├── PRD.md
│   ├── designs/
│   └── architecture/
├── .github/
│   └── workflows/
├── BUSINESS.md
├── IMPLEMENTATION_PLAN.md
└── README.md
```

## 5. Workstreams and acceptance criteria
### W0 — Project foundation
- Add client/server folder structure, scripts, formatting/linting and environment examples.
- Establish PR workflow and first GitHub Actions quality workflow.
- **Done when:** clean install, lint, typecheck and build scripts run; CI is green.

### W1 — Data model and authorization
- Create migrations for profiles, properties, units, tenant-unit links, contractors, maintenance requests, request activity, attachments and AI analyses. Notifications may be deferred.
- Define foreign keys, constraints, indexes and allowed request statuses.
- Enable RLS and role/ownership-aware policies.
- **Done when:** Managers see only their properties and linked records; Tenants see only their linked unit and tenant-safe request data; negative access tests pass.

### W2 — Authentication and app shell
- Implement sign-in/sign-out and session persistence.
- Load the user's profile and role; add role-aware navigation and protected pages.
- Include loading, empty, error and expired-session states.
- **Done when:** Manager and Tenant test accounts see the correct app and cannot access each other's protected workflows.

### W3 — Property and unit management
- Manager can create, view and edit properties and units.
- Manager can associate tenant accounts with units through a controlled invitation/link flow.
- Validate required fields and ownership server-side.
- **Done when:** records persist in Supabase and unauthorized access is denied.

### W4 — Maintenance request workflow
- Tenant can create a request for their linked unit with optional image evidence.
- Manager can review, set priority, assign a contractor, record quote/approval information and progress requests through allowed transitions.
- Store timestamped activity for important actions.
- Tenant sees a tenant-safe progress timeline.
- **Done when:** a request can be followed end-to-end from submission to verified completion with persisted history and enforced permissions.

### W5 — AI assistance
- Scout returns schema-validated summary, category/trade, urgency suggestion, missing information and next action.
- Flow identifies stalled requests using an explicit inactivity rule and explains its recommended follow-up.
- Manager can accept, edit or dismiss suggestions.
- Handle provider failures, invalid output, rate limits and timeouts.
- **Done when:** AI cannot change statuses, approve spending, book contractors or send external messages; outputs are validated and editable.

### W6 — Contractor directory and dashboard
- Manager can create/edit contractor records and assign contractors to requests.
- Dashboard counts derive from persisted requests, not hard-coded values.
- **Done when:** figures match database fixtures and access rules apply.

### W7 — Quality, release and handover
- Add unit, API, authorization and critical-flow tests.
- Run lint, typecheck, tests and production build in GitHub Actions.
- Deploy frontend and API; configure hosted Supabase and secrets.
- Document test accounts, setup, architecture, known issues and demo path.
- **Done when:** public deployment works, core workflow passes and README is accurate.

## 6. Delivery order
| Order | Deliverable | Priority |
|---|---|---|
| 1 | Stitch screen system and responsive key screens | Immediate |
| 2 | Repository scaffold, scripts and CI | Immediate |
| 3 | Supabase schema, auth, roles and RLS | Critical |
| 4 | App shell and role-specific navigation | Critical |
| 5 | Property/unit CRUD | Critical |
| 6 | Tenant request creation and Manager workflow | Critical |
| 7 | Scout and Flow AI assistance | Critical |
| 8 | Contractor records and real dashboard metrics | Critical |
| 9 | Automated tests, deployment and README | Critical |
| 10 | Notifications and expanded insights | Only if time remains |

Prioritise secure end-to-end behaviour over feature breadth or decoration.

## 7. Branch and pull-request workflow
Use short-lived branches with one focused change per PR. Suggested names:
- `chore/project-scaffold`
- `chore/ci-quality-gates`
- `feat/supabase-schema-rls`
- `feat/auth-role-routing`
- `feat/property-unit-management`
- `feat/maintenance-workflow`
- `feat/scout-ai-assistance`
- `feat/flow-stalled-work`
- `feat/contractor-dashboard`

Each PR should state purpose, related issue, implementation summary, screenshots for UI changes, tests run and known limitations. Never commit secrets or real tenant personal information.

## 8. Quality gates
Every PR should pass dependency install, lint, TypeScript typecheck, unit/API tests and production build.

Critical security tests:
- Tenant A cannot read Tenant B's requests or unit.
- Tenant cannot call Manager-only property, contractor or status-transition actions.
- Manager A cannot access Manager B's properties or requests.
- Anonymous users cannot read private data.
- AI request payloads and outputs are validated server-side.

## 9. Environment variables and secrets
Commit only safe placeholder names in `.env.example`. Keep actual values in untracked local environment files and deployment secret settings.

Expected configuration includes Supabase project URL and public anon key, server-side Supabase credentials, server-side LLM API key and client API base URL. Never expose service-role credentials or LLM keys in the browser or Git.

## 10. Demo acceptance path
1. Sign in as Tenant and submit a request with description and photo.
2. Sign in as Manager and locate the request.
3. Run Scout and review/edit its suggestions.
4. Assign a contractor and record quote/approval.
5. Update progress and show the activity timeline.
6. Show Flow surfacing a seeded stale request with a next-action recommendation.
7. Complete verification and show the tenant-safe outcome.
8. Show dashboard figures reflecting persisted requests.
9. Demonstrate a denied cross-tenant or cross-manager access attempt.

## 11. Open decisions
- Final LLM provider and model.
- Exact invitation flow to link tenant accounts to units.
- Whether attachments use Supabase Storage or are deferred.
- Whether tenant confirmation remains Should or is promoted to Must.
- Final Express API deployment host.
- Brand/name clearance is outside capstone implementation scope.
