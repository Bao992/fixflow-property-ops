# FixFlow

> **Property maintenance operations, from reported problem to verified resolution.**

FixFlow is a PropTech SaaS capstone project focused on making residential maintenance accountable and visible. Tenants can report issues with written descriptions and photo evidence; property managers can review reports, use AI-assisted triage, and track work through to completion.

**Project status:** Active MVP development. This repository contains a working application and a development preview. Some integrations, including outbound WhatsApp delivery, still require external account configuration and end-to-end validation.

## Live project

- **Development preview:** https://fixflow-property-dmdn6mk8u-bao-kekana-s-projects.vercel.app
- **GitHub repository:** https://github.com/Bao992/fixflow-property-ops
- **Current feature pull request:** https://github.com/Bao992/fixflow-property-ops/pull/17
- **Developer:** Bao Kekana
- **GitHub profile:** https://github.com/Bao992

> The preview is connected to an isolated development Supabase project. It is not the production deployment.

## The problem

Residential maintenance is often coordinated through disconnected calls, messages and spreadsheets. Requests can lose momentum while waiting for triage, access, contractor coordination, quotations, approval or verification. Property managers need more than a ticket list: they need a clear view of ownership, progress, evidence and the next action.

## The solution

FixFlow brings the maintenance workflow into one workspace:

- **Tenant reporting:** tenants submit maintenance issues for their linked unit.
- **Photo evidence:** tenants can capture or select images and attach them to a report.
- **Manager workspace:** managers manage properties and units, link tenants, review requests and update statuses.
- **Scout AI:** analyses the written report and attached photos to suggest a category, urgency, summary and follow-up questions. Suggestions are advisory and require human review.
- **Evidence visibility:** managers can view private photo evidence associated with requests they manage.
- **WhatsApp notifications:** a server-side notification function and manager notification preferences are implemented; actual delivery depends on Meta WhatsApp Business configuration and an approved template.

## User roles

| Role | Capabilities |
|---|---|
| Property manager | Manage assigned properties and units, link tenant accounts, review maintenance requests, view evidence, update request status and configure notification preferences |
| Tenant | Access linked unit information, submit maintenance reports with photo evidence and view their submitted requests |

A contractor self-service portal is outside the current MVP scope.

## Technology

- React 19, TypeScript and Vite
- Supabase: PostgreSQL, Auth, Row Level Security and private Storage
- Supabase Edge Functions (Deno)
- Google Gemini API for Scout's multimodal analysis
- Vercel for preview hosting
- GitHub Actions for automated checks

## Repository structure

```text
client/                         React + TypeScript application
  src/
    App.tsx                     Authentication and role routing
    TenantWorkspace.tsx         Tenant reporting and request history
    ManagerDashboard.tsx        Property manager workspace
    ScoutPanel.tsx              Scout review interface
supabase/
  migrations/                   Database schema and policy migrations
  functions/
    scout-analyze/              Authenticated AI analysis endpoint
    notify-manager-whatsapp/    Server-side WhatsApp notification endpoint
  tests/                         Database regression tests
docs/                            Product and implementation documentation
```

## Run locally

### Prerequisites

- Node.js 22 or later
- npm
- A Supabase development project with the repository migrations applied

### Install and start the frontend

```bash
cd client
npm install
npm run dev
```

The Vite development server prints the local URL in the terminal.

### Frontend environment

Create `client/.env.local` with the development project's public Supabase settings:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Use a development project and its publishable key. Never put a service-role key, Gemini API key or WhatsApp access token in frontend environment variables or commit secrets to Git.

### Supabase functions and secrets

The `scout-analyze` Edge Function requires server-side Supabase configuration and a Gemini API key. The `notify-manager-whatsapp` function requires the following Edge Function secrets before it can send messages:

- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_TEMPLATE_NAME`
- Optional: `WHATSAPP_GRAPH_API_VERSION`
- Optional: `WHATSAPP_TEMPLATE_LANGUAGE`
- Optional: `APP_BASE_URL`

Configure secrets in the Supabase project dashboard. Do not commit secret values. A Meta WhatsApp Business Platform setup and an approved message template are required; a successful function deployment alone does not mean a WhatsApp message has been delivered.

Managers configure their recipient number in the app using international E.164 format (for example, `+27821234567`).

## Security and privacy

- Supabase Row Level Security is used to restrict access to application records.
- Maintenance photo evidence is stored in a private bucket, not a public URL.
- Storage access is restricted by request ownership and property-manager relationships.
- AI and notification functions require authenticated requests and perform role/ownership checks.
- Service-role credentials and third-party API tokens stay server-side.
- Scout provides suggestions only. It does not approve expenditure, appoint contractors, change request status or declare work complete.

Use synthetic or consented test data in development. Do not upload sensitive personal information or images of people unless there is a clear, lawful reason and appropriate consent.

## Testing

The repository includes Supabase database regression tests and GitHub Actions checks for database setup, SQL tests, TypeScript and the frontend build. Run the frontend checks from `client/`:

```bash
npm run typecheck
npm run build
```

Database tests are located in `supabase/tests/` and are run through the repository's Supabase test workflow.

## Current implementation status

- [x] React + TypeScript application scaffold
- [x] Supabase authentication and manager/tenant role routing
- [x] Property and unit management
- [x] Tenant-to-unit linking workflow
- [x] Tenant maintenance request submission and history
- [x] Private photo evidence upload
- [x] Manager photo evidence viewing
- [x] Scout text and image analysis endpoint
- [x] Manager WhatsApp notification preferences
- [x] Server-side WhatsApp notification function
- [x] Isolated development database and Vercel preview
- [x] Automated database and frontend checks
- [ ] Complete end-to-end testing with real manager and tenant test accounts
- [ ] Configure Meta WhatsApp Business credentials and approved template
- [ ] Verify successful WhatsApp message delivery
- [ ] Complete security review and production readiness checks

## Product documentation

- [Business definition](BUSINESS.md)
- [Product requirements](docs/PRD.md)
- [Design handoff](docs/designs/README.md)
- [Implementation plan](IMPLEMENTATION_PLAN.md)

## Important note

This is an actively developed capstone MVP, not a production-ready property-management service. The development preview and current feature branch are provided for demonstration and testing. Production data and deployment are kept separate from this development work.
