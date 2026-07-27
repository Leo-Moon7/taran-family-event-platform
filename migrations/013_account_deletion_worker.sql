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

-- Every user-owned write and deletion request takes the same transaction lock.
-- A write that started first commits before the deletion cleanup runs; a
-- deletion request that started first makes the later write fail closed.
create or replace function public.taran_account_deletion_parse_uuid(p_value text)
returns uuid
language plpgsql
immutable
strict
set search_path = pg_catalog
as $$
begin
  return p_value::uuid;
exception
  when invalid_text_representation then
    return null;
end;
$$;

create or replace function public.taran_account_deletion_lock_user(p_user uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if p_user is not null then
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended('taran-account-deletion:' || p_user::text, 0)
    );
  end if;
end;
$$;

create or replace function public.taran_account_deletion_is_active(p_user uuid)
returns boolean
language sql
volatile
security definer
set search_path = public, pg_catalog
as $$
  select p_user is not null and exists (
    select 1
    from public.taran_account_deletion_requests request
    where request.user_id = p_user
      and request.status in ('pending', 'processing')
  );
$$;

-- This trigger runs for direct table writes and SECURITY DEFINER RPC writes.
-- It permits deletes and the exact D-31 redaction shapes, but no new or
-- unrelated mutation once the subject has an active deletion request.
create or replace function public.taran_guard_account_deletion_user_write()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_subject_column text := tg_argv[0];
  v_old jsonb;
  v_new jsonb;
  v_old_user uuid;
  v_new_user uuid;
  v_old_active boolean := false;
  v_new_active boolean := false;
  v_safe_redaction boolean := false;
begin
  if tg_op <> 'INSERT' then
    v_old := to_jsonb(old);
    v_old_user := public.taran_account_deletion_parse_uuid(v_old->>v_subject_column);
  end if;
  if tg_op <> 'DELETE' then
    v_new := to_jsonb(new);
    v_new_user := public.taran_account_deletion_parse_uuid(v_new->>v_subject_column);
  end if;

  -- Lock two subjects in deterministic order if a privileged operation tries
  -- to reassign ownership. This avoids cross-user advisory-lock deadlocks.
  if v_old_user is not null and v_new_user is not null
    and v_old_user <> v_new_user then
    if v_old_user::text < v_new_user::text then
      perform public.taran_account_deletion_lock_user(v_old_user);
      perform public.taran_account_deletion_lock_user(v_new_user);
    else
      perform public.taran_account_deletion_lock_user(v_new_user);
      perform public.taran_account_deletion_lock_user(v_old_user);
    end if;
  else
    perform public.taran_account_deletion_lock_user(coalesce(v_old_user, v_new_user));
  end if;

  if v_old_user is not null then
    v_old_active := public.taran_account_deletion_is_active(v_old_user);
  end if;
  if v_new_user is not null then
    v_new_active := public.taran_account_deletion_is_active(v_new_user);
  end if;

  if not v_old_active and not v_new_active then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  if tg_op = 'INSERT' then
    raise exception 'Writes are disabled while account deletion is active.'
      using errcode = '42501';
  end if;

  if v_old_user is not null and v_new_user is not null
    and v_old_user <> v_new_user then
    raise exception 'User ownership cannot be reassigned during account deletion.'
      using errcode = '42501';
  end if;

  if tg_table_schema = 'public' and tg_table_name = 'taran_customers' then
    v_safe_redaction :=
      v_new->>'status' = 'deleted'
      and v_new->'data' = jsonb_build_object(
        'name', '탈퇴한 사용자',
        'email', '',
        'phone', '',
        'accountType', 'deleted'
      )
      and (v_new - array['status', 'data', 'updated_at']::text[])
        = (v_old - array['status', 'data', 'updated_at']::text[]);
  elsif tg_table_schema = 'public' and tg_table_name = 'taran_inquiries' then
    v_safe_redaction :=
      v_new->'contact' = '{}'::jsonb
      and v_new->'details' = '{}'::jsonb
      and (v_new - array['user_id', 'contact', 'details', 'updated_at']::text[])
        = (v_old - array['user_id', 'contact', 'details', 'updated_at']::text[]);
  elsif tg_table_schema = 'public' and tg_table_name = 'taran_inquiry_groups' then
    v_safe_redaction :=
      v_new->'contact' = '{}'::jsonb
      and v_new->>'request_note' is null
      and (v_new - array['user_id', 'contact', 'request_note', 'updated_at']::text[])
        = (v_old - array['user_id', 'contact', 'request_note', 'updated_at']::text[]);
  elsif tg_table_schema = 'public' and tg_table_name = 'taran_contributions' then
    v_safe_redaction :=
      v_new->'data' = jsonb_build_object('redacted', true)
      and v_new->'file_paths' = '[]'::jsonb
      and v_new->>'status' = 'deleted'
      and (v_new - array['user_id', 'data', 'file_paths', 'status']::text[])
        = (v_old - array['user_id', 'data', 'file_paths', 'status']::text[]);
  elsif tg_table_schema = 'public' and tg_table_name = 'taran_reviews' then
    v_safe_redaction :=
      v_new->>'author_name' = '탈퇴한 사용자'
      and (v_new - array['user_id', 'author_name', 'updated_at']::text[])
        = (v_old - array['user_id', 'author_name', 'updated_at']::text[]);
  elsif tg_table_schema = 'public'
    and tg_table_name in ('taran_community_posts', 'taran_community_comments') then
    v_safe_redaction :=
      v_new->>'author_name' = '탈퇴한 사용자'
      and (v_new - array['user_id', 'author_name', 'updated_at']::text[])
        = (v_old - array['user_id', 'author_name', 'updated_at']::text[]);
  elsif tg_table_schema = 'public'
    and tg_table_name in ('taran_point_ledger', 'taran_reward_redemptions') then
    -- These rows contain transaction history, not user-entered profile/contact
    -- fields. Only the FK nulling performed by Auth deletion is allowed.
    v_safe_redaction :=
      v_new_user is null
      and (v_new - v_subject_column) = (v_old - v_subject_column);
  end if;

  if v_safe_redaction then
    return new;
  end if;

  raise exception 'Only account-deletion cleanup is allowed for this user.'
    using errcode = '42501';
end;
$$;

do $migration$
declare
  v_target record;
  v_relation regclass;
begin
  for v_target in
    select *
    from (values
      ('public.taran_admin_profiles', 'user_id'),
      ('public.taran_customers', 'id'),
      ('public.taran_providers', 'owner_user_id'),
      ('public.taran_inquiries', 'user_id'),
      ('public.taran_reviews', 'user_id'),
      ('public.taran_contributions', 'user_id'),
      ('public.taran_point_ledger', 'user_id'),
      ('public.taran_member_states', 'user_id'),
      ('public.taran_saved_providers', 'user_id'),
      ('public.taran_reward_redemptions', 'user_id'),
      ('public.taran_provider_claims', 'user_id'),
      ('public.taran_community_posts', 'user_id'),
      ('public.taran_community_comments', 'user_id'),
      ('public.taran_inquiry_groups', 'user_id'),
      ('public.taran_inquiry_responses', 'provider_user_id'),
      ('public.taran_provider_registrations', 'user_id'),
      ('public.taran_user_comparisons', 'user_id'),
      ('public.taran_user_checklists', 'user_id'),
      ('public.taran_provider_change_requests', 'requested_by'),
      ('public.taran_provider_review_events', 'actor_user_id'),
      ('public.taran_notification_jobs', 'recipient_user_id')
    ) target(relation_name, column_name)
  loop
    v_relation := to_regclass(v_target.relation_name);
    if v_relation is null then
      raise exception 'Required account-deletion write target is missing.'
        using errcode = '55000';
    end if;

    execute format(
      'drop trigger if exists taran_guard_account_deletion_writes on %s',
      v_relation
    );
    execute format(
      'create trigger taran_guard_account_deletion_writes before insert or update or delete on %s for each row execute function public.taran_guard_account_deletion_user_write(%L)',
      v_relation,
      v_target.column_name
    );
  end loop;
end;
$migration$;

-- Evidence objects are keyed by the first path component. The trigger does not
-- delete or change retention; it only serializes and blocks new raw evidence.
create or replace function public.taran_guard_account_deletion_evidence_write()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_old_user uuid;
  v_new_user uuid;
  v_old_active boolean := false;
  v_new_active boolean := false;
begin
  if tg_op <> 'INSERT' and old.bucket_id = 'taran-private-evidence' then
    v_old_user := public.taran_account_deletion_parse_uuid(
      (storage.foldername(old.name))[1]
    );
  end if;
  if tg_op <> 'DELETE' and new.bucket_id = 'taran-private-evidence' then
    v_new_user := public.taran_account_deletion_parse_uuid(
      (storage.foldername(new.name))[1]
    );
  end if;

  if v_old_user is not null and v_new_user is not null
    and v_old_user <> v_new_user then
    if v_old_user::text < v_new_user::text then
      perform public.taran_account_deletion_lock_user(v_old_user);
      perform public.taran_account_deletion_lock_user(v_new_user);
    else
      perform public.taran_account_deletion_lock_user(v_new_user);
      perform public.taran_account_deletion_lock_user(v_old_user);
    end if;
  else
    perform public.taran_account_deletion_lock_user(coalesce(v_old_user, v_new_user));
  end if;

  if v_old_user is not null then
    v_old_active := public.taran_account_deletion_is_active(v_old_user);
  end if;
  if v_new_user is not null then
    v_new_active := public.taran_account_deletion_is_active(v_new_user);
  end if;

  if (v_old_active or v_new_active) and tg_op <> 'DELETE' then
    raise exception 'Evidence writes are disabled while account deletion is active.'
      using errcode = '42501';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists taran_guard_account_deletion_evidence_writes
  on storage.objects;
create trigger taran_guard_account_deletion_evidence_writes
before insert or update or delete on storage.objects
for each row execute function public.taran_guard_account_deletion_evidence_write();

-- Auth updates use the same lock so a metadata/email/phone write that starts
-- first is subsequently redacted, while one that starts after the request is
-- rejected before it can repopulate taran_customers.
create or replace function public.taran_guard_account_deletion_auth_metadata()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  perform public.taran_account_deletion_lock_user(new.id);
  if public.taran_account_deletion_is_active(new.id) then
    raise exception 'Auth profile writes are disabled while account deletion is active.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists taran_guard_account_deletion_auth_metadata_writes
  on auth.users;
create trigger taran_guard_account_deletion_auth_metadata_writes
before update on auth.users
for each row execute function public.taran_guard_account_deletion_auth_metadata();

-- Hold the user lock for the complete Auth deletion transaction. Even if the
-- request FK is nulled before another FK action, no concurrent protected write
-- can enter that gap.
create or replace function public.taran_lock_account_deletion_auth_delete()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  perform public.taran_account_deletion_lock_user(old.id);
  return old;
end;
$$;

drop trigger if exists taran_lock_account_deletion_auth_delete
  on auth.users;
create trigger taran_lock_account_deletion_auth_delete
before delete on auth.users
for each row execute function public.taran_lock_account_deletion_auth_delete();

-- Replace migration 006's request RPC so request creation and every cleanup
-- statement share the same per-user lock used by all protected writes.
create or replace function public.taran_request_account_deletion()
returns uuid
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
  v_status text;
begin
  if v_user is null then
    raise exception 'Login is required to request account deletion.'
      using errcode = '42501';
  end if;

  perform public.taran_account_deletion_lock_user(v_user);

  select request.id, request.status
  into v_id, v_status
  from public.taran_account_deletion_requests request
  where request.user_id = v_user
    and request.status in ('pending', 'processing')
  for update;

  if found and v_status = 'processing' then
    raise exception 'Account deletion is already processing.'
      using errcode = '55000';
  elsif found then
    update public.taran_account_deletion_requests request
    set requested_at = now()
    where request.id = v_id;
  else
    insert into public.taran_account_deletion_requests (user_id, status)
    values (v_user, 'pending')
    returning id into v_id;
  end if;

  update public.taran_customers
  set status = 'deleted',
      data = jsonb_build_object(
        'name', '탈퇴한 사용자',
        'email', '',
        'phone', '',
        'accountType', 'deleted'
      ),
      updated_at = now()
  where id = v_user::text;

  delete from public.taran_saved_providers where user_id = v_user;
  delete from public.taran_member_states where user_id = v_user;
  delete from public.taran_user_comparisons where user_id = v_user;
  delete from public.taran_user_checklists where user_id = v_user;

  update public.taran_inquiries
  set contact = '{}'::jsonb,
      details = '{}'::jsonb,
      updated_at = now()
  where user_id = v_user;

  update public.taran_inquiry_groups
  set contact = '{}'::jsonb,
      request_note = null,
      updated_at = now()
  where user_id = v_user;

  update public.taran_contributions
  set data = jsonb_build_object('redacted', true),
      file_paths = '{}',
      status = 'deleted'
  where user_id = v_user;

  update public.taran_reviews
  set author_name = '탈퇴한 사용자',
      updated_at = now()
  where user_id = v_user;

  update public.taran_community_posts
  set author_name = '탈퇴한 사용자',
      updated_at = now()
  where user_id = v_user;

  update public.taran_community_comments
  set author_name = '탈퇴한 사용자',
      updated_at = now()
  where user_id = v_user;

  return v_id;
end;
$$;

revoke all on function public.taran_account_deletion_parse_uuid(text)
  from public, anon, authenticated;
revoke all on function public.taran_account_deletion_lock_user(uuid)
  from public, anon, authenticated;
revoke all on function public.taran_account_deletion_is_active(uuid)
  from public, anon, authenticated;
revoke all on function public.taran_guard_account_deletion_user_write()
  from public, anon, authenticated;
revoke all on function public.taran_guard_account_deletion_evidence_write()
  from public, anon, authenticated;
revoke all on function public.taran_guard_account_deletion_auth_metadata()
  from public, anon, authenticated;
revoke all on function public.taran_lock_account_deletion_auth_delete()
  from public, anon, authenticated;
revoke all on function public.taran_request_account_deletion()
  from public, anon;
grant execute on function public.taran_request_account_deletion()
  to authenticated;

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
  v_candidate_id uuid;
  v_candidate_user uuid;
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

  -- Choose without a row lock, take the same user advisory lock used by every
  -- protected write, then re-read and lock the still-eligible request. This
  -- lock ordering avoids a request-row/advisory-lock deadlock.
  select request.id, request.user_id
  into v_candidate_id, v_candidate_user
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
  limit 1;

  if not found then
    return null;
  end if;

  perform public.taran_account_deletion_lock_user(v_candidate_user);

  select request.* into v_request
  from public.taran_account_deletion_requests request
  where request.id = v_candidate_id
    and request.user_id = v_candidate_user
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
  for update skip locked;

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
      from public.taran_customers customer
      where customer.id = v_request.user_id::text
        and (
          customer.status <> 'deleted'
          or customer.data <> jsonb_build_object(
            'name', '탈퇴한 사용자',
            'email', '',
            'phone', '',
            'accountType', 'deleted'
          )
        )
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
      from public.taran_notification_jobs notification
      where notification.recipient_user_id = v_request.user_id
    )
    or exists (
      select 1
      from public.taran_provider_review_events review_event
      where review_event.actor_user_id = v_request.user_id
    )
    or exists (
      select 1
      from public.taran_inquiries inquiry
      where inquiry.user_id = v_request.user_id
        and (
          inquiry.contact <> '{}'::jsonb
          or inquiry.details <> '{}'::jsonb
        )
    )
    or exists (
      select 1
      from public.taran_inquiry_groups inquiry_group
      where inquiry_group.user_id = v_request.user_id
        and (
          inquiry_group.contact <> '{}'::jsonb
          or inquiry_group.request_note is not null
        )
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
      from public.taran_reviews review
      where review.user_id = v_request.user_id
        and review.author_name <> '탈퇴한 사용자'
    )
    or exists (
      select 1
      from public.taran_community_posts post
      where post.user_id = v_request.user_id
        and post.author_name <> '탈퇴한 사용자'
    )
    or exists (
      select 1
      from public.taran_community_comments comment_row
      where comment_row.user_id = v_request.user_id
        and comment_row.author_name <> '탈퇴한 사용자'
    )
    or exists (
      select 1
      from public.taran_member_states state
      where state.user_id = v_request.user_id
    )
    or exists (
      select 1
      from public.taran_saved_providers saved
      where saved.user_id = v_request.user_id
    )
    or exists (
      select 1
      from public.taran_user_comparisons comparison
      where comparison.user_id = v_request.user_id
    )
    or exists (
      select 1
      from public.taran_user_checklists checklist
      where checklist.user_id = v_request.user_id
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
