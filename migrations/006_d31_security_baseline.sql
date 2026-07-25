-- D-31 isolated E2E security baseline corrections.
-- Run after 005_sonpum_brand_and_event_types.sql.
-- Additive/idempotent: replaces functions and policies without rewriting prior migrations.

-- "content" remains authorized through content-specific policies, but is not a
-- general administrator for customer, inquiry, contribution, point, or evidence data.
create or replace function public.taran_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.taran_admin_profiles
    where user_id = auth.uid()
      and role in ('owner', 'admin', 'operations')
  );
$$;

create or replace function public.taran_customer_owns_inquiry_group(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.taran_inquiry_groups inquiry_group
    where inquiry_group.id = p_group_id
      and inquiry_group.user_id = auth.uid()
  );
$$;

create or replace function public.taran_provider_owns_recipient(p_recipient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.taran_inquiry_recipients recipient
    join public.taran_providers provider on provider.id = recipient.provider_id
    where recipient.id = p_recipient_id
      and provider.owner_user_id = auth.uid()
  );
$$;

create or replace function public.taran_provider_owns_inquiry_group(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.taran_inquiry_recipients recipient
    join public.taran_providers provider on provider.id = recipient.provider_id
    where recipient.inquiry_group_id = p_group_id
      and provider.owner_user_id = auth.uid()
  );
$$;

revoke all on function public.taran_customer_owns_inquiry_group(uuid) from public;
revoke all on function public.taran_provider_owns_recipient(uuid) from public;
revoke all on function public.taran_provider_owns_inquiry_group(uuid) from public;
grant execute on function public.taran_customer_owns_inquiry_group(uuid) to authenticated;
grant execute on function public.taran_provider_owns_recipient(uuid) to authenticated;
grant execute on function public.taran_provider_owns_inquiry_group(uuid) to authenticated;

drop policy if exists "providers read assigned inquiry groups" on public.taran_inquiry_groups;
create policy "providers read assigned inquiry groups"
on public.taran_inquiry_groups for select
to authenticated
using (public.taran_provider_owns_inquiry_group(taran_inquiry_groups.id));

drop policy if exists "users read own inquiry recipients" on public.taran_inquiry_recipients;
create policy "users read own inquiry recipients"
on public.taran_inquiry_recipients for select
to authenticated
using (public.taran_customer_owns_inquiry_group(taran_inquiry_recipients.inquiry_group_id));

drop policy if exists "providers read assigned inquiry recipients" on public.taran_inquiry_recipients;
create policy "providers read assigned inquiry recipients"
on public.taran_inquiry_recipients for select
to authenticated
using (public.taran_provider_owns_recipient(taran_inquiry_recipients.id));

-- Provider state changes must go through the narrow security-definer RPCs.
drop policy if exists "providers update assigned inquiry recipients" on public.taran_inquiry_recipients;
revoke update on public.taran_inquiry_recipients from anon, authenticated;

drop policy if exists "customers read responses to own inquiries" on public.taran_inquiry_responses;
create policy "customers read responses to own inquiries"
on public.taran_inquiry_responses for select
to authenticated
using (
  exists (
    select 1
    from public.taran_inquiry_recipients recipient
    where recipient.id = taran_inquiry_responses.inquiry_recipient_id
      and public.taran_customer_owns_inquiry_group(recipient.inquiry_group_id)
  )
);

drop policy if exists "providers manage own inquiry responses" on public.taran_inquiry_responses;
create policy "providers manage own inquiry responses"
on public.taran_inquiry_responses for all
to authenticated
using (
  taran_inquiry_responses.provider_user_id = auth.uid()
  and public.taran_provider_owns_recipient(taran_inquiry_responses.inquiry_recipient_id)
)
with check (
  taran_inquiry_responses.provider_user_id = auth.uid()
  and public.taran_provider_owns_recipient(taran_inquiry_responses.inquiry_recipient_id)
);

-- RLS is only evaluated after the role has the corresponding table privilege.
-- Grant the narrow operations used by the signed-in account/provider screens.
grant select on public.taran_inquiry_groups to authenticated;
grant select on public.taran_inquiry_recipients to authenticated;
grant select, insert, update, delete on public.taran_inquiry_responses to authenticated;
grant select on public.taran_provider_registrations to authenticated;
grant select, insert, delete on public.taran_user_comparisons to authenticated;
grant select, insert, update, delete on public.taran_user_checklists to authenticated;

create or replace function public.taran_apply_marketplace_maintenance()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expired_count integer := 0;
  v_stale_count integer := 0;
  v_unowned_count integer := 0;
begin
  if coalesce(auth.role(), '') <> 'service_role'
    and not public.taran_has_role(array['owner','admin','operations']) then
    raise exception 'Marketplace maintenance requires an operations role.'
      using errcode = '42501';
  end if;

  update public.taran_inquiry_recipients recipient
  set status = 'expired'
  where recipient.status in ('sent', 'viewed')
    and recipient.expires_at <= now();
  get diagnostics v_expired_count = row_count;

  update public.taran_providers provider
  set inquiry_enabled = false
  where provider.inquiry_enabled = true
    and coalesce(provider.last_verified_at, provider.updated_at) < now() - interval '180 days';
  get diagnostics v_stale_count = row_count;

  update public.taran_providers provider
  set inquiry_enabled = false
  where provider.inquiry_enabled = true
    and provider.owner_user_id is null;
  get diagnostics v_unowned_count = row_count;

  update public.taran_inquiry_groups inquiry_group
  set status = 'answered', updated_at = now()
  where inquiry_group.status in ('submitted', 'checking')
    and exists (
      select 1
      from public.taran_inquiry_recipients recipient
      where recipient.inquiry_group_id = inquiry_group.id
        and recipient.status = 'responded'
    );

  return jsonb_build_object(
    'expiredRecipients', v_expired_count,
    'staleProvidersDisabled', v_stale_count,
    'unownedProvidersDisabled', v_unowned_count,
    'processedAt', now()
  );
end;
$$;

revoke all on function public.taran_apply_marketplace_maintenance() from public, anon;
grant execute on function public.taran_apply_marketplace_maintenance() to authenticated, service_role;

-- This routine is trigger/service infrastructure, not a client RPC.
revoke all on function public.taran_recalculate_provider_response_metrics(text)
  from public, anon, authenticated;
grant execute on function public.taran_recalculate_provider_response_metrics(text)
  to service_role;

-- The legacy RPC changes the public provider row and verification timestamp
-- without review. Keep it unavailable until the change-request workflow exists.
revoke all on function public.taran_update_owned_provider(text, jsonb)
  from public, anon, authenticated;
grant execute on function public.taran_update_owned_provider(text, jsonb)
  to service_role;

create or replace function public.taran_submit_provider_registration(p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Login is required to submit a provider registration.'
      using errcode = '42501';
  end if;
  if nullif(trim(coalesce(p_payload->>'provider_name', '')), '') is null
    or nullif(trim(coalesce(p_payload->>'region', '')), '') is null then
    raise exception 'Provider name and region are required.'
      using errcode = '22023';
  end if;
  if coalesce(p_payload->>'consent_version', '') <> 'provider-registration-v1'
    or nullif(trim(coalesce(p_payload->>'owner_name', '')), '') is null
    or nullif(trim(coalesce(p_payload->>'owner_email', '')), '') is null then
    raise exception 'Contact details and the current privacy consent are required.'
      using errcode = '22023';
  end if;

  insert into public.taran_provider_registrations (user_id, data, document_path)
  values (
    auth.uid(),
    p_payload - 'document_path',
    nullif(left(coalesce(p_payload->>'document_path', ''), 500), '')
  )
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.taran_submit_provider_registration(jsonb) from public, anon;
grant execute on function public.taran_submit_provider_registration(jsonb) to authenticated;

create or replace function public.taran_create_inquiry_group(
  p_provider_ids text[],
  p_payload jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
  v_provider_ids text[];
begin
  if auth.uid() is null then
    raise exception 'Login is required to send an inquiry.'
      using errcode = '42501';
  end if;

  select array_agg(distinct provider_id)
  into v_provider_ids
  from unnest(coalesce(p_provider_ids, '{}')) provider_id
  where nullif(trim(provider_id), '') is not null;

  if coalesce(array_length(v_provider_ids, 1), 0) not between 1 and 3 then
    raise exception 'Select between one and three providers.'
      using errcode = '22023';
  end if;
  if nullif(trim(coalesce(p_payload->>'event_type', '')), '') is null
    or nullif(trim(coalesce(p_payload->>'region', '')), '') is null
    or coalesce((p_payload->>'guest_count')::integer, 0) <= 0 then
    raise exception 'Event type, region, and guest count are required.'
      using errcode = '22023';
  end if;
  if coalesce(p_payload->>'consent_version', '') <> 'inquiry-contact-v1'
    or nullif(trim(coalesce(p_payload#>>'{contact,name}', '')), '') is null
    or nullif(trim(coalesce(p_payload#>>'{contact,phone}', '')), '') is null
    or nullif(trim(coalesce(p_payload#>>'{contact,email}', '')), '') is null then
    raise exception 'Contact details and the current inquiry consent are required.'
      using errcode = '22023';
  end if;

  if (
    select count(*)
    from public.taran_providers
    where id = any(v_provider_ids)
      and status = 'published'
      and inquiry_enabled = true
      and owner_user_id is not null
  ) <> array_length(v_provider_ids, 1) then
    raise exception 'Every selected provider must be published, owned, and inquiry-enabled.'
      using errcode = '22023';
  end if;

  insert into public.taran_inquiry_groups (
    user_id, event_type, event_detail, event_date, date_flexible, region,
    guest_count, budget_min, budget_max, space_type, requirements,
    request_note, contact, status
  ) values (
    auth.uid(),
    left(trim(p_payload->>'event_type'), 60),
    nullif(left(trim(coalesce(p_payload->>'event_detail', '')), 100), ''),
    nullif(p_payload->>'event_date', '')::date,
    coalesce((p_payload->>'date_flexible')::boolean, false),
    left(trim(p_payload->>'region'), 120),
    (p_payload->>'guest_count')::integer,
    nullif(p_payload->>'budget_min', '')::integer,
    nullif(p_payload->>'budget_max', '')::integer,
    nullif(left(trim(coalesce(p_payload->>'space_type', '')), 80), ''),
    coalesce(p_payload->'requirements', '[]'::jsonb),
    nullif(left(trim(coalesce(p_payload->>'request_note', '')), 2000), ''),
    jsonb_build_object(
      'name', left(trim(p_payload#>>'{contact,name}'), 60),
      'phone', left(trim(p_payload#>>'{contact,phone}'), 30),
      'email', left(trim(p_payload#>>'{contact,email}'), 160),
      'consentVersion', 'inquiry-contact-v1',
      'consentedAt', now()
    ),
    'submitted'
  )
  returning id into v_group_id;

  insert into public.taran_inquiry_recipients (inquiry_group_id, provider_id)
  select v_group_id, provider_id from unnest(v_provider_ids) provider_id;

  return v_group_id;
end;
$$;

revoke all on function public.taran_create_inquiry_group(text[], jsonb) from public, anon;
grant execute on function public.taran_create_inquiry_group(text[], jsonb) to authenticated;

create or replace function public.taran_request_account_deletion()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
begin
  if v_user is null then
    raise exception 'Login is required to request account deletion.'
      using errcode = '42501';
  end if;

  insert into public.taran_account_deletion_requests (user_id, status)
  values (v_user, 'pending')
  on conflict (user_id, status)
  do update set requested_at = now()
  returning id into v_id;

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

revoke all on function public.taran_request_account_deletion() from public, anon;
grant execute on function public.taran_request_account_deletion() to authenticated;

drop policy if exists "users can read own evidence" on storage.objects;
create policy "users can read own evidence"
on storage.objects for select to authenticated
using (
  bucket_id = 'taran-private-evidence'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.taran_has_role(array['owner','admin','operations'])
  )
);

drop policy if exists "users can delete own evidence" on storage.objects;
drop policy if exists "operations can delete evidence" on storage.objects;
create policy "operations can delete evidence"
on storage.objects for delete to authenticated
using (
  bucket_id = 'taran-private-evidence'
  and public.taran_has_role(array['owner','admin','operations'])
);

-- Client-readable projections never expose Auth UUID ownership columns.
create or replace view public.taran_public_providers as
select
  provider.id,
  provider.data,
  provider.event_types,
  provider.service_regions,
  provider.minimum_guests,
  provider.maximum_guests,
  provider.minimum_guarantee,
  provider.adult_meal_price_min,
  provider.adult_meal_price_max,
  provider.child_meal_price,
  provider.rental_fee,
  provider.parking_count,
  provider.private_room,
  provider.wheelchair_accessible,
  provider.outside_food_policy,
  provider.outside_vendor_policy,
  provider.cancellation_summary,
  provider.profile_status,
  provider.profile_completeness,
  provider.last_verified_at,
  provider.inquiry_enabled,
  provider.response_rate,
  provider.average_response_minutes,
  provider.updated_at
from public.taran_providers provider
where provider.status = 'published';

revoke all on public.taran_providers from anon, authenticated;
revoke all on public.taran_public_providers from public;
grant select on public.taran_public_providers to anon, authenticated;

create or replace view public.taran_public_reviews as
select
  review.id,
  review.provider_id,
  review.rating,
  review.author_name,
  review.content,
  review.created_at,
  review.updated_at
from public.taran_reviews review
where review.status = 'published';

revoke all on public.taran_reviews from anon, authenticated;
revoke all on public.taran_public_reviews from public;
grant select on public.taran_public_reviews to anon, authenticated;
