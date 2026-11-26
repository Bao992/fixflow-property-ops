# Scout — maintenance analysis

Scout is an advisory-only maintenance triage assistant for FixFlow managers.

## Behaviour
- Analyses one existing maintenance request at a time.
- Suggests a category and urgency, summarizes the report, flags possible safety concerns, and proposes manager actions and questions.
- Treats resident descriptions as unverified reports and communicates uncertainty.
- Never changes request status or priority, dispatches contractors, contacts tenants, or approves spending.
- Persists each result in `public.ai_analyses` with agent `scout`.

## Security
The deployed Edge Function is `scout-analyze`. It validates the caller's Supabase access token, checks that the caller's profile role is `manager`, and verifies that the caller manages the property associated with the request before sending report details to Gemini. It uses the caller's JWT for authentication and manager/property-ownership checks. After those checks and successful model-output validation, a server-only service-role client inserts the analysis; that key is never exposed to the browser. The Gemini API key also remains server-side.

## Deployment
1. Configure `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` as Supabase Edge Function secrets. Supabase provides `SUPABASE_URL` and `SUPABASE_ANON_KEY` to the function runtime.
2. Deploy `supabase/functions/scout-analyze` with `supabase functions deploy scout-analyze`.
3. The current defaults are `GEMINI_MODEL=gemini-3.5-flash-lite` and `GEMINI_FALLBACK_MODEL=gemini-3.1-flash-lite`. Both can be overridden with Edge Function secrets.
4. Set `SCOUT_ALLOWED_ORIGIN` to the exact deployed FixFlow frontend origin in production. The code's wildcard default is intended only for development.
5. The manager frontend calls `supabase.functions.invoke("scout-analyze", { body: { request_id } })`.

Apply migrations `20261125130000` through `20261125160000` in timestamp order to enable the review workflow and restrict direct analysis writes. Review and validate them locally before applying them to a hosted project; do not apply hosted migrations without deployment approval.

## Limitations
Scout output is AI-generated decision support, not a professional inspection, emergency service, diagnosis, or substitute for manager judgement. The manager must verify the report and decide what to do.

## Manager review workflow
Managers can accept, edit, or dismiss a saved assessment. Edited output is validated in the browser and again by the database trigger. The original Scout output is immutable; each review is recorded once with the authenticated reviewer and a database-generated timestamp. The UI requires a note for dismissal. Reviews do not change maintenance status, priority, approvals, or contractor assignments.
