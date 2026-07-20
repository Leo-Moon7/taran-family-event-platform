-- 손품해방 공개 브랜드 전환과 가족행사 분류 확장
-- 내부 taran_* 테이블·RPC 이름은 기존 연결 호환을 위해 유지합니다.

begin;

alter table public.taran_providers
  add column if not exists event_profiles jsonb not null default '{}'::jsonb;

alter table public.taran_providers
  add column if not exists event_taxonomy_status text not null default 'classified';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'taran_providers_event_taxonomy_status_check'
  ) then
    alter table public.taran_providers
      add constraint taran_providers_event_taxonomy_status_check
      check (event_taxonomy_status in ('classified', 'review_required'));
  end if;
end $$;

comment on column public.taran_providers.event_profiles is
  '행사 코드별 가격·수용 인원·시설 조건. 예: {"kids":{"minimumGuarantee":20,"packages":[]}}';
comment on column public.taran_providers.event_taxonomy_status is
  '기존 wedding 등 모호한 행사 분류의 운영 검토 상태';

create table if not exists public.taran_event_taxonomy_reviews (
  id uuid primary key default gen_random_uuid(),
  provider_id text not null unique references public.taran_providers(id) on delete cascade,
  legacy_event_type text not null default 'wedding',
  suggested_event_types text[] not null default '{}',
  evidence jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'resolved', 'dismissed')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.taran_event_taxonomy_reviews enable row level security;

drop policy if exists "admins manage event taxonomy reviews"
  on public.taran_event_taxonomy_reviews;
create policy "admins manage event taxonomy reviews"
  on public.taran_event_taxonomy_reviews
  for all
  to authenticated
  using (public.taran_is_admin())
  with check (public.taran_is_admin());

-- 이미 JSON에 행사별 조건을 저장한 업체는 새 전용 칼럼으로 안전하게 복사합니다.
update public.taran_providers as provider
set event_profiles = provider.data->'eventProfiles'
where provider.event_profiles = '{}'::jsonb
  and jsonb_typeof(provider.data->'eventProfiles') = 'object';

-- 상견례 근거만 명확한 기존 wedding 데이터를 meeting으로 분류합니다.
update public.taran_providers as provider
set event_types = array_append(array_remove(provider.event_types, 'wedding'), 'meeting'),
    event_taxonomy_status = 'classified',
    updated_at = now()
where 'wedding' = any(provider.event_types)
  and concat_ws(' ', provider.data->>'name', provider.data->>'category', provider.data->>'description', provider.data->>'tags')
      ~* '(상견례|양가[[:space:]]*(모임|식사)|약혼)'
  and concat_ws(' ', provider.data->>'name', provider.data->>'category', provider.data->>'description', provider.data->>'tags')
      !~* '(스몰웨딩|하우스웨딩|결혼식|예식|신부대기실|버진로드)';

-- 스몰웨딩 근거만 명확한 기존 wedding 데이터를 smallWedding으로 분류합니다.
update public.taran_providers as provider
set event_types = array_append(array_remove(provider.event_types, 'wedding'), 'smallWedding'),
    event_taxonomy_status = 'classified',
    updated_at = now()
where 'wedding' = any(provider.event_types)
  and concat_ws(' ', provider.data->>'name', provider.data->>'category', provider.data->>'description', provider.data->>'tags')
      ~* '(스몰웨딩|하우스웨딩|결혼식|예식|신부대기실|버진로드)'
  and concat_ws(' ', provider.data->>'name', provider.data->>'category', provider.data->>'description', provider.data->>'tags')
      !~* '(상견례|양가[[:space:]]*(모임|식사)|약혼)';

-- 근거가 모호하거나 양쪽 근거가 함께 있는 기존 wedding 데이터는 자동 확정하지 않습니다.
update public.taran_providers as provider
set event_taxonomy_status = 'review_required'
where 'wedding' = any(provider.event_types);

insert into public.taran_event_taxonomy_reviews (
  provider_id,
  legacy_event_type,
  suggested_event_types,
  evidence
)
select
  provider.id,
  'wedding',
  array_remove(array[
    case when concat_ws(' ', provider.data->>'description', provider.data->>'tags') ~* '(상견례|양가|약혼)' then 'meeting' end,
    case when concat_ws(' ', provider.data->>'description', provider.data->>'tags') ~* '(스몰웨딩|하우스웨딩|결혼식|예식|신부대기실|버진로드)' then 'smallWedding' end
  ], null),
  jsonb_build_object(
    'name', provider.data->>'name',
    'category', provider.data->>'category',
    'description', provider.data->>'description',
    'tags', provider.data->'tags'
  )
from public.taran_providers as provider
where provider.event_taxonomy_status = 'review_required'
on conflict (provider_id) do nothing;

create index if not exists taran_provider_event_types_idx
  on public.taran_providers using gin(event_types);
create index if not exists taran_event_taxonomy_reviews_status_idx
  on public.taran_event_taxonomy_reviews(status, updated_at desc);

commit;
