-- Existing T'ARAN Supabase projects: run after admin-schema.sql or the previous schema.
-- This migration narrows provider access, removes the legacy editor role,
-- and forces community submissions through moderation.

update public.taran_admin_profiles
set role = 'content'
where role = 'editor';

alter table public.taran_admin_profiles
  drop constraint if exists taran_admin_profiles_role_check;

alter table public.taran_admin_profiles
  add constraint taran_admin_profiles_role_check
  check (role in ('owner', 'admin', 'operations', 'content', 'provider'));

alter table public.taran_admin_profiles
  alter column role set default 'content';

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
      and role in ('owner', 'admin', 'operations', 'content')
  );
$$;

drop policy if exists "admins can manage providers" on public.taran_providers;
create policy "admins can manage providers"
on public.taran_providers for all
using (public.taran_has_role(array['owner','admin','operations']))
with check (public.taran_has_role(array['owner','admin','operations']));

drop policy if exists "users can read own provider claims" on public.taran_provider_claims;
create policy "users can read own provider claims"
on public.taran_provider_claims for select
using (
  auth.uid() = user_id
  or public.taran_has_role(array['owner','admin','operations'])
);

drop policy if exists "admins can manage provider claims" on public.taran_provider_claims;
create policy "admins can manage provider claims"
on public.taran_provider_claims for all
using (public.taran_has_role(array['owner','admin','operations']))
with check (public.taran_has_role(array['owner','admin','operations']));

drop policy if exists "admins can manage reviews" on public.taran_reviews;
create policy "admins can manage reviews"
on public.taran_reviews for all
using (public.taran_has_role(array['owner','admin','operations']))
with check (public.taran_has_role(array['owner','admin','operations']));

alter table public.taran_community_posts
  alter column status set default 'pending';

alter table public.taran_community_comments
  alter column status set default 'pending';

drop policy if exists "users can create community posts" on public.taran_community_posts;
create policy "users can create community posts"
on public.taran_community_posts for insert
with check (auth.uid() = user_id and status = 'pending');

drop policy if exists "users can update own community posts" on public.taran_community_posts;

drop policy if exists "users can create community comments" on public.taran_community_comments;
create policy "users can create community comments"
on public.taran_community_comments for insert
with check (auth.uid() = user_id and status = 'pending');

drop policy if exists "users can update own community comments" on public.taran_community_comments;

create or replace function public.taran_update_own_community_post(
  p_post_id uuid,
  p_title text,
  p_content text,
  p_category text
)
returns public.taran_community_posts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post public.taran_community_posts;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.' using errcode = '42501';
  end if;
  if char_length(trim(coalesce(p_title, ''))) not between 2 and 120
    or char_length(trim(coalesce(p_content, ''))) not between 5 and 5000 then
    raise exception '제목 또는 본문 길이를 확인해 주세요.';
  end if;

  update public.taran_community_posts
  set title = trim(p_title),
      content = trim(p_content),
      category = left(trim(coalesce(p_category, '이야기')), 40),
      updated_at = now()
  where id = p_post_id
    and user_id = auth.uid()
    and status = 'pending'
  returning * into v_post;

  if not found then
    raise exception '수정 가능한 검수 대기 글이 아닙니다.' using errcode = '42501';
  end if;
  return v_post;
end;
$$;

create or replace function public.taran_update_own_community_comment(
  p_comment_id uuid,
  p_content text
)
returns public.taran_community_comments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_comment public.taran_community_comments;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.' using errcode = '42501';
  end if;
  if char_length(trim(coalesce(p_content, ''))) not between 1 and 1000 then
    raise exception '댓글 길이를 확인해 주세요.';
  end if;

  update public.taran_community_comments
  set content = trim(p_content),
      updated_at = now()
  where id = p_comment_id
    and user_id = auth.uid()
    and status = 'pending'
  returning * into v_comment;

  if not found then
    raise exception '수정 가능한 검수 대기 댓글이 아닙니다.' using errcode = '42501';
  end if;
  return v_comment;
end;
$$;

revoke all on function public.taran_update_own_community_post(uuid, text, text, text) from public;
grant execute on function public.taran_update_own_community_post(uuid, text, text, text) to authenticated;
revoke all on function public.taran_update_own_community_comment(uuid, text) from public;
grant execute on function public.taran_update_own_community_comment(uuid, text) to authenticated;

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
    'page_view',
    'search',
    'provider_view',
    'inquiry_started',
    'inquiry_submitted'
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
    order by created_at desc
    limit 1;

    if found then
      return v_existing;
    end if;
  end if;

  insert into public.taran_admin_events (event_name, page_path, metadata)
  values (p_event_name, nullif(left(p_page_path, 240), ''), v_metadata)
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.taran_track_event(text, text, jsonb) from public;
grant execute on function public.taran_track_event(text, text, jsonb) to anon, authenticated;

create index if not exists taran_admin_events_session_idx
  on public.taran_admin_events(event_name, page_path, ((metadata->>'sessionId')), created_at desc);
