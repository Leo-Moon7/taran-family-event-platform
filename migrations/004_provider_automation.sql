-- T'ARAN provider operations automation.
-- Run after migrations/003_marketplace_comparison_flow.sql.
-- This migration is additive and can be executed more than once.

alter table public.taran_inquiry_recipients
  alter column expires_at set default (now() + interval '24 hours');

create table if not exists public.taran_notification_jobs (
  id uuid primary key default gen_random_uuid(),
  provider_id text references public.taran_providers(id) on delete cascade,
  inquiry_recipient_id uuid references public.taran_inquiry_recipients(id) on delete cascade,
  recipient_user_id uuid references auth.users(id) on delete set null,
  event_type text not null
    check (event_type in ('inquiry_received', 'inquiry_reminder_12h', 'inquiry_expired')),
  channel text not null default 'web'
    check (channel in ('web', 'email')),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  scheduled_at timestamptz not null default now(),
  sent_at timestamptz,
  attempts integer not null default 0 check (attempts >= 0),
  error_message text,
  dedupe_key text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists taran_notification_jobs_due_idx
  on public.taran_notification_jobs(status, scheduled_at);
create index if not exists taran_notification_jobs_provider_idx
  on public.taran_notification_jobs(provider_id, created_at desc);

alter table public.taran_notification_jobs enable row level security;

drop policy if exists "providers read own notification jobs" on public.taran_notification_jobs;
create policy "providers read own notification jobs"
on public.taran_notification_jobs for select
using (
  exists (
    select 1
    from public.taran_providers provider
    where provider.id = taran_notification_jobs.provider_id
      and provider.owner_user_id = auth.uid()
  )
);

drop policy if exists "admins manage notification jobs" on public.taran_notification_jobs;
create policy "admins manage notification jobs"
on public.taran_notification_jobs for all
using (public.taran_has_role(array['owner', 'admin', 'operations']))
with check (public.taran_has_role(array['owner', 'admin', 'operations']));

create or replace function public.taran_provider_completeness(
  p_data jsonb,
  p_event_types text[],
  p_minimum_guests integer,
  p_maximum_guests integer,
  p_minimum_guarantee integer,
  p_meal_price integer,
  p_rental_fee integer,
  p_parking_count integer,
  p_outside_food_policy text,
  p_outside_vendor_policy text,
  p_cancellation_summary text
)
returns integer
language plpgsql
immutable
set search_path = public
as $$
declare
  v_data jsonb := coalesce(p_data, '{}'::jsonb);
  v_facts jsonb := coalesce(p_data->'detailFacts', '{}'::jsonb);
  v_score integer := 0;
begin
  if nullif(trim(coalesce(v_data->>'name', '')), '') is not null then
    v_score := v_score + 10;
  end if;
  if nullif(trim(coalesce(v_data->>'category', v_data->>'subcategory', '')), '') is not null then
    v_score := v_score + 5;
  end if;
  if nullif(trim(coalesce(v_data->>'region', '')), '') is not null
    and nullif(trim(coalesce(v_data->>'address', v_data->>'area', '')), '') is not null then
    v_score := v_score + 15;
  end if;
  if coalesce(array_length(p_event_types, 1), 0) > 0
    or jsonb_array_length(
      case when jsonb_typeof(v_data->'eventTags') = 'array' then v_data->'eventTags' else '[]'::jsonb end
    ) > 0 then
    v_score := v_score + 10;
  end if;
  if p_minimum_guests is not null
    or p_maximum_guests is not null
    or p_minimum_guarantee is not null
    or nullif(trim(coalesce(v_facts->>'적정 인원', v_facts->>'최대 수용인원', '')), '') is not null then
    v_score := v_score + 10;
  end if;
  if p_meal_price is not null
    or p_rental_fee is not null
    or nullif(trim(coalesce(v_data->>'price', v_facts->>'가격', v_facts->>'성인 식대', '')), '') is not null then
    v_score := v_score + 15;
  end if;
  if p_parking_count is not null
    or nullif(trim(coalesce(v_facts->>'주차', v_facts->>'주차 정보', '')), '') is not null then
    v_score := v_score + 10;
  end if;
  if nullif(trim(coalesce(p_outside_food_policy, v_facts->>'외부 음식', '')), '') is not null
    or nullif(trim(coalesce(p_outside_vendor_policy, v_facts->>'외부 업체 이용', '')), '') is not null then
    v_score := v_score + 5;
  end if;
  if nullif(trim(coalesce(p_cancellation_summary, v_facts->>'취소·환불', '')), '') is not null then
    v_score := v_score + 10;
  end if;
  if nullif(trim(coalesce(v_data->>'image', v_data->>'imageUrl', '')), '') is not null
    or jsonb_array_length(
      case when jsonb_typeof(v_data->'images') = 'array' then v_data->'images' else '[]'::jsonb end
    ) > 0 then
    v_score := v_score + 10;
  end if;
  return least(100, greatest(0, v_score));
end;
$$;

create or replace function public.taran_set_provider_profile_state()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.profile_completeness := public.taran_provider_completeness(
    new.data,
    new.event_types,
    new.minimum_guests,
    new.maximum_guests,
    new.minimum_guarantee,
    coalesce(new.adult_meal_price_min, new.adult_meal_price_max),
    new.rental_fee,
    new.parking_count,
    new.outside_food_policy,
    new.outside_vendor_policy,
    new.cancellation_summary
  );
  if new.owner_user_id is not null and new.profile_status = 'basic' then
    new.profile_status := 'claimed';
  end if;
  return new;
end;
$$;

drop trigger if exists taran_provider_profile_state_trigger on public.taran_providers;
create trigger taran_provider_profile_state_trigger
before insert or update of
  data, event_types, minimum_guests, maximum_guests, minimum_guarantee,
  adult_meal_price_min, adult_meal_price_max, rental_fee, parking_count,
  outside_food_policy, outside_vendor_policy, cancellation_summary, owner_user_id
on public.taran_providers
for each row execute function public.taran_set_provider_profile_state();

create or replace function public.taran_integer_from_text(p_value text)
returns integer
language sql
immutable
as $$
  select case
    when nullif(regexp_replace(coalesce(p_value, ''), '[^0-9]', '', 'g'), '') is null then null
    else least(
      2147483647,
      nullif(regexp_replace(coalesce(p_value, ''), '[^0-9]', '', 'g'), '')::bigint
    )::integer
  end;
$$;

create or replace function public.taran_jsonb_text_array(p_value jsonb)
returns text[]
language sql
immutable
as $$
  select coalesce(array_agg(left(trim(value), 100)) filter (where nullif(trim(value), '') is not null), '{}')
  from jsonb_array_elements_text(
    case when jsonb_typeof(p_value) = 'array' then p_value else '[]'::jsonb end
  ) item(value);
$$;

create or replace function public.taran_update_owned_provider(p_provider_id text, p_data jsonb)
returns public.taran_providers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_provider public.taran_providers;
  v_allowed jsonb;
  v_facts jsonb := coalesce(p_data->'detailFacts', '{}'::jsonb);
begin
  select provider_row.* into v_provider
  from public.taran_providers provider_row
  where provider_row.id = p_provider_id
    and provider_row.owner_user_id = auth.uid();

  if not found then
    raise exception '수정 권한이 있는 업체가 아닙니다.' using errcode = '42501';
  end if;

  v_allowed := jsonb_strip_nulls(jsonb_build_object(
    'name', p_data->'name',
    'category', p_data->'category',
    'subcategory', p_data->'subcategory',
    'region', p_data->'region',
    'area', p_data->'area',
    'address', p_data->'address',
    'price', p_data->'price',
    'priceLabel', p_data->'priceLabel',
    'eventTags', p_data->'eventTags',
    'tags', p_data->'tags',
    'images', p_data->'images',
    'detailFacts', p_data->'detailFacts'
  ));

  update public.taran_providers provider_row
  set data = provider_row.data || v_allowed,
      event_types = public.taran_jsonb_text_array(p_data->'eventTags'),
      service_regions = public.taran_jsonb_text_array(p_data->'serviceRegions'),
      minimum_guests = coalesce(
        public.taran_integer_from_text(p_data->>'minimumGuests'),
        public.taran_integer_from_text(v_facts->>'적정 인원')
      ),
      maximum_guests = coalesce(
        public.taran_integer_from_text(p_data->>'maximumGuests'),
        public.taran_integer_from_text(v_facts->>'최대 수용인원')
      ),
      minimum_guarantee = coalesce(
        public.taran_integer_from_text(p_data->>'minimumGuarantee'),
        public.taran_integer_from_text(v_facts->>'최소 보증 인원')
      ),
      adult_meal_price_min = public.taran_integer_from_text(p_data->>'adultMealPriceMin'),
      adult_meal_price_max = public.taran_integer_from_text(p_data->>'adultMealPriceMax'),
      rental_fee = public.taran_integer_from_text(p_data->>'rentalFee'),
      parking_count = public.taran_integer_from_text(p_data->>'parkingCount'),
      outside_food_policy = nullif(left(trim(coalesce(p_data->>'outsideFoodPolicy', v_facts->>'외부 음식', '')), 500), ''),
      outside_vendor_policy = nullif(left(trim(coalesce(p_data->>'outsideVendorPolicy', v_facts->>'외부 업체 이용', '')), 500), ''),
      cancellation_summary = nullif(left(trim(coalesce(p_data->>'cancellationSummary', v_facts->>'취소·환불', '')), 1000), ''),
      last_verified_at = now(),
      updated_by = auth.uid(),
      updated_at = now()
  where provider_row.id = p_provider_id
  returning provider_row.* into v_provider;

  return v_provider;
end;
$$;

revoke all on function public.taran_update_owned_provider(text, jsonb) from public;
grant execute on function public.taran_update_owned_provider(text, jsonb) to authenticated;

create or replace function public.taran_enqueue_inquiry_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_user_id uuid;
begin
  if tg_op = 'INSERT' then
    select provider.owner_user_id into v_owner_user_id
    from public.taran_providers provider
    where provider.id = new.provider_id;

    if v_owner_user_id is null then
      update public.taran_inquiry_recipients recipient
      set status = 'delivery_failed'
      where recipient.id = new.id;
      return new;
    end if;

    insert into public.taran_notification_jobs (
      provider_id, inquiry_recipient_id, recipient_user_id, event_type,
      channel, scheduled_at, dedupe_key
    ) values
      (
        new.provider_id, new.id, v_owner_user_id, 'inquiry_received',
        'web', new.sent_at, 'inquiry_received:' || new.id::text
      ),
      (
        new.provider_id, new.id, v_owner_user_id, 'inquiry_reminder_12h',
        'web', new.sent_at + interval '12 hours', 'inquiry_reminder_12h:' || new.id::text
      )
    on conflict (dedupe_key) do nothing;
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status then
    if new.status in ('responded', 'declined') then
      update public.taran_notification_jobs job
      set status = 'cancelled', updated_at = now()
      where job.inquiry_recipient_id = new.id
        and job.event_type = 'inquiry_reminder_12h'
        and job.status = 'pending';
    elsif new.status = 'expired' then
      select provider.owner_user_id into v_owner_user_id
      from public.taran_providers provider
      where provider.id = new.provider_id;

      insert into public.taran_notification_jobs (
        provider_id, inquiry_recipient_id, recipient_user_id, event_type,
        channel, scheduled_at, dedupe_key
      ) values (
        new.provider_id, new.id, v_owner_user_id, 'inquiry_expired',
        'web', now(), 'inquiry_expired:' || new.id::text
      )
      on conflict (dedupe_key) do nothing;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists taran_inquiry_notification_trigger on public.taran_inquiry_recipients;
create trigger taran_inquiry_notification_trigger
after insert or update of status
on public.taran_inquiry_recipients
for each row execute function public.taran_enqueue_inquiry_notifications();

create or replace function public.taran_recalculate_provider_response_metrics(p_provider_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer := 0;
  v_answered integer := 0;
  v_expired_90d integer := 0;
  v_rate numeric(5,2);
  v_average_minutes integer;
begin
  select
    count(*) filter (where recipient.status <> 'delivery_failed'),
    count(*) filter (where recipient.status in ('responded', 'declined')),
    count(*) filter (
      where recipient.status = 'expired'
        and recipient.sent_at >= now() - interval '90 days'
    ),
    round(
      avg(extract(epoch from (recipient.responded_at - recipient.sent_at)) / 60)
      filter (where recipient.responded_at is not null)
    )
  into v_total, v_answered, v_expired_90d, v_average_minutes
  from public.taran_inquiry_recipients recipient
  where recipient.provider_id = p_provider_id;

  v_rate := case when v_total > 0 then round((v_answered::numeric / v_total) * 100, 2) else null end;

  update public.taran_providers provider
  set response_rate = v_rate,
      average_response_minutes = v_average_minutes,
      inquiry_enabled = case
        when v_expired_90d >= 5 and coalesce(v_rate, 0) < 20 then false
        when coalesce(v_rate, 0) >= 30
          and provider.profile_completeness >= 60
          and coalesce(provider.last_verified_at, provider.updated_at) >= now() - interval '180 days'
          and provider.status = 'published' then true
        else provider.inquiry_enabled
      end
  where provider.id = p_provider_id;
end;
$$;

create or replace function public.taran_refresh_provider_response_metrics()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_provider_id text;
begin
  if tg_op = 'DELETE' then
    v_provider_id := old.provider_id;
  else
    v_provider_id := new.provider_id;
  end if;
  perform public.taran_recalculate_provider_response_metrics(v_provider_id);
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists taran_provider_response_metrics_trigger on public.taran_inquiry_recipients;
create trigger taran_provider_response_metrics_trigger
after insert or delete or update of status, responded_at
on public.taran_inquiry_recipients
for each row execute function public.taran_refresh_provider_response_metrics();

create or replace function public.taran_mark_inquiry_viewed(p_recipient_id uuid)
returns public.taran_inquiry_recipients
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient public.taran_inquiry_recipients;
begin
  update public.taran_inquiry_recipients recipient
  set status = case when recipient.status = 'sent' then 'viewed' else recipient.status end,
      viewed_at = coalesce(recipient.viewed_at, now())
  where recipient.id = p_recipient_id
    and recipient.status in ('sent', 'viewed')
    and exists (
      select 1
      from public.taran_providers provider
      where provider.id = recipient.provider_id
        and provider.owner_user_id = auth.uid()
    )
  returning recipient.* into v_recipient;

  if not found then
    raise exception '열람할 수 있는 문의가 아닙니다.' using errcode = '42501';
  end if;
  return v_recipient;
end;
$$;

revoke all on function public.taran_mark_inquiry_viewed(uuid) from public;
grant execute on function public.taran_mark_inquiry_viewed(uuid) to authenticated;

create or replace function public.taran_acknowledge_provider_notifications(p_provider_id text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
begin
  if not exists (
    select 1
    from public.taran_providers provider
    where provider.id = p_provider_id
      and provider.owner_user_id = auth.uid()
  ) then
    raise exception '알림을 확인할 수 있는 업체가 아닙니다.' using errcode = '42501';
  end if;

  update public.taran_notification_jobs job
  set status = 'sent',
      sent_at = now(),
      attempts = job.attempts + 1,
      updated_at = now()
  where job.provider_id = p_provider_id
    and job.channel = 'web'
    and job.status = 'pending'
    and job.scheduled_at <= now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.taran_acknowledge_provider_notifications(text) from public;
grant execute on function public.taran_acknowledge_provider_notifications(text) to authenticated;

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

revoke all on function public.taran_apply_marketplace_maintenance() from public;
grant execute on function public.taran_apply_marketplace_maintenance() to authenticated;

insert into public.taran_notification_jobs (
  provider_id, inquiry_recipient_id, recipient_user_id, event_type,
  channel, scheduled_at, dedupe_key
)
select
  recipient.provider_id,
  recipient.id,
  provider.owner_user_id,
  notification.event_type,
  'web',
  recipient.sent_at + notification.delay,
  notification.event_type || ':' || recipient.id::text
from public.taran_inquiry_recipients recipient
join public.taran_providers provider on provider.id = recipient.provider_id
cross join (
  values
    ('inquiry_received'::text, interval '0 hours'),
    ('inquiry_reminder_12h'::text, interval '12 hours')
) notification(event_type, delay)
where recipient.status in ('sent', 'viewed')
  and provider.owner_user_id is not null
on conflict (dedupe_key) do nothing;

update public.taran_inquiry_recipients recipient
set expires_at = least(recipient.expires_at, recipient.sent_at + interval '24 hours')
where recipient.status in ('sent', 'viewed')
  and recipient.expires_at > recipient.sent_at + interval '24 hours';

update public.taran_providers provider
set data = provider.data;

select public.taran_apply_marketplace_maintenance();
