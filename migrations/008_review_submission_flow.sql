-- Minimal-privilege first-party review submission and moderation.
-- Run after 007_provider_review_projection_flow.sql.
-- Additive/idempotent and intended for isolated validation before production use.

create or replace function public.taran_submit_review(
  p_provider_id text,
  p_rating integer,
  p_author_name text,
  p_content text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_provider_id text := nullif(left(trim(coalesce(p_provider_id, '')), 120), '');
  v_author_name text := nullif(left(trim(coalesce(p_author_name, '')), 40), '');
  v_content text := nullif(trim(coalesce(p_content, '')), '');
  v_id uuid;
begin
  if v_user is null then
    raise exception 'Login is required to submit a review.'
      using errcode = '42501';
  end if;

  if v_provider_id is null or not exists (
    select 1
    from public.taran_providers provider
    where provider.id = v_provider_id
      and provider.status = 'published'
  ) then
    raise exception 'Reviews are available only for published providers.'
      using errcode = '22023';
  end if;

  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'Review rating must be between 1 and 5.'
      using errcode = '22023';
  end if;

  if v_author_name is null then
    raise exception 'Review display name is required.'
      using errcode = '22023';
  end if;

  if v_content is null or char_length(v_content) < 10 or char_length(v_content) > 3000 then
    raise exception 'Review content must be between 10 and 3000 characters.'
      using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(v_user::text || ':' || v_provider_id, 0)
  );

  if exists (
    select 1
    from public.taran_reviews review
    where review.user_id = v_user
      and review.provider_id = v_provider_id
      and review.status = 'pending'
  ) then
    raise exception 'A pending review already exists for this provider.'
      using errcode = '23505';
  end if;

  insert into public.taran_reviews (
    provider_id,
    user_id,
    rating,
    author_name,
    content,
    status
  ) values (
    v_provider_id,
    v_user,
    p_rating,
    v_author_name,
    v_content,
    'pending'
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.taran_submit_review(text, integer, text, text)
  from public, anon;
grant execute on function public.taran_submit_review(text, integer, text, text)
  to authenticated;

create or replace function public.taran_list_pending_reviews(p_limit integer default 100)
returns table (
  id uuid,
  provider_id text,
  provider_name text,
  rating smallint,
  author_name text,
  content text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.taran_has_role(array['owner','admin','operations']) then
    raise exception 'Review moderation requires an operations role.'
      using errcode = '42501';
  end if;

  return query
  select
    review.id,
    review.provider_id,
    coalesce(nullif(provider.data->>'name', ''), review.provider_id),
    review.rating,
    review.author_name,
    review.content,
    review.created_at
  from public.taran_reviews review
  left join public.taran_providers provider on provider.id = review.provider_id
  where review.status = 'pending'
  order by review.created_at asc
  limit least(100, greatest(1, coalesce(p_limit, 100)));
end;
$$;

revoke all on function public.taran_list_pending_reviews(integer)
  from public, anon;
grant execute on function public.taran_list_pending_reviews(integer)
  to authenticated;

create or replace function public.taran_moderate_review(
  p_review_id uuid,
  p_status text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_status text := lower(trim(coalesce(p_status, '')));
begin
  if not public.taran_has_role(array['owner','admin','operations']) then
    raise exception 'Review moderation requires an operations role.'
      using errcode = '42501';
  end if;

  if v_status not in ('published', 'hidden') then
    raise exception 'Review status must be published or hidden.'
      using errcode = '22023';
  end if;

  update public.taran_reviews review
  set status = v_status,
      updated_at = now()
  where review.id = p_review_id
    and review.status = 'pending'
  returning review.id into v_id;

  if v_id is null then
    raise exception 'The pending review was not found.'
      using errcode = '22023';
  end if;

  insert into public.taran_admin_events (
    event_name,
    page_path,
    metadata
  ) values (
    'review_moderated',
    'admin/providers',
    jsonb_build_object('review_id', v_id, 'status', v_status)
  );

  return v_id;
end;
$$;

revoke all on function public.taran_moderate_review(uuid, text)
  from public, anon;
grant execute on function public.taran_moderate_review(uuid, text)
  to authenticated;

-- Keep the underlying table closed to browser roles. All public reads use the
-- safe view and all writes use the narrow functions above.
revoke all on public.taran_reviews from anon, authenticated;
grant select on public.taran_public_reviews to anon, authenticated;
