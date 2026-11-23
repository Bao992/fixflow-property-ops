# FixFlow

> **Intelligent property maintenance operations. From reported problem to verified resolution.**

FixFlow is a capstone project exploring how independent landlords and small residential property managers can coordinate repairs, manage contractors, track maintenance costs and ensure every reported issue reaches a documented outcome.

**Working name only:** similar names exist in this category. Brand, domain and trademark clearance are required before commercial launch.

## Project details

- **Student:** Bao Kekana
- **Course:** AI Engineering
- **Facilitator:** Mnelisi Maswanganyi
- **GitHub profile:** [Bao992](https://github.com/Bao992)
- **Project repository:** https://github.com/Bao992/fixflow-property-ops

## The problem

Maintenance is often coordinated across chats, calls, emails and spreadsheets. Requests can lose momentum while waiting for review, access, a contractor, a quotation, approval or verification. Managers need more than a list of tickets: they need visibility into what is happening and what must happen next.

## The solution

FixFlow connects the maintenance journey:
- tenants report issues and follow progress;
- managers triage requests, coordinate contractors and record approvals;
- Scout AI suggests request classification and urgency for human review;
- Flow AI highlights stalled work and recommends next actions;
- dashboards surface outstanding work, overdue requests, costs and recurring issues;
- activity history and completion evidence create accountability.

## Target customer

Initial focus: independent landlords and small residential property managers managing approximately 5–50 rental units. The product is designed with future international expansion in mind.

## Capstone status

- [x] Public repository created
- [x] Business definition and PRD draft committed
- [x] Stitch design brief committed
- [x] Implementation plan committed
- [ ] Stitch screens generated and exported
- [ ] Application scaffold and CI
- [ ] Authentication and role-based access
- [ ] Property and unit management
- [ ] Tenant maintenance request workflow
- [ ] Manager maintenance operations
- [ ] Contractor directory and assignment
- [ ] Scout AI analysis
- [ ] Flow AI recommendations
- [ ] Tests and production deployment

## Product documentation

- [Business definition](BUSINESS.md)
- [Product requirements document](docs/PRD.md)
- [Design brief and Stitch handoff](docs/designs/README.md)
- [Implementation plan](IMPLEMENTATION_PLAN.md)

## Proposed technology

React · TypeScript · Vite · Tailwind CSS · Node.js · Express · Supabase/PostgreSQL · Supabase Auth/Storage/RLS · LLM API · Vitest · GitHub Actions · Vercel

## Roles

- **Property Manager:** manages assigned properties, tenants, maintenance requests, contractors, approvals and reporting.
- **Tenant:** reports and tracks maintenance issues for their linked unit.

A contractor self-service portal is a future extension. Contractor records and assignments are manager-managed in the MVP.

## AI agents

- **Scout:** maintenance request understanding and triage suggestions.
- **Flow:** workflow monitoring and next-action recommendations.

AI output is advisory. Humans retain control over safety decisions, contractor appointments and expenditure approvals.

## Development status

The application code has not yet been scaffolded. The implementation plan defines the intended setup, environment configuration, tests and deployment path. Setup commands, environment variables, test logins, screenshots and the live application URL will be added as implementation progresses.

## Project links

- GitHub repository: https://github.com/Bao992/fixflow-property-ops
- GitHub profile: https://github.com/Bao992
