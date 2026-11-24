# Scout — AI maintenance triage

Scout analyses an existing maintenance request and returns structured, advisory-only triage. It never changes request status, priority, contractor assignment or approval fields.

## Deployment

1. Deploy the Edge Function with `supabase functions deploy scout-analyze`.
2. Set `GEMINI_API_KEY` in Supabase Edge Function secrets. Optional: `GEMINI_MODEL` (default `gemini-2.5-flash`) and `SCOUT_ALLOWED_ORIGIN` (the exact deployed FixFlow origin).
3. Supabase supplies `SUPABASE_URL` and `SUPABASE_ANON_KEY`. The function uses the caller JWT and RLS; it does not use a service-role key.
4. Open Manager → AI Scout and analyse a request.

## Security

- Requires a valid Supabase session and manager profile.
- Reads the request using the caller's RLS-scoped client and verifies property ownership.
- Saves the result to `public.ai_analyses` using the caller JWT and manager RLS policy.
- Does not update `maintenance_requests` or expose the Gemini key to the browser.

Treat all output as an AI suggestion requiring human review.
