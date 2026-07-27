-- Server-only account deletion worker contract.
-- Run after 012_admin_provider_operations.sql.
-- Production application and scheduling require separate approval.

-- Preserve records that BE-014 already redacts instead of losing them through
-- an auth.users cascade. Raw claim/registration/evidence dependencies are not
-- changed here; the claim RPC blocks those accounts for manual review.
do $migration$
declare
  v_fk record;
  v_constraint record;
  v_relation regclass;
begin
  for v_fk in
    select *
    from (values
      ('public.taran_account_deletion_requests', 'user_id', 'taran_account_deletion_requests_user_id_fkey'),
      ('public.taran_reviews', 'user_id', 'taran_reviews_user_id_fkey'),
      ('public.taran_contributions', 'user_id', 'taran_contributions_user_id_fkey'),
      ('public.taran_point_ledger', 'user_id', 'taran_point_ledger_user_id_fkey'),
      ('public.taran_reward_redemptions', 'user_id', 'taran_reward_redemptions_user_id_fkey'),
      ('public.taran_community_posts', 'user_id', 'taran_community_posts_user_id_fkey'),
      ('public.taran_community_comments', 'user_id', 'taran_community_comments_user_id_fkey'),
      ('public.taran_inquiry_groups', 'user_id', 'taran_inquiry_groups_user_id_fkey')
    ) mapping(relation_name, column_name, constraint_name)
  loop
    v_relation := to_regclass(v_fk.relation_name);
    if v_relation is null then
      raise exception 'Required account-deletion relation is missing.'
        using errcode = '55000';
    end if;

    execute format(
      'alter table %s alter column %I drop not null',
      v_relation,
      v_fk.column_name
    );

    for v_constraint in
      select constraint_row.conname
      from pg_constraint constraint_row
      join pg_attribute attribute_row
        on attribute_row.attrelid = constraint_row.conrelid
       and attribute_row.attnum = any(constraint_row.conkey)
      where constraint_row.contype = 'f'
        and constraint_row.conrelid = v_relation
        and constraint_row.confrelid = 'auth.users'::regclass
        and attribute_row.attname = v_fk.column_name
    loop
      execute format(
        'alter table %s drop constraint %I',
        v_relation,
        v_constraint.conname
      );
    end loop;

    execute format(
      'alter table %s add constraint %I foreign key (%I) references auth.users(id) on delete set null',
      v_relation,
      v_fk.constraint_name,
      v_fk.column_name
    );
  end loop;
end;
$migration$;

alter table public.taran_account_deletion_requests
  add column if not exists attempt_count smallint not null default 0,
  add column if not exists next_attempt_at timestamptz,
  add column if not exists claim_token uuid,
  add column if not exists claim_expires_at timestamptz,
  add column if not exists last_error_code text;

do $migration$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.taran_account_deletion_requests'::regclass
      and conname = 'taran_account_deletion_attempt_count_check'
  ) then
    alter table public.taran_account_deletion_requests
      add constraint taran_account_deletion_attempt_count_check
      check (attempt_count between 0 and 3);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.taran_account_deletion_requests'::regclass
      and conname = 'taran_account_deletion_last_error_code_check'
  ) then
    alter table public.taran_account_deletion_requests
      add constraint taran_account_deletion_last_error_code_check
      check (
        last_error_code is null
        or last_error_code in (
          'manual_review_required', 'auth_delete_failed',
          'worker_internal_error', 'retry_exhausted', 'lease_expired'
        )
      );
  end if;
end;
$migration$;

create unique index if not exists taran_account_deletion_claim_token_idx
  on public.taran_account_deletion_requests(claim_token)
  where claim_token is not null;

-- Migration 006 uses a (user_id, status) conflict target. Without this broader
-- active-request invariant, a request can be submitted again after the worker
-- changes the existing row from pending to processing. Fail closed if a legacy
-- database already contains that ambiguous state; it must be reviewed instead
-- of deleting either request automatically.
do $migration$
begin
  if exists (
    select request.user_id
    from public.taran_account_deletion_requests request
    where request.user_id is not null
      and request.status in ('pending', 'processing')
    group by request.user_id
    having count(*) > 1
  ) then
    raise exception 'Duplicate active account deletion requests require manual review.'
      using errcode = '55000';
  end if;
end;
$migration$;

create unique index if not exists taran_account_deletion_one_active_user_idx
  on public.taran_account_deletion_requests(user_id)
  where user_id is not null
    and status in ('pending', 'processing');

create index if not exists taran_account_deletion_worker_queue_idx
  on public.taran_account_deletion_requests(status, next_attempt_at, requested_at)
  where status in ('pending', 'processing');

-- This table is the non-identifying worker history. It deliberately has no
-- request ID, Auth user UUID, email, phone, payload, or free-text error field.
create table if not exists public.taran_account_deletion_jobs (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'processing'
    check (status in ('processing', 'completed', 'failed')),
  attempt_no smallint not null check (attempt_no between 1 and 3),
  outcome_code text
    check (
      outcome_code is null
      or outcome_code in (
        'auth_deleted', 'auth_delete_failed', 'worker_internal_error',
        'retry_exhausted', 'lease_expired', 'manual_review_required'
      )
  ),
  claimed_at timestamptz not null default now(),
  finished_at timestamptz,
  purge_after timestamptz,
  created_at timestamptz not null default now()
);

alter table public.taran_account_deletion_jobs
  add column if not exists purge_after timestamptz;

create index if not exists taran_account_deletion_jobs_status_idx
  on public.taran_account_deletion_jobs(status, created_at);

alter table public.taran_account_deletion_jobs enable row level security;
revoke all on public.taran_account_deletion_jobs
  from public, anon, authenticated, service_role;

create or replace function public.taran_claim_account_deletion_job()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_request public.taran_account_deletion_requests;
  v_claim_token uuid;
  v_attempt smallint;
  v_manual_review boolean := false;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Account deletion jobs require the service role.'
      using errcode = '42501';
  end if;

  -- Auth deletion sets user_id to null before the completion RPC. Recover that
  -- narrow distributed-transaction gap without attempting Auth deletion again.
  select request.* into v_request
  from public.taran_account_deletion_requests request
  where request.status = 'processing'
    and request.user_id is null
    and request.claim_token is not null
  order by request.requested_at
  for update skip locked
  limit 1;

  if found then
    return jsonb_build_object(
      'action', 'complete_only',
      'claim_token', v_request.claim_token
    );
  end if;

  select request.* into v_request
  from public.taran_account_deletion_requests request
  where request.user_id is not null
    and (
      (
        request.status = 'pending'
        and coalesce(request.next_attempt_at, request.requested_at) <= now()
      )
      or (
        request.status = 'processing'
        and request.claim_expires_at <= now()
      )
    )
  order by request.requested_at
  for update skip locked
  limit 1;

  if not found then
    return null;
  end if;

  if v_request.claim_token is not null then
    update public.taran_account_deletion_jobs job
    set status = 'failed',
        outcome_code = case
          when v_request.attempt_count >= 3 then 'retry_exhausted'
          else 'lease_expired'
        end,
        finished_at = now(),
        purge_after = now() + interval '1 year'
    where job.id = v_request.claim_token
      and job.status = 'processing';
  end if;

  if v_request.attempt_count >= 3 then
    update public.taran_account_deletion_requests request
    set status = 'cancelled',
        last_error_code = 'retry_exhausted',
        claim_token = null,
        claim_expires_at = null,
        next_attempt_at = null
    where request.id = v_request.id;

    return jsonb_build_object(
      'action', 'blocked',
      'code', 'retry_exhausted'
    );
  end if;

  -- Privileged accounts and accounts with unsanitized/raw dependencies never
  -- enter the automatic Auth deletion path.
  v_manual_review :=
    exists (
      select 1
      from public.taran_admin_profiles profile
      where profile.user_id = v_request.user_id
    )
    or exists (
      select 1
      from public.taran_providers provider
      where provider.owner_user_id = v_request.user_id
    )
    or exists (
      select 1
      from public.taran_provider_claims claim
      where claim.user_id = v_request.user_id
    )
    or exists (
      select 1
      from public.taran_provider_registrations registration
      where registration.user_id = v_request.user_id
    )
    or exists (
      select 1
      from public.taran_provider_change_requests change_request
      where change_request.requested_by = v_request.user_id
    )
    or exists (
      select 1
      from public.taran_inquiry_responses response
      where response.provider_user_id = v_request.user_id
    )
    or exists (
      select 1
      from public.taran_contributions contribution
      where contribution.user_id = v_request.user_id
        and (
          coalesce(cardinality(contribution.file_paths), 0) > 0
          or contribution.data <> jsonb_build_object('redacted', true)
        )
    )
    or exists (
      select 1
      from storage.objects object_row
      where object_row.bucket_id = 'taran-private-evidence'
        and (storage.foldername(object_row.name))[1] = v_request.user_id::text
    );

  if v_manual_review then
    v_claim_token := gen_random_uuid();
    v_attempt := least(3, greatest(1, v_request.attempt_count + 1));

    insert into public.taran_account_deletion_jobs (
      id, status, attempt_no, outcome_code, finished_at, purge_after
    ) values (
      v_claim_token, 'failed', v_attempt, 'manual_review_required', now(),
      now() + interval '1 year'
    );

    update public.taran_account_deletion_requests request
    set status = 'cancelled',
        attempt_count = v_attempt,
        last_error_code = 'manual_review_required',
        claim_token = null,
        claim_expires_at = null,
        next_attempt_at = null
    where request.id = v_request.id;

    return jsonb_build_object(
      'action', 'blocked',
      'code', 'manual_review_required'
    );
  end if;

  v_claim_token := gen_random_uuid();
  v_attempt := v_request.attempt_count + 1;

  update public.taran_account_deletion_requests request
  set status = 'processing',
      attempt_count = v_attempt,
      claim_token = v_claim_token,
      claim_expires_at = now() + interval '5 minutes',
      next_attempt_at = null,
      last_error_code = null
  where request.id = v_request.id;

  insert into public.taran_account_deletion_jobs (
    id, status, attempt_no
  ) values (
    v_claim_token, 'processing', v_attempt
  );

  -- These identifiers cross only the service-role RPC boundary and are held in
  -- memory by the worker. They are never returned by the Edge Function or kept
  -- in the job history.
  return jsonb_build_object(
    'action', 'delete',
    'claim_token', v_claim_token,
    'user_id', v_request.user_id
  );
end;
$$;

create or replace function public.taran_complete_account_deletion_job(
  p_claim_token uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_request public.taran_account_deletion_requests;
  v_job public.taran_account_deletion_jobs;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Account deletion jobs require the service role.'
      using errcode = '42501';
  end if;

  select job.* into v_job
  from public.taran_account_deletion_jobs job
  where job.id = p_claim_token
  for update;

  if not found then
    raise exception 'Account deletion job is unavailable.'
      using errcode = '22023';
  end if;

  if v_job.status = 'completed' then
    return jsonb_build_object('status', 'already_completed');
  end if;

  if v_job.status <> 'processing' then
    raise exception 'Account deletion job is not processing.'
      using errcode = '22023';
  end if;

  select request.* into v_request
  from public.taran_account_deletion_requests request
  where request.claim_token = p_claim_token
  for update;

  if not found or v_request.user_id is not null then
    raise exception 'Auth deletion is not confirmed.'
      using errcode = '55000';
  end if;

  update public.taran_account_deletion_jobs job
  set status = 'completed',
      outcome_code = 'auth_deleted',
      finished_at = now(),
      purge_after = now() + interval '1 year'
  where job.id = p_claim_token;

  delete from public.taran_account_deletion_requests request
  where request.claim_token = p_claim_token;

  return jsonb_build_object('status', 'completed');
end;
$$;

create or replace function public.taran_fail_account_deletion_job(
  p_claim_token uuid,
  p_error_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_request public.taran_account_deletion_requests;
  v_job public.taran_account_deletion_jobs;
  v_terminal boolean;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Account deletion jobs require the service role.'
      using errcode = '42501';
  end if;

  if p_error_code not in ('auth_delete_failed', 'worker_internal_error') then
    raise exception 'Unsupported account deletion error code.'
      using errcode = '22023';
  end if;

  select job.* into v_job
  from public.taran_account_deletion_jobs job
  where job.id = p_claim_token
  for update;

  if not found then
    raise exception 'Account deletion job is unavailable.'
      using errcode = '22023';
  end if;

  if v_job.status = 'completed' then
    return jsonb_build_object('status', 'complete_required');
  end if;

  if v_job.status = 'failed' then
    return jsonb_build_object('status', 'already_failed');
  end if;

  select request.* into v_request
  from public.taran_account_deletion_requests request
  where request.claim_token = p_claim_token
  for update;

  if not found then
    raise exception 'Account deletion request is unavailable.'
      using errcode = '22023';
  end if;

  if v_request.user_id is null then
    return jsonb_build_object('status', 'complete_required');
  end if;

  v_terminal := v_request.attempt_count >= 3;

  update public.taran_account_deletion_jobs job
  set status = 'failed',
      outcome_code = case
        when v_terminal then 'retry_exhausted'
        else p_error_code
      end,
      finished_at = now(),
      purge_after = now() + interval '1 year'
  where job.id = p_claim_token;

  update public.taran_account_deletion_requests request
  set status = case when v_terminal then 'cancelled' else 'pending' end,
      next_attempt_at = case
        when v_terminal then null
        when request.attempt_count = 1 then now() + interval '1 minute'
        else now() + interval '5 minutes'
      end,
      last_error_code = case
        when v_terminal then 'retry_exhausted'
        else p_error_code
      end,
      claim_token = null,
      claim_expires_at = null
  where request.id = v_request.id;

  return jsonb_build_object(
    'status', case
      when v_terminal then 'retry_exhausted'
      else 'retry_scheduled'
    end
  );
end;
$$;

revoke all on function public.taran_claim_account_deletion_job()
  from public, anon, authenticated;
revoke all on function public.taran_complete_account_deletion_job(uuid)
  from public, anon, authenticated;
revoke all on function public.taran_fail_account_deletion_job(uuid, text)
  from public, anon, authenticated;

grant execute on function public.taran_claim_account_deletion_job()
  to service_role;
grant execute on function public.taran_complete_account_deletion_job(uuid)
  to service_role;
grant execute on function public.taran_fail_account_deletion_job(uuid, text)
  to service_role;
