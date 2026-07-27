-- Operations-only provider write and minimum snapshot contracts.
-- Run after 011_admin_provider_workspace_rpc.sql.
-- This migration is additive/idempotent and must be validated in isolation
-- before any separately approved production application.

create or replace function public.taran_save_admin_provider(
  p_provider_id text,
  p_data jsonb,
  p_status text default 'draft',
  p_original_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_provider public.taran_providers;
  v_allowed jsonb;
  v_unknown_keys text[];
  v_allowed_keys constant text[] := array[
    'name', 'category', 'region', 'area', 'address', 'eventTypes',
    'minGuests', 'maxGuests', 'price', 'phone', 'website',
    'informationCheckedAt'
  ];
  v_name text;
  v_category text;
  v_region text;
  v_minimum_text text;
  v_maximum_text text;
  v_minimum_guests integer;
  v_maximum_guests integer;
begin
  if not public.taran_has_role(array['owner','admin','operations']) then
    raise exception 'Provider save requires an operations role.'
      using errcode = '42501';
  end if;

  if nullif(trim(coalesce(p_provider_id, '')), '') is null
    or char_length(p_provider_id) > 120
    or p_provider_id !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'Provider ID must be a lowercase letter, number, or hyphen identifier.'
      using errcode = '22023';
  end if;

  if p_status is null or p_status not in ('draft', 'published', 'archived') then
    raise exception 'Provider status must be draft, published, or archived.'
      using errcode = '22023';
  end if;

  if p_data is null or jsonb_typeof(p_data) <> 'object' then
    raise exception 'Provider data must be a JSON object.'
      using errcode = '22023';
  end if;

  select array_agg(input_key order by input_key)
  into v_unknown_keys
  from jsonb_object_keys(p_data) input(input_key)
  where not (input_key = any(v_allowed_keys));

  if coalesce(cardinality(v_unknown_keys), 0) > 0 then
    raise exception 'Unsupported provider fields: %', array_to_string(v_unknown_keys, ', ')
      using errcode = '22023';
  end if;

  if jsonb_typeof(p_data->'name') is distinct from 'string'
    or jsonb_typeof(p_data->'category') is distinct from 'string'
    or jsonb_typeof(p_data->'region') is distinct from 'string' then
    raise exception 'Provider name, category, and region must be strings.'
      using errcode = '22023';
  end if;

  v_name := trim(p_data->>'name');
  v_category := trim(p_data->>'category');
  v_region := trim(p_data->>'region');

  if nullif(v_name, '') is null
    or nullif(v_category, '') is null
    or nullif(v_region, '') is null then
    raise exception 'Provider name, category, and region are required.'
      using errcode = '22023';
  end if;

  if char_length(v_name) > 200
    or char_length(v_category) > 120
    or char_length(v_region) > 120 then
    raise exception 'Provider name, category, or region is too long.'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from unnest(array[
      'area', 'address', 'price', 'phone', 'website', 'informationCheckedAt'
    ]::text[]) allowed_string(key)
    where p_data ? (allowed_string.key)
      and jsonb_typeof(p_data -> (allowed_string.key)) not in ('string', 'null')
  ) then
    raise exception 'Optional provider text fields must be strings or null.'
      using errcode = '22023';
  end if;

  if p_data ? 'eventTypes' then
    if jsonb_typeof(p_data->'eventTypes') not in ('array', 'null') then
      raise exception 'eventTypes must be an array of strings.'
        using errcode = '22023';
    end if;
    if jsonb_typeof(p_data->'eventTypes') = 'array' and (
      jsonb_array_length(p_data->'eventTypes') > 20
      or exists (
        select 1
        from jsonb_array_elements(p_data->'eventTypes') event_type(value)
        where jsonb_typeof(event_type.value) <> 'string'
      )
    ) then
      raise exception 'eventTypes must contain at most 20 strings.'
        using errcode = '22023';
    end if;
  end if;

  if p_data ? 'minGuests'
    and jsonb_typeof(p_data->'minGuests') not in ('number', 'string', 'null') then
    raise exception 'minGuests must be an integer or null.'
      using errcode = '22023';
  end if;
  if p_data ? 'maxGuests'
    and jsonb_typeof(p_data->'maxGuests') not in ('number', 'string', 'null') then
    raise exception 'maxGuests must be an integer or null.'
      using errcode = '22023';
  end if;

  v_minimum_text := nullif(trim(coalesce(p_data->>'minGuests', '')), '');
  v_maximum_text := nullif(trim(coalesce(p_data->>'maxGuests', '')), '');

  if v_minimum_text is not null then
    if char_length(v_minimum_text) > 4 or v_minimum_text !~ '^[0-9]+$' then
      raise exception 'minGuests must be an integer between 0 and 5000.'
        using errcode = '22023';
    end if;
    v_minimum_guests := v_minimum_text::integer;
    if v_minimum_guests > 5000 then
      raise exception 'minGuests must be an integer between 0 and 5000.'
        using errcode = '22023';
    end if;
  end if;

  if v_maximum_text is not null then
    if char_length(v_maximum_text) > 4 or v_maximum_text !~ '^[0-9]+$' then
      raise exception 'maxGuests must be an integer between 0 and 5000.'
        using errcode = '22023';
    end if;
    v_maximum_guests := v_maximum_text::integer;
    if v_maximum_guests > 5000 then
      raise exception 'maxGuests must be an integer between 0 and 5000.'
        using errcode = '22023';
    end if;
  end if;

  if v_minimum_guests is not null
    and v_maximum_guests is not null
    and v_minimum_guests > v_maximum_guests then
    raise exception 'minGuests cannot exceed maxGuests.'
      using errcode = '22023';
  end if;

  v_allowed := p_data || jsonb_build_object(
    'name', v_name,
    'category', v_category,
    'region', v_region
  );

  if p_original_id is null then
    perform 1
    from public.taran_providers provider
    where provider.id = p_provider_id
    for update;

    if found then
      raise exception 'Provider ID already exists; pass the same original ID to edit it.'
        using errcode = '23505';
    end if;

    insert into public.taran_providers (
      id, data, status, event_types, minimum_guests, maximum_guests,
      updated_by, updated_at
    ) values (
      p_provider_id,
      v_allowed,
      p_status,
      case
        when p_data ? 'eventTypes'
          then public.taran_jsonb_text_array(p_data->'eventTypes')
        else '{}'::text[]
      end,
      v_minimum_guests,
      v_maximum_guests,
      auth.uid(),
      now()
    )
    returning * into v_provider;
  else
    if p_original_id <> p_provider_id then
      raise exception 'An existing provider ID cannot be changed.'
        using errcode = '22023';
    end if;

    select provider.* into v_provider
    from public.taran_providers provider
    where provider.id = p_original_id
    for update;

    if not found then
      raise exception 'The provider to edit does not exist.'
        using errcode = '22023';
    end if;

    update public.taran_providers provider
    set data = provider.data || v_allowed,
        status = p_status,
        event_types = case
          when p_data ? 'eventTypes'
            then public.taran_jsonb_text_array(p_data->'eventTypes')
          else provider.event_types
        end,
        minimum_guests = case
          when p_data ? 'minGuests' then v_minimum_guests
          else provider.minimum_guests
        end,
        maximum_guests = case
          when p_data ? 'maxGuests' then v_maximum_guests
          else provider.maximum_guests
        end,
        updated_by = auth.uid(),
        updated_at = now()
    where provider.id = p_original_id
    returning provider.* into v_provider;
  end if;

  return jsonb_build_object(
    'id', v_provider.id,
    'status', v_provider.status,
    'updated_at', v_provider.updated_at
  );
end;
$$;

create or replace function public.taran_set_admin_provider_status(
  p_provider_id text,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_provider public.taran_providers;
begin
  if not public.taran_has_role(array['owner','admin','operations']) then
    raise exception 'Provider status changes require an operations role.'
      using errcode = '42501';
  end if;

  if p_status is null or p_status not in ('draft', 'published', 'archived') then
    raise exception 'Provider status must be draft, published, or archived.'
      using errcode = '22023';
  end if;

  update public.taran_providers provider
  set status = p_status,
      updated_by = auth.uid(),
      updated_at = now()
  where provider.id = p_provider_id
  returning provider.* into v_provider;

  if not found then
    raise exception 'The provider does not exist.'
      using errcode = '22023';
  end if;

  return jsonb_build_object(
    'id', v_provider.id,
    'status', v_provider.status,
    'updated_at', v_provider.updated_at
  );
end;
$$;

create or replace function public.taran_review_admin_provider_claim(
  p_claim_id uuid,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_claim public.taran_provider_claims;
  v_provider public.taran_providers;
begin
  if not public.taran_has_role(array['owner','admin','operations']) then
    raise exception 'Provider claim review requires an operations role.'
      using errcode = '42501';
  end if;

  if p_status is null or p_status not in ('approved', 'rejected') then
    raise exception 'Provider claim status must be approved or rejected.'
      using errcode = '22023';
  end if;

  select claim.* into v_claim
  from public.taran_provider_claims claim
  where claim.id = p_claim_id
  for update;

  if not found or v_claim.status <> 'pending' then
    raise exception 'The provider claim is not pending.'
      using errcode = '22023';
  end if;

  select provider.* into v_provider
  from public.taran_providers provider
  where provider.id = v_claim.provider_id
  for update;

  if not found then
    raise exception 'The claimed provider does not exist.'
      using errcode = '22023';
  end if;

  if p_status = 'approved' then
    if v_provider.owner_user_id is not null
      and v_provider.owner_user_id <> v_claim.user_id then
      raise exception 'The provider already has a different owner.'
        using errcode = '23505';
    end if;

    update public.taran_providers provider
    set owner_user_id = v_claim.user_id,
        updated_by = auth.uid(),
        updated_at = now()
    where provider.id = v_claim.provider_id
    returning provider.* into v_provider;
  end if;

  update public.taran_provider_claims claim
  set status = p_status,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where claim.id = v_claim.id;

  return jsonb_build_object(
    'claim_id', v_claim.id,
    'provider_id', v_claim.provider_id,
    'status', p_status,
    'has_owner', v_provider.owner_user_id is not null
  );
end;
$$;

create or replace function public.taran_list_admin_provider_operations(
  p_limit integer default 5000
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  if not public.taran_has_role(array['owner','admin','operations']) then
    raise exception 'Provider operations snapshot requires an operations role.'
      using errcode = '42501';
  end if;

  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', provider.id,
      'name', provider.data->>'name',
      'status', provider.status,
      'has_owner', provider.owner_user_id is not null,
      'profile_completeness', provider.profile_completeness,
      'updated_at', provider.updated_at,
      'last_verified_at', provider.last_verified_at,
      'inquiry_enabled', provider.inquiry_enabled,
      'response_rate', provider.response_rate
    ) order by provider.updated_at desc), '[]'::jsonb)
    from (
      select
        source.id,
        source.data,
        source.status,
        source.owner_user_id,
        source.profile_completeness,
        source.updated_at,
        source.last_verified_at,
        source.inquiry_enabled,
        source.response_rate
      from public.taran_providers source
      order by source.updated_at desc
      limit least(10000, greatest(1, coalesce(p_limit, 5000)))
    ) provider
  );
end;
$$;

revoke all on function public.taran_save_admin_provider(text, jsonb, text, text)
  from public, anon, authenticated;
revoke all on function public.taran_set_admin_provider_status(text, text)
  from public, anon, authenticated;
revoke all on function public.taran_review_admin_provider_claim(uuid, text)
  from public, anon, authenticated;
revoke all on function public.taran_list_admin_provider_operations(integer)
  from public, anon, authenticated;

grant execute on function public.taran_save_admin_provider(text, jsonb, text, text)
  to authenticated;
grant execute on function public.taran_set_admin_provider_status(text, text)
  to authenticated;
grant execute on function public.taran_review_admin_provider_claim(uuid, text)
  to authenticated;
grant execute on function public.taran_list_admin_provider_operations(integer)
  to authenticated;

-- Keep all private source-table access behind role-checked functions.
revoke all on public.taran_providers from anon, authenticated;
revoke all on public.taran_provider_claims from anon, authenticated;
revoke all on public.taran_provider_registrations from anon, authenticated;
