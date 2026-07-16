-- taran 운영 관리자용 Supabase 스키마
-- Supabase SQL Editor에서 실행한 뒤, 공개 가능한 anon key는 배포 환경변수에서 주입하세요.
-- 브라우저에는 service_role key를 절대 넣지 않습니다.

create extension if not exists pgcrypto;

create table if not exists public.taran_admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'editor' check (role in ('owner', 'admin', 'editor')),
  created_at timestamptz not null default now()
);

alter table public.taran_admin_profiles drop constraint if exists taran_admin_profiles_role_check;
alter table public.taran_admin_profiles add constraint taran_admin_profiles_role_check
  check (role in ('owner', 'admin', 'editor', 'operations', 'content', 'provider'));

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
      and role in ('owner', 'admin', 'editor', 'operations', 'content', 'provider')
  );
$$;

-- Role-aware helper used by table policies and the admin interface.
create or replace function public.taran_has_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.taran_admin_profiles
    where user_id = auth.uid() and role = any(allowed_roles)
  );
$$;

create table if not exists public.taran_site_copy (
  id text primary key,
  site_id text not null default 'taran',
  label text,
  content_slot_id text not null,
  text_value text,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

alter table public.taran_site_copy add column if not exists content_slot_id text;
update public.taran_site_copy set content_slot_id = id where content_slot_id is null;

create table if not exists public.taran_providers (
  id text primary key,
  data jsonb not null,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  owner_user_id uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

alter table public.taran_providers add column if not exists owner_user_id uuid references auth.users(id) on delete set null;

create table if not exists public.taran_articles (
  slug text primary key,
  data jsonb not null,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.taran_content_revisions (
  id uuid primary key default gen_random_uuid(),
  content_type text not null,
  content_key text not null,
  action text not null default 'upsert',
  data jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.taran_banners (
  id text primary key,
  site_id text not null default 'taran',
  placement text not null default 'home-point',
  data jsonb not null default '{}'::jsonb,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  sort_order integer not null default 0,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.taran_customers (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'pending', 'blocked', 'deleted')),
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create or replace function public.taran_create_customer_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.taran_customers (id, data, status)
  values (
    new.id::text,
    jsonb_build_object(
      'name', coalesce(new.raw_user_meta_data->>'name', new.email),
      'email', new.email,
      'phone', coalesce(new.raw_user_meta_data->>'phone', ''),
      'accountType', coalesce(new.raw_user_meta_data->>'accountType', 'customer')
    ),
    'active'
  )
  on conflict (id) do update set data = excluded.data, updated_at = now();
  return new;
end;
$$;

drop trigger if exists taran_on_auth_user_created on auth.users;
create trigger taran_on_auth_user_created
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function public.taran_create_customer_profile();

create table if not exists public.taran_admin_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  page_path text,
  referrer text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.taran_inquiries (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete set null,
  provider_id text, provider_name text, event_type text, region text,
  guests integer check (guests is null or guests > 0), budget text,
  contact jsonb not null default '{}'::jsonb, details jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'contacted', 'completed', 'cancelled')),
  assigned_to uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.taran_reviews (
  id uuid primary key default gen_random_uuid(), provider_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5), author_name text not null,
  content text not null check (char_length(content) between 10 and 3000),
  status text not null default 'pending' check (status in ('pending', 'published', 'hidden')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.taran_contributions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  provider_id text, contribution_type text not null check (contribution_type in ('quote', 'provider_info', 'photo')),
  data jsonb not null default '{}'::jsonb, file_paths text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'deleted')),
  reviewed_by uuid references auth.users(id), reviewed_at timestamptz, created_at timestamptz not null default now()
);

create table if not exists public.taran_point_ledger (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null check (amount <> 0), reason text not null,
  contribution_id uuid references public.taran_contributions(id) on delete set null,
  created_by uuid references auth.users(id), created_at timestamptz not null default now()
);

create table if not exists public.taran_member_states (
  user_id uuid not null references auth.users(id) on delete cascade,
  state_key text not null check (state_key in ('calculator', 'checklist')),
  data jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now(), primary key (user_id, state_key)
);

create table if not exists public.taran_saved_providers (
  user_id uuid not null references auth.users(id) on delete cascade,
  provider_id text not null, created_at timestamptz not null default now(), primary key (user_id, provider_id)
);

create table if not exists public.taran_rewards (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  cost integer not null check (cost > 0),
  stock integer check (stock is null or stock >= 0),
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  updated_at timestamptz not null default now()
);

create table if not exists public.taran_reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reward_id text not null references public.taran_rewards(id),
  points integer not null check (points > 0),
  status text not null default 'pending' check (status in ('pending', 'sent', 'cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.taran_account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'cancelled')),
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, status)
);

create table if not exists public.taran_provider_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider_id text not null,
  provider_name text not null,
  manager_name text not null,
  work_email text not null,
  phone text not null,
  business_number text not null,
  event_types jsonb not null default '[]'::jsonb,
  document_path text not null,
  ad_interest boolean not null default false,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider_id)
);

create table if not exists public.taran_community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  title text not null check (char_length(title) between 2 and 120),
  content text not null check (char_length(content) between 5 and 5000),
  author_name text not null check (char_length(author_name) between 1 and 30),
  status text not null default 'published' check (status in ('pending','published','hidden')),
  view_count integer not null default 0 check (view_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.taran_community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.taran_community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null check (char_length(author_name) between 1 and 30),
  content text not null check (char_length(content) between 1 and 1000),
  status text not null default 'published' check (status in ('pending','published','hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
  v_allowed constant text[] := array['page_view','search','provider_view','inquiry_started','inquiry_submitted'];
begin
  if not (p_event_name = any(v_allowed)) then
    raise exception '허용되지 않은 통계 이벤트입니다.';
  end if;
  if char_length(coalesce(p_page_path, '')) > 240 then
    raise exception '화면 경로가 너무 깁니다.';
  end if;
  insert into public.taran_admin_events (event_name, page_path, metadata)
  values (p_event_name, nullif(left(p_page_path, 240), ''), coalesce(p_metadata, '{}'::jsonb))
  returning id into v_id;
  return v_id;
end;
$$;

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
  if v_user is null then raise exception '로그인이 필요합니다.'; end if;
  insert into public.taran_account_deletion_requests (user_id, status)
  values (v_user, 'pending')
  on conflict (user_id, status) do update set requested_at = now()
  returning id into v_id;
  update public.taran_customers set status = 'deleted', updated_at = now() where id = v_user::text;
  delete from public.taran_saved_providers where user_id = v_user;
  delete from public.taran_member_states where user_id = v_user;
  return v_id;
end;
$$;

alter table public.taran_admin_profiles enable row level security;
alter table public.taran_site_copy enable row level security;
alter table public.taran_providers enable row level security;
alter table public.taran_articles enable row level security;
alter table public.taran_content_revisions enable row level security;
alter table public.taran_banners enable row level security;
alter table public.taran_customers enable row level security;
alter table public.taran_admin_events enable row level security;
alter table public.taran_inquiries enable row level security;
alter table public.taran_reviews enable row level security;
alter table public.taran_contributions enable row level security;
alter table public.taran_point_ledger enable row level security;
alter table public.taran_member_states enable row level security;
alter table public.taran_saved_providers enable row level security;
alter table public.taran_rewards enable row level security;
alter table public.taran_reward_redemptions enable row level security;
alter table public.taran_account_deletion_requests enable row level security;
alter table public.taran_provider_claims enable row level security;
alter table public.taran_community_posts enable row level security;
alter table public.taran_community_comments enable row level security;

drop policy if exists "admins can read admin profiles" on public.taran_admin_profiles;
create policy "admins can read admin profiles"
on public.taran_admin_profiles
for select
using (public.taran_is_admin());

drop policy if exists "admins can manage site copy" on public.taran_site_copy;
create policy "admins can manage site copy"
on public.taran_site_copy
for all
using (public.taran_is_admin())
with check (public.taran_is_admin());

drop policy if exists "public can read published site copy" on public.taran_site_copy;
create policy "public can read published site copy"
on public.taran_site_copy
for select
using (status = 'published');

drop policy if exists "admins can manage providers" on public.taran_providers;
create policy "admins can manage providers"
on public.taran_providers
for all
using (public.taran_is_admin())
with check (public.taran_is_admin());

drop policy if exists "public can read published providers" on public.taran_providers;
create policy "public can read published providers"
on public.taran_providers
for select
using (status = 'published');

drop policy if exists "owners can read own providers" on public.taran_providers;
create policy "owners can read own providers"
on public.taran_providers
for select
using (auth.uid() = owner_user_id);

-- 승인된 업체 담당자는 허용된 필드만 수정할 수 있습니다.
create or replace function public.taran_update_owned_provider(p_provider_id text, p_data jsonb)
returns public.taran_providers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_provider public.taran_providers;
  v_allowed jsonb;
begin
  select * into v_provider
  from public.taran_providers
  where id = p_provider_id and owner_user_id = auth.uid();

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
    'detailFacts', p_data->'detailFacts'
  ));

  update public.taran_providers
  set data = data || v_allowed,
      updated_by = auth.uid(),
      updated_at = now()
  where id = p_provider_id
  returning * into v_provider;

  return v_provider;
end;
$$;

revoke all on function public.taran_update_owned_provider(text, jsonb) from public;
grant execute on function public.taran_update_owned_provider(text, jsonb) to authenticated;

drop policy if exists "admins can manage articles" on public.taran_articles;
create policy "admins can manage articles"
on public.taran_articles
for all
using (public.taran_is_admin())
with check (public.taran_is_admin());

drop policy if exists "public can read published articles" on public.taran_articles;
create policy "public can read published articles"
on public.taran_articles
for select
using (status = 'published');

drop policy if exists "admins can read revisions" on public.taran_content_revisions;
create policy "admins can read revisions"
on public.taran_content_revisions
for select
using (public.taran_is_admin());

drop policy if exists "admins can insert revisions" on public.taran_content_revisions;
create policy "admins can insert revisions"
on public.taran_content_revisions
for insert
with check (public.taran_is_admin());

drop policy if exists "admins can manage banners" on public.taran_banners;
create policy "admins can manage banners"
on public.taran_banners
for all
using (public.taran_is_admin())
with check (public.taran_is_admin());

drop policy if exists "public can read published banners" on public.taran_banners;
create policy "public can read published banners"
on public.taran_banners
for select
using (status = 'published');

drop policy if exists "admins can manage customers" on public.taran_customers;
create policy "admins can manage customers"
on public.taran_customers
for all
using (public.taran_is_admin())
with check (public.taran_is_admin());

drop policy if exists "admins can read admin events" on public.taran_admin_events;
create policy "admins can read admin events"
on public.taran_admin_events
for select
using (public.taran_is_admin());

drop policy if exists "authenticated users can insert admin events" on public.taran_admin_events;
drop policy if exists "public can insert admin events" on public.taran_admin_events;

drop policy if exists "users can create inquiries" on public.taran_inquiries;
create policy "users can create inquiries"
on public.taran_inquiries for insert
with check (auth.uid() is not null and (user_id is null or user_id = auth.uid()));

drop policy if exists "users can read own inquiries" on public.taran_inquiries;
create policy "users can read own inquiries"
on public.taran_inquiries for select
using (user_id = auth.uid() or public.taran_is_admin());

drop policy if exists "admins can manage inquiries" on public.taran_inquiries;
create policy "admins can manage inquiries"
on public.taran_inquiries for all
using (public.taran_is_admin())
with check (public.taran_is_admin());

drop policy if exists "public can read published reviews" on public.taran_reviews;
create policy "public can read published reviews"
on public.taran_reviews for select
using (status = 'published' or user_id = auth.uid() or public.taran_is_admin());

drop policy if exists "users can create reviews" on public.taran_reviews;
create policy "users can create reviews"
on public.taran_reviews for insert
with check (auth.uid() = user_id and status = 'pending');

drop policy if exists "users can update own pending reviews" on public.taran_reviews;
create policy "users can update own pending reviews"
on public.taran_reviews for update
using (auth.uid() = user_id and status = 'pending')
with check (auth.uid() = user_id and status = 'pending');

drop policy if exists "admins can manage reviews" on public.taran_reviews;
create policy "admins can manage reviews"
on public.taran_reviews for all
using (public.taran_is_admin())
with check (public.taran_is_admin());

drop policy if exists "users can create contributions" on public.taran_contributions;
create policy "users can create contributions"
on public.taran_contributions for insert
with check (auth.uid() = user_id and status = 'pending');

drop policy if exists "users can read own contributions" on public.taran_contributions;
create policy "users can read own contributions"
on public.taran_contributions for select
using (auth.uid() = user_id or public.taran_is_admin());

drop policy if exists "admins can manage contributions" on public.taran_contributions;
create policy "admins can manage contributions"
on public.taran_contributions for all
using (public.taran_is_admin())
with check (public.taran_is_admin());

drop policy if exists "users can read own points" on public.taran_point_ledger;
create policy "users can read own points"
on public.taran_point_ledger for select
using (auth.uid() = user_id or public.taran_is_admin());

drop policy if exists "admins can manage points" on public.taran_point_ledger;
create policy "admins can manage points"
on public.taran_point_ledger for all
using (public.taran_is_admin())
with check (public.taran_is_admin());

drop policy if exists "users can manage own member state" on public.taran_member_states;
create policy "users can manage own member state"
on public.taran_member_states for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users can manage own saved providers" on public.taran_saved_providers;
create policy "users can manage own saved providers"
on public.taran_saved_providers for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "public can read published rewards" on public.taran_rewards;
create policy "public can read published rewards"
on public.taran_rewards for select
using (status = 'published' or public.taran_is_admin());

drop policy if exists "admins can manage rewards" on public.taran_rewards;
create policy "admins can manage rewards"
on public.taran_rewards for all
using (public.taran_is_admin())
with check (public.taran_is_admin());

drop policy if exists "users can read own redemptions" on public.taran_reward_redemptions;
create policy "users can read own redemptions"
on public.taran_reward_redemptions for select
using (auth.uid() = user_id or public.taran_is_admin());

drop policy if exists "admins can manage redemptions" on public.taran_reward_redemptions;
create policy "admins can manage redemptions"
on public.taran_reward_redemptions for all
using (public.taran_is_admin())
with check (public.taran_is_admin());

drop policy if exists "users can read own deletion requests" on public.taran_account_deletion_requests;
create policy "users can read own deletion requests"
on public.taran_account_deletion_requests for select
using (auth.uid() = user_id or public.taran_is_admin());

drop policy if exists "admins can manage deletion requests" on public.taran_account_deletion_requests;
create policy "admins can manage deletion requests"
on public.taran_account_deletion_requests for all
using (public.taran_has_role(array['owner','admin','operations']))
with check (public.taran_has_role(array['owner','admin','operations']));

drop policy if exists "users can create provider claims" on public.taran_provider_claims;
create policy "users can create provider claims" on public.taran_provider_claims for insert
with check (auth.uid() = user_id and status = 'pending');

drop policy if exists "users can read own provider claims" on public.taran_provider_claims;
create policy "users can read own provider claims" on public.taran_provider_claims for select
using (auth.uid() = user_id or public.taran_has_role(array['owner','admin','operations','provider']));

drop policy if exists "users can update own pending provider claims" on public.taran_provider_claims;
create policy "users can update own pending provider claims" on public.taran_provider_claims for update
using (auth.uid() = user_id and status in ('pending', 'rejected'))
with check (auth.uid() = user_id and status = 'pending');

drop policy if exists "admins can manage provider claims" on public.taran_provider_claims;
create policy "admins can manage provider claims" on public.taran_provider_claims for all
using (public.taran_has_role(array['owner','admin','operations','provider']))
with check (public.taran_has_role(array['owner','admin','operations','provider']));

drop policy if exists "public can read published community posts" on public.taran_community_posts;
create policy "public can read published community posts" on public.taran_community_posts for select
using (status = 'published' or auth.uid() = user_id or public.taran_is_admin());

drop policy if exists "users can create community posts" on public.taran_community_posts;
create policy "users can create community posts" on public.taran_community_posts for insert
with check (auth.uid() = user_id and status in ('pending','published'));

drop policy if exists "users can update own community posts" on public.taran_community_posts;
create policy "users can update own community posts" on public.taran_community_posts for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "admins can manage community posts" on public.taran_community_posts;
create policy "admins can manage community posts" on public.taran_community_posts for all
using (public.taran_has_role(array['owner','admin','operations','content']))
with check (public.taran_has_role(array['owner','admin','operations','content']));

drop policy if exists "public can read published community comments" on public.taran_community_comments;
create policy "public can read published community comments" on public.taran_community_comments for select
using (status = 'published' or auth.uid() = user_id or public.taran_is_admin());

drop policy if exists "users can create community comments" on public.taran_community_comments;
create policy "users can create community comments" on public.taran_community_comments for insert
with check (auth.uid() = user_id and status in ('pending','published'));

drop policy if exists "users can update own community comments" on public.taran_community_comments;
create policy "users can update own community comments" on public.taran_community_comments for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "admins can manage community comments" on public.taran_community_comments;
create policy "admins can manage community comments" on public.taran_community_comments for all
using (public.taran_has_role(array['owner','admin','operations','content']))
with check (public.taran_has_role(array['owner','admin','operations','content']));

-- 운영 역할별 쓰기 권한. 공개 읽기 정책은 위 정책을 그대로 사용합니다.
drop policy if exists "admins can manage site copy" on public.taran_site_copy;
create policy "admins can manage site copy" on public.taran_site_copy for all
using (public.taran_has_role(array['owner','admin','content']))
with check (public.taran_has_role(array['owner','admin','content']));

drop policy if exists "admins can manage providers" on public.taran_providers;
create policy "admins can manage providers" on public.taran_providers for all
using (public.taran_has_role(array['owner','admin','operations','provider']))
with check (public.taran_has_role(array['owner','admin','operations','provider']));

drop policy if exists "admins can manage articles" on public.taran_articles;
create policy "admins can manage articles" on public.taran_articles for all
using (public.taran_has_role(array['owner','admin','content']))
with check (public.taran_has_role(array['owner','admin','content']));

drop policy if exists "admins can manage banners" on public.taran_banners;
create policy "admins can manage banners" on public.taran_banners for all
using (public.taran_has_role(array['owner','admin','operations','content']))
with check (public.taran_has_role(array['owner','admin','operations','content']));

drop policy if exists "admins can manage customers" on public.taran_customers;
create policy "admins can manage customers" on public.taran_customers for all
using (public.taran_has_role(array['owner','admin','operations']))
with check (public.taran_has_role(array['owner','admin','operations']));

drop policy if exists "admins can manage inquiries" on public.taran_inquiries;
create policy "admins can manage inquiries" on public.taran_inquiries for all
using (public.taran_has_role(array['owner','admin','operations']))
with check (public.taran_has_role(array['owner','admin','operations']));

drop policy if exists "admins can manage reviews" on public.taran_reviews;
create policy "admins can manage reviews" on public.taran_reviews for all
using (public.taran_has_role(array['owner','admin','operations','provider']))
with check (public.taran_has_role(array['owner','admin','operations','provider']));

drop policy if exists "admins can manage contributions" on public.taran_contributions;
create policy "admins can manage contributions" on public.taran_contributions for all
using (public.taran_has_role(array['owner','admin','operations']))
with check (public.taran_has_role(array['owner','admin','operations']));

drop policy if exists "admins can manage points" on public.taran_point_ledger;
create policy "admins can manage points" on public.taran_point_ledger for all
using (public.taran_has_role(array['owner','admin','operations']))
with check (public.taran_has_role(array['owner','admin','operations']));

drop policy if exists "admins can manage rewards" on public.taran_rewards;
create policy "admins can manage rewards" on public.taran_rewards for all
using (public.taran_has_role(array['owner','admin','operations']))
with check (public.taran_has_role(array['owner','admin','operations']));

drop policy if exists "admins can manage redemptions" on public.taran_reward_redemptions;
create policy "admins can manage redemptions" on public.taran_reward_redemptions for all
using (public.taran_has_role(array['owner','admin','operations']))
with check (public.taran_has_role(array['owner','admin','operations']));

create index if not exists taran_site_copy_site_status_idx on public.taran_site_copy(site_id, status);
create index if not exists taran_providers_status_idx on public.taran_providers(status);
create index if not exists taran_articles_status_idx on public.taran_articles(status);
create index if not exists taran_revisions_key_idx on public.taran_content_revisions(content_type, content_key, created_at desc);
create index if not exists taran_banners_site_status_idx on public.taran_banners(site_id, status, sort_order);
create index if not exists taran_customers_status_idx on public.taran_customers(status, updated_at desc);
create index if not exists taran_admin_events_created_idx on public.taran_admin_events(created_at desc);
create index if not exists taran_inquiries_status_created_idx on public.taran_inquiries(status, created_at desc);
create index if not exists taran_inquiries_user_idx on public.taran_inquiries(user_id, created_at desc);
create index if not exists taran_reviews_provider_status_idx on public.taran_reviews(provider_id, status, created_at desc);
create index if not exists taran_contributions_status_created_idx on public.taran_contributions(status, created_at desc);
create index if not exists taran_point_ledger_user_idx on public.taran_point_ledger(user_id, created_at desc);
create index if not exists taran_reward_redemptions_user_idx on public.taran_reward_redemptions(user_id, created_at desc);
create index if not exists taran_provider_claims_status_idx on public.taran_provider_claims(status, created_at desc);
create index if not exists taran_community_posts_status_idx on public.taran_community_posts(status, created_at desc);
create index if not exists taran_community_comments_post_idx on public.taran_community_comments(post_id, status, created_at asc);
create index if not exists taran_account_deletion_status_idx on public.taran_account_deletion_requests(status, requested_at desc);

create or replace function public.taran_redeem_reward(p_reward_id text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_reward public.taran_rewards%rowtype;
  v_balance integer;
  v_redemption uuid;
begin
  if v_user is null then raise exception '로그인이 필요합니다.'; end if;
  select * into v_reward from public.taran_rewards where id = p_reward_id and status = 'published' for update;
  if not found then raise exception '교환 가능한 상품이 아닙니다.'; end if;
  if v_reward.stock is not null and v_reward.stock < 1 then raise exception '상품 재고가 없습니다.'; end if;
  select coalesce(sum(amount), 0) into v_balance from public.taran_point_ledger where user_id = v_user;
  if v_balance < v_reward.cost then raise exception '포인트가 부족합니다.'; end if;
  insert into public.taran_reward_redemptions (user_id, reward_id, points)
  values (v_user, v_reward.id, v_reward.cost) returning id into v_redemption;
  insert into public.taran_point_ledger (user_id, amount, reason, created_by)
  values (v_user, -v_reward.cost, 'reward_redemption:' || v_reward.id, v_user);
  if v_reward.stock is not null then update public.taran_rewards set stock = stock - 1, updated_at = now() where id = v_reward.id; end if;
  return v_redemption;
end;
$$;

revoke all on function public.taran_redeem_reward(text) from public;
grant execute on function public.taran_redeem_reward(text) to authenticated;

create or replace function public.taran_review_contribution(p_contribution_id uuid, p_approve boolean)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contribution public.taran_contributions%rowtype;
  v_points integer;
begin
  if not public.taran_has_role(array['owner','admin','operations']) then raise exception '견적 운영 권한이 필요합니다.'; end if;
  select * into v_contribution from public.taran_contributions where id = p_contribution_id for update;
  if not found then raise exception '제보를 찾을 수 없습니다.'; end if;
  if v_contribution.status <> 'pending' then raise exception '이미 처리된 제보입니다.'; end if;
  if p_approve then
    v_points := greatest(0, least(coalesce((v_contribution.data->>'expectedPoints')::integer, 0), 2500));
    if v_points > 0 then
      insert into public.taran_point_ledger (user_id, amount, reason, contribution_id, created_by)
      values (v_contribution.user_id, v_points, 'approved_contribution', v_contribution.id, auth.uid());
    end if;
    update public.taran_contributions set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now() where id = v_contribution.id;
    return 'approved';
  end if;
  update public.taran_contributions set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now() where id = v_contribution.id;
  return 'rejected';
end;
$$;

revoke all on function public.taran_review_contribution(uuid, boolean) from public;
grant execute on function public.taran_review_contribution(uuid, boolean) to authenticated;
revoke all on function public.taran_track_event(text, text, jsonb) from public;
grant execute on function public.taran_track_event(text, text, jsonb) to anon, authenticated;
revoke all on function public.taran_request_account_deletion() from public;
grant execute on function public.taran_request_account_deletion() to authenticated;

insert into public.taran_rewards (id, data, cost, stock, status) values
  ('coffee', '{"name":"커피"}'::jsonb, 4500, null, 'published'),
  ('coffee-dessert', '{"name":"커피+디저트"}'::jsonb, 6500, null, 'published'),
  ('naver-pay-10000', '{"name":"네이버페이 1만원"}'::jsonb, 10000, null, 'published'),
  ('shinsegae-10000', '{"name":"신세계 상품권 1만원"}'::jsonb, 10000, null, 'published')
on conflict (id) do update set data = excluded.data, cost = excluded.cost, status = excluded.status;

-- 견적서와 제보 파일은 공개 URL을 만들지 않고 사용자별 비공개 경로에 저장합니다.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'taran-private-evidence',
  'taran-private-evidence',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "users can upload own evidence" on storage.objects;
create policy "users can upload own evidence"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'taran-private-evidence'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "users can read own evidence" on storage.objects;
create policy "users can read own evidence"
on storage.objects for select to authenticated
using (
  bucket_id = 'taran-private-evidence'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.taran_is_admin())
);

drop policy if exists "users can delete own evidence" on storage.objects;
create policy "users can delete own evidence"
on storage.objects for delete to authenticated
using (
  bucket_id = 'taran-private-evidence'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.taran_is_admin())
);

-- 첫 관리자 계정 등록 예시
-- 1) Supabase Authentication에서 관리자 이메일 사용자를 먼저 생성합니다.
-- 2) 아래 email 값을 실제 관리자 이메일로 바꾼 뒤 실행합니다.
--
-- insert into public.taran_admin_profiles (user_id, email, role)
-- select id, email, 'owner'
-- from auth.users
-- where email = 'admin@taran.kr'
-- on conflict (user_id) do update set role = excluded.role, email = excluded.email;
