-- T'ARAN marketplace comparison and multi-provider inquiry flow.
-- Run after admin-schema.sql and migrations/002_security_hardening.sql.
-- This migration is additive and can be executed more than once.

alter table public.taran_providers add column if not exists event_types text[] not null default '{}';
alter table public.taran_providers add column if not exists service_regions text[] not null default '{}';
alter table public.taran_providers add column if not exists minimum_guests integer;
alter table public.taran_providers add column if not exists maximum_guests integer;
alter table public.taran_providers add column if not exists minimum_guarantee integer;
alter table public.taran_providers add column if not exists adult_meal_price_min integer;
alter table public.taran_providers add column if not exists adult_meal_price_max integer;
alter table public.taran_providers add column if not exists child_meal_price integer;
alter table public.taran_providers add column if not exists rental_fee integer;
alter table public.taran_providers add column if not exists parking_count integer;
alter table public.taran_providers add column if not exists private_room boolean;
alter table public.taran_providers add column if not exists wheelchair_accessible boolean;
alter table public.taran_providers add column if not exists outside_food_policy text;
alter table public.taran_providers add column if not exists outside_vendor_policy text;
alter table public.taran_providers add column if not exists cancellation_summary text;
alter table public.taran_providers add column if not exists profile_status text not null default 'basic';
alter table public.taran_providers add column if not exists profile_completeness integer not null default 0;
alter table public.taran_providers add column if not exists last_verified_at timestamptz;
alter table public.taran_providers add column if not exists inquiry_enabled boolean not null default false;
alter table public.taran_providers add column if not exists response_rate numeric(5,2);
alter table public.taran_providers add column if not exists average_response_minutes integer;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'taran_providers_profile_status_check'
  ) then
    alter table public.taran_providers
      add constraint taran_providers_profile_status_check
      check (profile_status in ('basic', 'claimed', 'verified'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'taran_providers_profile_completeness_check'
  ) then
    alter table public.taran_providers
      add constraint taran_providers_profile_completeness_check
      check (profile_completeness between 0 and 100);
  end if;
end $$;

create table if not exists public.taran_inquiry_groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  event_detail text,
  event_date date,
  date_flexible boolean not null default false,
  region text not null,
  guest_count integer not null check (guest_count > 0 and guest_count <= 5000),
  budget_min integer check (budget_min is null or budget_min >= 0),
  budget_max integer check (budget_max is null or budget_max >= 0),
  space_type text,
  requirements jsonb not null default '[]'::jsonb,
  request_note text,
  contact jsonb not null default '{}'::jsonb,
  status text not null default 'submitted'
    check (status in ('draft','submitted','checking','answered','consulting','closed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.taran_inquiry_recipients (
  id uuid primary key default gen_random_uuid(),
  inquiry_group_id uuid not null references public.taran_inquiry_groups(id) on delete cascade,
  provider_id text not null references public.taran_providers(id) on delete cascade,
  status text not null default 'sent'
    check (status in ('sent','viewed','responded','declined','expired','delivery_failed')),
  sent_at timestamptz not null default now(),
  viewed_at timestamptz,
  responded_at timestamptz,
  expires_at timestamptz not null default (now() + interval '72 hours'),
  unique (inquiry_group_id, provider_id)
);

create table if not exists public.taran_inquiry_responses (
  id uuid primary key default gen_random_uuid(),
  inquiry_recipient_id uuid not null references public.taran_inquiry_recipients(id) on delete cascade,
  provider_user_id uuid not null references auth.users(id) on delete cascade,
  available boolean not null,
  estimated_price integer check (estimated_price is null or estimated_price >= 0),
  meal_price integer check (meal_price is null or meal_price >= 0),
  rental_fee integer check (rental_fee is null or rental_fee >= 0),
  minimum_guarantee integer check (minimum_guarantee is null or minimum_guarantee >= 0),
  included_items text[] not null default '{}',
  extra_costs text[] not null default '{}',
  response_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (inquiry_recipient_id)
);

create table if not exists public.taran_provider_registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  document_path text,
  status text not null default 'pending'
    check (status in ('pending','approved','rejected','withdrawn')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.taran_user_comparisons (
  user_id uuid not null references auth.users(id) on delete cascade,
  provider_id text not null references public.taran_providers(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, provider_id)
);

create table if not exists public.taran_user_checklists (
  user_id uuid not null references auth.users(id) on delete cascade,
  checklist_key text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, checklist_key)
);

create index if not exists taran_provider_public_search_idx
  on public.taran_providers(status, profile_status, updated_at desc);
create index if not exists taran_inquiry_groups_user_created_idx
  on public.taran_inquiry_groups(user_id, created_at desc);
create index if not exists taran_inquiry_recipients_provider_status_idx
  on public.taran_inquiry_recipients(provider_id, status, sent_at desc);
create index if not exists taran_inquiry_recipients_group_idx
  on public.taran_inquiry_recipients(inquiry_group_id);
create index if not exists taran_provider_registrations_status_idx
  on public.taran_provider_registrations(status, created_at asc);

alter table public.taran_inquiry_groups enable row level security;
alter table public.taran_inquiry_recipients enable row level security;
alter table public.taran_inquiry_responses enable row level security;
alter table public.taran_provider_registrations enable row level security;
alter table public.taran_user_comparisons enable row level security;
alter table public.taran_user_checklists enable row level security;

drop policy if exists "users manage own inquiry groups" on public.taran_inquiry_groups;
create policy "users manage own inquiry groups"
on public.taran_inquiry_groups for select
using (auth.uid() = taran_inquiry_groups.user_id);

drop policy if exists "providers read assigned inquiry groups" on public.taran_inquiry_groups;
create policy "providers read assigned inquiry groups"
on public.taran_inquiry_groups for select
using (
  exists (
    select 1
    from public.taran_inquiry_recipients recipient
    join public.taran_providers provider on provider.id = recipient.provider_id
    where recipient.inquiry_group_id = taran_inquiry_groups.id
      and provider.owner_user_id = auth.uid()
  )
);

drop policy if exists "admins manage inquiry groups" on public.taran_inquiry_groups;
create policy "admins manage inquiry groups"
on public.taran_inquiry_groups for all
using (public.taran_has_role(array['owner','admin','operations']))
with check (public.taran_has_role(array['owner','admin','operations']));

drop policy if exists "users read own inquiry recipients" on public.taran_inquiry_recipients;
create policy "users read own inquiry recipients"
on public.taran_inquiry_recipients for select
using (
  exists (
    select 1 from public.taran_inquiry_groups inquiry_group
    where inquiry_group.id = taran_inquiry_recipients.inquiry_group_id
      and inquiry_group.user_id = auth.uid()
  )
);

drop policy if exists "providers read assigned inquiry recipients" on public.taran_inquiry_recipients;
create policy "providers read assigned inquiry recipients"
on public.taran_inquiry_recipients for select
using (
  exists (
    select 1 from public.taran_providers provider
    where provider.id = taran_inquiry_recipients.provider_id
      and provider.owner_user_id = auth.uid()
  )
);

drop policy if exists "providers update assigned inquiry recipients" on public.taran_inquiry_recipients;
create policy "providers update assigned inquiry recipients"
on public.taran_inquiry_recipients for update
using (
  exists (
    select 1 from public.taran_providers provider
    where provider.id = taran_inquiry_recipients.provider_id
      and provider.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.taran_providers provider
    where provider.id = taran_inquiry_recipients.provider_id
      and provider.owner_user_id = auth.uid()
  )
);

drop policy if exists "admins manage inquiry recipients" on public.taran_inquiry_recipients;
create policy "admins manage inquiry recipients"
on public.taran_inquiry_recipients for all
using (public.taran_has_role(array['owner','admin','operations']))
with check (public.taran_has_role(array['owner','admin','operations']));

drop policy if exists "customers read responses to own inquiries" on public.taran_inquiry_responses;
create policy "customers read responses to own inquiries"
on public.taran_inquiry_responses for select
using (
  exists (
    select 1
    from public.taran_inquiry_recipients recipient
    join public.taran_inquiry_groups inquiry_group on inquiry_group.id = recipient.inquiry_group_id
    where recipient.id = taran_inquiry_responses.inquiry_recipient_id
      and inquiry_group.user_id = auth.uid()
  )
);

drop policy if exists "providers manage own inquiry responses" on public.taran_inquiry_responses;
create policy "providers manage own inquiry responses"
on public.taran_inquiry_responses for all
using (taran_inquiry_responses.provider_user_id = auth.uid())
with check (
  taran_inquiry_responses.provider_user_id = auth.uid()
  and exists (
    select 1
    from public.taran_inquiry_recipients recipient
    join public.taran_providers provider on provider.id = recipient.provider_id
    where recipient.id = taran_inquiry_responses.inquiry_recipient_id
      and provider.owner_user_id = auth.uid()
  )
);

drop policy if exists "admins manage inquiry responses" on public.taran_inquiry_responses;
create policy "admins manage inquiry responses"
on public.taran_inquiry_responses for all
using (public.taran_has_role(array['owner','admin','operations']))
with check (public.taran_has_role(array['owner','admin','operations']));

drop policy if exists "users manage own provider registrations" on public.taran_provider_registrations;
create policy "users manage own provider registrations"
on public.taran_provider_registrations for select
using (taran_provider_registrations.user_id = auth.uid());

drop policy if exists "admins manage provider registrations" on public.taran_provider_registrations;
create policy "admins manage provider registrations"
on public.taran_provider_registrations for all
using (public.taran_has_role(array['owner','admin','operations']))
with check (public.taran_has_role(array['owner','admin','operations']));

drop policy if exists "users manage own comparisons" on public.taran_user_comparisons;
create policy "users manage own comparisons"
on public.taran_user_comparisons for all
using (taran_user_comparisons.user_id = auth.uid())
with check (taran_user_comparisons.user_id = auth.uid());

drop policy if exists "users manage own checklists" on public.taran_user_checklists;
create policy "users manage own checklists"
on public.taran_user_checklists for all
using (taran_user_checklists.user_id = auth.uid())
with check (taran_user_checklists.user_id = auth.uid());

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
    raise exception '견적 문의를 보내려면 로그인이 필요합니다.' using errcode = '42501';
  end if;

  select array_agg(distinct provider_id)
  into v_provider_ids
  from unnest(coalesce(p_provider_ids, '{}')) provider_id
  where nullif(trim(provider_id), '') is not null;

  if coalesce(array_length(v_provider_ids, 1), 0) not between 1 and 3 then
    raise exception '문의할 업체는 1곳 이상 3곳 이하로 선택해 주세요.';
  end if;
  if nullif(trim(coalesce(p_payload->>'event_type', '')), '') is null
    or nullif(trim(coalesce(p_payload->>'region', '')), '') is null
    or coalesce((p_payload->>'guest_count')::integer, 0) <= 0 then
    raise exception '행사 종류, 지역, 예상 인원을 확인해 주세요.';
  end if;

  if (
    select count(*)
    from public.taran_providers
    where id = any(v_provider_ids)
      and status = 'published'
      and inquiry_enabled = true
  ) <> array_length(v_provider_ids, 1) then
    raise exception '선택한 업체 중 현재 플랫폼 문의를 지원하지 않는 곳이 있습니다.';
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
    jsonb_strip_nulls(jsonb_build_object(
      'name', nullif(left(trim(coalesce(p_payload#>>'{contact,name}', '')), 60), ''),
      'phone', nullif(left(trim(coalesce(p_payload#>>'{contact,phone}', '')), 30), ''),
      'email', nullif(left(trim(coalesce(p_payload#>>'{contact,email}', '')), 160), '')
    )),
    'submitted'
  ) returning id into v_group_id;

  insert into public.taran_inquiry_recipients (inquiry_group_id, provider_id)
  select v_group_id, provider_id from unnest(v_provider_ids) provider_id;

  return v_group_id;
end;
$$;

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
    raise exception '업체를 등록하려면 로그인이 필요합니다.' using errcode = '42501';
  end if;
  if nullif(trim(coalesce(p_payload->>'provider_name', '')), '') is null
    or nullif(trim(coalesce(p_payload->>'region', '')), '') is null then
    raise exception '업체명과 지역을 입력해 주세요.';
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

revoke all on function public.taran_create_inquiry_group(text[], jsonb) from public;
grant execute on function public.taran_create_inquiry_group(text[], jsonb) to authenticated;
revoke all on function public.taran_submit_provider_registration(jsonb) from public;
grant execute on function public.taran_submit_provider_registration(jsonb) to authenticated;

-- Analytics events used by marketplace conversion funnels.
create or replace function public.taran_track_event(
  p_event_name text,
  p_page_path text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_existing uuid;
  v_session_id text := nullif(coalesce(p_metadata, '{}'::jsonb)->>'sessionId', '');
  v_action text := nullif(left(coalesce(p_metadata, '{}'::jsonb)->>'action', 40), '');
  v_metadata jsonb;
  v_allowed constant text[] := array[
    'page_view','search','provider_view','compare_provider_added','compare_started',
    'inquiry_started','inquiry_submitted','calculator_started','calculator_completed',
    'calculator_saved','calculator_shared','calculator_to_venues','calculator_to_inquiry',
    'checklist_created','checklist_task_completed','checklist_saved',
    'checklist_to_calculator','checklist_to_venues','checklist_to_inquiry',
    'provider_registration_submitted','provider_review_submitted'
  ];
begin
  if not (p_event_name = any(v_allowed)) then
    raise exception '허용되지 않은 통계 이벤트입니다.';
  end if;
  if char_length(coalesce(p_page_path, '')) > 240 then
    raise exception '화면 경로가 너무 깁니다.';
  end if;
  if v_session_id is not null
    and v_session_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    raise exception '통계 세션 값이 올바르지 않습니다.';
  end if;

  v_metadata := jsonb_strip_nulls(jsonb_build_object(
    'sessionId', v_session_id,
    'action', v_action
  ));

  if v_session_id is not null then
    select id into v_existing
    from public.taran_admin_events
    where event_name = p_event_name
      and coalesce(page_path, '') = coalesce(nullif(left(p_page_path, 240), ''), '')
      and metadata->>'sessionId' = v_session_id
      and created_at > now() - interval '30 minutes'
    order by created_at desc limit 1;
    if found then return v_existing; end if;
  end if;

  insert into public.taran_admin_events (event_name, page_path, metadata)
  values (p_event_name, nullif(left(p_page_path, 240), ''), v_metadata)
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.taran_track_event(text, text, jsonb) from public;
grant execute on function public.taran_track_event(text, text, jsonb) to anon, authenticated;
