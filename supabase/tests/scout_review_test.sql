-- Scout manager review regression tests. Run with: npx supabase test db
begin;
set local search_path=public,extensions;
select plan(10);
insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('10000000-0000-4000-8000-000000000001','authenticated','authenticated','scout-mgr1@test.invalid','',now(),'{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,now(),now()),
('10000000-0000-4000-8000-000000000002','authenticated','authenticated','scout-mgr2@test.invalid','',now(),'{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,now(),now()),
('10000000-0000-4000-8000-000000000003','authenticated','authenticated','scout-tenant@test.invalid','',now(),'{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,now(),now());
update public.profiles set role='manager' where id in ('10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002');
insert into public.properties(id,manager_id,name,address_line_1) values
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Scout Test One','1 Test Street'),
('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','Scout Test Two','2 Test Street');
insert into public.units(id,property_id,unit_label) values
('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','A1'),
('30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','B1');
insert into public.maintenance_requests(id,unit_id,created_by,title,description,status) values
('50000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000003','Leaking tap','Water leaks below the kitchen sink.','Submitted'),
('50000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000003','Broken window','Bedroom window is damaged.','Submitted');
insert into public.ai_analyses(id,request_id,agent,provider,model,input_summary,structured_output) values
('70000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','scout','test','test','accept test','{"category":"plumbing","urgency":"Medium","summary":"A leaking tap.","safety_flags":[],"recommended_actions":["Inspect the tap."],"questions_for_manager":["When did it start?"],"reasoning":"The report describes a leak.","confidence":"medium"}'),
('70000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000001','scout','test','test','edit test','{"category":"plumbing","urgency":"Low","summary":"A leaking tap.","safety_flags":[],"recommended_actions":["Inspect the tap."],"questions_for_manager":[],"reasoning":"The report describes a leak.","confidence":"medium"}'),
('70000000-0000-4000-8000-000000000003','50000000-0000-4000-8000-000000000001','scout','test','test','dismiss test','{"category":"plumbing","urgency":"Low","summary":"A leaking tap.","safety_flags":[],"recommended_actions":[],"questions_for_manager":[],"reasoning":"The report describes a leak.","confidence":"medium"}'),
('70000000-0000-4000-8000-000000000004','50000000-0000-4000-8000-000000000001','scout','test','test','invalid test','{"category":"plumbing","urgency":"Low","summary":"A leaking tap.","safety_flags":[],"recommended_actions":[],"questions_for_manager":[],"reasoning":"The report describes a leak.","confidence":"medium"}'),
('70000000-0000-4000-8000-000000000005','50000000-0000-4000-8000-000000000002','scout','test','test','other manager','{"category":"window","urgency":"Low","summary":"A broken window.","safety_flags":[],"recommended_actions":[],"questions_for_manager":[],"reasoning":"The report describes damage.","confidence":"medium"}');
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claim.role','authenticated',true);
update public.ai_analyses set reviewed_by=auth.uid(),review_outcome='accepted',reviewed_output=structured_output,review_note='Accepted by manager.' where id='70000000-0000-4000-8000-000000000001';
select is((select review_outcome from public.ai_analyses where id='70000000-0000-4000-8000-000000000001'),'accepted'::text,'manager can accept original Scout output');
update public.ai_analyses set reviewed_by=auth.uid(),review_outcome='edited',reviewed_output='{"category":"plumbing","urgency":"High","summary":"Manager-confirmed leak.","safety_flags":[],"recommended_actions":["Arrange inspection."],"questions_for_manager":[],"reasoning":"Manager confirmed the issue.","confidence":"high"}'::jsonb where id='70000000-0000-4000-8000-000000000002';
select is((select reviewed_output->>'urgency' from public.ai_analyses where id='70000000-0000-4000-8000-000000000002'),'High','manager can save edited output');
update public.ai_analyses set reviewed_by=auth.uid(),review_outcome='dismissed',reviewed_output=null,review_note='Not applicable.' where id='70000000-0000-4000-8000-000000000003';
select is((select review_outcome from public.ai_analyses where id='70000000-0000-4000-8000-000000000003'),'dismissed'::text,'manager can dismiss an analysis');
select throws_ok($$update public.ai_analyses set reviewed_by=auth.uid(),review_outcome='accepted',reviewed_output='{"category":"changed"}'::jsonb where id='70000000-0000-4000-8000-000000000004'$$,'P0001','Accepted output must preserve the original Scout analysis','accepted review cannot alter original output');
select throws_ok($$update public.ai_analyses set reviewed_by=auth.uid(),review_outcome='edited',reviewed_output='{"category":"plumbing","urgency":"Medium"}'::jsonb where id='70000000-0000-4000-8000-000000000004'$$,'P0001','Scout analysis must contain all required fields','edited review requires all Scout fields');
select throws_ok($$update public.ai_analyses set reviewed_by=auth.uid(),review_outcome='edited',reviewed_output='{"category":"plumbing","urgency":"Urgent","summary":"Leak.","safety_flags":[],"recommended_actions":[],"questions_for_manager":[],"reasoning":"Leak.","confidence":"medium"}'::jsonb where id='70000000-0000-4000-8000-000000000004'$$,'P0001','Scout urgency must be Low, Medium, High, or Critical','edited review rejects invalid urgency');
select throws_ok($$update public.ai_analyses set reviewed_by=auth.uid(),review_outcome='edited',reviewed_output='{"category":"plumbing","urgency":"Medium","summary":"Leak.","safety_flags":[42],"recommended_actions":[],"questions_for_manager":[],"reasoning":"Leak.","confidence":"medium"}'::jsonb where id='70000000-0000-4000-8000-000000000004'$$,'P0001','Scout analysis arrays must contain only non-empty strings','edited review rejects non-string array values');
select is((select count(*)::integer from public.ai_analyses where id='70000000-0000-4000-8000-000000000005'),0,'manager cannot read another manager analysis');
select throws_ok($$update public.ai_analyses set structured_output='{"category":"tampered"}'::jsonb where id='70000000-0000-4000-8000-000000000004'$$,'42501',null,'manager cannot alter original Scout output');
select * from finish();
rollback;
