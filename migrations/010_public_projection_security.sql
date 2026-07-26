-- Replace owner-privileged public views with RLS-protected projection tables.
-- Run after 009_admin_profile_self_access.sql.
-- The client resource names stay unchanged while direct base-table access stays denied.

create or replace function public.taran_public_provider_payload(p_data jsonb)
returns jsonb
language sql
immutable
set search_path = pg_catalog
as $$
  with top_level as (
    select coalesce(jsonb_object_agg(entry.key, entry.value), '{}'::jsonb) as value
    from jsonb_each(coalesce(p_data, '{}'::jsonb)) entry
    where entry.key = any (array[
      'name', 'category', 'subcategory', 'industry', 'description', 'intro',
      'region', 'area', 'address', 'roadAddress', 'phone', 'telephone',
      'website', 'officialLink', 'price', 'priceLabel', 'tags', 'serviceTags',
      'eventTags', 'serviceRegions', 'image', 'imageUrl', 'images',
      'ownerRegistered', 'informationCheckedAt', 'sourceStatus'
    ]::text[])
  ), public_facts as (
    select coalesce(jsonb_object_agg(entry.key, entry.value), '{}'::jsonb) as value
    from jsonb_each(
      case
        when jsonb_typeof(coalesce(p_data, '{}'::jsonb)->'detailFacts') = 'object'
          then coalesce(p_data, '{}'::jsonb)->'detailFacts'
        else '{}'::jsonb
      end
    ) entry
    where entry.key = any (array[
      '적정 인원', '권장 인원', '문의 가능 시간', '영업시간',
      '어린이 식대', '소인 식대', '패키지 가격', '상품 구성', '포함 항목',
      '주차', '주차 정보', '단독 공간', '룸·좌석',
      '외부 음식 허용 여부', '외부 음식',
      '외부 업체 이용 가능 여부', '외부 업체',
      '휠체어 접근', '접근 편의', '공간/서비스', '공간·시설',
      '취소·환불', '취소 환불', '취소 규정'
    ]::text[])
  )
  select top_level.value
    || case
      when public_facts.value = '{}'::jsonb then '{}'::jsonb
      else jsonb_build_object('detailFacts', public_facts.value)
    end
  from top_level cross join public_facts;
$$;

revoke all on function public.taran_public_provider_payload(jsonb) from public;
grant execute on function public.taran_public_provider_payload(jsonb) to service_role;

do $$
begin
  if exists (
    select 1
    from pg_class relation
    join pg_namespace namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relname = 'taran_public_providers'
      and relation.relkind = 'v'
  ) then
    execute 'drop view public.taran_public_providers';
  end if;
  if exists (
    select 1
    from pg_class relation
    join pg_namespace namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relname = 'taran_public_reviews'
      and relation.relkind = 'v'
  ) then
    execute 'drop view public.taran_public_reviews';
  end if;
end;
$$;

create table if not exists public.taran_public_providers (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  event_types text[] not null default '{}',
  service_regions text[] not null default '{}',
  minimum_guests integer,
  maximum_guests integer,
  minimum_guarantee integer,
  adult_meal_price_min integer,
  adult_meal_price_max integer,
  child_meal_price integer,
  rental_fee integer,
  parking_count integer,
  private_room boolean,
  wheelchair_accessible boolean,
  outside_food_policy text,
  outside_vendor_policy text,
  cancellation_summary text,
  profile_status text not null default 'basic',
  profile_completeness integer not null default 0,
  last_verified_at timestamptz,
  inquiry_enabled boolean not null default false,
  response_rate numeric(5,2),
  average_response_minutes integer,
  updated_at timestamptz not null
);

create table if not exists public.taran_public_reviews (
  id uuid primary key,
  provider_id text not null,
  rating integer not null,
  author_name text not null,
  content text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

alter table public.taran_public_providers enable row level security;
alter table public.taran_public_reviews enable row level security;

drop policy if exists "public reads provider projection" on public.taran_public_providers;
create policy "public reads provider projection"
on public.taran_public_providers
for select
to anon, authenticated
using (true);

drop policy if exists "public reads review projection" on public.taran_public_reviews;
create policy "public reads review projection"
on public.taran_public_reviews
for select
to anon, authenticated
using (true);

revoke all on public.taran_public_providers from public, anon, authenticated;
revoke all on public.taran_public_reviews from public, anon, authenticated;
grant select on public.taran_public_providers to anon, authenticated;
grant select on public.taran_public_reviews to anon, authenticated;

-- Keep the private source tables unreachable through the browser roles.
revoke all on public.taran_providers from anon, authenticated;
revoke all on public.taran_reviews from anon, authenticated;

create or replace function public.taran_sync_public_provider_projection()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.taran_public_providers where id = old.id;
    return old;
  end if;

  if new.status <> 'published' then
    delete from public.taran_public_providers where id = new.id;
    return new;
  end if;

  insert into public.taran_public_providers (
    id, data, event_types, service_regions, minimum_guests, maximum_guests,
    minimum_guarantee, adult_meal_price_min, adult_meal_price_max,
    child_meal_price, rental_fee, parking_count, private_room,
    wheelchair_accessible, outside_food_policy, outside_vendor_policy,
    cancellation_summary, profile_status, profile_completeness,
    last_verified_at, inquiry_enabled, response_rate,
    average_response_minutes, updated_at
  ) values (
    new.id, public.taran_public_provider_payload(new.data), new.event_types,
    new.service_regions, new.minimum_guests, new.maximum_guests,
    new.minimum_guarantee, new.adult_meal_price_min, new.adult_meal_price_max,
    new.child_meal_price, new.rental_fee, new.parking_count, new.private_room,
    new.wheelchair_accessible, new.outside_food_policy, new.outside_vendor_policy,
    new.cancellation_summary, new.profile_status, new.profile_completeness,
    new.last_verified_at, new.inquiry_enabled, new.response_rate,
    new.average_response_minutes, new.updated_at
  )
  on conflict (id) do update set
    data = excluded.data,
    event_types = excluded.event_types,
    service_regions = excluded.service_regions,
    minimum_guests = excluded.minimum_guests,
    maximum_guests = excluded.maximum_guests,
    minimum_guarantee = excluded.minimum_guarantee,
    adult_meal_price_min = excluded.adult_meal_price_min,
    adult_meal_price_max = excluded.adult_meal_price_max,
    child_meal_price = excluded.child_meal_price,
    rental_fee = excluded.rental_fee,
    parking_count = excluded.parking_count,
    private_room = excluded.private_room,
    wheelchair_accessible = excluded.wheelchair_accessible,
    outside_food_policy = excluded.outside_food_policy,
    outside_vendor_policy = excluded.outside_vendor_policy,
    cancellation_summary = excluded.cancellation_summary,
    profile_status = excluded.profile_status,
    profile_completeness = excluded.profile_completeness,
    last_verified_at = excluded.last_verified_at,
    inquiry_enabled = excluded.inquiry_enabled,
    response_rate = excluded.response_rate,
    average_response_minutes = excluded.average_response_minutes,
    updated_at = excluded.updated_at;
  return new;
end;
$$;

create or replace function public.taran_sync_public_review_projection()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.taran_public_reviews where id = old.id;
    return old;
  end if;

  if new.status <> 'published' then
    delete from public.taran_public_reviews where id = new.id;
    return new;
  end if;

  insert into public.taran_public_reviews (
    id, provider_id, rating, author_name, content, created_at, updated_at
  ) values (
    new.id, new.provider_id, new.rating, new.author_name,
    new.content, new.created_at, new.updated_at
  )
  on conflict (id) do update set
    provider_id = excluded.provider_id,
    rating = excluded.rating,
    author_name = excluded.author_name,
    content = excluded.content,
    created_at = excluded.created_at,
    updated_at = excluded.updated_at;
  return new;
end;
$$;

revoke all on function public.taran_sync_public_provider_projection() from public;
revoke all on function public.taran_sync_public_review_projection() from public;

drop trigger if exists taran_sync_public_provider_projection_trigger
  on public.taran_providers;
create trigger taran_sync_public_provider_projection_trigger
after insert or update or delete on public.taran_providers
for each row execute function public.taran_sync_public_provider_projection();

drop trigger if exists taran_sync_public_review_projection_trigger
  on public.taran_reviews;
create trigger taran_sync_public_review_projection_trigger
after insert or update or delete on public.taran_reviews
for each row execute function public.taran_sync_public_review_projection();

insert into public.taran_public_providers (
  id, data, event_types, service_regions, minimum_guests, maximum_guests,
  minimum_guarantee, adult_meal_price_min, adult_meal_price_max,
  child_meal_price, rental_fee, parking_count, private_room,
  wheelchair_accessible, outside_food_policy, outside_vendor_policy,
  cancellation_summary, profile_status, profile_completeness,
  last_verified_at, inquiry_enabled, response_rate,
  average_response_minutes, updated_at
)
select
  provider.id, public.taran_public_provider_payload(provider.data),
  provider.event_types, provider.service_regions, provider.minimum_guests,
  provider.maximum_guests, provider.minimum_guarantee,
  provider.adult_meal_price_min, provider.adult_meal_price_max,
  provider.child_meal_price, provider.rental_fee, provider.parking_count,
  provider.private_room, provider.wheelchair_accessible,
  provider.outside_food_policy, provider.outside_vendor_policy,
  provider.cancellation_summary, provider.profile_status,
  provider.profile_completeness, provider.last_verified_at,
  provider.inquiry_enabled, provider.response_rate,
  provider.average_response_minutes, provider.updated_at
from public.taran_providers provider
where provider.status = 'published'
on conflict (id) do update set
  data = excluded.data,
  event_types = excluded.event_types,
  service_regions = excluded.service_regions,
  minimum_guests = excluded.minimum_guests,
  maximum_guests = excluded.maximum_guests,
  minimum_guarantee = excluded.minimum_guarantee,
  adult_meal_price_min = excluded.adult_meal_price_min,
  adult_meal_price_max = excluded.adult_meal_price_max,
  child_meal_price = excluded.child_meal_price,
  rental_fee = excluded.rental_fee,
  parking_count = excluded.parking_count,
  private_room = excluded.private_room,
  wheelchair_accessible = excluded.wheelchair_accessible,
  outside_food_policy = excluded.outside_food_policy,
  outside_vendor_policy = excluded.outside_vendor_policy,
  cancellation_summary = excluded.cancellation_summary,
  profile_status = excluded.profile_status,
  profile_completeness = excluded.profile_completeness,
  last_verified_at = excluded.last_verified_at,
  inquiry_enabled = excluded.inquiry_enabled,
  response_rate = excluded.response_rate,
  average_response_minutes = excluded.average_response_minutes,
  updated_at = excluded.updated_at;

delete from public.taran_public_providers projection
where not exists (
  select 1 from public.taran_providers provider
  where provider.id = projection.id and provider.status = 'published'
);

insert into public.taran_public_reviews (
  id, provider_id, rating, author_name, content, created_at, updated_at
)
select
  review.id, review.provider_id, review.rating, review.author_name,
  review.content, review.created_at, review.updated_at
from public.taran_reviews review
where review.status = 'published'
on conflict (id) do update set
  provider_id = excluded.provider_id,
  rating = excluded.rating,
  author_name = excluded.author_name,
  content = excluded.content,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at;

delete from public.taran_public_reviews projection
where not exists (
  select 1 from public.taran_reviews review
  where review.id = projection.id and review.status = 'published'
);
