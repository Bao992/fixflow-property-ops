# FixFlow — Stitch Design Handoff

This folder is the design handoff location for Google Stitch exports. The Stitch project itself must be created in the user's Google account and its project link added to the repository README.

## Design direction

Create a premium, modern PropTech SaaS product. The interface should feel trustworthy, operational and intelligent—not like a generic admin template.

- Responsive desktop-first manager workspace, with carefully designed mobile layouts.
- Calm neutral surfaces, strong typography, restrained teal/blue accent, clear status colours.
- Consistent spacing, cards, tables, badges, forms and navigation.
- Accessible contrast and visible focus states.
- Show meaningful empty, loading, validation and error states.
- Avoid clutter and avoid making AI agents look like autonomous decision-makers.

## Screen set to design

### Property Manager experience
1. **Manager overview:** KPI cards for new, active, overdue and awaiting approval; maintenance queue; property health/attention list; Flow recommendations.
2. **Maintenance request list:** search, filters, status, priority, property/unit, age and assigned contractor.
3. **Request detail/workspace:** tenant description, photos, Scout analysis panel, status timeline, contractor assignment, quote/approval, notes and completion evidence.
4. **Properties and units:** property list, property detail, unit list and tenant associations.
5. **Contractor directory:** contractor profile, trades, service area, contact details and work history.
6. **Insights:** maintenance expenditure, resolution time, overdue work and recurring issues.

### Tenant experience
7. **Tenant home:** linked unit, open requests and recent updates.
8. **Submit maintenance request:** category, description, urgency indication, room/area and photo upload.
9. **Request tracking:** status timeline, manager updates and completion confirmation.

## Primary Stitch prompt

Design a responsive web application called **FixFlow**, an intelligent property maintenance operations platform for independent landlords and small residential property managers managing 5–50 rental units.

The product is differentiated by maintenance resolution accountability, not just ticket creation. Tenants report problems and track progress. Property managers triage requests, review AI suggestions, coordinate contractors, record quotations and approvals, monitor progress, verify completion and understand recurring faults and costs.

Create a cohesive design system and the following connected screens:
- property manager dashboard;
- maintenance request inbox with filters;
- detailed maintenance workspace with activity timeline;
- Scout AI suggestion card (category, trade, suggested urgency, summary, possible safety flag and next action), clearly marked as advisory and editable;
- Flow AI operational recommendation panel showing stalled work, reason and suggested next action;
- properties/units management;
- contractor directory;
- tenant home and maintenance request form;
- tenant request tracking and completion confirmation;
- analytics/insights view.

Visual style: polished modern B2B SaaS, clean light theme, off-white/white surfaces, deep navy text, restrained teal or blue accent, subtle borders, excellent typography, purposeful whitespace, clear hierarchy and consistent components. Use realistic sample data but no real personal information. Ensure the tenant experience is mobile-first and the manager dashboard works well on desktop and tablet. Include realistic empty states and responsive behaviour. Do not use excessive gradients, glassmorphism or decorative AI gimmicks. AI recommendations must look reviewable, with clear human controls.

## Design acceptance checklist

- [ ] Manager dashboard is understandable at a glance.
- [ ] Manager can visually follow one request from submission to completion.
- [ ] Tenant can submit a request on a phone with minimal friction.
- [ ] AI suggestions are clearly advisory and editable.
- [ ] Statuses and overdue work are easy to distinguish.
- [ ] Responsive mobile, tablet and desktop layouts are represented.
- [ ] Shared components and typography are consistent.
- [ ] Export Stitch screens/images and place them in this folder.
- [ ] Add the Stitch project URL to the root README.

## Export naming suggestion

`manager-dashboard.png`, `maintenance-inbox.png`, `request-detail.png`, `properties-units.png`, `contractors.png`, `tenant-home.png`, `tenant-new-request.png`, `tenant-request-tracking.png`, `insights.png`.
