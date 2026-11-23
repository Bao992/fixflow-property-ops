# FixFlow — Business Definition

> **Working name:** FixFlow is a provisional project name. Similar names exist in the property-maintenance market, so trademark, company-name and domain checks are required before commercial launch.

## 1. Executive summary

FixFlow is an intelligent property-maintenance operations platform for independent landlords and small residential property managers. It helps them move maintenance problems from initial report to verified resolution, while keeping tenants informed and giving managers visibility into delays, contractor activity, recurring faults and costs.

FixFlow is not intended to be another digital maintenance log. Its central proposition is **resolution accountability**: every request has an owner, a status, a next action, a history and a verifiable outcome.

## 2. The problem

Small property operators often coordinate repairs through a mixture of messaging apps, phone calls, email, spreadsheets and paper records. This fragmented process can make it difficult to:
- capture and prioritise every reported problem;
- keep tenants, managers and contractors aligned;
- coordinate access, quotations and approvals;
- see which jobs are delayed or waiting for someone to act;
- verify that work was completed satisfactorily;
- identify recurring faults and understand maintenance expenditure.

The result can be slow repairs, repeated follow-ups, poor tenant communication, avoidable costs and limited accountability.

These are problem hypotheses to validate through customer interviews. FixFlow will not claim that every landlord experiences all of them.

## 3. Target customer

### Initial beachhead

Independent landlords and small residential property managers responsible for approximately **5–50 rental units**, particularly those who currently coordinate maintenance manually.

### Users
- **Property manager / landlord:** creates and oversees properties, tenants, requests, contractors, approvals and reporting.
- **Tenant:** reports a problem, provides evidence, follows progress and confirms whether the repair is satisfactory.
- **Contractor:** a future direct platform user. In the MVP, managers maintain contractor records and coordinate assignments.

### Expansion opportunities
After validating the initial segment, FixFlow could expand to larger residential portfolios, short-term rental operators, student accommodation and selected commercial-property operators. The product should be designed for internationalisation, but the first customer segment should remain focused.

## 4. Proposed solution

FixFlow provides one connected workflow:

1. A tenant or manager submits a maintenance request with a description, category, location and optional photos.
2. **Scout**, the maintenance-intelligence agent, analyses the report and suggests a category, trade, urgency, summary and possible safety concern.
3. A property manager reviews and edits the suggestions; the system does not make safety-critical or financial decisions autonomously.
4. The manager assigns a contractor, records a quotation and manages approval.
5. The request progresses through controlled statuses, with timestamps, ownership and an activity history.
6. Completion evidence is recorded and the tenant can confirm whether the issue is resolved.
7. **Flow**, the workflow-orchestration agent, highlights stalled requests and recommends the next operational action.
8. The dashboard surfaces outstanding work, overdue requests, resolution times, expenditure and recurring issues.

## 5. Differentiation and positioning

**Positioning:** Maintenance resolution and accountability intelligence for small property operators.

FixFlow will differentiate through:
- a clear end-to-end request journey rather than request capture alone;
- visibility into hand-offs, pending approvals and stalled work;
- AI-assisted triage with editable, explainable recommendations;
- completion evidence and tenant verification;
- a growing history of recurring faults, costs and contractor outcomes;
- role-specific experiences for managers and tenants.

The competitive category is established and includes property-management suites, maintenance coordination products and contractor/work-order tools. FixFlow should not attempt to out-feature enterprise platforms. Its initial wedge is a focused, approachable workflow for smaller operators who need better follow-through without adopting a complex property-management suite.

## 6. AI and automation strategy

### MVP agents
- **Scout — Maintenance Intelligence:** converts free-text reports into structured suggestions: category, trade, urgency, short summary, possible safety flag and recommended next step.
- **Flow — Operations Coordinator:** evaluates request status, age and missing actions; identifies stalled work and proposes reminders or next steps.

### Later agents
- **Dispatch:** contractor suitability recommendations using trade, service area, availability and recorded performance.
- **Insight:** recurring-fault, expenditure and portfolio trend analysis.
- **Connect:** drafts tenant updates and contractor follow-ups.

### Guardrails
- AI output is advisory and must be reviewable and editable.
- A human manager authorises spending, contractor appointments and status changes that imply approval.
- AI must not diagnose structural, electrical, gas or other safety issues as a substitute for qualified inspection.
- The system should record when AI suggestions were generated and whether a user accepted or changed them.
- Do not send external messages or execute financial actions autonomously in the MVP.

## 7. Business model

### Initial model hypothesis
A recurring SaaS subscription priced by the number of managed units or properties.

Potential tiers to test:
- **Starter:** small portfolio, core maintenance workflow and tenant portal.
- **Growth:** larger portfolio, advanced reporting, contractor performance and more automation.
- **Professional:** multi-user teams, advanced controls, integrations and priority support.

Pricing is intentionally not fixed yet. It must be validated with interviews and willingness-to-pay tests in the target market. A limited trial or guided pilot may reduce adoption friction.

### Future revenue possibilities
- paid integrations with accounting, messaging or property platforms;
- premium analytics and portfolio reporting;
- contractor-side tools or verified contractor subscriptions, if customer research supports them.

## 8. Go-to-market

1. Interview 10–15 independent landlords and small property managers.
2. Recruit 3–5 pilot operators willing to test the workflow with a small number of properties.
3. Demonstrate a complete tenant-report-to-verified-resolution journey.
4. Reach customers through landlord/property-management communities, local property associations, direct outreach, referrals and useful maintenance-operation content.
5. Use pilot outcomes (resolution time, overdue work, follow-up effort and tenant communication) as evidence before scaling paid acquisition.

Initial geographic focus can be South Africa for accessible customer discovery, while designing the product for multiple currencies, time zones, address formats and future markets. This is a validation strategy, not a permanent geographic limitation.

## 9. Competitor landscape

The market includes:
- property-management suites with maintenance modules;
- specialist maintenance coordination platforms;
- contractor/work-order management products;
- spreadsheets, email and messaging apps used as informal alternatives.

Examples for further competitor research include Property Meld, Latchel, Buildium, TenantCloud, HappyCo and Fixflo. This list is illustrative, not exhaustive. Competitor feature, pricing and geographic claims must be checked directly before publication.

### Competitive response
FixFlow will compete on a narrow workflow and customer experience, not on having the largest feature catalogue. Its proof point is whether small operators can reduce missed hand-offs and improve maintenance follow-through.

## 10. Success measures and impact

Pilot metrics:
- median time from request submission to first manager response;
- median time from submission to verified completion;
- percentage of open requests overdue against a configurable target;
- percentage of requests with a recorded next action and responsible owner;
- number of repeat incidents by property/category;
- maintenance expenditure recorded per property;
- tenant satisfaction after completion;
- manager-reported time spent coordinating and chasing repairs.

Baselines should be captured before claiming improvements. The MVP will report what it measures; it will not claim causal savings without evidence.

## 11. Risks and assumptions

| Risk / assumption | Response |
|---|---|
| Small landlords may not pay for another tool | Interview and test willingness to pay before expanding scope |
| Tenants may continue reporting through messaging apps | Make request submission mobile-friendly and low-friction |
| Contractor availability data may be incomplete | Keep assignment manager-controlled in the MVP |
| AI may misclassify urgency or trade | Show confidence/context where available; require human review |
| Photos may contain private information | Restrict access, minimise retention and apply secure storage policies |
| The category is competitive | Focus on smaller operators and resolution accountability |
| Working name may conflict with existing brands | Conduct proper legal, company-name and domain checks before launch |

## 12. MVP scope

### Included
- authentication and role-based access for Property Manager and Tenant;
- property, unit and tenant association management;
- maintenance request creation, triage, assignment and status tracking;
- contractor directory and job assignment records;
- Scout AI analysis and Flow workflow recommendations;
- manager dashboard and basic operational metrics;
- activity history, completion evidence and in-app notifications.

### Excluded from the capstone MVP
- rent collection, accounting and lease management;
- autonomous contractor booking or payment;
- full contractor self-service portal;
- emergency dispatch or safety diagnosis;
- predictive building-maintenance claims without sufficient data;
- complex third-party integrations.

## 13. Long-term vision

FixFlow aims to become an intelligent maintenance operations layer that helps property operators understand not only what needs repair, but what is happening, what is holding progress back, what needs attention next and whether the issue was genuinely resolved.
