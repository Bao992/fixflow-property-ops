-- Strengthen manager-edited Scout output validation.
-- Apply after 20261125130000_add_scout_review_workflow.sql.
-- Original Scout output and the existing review protections remain immutable.
create or replace function public.guard_ai_analysis_review()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare field_name text; item jsonb;
begin
 if new.id is distinct from old.id or new.request_id is distinct from old.request_id or new.agent is distinct from old.agent or new.provider is distinct from old.provider or new.model is distinct from old.model or new.input_summary is distinct from old.input_summary or new.structured_output is distinct from old.structured_output or new.created_at is distinct from old.created_at then
  raise exception 'Original AI analysis data cannot be changed';
 end if;
 if old.review_outcome is not null or old.reviewed_by is not null or old.reviewed_at is not null or old.reviewed_output is not null or old.review_note is not null then
  raise exception 'An AI analysis review cannot be changed once submitted';
 end if;
 if (select public.current_app_role()) is distinct from 'manager'::public.app_role then raise exception 'Only managers can review AI analyses'; end if;
 if not public.can_access_request(old.request_id) then raise exception 'Manager cannot access this maintenance request'; end if;
 if new.review_outcome is null or new.reviewed_by is distinct from (select auth.uid()) then raise exception 'A valid manager review decision is required'; end if;
 new.reviewed_at:=now();
 if new.review_note is not null and char_length(new.review_note)>2000 then raise exception 'Review notes cannot exceed 2000 characters'; end if;
 if new.review_outcome='accepted' then
  if new.reviewed_output is distinct from old.structured_output then raise exception 'Accepted output must preserve the original Scout analysis'; end if;
 elsif new.review_outcome='edited' then
  if new.reviewed_output is null or jsonb_typeof(new.reviewed_output)<>'object' then raise exception 'Edited output must be a JSON object'; end if;
  if not (new.reviewed_output ?& array['category','urgency','summary','safety_flags','recommended_actions','questions_for_manager','reasoning','confidence']) then raise exception 'Scout analysis must contain all required fields'; end if;
  foreach field_name in array array['category','summary','reasoning'] loop
   if jsonb_typeof(new.reviewed_output->field_name)<>'string' or char_length(btrim(new.reviewed_output->>field_name))=0 then raise exception 'Scout analysis fields must be non-empty strings'; end if;
  end loop;
  if jsonb_typeof(new.reviewed_output->'urgency')<>'string' or new.reviewed_output->>'urgency' not in ('Low','Medium','High','Critical') then raise exception 'Scout urgency must be Low, Medium, High, or Critical'; end if;
  if jsonb_typeof(new.reviewed_output->'confidence')<>'string' or new.reviewed_output->>'confidence' not in ('low','medium','high') then raise exception 'Scout confidence must be low, medium, or high'; end if;
  if char_length(new.reviewed_output->>'summary')>2000 or char_length(new.reviewed_output->>'reasoning')>2000 then raise exception 'Scout summary and reasoning cannot exceed 2000 characters'; end if;
  foreach field_name in array array['safety_flags','recommended_actions','questions_for_manager'] loop
   if jsonb_typeof(new.reviewed_output->field_name)<>'array' then raise exception 'Scout analysis arrays must contain only non-empty strings'; end if;
   if jsonb_array_length(new.reviewed_output->field_name)>8 then raise exception 'Scout analysis arrays cannot contain more than 8 items'; end if;
   for item in select value from jsonb_array_elements(new.reviewed_output->field_name) as elements(value) loop
    if jsonb_typeof(item)<>'string' or char_length(btrim(item#>>'{}'))=0 then raise exception 'Scout analysis arrays must contain only non-empty strings'; end if;
   end loop;
  end loop;
  if char_length(new.reviewed_output->>'category')>150 then raise exception 'Scout category cannot exceed 150 characters'; end if;
  foreach field_name in array array['safety_flags','recommended_actions','questions_for_manager'] loop
   for item in select value from jsonb_array_elements(new.reviewed_output->field_name) as elements(value) loop
    if char_length(item#>>'{}')>500 then raise exception 'Scout analysis array items cannot exceed 500 characters'; end if;
   end loop;
  end loop;
 elsif new.review_outcome='dismissed' then
  if new.reviewed_output is not null then raise exception 'Dismissed analyses cannot have reviewed output'; end if;
  if new.review_note is null or char_length(btrim(new.review_note))=0 then raise exception 'A manager note is required to dismiss an analysis'; end if;
 else raise exception 'Invalid AI analysis review outcome';
 end if;
 return new;
end; $$;
revoke all on function public.guard_ai_analysis_review() from public;
