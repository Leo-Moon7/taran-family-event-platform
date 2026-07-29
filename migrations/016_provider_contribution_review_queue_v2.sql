-- BE-027: minimum-privilege operations review queue for contribution v2.
-- Run after 015_provider_contribution_quote_v2.sql.
--
-- This migration adds one read-only RPC. It does not grant browser access to
-- the private submission, review, evidence, quote, provider, or audit tables.

create or replace function public.taran_list_review_queue_v2(
  p_review_state text default 'open',
  p_page_size integer default 20,
  p_before_created_at timestamptz default null,
  p_before_review_case_id uuid default null
)
returns table (
  review_case_id uuid,
  source_kind text,
  canonical_event_code text,
  risk_level text,
  review_state text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_catalog
set row_security = off
as $$
begin
  if auth.uid() is null
     or not public.taran_is_admin()
     or not public.taran_is_aal2_v2()
     or public.taran_account_deletion_self_is_active() then
    raise exception 'Review queue access requires an operations role and AAL2.'
      using errcode = '42501';
  end if;

  if p_review_state is null
     or p_review_state not in ('open','assigned','approved','rejected','cancelled') then
    raise exception 'A valid review state is required.'
      using errcode = '22023';
  end if;

  if p_page_size is null or p_page_size < 1 or p_page_size > 50 then
    raise exception 'Review queue page size must be between 1 and 50.'
      using errcode = '22023';
  end if;

  if (p_before_created_at is null) <> (p_before_review_case_id is null) then
    raise exception 'Review queue cursor values must be provided together.'
      using errcode = '22023';
  end if;

  return query
  select
    review_case.id as review_case_id,
    submission.source_kind,
    submission.event_code as canonical_event_code,
    review_case.risk_level,
    review_case.state as review_state,
    review_case.created_at
  from public.taran_review_cases_v2 review_case
  join public.taran_submission_cases_v2 submission
    on submission.id = review_case.submission_case_id
  where review_case.state = p_review_state
    and (
      p_before_created_at is null
      or review_case.created_at < p_before_created_at
      or (
        review_case.created_at = p_before_created_at
        and review_case.id < p_before_review_case_id
      )
    )
  order by review_case.created_at desc, review_case.id desc
  limit p_page_size;
end;
$$;

revoke all on function public.taran_list_review_queue_v2(
  text, integer, timestamptz, uuid
) from public, anon, authenticated;

grant execute on function public.taran_list_review_queue_v2(
  text, integer, timestamptz, uuid
) to authenticated;

comment on function public.taran_list_review_queue_v2(
  text, integer, timestamptz, uuid
) is
  'AAL2 operations-only review queue. Returns no contributor, provider owner, evidence, amount, fingerprint, or reviewer identity.';
