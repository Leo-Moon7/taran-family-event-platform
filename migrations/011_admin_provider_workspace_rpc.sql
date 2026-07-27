-- Operations-only provider workspace read contracts.
-- Run after 010_public_projection_security.sql.
-- Each queue has an independent RPC so one failure cannot blank the others.
-- Direct browser access to the private source tables remains revoked.

create or replace function public.taran_list_admin_providers(
  p_limit integer default 500
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  if not public.taran_has_role(array['owner','admin','operations']) then
    raise exception 'Provider workspace requires an operations role.'
      using errcode = '42501';
  end if;

  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', provider.id,
      'data', public.taran_public_provider_payload(provider.data),
      'status', provider.status,
      'updated_at', provider.updated_at
    ) order by provider.updated_at desc), '[]'::jsonb)
    from (
      select source.id, source.data, source.status, source.updated_at
      from public.taran_providers source
      order by source.updated_at desc
      limit least(500, greatest(1, coalesce(p_limit, 500)))
    ) provider
  );
end;
$$;

create or replace function public.taran_list_admin_provider_claims(
  p_limit integer default 200
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  if not public.taran_has_role(array['owner','admin','operations']) then
    raise exception 'Provider workspace requires an operations role.'
      using errcode = '42501';
  end if;

  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', claim.id,
      'user_id', claim.user_id,
      'provider_id', claim.provider_id,
      'provider_name', claim.provider_name,
      'manager_name', claim.manager_name,
      'work_email', claim.work_email,
      'phone', claim.phone,
      'event_types', claim.event_types,
      'document_path', claim.document_path,
      'ad_interest', claim.ad_interest,
      'status', claim.status,
      'created_at', claim.created_at,
      'updated_at', claim.updated_at
    ) order by claim.created_at asc), '[]'::jsonb)
    from (
      select source.*
      from public.taran_provider_claims source
      order by source.created_at asc
      limit least(200, greatest(1, coalesce(p_limit, 200)))
    ) claim
  );
end;
$$;

create or replace function public.taran_list_admin_provider_registrations(
  p_limit integer default 200
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  if not public.taran_has_role(array['owner','admin','operations']) then
    raise exception 'Provider workspace requires an operations role.'
      using errcode = '42501';
  end if;

  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', registration.id,
      'data', jsonb_strip_nulls(jsonb_build_object(
        'name', registration.data->'name',
        'provider_name', registration.data->'provider_name',
        'industry', registration.data->'industry',
        'address', registration.data->'address',
        'region', registration.data->'region',
        'owner_name', registration.data->'owner_name',
        'owner_email', registration.data->'owner_email'
      )),
      'status', registration.status,
      'created_at', registration.created_at,
      'updated_at', registration.updated_at
    ) order by registration.created_at asc), '[]'::jsonb)
    from (
      select source.id, source.data, source.status, source.created_at, source.updated_at
      from public.taran_provider_registrations source
      order by source.created_at asc
      limit least(200, greatest(1, coalesce(p_limit, 200)))
    ) registration
  );
end;
$$;

revoke all on function public.taran_list_admin_providers(integer)
  from public, anon;
revoke all on function public.taran_list_admin_provider_claims(integer)
  from public, anon;
revoke all on function public.taran_list_admin_provider_registrations(integer)
  from public, anon;
grant execute on function public.taran_list_admin_providers(integer)
  to authenticated;
grant execute on function public.taran_list_admin_provider_claims(integer)
  to authenticated;
grant execute on function public.taran_list_admin_provider_registrations(integer)
  to authenticated;

-- Remove the first combined draft if this revision is reapplied in QA.
drop function if exists public.taran_list_admin_provider_workspace(integer, integer);

-- Keep all source-table access behind the role-checked functions.
revoke all on public.taran_providers from anon, authenticated;
revoke all on public.taran_provider_claims from anon, authenticated;
revoke all on public.taran_provider_registrations from anon, authenticated;
