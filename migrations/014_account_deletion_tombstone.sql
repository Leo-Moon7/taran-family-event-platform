-- Auth-independent account-deletion tombstone and stale-JWT drain.
-- Run after 013_account_deletion_worker.sql.
-- Production application, runtime configuration, Edge deployment, and
-- scheduling require separate approval.

-- Replacing migration 013 while it owns an active request can lose the worker
-- state that is being converted. Fail closed on the first application. A
-- rerun after this migration created its tombstone table remains idempotent.
do $migration$
begin
  if to_regclass('public.taran_account_deletion_tombstones') is null
    and exists (
      select 1
      from public.taran_account_deletion_requests request
      where request.status in ('pending', 'processing')
        or request.claim_token is not null
    ) then
    raise exception 'Pause the deletion worker and resolve all active migration 013 requests before applying migration 014.'
      using errcode = '55000';
  end if;
end;
$migration$;

-- Runtime values deliberately have no defaults. The migration is safe to
-- validate in isolation, but account deletion remains disabled until an
-- operator records the actual Supabase maximum JWT TTL and an approved buffer.
create table if not exists public.taran_account_deletion_runtime_config (
  singleton boolean primary key default true check (singleton),
  enabled boolean not null default false,
  max_jwt_ttl_seconds integer,
  max_inflight_write_seconds integer,
  buffer_seconds integer,
  verified_at timestamptz,
  updated_at timestamptz not null default now(),
  check (
    (
      enabled = false
      and max_jwt_ttl_seconds is null
      and max_inflight_write_seconds is null
      and buffer_seconds is null
      and verified_at is null
    )
    or (
      enabled = true
      and max_jwt_ttl_seconds between 60 and 604800
      and max_inflight_write_seconds between 1 and 86400
      and buffer_seconds between 30 and 86400
      and buffer_seconds > max_inflight_write_seconds
      and verified_at is not null
    )
  )
);

insert into public.taran_account_deletion_runtime_config (singleton)
values (true)
on conflict (singleton) do nothing;

alter table public.taran_account_deletion_runtime_config enable row level security;
revoke all on public.taran_account_deletion_runtime_config
  from public, anon, authenticated, service_role;

-- This row is intentionally not linked to auth.users or the request table by
-- a foreign key. It must survive Auth FK actions and request.user_id becoming
-- null. The identifying UUID exists only while the deletion is unfinished.
create table if not exists public.taran_account_deletion_tombstones (
  user_id uuid primary key,
  request_id uuid not null unique,
  state text not null default 'requested'
    check (
      state in (
        'requested', 'auth_deleting', 'token_drain', 'finalizing',
        'manual_review_required', 'retry_wait', 'blocked'
      )
    ),
  preflight_after timestamptz not null,
  auth_deleted_at timestamptz,
  release_after timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (auth_deleted_at is null and release_after is null)
    or (
      auth_deleted_at is not null
      and release_after is not null
      and release_after > auth_deleted_at
    )
  )
);

create index if not exists taran_account_deletion_tombstone_queue_idx
  on public.taran_account_deletion_tombstones(state, preflight_after, release_after, created_at);

alter table public.taran_account_deletion_tombstones enable row level security;
revoke all on public.taran_account_deletion_tombstones
  from public, anon, authenticated, service_role;

-- Any surviving tombstone blocks the subject. In particular this does not
-- depend on an auth.users FK or taran_account_deletion_requests.user_id.
create or replace function public.taran_account_deletion_is_active(p_user uuid)
returns boolean
language sql
volatile
security definer
set search_path = public, pg_catalog
set row_security = off
as $$
  select p_user is not null and exists (
    select 1
    from public.taran_account_deletion_tombstones tombstone
    where tombstone.user_id = p_user
  );
$$;

-- RLS policies cannot call the internal UUID-taking function because it would
-- become a tombstone-existence oracle. This no-argument helper can reveal only
-- the caller's own blocked state.
create or replace function public.taran_account_deletion_self_is_active()
returns boolean
language sql
volatile
security definer
set search_path = public, pg_catalog
set row_security = off
as $$
  select public.taran_account_deletion_is_active(auth.uid());
$$;

-- Replace migration 013's row-trigger implementation. A BEFORE ROW trigger
-- can already be holding row/index/FK locks, so it must never wait on the
-- account-deletion advisory lock. The delayed preflight and final token drain
-- close the finite in-flight statement window without a lock-order cycle.
create or replace function public.taran_guard_account_deletion_user_write()
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

  if v_old_user is not null then
    v_old_active := public.taran_account_deletion_is_active(v_old_user);
  end if;
  if v_new_user is not null then
    v_new_active := public.taran_account_deletion_is_active(v_new_user);
  end if;

  if not v_old_active and not v_new_active then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  -- Direct client deletes are denied by the replacement RLS policies. Deletes
  -- remain available here for the narrow SECURITY DEFINER cleanup routine.
  if tg_op = 'DELETE' then return old; end if;

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
    v_safe_redaction :=
      v_new_user is null
      and (v_new - v_subject_column) = (v_old - v_subject_column);
  end if;

  if v_safe_redaction then return new; end if;

  raise exception 'Only account-deletion cleanup is allowed for this user.'
    using errcode = '42501';
end;
$$;

create or replace function public.taran_guard_account_deletion_evidence_write()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
set row_security = off
as $$
declare
  v_old_user uuid;
  v_new_user uuid;
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

  if tg_op <> 'DELETE'
    and (
      public.taran_account_deletion_is_active(v_old_user)
      or public.taran_account_deletion_is_active(v_new_user)
    ) then
    raise exception 'Evidence writes are disabled while account deletion is active.'
      using errcode = '42501';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create or replace function public.taran_guard_account_deletion_auth_metadata()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
set row_security = off
as $$
begin
  if public.taran_account_deletion_is_active(new.id) then
    raise exception 'Auth profile writes are disabled while account deletion is active.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

-- Auth deletion no longer participates in a row/advisory lock cycle. The
-- independent tombstone remains after the FK actions have nulled user_id.
drop trigger if exists taran_lock_account_deletion_auth_delete on auth.users;

-- A stale authenticated client must not create an ownerless legacy inquiry.
-- The active product path is taran_create_inquiry_group(), which always writes
-- auth.uid() inside the server RPC.
drop policy if exists "users can create inquiries" on public.taran_inquiries;

-- Add the tombstone condition to direct user mutation policies. Administrative
-- policies remain separate. The trigger remains defense in depth for
-- SECURITY DEFINER writes.
drop policy if exists "users can create reviews" on public.taran_reviews;
create policy "users can create reviews"
on public.taran_reviews for insert to authenticated
with check (
  auth.uid() = user_id
  and status = 'pending'
  and not public.taran_account_deletion_self_is_active()
);

drop policy if exists "users can update own pending reviews" on public.taran_reviews;
create policy "users can update own pending reviews"
on public.taran_reviews for update to authenticated
using (
  auth.uid() = user_id
  and status = 'pending'
  and not public.taran_account_deletion_self_is_active()
)
with check (
  auth.uid() = user_id
  and status = 'pending'
  and not public.taran_account_deletion_self_is_active()
);

drop policy if exists "users can create contributions" on public.taran_contributions;
create policy "users can create contributions"
on public.taran_contributions for insert to authenticated
with check (
  auth.uid() = user_id
  and status = 'pending'
  and not public.taran_account_deletion_self_is_active()
);

drop policy if exists "users can manage own member state" on public.taran_member_states;
create policy "users can manage own member state"
on public.taran_member_states for all to authenticated
using (
  auth.uid() = user_id
  and not public.taran_account_deletion_self_is_active()
)
with check (
  auth.uid() = user_id
  and not public.taran_account_deletion_self_is_active()
);

drop policy if exists "users can manage own saved providers" on public.taran_saved_providers;
create policy "users can manage own saved providers"
on public.taran_saved_providers for all to authenticated
using (
  auth.uid() = user_id
  and not public.taran_account_deletion_self_is_active()
)
with check (
  auth.uid() = user_id
  and not public.taran_account_deletion_self_is_active()
);

drop policy if exists "users can create provider claims" on public.taran_provider_claims;
create policy "users can create provider claims"
on public.taran_provider_claims for insert to authenticated
with check (
  auth.uid() = user_id
  and status = 'pending'
  and not public.taran_account_deletion_self_is_active()
);

drop policy if exists "users can update own pending provider claims" on public.taran_provider_claims;
create policy "users can update own pending provider claims"
on public.taran_provider_claims for update to authenticated
using (
  auth.uid() = user_id
  and status in ('pending', 'rejected')
  and not public.taran_account_deletion_self_is_active()
)
with check (
  auth.uid() = user_id
  and status = 'pending'
  and not public.taran_account_deletion_self_is_active()
);

drop policy if exists "users can create community posts" on public.taran_community_posts;
create policy "users can create community posts"
on public.taran_community_posts for insert to authenticated
with check (
  auth.uid() = user_id
  and status = 'pending'
  and not public.taran_account_deletion_self_is_active()
);

drop policy if exists "users can create community comments" on public.taran_community_comments;
create policy "users can create community comments"
on public.taran_community_comments for insert to authenticated
with check (
  auth.uid() = user_id
  and status = 'pending'
  and not public.taran_account_deletion_self_is_active()
);

drop policy if exists "users manage own comparisons" on public.taran_user_comparisons;
create policy "users manage own comparisons"
on public.taran_user_comparisons for all to authenticated
using (
  user_id = auth.uid()
  and not public.taran_account_deletion_self_is_active()
)
with check (
  user_id = auth.uid()
  and not public.taran_account_deletion_self_is_active()
);

drop policy if exists "users manage own checklists" on public.taran_user_checklists;
create policy "users manage own checklists"
on public.taran_user_checklists for all to authenticated
using (
  user_id = auth.uid()
  and not public.taran_account_deletion_self_is_active()
)
with check (
  user_id = auth.uid()
  and not public.taran_account_deletion_self_is_active()
);

drop policy if exists "providers manage own inquiry responses" on public.taran_inquiry_responses;
create policy "providers manage own inquiry responses"
on public.taran_inquiry_responses for all to authenticated
using (
  provider_user_id = auth.uid()
  and not public.taran_account_deletion_self_is_active()
  and public.taran_provider_owns_recipient(inquiry_recipient_id)
)
with check (
  provider_user_id = auth.uid()
  and not public.taran_account_deletion_self_is_active()
  and public.taran_provider_owns_recipient(inquiry_recipient_id)
);

drop policy if exists "users can upload own evidence" on storage.objects;
create policy "users can upload own evidence"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'taran-private-evidence'
  and (storage.foldername(name))[1] = auth.uid()::text
  and not public.taran_account_deletion_self_is_active()
);

drop policy if exists "operations can delete evidence" on storage.objects;
create policy "operations can delete evidence"
on storage.objects for delete to authenticated
using (
  bucket_id = 'taran-private-evidence'
  and public.taran_has_role(array['owner','admin','operations'])
  and not public.taran_account_deletion_self_is_active()
);

-- Narrow cleanup shared by request, preflight, and finalization. It does not
-- delete provider claims, registrations, business evidence, or privileged
-- records; those remain manual-review blockers.
create or replace function public.taran_account_deletion_cleanup_user(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
set row_security = off
as $$
begin
  if p_user is null then
    raise exception 'Account deletion cleanup requires a user.'
      using errcode = '22023';
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
  where id = p_user::text;

  delete from public.taran_saved_providers where user_id = p_user;
  delete from public.taran_member_states where user_id = p_user;
  delete from public.taran_user_comparisons where user_id = p_user;
  delete from public.taran_user_checklists where user_id = p_user;

  update public.taran_inquiries
  set contact = '{}'::jsonb,
      details = '{}'::jsonb,
      updated_at = now()
  where user_id = p_user;

  update public.taran_inquiry_groups
  set contact = '{}'::jsonb,
      request_note = null,
      updated_at = now()
  where user_id = p_user;

  update public.taran_contributions
  set data = jsonb_build_object('redacted', true),
      file_paths = '{}',
      status = 'deleted'
  where user_id = p_user;

  update public.taran_reviews
  set author_name = '탈퇴한 사용자',
      updated_at = now()
  where user_id = p_user;

  update public.taran_community_posts
  set author_name = '탈퇴한 사용자',
      updated_at = now()
  where user_id = p_user;

  update public.taran_community_comments
  set author_name = '탈퇴한 사용자',
      updated_at = now()
  where user_id = p_user;
end;
$$;

create or replace function public.taran_account_deletion_requires_manual_review(p_user uuid)
returns boolean
language sql
volatile
security definer
set search_path = public, storage, pg_catalog
set row_security = off
as $$
  select
    p_user is null
    or exists (
      select 1 from public.taran_admin_profiles profile
      where profile.user_id = p_user
    )
    or exists (
      select 1 from public.taran_customers customer
      where customer.id = p_user::text
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
      select 1 from public.taran_providers provider
      where provider.owner_user_id = p_user
    )
    or exists (
      select 1 from public.taran_provider_claims claim
      where claim.user_id = p_user
    )
    or exists (
      select 1 from public.taran_provider_registrations registration
      where registration.user_id = p_user
    )
    or exists (
      select 1 from public.taran_provider_change_requests change_request
      where change_request.requested_by = p_user
    )
    or exists (
      select 1 from public.taran_inquiry_responses response
      where response.provider_user_id = p_user
    )
    or exists (
      select 1 from public.taran_notification_jobs notification
      where notification.recipient_user_id = p_user
    )
    or exists (
      select 1 from public.taran_provider_review_events review_event
      where review_event.actor_user_id = p_user
    )
    or exists (
      select 1 from public.taran_inquiries inquiry
      where inquiry.user_id = p_user
        and (
          inquiry.contact <> '{}'::jsonb
          or inquiry.details <> '{}'::jsonb
        )
    )
    or exists (
      select 1 from public.taran_inquiry_groups inquiry_group
      where inquiry_group.user_id = p_user
        and (
          inquiry_group.contact <> '{}'::jsonb
          or inquiry_group.request_note is not null
        )
    )
    or exists (
      select 1 from public.taran_contributions contribution
      where contribution.user_id = p_user
        and (
          coalesce(cardinality(contribution.file_paths), 0) > 0
          or contribution.data <> jsonb_build_object('redacted', true)
        )
    )
    or exists (
      select 1 from public.taran_reviews review
      where review.user_id = p_user
        and review.author_name <> '탈퇴한 사용자'
    )
    or exists (
      select 1 from public.taran_community_posts post
      where post.user_id = p_user
        and post.author_name <> '탈퇴한 사용자'
    )
    or exists (
      select 1 from public.taran_community_comments comment_row
      where comment_row.user_id = p_user
        and comment_row.author_name <> '탈퇴한 사용자'
    )
    or exists (
      select 1 from public.taran_member_states state
      where state.user_id = p_user
    )
    or exists (
      select 1 from public.taran_saved_providers saved
      where saved.user_id = p_user
    )
    or exists (
      select 1 from public.taran_user_comparisons comparison
      where comparison.user_id = p_user
    )
    or exists (
      select 1 from public.taran_user_checklists checklist
      where checklist.user_id = p_user
    )
    or exists (
      select 1 from storage.objects object_row
      where object_row.bucket_id = 'taran-private-evidence'
        and (storage.foldername(object_row.name))[1] = p_user::text
    );
$$;

-- Replace migration 013's request RPC. The runtime configuration is
-- fail-closed and the tombstone is committed in the same transaction as the
-- initial cleanup.
create or replace function public.taran_request_account_deletion()
returns uuid
language plpgsql
security definer
set search_path = public, pg_catalog
set row_security = off
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
  v_existing_status text;
  v_max_inflight_write_seconds integer;
  v_buffer_seconds integer;
begin
  if v_user is null then
    raise exception 'Login is required to request account deletion.'
      using errcode = '42501';
  end if;

  select config.max_inflight_write_seconds, config.buffer_seconds
  into v_max_inflight_write_seconds, v_buffer_seconds
  from public.taran_account_deletion_runtime_config config
  where config.singleton
    and config.enabled
    and config.max_jwt_ttl_seconds is not null
    and config.max_inflight_write_seconds is not null
    and config.buffer_seconds is not null
    and config.buffer_seconds > config.max_inflight_write_seconds
    and config.verified_at is not null
    and config.verified_at <= now();

  if not found then
    raise exception 'Account deletion runtime configuration is not enabled.'
      using errcode = '55000';
  end if;

  select request.id, request.status
  into v_id, v_existing_status
  from public.taran_account_deletion_requests request
  where request.user_id = v_user
    and request.status in ('pending', 'processing')
  for update;

  if found and v_existing_status = 'processing' then
    raise exception 'Account deletion is already processing.'
      using errcode = '55000';
  elsif found then
    update public.taran_account_deletion_requests request
    set requested_at = now()
    where request.id = v_id;
  else
    begin
      insert into public.taran_account_deletion_requests (user_id, status)
      values (v_user, 'pending')
      returning id into v_id;
    exception
      when unique_violation then
        select request.id, request.status
        into v_id, v_existing_status
        from public.taran_account_deletion_requests request
        where request.user_id = v_user
          and request.status in ('pending', 'processing')
        for update;

        if not found or v_existing_status = 'processing' then
          raise exception 'Account deletion is already processing.'
            using errcode = '55000';
        end if;
    end;
  end if;

  begin
    insert into public.taran_account_deletion_tombstones (
      user_id, request_id, state, preflight_after
    ) values (
      v_user,
      v_id,
      'requested',
      now() + pg_catalog.make_interval(
        secs => v_max_inflight_write_seconds + v_buffer_seconds
      )
    );
  exception
    when unique_violation then
      if not exists (
        select 1
        from public.taran_account_deletion_tombstones tombstone
        where tombstone.user_id = v_user
          and tombstone.request_id = v_id
          and tombstone.state in ('requested', 'retry_wait')
      ) then
        raise exception 'An unresolved account deletion tombstone already exists.'
          using errcode = '55000';
      end if;
  end;

  perform public.taran_account_deletion_cleanup_user(v_user);
  return v_id;
end;
$$;

create or replace function public.taran_claim_account_deletion_job()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
set row_security = off
as $$
declare
  v_tombstone public.taran_account_deletion_tombstones;
  v_request public.taran_account_deletion_requests;
  v_claim_token uuid;
  v_attempt smallint;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Account deletion jobs require the service role.'
      using errcode = '42501';
  end if;

  -- Finalization is a separate claim after the access-JWT drain horizon.
  select tombstone.* into v_tombstone
  from public.taran_account_deletion_tombstones tombstone
  where tombstone.state in ('token_drain', 'finalizing')
    and tombstone.release_after <= now()
  order by tombstone.release_after, tombstone.created_at
  for update skip locked
  limit 1;

  if found then
    select request.* into v_request
    from public.taran_account_deletion_requests request
    where request.id = v_tombstone.request_id
    for update;

    if not found or v_request.claim_token is null then
      update public.taran_account_deletion_tombstones tombstone
      set state = 'blocked', updated_at = now()
      where tombstone.user_id = v_tombstone.user_id;
      return jsonb_build_object('action', 'blocked', 'code', 'manual_review_required');
    end if;

    update public.taran_account_deletion_tombstones tombstone
    set state = 'finalizing', updated_at = now()
    where tombstone.user_id = v_tombstone.user_id;

    return jsonb_build_object(
      'action', 'finalize',
      'claim_token', v_request.claim_token
    );
  end if;

  -- Recover the distributed gap where Auth was deleted but the Edge Function
  -- did not record auth_deleted_at.
  select tombstone.* into v_tombstone
  from public.taran_account_deletion_tombstones tombstone
  where tombstone.state = 'auth_deleting'
    and not exists (
      select 1 from auth.users auth_user
      where auth_user.id = tombstone.user_id
    )
  order by tombstone.created_at
  for update skip locked
  limit 1;

  if found then
    select request.* into v_request
    from public.taran_account_deletion_requests request
    where request.id = v_tombstone.request_id
      and request.claim_token is not null
    for update;

    if found then
      return jsonb_build_object(
        'action', 'mark_auth_deleted',
        'claim_token', v_request.claim_token
      );
    end if;

    update public.taran_account_deletion_tombstones tombstone
    set state = 'blocked', updated_at = now()
    where tombstone.user_id = v_tombstone.user_id;
    return jsonb_build_object('action', 'blocked', 'code', 'manual_review_required');
  end if;

  -- A worker can retry the same idempotent Auth deletion after its lease
  -- expired. No second non-identifying job row is created.
  select tombstone.* into v_tombstone
  from public.taran_account_deletion_tombstones tombstone
  where tombstone.state = 'auth_deleting'
    and exists (
      select 1
      from public.taran_account_deletion_requests request
      where request.id = tombstone.request_id
        and request.claim_token is not null
        and request.claim_expires_at <= now()
    )
  order by tombstone.created_at
  for update skip locked
  limit 1;

  if found then
    select request.* into v_request
    from public.taran_account_deletion_requests request
    where request.id = v_tombstone.request_id
    for update;

    update public.taran_account_deletion_requests request
    set claim_expires_at = now() + interval '5 minutes'
    where request.id = v_request.id;

    return jsonb_build_object(
      'action', 'delete',
      'claim_token', v_request.claim_token,
      'user_id', v_tombstone.user_id
    );
  end if;

  -- New requests wait for the configured buffer before preflight. This bounds
  -- statements that obtained an old snapshot immediately before the
  -- tombstone committed, without taking an advisory lock from a row trigger.
  select tombstone.* into v_tombstone
  from public.taran_account_deletion_tombstones tombstone
  where tombstone.state in ('requested', 'retry_wait')
    and tombstone.preflight_after <= now()
  order by tombstone.created_at
  for update skip locked
  limit 1;

  if found then
    select request.* into v_request
    from public.taran_account_deletion_requests request
    where request.id = v_tombstone.request_id
      and request.status = 'pending'
      and coalesce(request.next_attempt_at, request.requested_at) <= now()
    for update;

    if not found then
      update public.taran_account_deletion_tombstones tombstone
      set state = 'blocked', updated_at = now()
      where tombstone.user_id = v_tombstone.user_id;
      return jsonb_build_object('action', 'blocked', 'code', 'manual_review_required');
    end if;

    if v_request.attempt_count >= 3 then
      update public.taran_account_deletion_requests request
      set status = 'cancelled',
          last_error_code = 'retry_exhausted',
          claim_token = null,
          claim_expires_at = null,
          next_attempt_at = null
      where request.id = v_request.id;

      update public.taran_account_deletion_tombstones tombstone
      set state = 'blocked', updated_at = now()
      where tombstone.user_id = v_tombstone.user_id;

      return jsonb_build_object('action', 'blocked', 'code', 'retry_exhausted');
    end if;

    -- Repeat cleanup after the no-lock quiescence buffer, then fail closed on
    -- every privileged or raw dependency before Auth is touched.
    perform public.taran_account_deletion_cleanup_user(v_tombstone.user_id);

    if public.taran_account_deletion_requires_manual_review(v_tombstone.user_id) then
      v_claim_token := gen_random_uuid();
      v_attempt := least(3, greatest(1, v_request.attempt_count + 1));

      insert into public.taran_account_deletion_jobs (
        id, status, attempt_no, outcome_code, finished_at, purge_after
      ) values (
        v_claim_token, 'failed', v_attempt, 'manual_review_required',
        now(), now() + interval '1 year'
      );

      update public.taran_account_deletion_requests request
      set status = 'cancelled',
          attempt_count = v_attempt,
          last_error_code = 'manual_review_required',
          claim_token = null,
          claim_expires_at = null,
          next_attempt_at = null
      where request.id = v_request.id;

      update public.taran_account_deletion_tombstones tombstone
      set state = 'manual_review_required', updated_at = now()
      where tombstone.user_id = v_tombstone.user_id;

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

    update public.taran_account_deletion_tombstones tombstone
    set state = 'auth_deleting', updated_at = now()
    where tombstone.user_id = v_tombstone.user_id;

    insert into public.taran_account_deletion_jobs (
      id, status, attempt_no
    ) values (
      v_claim_token, 'processing', v_attempt
    );

    return jsonb_build_object(
      'action', 'delete',
      'claim_token', v_claim_token,
      'user_id', v_tombstone.user_id
    );
  end if;

  if exists (
    select 1
    from public.taran_account_deletion_tombstones tombstone
    where tombstone.state in (
      'requested', 'retry_wait', 'auth_deleting', 'token_drain', 'finalizing'
    )
  ) then
    return jsonb_build_object('action', 'wait', 'code', 'token_drain');
  end if;

  return null;
end;
$$;

create or replace function public.taran_mark_account_deletion_auth_deleted(
  p_claim_token uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
set row_security = off
as $$
declare
  v_tombstone public.taran_account_deletion_tombstones;
  v_request public.taran_account_deletion_requests;
  v_max_jwt_ttl_seconds integer;
  v_buffer_seconds integer;
  v_deleted_at timestamptz;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Account deletion jobs require the service role.'
      using errcode = '42501';
  end if;

  select tombstone.* into v_tombstone
  from public.taran_account_deletion_tombstones tombstone
  join public.taran_account_deletion_requests request
    on request.id = tombstone.request_id
  where request.claim_token = p_claim_token
  for update of tombstone;

  if not found then
    raise exception 'Account deletion tombstone is unavailable.'
      using errcode = '22023';
  end if;

  select request.* into v_request
  from public.taran_account_deletion_requests request
  where request.id = v_tombstone.request_id
  for update;

  if v_tombstone.state in ('token_drain', 'finalizing') then
    return jsonb_build_object('status', 'token_drain');
  end if;

  if v_tombstone.state <> 'auth_deleting' then
    raise exception 'Account deletion is not waiting for Auth deletion.'
      using errcode = '55000';
  end if;

  if exists (
    select 1 from auth.users auth_user
    where auth_user.id = v_tombstone.user_id
  ) then
    raise exception 'Auth deletion is not confirmed.'
      using errcode = '55000';
  end if;

  select config.max_jwt_ttl_seconds, config.buffer_seconds
  into v_max_jwt_ttl_seconds, v_buffer_seconds
  from public.taran_account_deletion_runtime_config config
  where config.singleton
    and config.enabled
    and config.max_jwt_ttl_seconds is not null
    and config.max_inflight_write_seconds is not null
    and config.buffer_seconds is not null
    and config.buffer_seconds > config.max_inflight_write_seconds
    and config.verified_at is not null
    and config.verified_at <= now();

  if not found then
    raise exception 'Account deletion runtime configuration is not enabled.'
      using errcode = '55000';
  end if;

  v_deleted_at := coalesce(v_tombstone.auth_deleted_at, now());

  update public.taran_account_deletion_tombstones tombstone
  set state = 'token_drain',
      auth_deleted_at = v_deleted_at,
      release_after = v_deleted_at + pg_catalog.make_interval(
        secs => v_max_jwt_ttl_seconds + v_buffer_seconds
      ),
      updated_at = now()
  where tombstone.user_id = v_tombstone.user_id;

  update public.taran_account_deletion_requests request
  set claim_expires_at = null
  where request.id = v_request.id;

  return jsonb_build_object('status', 'token_drain');
end;
$$;

create or replace function public.taran_finalize_account_deletion_job(
  p_claim_token uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
set row_security = off
as $$
declare
  v_tombstone public.taran_account_deletion_tombstones;
  v_request public.taran_account_deletion_requests;
  v_job public.taran_account_deletion_jobs;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Account deletion jobs require the service role.'
      using errcode = '42501';
  end if;

  select tombstone.* into v_tombstone
  from public.taran_account_deletion_tombstones tombstone
  join public.taran_account_deletion_requests request
    on request.id = tombstone.request_id
  where request.claim_token = p_claim_token
  for update of tombstone;

  if not found then
    select job.* into v_job
    from public.taran_account_deletion_jobs job
    where job.id = p_claim_token;

    if found and v_job.status = 'completed' then
      return jsonb_build_object('status', 'already_completed');
    end if;

    raise exception 'Account deletion tombstone is unavailable.'
      using errcode = '22023';
  end if;

  select request.* into v_request
  from public.taran_account_deletion_requests request
  where request.id = v_tombstone.request_id
  for update;

  select job.* into v_job
  from public.taran_account_deletion_jobs job
  where job.id = p_claim_token
  for update;

  if not found or v_job.status <> 'processing' then
    raise exception 'Account deletion job is not processing.'
      using errcode = '22023';
  end if;

  if v_tombstone.state not in ('token_drain', 'finalizing')
    or v_tombstone.auth_deleted_at is null
    or v_tombstone.release_after is null
    or v_tombstone.release_after > now() then
    raise exception 'The stale JWT drain period is not complete.'
      using errcode = '55000';
  end if;

  if exists (
    select 1 from auth.users auth_user
    where auth_user.id = v_tombstone.user_id
  ) then
    raise exception 'Auth deletion is not confirmed.'
      using errcode = '55000';
  end if;

  update public.taran_account_deletion_tombstones tombstone
  set state = 'finalizing', updated_at = now()
  where tombstone.user_id = v_tombstone.user_id;

  -- One final cleanup and fail-closed scan run after every access JWT that
  -- could have been issued before Auth deletion has expired.
  perform public.taran_account_deletion_cleanup_user(v_tombstone.user_id);

  if public.taran_account_deletion_requires_manual_review(v_tombstone.user_id) then
    update public.taran_account_deletion_jobs job
    set status = 'failed',
        outcome_code = 'manual_review_required',
        finished_at = now(),
        purge_after = now() + interval '1 year'
    where job.id = p_claim_token;

    update public.taran_account_deletion_requests request
    set status = 'cancelled',
        last_error_code = 'manual_review_required',
        claim_expires_at = null,
        next_attempt_at = null
    where request.id = v_request.id;

    update public.taran_account_deletion_tombstones tombstone
    set state = 'manual_review_required', updated_at = now()
    where tombstone.user_id = v_tombstone.user_id;

    return jsonb_build_object(
      'status', 'blocked',
      'code', 'manual_review_required'
    );
  end if;

  update public.taran_account_deletion_jobs job
  set status = 'completed',
      outcome_code = 'auth_deleted',
      finished_at = now(),
      purge_after = now() + interval '1 year'
  where job.id = p_claim_token;

  delete from public.taran_account_deletion_requests request
  where request.id = v_request.id;

  delete from public.taran_account_deletion_tombstones tombstone
  where tombstone.user_id = v_tombstone.user_id
    and tombstone.request_id = v_tombstone.request_id
    and tombstone.release_after <= now();

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
set row_security = off
as $$
declare
  v_tombstone public.taran_account_deletion_tombstones;
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

  select tombstone.* into v_tombstone
  from public.taran_account_deletion_tombstones tombstone
  join public.taran_account_deletion_requests request
    on request.id = tombstone.request_id
  where request.claim_token = p_claim_token
  for update of tombstone;

  if not found then
    raise exception 'Account deletion tombstone is unavailable.'
      using errcode = '22023';
  end if;

  select request.* into v_request
  from public.taran_account_deletion_requests request
  where request.id = v_tombstone.request_id
  for update;

  select job.* into v_job
  from public.taran_account_deletion_jobs job
  where job.id = p_claim_token
  for update;

  if not found then
    raise exception 'Account deletion job is unavailable.'
      using errcode = '22023';
  end if;

  if not exists (
    select 1 from auth.users auth_user
    where auth_user.id = v_tombstone.user_id
  ) then
    return jsonb_build_object('status', 'mark_required');
  end if;

  if v_job.status = 'completed' then
    return jsonb_build_object('status', 'already_completed');
  elsif v_job.status = 'failed' then
    return jsonb_build_object('status', 'already_failed');
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

  update public.taran_account_deletion_tombstones tombstone
  set state = case when v_terminal then 'blocked' else 'retry_wait' end,
      updated_at = now()
  where tombstone.user_id = v_tombstone.user_id;

  return jsonb_build_object(
    'status', case
      when v_terminal then 'retry_exhausted'
      else 'retry_scheduled'
    end
  );
end;
$$;

-- The migration 013 completion contract could remove the request immediately
-- after Auth deletion. Disable it so a stale deployed worker fails closed
-- during the separately approved rollout rather than bypassing token_drain.
create or replace function public.taran_complete_account_deletion_job(
  p_claim_token uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  raise exception 'Legacy account deletion completion is disabled; token drain is required.'
    using errcode = '55000';
end;
$$;

revoke all on function public.taran_account_deletion_cleanup_user(uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.taran_account_deletion_requires_manual_review(uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.taran_account_deletion_is_active(uuid)
  from public, anon, authenticated;
revoke all on function public.taran_account_deletion_self_is_active()
  from public, anon, authenticated;
grant execute on function public.taran_account_deletion_self_is_active()
  to authenticated;
revoke all on function public.taran_guard_account_deletion_user_write()
  from public, anon, authenticated;
revoke all on function public.taran_guard_account_deletion_evidence_write()
  from public, anon, authenticated;
revoke all on function public.taran_guard_account_deletion_auth_metadata()
  from public, anon, authenticated;

revoke all on function public.taran_request_account_deletion()
  from public, anon;
grant execute on function public.taran_request_account_deletion()
  to authenticated;

revoke all on function public.taran_claim_account_deletion_job()
  from public, anon, authenticated;
revoke all on function public.taran_mark_account_deletion_auth_deleted(uuid)
  from public, anon, authenticated;
revoke all on function public.taran_finalize_account_deletion_job(uuid)
  from public, anon, authenticated;
revoke all on function public.taran_fail_account_deletion_job(uuid, text)
  from public, anon, authenticated;
revoke all on function public.taran_complete_account_deletion_job(uuid)
  from public, anon, authenticated, service_role;

grant execute on function public.taran_claim_account_deletion_job()
  to service_role;
grant execute on function public.taran_mark_account_deletion_auth_deleted(uuid)
  to service_role;
grant execute on function public.taran_finalize_account_deletion_job(uuid)
  to service_role;
grant execute on function public.taran_fail_account_deletion_job(uuid, text)
  to service_role;

-- All migration 013 references were replaced above. Removing these helpers is
-- a static guarantee that the deletion guard cannot regress to row/advisory
-- lock ordering.
drop function if exists public.taran_lock_account_deletion_auth_delete();
drop function if exists public.taran_account_deletion_lock_user(uuid);
