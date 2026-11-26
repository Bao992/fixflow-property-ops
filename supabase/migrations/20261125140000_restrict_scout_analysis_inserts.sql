-- Only the trusted Scout Edge Function may create AI analysis records.
drop policy if exists "ai_analyses_manager_insert" on public.ai_analyses;
revoke insert on public.ai_analyses from authenticated;
grant insert on public.ai_analyses to service_role;
