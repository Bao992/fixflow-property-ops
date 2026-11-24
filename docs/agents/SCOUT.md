# Scout — maintenance analysis

Scout is an advisory-only maintenance triage assistant for FixFlow managers.

## Behaviour
- Analyses one existing maintenance request at a time.
- Suggests a category and urgency, summarizes the report, flags possible safety concerns, and proposes manager actions and questions.
- Treats resident descriptions as unverified reports and communicates uncertainty.
- Never changes request status or priority, dispatches contractors, contacts tenants, or approves spending.
- Persists each result in `public.ai_analyses` with agent `scout`.

## Security
The deployed Edge Function is `scout-analyze`. It validates the caller's Supabase access token, checks that the caller's profile role is `manager`, and verifies that the caller manages the property associated with the request before sending report details to Gemini. It uses the caller's JWT and RLS for database access; it does not require or use a service-role key. The Gemini API key remains server-side.

## Deployment
1. Set the Edge Function secret `GEMINI_API_KEY` in Supabase project secrets. Never commit it.
2. Deploy `supabase/functions/scout-analyze` with `supabase functions deploy scout-analyze`.
3. Optionally set `GEMINI_MODEL` (default `gemini-2.5-flash`) and `SCOUT_ALLOWED_ORIGIN` to the exact deployed FixFlow origin.
4. The manager frontend calls `supabase.functions.invoke("scout-analyze", { body: { request_id } })`.

Supabase provides `SUPABASE_URL` and `SUPABASE_ANON_KEY` to the Edge Function. No service-role secret is required.

## Limitations
Scout output is AI-generated decision support, not a professional inspection, emergency service, diagnosis, or substitute for manager judgement. The manager must verify the report and decide what to do.
