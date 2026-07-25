-- Provider registration/change review and atomic inquiry response flow.
-- Run after 006_d31_security_baseline.sql.
-- Additive/idempotent and intended for isolated validation before any production use.

create table if not exists public.taran_provider_change_requests (
  id uuid primary key default gen_random_uuid(),
  provider_id text not null references public.taran_providers(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete cascade,
  requested_data jsonb not null,
  consent_version text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'withdrawn')),
  review_note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists taran_provider_change_one_pending_idx
  on public.taran_provider_change_requests(provider_id)
  where status = 'pending';

create index if not exists taran_provider_change_requester_idx
  on public.taran_provider_change_requests(requested_by, created_at desc);

create index if not exists taran_provider_change_review_idx
  on public.taran_provider_change_requests(status, created_at asc);

create table if not exists public.taran_provider_review_events (
  id uuid primary key default gen_random_uuid(),
  request_type text not null
    check (request_type in ('registration', 'provider_change', 'inquiry_response')),
  request_id uuid not null,
  provider_id text,
  action text not null
    check (action in ('submitted', 'approved', 'rejected', 'withdrawn', 'responded')),
  actor_user_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists taran_provider_review_events_request_idx
  on public.taran_provider_review_events(request_type, request_id, created_at desc);

alter table public.taran_provider_change_requests enable row level security;
alter table public.taran_provider_review_events enable row level security;

drop policy if exists "providers read own change requests"
  on public.taran_provider_change_requests;
create policy "providers read own change requests"
on public.taran_provider_change_requests for select
to authenticated
using (requested_by = auth.uid());

drop policy if exists "operations manage provider change requests"
  on public.taran_provider_change_requests;
create policy "operations manage provider change requests"
on public.taran_provider_change_requests for all
to authenticated
using (public.taran_has_role(array['owner','admin','operations']))
with check (public.taran_has_role(array['owner','admin','operations']));

drop policy if exists "operations read provider review events"
  on public.taran_provider_review_events;
create policy "operations read provider review events"
on public.taran_provider_review_events for select
to authenticated
using (public.taran_has_role(array['owner','admin','operations']));

grant select on public.taran_provider_change_requests to authenticated;
grant select on public.taran_provider_review_events to authenticated;
revoke insert, update, delete on public.taran_provider_change_requests
  from anon, authenticated;
revoke insert, update, delete on public.taran_provider_review_events
  from anon, authenticated;

create or replace function public.taran_provider_change_payload(p_data jsonb)
returns jsonb
language sql
immutable
set search_path = public
as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'name', p_data->'name',
    'category', p_data->'category',
    'subcategory', p_data->'subcategory',
    'region', p_data->'region',
    'area', p_data->'area',
    'address', p_data->'address',
    'phone', p_data->'phone',
    'website', p_data->'website',
    'price', p_data->'price',
    'priceLabel', p_data->'priceLabel',
    'eventTags', p_data->'eventTags',
    'tags', p_data->'tags',
    'images', p_data->'images',
    'detailFacts', p_data->'detailFacts',
    'serviceRegions', p_data->'serviceRegions',
    'minimumGuests', p_data->'minimumGuests',
    'maximumGuests', p_data->'maximumGuests',
    'minimumGuarantee', p_data->'minimumGuarantee',
    'adultMealPriceMin', p_data->'adultMealPriceMin',
    'adultMealPriceMax', p_data->'adultMealPriceMax',
    'rentalFee', p_data->'rentalFee',
    'parkingCount', p_data->'parkingCount',
    'outsideFoodPolicy', p_data->'outsideFoodPolicy',
    'outsideVendorPolicy', p_data->'outsideVendorPolicy',
    'cancellationSummary', p_data->'cancellationSummary'
  ));
$$;

revoke all on function public.taran_provider_change_payload(jsonb) from public;

create or replace function public.taran_submit_provider_change_request(
  p_provider_id text,
  p_data jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_allowed jsonb;
begin
  if auth.uid() is null then
    raise exception 'Login is required to submit a provider change.'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.taran_providers provider
    where provider.id = p_provider_id
      and provider.owner_user_id = auth.uid()
  ) then
    raise exception 'Only the provider owner can submit this change.'
      using errcode = '42501';
  end if;

  if coalesce(p_data->>'consent_version', '') <> 'provider-change-v1' then
    raise exception 'The current provider-change consent is required.'
      using errcode = '22023';
  end if;

  v_allowed := public.taran_provider_change_payload(p_data);
  if v_allowed = '{}'::jsonb then
    raise exception 'At least one supported provider field is required.'
      using errcode = '22023';
  end if;

  begin
    insert into public.taran_provider_change_requests (
      provider_id,
      requested_by,
      requested_data,
      consent_version
    ) values (
      p_provider_id,
      auth.uid(),
      v_allowed,
      'provider-change-v1'
    )
    returning id into v_id;
  exception
    when unique_violation then
      raise exception 'A pending provider change already exists.'
        using errcode = '23505';
  end;

  insert into public.taran_provider_review_events (
    request_type, request_id, provider_id, action, actor_user_id
  ) values (
    'provider_change', v_id, p_provider_id, 'submitted', auth.uid()
  );

  return v_id;
end;
$$;

revoke all on function public.taran_submit_provider_change_request(text, jsonb)
  from public, anon;
grant execute on function public.taran_submit_provider_change_request(text, jsonb)
  to authenticated;

create or replace function public.taran_withdraw_provider_change_request(p_request_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.taran_provider_change_requests;
begin
  update public.taran_provider_change_requests request
  set status = 'withdrawn',
      updated_at = now()
  where request.id = p_request_id
    and request.requested_by = auth.uid()
    and request.status = 'pending'
  returning request.* into v_request;

  if not found then
    raise exception 'Only the requester can withdraw a pending change.'
      using errcode = '42501';
  end if;

  insert into public.taran_provider_review_events (
    request_type, request_id, provider_id, action, actor_user_id
  ) values (
    'provider_change', v_request.id, v_request.provider_id, 'withdrawn', auth.uid()
  );

  return v_request.id;
end;
$$;

revoke all on function public.taran_withdraw_provider_change_request(uuid)
  from public, anon;
grant execute on function public.taran_withdraw_provider_change_request(uuid)
  to authenticated;

create or replace function public.taran_review_provider_change_request(
  p_request_id uuid,
  p_approve boolean,
  p_review_note text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.taran_provider_change_requests;
  v_data jsonb;
begin
  if not public.taran_has_role(array['owner','admin','operations']) then
    raise exception 'Provider review requires an operations role.'
      using errcode = '42501';
  end if;

  select request.* into v_request
  from public.taran_provider_change_requests request
  where request.id = p_request_id
  for update;

  if not found or v_request.status <> 'pending' then
    raise exception 'The provider change is not pending.'
      using errcode = '22023';
  end if;

  if not p_approve then
    update public.taran_provider_change_requests
    set status = 'rejected',
        review_note = nullif(left(trim(coalesce(p_review_note, '')), 1000), ''),
        reviewed_by = auth.uid(),
        reviewed_at = now(),
        updated_at = now()
    where id = v_request.id;

    insert into public.taran_provider_review_events (
      request_type, request_id, provider_id, action, actor_user_id
    ) values (
      'provider_change', v_request.id, v_request.provider_id, 'rejected', auth.uid()
    );

    return v_request.provider_id;
  end if;

  v_data := v_request.requested_data;

  update public.taran_providers provider
  set data = provider.data || v_data,
      event_types = case
        when v_data ? 'eventTags'
          then public.taran_jsonb_text_array(v_data->'eventTags')
        else provider.event_types
      end,
      service_regions = case
        when v_data ? 'serviceRegions'
          then public.taran_jsonb_text_array(v_data->'serviceRegions')
        else provider.service_regions
      end,
      minimum_guests = case
        when v_data ? 'minimumGuests'
          then public.taran_integer_from_text(v_data->>'minimumGuests')
        else provider.minimum_guests
      end,
      maximum_guests = case
        when v_data ? 'maximumGuests'
          then public.taran_integer_from_text(v_data->>'maximumGuests')
        else provider.maximum_guests
      end,
      minimum_guarantee = case
        when v_data ? 'minimumGuarantee'
          then public.taran_integer_from_text(v_data->>'minimumGuarantee')
        else provider.minimum_guarantee
      end,
      adult_meal_price_min = case
        when v_data ? 'adultMealPriceMin'
          then public.taran_integer_from_text(v_data->>'adultMealPriceMin')
        else provider.adult_meal_price_min
      end,
      adult_meal_price_max = case
        when v_data ? 'adultMealPriceMax'
          then public.taran_integer_from_text(v_data->>'adultMealPriceMax')
        else provider.adult_meal_price_max
      end,
      rental_fee = case
        when v_data ? 'rentalFee'
          then public.taran_integer_from_text(v_data->>'rentalFee')
        else provider.rental_fee
      end,
      parking_count = case
        when v_data ? 'parkingCount'
          then public.taran_integer_from_text(v_data->>'parkingCount')
        else provider.parking_count
      end,
      outside_food_policy = case
        when v_data ? 'outsideFoodPolicy'
          then nullif(left(trim(v_data->>'outsideFoodPolicy'), 500), '')
        else provider.outside_food_policy
      end,
      outside_vendor_policy = case
        when v_data ? 'outsideVendorPolicy'
          then nullif(left(trim(v_data->>'outsideVendorPolicy'), 500), '')
        else provider.outside_vendor_policy
      end,
      cancellation_summary = case
        when v_data ? 'cancellationSummary'
          then nullif(left(trim(v_data->>'cancellationSummary'), 1000), '')
        else provider.cancellation_summary
      end,
      last_verified_at = now(),
      updated_by = auth.uid(),
      updated_at = now()
  where provider.id = v_request.provider_id;

  if not found then
    raise exception 'The provider no longer exists.'
      using errcode = '23503';
  end if;

  update public.taran_provider_change_requests
  set status = 'approved',
      review_note = nullif(left(trim(coalesce(p_review_note, '')), 1000), ''),
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = v_request.id;

  insert into public.taran_provider_review_events (
    request_type, request_id, provider_id, action, actor_user_id
  ) values (
    'provider_change', v_request.id, v_request.provider_id, 'approved', auth.uid()
  );

  return v_request.provider_id;
end;
$$;

revoke all on function public.taran_review_provider_change_request(uuid, boolean, text)
  from public, anon;
grant execute on function public.taran_review_provider_change_request(uuid, boolean, text)
  to authenticated;

create or replace function public.taran_review_provider_registration(
  p_registration_id uuid,
  p_approve boolean,
  p_review_note text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_registration public.taran_provider_registrations;
  v_data jsonb;
  v_provider_id text;
  v_provider_data jsonb;
begin
  if not public.taran_has_role(array['owner','admin','operations']) then
    raise exception 'Provider registration review requires an operations role.'
      using errcode = '42501';
  end if;

  select registration.* into v_registration
  from public.taran_provider_registrations registration
  where registration.id = p_registration_id
  for update;

  if not found or v_registration.status <> 'pending' then
    raise exception 'The provider registration is not pending.'
      using errcode = '22023';
  end if;

  if not p_approve then
    update public.taran_provider_registrations
    set status = 'rejected',
        reviewed_by = auth.uid(),
        reviewed_at = now(),
        updated_at = now(),
        data = data || jsonb_build_object(
          'review_note',
          nullif(left(trim(coalesce(p_review_note, '')), 1000), '')
        )
    where id = v_registration.id;

    insert into public.taran_provider_review_events (
      request_type, request_id, action, actor_user_id
    ) values (
      'registration', v_registration.id, 'rejected', auth.uid()
    );

    return null;
  end if;

  v_data := v_registration.data;
  v_provider_id := coalesce(
    nullif(left(trim(v_data->>'id'), 120), ''),
    'registered-' || replace(v_registration.id::text, '-', '')
  );

  v_provider_data := jsonb_strip_nulls(jsonb_build_object(
    'name', coalesce(v_data->'name', v_data->'provider_name'),
    'category', coalesce(v_data->'industry', '"업체"'::jsonb),
    'address', coalesce(v_data->'address', v_data->'region'),
    'phone', v_data->'phone',
    'website', coalesce(v_data->'official_link', v_data->'website'),
    'eventTags', coalesce(v_data->'event_tags', '[]'::jsonb),
    'ownerRegistered', true,
    'informationCheckedAt', to_char(current_date, 'YYYY-MM-DD')
  ));

  insert into public.taran_providers (
    id,
    data,
    status,
    owner_user_id,
    profile_status,
    event_types,
    minimum_guests,
    maximum_guests,
    minimum_guarantee,
    adult_meal_price_min,
    rental_fee,
    parking_count,
    last_verified_at,
    inquiry_enabled,
    updated_by,
    updated_at
  ) values (
    v_provider_id,
    v_provider_data,
    'published',
    v_registration.user_id,
    'claimed',
    public.taran_jsonb_text_array(v_data->'event_tags'),
    public.taran_integer_from_text(v_data->>'minimum_guests'),
    public.taran_integer_from_text(v_data->>'maximum_guests'),
    public.taran_integer_from_text(v_data->>'minimum_guarantee'),
    public.taran_integer_from_text(v_data->>'adult_meal_price_min'),
    public.taran_integer_from_text(v_data->>'rental_fee'),
    public.taran_integer_from_text(v_data->>'parking_count'),
    now(),
    false,
    auth.uid(),
    now()
  );

  update public.taran_provider_registrations
  set status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now(),
      data = data || jsonb_build_object(
        'approved_provider_id', v_provider_id,
        'review_note', nullif(left(trim(coalesce(p_review_note, '')), 1000), '')
      )
  where id = v_registration.id;

  insert into public.taran_provider_review_events (
    request_type, request_id, provider_id, action, actor_user_id
  ) values (
    'registration', v_registration.id, v_provider_id, 'approved', auth.uid()
  );

  return v_provider_id;
end;
$$;

revoke all on function public.taran_review_provider_registration(uuid, boolean, text)
  from public, anon;
grant execute on function public.taran_review_provider_registration(uuid, boolean, text)
  to authenticated;

create or replace function public.taran_submit_inquiry_response(
  p_recipient_id uuid,
  p_payload jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient public.taran_inquiry_recipients;
  v_response_id uuid;
  v_available boolean;
begin
  if auth.uid() is null then
    raise exception 'Login is required to submit an inquiry response.'
      using errcode = '42501';
  end if;

  select recipient.* into v_recipient
  from public.taran_inquiry_recipients recipient
  join public.taran_providers provider on provider.id = recipient.provider_id
  where recipient.id = p_recipient_id
    and provider.owner_user_id = auth.uid()
    and recipient.status in ('sent', 'viewed')
    and recipient.expires_at > now()
  for update of recipient;

  if not found then
    raise exception 'The inquiry is not available to this provider.'
      using errcode = '42501';
  end if;

  if jsonb_typeof(p_payload->'available') <> 'boolean' then
    raise exception 'Availability is required.'
      using errcode = '22023';
  end if;
  v_available := (p_payload->>'available')::boolean;

  if coalesce((p_payload->>'estimated_price')::integer, 0) < 0
    or coalesce((p_payload->>'meal_price')::integer, 0) < 0
    or coalesce((p_payload->>'rental_fee')::integer, 0) < 0
    or coalesce((p_payload->>'minimum_guarantee')::integer, 0) < 0 then
    raise exception 'Response amounts cannot be negative.'
      using errcode = '22023';
  end if;

  insert into public.taran_inquiry_responses (
    inquiry_recipient_id,
    provider_user_id,
    available,
    estimated_price,
    meal_price,
    rental_fee,
    minimum_guarantee,
    included_items,
    extra_costs,
    response_note
  ) values (
    v_recipient.id,
    auth.uid(),
    v_available,
    nullif(p_payload->>'estimated_price', '')::integer,
    nullif(p_payload->>'meal_price', '')::integer,
    nullif(p_payload->>'rental_fee', '')::integer,
    nullif(p_payload->>'minimum_guarantee', '')::integer,
    public.taran_jsonb_text_array(p_payload->'included_items'),
    public.taran_jsonb_text_array(p_payload->'extra_costs'),
    nullif(left(trim(coalesce(p_payload->>'response_note', '')), 2000), '')
  )
  on conflict (inquiry_recipient_id) do update
  set available = excluded.available,
      estimated_price = excluded.estimated_price,
      meal_price = excluded.meal_price,
      rental_fee = excluded.rental_fee,
      minimum_guarantee = excluded.minimum_guarantee,
      included_items = excluded.included_items,
      extra_costs = excluded.extra_costs,
      response_note = excluded.response_note,
      updated_at = now()
  where public.taran_inquiry_responses.provider_user_id = auth.uid()
  returning id into v_response_id;

  if v_response_id is null then
    raise exception 'The response belongs to another provider.'
      using errcode = '42501';
  end if;

  update public.taran_inquiry_recipients
  set status = 'responded',
      viewed_at = coalesce(viewed_at, now()),
      responded_at = now()
  where id = v_recipient.id;

  insert into public.taran_provider_review_events (
    request_type, request_id, provider_id, action, actor_user_id
  ) values (
    'inquiry_response', v_recipient.id, v_recipient.provider_id, 'responded', auth.uid()
  );

  return v_response_id;
end;
$$;

revoke all on function public.taran_submit_inquiry_response(uuid, jsonb)
  from public, anon;
grant execute on function public.taran_submit_inquiry_response(uuid, jsonb)
  to authenticated;
