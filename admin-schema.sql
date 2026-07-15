-- memoa 운영 관리자용 Supabase 스키마
-- Supabase SQL Editor에서 실행한 뒤, admin-config.js/content-config.js에 Project URL과 anon key를 넣어주세요.
-- 브라우저에는 service_role key를 절대 넣지 않습니다.

create extension if not exists pgcrypto;

create table if not exists public.memoa_admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'editor' check (role in ('owner', 'admin', 'editor')),
  created_at timestamptz not null default now()
);

create or replace function public.memoa_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memoa_admin_profiles
    where user_id = auth.uid()
      and role in ('owner', 'admin', 'editor')
  );
$$;

create table if not exists public.memoa_site_copy (
  id text primary key,
  site_id text not null default 'memoa',
  label text,
  selector text not null,
  mode text not null default 'text' check (mode in ('text', 'html')),
  text_value text,
  html_value text,
  attributes jsonb not null default '{}'::jsonb,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.memoa_providers (
  id text primary key,
  data jsonb not null,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.memoa_articles (
  slug text primary key,
  data jsonb not null,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.memoa_content_revisions (
  id uuid primary key default gen_random_uuid(),
  content_type text not null,
  content_key text not null,
  action text not null default 'upsert',
  data jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.memoa_banners (
  id text primary key,
  site_id text not null default 'memoa',
  placement text not null default 'home-point',
  data jsonb not null default '{}'::jsonb,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  sort_order integer not null default 0,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.memoa_customers (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'pending', 'blocked', 'deleted')),
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.memoa_admin_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  page_path text,
  referrer text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.memoa_admin_profiles enable row level security;
alter table public.memoa_site_copy enable row level security;
alter table public.memoa_providers enable row level security;
alter table public.memoa_articles enable row level security;
alter table public.memoa_content_revisions enable row level security;
alter table public.memoa_banners enable row level security;
alter table public.memoa_customers enable row level security;
alter table public.memoa_admin_events enable row level security;

drop policy if exists "admins can read admin profiles" on public.memoa_admin_profiles;
create policy "admins can read admin profiles"
on public.memoa_admin_profiles
for select
using (public.memoa_is_admin());

drop policy if exists "admins can manage site copy" on public.memoa_site_copy;
create policy "admins can manage site copy"
on public.memoa_site_copy
for all
using (public.memoa_is_admin())
with check (public.memoa_is_admin());

drop policy if exists "public can read published site copy" on public.memoa_site_copy;
create policy "public can read published site copy"
on public.memoa_site_copy
for select
using (status = 'published');

drop policy if exists "admins can manage providers" on public.memoa_providers;
create policy "admins can manage providers"
on public.memoa_providers
for all
using (public.memoa_is_admin())
with check (public.memoa_is_admin());

drop policy if exists "public can read published providers" on public.memoa_providers;
create policy "public can read published providers"
on public.memoa_providers
for select
using (status = 'published');

drop policy if exists "admins can manage articles" on public.memoa_articles;
create policy "admins can manage articles"
on public.memoa_articles
for all
using (public.memoa_is_admin())
with check (public.memoa_is_admin());

drop policy if exists "public can read published articles" on public.memoa_articles;
create policy "public can read published articles"
on public.memoa_articles
for select
using (status = 'published');

drop policy if exists "admins can read revisions" on public.memoa_content_revisions;
create policy "admins can read revisions"
on public.memoa_content_revisions
for select
using (public.memoa_is_admin());

drop policy if exists "admins can insert revisions" on public.memoa_content_revisions;
create policy "admins can insert revisions"
on public.memoa_content_revisions
for insert
with check (public.memoa_is_admin());

drop policy if exists "admins can manage banners" on public.memoa_banners;
create policy "admins can manage banners"
on public.memoa_banners
for all
using (public.memoa_is_admin())
with check (public.memoa_is_admin());

drop policy if exists "public can read published banners" on public.memoa_banners;
create policy "public can read published banners"
on public.memoa_banners
for select
using (status = 'published');

drop policy if exists "admins can manage customers" on public.memoa_customers;
create policy "admins can manage customers"
on public.memoa_customers
for all
using (public.memoa_is_admin())
with check (public.memoa_is_admin());

drop policy if exists "admins can read admin events" on public.memoa_admin_events;
create policy "admins can read admin events"
on public.memoa_admin_events
for select
using (public.memoa_is_admin());

drop policy if exists "public can insert admin events" on public.memoa_admin_events;
create policy "public can insert admin events"
on public.memoa_admin_events
for insert
with check (true);

create index if not exists memoa_site_copy_site_status_idx on public.memoa_site_copy(site_id, status);
create index if not exists memoa_providers_status_idx on public.memoa_providers(status);
create index if not exists memoa_articles_status_idx on public.memoa_articles(status);
create index if not exists memoa_revisions_key_idx on public.memoa_content_revisions(content_type, content_key, created_at desc);
create index if not exists memoa_banners_site_status_idx on public.memoa_banners(site_id, status, sort_order);
create index if not exists memoa_customers_status_idx on public.memoa_customers(status, updated_at desc);
create index if not exists memoa_admin_events_created_idx on public.memoa_admin_events(created_at desc);

-- 첫 관리자 계정 등록 예시
-- 1) Supabase Authentication에서 관리자 이메일 사용자를 먼저 생성합니다.
-- 2) 아래 email 값을 실제 관리자 이메일로 바꾼 뒤 실행합니다.
--
-- insert into public.memoa_admin_profiles (user_id, email, role)
-- select id, email, 'owner'
-- from auth.users
-- where email = 'admin@memoa.kr'
-- on conflict (user_id) do update set role = excluded.role, email = excluded.email;
