# Scout — AI maintenance triage

Scout analyses an existing maintenance request and returns structured, advisory-only triage. It never changes request status, priority, contractor assignment or approval fields.

## Deployment

1. Deploy the Edge Function with `supabase functions deploy scout-analyze`.
2. Configure `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` as Supabase Edge Function secrets. Supabase supplies `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
3. Optionally configure `GEMINI_MODEL`, `GEMINI_FALLBACK_MODEL`, and `SCOUT_ALLOWED_ORIGIN`. Set the latter to the exact deployed FixFlow origin in production; do not rely on the wildcard development default.
4. Open Manager → AI Scout and analyse a request.

## Security

- Requires a valid Supabase session and a manager profile.
- Uses the caller's JWT for authentication, role verification, and property ownership checks before sending request details to Gemini.
- Uses the service-role client only inside the Edge Function to persist validated analysis records. Never expose the service-role key to the browser.
- Validates the model response before persistence; resident-submitted report text is treated as untrusted data.
- Saves results to `public.ai_analyses` and leaves maintenance requests, status, priority, approvals and contractor assignments unchanged.
- Treat all output as an AI suggestion requiring human review.

## Review workflow

The manager review workflow and its database protections are maintained separately from the initial Scout triage feature. Apply its migrations in order only after reviewing and testing them against the target database.
