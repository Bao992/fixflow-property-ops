# Scout — maintenance analysis

Scout is an advisory-only maintenance triage assistant for FixFlow managers.

## Behaviour
- Analyses one existing maintenance request at a time.
- Suggests a category and priority, explains urgency, flags possible safety concerns, and proposes manager actions/questions.
- Treats resident descriptions as unverified reports and communicates uncertainty.
- Never changes request status, dispatches contractors, contacts tenants, or approves spending.
- Persists each result in `public.ai_analyses` with agent `scout`.

## Security
The Edge Function validates the caller's Supabase access token, checks that the caller's profile role is `manager`, and verifies ownership of the property's maintenance request before sending any report to Gemini. The Gemini key and Supabase service-role key remain server-side secrets. The browser never receives either key.

## Deployment
1. Set the Edge Function secret `GEMINI_API_KEY` in Supabase project secrets. Never commit it.
2. Deploy the function named `scout` from `supabase/functions/scout`.
3. Configure the function to verify JWTs (the handler also validates the user token).
4. The frontend calls `supabase.functions.invoke("scout", { body: { request_id } })`.

Supabase provides `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions. Confirm these are present in the deployed function environment.

## Limitations
Scout output is AI-generated decision support, not a professional inspection, emergency service, diagnosis, or substitute for manager judgement. The manager must verify the report and decide what to do.
