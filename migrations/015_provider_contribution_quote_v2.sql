-- BE-019: isolated provider contribution and historical quote v2 foundation.
-- Run after 014_account_deletion_tombstone.sql.
--
-- Safety posture:
--   * additive v2 objects only; legacy claims/contributions/points are untouched;
--   * browser roles cannot write base tables;
--   * evidence upload, contribution intake, and public projection default disabled;
--   * raw evidence and contributor identity never enter the public projection.

create table if not exists public.taran_quote_runtime_config_v2 (
  config_key text primary key check (config_key = 'provider_contribution_quote_v2'),
  contribution_enabled boolean not null default false,
  evidence_upload_enabled boolean not null default false,
  public_projection_enabled boolean not null default false,
  allow_exact_amount boolean not null default false,
  privacy_policy_version text,
  terms_version text,
  quote_link_retention_policy_code text,
  scanner_provider text,
  safe_preview_pipeline text,
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  check (
    not contribution_enabled
    or (
      privacy_policy_version is not null
      and terms_version is not null
      and quote_link_retention_policy_code is not null
    )
  ),
  check (
    not evidence_upload_enabled
    or (
      contribution_enabled
      and scanner_provider is not null
      and safe_preview_pipeline is not null
    )
  ),
  check (
    not public_projection_enabled
    or (contribution_enabled and approved_at is not null)
  )
);

insert into public.taran_quote_runtime_config_v2 (config_key)
values ('provider_contribution_quote_v2')
on conflict (config_key) do nothing;

create table if not exists public.taran_retention_policies_v2 (
  policy_code text primary key,
  subject_kind text not null,
  duration interval not null check (duration > interval '0 seconds'),
  absolute_max interval,
  legal_basis text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (absolute_max is null or absolute_max >= duration)
);

insert into public.taran_retention_policies_v2
  (policy_code, subject_kind, duration, absolute_max, legal_basis)
values
  ('temporary_upload_24h', 'temporary_upload', interval '24 hours', interval '24 hours', 'upload_processing'),
  ('raw_evidence_30d_90d_max', 'raw_evidence', interval '30 days', interval '90 days', 'review_and_withdrawal'),
  ('information_submission_180d', 'information_submission', interval '180 days', interval '365 days', 'submission_review'),
  ('quote_case_private_24m', 'quote_case_private', interval '24 months', interval '24 months', 'contributor_consent'),
  ('public_quote_24m', 'public_quote_projection', interval '24 months', interval '24 months', 'contributor_consent'),
  ('access_grant_180d_365d_max', 'quote_access_grant', interval '180 days', interval '365 days', 'contributor_benefit'),
  ('access_history_3y', 'access_history', interval '3 years', interval '3 years', 'dispute_and_security'),
  ('deletion_proof_1y', 'deletion_proof', interval '1 year', interval '1 year', 'deletion_accountability'),
  ('backup_30d', 'backup_copy', interval '30 days', interval '30 days', 'backup_rotation')
on conflict (policy_code) do nothing;

create table if not exists public.taran_submission_field_dictionary_v2 (
  field_code text primary key,
  value_kind text not null check (value_kind in ('text','integer','boolean','text_array','money')),
  allowed_sources text[] not null,
  public_eligible boolean not null default false,
  high_risk boolean not null default false,
  active boolean not null default true,
  check (cardinality(allowed_sources) > 0),
  check (allowed_sources <@ array['operator_seed','provider_revision','customer_proposal','customer_quote']::text[])
);

insert into public.taran_submission_field_dictionary_v2
  (field_code, value_kind, allowed_sources, public_eligible, high_risk)
values
  ('provider_name', 'text', array['operator_seed','provider_revision','customer_proposal'], true, false),
  ('road_address', 'text', array['operator_seed','provider_revision','customer_proposal'], true, false),
  ('phone', 'text', array['provider_revision','customer_proposal'], true, false),
  ('website_url', 'text', array['provider_revision','customer_proposal'], true, false),
  ('event_codes', 'text_array', array['operator_seed','provider_revision','customer_proposal'], true, false),
  ('capacity_min', 'integer', array['provider_revision','customer_proposal'], true, false),
  ('capacity_max', 'integer', array['provider_revision','customer_proposal'], true, false),
  ('parking_available', 'boolean', array['provider_revision','customer_proposal'], true, false),
  ('facility_note', 'text', array['provider_revision','customer_proposal'], true, false),
  ('price_note', 'text', array['provider_revision','customer_proposal'], false, true),
  ('quote_total', 'money', array['customer_quote'], false, true)
on conflict (field_code) do nothing;

create table if not exists public.taran_provider_identities_v2 (
  id uuid primary key default gen_random_uuid(),
  provider_id text not null unique references public.taran_providers(id) on delete restrict,
  identity_state text not null default 'candidate'
    check (identity_state in ('candidate','provider_submitted','business_confirmed','admin_confirmed','needs_refresh','suspended')),
  business_status_checked_at timestamptz,
  last_confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.taran_provider_service_capabilities_v2 (
  id uuid primary key default gen_random_uuid(),
  provider_identity_id uuid not null references public.taran_provider_identities_v2(id) on delete cascade,
  event_code text not null check (event_code in ('kids','parents','meeting','anniversary','other')),
  capability_state text not null default 'proposed'
    check (capability_state in ('proposed','confirmed','rejected','needs_refresh')),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider_identity_id, event_code)
);

create table if not exists public.taran_provider_access_grants_v2 (
  id uuid primary key default gen_random_uuid(),
  provider_id text not null references public.taran_providers(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null check (scope in ('submit_revision','view_cases','open_dispute')),
  state text not null default 'active' check (state in ('active','revoked','expired')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  issued_by uuid references auth.users(id) on delete set null,
  issued_at timestamptz not null default now(),
  revoked_at timestamptz,
  check (expires_at > starts_at),
  unique (provider_id, user_id, scope)
);

create table if not exists public.taran_submission_cases_v2 (
  id uuid primary key default gen_random_uuid(),
  source_kind text not null
    check (source_kind in ('operator_seed','provider_revision','customer_proposal','customer_quote')),
  provider_id text references public.taran_providers(id) on delete restrict,
  submitted_by uuid references auth.users(id) on delete set null,
  event_code text check (event_code is null or event_code in ('kids','parents','meeting','anniversary','other')),
  state text not null default 'submitted'
    check (state in (
      'submitted','under_review','approved','rejected','withdrawn','disputed',
      'supplement_requested','hold_privacy','hold_rights','hold_identity',
      'legal_hold','ineligible','partial_failure','deletion_pending','deleted'
    )),
  policy_version text not null,
  retention_policy_code text not null references public.taran_retention_policies_v2(policy_code),
  submitted_at timestamptz not null default now(),
  decided_at timestamptz,
  withdrawn_at timestamptz,
  deleted_at timestamptz
);

create table if not exists public.taran_submission_fields_v2 (
  id uuid primary key default gen_random_uuid(),
  submission_case_id uuid not null references public.taran_submission_cases_v2(id) on delete cascade,
  field_code text not null references public.taran_submission_field_dictionary_v2(field_code),
  value_json jsonb not null,
  created_at timestamptz not null default now(),
  unique (submission_case_id, field_code)
);

create table if not exists public.taran_field_assertions_v2 (
  id uuid primary key default gen_random_uuid(),
  submission_field_id uuid not null unique references public.taran_submission_fields_v2(id) on delete cascade,
  assertion_state text not null default 'pending'
    check (assertion_state in ('pending','verified','rejected','superseded','withdrawn')),
  confidence_code text not null default 'unreviewed'
    check (confidence_code in ('unreviewed','source_only','provider_submitted','business_confirmed','admin_confirmed')),
  reviewed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.taran_evidence_assets_v2 (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete set null,
  submission_case_id uuid references public.taran_submission_cases_v2(id) on delete restrict,
  object_key text not null unique
    check (length(object_key) between 1 and 512 and object_key !~ '(^|/)\.\.(/|$)'),
  content_hmac_hex text not null check (content_hmac_hex ~ '^[0-9a-f]{64}$'),
  hmac_key_version text not null check (length(hmac_key_version) between 1 and 100),
  byte_size bigint not null check (byte_size > 0 and byte_size <= 15728640),
  declared_mime text not null,
  detected_mime text,
  scan_state text not null default 'quarantined'
    check (scan_state in ('quarantined','clean','malicious','scan_failed','format_rejected','deleted')),
  safe_preview_state text not null default 'pending'
    check (safe_preview_state in ('pending','ready','failed','deleted')),
  privacy_state text not null default 'pending'
    check (privacy_state in ('pending','clear','hold','deleted')),
  rights_state text not null default 'pending'
    check (rights_state in ('pending','clear','hold','deleted')),
  review_allowed boolean not null default false,
  retention_policy_code text not null default 'temporary_upload_24h'
    references public.taran_retention_policies_v2(policy_code),
  delete_after timestamptz not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (delete_after <= created_at + interval '90 days'),
  check (
    not review_allowed
    or (
      scan_state = 'clean'
      and safe_preview_state = 'ready'
      and privacy_state = 'clear'
      and rights_state = 'clear'
    )
  )
);

create table if not exists public.taran_review_cases_v2 (
  id uuid primary key default gen_random_uuid(),
  submission_case_id uuid not null unique references public.taran_submission_cases_v2(id) on delete restrict,
  state text not null default 'open' check (state in ('open','assigned','approved','rejected','cancelled')),
  risk_level text not null default 'standard' check (risk_level in ('standard','high')),
  required_review_count smallint not null default 1 check (required_review_count in (1,2)),
  assigned_reviewer uuid references auth.users(id) on delete set null,
  assigned_at timestamptz,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table if not exists public.taran_review_decisions_v2 (
  id uuid primary key default gen_random_uuid(),
  review_case_id uuid not null references public.taran_review_cases_v2(id) on delete restrict,
  idempotency_key uuid not null unique,
  decision text not null check (decision in ('approved','rejected')),
  reason_code text not null,
  reviewer_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (review_case_id, reviewer_id)
);

create table if not exists public.taran_quote_cases_v2 (
  id uuid primary key default gen_random_uuid(),
  submission_case_id uuid not null unique references public.taran_submission_cases_v2(id) on delete restrict,
  provider_id text references public.taran_providers(id) on delete restrict,
  contributor_user_id uuid references auth.users(id) on delete set null,
  event_code text not null check (event_code in ('kids','parents','meeting','anniversary','other')),
  quote_kind text not null check (quote_kind in ('estimate_received','contracted','completed')),
  occurred_on date not null,
  verification_state text not null default 'pending'
    check (verification_state in (
      'pending','approved','rejected','withdrawn','disputed',
      'supplement_requested','hold_privacy','hold_rights','hold_identity',
      'legal_hold','ineligible','partial_failure','deleted'
    )),
  duplicate_state text not null default 'unchecked'
    check (duplicate_state in ('unchecked','unique','duplicate','suspected')),
  provider_match_state text not null default 'pending'
    check (provider_match_state in ('pending','matched','ambiguous','unmatched')),
  fingerprint_hmac text check (fingerprint_hmac is null or fingerprint_hmac ~ '^[0-9a-f]{64}$'),
  fingerprint_key_version text,
  reward_eligible boolean not null default false,
  created_at timestamptz not null default now(),
  verified_at timestamptz
);

create table if not exists public.taran_quote_prices_v2 (
  id uuid primary key default gen_random_uuid(),
  quote_case_id uuid not null unique references public.taran_quote_cases_v2(id) on delete cascade,
  currency text not null default 'KRW' check (currency = 'KRW'),
  exact_amount bigint not null check (exact_amount > 0 and exact_amount <= 1000000000),
  tax_included boolean,
  created_at timestamptz not null default now()
);

create table if not exists public.taran_quote_line_items_v2 (
  id uuid primary key default gen_random_uuid(),
  quote_case_id uuid not null references public.taran_quote_cases_v2(id) on delete cascade,
  item_code text not null,
  amount bigint check (amount is null or (amount >= 0 and amount <= 1000000000)),
  included boolean,
  display_order smallint not null default 0 check (display_order >= 0),
  unique (quote_case_id, item_code)
);

create table if not exists public.taran_quote_public_projections_v2 (
  id uuid primary key default gen_random_uuid(),
  quote_case_id uuid not null unique references public.taran_quote_cases_v2(id) on delete restrict,
  provider_id text not null references public.taran_providers(id) on delete restrict,
  event_code text not null check (event_code in ('kids','parents','meeting','anniversary','other')),
  quote_kind text not null check (quote_kind in ('estimate_received','contracted','completed')),
  source_label text not null default '이용자 제공 과거 견적 사례'
    check (source_label = '이용자 제공 과거 견적 사례'),
  display_mode text not null check (display_mode in ('exact','rounded_100k','range','hidden')),
  amount_low bigint,
  amount_high bigint,
  occurred_month date not null,
  publication_state text not null default 'published'
    check (publication_state in ('published','hidden','withdrawn','expired','deleted')),
  blocked boolean not null default false,
  published_at timestamptz not null default now(),
  public_until timestamptz not null,
  last_confirmed_at timestamptz not null default now(),
  check (date_trunc('month', occurred_month)::date = occurred_month),
  check (
    (display_mode = 'hidden' and amount_low is null and amount_high is null)
    or
    (display_mode <> 'hidden' and amount_low is not null and amount_high is not null and amount_low <= amount_high)
  )
);

create table if not exists public.taran_quote_access_grants_v2 (
  id uuid primary key default gen_random_uuid(),
  quote_case_id uuid unique references public.taran_quote_cases_v2(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  grant_state text not null default 'active' check (grant_state in ('active','revoked','expired')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  retention_policy_code text not null default 'access_grant_180d_365d_max'
    references public.taran_retention_policies_v2(policy_code),
  revoked_at timestamptz,
  revoke_reason text,
  created_at timestamptz not null default now(),
  check (expires_at > starts_at),
  check (expires_at <= starts_at + interval '365 days')
);

create table if not exists public.taran_dispute_cases_v2 (
  id uuid primary key default gen_random_uuid(),
  quote_case_id uuid not null references public.taran_quote_cases_v2(id) on delete restrict,
  opened_by uuid references auth.users(id) on delete set null,
  reason_code text not null check (reason_code in ('incorrect','duplicate','malicious','rights_request','confidential','other')),
  requested_action text not null check (requested_action in ('correct','hide','delete','revoke_grant')),
  state text not null default 'open' check (state in ('open','under_review','resolved','rejected')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.taran_legal_holds_v2 (
  id uuid primary key default gen_random_uuid(),
  quote_case_id uuid references public.taran_quote_cases_v2(id) on delete set null,
  basis_code text not null,
  scope_note text not null,
  approved_by uuid references auth.users(id) on delete set null,
  review_at timestamptz not null,
  state text not null default 'active' check (state in ('active','released','expired')),
  created_at timestamptz not null default now(),
  released_at timestamptz,
  release_reason text,
  check (length(basis_code) between 1 and 100),
  check (length(scope_note) between 1 and 500)
);

create table if not exists public.taran_deletion_jobs_v2 (
  id uuid primary key default gen_random_uuid(),
  submission_case_id uuid references public.taran_submission_cases_v2(id) on delete restrict,
  evidence_asset_id uuid references public.taran_evidence_assets_v2(id) on delete set null,
  account_deletion_request_id uuid
    references public.taran_account_deletion_requests(id) on delete set null,
  reason_code text not null,
  state text not null default 'queued'
    check (state in ('queued','running','retry','partial_failure','blocked','completed')),
  required_targets text[] not null
    default array[
      'database_private','storage_original','storage_preview','ocr_derivative',
      'cache_manifest','queue_payload','export_copy','backup_expiry','restore_tombstone'
    ],
  completed_targets text[] not null default '{}'::text[],
  failed_targets text[] not null default '{}'::text[],
  not_before timestamptz not null default now(),
  attempts integer not null default 0 check (attempts >= 0),
  last_error_code text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  check (cardinality(required_targets) > 0),
  check (not (completed_targets && failed_targets)),
  check (
    state = 'completed'
    or ((submission_case_id is null) <> (evidence_asset_id is null))
  ),
  unique (submission_case_id),
  unique (evidence_asset_id)
);

create table if not exists public.taran_audit_events_v2 (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  event_code text not null,
  outcome_code text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.taran_quote_outbox_v2 (
  id uuid primary key default gen_random_uuid(),
  quote_case_id uuid not null references public.taran_quote_cases_v2(id) on delete restrict,
  event_code text not null check (event_code in ('quote_approved','quote_hidden','deletion_requested')),
  state text not null default 'pending' check (state in ('pending','processing','sent','failed')),
  available_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (quote_case_id, event_code)
);

create index if not exists taran_submission_cases_v2_submitter_idx
  on public.taran_submission_cases_v2(submitted_by, submitted_at desc);
create index if not exists taran_review_cases_v2_queue_idx
  on public.taran_review_cases_v2(state, risk_level, created_at);
create index if not exists taran_quote_public_v2_provider_idx
  on public.taran_quote_public_projections_v2(provider_id, event_code, published_at desc);
create index if not exists taran_deletion_jobs_v2_queue_idx
  on public.taran_deletion_jobs_v2(state, not_before);
create unique index if not exists taran_dispute_cases_v2_one_open_idx
  on public.taran_dispute_cases_v2(quote_case_id)
  where state in ('open','under_review');
create unique index if not exists taran_legal_holds_v2_one_active_idx
  on public.taran_legal_holds_v2(quote_case_id)
  where state = 'active' and quote_case_id is not null;
-- The database, not an operator checkbox, is the final concurrency barrier:
-- the same versioned HMAC fingerprint can never be classified as unique twice.
create unique index if not exists taran_quote_cases_v2_unique_fingerprint_idx
  on public.taran_quote_cases_v2(fingerprint_key_version, fingerprint_hmac)
  where duplicate_state = 'unique'
    and fingerprint_key_version is not null
    and fingerprint_hmac is not null;

-- Migration 014's Auth-independent tombstone remains the write barrier for v2.
-- This dedicated trigger allows only FK-driven identity unlinking (old UUID to
-- NULL with every other column unchanged) and DELETE cleanup.
create or replace function public.taran_guard_account_deletion_v2_user_write()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
set row_security = off
as $$
declare
  v_subject_column text := tg_argv[0];
  v_old jsonb;
  v_new jsonb;
  v_old_user uuid;
  v_new_user uuid;
begin
  if tg_op <> 'INSERT' then
    v_old := to_jsonb(old);
    v_old_user := public.taran_account_deletion_parse_uuid(v_old->>v_subject_column);
  end if;
  if tg_op <> 'DELETE' then
    v_new := to_jsonb(new);
    v_new_user := public.taran_account_deletion_parse_uuid(v_new->>v_subject_column);
  end if;

  if not public.taran_account_deletion_is_active(v_old_user)
     and not public.taran_account_deletion_is_active(v_new_user) then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if tg_op = 'DELETE' then return old; end if;
  if tg_op = 'UPDATE'
     and v_old_user is not null
     and v_new_user is null
     and (v_new - v_subject_column) = (v_old - v_subject_column) then
    return new;
  end if;

  raise exception 'v2 writes are disabled while account deletion is active.'
    using errcode = '42501';
end;
$$;

do $$
declare
  v_guard record;
begin
  for v_guard in
    select * from (values
      ('taran_provider_access_grants_v2', 'user_id'),
      ('taran_provider_access_grants_v2', 'issued_by'),
      ('taran_submission_cases_v2', 'submitted_by'),
      ('taran_evidence_assets_v2', 'owner_user_id'),
      ('taran_review_cases_v2', 'assigned_reviewer'),
      ('taran_review_decisions_v2', 'reviewer_id'),
      ('taran_quote_cases_v2', 'contributor_user_id'),
      ('taran_quote_access_grants_v2', 'user_id'),
      ('taran_dispute_cases_v2', 'opened_by'),
      ('taran_legal_holds_v2', 'approved_by'),
      ('taran_audit_events_v2', 'actor_user_id')
    ) guards(table_name, column_name)
  loop
    execute format(
      'drop trigger if exists %I on public.%I',
      'taran_v2_del_guard_' || substr(md5(v_guard.table_name || ':' || v_guard.column_name), 1, 16),
      v_guard.table_name
    );
    execute format(
      'create trigger %I before insert or update or delete on public.%I '
      || 'for each row execute function public.taran_guard_account_deletion_v2_user_write(%L)',
      'taran_v2_del_guard_' || substr(md5(v_guard.table_name || ':' || v_guard.column_name), 1, 16),
      v_guard.table_name,
      v_guard.column_name
    );
  end loop;
end $$;

-- Queue every v2 private subject when migration 014 creates or refreshes an
-- account-deletion request. Public access is blocked immediately. An
-- evidence-only job covers quarantined uploads that are not yet attached to a
-- submission case.
create or replace function public.taran_queue_account_deletion_v2()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
set row_security = off
as $$
declare
  v_user uuid;
begin
  select coalesce(new.user_id, tombstone.user_id) into v_user
  from public.taran_account_deletion_tombstones tombstone
  where tombstone.request_id = new.id;
  v_user := coalesce(v_user, new.user_id);
  if v_user is null then return new; end if;

  insert into public.taran_deletion_jobs_v2 (
    submission_case_id, account_deletion_request_id, reason_code
  )
  select submission.id, new.id, 'account_deletion'
  from public.taran_submission_cases_v2 submission
  where submission.submitted_by = v_user
  on conflict (submission_case_id) do update
    set account_deletion_request_id = excluded.account_deletion_request_id,
        reason_code = 'account_deletion';

  insert into public.taran_deletion_jobs_v2 (
    evidence_asset_id, account_deletion_request_id, reason_code,
    required_targets
  )
  select
    evidence.id, new.id, 'account_deletion',
    array[
      'storage_original','storage_preview','ocr_derivative','cache_manifest',
      'queue_payload','export_copy','backup_expiry','restore_tombstone'
    ]
  from public.taran_evidence_assets_v2 evidence
  where evidence.owner_user_id = v_user
    and evidence.submission_case_id is null
  on conflict (evidence_asset_id) do update
    set account_deletion_request_id = excluded.account_deletion_request_id,
        reason_code = 'account_deletion';

  update public.taran_quote_public_projections_v2 projection
  set blocked = true,
      publication_state = case
        when publication_state = 'published' then 'hidden'
        else publication_state
      end
  from public.taran_quote_cases_v2 quote_case
  where projection.quote_case_id = quote_case.id
    and quote_case.contributor_user_id = v_user;

  return new;
end;
$$;

drop trigger if exists taran_queue_account_deletion_v2
  on public.taran_account_deletion_requests;
create trigger taran_queue_account_deletion_v2
after insert or update of requested_at, status, user_id
on public.taran_account_deletion_requests
for each row execute function public.taran_queue_account_deletion_v2();

-- Migration 014 cannot report completion while any linked v2 deletion target
-- remains queued, running, retrying, or blocked.
create or replace function public.taran_require_account_deletion_v2_complete()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
set row_security = off
as $$
begin
  if new.status = 'completed'
     and old.status is distinct from 'completed'
     and exists (
       select 1
       from public.taran_deletion_jobs_v2 deletion_job
       where deletion_job.account_deletion_request_id = new.id
         and deletion_job.state <> 'completed'
     ) then
    raise exception 'v2 deletion targets must complete before account deletion.'
      using errcode = '55000';
  end if;
  return new;
end;
$$;

drop trigger if exists taran_require_account_deletion_v2_complete
  on public.taran_account_deletion_requests;
create trigger taran_require_account_deletion_v2_complete
before update of status on public.taran_account_deletion_requests
for each row execute function public.taran_require_account_deletion_v2_complete();

-- Decisions and audit records are append-only even for table owners using
-- normal DML. The only permitted UPDATE is the exact auth FK SET NULL caused
-- by an active account-deletion workflow; all evidentiary history remains
-- byte-for-byte unchanged.
create or replace function public.taran_reject_v2_history_mutation()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
declare
  v_subject_column text := tg_argv[0];
  v_old jsonb;
  v_new jsonb;
  v_old_user uuid;
begin
  if tg_op = 'UPDATE' and v_subject_column is not null then
    v_old := to_jsonb(old);
    v_new := to_jsonb(new);
    v_old_user :=
      public.taran_account_deletion_parse_uuid(v_old->>v_subject_column);
    if v_old_user is not null
       and (v_new->>v_subject_column) is null
       and (v_new - v_subject_column) = (v_old - v_subject_column)
       and public.taran_account_deletion_is_active(v_old_user) then
      return new;
    end if;
  end if;
  raise exception 'v2 history records are append-only.' using errcode = '42501';
end;
$$;

drop trigger if exists taran_review_decisions_v2_append_only on public.taran_review_decisions_v2;
create trigger taran_review_decisions_v2_append_only
before update or delete on public.taran_review_decisions_v2
for each row execute function public.taran_reject_v2_history_mutation('reviewer_id');

drop trigger if exists taran_audit_events_v2_append_only on public.taran_audit_events_v2;
create trigger taran_audit_events_v2_append_only
before update or delete on public.taran_audit_events_v2
for each row execute function public.taran_reject_v2_history_mutation('actor_user_id');

-- All private tables are RLS-enabled and have no browser DML grants.
do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'taran_quote_runtime_config_v2',
    'taran_retention_policies_v2',
    'taran_submission_field_dictionary_v2',
    'taran_provider_identities_v2',
    'taran_provider_service_capabilities_v2',
    'taran_provider_access_grants_v2',
    'taran_submission_cases_v2',
    'taran_submission_fields_v2',
    'taran_field_assertions_v2',
    'taran_evidence_assets_v2',
    'taran_review_cases_v2',
    'taran_review_decisions_v2',
    'taran_quote_cases_v2',
    'taran_quote_prices_v2',
    'taran_quote_line_items_v2',
    'taran_quote_public_projections_v2',
    'taran_quote_access_grants_v2',
    'taran_dispute_cases_v2',
    'taran_legal_holds_v2',
    'taran_deletion_jobs_v2',
    'taran_audit_events_v2',
    'taran_quote_outbox_v2'
  ]
  loop
    execute format('alter table public.%I enable row level security', v_table);
    execute format('revoke all on table public.%I from public, anon, authenticated', v_table);
  end loop;
end $$;

create or replace function public.taran_quote_public_enabled_v2()
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
set row_security = off
as $$
  select coalesce((
    select runtime.public_projection_enabled
    from public.taran_quote_runtime_config_v2 runtime
    where runtime.config_key = 'provider_contribution_quote_v2'
  ), false);
$$;

create or replace function public.taran_is_aal2_v2()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_catalog
as $$
  select coalesce(auth.jwt()->>'aal', '') = 'aal2';
$$;

drop policy if exists "public reads current quote projections v2"
  on public.taran_quote_public_projections_v2;
create policy "public reads current quote projections v2"
on public.taran_quote_public_projections_v2
for select
to anon, authenticated
using (
  publication_state = 'published'
  and blocked = false
  and public_until > now()
  and public.taran_quote_public_enabled_v2()
);

create or replace function public.taran_list_quote_public_v2(
  p_provider_id text default null,
  p_event_code text default null,
  p_limit integer default 20
)
returns table (
  projection_id uuid,
  provider_id text,
  event_code text,
  quote_kind text,
  source_label text,
  display_mode text,
  amount_low bigint,
  amount_high bigint,
  occurred_month date,
  last_confirmed_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, pg_catalog
set row_security = off
as $$
begin
  if not public.taran_quote_public_enabled_v2() then
    return;
  end if;
  if p_event_code is not null
     and p_event_code not in ('kids','parents','meeting','anniversary','other') then
    raise exception 'Invalid canonical event code.' using errcode = '22023';
  end if;
  if p_limit < 1 or p_limit > 50 then
    raise exception 'Public quote result limit must be between 1 and 50.' using errcode = '22023';
  end if;

  return query
  select
    projection.id,
    projection.provider_id,
    projection.event_code,
    projection.quote_kind,
    projection.source_label,
    projection.display_mode,
    projection.amount_low,
    projection.amount_high,
    projection.occurred_month,
    projection.last_confirmed_at
  from public.taran_quote_public_projections_v2 projection
  where projection.publication_state = 'published'
    and not projection.blocked
    and projection.public_until > now()
    and (p_provider_id is null or projection.provider_id = p_provider_id)
    and (p_event_code is null or projection.event_code = p_event_code)
  order by projection.occurred_month desc, projection.published_at desc
  limit p_limit;
end;
$$;

-- Only a service process may register quarantined evidence metadata. This
-- migration intentionally creates no Storage bucket or Storage policy.
create or replace function public.taran_register_evidence_metadata_v2(
  p_owner_user_id uuid,
  p_object_key text,
  p_content_hmac_hex text,
  p_hmac_key_version text,
  p_byte_size bigint,
  p_declared_mime text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_catalog
set row_security = off
as $$
declare
  v_id uuid;
  v_config public.taran_quote_runtime_config_v2;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Evidence metadata registration is server-only.' using errcode = '42501';
  end if;

  select * into v_config
  from public.taran_quote_runtime_config_v2
  where config_key = 'provider_contribution_quote_v2';

  if not coalesce(v_config.contribution_enabled, false)
     or not coalesce(v_config.evidence_upload_enabled, false) then
    raise exception 'Evidence intake is disabled.' using errcode = '55000';
  end if;

  if p_owner_user_id is null or nullif(btrim(p_object_key), '') is null then
    raise exception 'Evidence owner and opaque object key are required.' using errcode = '22023';
  end if;
  if p_content_hmac_hex !~ '^[0-9a-fA-F]{64}$'
     or nullif(btrim(p_hmac_key_version), '') is null then
    raise exception 'Versioned evidence HMAC is required.' using errcode = '22023';
  end if;
  if lower(p_declared_mime) not in (
    'application/pdf','image/jpeg','image/png','image/webp'
  ) then
    raise exception 'Evidence MIME type is not allowed.' using errcode = '22023';
  end if;

  insert into public.taran_evidence_assets_v2 (
    owner_user_id, object_key, content_hmac_hex, hmac_key_version,
    byte_size, declared_mime, delete_after
  )
  values (
    p_owner_user_id, p_object_key, lower(p_content_hmac_hex),
    p_hmac_key_version, p_byte_size,
    lower(p_declared_mime), now() + interval '24 hours'
  )
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.taran_record_evidence_scan_v2(
  p_evidence_id uuid,
  p_scan_state text,
  p_detected_mime text,
  p_safe_preview_state text,
  p_privacy_state text,
  p_rights_state text
)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
set row_security = off
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Evidence scan recording is server-only.' using errcode = '42501';
  end if;

  if p_scan_state not in ('clean','malicious','scan_failed')
     or p_safe_preview_state not in ('ready','failed')
     or p_privacy_state not in ('clear','hold')
     or p_rights_state not in ('clear','hold') then
    raise exception 'Invalid evidence scan result.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.taran_evidence_assets_v2 evidence
    where evidence.id = p_evidence_id
      and evidence.scan_state = 'quarantined'
      and (
        lower(p_detected_mime) <> evidence.declared_mime
        or lower(p_detected_mime) not in (
          'application/pdf','image/jpeg','image/png','image/webp'
        )
      )
  ) then
    update public.taran_evidence_assets_v2
    set scan_state = 'format_rejected',
        detected_mime = lower(p_detected_mime),
        safe_preview_state = 'failed',
        privacy_state = p_privacy_state,
        rights_state = p_rights_state,
        review_allowed = false
    where id = p_evidence_id and scan_state = 'quarantined';
    return;
  end if;

  update public.taran_evidence_assets_v2
  set scan_state = p_scan_state,
      detected_mime = lower(p_detected_mime),
      safe_preview_state = p_safe_preview_state,
      privacy_state = p_privacy_state,
      rights_state = p_rights_state,
      review_allowed = (
        p_scan_state = 'clean'
        and p_safe_preview_state = 'ready'
        and p_privacy_state = 'clear'
        and p_rights_state = 'clear'
      )
  where id = p_evidence_id and scan_state = 'quarantined';

  if not found then
    raise exception 'Evidence is missing or already scanned.' using errcode = '22023';
  end if;
end;
$$;

create or replace function public.taran_issue_provider_access_v2(
  p_provider_id text,
  p_user_id uuid,
  p_scope text,
  p_expires_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_catalog
set row_security = off
as $$
declare
  v_id uuid;
begin
  if not public.taran_is_admin()
     or not public.taran_is_aal2_v2()
     or public.taran_account_deletion_self_is_active() then
    raise exception 'Provider access issuance requires an operations role.' using errcode = '42501';
  end if;
  if p_scope not in ('submit_revision','view_cases','open_dispute')
     or p_expires_at <= now()
     or p_expires_at > now() + interval '1 year' then
    raise exception 'Invalid provider access scope or expiry.' using errcode = '22023';
  end if;

  insert into public.taran_provider_access_grants_v2 (
    provider_id, user_id, scope, expires_at, issued_by
  )
  values (p_provider_id, p_user_id, p_scope, p_expires_at, auth.uid())
  on conflict (provider_id, user_id, scope) do update
    set state = 'active',
        starts_at = now(),
        expires_at = excluded.expires_at,
        issued_by = auth.uid(),
        issued_at = now(),
        revoked_at = null
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.taran_submit_information_v2(
  p_source_kind text,
  p_provider_id text,
  p_event_code text,
  p_fields jsonb,
  p_policy_version text,
  p_retention_policy_code text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_catalog
set row_security = off
as $$
declare
  v_case_id uuid;
  v_key text;
  v_value jsonb;
  v_kind text;
  v_config public.taran_quote_runtime_config_v2;
begin
  if auth.uid() is null or public.taran_account_deletion_self_is_active() then
    raise exception 'Sign-in is required.' using errcode = '42501';
  end if;
  if p_source_kind not in ('operator_seed','provider_revision','customer_proposal') then
    raise exception 'This endpoint accepts operator seeds, provider revisions, or customer proposals only.'
      using errcode = '22023';
  end if;
  if p_source_kind = 'operator_seed'
     and (not public.taran_is_admin() or not public.taran_is_aal2_v2()) then
    raise exception 'Operator seed submission requires an operations role.'
      using errcode = '42501';
  end if;
  if p_event_code is not null
     and p_event_code not in ('kids','parents','meeting','anniversary','other') then
    raise exception 'Invalid canonical event code.' using errcode = '22023';
  end if;
  if jsonb_typeof(p_fields) <> 'object'
     or p_fields = '{}'::jsonb
     or jsonb_object_length(p_fields) > 20 then
    raise exception 'At least one structured field is required.' using errcode = '22023';
  end if;
  if nullif(btrim(p_policy_version), '') is null then
    raise exception 'A policy version is required.' using errcode = '22023';
  end if;
  if not exists (
    select 1
    from public.taran_retention_policies_v2 retention
    where retention.policy_code = p_retention_policy_code
      and retention.subject_kind = 'information_submission'
      and retention.active
  ) then
    raise exception 'An active information-submission retention policy is required.'
      using errcode = '22023';
  end if;

  select * into v_config
  from public.taran_quote_runtime_config_v2
  where config_key = 'provider_contribution_quote_v2';
  if not coalesce(v_config.contribution_enabled, false)
     or p_policy_version <> v_config.privacy_policy_version then
    raise exception 'Information contribution is disabled or the policy version is stale.'
      using errcode = '55000';
  end if;

  if p_source_kind = 'provider_revision' and not exists (
    select 1
    from public.taran_provider_access_grants_v2 grant_row
    where grant_row.provider_id = p_provider_id
      and grant_row.user_id = auth.uid()
      and grant_row.scope = 'submit_revision'
      and grant_row.state = 'active'
      and grant_row.starts_at <= now()
      and grant_row.expires_at > now()
  ) then
    raise exception 'Active provider revision access is required.' using errcode = '42501';
  end if;

  insert into public.taran_submission_cases_v2 (
    source_kind, provider_id, submitted_by, event_code, policy_version, retention_policy_code
  )
  values (
    p_source_kind, p_provider_id, auth.uid(), p_event_code,
    p_policy_version, p_retention_policy_code
  )
  returning id into v_case_id;

  for v_key, v_value in select key, value from jsonb_each(p_fields)
  loop
    select dictionary.value_kind into v_kind
    from public.taran_submission_field_dictionary_v2 dictionary
    where dictionary.field_code = v_key
      and dictionary.active
      and p_source_kind = any(dictionary.allowed_sources);

    if v_kind is null then
      raise exception 'Unknown or disallowed field: %', v_key using errcode = '22023';
    end if;
    if (v_kind = 'text' and jsonb_typeof(v_value) <> 'string')
       or (v_kind in ('integer','money') and jsonb_typeof(v_value) <> 'number')
       or (v_kind = 'boolean' and jsonb_typeof(v_value) <> 'boolean')
       or (v_kind = 'text_array' and jsonb_typeof(v_value) <> 'array') then
      raise exception 'Invalid value type for field: %', v_key using errcode = '22023';
    end if;
    if v_kind = 'text' and length(v_value #>> '{}') > 1000 then
      raise exception 'Text value exceeds the field limit: %', v_key using errcode = '22023';
    end if;
    if v_kind in ('integer','money')
       and ((v_value #>> '{}')::numeric < 0 or (v_value #>> '{}')::numeric > 1000000000) then
      raise exception 'Numeric value is outside the allowed range: %', v_key using errcode = '22023';
    end if;
    if v_key = 'event_codes' and exists (
      select 1
      from jsonb_array_elements_text(v_value) event_value
      where event_value not in ('kids','parents','meeting','anniversary','other')
    ) then
      raise exception 'Event aliases are read-only; canonical event codes are required.'
        using errcode = '22023';
    end if;

    insert into public.taran_submission_fields_v2 (submission_case_id, field_code, value_json)
    values (v_case_id, v_key, v_value);
  end loop;

  insert into public.taran_field_assertions_v2 (submission_field_id)
  select id from public.taran_submission_fields_v2 where submission_case_id = v_case_id;

  insert into public.taran_review_cases_v2 (
    submission_case_id, risk_level, required_review_count
  )
  select
    v_case_id,
    case when exists (
      select 1
      from public.taran_submission_fields_v2 field_row
      join public.taran_submission_field_dictionary_v2 dictionary
        on dictionary.field_code = field_row.field_code
      where field_row.submission_case_id = v_case_id and dictionary.high_risk
    ) then 'high' else 'standard' end,
    case when exists (
      select 1
      from public.taran_submission_fields_v2 field_row
      join public.taran_submission_field_dictionary_v2 dictionary
        on dictionary.field_code = field_row.field_code
      where field_row.submission_case_id = v_case_id and dictionary.high_risk
    ) then 2 else 1 end;

  insert into public.taran_audit_events_v2 (
    actor_user_id, entity_type, entity_id, event_code, outcome_code
  )
  values (auth.uid(), 'submission_case', v_case_id, 'submission_created', 'accepted');

  return v_case_id;
end;
$$;

create or replace function public.taran_decide_information_v2(
  p_review_case_id uuid,
  p_idempotency_key uuid,
  p_decision text,
  p_reason_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
set row_security = off
as $$
declare
  v_review public.taran_review_cases_v2;
  v_submission public.taran_submission_cases_v2;
  v_approved_review_count integer;
begin
  if not public.taran_is_admin()
     or not public.taran_is_aal2_v2()
     or public.taran_account_deletion_self_is_active() then
    raise exception 'Information review requires an operations role.' using errcode = '42501';
  end if;
  if p_decision not in ('approved','rejected')
     or nullif(btrim(p_reason_code), '') is null then
    raise exception 'A valid decision and reason are required.' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.taran_review_decisions_v2
    where idempotency_key = p_idempotency_key
      and review_case_id = p_review_case_id
  ) then
    return jsonb_build_object('status', 'idempotent_replay');
  end if;

  select * into v_review
  from public.taran_review_cases_v2
  where id = p_review_case_id
  for update;
  if not found or v_review.state <> 'assigned' or v_review.assigned_reviewer <> auth.uid() then
    raise exception 'The review is not assigned to the current reviewer.' using errcode = '42501';
  end if;

  select * into v_submission
  from public.taran_submission_cases_v2
  where id = v_review.submission_case_id
  for update;
  if v_submission.source_kind = 'customer_quote' then
    raise exception 'Quote cases require the quote decision command.' using errcode = '22023';
  end if;
  if v_submission.submitted_by = auth.uid() then
    raise exception 'Self-review is prohibited.' using errcode = '42501';
  end if;

  insert into public.taran_review_decisions_v2 (
    review_case_id, idempotency_key, decision, reason_code, reviewer_id
  )
  values (v_review.id, p_idempotency_key, p_decision, p_reason_code, auth.uid());

  if p_decision = 'rejected' then
    update public.taran_field_assertions_v2 assertion_row
    set assertion_state = 'rejected', reviewed_at = now()
    from public.taran_submission_fields_v2 field_row
    where field_row.submission_case_id = v_submission.id
      and assertion_row.submission_field_id = field_row.id;
    update public.taran_review_cases_v2 set state = 'rejected', decided_at = now() where id = v_review.id;
    update public.taran_submission_cases_v2 set state = 'rejected', decided_at = now() where id = v_submission.id;
    return jsonb_build_object('status', 'rejected');
  end if;

  select count(*) into v_approved_review_count
  from public.taran_review_decisions_v2 decision_row
  where decision_row.review_case_id = v_review.id
    and decision_row.decision = 'approved';
  if v_approved_review_count < v_review.required_review_count then
    update public.taran_review_cases_v2
    set state = 'open', assigned_reviewer = null, assigned_at = null
    where id = v_review.id;
    return jsonb_build_object(
      'status', 'pending_independent_review',
      'completed_reviews', v_approved_review_count,
      'required_reviews', v_review.required_review_count
    );
  end if;

  update public.taran_field_assertions_v2 assertion_row
  set assertion_state = 'verified',
      confidence_code = 'admin_confirmed',
      reviewed_at = now(),
      expires_at = now() + interval '180 days'
  from public.taran_submission_fields_v2 field_row
  where field_row.submission_case_id = v_submission.id
    and assertion_row.submission_field_id = field_row.id;
  update public.taran_review_cases_v2 set state = 'approved', decided_at = now() where id = v_review.id;
  update public.taran_submission_cases_v2 set state = 'approved', decided_at = now() where id = v_submission.id;
  insert into public.taran_audit_events_v2 (
    actor_user_id, entity_type, entity_id, event_code, outcome_code
  ) values (auth.uid(), 'submission_case', v_submission.id, 'information_reviewed', 'approved');

  return jsonb_build_object('status', 'approved');
end;
$$;

create or replace function public.taran_submit_quote_v2(
  p_provider_id text,
  p_event_code text,
  p_quote_kind text,
  p_occurred_on date,
  p_exact_amount bigint,
  p_tax_included boolean,
  p_evidence_asset_id uuid,
  p_policy_version text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_catalog
set row_security = off
as $$
declare
  v_config public.taran_quote_runtime_config_v2;
  v_case_id uuid;
  v_quote_id uuid;
  v_reward_eligible boolean;
begin
  if auth.uid() is null or public.taran_account_deletion_self_is_active() then
    raise exception 'Sign-in is required.' using errcode = '42501';
  end if;

  select * into v_config
  from public.taran_quote_runtime_config_v2
  where config_key = 'provider_contribution_quote_v2';
  if not coalesce(v_config.contribution_enabled, false)
     or not coalesce(v_config.evidence_upload_enabled, false) then
    raise exception 'Quote contribution is disabled.' using errcode = '55000';
  end if;
  if p_event_code not in ('kids','parents','meeting','anniversary','other')
     or p_quote_kind not in ('estimate_received','contracted','completed')
     or p_occurred_on > current_date
     or p_occurred_on < current_date - interval '10 years'
     or p_exact_amount <= 0
     or p_exact_amount > 1000000000 then
    raise exception 'Invalid quote details.' using errcode = '22023';
  end if;
  v_reward_eligible := p_occurred_on >= current_date - interval '24 months';
  if exists (
    select 1
    from public.taran_provider_access_grants_v2 provider_grant
    where provider_grant.user_id = auth.uid()
      and provider_grant.state = 'active'
      and provider_grant.expires_at > now()
  ) then
    raise exception 'Active provider accounts must use the provider-source path and cannot receive customer quote rewards.'
      using errcode = '42501';
  end if;
  if nullif(btrim(p_policy_version), '') is null
     or p_policy_version <> v_config.privacy_policy_version then
    raise exception 'The current privacy policy must be accepted.' using errcode = '22023';
  end if;
  if not exists (
    select 1
    from public.taran_evidence_assets_v2 evidence
    where evidence.id = p_evidence_asset_id
      and evidence.owner_user_id = auth.uid()
      and evidence.review_allowed
      and evidence.scan_state = 'clean'
      and evidence.safe_preview_state = 'ready'
      and evidence.delete_after > now()
  ) then
    raise exception 'Clean evidence with a safe preview is required.' using errcode = '22023';
  end if;

  insert into public.taran_submission_cases_v2 (
    source_kind, provider_id, submitted_by, event_code, policy_version, retention_policy_code
  )
  values (
    'customer_quote', p_provider_id, auth.uid(), p_event_code,
    p_policy_version, 'quote_case_private_24m'
  )
  returning id into v_case_id;

  update public.taran_evidence_assets_v2
  set submission_case_id = v_case_id,
      retention_policy_code = 'raw_evidence_30d_90d_max',
      -- Keep evidence available during review, but never beyond 90 days from
      -- collection. A final decision or withdrawal resets this to 30 days.
      delete_after = created_at + interval '90 days'
  where id = p_evidence_asset_id and submission_case_id is null;
  if not found then
    raise exception 'Evidence is already attached.' using errcode = '23505';
  end if;

  insert into public.taran_submission_fields_v2 (submission_case_id, field_code, value_json)
  values (v_case_id, 'quote_total', to_jsonb(p_exact_amount));
  insert into public.taran_field_assertions_v2 (submission_field_id)
  select id from public.taran_submission_fields_v2 where submission_case_id = v_case_id;

  insert into public.taran_quote_cases_v2 (
    submission_case_id, provider_id, contributor_user_id, event_code, quote_kind,
    occurred_on, provider_match_state, verification_state, reward_eligible
  )
  values (
    v_case_id, p_provider_id, auth.uid(), p_event_code, p_quote_kind,
    p_occurred_on, case when p_provider_id is null then 'unmatched' else 'pending' end,
    case when v_reward_eligible then 'pending' else 'ineligible' end,
    false
  )
  returning id into v_quote_id;

  insert into public.taran_quote_prices_v2 (quote_case_id, exact_amount, tax_included)
  values (v_quote_id, p_exact_amount, p_tax_included);
  if v_reward_eligible then
    insert into public.taran_review_cases_v2 (
      submission_case_id, risk_level, required_review_count
    )
    values (v_case_id, 'high', 2);
  else
    update public.taran_submission_cases_v2
    set state = 'ineligible', decided_at = now()
    where id = v_case_id;
    insert into public.taran_review_cases_v2 (
      submission_case_id, state, risk_level, required_review_count, decided_at
    )
    values (v_case_id, 'cancelled', 'high', 2, now());
  end if;

  insert into public.taran_audit_events_v2 (
    actor_user_id, entity_type, entity_id, event_code, outcome_code
  )
  values (
    auth.uid(), 'quote_case', v_quote_id, 'quote_submitted',
    case when v_reward_eligible then 'pending_review' else 'ineligible_no_reward' end
  );

  return v_quote_id;
end;
$$;

create or replace function public.taran_record_quote_fingerprint_v2(
  p_quote_case_id uuid,
  p_fingerprint_hmac text,
  p_key_version text
)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
set row_security = off
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Quote fingerprint recording is server-only.' using errcode = '42501';
  end if;
  if p_fingerprint_hmac !~ '^[0-9a-fA-F]{64}$'
     or nullif(btrim(p_key_version), '') is null then
    raise exception 'Versioned quote fingerprint HMAC is required.' using errcode = '22023';
  end if;
  update public.taran_quote_cases_v2
  set fingerprint_hmac = lower(p_fingerprint_hmac),
      fingerprint_key_version = p_key_version
  where id = p_quote_case_id and verification_state = 'pending';
  if not found then
    raise exception 'Pending quote not found.' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.taran_mark_quote_provider_match_v2(
  p_quote_case_id uuid,
  p_match_state text,
  p_provider_id text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
set row_security = off
as $$
begin
  if not public.taran_is_admin()
     or not public.taran_is_aal2_v2()
     or public.taran_account_deletion_self_is_active() then
    raise exception 'Provider matching requires an operations role.' using errcode = '42501';
  end if;
  if p_match_state not in ('matched','ambiguous','unmatched')
     or (p_match_state = 'matched' and p_provider_id is null)
     or (p_match_state <> 'matched' and p_provider_id is not null) then
    raise exception 'Provider match state and provider must agree.' using errcode = '22023';
  end if;
  update public.taran_quote_cases_v2
  set provider_match_state = p_match_state,
      provider_id = p_provider_id
  where id = p_quote_case_id and verification_state = 'pending';
  if not found then
    raise exception 'Pending quote not found.' using errcode = 'P0002';
  end if;
  update public.taran_submission_cases_v2 submission
  set provider_id = p_provider_id
  from public.taran_quote_cases_v2 quote_case
  where quote_case.id = p_quote_case_id
    and submission.id = quote_case.submission_case_id;
end;
$$;

create or replace function public.taran_mark_quote_duplicate_state_v2(
  p_quote_case_id uuid,
  p_duplicate_state text
)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
set row_security = off
as $$
begin
  if not public.taran_is_admin()
     or not public.taran_is_aal2_v2()
     or public.taran_account_deletion_self_is_active() then
    raise exception 'Duplicate review requires an operations role.' using errcode = '42501';
  end if;
  if p_duplicate_state not in ('unique','duplicate','suspected') then
    raise exception 'Invalid duplicate state.' using errcode = '22023';
  end if;
  if p_duplicate_state = 'unique' and not exists (
    select 1
    from public.taran_quote_cases_v2 quote_case
    where quote_case.id = p_quote_case_id
      and quote_case.provider_match_state = 'matched'
      and quote_case.provider_id is not null
      and quote_case.fingerprint_hmac is not null
      and quote_case.fingerprint_key_version is not null
  ) then
    raise exception 'Matched provider and versioned fingerprint are required before uniqueness.'
      using errcode = '22023';
  end if;
  update public.taran_quote_cases_v2
  set duplicate_state = p_duplicate_state
  where id = p_quote_case_id and verification_state = 'pending';
  if not found then
    raise exception 'Pending quote not found.' using errcode = 'P0002';
  end if;
  insert into public.taran_audit_events_v2 (
    actor_user_id, entity_type, entity_id, event_code, outcome_code
  )
  values (auth.uid(), 'quote_case', p_quote_case_id, 'duplicate_reviewed', p_duplicate_state);
end;
$$;

create or replace function public.taran_assign_review_case_v2(
  p_review_case_id uuid,
  p_reviewer_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
set row_security = off
as $$
declare
  v_submitter uuid;
begin
  if not public.taran_is_admin()
     or not public.taran_is_aal2_v2()
     or public.taran_account_deletion_self_is_active() then
    raise exception 'Review assignment requires an operations role.' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.taran_admin_profiles
    where user_id = p_reviewer_id and role in ('owner','admin','operations')
  ) then
    raise exception 'Reviewer must have an operations role.' using errcode = '22023';
  end if;

  select submission.submitted_by into v_submitter
  from public.taran_review_cases_v2 review_case
  join public.taran_submission_cases_v2 submission
    on submission.id = review_case.submission_case_id
  where review_case.id = p_review_case_id and review_case.state = 'open'
  for update of review_case;

  if not found
     or v_submitter = p_reviewer_id
     or exists (
       select 1
       from public.taran_review_decisions_v2 decision_row
       where decision_row.review_case_id = p_review_case_id
         and decision_row.reviewer_id = p_reviewer_id
     ) then
    raise exception 'Review is unavailable or self-review was requested.' using errcode = '42501';
  end if;

  update public.taran_review_cases_v2
  set state = 'assigned', assigned_reviewer = p_reviewer_id, assigned_at = now()
  where id = p_review_case_id;
  update public.taran_submission_cases_v2 submission
  set state = 'under_review'
  from public.taran_review_cases_v2 review_case
  where review_case.id = p_review_case_id
    and submission.id = review_case.submission_case_id;
end;
$$;

create or replace function public.taran_decide_quote_v2(
  p_review_case_id uuid,
  p_idempotency_key uuid,
  p_decision text,
  p_reason_code text,
  p_display_mode text,
  p_range_low bigint default null,
  p_range_high bigint default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
set row_security = off
as $$
declare
  v_review public.taran_review_cases_v2;
  v_submission public.taran_submission_cases_v2;
  v_quote public.taran_quote_cases_v2;
  v_price public.taran_quote_prices_v2;
  v_config public.taran_quote_runtime_config_v2;
  v_projection_id uuid;
  v_low bigint;
  v_high bigint;
  v_approved_review_count integer;
begin
  if not public.taran_is_admin()
     or not public.taran_is_aal2_v2()
     or public.taran_account_deletion_self_is_active() then
    raise exception 'Quote review requires an operations role.' using errcode = '42501';
  end if;
  if p_decision not in ('approved','rejected')
     or nullif(btrim(p_reason_code), '') is null then
    raise exception 'A valid decision and reason are required.' using errcode = '22023';
  end if;

  select projection.id into v_projection_id
  from public.taran_review_decisions_v2 decision_row
  left join public.taran_review_cases_v2 review_case
    on review_case.id = decision_row.review_case_id
  left join public.taran_quote_cases_v2 quote_case
    on quote_case.submission_case_id = review_case.submission_case_id
  left join public.taran_quote_public_projections_v2 projection
    on projection.quote_case_id = quote_case.id
  where decision_row.idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object('status', 'idempotent_replay', 'projection_id', v_projection_id);
  end if;

  select * into v_review
  from public.taran_review_cases_v2
  where id = p_review_case_id
  for update;
  if not found or v_review.state <> 'assigned' or v_review.assigned_reviewer <> auth.uid() then
    raise exception 'The review is not assigned to the current reviewer.' using errcode = '42501';
  end if;

  select * into v_submission
  from public.taran_submission_cases_v2
  where id = v_review.submission_case_id
  for update;
  if v_submission.submitted_by = auth.uid() then
    raise exception 'Self-review is prohibited.' using errcode = '42501';
  end if;

  select * into v_quote
  from public.taran_quote_cases_v2
  where submission_case_id = v_submission.id
  for update;
  if not found or v_quote.verification_state <> 'pending' then
    raise exception 'The quote is not pending.' using errcode = '22023';
  end if;
  if v_quote.duplicate_state <> 'unique' and p_decision = 'approved' then
    raise exception 'Only a quote marked unique may be approved.' using errcode = '22023';
  end if;
  if p_decision = 'approved'
     and (
       v_quote.provider_match_state <> 'matched'
       or v_quote.provider_id is null
       or v_quote.fingerprint_hmac is null
       or v_quote.fingerprint_key_version is null
     ) then
    raise exception 'Approved quotes require matched provider identity and a versioned fingerprint.'
      using errcode = '22023';
  end if;
  if v_quote.occurred_on < current_date - interval '24 months' and p_decision = 'approved' then
    raise exception 'Quotes older than 24 months cannot be approved.' using errcode = '22023';
  end if;
  if p_decision = 'approved' and not exists (
    select 1 from public.taran_evidence_assets_v2 evidence
    where evidence.submission_case_id = v_submission.id
      and evidence.review_allowed
      and evidence.scan_state = 'clean'
      and evidence.safe_preview_state = 'ready'
      and evidence.delete_after > now()
  ) then
    raise exception 'Approved quotes require reviewable evidence.' using errcode = '22023';
  end if;

  insert into public.taran_review_decisions_v2 (
    review_case_id, idempotency_key, decision, reason_code, reviewer_id
  )
  values (v_review.id, p_idempotency_key, p_decision, p_reason_code, auth.uid());

  if p_decision = 'rejected' then
    update public.taran_evidence_assets_v2
    set delete_after = least(now() + interval '30 days', created_at + interval '90 days')
    where submission_case_id = v_submission.id;
    update public.taran_review_cases_v2 set state = 'rejected', decided_at = now() where id = v_review.id;
    update public.taran_submission_cases_v2 set state = 'rejected', decided_at = now() where id = v_submission.id;
    update public.taran_quote_cases_v2 set verification_state = 'rejected', verified_at = now() where id = v_quote.id;
    insert into public.taran_audit_events_v2 (
      actor_user_id, entity_type, entity_id, event_code, outcome_code
    ) values (auth.uid(), 'quote_case', v_quote.id, 'quote_reviewed', 'rejected');
    return jsonb_build_object('status', 'rejected', 'projection_id', null);
  end if;

  select count(*) into v_approved_review_count
  from public.taran_review_decisions_v2 decision_row
  where decision_row.review_case_id = v_review.id
    and decision_row.decision = 'approved';

  if v_approved_review_count < v_review.required_review_count then
    update public.taran_review_cases_v2
    set state = 'open',
        assigned_reviewer = null,
        assigned_at = null
    where id = v_review.id;
    insert into public.taran_audit_events_v2 (
      actor_user_id, entity_type, entity_id, event_code, outcome_code
    ) values (
      auth.uid(), 'review_case', v_review.id,
      'quote_reviewed', 'pending_independent_review'
    );
    return jsonb_build_object(
      'status', 'pending_independent_review',
      'completed_reviews', v_approved_review_count,
      'required_reviews', v_review.required_review_count,
      'projection_id', null
    );
  end if;

  select * into v_config
  from public.taran_quote_runtime_config_v2
  where config_key = 'provider_contribution_quote_v2'
  for update;
  if not coalesce(v_config.public_projection_enabled, false) then
    raise exception 'Public quote projection is disabled.' using errcode = '55000';
  end if;
  if p_display_mode not in ('exact','rounded_100k','range','hidden')
     or (p_display_mode = 'exact' and not v_config.allow_exact_amount) then
    raise exception 'The requested display mode is not approved.' using errcode = '22023';
  end if;

  select * into v_price
  from public.taran_quote_prices_v2
  where quote_case_id = v_quote.id
  for update;

  if p_display_mode = 'exact' then
    v_low := v_price.exact_amount;
    v_high := v_price.exact_amount;
  elsif p_display_mode = 'rounded_100k' then
    v_low := floor(v_price.exact_amount / 100000.0)::bigint * 100000;
    v_high := ceil(v_price.exact_amount / 100000.0)::bigint * 100000;
    if v_low = v_high then v_high := v_high + 100000; end if;
  elsif p_display_mode = 'range' then
    if p_range_low is null or p_range_high is null
       or p_range_low <= 0 or p_range_low > v_price.exact_amount
       or p_range_high < v_price.exact_amount then
      raise exception 'The approved range must contain the exact amount.' using errcode = '22023';
    end if;
    v_low := p_range_low;
    v_high := p_range_high;
  else
    v_low := null;
    v_high := null;
  end if;

  update public.taran_field_assertions_v2 assertion_row
  set assertion_state = 'verified',
      confidence_code = 'admin_confirmed',
      reviewed_at = now(),
      expires_at = v_quote.occurred_on + interval '24 months'
  from public.taran_submission_fields_v2 field_row
  where field_row.submission_case_id = v_submission.id
    and assertion_row.submission_field_id = field_row.id;

  insert into public.taran_quote_public_projections_v2 (
    quote_case_id, provider_id, event_code, quote_kind, display_mode,
    amount_low, amount_high, occurred_month, public_until
  )
  values (
    v_quote.id, v_quote.provider_id, v_quote.event_code, v_quote.quote_kind,
    p_display_mode, v_low, v_high, date_trunc('month', v_quote.occurred_on)::date,
    v_quote.occurred_on + interval '24 months'
  )
  returning id into v_projection_id;

  insert into public.taran_quote_access_grants_v2 (
    quote_case_id, user_id, expires_at
  )
  values (
    v_quote.id, v_quote.contributor_user_id,
    least(now() + interval '180 days', now() + interval '365 days')
  );

  update public.taran_review_cases_v2 set state = 'approved', decided_at = now() where id = v_review.id;
  update public.taran_submission_cases_v2 set state = 'approved', decided_at = now() where id = v_submission.id;
  update public.taran_quote_cases_v2
  set verification_state = 'approved',
      reward_eligible = true,
      verified_at = now()
  where id = v_quote.id;
  update public.taran_evidence_assets_v2
  set delete_after = least(now() + interval '30 days', created_at + interval '90 days')
  where submission_case_id = v_submission.id;

  insert into public.taran_quote_outbox_v2 (quote_case_id, event_code)
  values (v_quote.id, 'quote_approved');
  insert into public.taran_audit_events_v2 (
    actor_user_id, entity_type, entity_id, event_code, outcome_code
  ) values (auth.uid(), 'quote_case', v_quote.id, 'quote_reviewed', 'approved');

  return jsonb_build_object('status', 'approved', 'projection_id', v_projection_id);
end;
$$;

create or replace function public.taran_get_submission_status_v2(p_submission_case_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
set row_security = off
as $$
declare
  v_result jsonb;
begin
  if auth.uid() is null or public.taran_account_deletion_self_is_active() then
    raise exception 'Sign-in is required.' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'id', submission.id,
    'source_kind', submission.source_kind,
    'state', submission.state,
    'submitted_at', submission.submitted_at,
    'decided_at', submission.decided_at
  )
  into v_result
  from public.taran_submission_cases_v2 submission
  where submission.id = p_submission_case_id
    and (
      submission.submitted_by = auth.uid()
      or public.taran_is_admin()
      or exists (
        select 1 from public.taran_provider_access_grants_v2 grant_row
        where grant_row.provider_id = submission.provider_id
          and grant_row.user_id = auth.uid()
          and grant_row.scope = 'view_cases'
          and grant_row.state = 'active'
          and grant_row.expires_at > now()
      )
    );

  if v_result is null then
    raise exception 'Submission not found.' using errcode = 'P0002';
  end if;
  return v_result;
end;
$$;

create or replace function public.taran_withdraw_submission_v2(p_submission_case_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
set row_security = off
as $$
declare
  v_submission public.taran_submission_cases_v2;
  v_quote_id uuid;
begin
  if auth.uid() is null or public.taran_account_deletion_self_is_active() then
    raise exception 'Sign-in is required.' using errcode = '42501';
  end if;
  select * into v_submission
  from public.taran_submission_cases_v2
  where id = p_submission_case_id
  for update;
  if not found or v_submission.submitted_by <> auth.uid()
     or v_submission.state in ('deleted','deletion_pending') then
    raise exception 'The submission cannot be withdrawn.' using errcode = '42501';
  end if;

  update public.taran_submission_cases_v2
  set state = 'deletion_pending', withdrawn_at = now()
  where id = v_submission.id;
  update public.taran_field_assertions_v2 assertion_row
  set assertion_state = 'withdrawn'
  from public.taran_submission_fields_v2 field_row
  where field_row.submission_case_id = v_submission.id
    and assertion_row.submission_field_id = field_row.id;
  update public.taran_quote_cases_v2
  set verification_state = 'withdrawn'
  where submission_case_id = v_submission.id
  returning id into v_quote_id;
  update public.taran_quote_public_projections_v2
  set publication_state = 'withdrawn', blocked = true
  where quote_case_id = v_quote_id;
  update public.taran_quote_access_grants_v2 grant_row
  set grant_state = 'revoked', revoked_at = now(), revoke_reason = 'contributor_withdrawal'
  where grant_row.quote_case_id = v_quote_id
    and grant_row.grant_state = 'active';
  update public.taran_evidence_assets_v2
  set delete_after = least(now() + interval '30 days', created_at + interval '90 days')
  where submission_case_id = v_submission.id;

  insert into public.taran_deletion_jobs_v2 (submission_case_id, reason_code)
  values (v_submission.id, 'contributor_withdrawal')
  on conflict do nothing;
  if v_quote_id is not null then
    insert into public.taran_quote_outbox_v2 (quote_case_id, event_code)
    values (v_quote_id, 'quote_hidden')
    on conflict (quote_case_id, event_code) do nothing;
  end if;
end;
$$;

create or replace function public.taran_open_quote_dispute_v2(
  p_quote_case_id uuid,
  p_reason_code text,
  p_requested_action text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_catalog
set row_security = off
as $$
declare
  v_quote public.taran_quote_cases_v2;
  v_dispute_id uuid;
begin
  if auth.uid() is null or public.taran_account_deletion_self_is_active() then
    raise exception 'Sign-in is required.' using errcode = '42501';
  end if;
  if p_reason_code not in ('incorrect','duplicate','malicious','rights_request','confidential','other')
     or p_requested_action not in ('correct','hide','delete','revoke_grant') then
    raise exception 'Invalid dispute request.' using errcode = '22023';
  end if;

  select * into v_quote
  from public.taran_quote_cases_v2
  where id = p_quote_case_id
  for update;
  if not found or not (
    v_quote.contributor_user_id = auth.uid()
    or public.taran_is_admin()
    or exists (
      select 1 from public.taran_provider_access_grants_v2 grant_row
      where grant_row.provider_id = v_quote.provider_id
        and grant_row.user_id = auth.uid()
        and grant_row.scope = 'open_dispute'
        and grant_row.state = 'active'
        and grant_row.expires_at > now()
    )
  ) then
    raise exception 'Quote dispute access is denied.' using errcode = '42501';
  end if;

  insert into public.taran_dispute_cases_v2 (
    quote_case_id, opened_by, reason_code, requested_action
  )
  values (v_quote.id, auth.uid(), p_reason_code, p_requested_action)
  returning id into v_dispute_id;

  update public.taran_quote_cases_v2 set verification_state = 'disputed' where id = v_quote.id;
  update public.taran_submission_cases_v2 set state = 'disputed' where id = v_quote.submission_case_id;
  update public.taran_quote_public_projections_v2 set blocked = true where quote_case_id = v_quote.id;

  return v_dispute_id;
end;
$$;

create or replace function public.taran_resolve_quote_dispute_v2(
  p_dispute_id uuid,
  p_resolution text,
  p_resolution_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
set row_security = off
as $$
declare
  v_dispute public.taran_dispute_cases_v2;
  v_quote public.taran_quote_cases_v2;
begin
  if not public.taran_is_admin()
     or not public.taran_is_aal2_v2()
     or public.taran_account_deletion_self_is_active() then
    raise exception 'Dispute resolution requires an operations role.' using errcode = '42501';
  end if;
  if p_resolution not in ('approved','rejected')
     or p_resolution_reason not in (
       'evidence_confirmed','provider_confirmed','duplicate_confirmed',
       'rights_confirmed','privacy_confirmed','insufficient_evidence',
       'claim_not_supported','other_reviewed'
     ) then
    raise exception 'A valid dispute resolution and reason are required.' using errcode = '22023';
  end if;

  select * into v_dispute
  from public.taran_dispute_cases_v2
  where id = p_dispute_id
  for update;
  if not found or v_dispute.state not in ('open','under_review') then
    raise exception 'Open dispute not found.' using errcode = 'P0002';
  end if;
  select * into v_quote
  from public.taran_quote_cases_v2
  where id = v_dispute.quote_case_id
  for update;
  if v_dispute.opened_by = auth.uid()
     or v_quote.contributor_user_id = auth.uid()
     or exists (
       select 1
       from public.taran_review_decisions_v2 decision_row
       join public.taran_review_cases_v2 review_case
         on review_case.id = decision_row.review_case_id
       where review_case.submission_case_id = v_quote.submission_case_id
         and decision_row.reviewer_id = auth.uid()
     ) then
    raise exception 'Dispute resolution requires an independent operations reviewer.'
      using errcode = '42501';
  end if;

  if p_resolution = 'rejected' then
    update public.taran_dispute_cases_v2
    set state = 'rejected', resolved_at = now()
    where id = v_dispute.id;
    if not exists (
      select 1 from public.taran_dispute_cases_v2 other_dispute
      where other_dispute.quote_case_id = v_quote.id
        and other_dispute.id <> v_dispute.id
        and other_dispute.state in ('open','under_review')
    ) then
      update public.taran_quote_cases_v2
      set verification_state = 'approved'
      where id = v_quote.id and verification_state = 'disputed';
      update public.taran_submission_cases_v2
      set state = 'approved'
      where id = v_quote.submission_case_id and state = 'disputed';
      update public.taran_quote_public_projections_v2
      set blocked = false
      where quote_case_id = v_quote.id
        and publication_state = 'published'
        and public_until > now();
    end if;
    return jsonb_build_object('status', 'rejected', 'public_blocked', false);
  end if;

  update public.taran_dispute_cases_v2
  set state = 'resolved', resolved_at = now()
  where id = v_dispute.id;
  update public.taran_quote_public_projections_v2
  set blocked = true,
      publication_state = case
        when v_dispute.requested_action in ('hide','delete') then 'hidden'
        else publication_state
      end
  where quote_case_id = v_quote.id;

  if v_dispute.reason_code in ('duplicate','malicious')
     or v_dispute.requested_action = 'revoke_grant' then
    update public.taran_quote_access_grants_v2
    set grant_state = 'revoked',
        revoked_at = now(),
        revoke_reason = v_dispute.reason_code
    where quote_case_id = v_quote.id and grant_state = 'active';
  end if;
  if v_dispute.requested_action = 'delete'
     or v_dispute.reason_code in ('malicious','rights_request','confidential') then
    insert into public.taran_deletion_jobs_v2 (submission_case_id, reason_code)
    values (v_quote.submission_case_id, v_dispute.reason_code)
    on conflict (submission_case_id) do update
      set reason_code = excluded.reason_code;
  end if;
  insert into public.taran_audit_events_v2 (
    actor_user_id, entity_type, entity_id, event_code, outcome_code
  ) values (
    auth.uid(), 'dispute_case', v_dispute.id,
    'dispute_resolved', p_resolution_reason
  );

  return jsonb_build_object('status', 'resolved', 'public_blocked', true);
end;
$$;

create or replace function public.taran_set_quote_legal_hold_v2(
  p_quote_case_id uuid,
  p_action text,
  p_basis_code text,
  p_scope_note text,
  p_review_at timestamptz,
  p_release_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_catalog
set row_security = off
as $$
declare
  v_hold_id uuid;
begin
  if not public.taran_is_admin()
     or not public.taran_is_aal2_v2()
     or public.taran_account_deletion_self_is_active() then
    raise exception 'Legal hold changes require an operations role and AAL2.'
      using errcode = '42501';
  end if;
  if p_action = 'create' then
    if nullif(btrim(p_basis_code), '') is null
       or nullif(btrim(p_scope_note), '') is null
       or p_review_at <= now()
       or not exists (
         select 1 from public.taran_quote_cases_v2 where id = p_quote_case_id
       ) then
      raise exception 'Scoped legal hold basis and future review date are required.'
        using errcode = '22023';
    end if;
    insert into public.taran_legal_holds_v2 (
      quote_case_id, basis_code, scope_note, approved_by, review_at
    )
    values (
      p_quote_case_id, p_basis_code, p_scope_note, auth.uid(), p_review_at
    )
    returning id into v_hold_id;
    update public.taran_quote_cases_v2
    set verification_state = 'legal_hold'
    where id = p_quote_case_id;
    update public.taran_quote_public_projections_v2
    set blocked = true
    where quote_case_id = p_quote_case_id;
  elsif p_action = 'release' then
    if nullif(btrim(p_release_reason), '') is null then
      raise exception 'Legal hold release reason is required.' using errcode = '22023';
    end if;
    update public.taran_legal_holds_v2
    set state = 'released', released_at = now(), release_reason = p_release_reason
    where quote_case_id = p_quote_case_id and state = 'active'
    returning id into v_hold_id;
    if not found then
      raise exception 'Active legal hold not found.' using errcode = 'P0002';
    end if;
    update public.taran_quote_cases_v2
    set verification_state = 'disputed'
    where id = p_quote_case_id and verification_state = 'legal_hold';
  else
    raise exception 'Legal hold action must be create or release.' using errcode = '22023';
  end if;

  insert into public.taran_audit_events_v2 (
    actor_user_id, entity_type, entity_id, event_code, outcome_code
  ) values (
    auth.uid(), 'legal_hold', v_hold_id, 'legal_hold_changed', p_action
  );
  return v_hold_id;
end;
$$;

create or replace function public.taran_record_deletion_target_v2(
  p_job_id uuid,
  p_target text,
  p_succeeded boolean,
  p_error_code text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
set row_security = off
as $$
declare
  v_job public.taran_deletion_jobs_v2;
  v_complete boolean;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Deletion target recording is server-only.' using errcode = '42501';
  end if;
  select * into v_job from public.taran_deletion_jobs_v2 where id = p_job_id for update;
  if not found or not (p_target = any(v_job.required_targets)) or v_job.state = 'completed' then
    raise exception 'Invalid deletion target or job state.' using errcode = '22023';
  end if;
  if v_job.submission_case_id is not null and exists (
    select 1
    from public.taran_legal_holds_v2 legal_hold
    join public.taran_quote_cases_v2 quote_case
      on quote_case.id = legal_hold.quote_case_id
    where quote_case.submission_case_id = v_job.submission_case_id
      and legal_hold.state = 'active'
      and legal_hold.review_at > now()
  ) then
    update public.taran_deletion_jobs_v2
    set state = 'blocked', last_error_code = 'legal_hold_active'
    where id = v_job.id;
    return jsonb_build_object(
      'job_id', v_job.id,
      'completed', false,
      'blocked', true,
      'error_code', 'legal_hold_active'
    );
  end if;

  if p_succeeded then
    v_job.completed_targets := array_append(
      array_remove(v_job.completed_targets, p_target), p_target
    );
    v_job.failed_targets := array_remove(v_job.failed_targets, p_target);
  else
    v_job.failed_targets := array_append(
      array_remove(v_job.failed_targets, p_target), p_target
    );
    v_job.completed_targets := array_remove(v_job.completed_targets, p_target);
  end if;

  v_complete :=
    v_job.required_targets <@ v_job.completed_targets
    and cardinality(v_job.failed_targets) = 0;

  update public.taran_deletion_jobs_v2
  set completed_targets = v_job.completed_targets,
      failed_targets = v_job.failed_targets,
      attempts = attempts + 1,
      last_error_code = case when p_succeeded then null else p_error_code end,
      state = case when v_complete then 'completed'
                   when p_succeeded then 'running' else 'partial_failure' end,
      completed_at = case when v_complete then now() else null end
  where id = v_job.id;

  if v_complete then
    if v_job.evidence_asset_id is not null then
      delete from public.taran_evidence_assets_v2
      where id = v_job.evidence_asset_id;
    else
      delete from public.taran_quote_outbox_v2 outbox_row
      using public.taran_quote_cases_v2 quote_case
      where quote_case.submission_case_id = v_job.submission_case_id
        and outbox_row.quote_case_id = quote_case.id;
      delete from public.taran_quote_access_grants_v2 grant_row
      using public.taran_quote_cases_v2 quote_case
      where quote_case.submission_case_id = v_job.submission_case_id
        and grant_row.quote_case_id = quote_case.id;
      delete from public.taran_quote_public_projections_v2 projection
      using public.taran_quote_cases_v2 quote_case
      where quote_case.submission_case_id = v_job.submission_case_id
        and projection.quote_case_id = quote_case.id;
      delete from public.taran_dispute_cases_v2 dispute
      using public.taran_quote_cases_v2 quote_case
      where quote_case.submission_case_id = v_job.submission_case_id
        and dispute.quote_case_id = quote_case.id;
      delete from public.taran_quote_line_items_v2 line_item
      using public.taran_quote_cases_v2 quote_case
      where quote_case.submission_case_id = v_job.submission_case_id
        and line_item.quote_case_id = quote_case.id;
      delete from public.taran_quote_prices_v2 price
      using public.taran_quote_cases_v2 quote_case
      where quote_case.submission_case_id = v_job.submission_case_id
        and price.quote_case_id = quote_case.id;
      delete from public.taran_evidence_assets_v2
      where submission_case_id = v_job.submission_case_id;
      delete from public.taran_submission_fields_v2
      where submission_case_id = v_job.submission_case_id;
      delete from public.taran_quote_cases_v2
      where submission_case_id = v_job.submission_case_id;

      update public.taran_submission_cases_v2
      set submitted_by = null
      where id = v_job.submission_case_id;
      update public.taran_submission_cases_v2
      set provider_id = null,
          state = 'deleted',
          deleted_at = now()
      where id = v_job.submission_case_id;
    end if;
  end if;

  return jsonb_build_object(
    'job_id', v_job.id,
    'completed', v_complete,
    'failed_target_count', cardinality(v_job.failed_targets)
  );
end;
$$;

revoke all on function public.taran_reject_v2_history_mutation() from public, anon, authenticated;
revoke all on function public.taran_guard_account_deletion_v2_user_write() from public, anon, authenticated;
revoke all on function public.taran_queue_account_deletion_v2() from public, anon, authenticated;
revoke all on function public.taran_require_account_deletion_v2_complete() from public, anon, authenticated;
revoke all on function public.taran_quote_public_enabled_v2() from public, anon, authenticated;
revoke all on function public.taran_is_aal2_v2() from public, anon, authenticated;
revoke all on function public.taran_list_quote_public_v2(text,text,integer) from public, anon, authenticated;
revoke all on function public.taran_register_evidence_metadata_v2(uuid,text,text,text,bigint,text) from public, anon, authenticated;
revoke all on function public.taran_record_evidence_scan_v2(uuid,text,text,text,text,text) from public, anon, authenticated;
revoke all on function public.taran_issue_provider_access_v2(text,uuid,text,timestamptz) from public, anon, authenticated;
revoke all on function public.taran_submit_information_v2(text,text,text,jsonb,text,text) from public, anon, authenticated;
revoke all on function public.taran_decide_information_v2(uuid,uuid,text,text) from public, anon, authenticated;
revoke all on function public.taran_submit_quote_v2(text,text,text,date,bigint,boolean,uuid,text) from public, anon, authenticated;
revoke all on function public.taran_record_quote_fingerprint_v2(uuid,text,text) from public, anon, authenticated;
revoke all on function public.taran_mark_quote_provider_match_v2(uuid,text,text) from public, anon, authenticated;
revoke all on function public.taran_mark_quote_duplicate_state_v2(uuid,text) from public, anon, authenticated;
revoke all on function public.taran_assign_review_case_v2(uuid,uuid) from public, anon, authenticated;
revoke all on function public.taran_decide_quote_v2(uuid,uuid,text,text,text,bigint,bigint) from public, anon, authenticated;
revoke all on function public.taran_get_submission_status_v2(uuid) from public, anon, authenticated;
revoke all on function public.taran_withdraw_submission_v2(uuid) from public, anon, authenticated;
revoke all on function public.taran_open_quote_dispute_v2(uuid,text,text) from public, anon, authenticated;
revoke all on function public.taran_resolve_quote_dispute_v2(uuid,text,text) from public, anon, authenticated;
revoke all on function public.taran_set_quote_legal_hold_v2(uuid,text,text,text,timestamptz,text) from public, anon, authenticated;
revoke all on function public.taran_record_deletion_target_v2(uuid,text,boolean,text) from public, anon, authenticated;

grant execute on function public.taran_issue_provider_access_v2(text,uuid,text,timestamptz) to authenticated;
grant execute on function public.taran_quote_public_enabled_v2() to anon, authenticated;
grant execute on function public.taran_list_quote_public_v2(text,text,integer) to anon, authenticated;
grant execute on function public.taran_register_evidence_metadata_v2(uuid,text,text,text,bigint,text) to service_role;
grant execute on function public.taran_record_evidence_scan_v2(uuid,text,text,text,text,text) to service_role;
grant execute on function public.taran_record_quote_fingerprint_v2(uuid,text,text) to service_role;
grant execute on function public.taran_record_deletion_target_v2(uuid,text,boolean,text) to service_role;
grant execute on function public.taran_submit_information_v2(text,text,text,jsonb,text,text) to authenticated;
grant execute on function public.taran_decide_information_v2(uuid,uuid,text,text) to authenticated;
grant execute on function public.taran_submit_quote_v2(text,text,text,date,bigint,boolean,uuid,text) to authenticated;
grant execute on function public.taran_mark_quote_provider_match_v2(uuid,text,text) to authenticated;
grant execute on function public.taran_mark_quote_duplicate_state_v2(uuid,text) to authenticated;
grant execute on function public.taran_assign_review_case_v2(uuid,uuid) to authenticated;
grant execute on function public.taran_decide_quote_v2(uuid,uuid,text,text,text,bigint,bigint) to authenticated;
grant execute on function public.taran_get_submission_status_v2(uuid) to authenticated;
grant execute on function public.taran_withdraw_submission_v2(uuid) to authenticated;
grant execute on function public.taran_open_quote_dispute_v2(uuid,text,text) to authenticated;
grant execute on function public.taran_resolve_quote_dispute_v2(uuid,text,text) to authenticated;
grant execute on function public.taran_set_quote_legal_hold_v2(uuid,text,text,text,timestamptz,text) to authenticated;

comment on table public.taran_quote_public_projections_v2 is
  'Public-safe historical quote projection. Never current price, average, rank, raw evidence, or contributor identity.';
comment on table public.taran_evidence_assets_v2 is
  'Private evidence metadata only. Storage access is intentionally not created by migration 015.';
comment on table public.taran_quote_runtime_config_v2 is
  'Fail-closed activation gate. Operating enablement requires a separately approved change.';
