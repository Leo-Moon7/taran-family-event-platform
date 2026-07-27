const actorIds = [
  "04100000-0000-4000-8000-000000000001",
  "04100000-0000-4000-8000-000000000002",
  "04100000-0000-4000-8000-000000000003",
  "04100000-0000-4000-8000-000000000004",
  "04100000-0000-4000-8000-000000000005",
  "04100000-0000-4000-8000-000000000006",
];

const actorValues = actorIds.map((id) => `('${id}'::uuid)`).join(",\n    ");

const preflightSql = String.raw`
with qa_actors(id) as (
  values
    ${actorValues}
),
qa_counts as (
  select
    (select count(*) from auth.users where id in (select id from qa_actors)
      or email like 'qa-041-%@example.invalid') as auth_rows,
    (select count(*) from public.taran_admin_profiles
      where user_id in (select id from qa_actors)
        or email like 'qa-041-%@example.invalid') as admin_rows,
    (select count(*) from public.taran_providers where id like 'qa-041-%') as provider_rows,
    (select count(*) from public.taran_submission_cases_v2
      where policy_version like 'qa-041-%'
        or provider_id like 'qa-041-%'
        or submitted_by in (select id from qa_actors)) as submission_rows,
    (select count(*) from public.taran_evidence_assets_v2
      where object_key like 'qa-041/%'
        or owner_user_id in (select id from qa_actors)) as evidence_rows,
    (select count(*) from public.taran_provider_access_grants_v2
      where provider_id like 'qa-041-%'
        or user_id in (select id from qa_actors)) as provider_grant_rows,
    (select count(*) from public.taran_audit_events_v2
      where actor_user_id in (select id from qa_actors)) as audit_rows
)
select
  auth_rows,
  admin_rows,
  provider_rows,
  submission_rows,
  evidence_rows,
  provider_grant_rows,
  audit_rows,
  (
    auth_rows + admin_rows + provider_rows + submission_rows
    + evidence_rows + provider_grant_rows + audit_rows
  ) = 0 as namespace_zero,
  not contribution_enabled as contribution_false,
  not evidence_upload_enabled as evidence_false,
  not public_projection_enabled as projection_false,
  not allow_exact_amount as exact_false
from qa_counts
cross join public.taran_quote_runtime_config_v2
where config_key = 'provider_contribution_quote_v2';
`.trim();

const scenarioSql = String.raw`
begin;

do $qa041$
declare
  v_customer constant uuid := '04100000-0000-4000-8000-000000000001';
  v_provider constant uuid := '04100000-0000-4000-8000-000000000002';
  v_content constant uuid := '04100000-0000-4000-8000-000000000003';
  v_ops1 constant uuid := '04100000-0000-4000-8000-000000000004';
  v_ops2 constant uuid := '04100000-0000-4000-8000-000000000005';
  v_ops3 constant uuid := '04100000-0000-4000-8000-000000000006';
  v_provider_id constant text := 'qa-041-provider-main';
  v_claims jsonb;
  v_evidence1 uuid;
  v_evidence2 uuid;
  v_evidence_provider uuid;
  v_quote1 uuid;
  v_quote2 uuid;
  v_submission1 uuid;
  v_review1 uuid;
  v_info uuid;
  v_info_review uuid;
  v_dispute uuid;
  v_job uuid;
  v_request uuid := '04100000-0000-4000-8000-000000000099';
  v_result jsonb;
  v_count integer;
  v_denied boolean;
  v_targets text[] := array[
    'database_private','storage_original','storage_preview','ocr_derivative',
    'cache_manifest','queue_payload','export_copy','backup_expiry','restore_tombstone'
  ];
  v_target text;
begin
  if exists (
    select 1 from auth.users
    where id in (v_customer,v_provider,v_content,v_ops1,v_ops2,v_ops3)
       or email like 'qa-041-%@example.invalid'
  ) or exists (
    select 1 from public.taran_submission_cases_v2
    where policy_version like 'qa-041-%'
  ) then
    raise exception 'QA-041 namespace is not empty.' using errcode = '55000';
  end if;

  if exists (
    select 1
    from public.taran_quote_runtime_config_v2
    where config_key = 'provider_contribution_quote_v2'
      and (
        contribution_enabled or evidence_upload_enabled
        or public_projection_enabled or allow_exact_amount
      )
  ) then
    raise exception 'QA-041 runtime preflight is not fail-closed.' using errcode = '55000';
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  )
  select
    '00000000-0000-0000-0000-000000000000'::uuid,
    actor.id, 'authenticated', 'authenticated', actor.email,
    crypt('qa-041-local-only', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
    now(), now(), '', '', '', ''
  from (values
    (v_customer, 'qa-041-customer@example.invalid'),
    (v_provider, 'qa-041-provider@example.invalid'),
    (v_content, 'qa-041-content@example.invalid'),
    (v_ops1, 'qa-041-operations-1@example.invalid'),
    (v_ops2, 'qa-041-operations-2@example.invalid'),
    (v_ops3, 'qa-041-operations-3@example.invalid')
  ) actor(id,email);

  insert into public.taran_admin_profiles (user_id,email,role) values
    (v_content,'qa-041-content@example.invalid','content'),
    (v_ops1,'qa-041-operations-1@example.invalid','operations'),
    (v_ops2,'qa-041-operations-2@example.invalid','operations'),
    (v_ops3,'qa-041-operations-3@example.invalid','operations');

  insert into public.taran_providers (id,data,status)
  values (
    v_provider_id,
    '{"name":"QA-041 synthetic provider","source":"qa-041"}'::jsonb,
    'draft'
  );

  update public.taran_quote_runtime_config_v2
  set contribution_enabled = true,
      evidence_upload_enabled = true,
      public_projection_enabled = true,
      allow_exact_amount = false,
      privacy_policy_version = 'qa-041-policy-v1',
      terms_version = 'qa-041-terms-v1',
      quote_link_retention_policy_code = 'quote_case_private_24m',
      scanner_provider = 'qa-041-no-file-metadata-only',
      safe_preview_pipeline = 'qa-041-no-file-metadata-only',
      approved_at = now(),
      approved_by = v_ops1,
      updated_at = now()
  where config_key = 'provider_contribution_quote_v2';

  -- anon: base table denied, allowlisted public RPC callable.
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('role','anon','aal','aal1')::text,
    true
  );
  execute 'set local role anon';
  v_denied := false;
  begin
    execute 'select count(*) from public.taran_quote_public_projections_v2';
  exception when insufficient_privilege then
    v_denied := true;
  end;
  if not v_denied then
    raise exception 'QA-041 anon base-table read was not denied.';
  end if;
  select count(*) into v_count from public.taran_list_quote_public_v2(null,null,20);
  if v_count <> 0 then raise exception 'QA-041 anon RPC precondition mismatch.'; end if;
  execute 'reset role';

  -- operations AAL1 denied.
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub',v_ops1,'role','authenticated','aal','aal1')::text,
    true
  );
  execute 'set local role authenticated';
  v_denied := false;
  begin
    perform public.taran_issue_provider_access_v2(
      v_provider_id,v_provider,'submit_revision',now() + interval '30 days'
    );
  exception when insufficient_privilege then
    v_denied := true;
  end;
  if not v_denied then raise exception 'QA-041 AAL1 operation was not denied.'; end if;
  v_denied := false;
  begin
    execute 'select count(*) from public.taran_submission_cases_v2';
  exception when insufficient_privilege then
    v_denied := true;
  end;
  if not v_denied then raise exception 'QA-041 operations base-table read was not denied.'; end if;
  execute 'reset role';

  -- content has no operations RPC power and no base-table access.
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub',v_content,'role','authenticated','aal','aal2')::text,
    true
  );
  execute 'set local role authenticated';
  v_denied := false;
  begin
    perform public.taran_issue_provider_access_v2(
      v_provider_id,v_provider,'submit_revision',now() + interval '30 days'
    );
  exception when insufficient_privilege then
    v_denied := true;
  end;
  if not v_denied then raise exception 'QA-041 content operations RPC was not denied.'; end if;
  v_denied := false;
  begin
    execute 'select count(*) from public.taran_submission_cases_v2';
  exception when insufficient_privilege then
    v_denied := true;
  end;
  if not v_denied then raise exception 'QA-041 content base-table read was not denied.'; end if;
  execute 'reset role';

  -- AAL2 operations grants provider scopes.
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub',v_ops1,'role','authenticated','aal','aal2')::text,
    true
  );
  execute 'set local role authenticated';
  perform public.taran_issue_provider_access_v2(
    v_provider_id,v_provider,'submit_revision',now() + interval '30 days'
  );
  perform public.taran_issue_provider_access_v2(
    v_provider_id,v_provider,'open_dispute',now() + interval '30 days'
  );
  execute 'reset role';

  -- provider: scoped submission RPC allowed, base table denied.
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub',v_provider,'role','authenticated','aal','aal1')::text,
    true
  );
  execute 'set local role authenticated';
  v_info := public.taran_submit_information_v2(
    'provider_revision',v_provider_id,'kids',
    '{"provider_name":"QA-041 synthetic provider"}'::jsonb,
    'qa-041-policy-v1','information_submission_180d'
  );
  v_denied := false;
  begin
    execute 'select count(*) from public.taran_submission_cases_v2';
  exception when insufficient_privilege then
    v_denied := true;
  end;
  if not v_denied then raise exception 'QA-041 provider base-table read was not denied.'; end if;
  execute 'reset role';

  -- self-review assignment is denied for an operations-authored case.
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub',v_ops1,'role','authenticated','aal','aal2')::text,
    true
  );
  execute 'set local role authenticated';
  v_info := public.taran_submit_information_v2(
    'operator_seed',v_provider_id,'kids',
    '{"price_note":"QA-041 synthetic high risk"}'::jsonb,
    'qa-041-policy-v1','information_submission_180d'
  );
  select id into v_info_review
  from public.taran_review_cases_v2 where submission_case_id = v_info;
  v_denied := false;
  begin
    perform public.taran_assign_review_case_v2(v_info_review,v_ops1);
  exception when insufficient_privilege then
    v_denied := true;
  end;
  if not v_denied then raise exception 'QA-041 self-review assignment was not denied.'; end if;
  execute 'reset role';

  -- service metadata only: no Storage bucket, URL, file, scanner, or preview.
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('role','service_role','aal','aal2')::text,
    true
  );
  execute 'set local role service_role';
  v_evidence1 := public.taran_register_evidence_metadata_v2(
    v_customer,'qa-041/evidence-1',
    repeat('a',64),'qa-041-hmac-v1',1024,'application/pdf'
  );
  perform public.taran_record_evidence_scan_v2(
    v_evidence1,'clean','application/pdf','ready','clear','clear'
  );
  v_evidence2 := public.taran_register_evidence_metadata_v2(
    v_content,'qa-041/evidence-2',
    repeat('b',64),'qa-041-hmac-v1',1024,'application/pdf'
  );
  perform public.taran_record_evidence_scan_v2(
    v_evidence2,'clean','application/pdf','ready','clear','clear'
  );
  v_evidence_provider := public.taran_register_evidence_metadata_v2(
    v_provider,'qa-041/evidence-provider',
    repeat('c',64),'qa-041-hmac-v1',1024,'application/pdf'
  );
  perform public.taran_record_evidence_scan_v2(
    v_evidence_provider,'clean','application/pdf','ready','clear','clear'
  );
  execute 'reset role';

  -- active provider grant blocks customer-reward quote submission.
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub',v_provider,'role','authenticated','aal','aal1')::text,
    true
  );
  execute 'set local role authenticated';
  v_denied := false;
  begin
    perform public.taran_submit_quote_v2(
      v_provider_id,'kids','estimate_received',current_date - 30,
      1500000,true,v_evidence_provider,'qa-041-policy-v1'
    );
  exception when insufficient_privilege then
    v_denied := true;
  end;
  if not v_denied then raise exception 'QA-041 provider reward disguise was not denied.'; end if;
  execute 'reset role';

  -- customer quote RPCs allowed, while private base tables remain denied.
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub',v_customer,'role','authenticated','aal','aal1')::text,
    true
  );
  execute 'set local role authenticated';
  v_quote1 := public.taran_submit_quote_v2(
    v_provider_id,'kids','estimate_received',current_date - 30,
    1500000,true,v_evidence1,'qa-041-policy-v1'
  );
  v_denied := false;
  begin
    execute 'select count(*) from public.taran_quote_prices_v2';
  exception when insufficient_privilege then
    v_denied := true;
  end;
  if not v_denied then raise exception 'QA-041 customer private base read was not denied.'; end if;
  execute 'reset role';

  -- A content administrator has no operations power, but as an authenticated
  -- person can take the same customer intake path. Keeping this duplicate on
  -- a different synthetic subject isolates the later account-deletion gate.
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub',v_content,'role','authenticated','aal','aal1')::text,
    true
  );
  execute 'set local role authenticated';
  v_quote2 := public.taran_submit_quote_v2(
    v_provider_id,'kids','estimate_received',current_date - 29,
    1600000,true,v_evidence2,'qa-041-policy-v1'
  );
  execute 'reset role';

  -- server records one versioned HMAC for both quote candidates.
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('role','service_role','aal','aal2')::text,
    true
  );
  execute 'set local role service_role';
  perform public.taran_record_quote_fingerprint_v2(v_quote1,repeat('d',64),'qa-041-fp-v1');
  perform public.taran_record_quote_fingerprint_v2(v_quote2,repeat('d',64),'qa-041-fp-v1');
  execute 'reset role';

  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub',v_ops1,'role','authenticated','aal','aal2')::text,
    true
  );
  execute 'set local role authenticated';
  perform public.taran_mark_quote_provider_match_v2(v_quote1,'matched',v_provider_id);
  perform public.taran_mark_quote_provider_match_v2(v_quote2,'matched',v_provider_id);
  perform public.taran_mark_quote_duplicate_state_v2(v_quote1,'unique');
  v_denied := false;
  begin
    perform public.taran_mark_quote_duplicate_state_v2(v_quote2,'unique');
  exception when unique_violation then
    v_denied := true;
  end;
  if not v_denied then raise exception 'QA-041 duplicate HMAC uniqueness was not enforced.'; end if;

  select submission_case_id into v_submission1
  from public.taran_quote_cases_v2 where id = v_quote1;
  select id into v_review1
  from public.taran_review_cases_v2 where submission_case_id = v_submission1;
  perform public.taran_assign_review_case_v2(v_review1,v_ops1);
  v_result := public.taran_decide_quote_v2(
    v_review1,'04100000-0000-4000-8000-000000000101',
    'approved','qa_approved','rounded_100k',null,null
  );
  if v_result->>'status' <> 'pending_independent_review' then
    raise exception 'QA-041 first approval did not require an independent reviewer.';
  end if;
  perform public.taran_assign_review_case_v2(v_review1,v_ops2);
  execute 'reset role';

  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub',v_ops2,'role','authenticated','aal','aal2')::text,
    true
  );
  execute 'set local role authenticated';
  v_result := public.taran_decide_quote_v2(
    v_review1,'04100000-0000-4000-8000-000000000102',
    'approved','qa_approved','rounded_100k',null,null
  );
  if v_result->>'status' <> 'approved' then
    raise exception 'QA-041 second independent approval did not approve.';
  end if;
  execute 'reset role';

  -- anon public RPC has one row and only its ten declared public columns.
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('role','anon','aal','aal1')::text,
    true
  );
  execute 'set local role anon';
  select count(*) into v_count
  from public.taran_list_quote_public_v2(v_provider_id,'kids',20);
  if v_count <> 1 then raise exception 'QA-041 public RPC expected one row.'; end if;
  select count(*) into v_count
  from public.taran_list_quote_public_v2(v_provider_id,'kids',20) row_data
  where to_jsonb(row_data) ?| array[
    'quote_case_id','submission_case_id','contributor_user_id','owner_user_id',
    'reviewer_id','evidence_asset_id','object_key','fingerprint_hmac',
    'exact_amount','storage_path'
  ];
  if v_count <> 0 then raise exception 'QA-041 public RPC exposed a private column.'; end if;
  execute 'reset role';

  -- provider opens a dispute; public output becomes empty immediately.
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub',v_provider,'role','authenticated','aal','aal1')::text,
    true
  );
  execute 'set local role authenticated';
  v_dispute := public.taran_open_quote_dispute_v2(
    v_quote1,'malicious','revoke_grant'
  );
  execute 'reset role';

  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('role','anon','aal','aal1')::text,
    true
  );
  execute 'set local role anon';
  select count(*) into v_count
  from public.taran_list_quote_public_v2(v_provider_id,'kids',20);
  if v_count <> 0 then raise exception 'QA-041 disputed quote remained public.'; end if;
  execute 'reset role';

  -- original reviewer cannot resolve; independent operations can, but only
  -- with the allowlisted reason code.
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub',v_ops1,'role','authenticated','aal','aal2')::text,
    true
  );
  execute 'set local role authenticated';
  v_denied := false;
  begin
    perform public.taran_resolve_quote_dispute_v2(
      v_dispute,'approved','evidence_confirmed'
    );
  exception when insufficient_privilege then
    v_denied := true;
  end;
  if not v_denied then raise exception 'QA-041 original reviewer resolved a dispute.'; end if;
  execute 'reset role';

  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub',v_ops3,'role','authenticated','aal','aal2')::text,
    true
  );
  execute 'set local role authenticated';
  v_denied := false;
  begin
    perform public.taran_resolve_quote_dispute_v2(
      v_dispute,'approved','QA-041 freeform reason'
    );
  exception when invalid_parameter_value then
    v_denied := true;
  end;
  if not v_denied then raise exception 'QA-041 freeform dispute reason was accepted.'; end if;
  v_result := public.taran_resolve_quote_dispute_v2(
    v_dispute,'approved','evidence_confirmed'
  );
  if v_result->>'status' <> 'resolved' then
    raise exception 'QA-041 independent dispute resolution failed.';
  end if;
  execute 'reset role';

  -- contributor withdrawal keeps public empty and revokes the quote grant.
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub',v_customer,'role','authenticated','aal','aal1')::text,
    true
  );
  execute 'set local role authenticated';
  perform public.taran_withdraw_submission_v2(v_submission1);
  execute 'reset role';
  if exists (
    select 1 from public.taran_quote_access_grants_v2
    where quote_case_id = v_quote1 and grant_state = 'active'
  ) then
    raise exception 'QA-041 withdrawal left an active quote grant.';
  end if;

  -- Link the v2 job to an account-deletion request and prove early completion
  -- is blocked by migration 015.
  insert into public.taran_account_deletion_tombstones (
    user_id,request_id,state,preflight_after
  ) values (v_customer,v_request,'requested',now() + interval '10 minutes');
  insert into public.taran_account_deletion_requests (id,user_id,status)
  values (v_request,v_customer,'pending');

  select id into v_job
  from public.taran_deletion_jobs_v2
  where submission_case_id = v_submission1
    and account_deletion_request_id = v_request;
  if v_job is null then raise exception 'QA-041 v2 account deletion job was not linked.'; end if;

  v_denied := false;
  begin
    update public.taran_account_deletion_requests
    set status = 'completed', completed_at = now()
    where id = v_request;
  exception when object_not_in_prerequisite_state then
    v_denied := true;
  end;
  if not v_denied then raise exception 'QA-041 account deletion completed before v2 job.'; end if;

  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('role','service_role','aal','aal2')::text,
    true
  );
  execute 'set local role service_role';
  foreach v_target in array v_targets[1:8] loop
    perform public.taran_record_deletion_target_v2(v_job,v_target,true,null);
  end loop;
  execute 'reset role';

  if exists (
    select 1 from public.taran_deletion_jobs_v2
    where id = v_job and state = 'completed'
  ) then
    raise exception 'QA-041 deletion completed before all nine targets.';
  end if;
  if not exists (
    select 1 from public.taran_quote_cases_v2 where id = v_quote1
  ) then
    raise exception 'QA-041 private rows disappeared before target nine.';
  end if;

  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('role','service_role','aal','aal2')::text,
    true
  );
  execute 'set local role service_role';
  perform public.taran_record_deletion_target_v2(
    v_job,'restore_tombstone',true,null
  );
  execute 'reset role';

  if exists (select 1 from public.taran_quote_cases_v2 where id = v_quote1)
     or exists (select 1 from public.taran_quote_prices_v2 where quote_case_id = v_quote1)
     or exists (select 1 from public.taran_evidence_assets_v2 where submission_case_id = v_submission1)
     or exists (select 1 from public.taran_submission_fields_v2 where submission_case_id = v_submission1)
     or exists (select 1 from public.taran_quote_public_projections_v2 where quote_case_id = v_quote1)
     or exists (select 1 from public.taran_quote_access_grants_v2 where quote_case_id = v_quote1) then
    raise exception 'QA-041 private rows remain after target nine.';
  end if;

  update public.taran_account_deletion_requests
  set status = 'completed', completed_at = now()
  where id = v_request;
  if not exists (
    select 1 from public.taran_account_deletion_requests
    where id = v_request and status = 'completed'
  ) then
    raise exception 'QA-041 account deletion did not complete after v2 job.';
  end if;

  update public.taran_quote_runtime_config_v2
  set contribution_enabled = false,
      evidence_upload_enabled = false,
      public_projection_enabled = false,
      allow_exact_amount = false,
      privacy_policy_version = null,
      terms_version = null,
      quote_link_retention_policy_code = null,
      scanner_provider = null,
      safe_preview_pipeline = null,
      approved_at = null,
      approved_by = null,
      updated_at = now()
  where config_key = 'provider_contribution_quote_v2';
end;
$qa041$;

commit;

select
  'QA-041_SQL_ROLE_E2E_PASS' as result,
  (select count(*) from public.taran_submission_cases_v2
    where policy_version like 'qa-041-%') as synthetic_submissions_before_cleanup,
  (select count(*) from public.taran_deletion_jobs_v2 job
    join public.taran_submission_cases_v2 submission
      on submission.id = job.submission_case_id
    where submission.policy_version like 'qa-041-%'
      and job.state = 'completed') as completed_v2_jobs,
  not contribution_enabled as contribution_false,
  not evidence_upload_enabled as evidence_false,
  not public_projection_enabled as projection_false,
  not allow_exact_amount as exact_false
from public.taran_quote_runtime_config_v2
where config_key = 'provider_contribution_quote_v2';
`.trim();

const cleanupSql = String.raw`
begin;
set local session_replication_role = replica;

with qa_submissions as (
  select id from public.taran_submission_cases_v2
  where policy_version like 'qa-041-%'
),
qa_quotes as (
  select id from public.taran_quote_cases_v2
  where submission_case_id in (select id from qa_submissions)
),
qa_reviews as (
  select id from public.taran_review_cases_v2
  where submission_case_id in (select id from qa_submissions)
)
delete from public.taran_quote_outbox_v2
where quote_case_id in (select id from qa_quotes);

delete from public.taran_audit_events_v2
where actor_user_id in (
  ${actorIds.map((id) => `'${id}'::uuid`).join(",\n  ")}
);

delete from public.taran_review_decisions_v2
where review_case_id in (
  select review_case.id
  from public.taran_review_cases_v2 review_case
  join public.taran_submission_cases_v2 submission
    on submission.id = review_case.submission_case_id
  where submission.policy_version like 'qa-041-%'
);

delete from public.taran_dispute_cases_v2
where quote_case_id in (
  select quote_case.id
  from public.taran_quote_cases_v2 quote_case
  join public.taran_submission_cases_v2 submission
    on submission.id = quote_case.submission_case_id
  where submission.policy_version like 'qa-041-%'
);

delete from public.taran_quote_outbox_v2
where quote_case_id in (
  select quote_case.id
  from public.taran_quote_cases_v2 quote_case
  join public.taran_submission_cases_v2 submission
    on submission.id = quote_case.submission_case_id
  where submission.policy_version like 'qa-041-%'
);
delete from public.taran_quote_access_grants_v2
where user_id in (
  ${actorIds.map((id) => `'${id}'::uuid`).join(",\n  ")}
);
delete from public.taran_quote_public_projections_v2
where provider_id like 'qa-041-%';
delete from public.taran_quote_line_items_v2
where quote_case_id in (
  select quote_case.id
  from public.taran_quote_cases_v2 quote_case
  join public.taran_submission_cases_v2 submission
    on submission.id = quote_case.submission_case_id
  where submission.policy_version like 'qa-041-%'
);
delete from public.taran_quote_prices_v2
where quote_case_id in (
  select quote_case.id
  from public.taran_quote_cases_v2 quote_case
  join public.taran_submission_cases_v2 submission
    on submission.id = quote_case.submission_case_id
  where submission.policy_version like 'qa-041-%'
);
delete from public.taran_legal_holds_v2
where quote_case_id in (
  select quote_case.id
  from public.taran_quote_cases_v2 quote_case
  join public.taran_submission_cases_v2 submission
    on submission.id = quote_case.submission_case_id
  where submission.policy_version like 'qa-041-%'
);
delete from public.taran_evidence_assets_v2
where object_key like 'qa-041/%'
   or owner_user_id in (
    ${actorIds.map((id) => `'${id}'::uuid`).join(",\n    ")}
  );
delete from public.taran_submission_fields_v2
where submission_case_id in (
  select id from public.taran_submission_cases_v2
  where policy_version like 'qa-041-%'
);
delete from public.taran_quote_cases_v2
where submission_case_id in (
  select id from public.taran_submission_cases_v2
  where policy_version like 'qa-041-%'
);
delete from public.taran_deletion_jobs_v2
where submission_case_id in (
    select id from public.taran_submission_cases_v2
    where policy_version like 'qa-041-%'
  )
  or account_deletion_request_id = '04100000-0000-4000-8000-000000000099';
delete from public.taran_review_cases_v2
where submission_case_id in (
  select id from public.taran_submission_cases_v2
  where policy_version like 'qa-041-%'
);
delete from public.taran_submission_cases_v2
where policy_version like 'qa-041-%';
delete from public.taran_provider_service_capabilities_v2
where provider_identity_id in (
  select id from public.taran_provider_identities_v2
  where provider_id like 'qa-041-%'
);
delete from public.taran_provider_identities_v2 where provider_id like 'qa-041-%';
delete from public.taran_provider_access_grants_v2
where provider_id like 'qa-041-%'
   or user_id in (
    ${actorIds.map((id) => `'${id}'::uuid`).join(",\n    ")}
  );
delete from public.taran_account_deletion_requests
where id = '04100000-0000-4000-8000-000000000099';
delete from public.taran_account_deletion_tombstones
where request_id = '04100000-0000-4000-8000-000000000099';
delete from public.taran_admin_profiles
where user_id in (
  ${actorIds.map((id) => `'${id}'::uuid`).join(",\n  ")}
);
delete from public.taran_providers where id like 'qa-041-%';
delete from auth.users
where id in (
  ${actorIds.map((id) => `'${id}'::uuid`).join(",\n  ")}
)
   or email like 'qa-041-%@example.invalid';

update public.taran_quote_runtime_config_v2
set contribution_enabled = false,
    evidence_upload_enabled = false,
    public_projection_enabled = false,
    allow_exact_amount = false,
    privacy_policy_version = null,
    terms_version = null,
    quote_link_retention_policy_code = null,
    scanner_provider = null,
    safe_preview_pipeline = null,
    approved_at = null,
    approved_by = null,
    updated_at = now()
where config_key = 'provider_contribution_quote_v2';

set local session_replication_role = origin;
commit;

${preflightSql}
`.trim();

export { preflightSql, scenarioSql, cleanupSql };

const cliProcess = globalThis.process;
if (Array.isArray(cliProcess?.argv)) {
  const modes = { preflight: preflightSql, scenario: scenarioSql, cleanup: cleanupSql };
  const mode = cliProcess.argv[2] ?? "preflight";

  if (!(mode in modes)) {
    console.error("Usage: node provider-contribution-quote-v2-supabase-e2e.mjs [preflight|scenario|cleanup]");
    cliProcess.exitCode = 2;
  } else {
    cliProcess.stdout.write(`${modes[mode]}\n`);
  }
}
