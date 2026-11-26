-- Add a manager review workflow for Scout analyses. Preserve the original AI output as an immutable audit record.
alter table public.ai_analyses add column reviewed_output jsonb, add column review_note text;
drop policy if exists "ai_analyses_manager_all" on public.ai_analyses;
create policy "ai_analyses_manager_select" on public.ai_analyses for select to authenticated using (public.current_app_role()='manager' and public.can_access_request(request_id));
create policy "ai_analyses_manager_insert" on public.ai_analyses for insert to authenticated with check (public.current_app_role()='manager' and public.can_access_request(request_id) and reviewed_by is null and review_outcome is null and reviewed_at is null and reviewed_output is null and review_note is null);
create policy "ai_analyses_manager_review" on public.ai_analyses for update to authenticated using (public.current_app_role()='manager' and public.can_access_request(request_id)) with check (public.current_app_role()='manager' and public.can_access_request(request_id));
revoke update, delete on public.ai_analyses from authenticated;
grant update (reviewed_by,review_outcome,reviewed_at,reviewed_output,review_note) on public.ai_analyses to authenticated;
create or replace function public.guard_ai_analysis_review() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.id is distinct from old.id or new.request_id is distinct from old.request_id or new.agent is distinct from old.agent or new.provider is distinct from old.provider or new.model is distinct from old.model or new.input_summary is distinct from old.input_summary or new.structured_output is distinct from old.structured_output or new.created_at is distinct from old.created_at then raise exception 'Original AI analysis data cannot be changed'; end if;
 if old.review_outcome is not null or old.reviewed_by is not null or old.reviewed_at is not null or old.reviewed_output is not null or old.review_note is not null then raise exception 'An AI analysis review cannot be changed once submitted'; end if;
 if (select public.current_app_role()) is distinct from 'manager'::public.app_role then raise exception 'Only managers can review AI analyses'; end if;
 if not public.can_access_request(old.request_id) then raise exception 'Manager cannot access this maintenance request'; end if;
 if new.review_outcome is null or new.reviewed_by is distinct from (select auth.uid()) then raise exception 'A valid manager review decision is required'; end if;
 new.reviewed_at:=now();
 if new.review_note is not null and char_length(new.review_note)>2000 then raise exception 'Review notes cannot exceed 2000 characters'; end if;
 if new.review_outcome='accepted' then if new.reviewed_output is distinct from old.structured_output then raise exception 'Accepted output must preserve the original Scout analysis'; end if;
 elsif new.review_outcome='edited' then if new.reviewed_output is null or jsonb_typeof(new.reviewed_output)<>'object' then raise exception 'Edited output must be a JSON object'; end if;
 elsif new.review_outcome='dismissed' then if new.reviewed_output is not null then raise exception 'Dismissed analyses cannot have reviewed output'; end if;
 else raise exception 'Invalid AI analysis review outcome'; end if;
 return new;
end; $$;
drop trigger if exists guard_ai_analysis_review on public.ai_analyses;
create trigger guard_ai_analysis_review before update on public.ai_analyses for each row execute function public.guard_ai_analysis_review();
revoke all on function public.guard_ai_analysis_review() from public;
