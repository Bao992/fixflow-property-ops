-- Remove table-level capabilities outside the manager review workflow.
revoke truncate, references, trigger on table public.ai_analyses from anon, authenticated;
revoke delete on table public.ai_analyses from anon, authenticated;
