# BE-005 공공데이터·업체 검증·자동 갱신 구조

- 작업 ID: `BE-005`
- 작성일: 2026-07-22 (Asia/Seoul)
- 결과: **설계 완료 — 구현·운영 적용은 후속 카드 및 승인 필요**
- 수정 범위: 이 보고서 1개 신규 작성
- 비변경 범위: SQL, DB, API, 수집기, 원천 JS, 화면, 라우팅, 환경변수, 패키지, 운영 권한
- 핵심 전제: 정적 `window.publicDirectoryData` 4,960건은 **후보 데이터**다. 완전한 공개 업체, 영업 중인 사업자, 가족행사 가능 업체, 소유권 승인 업체, 관리자 검수 완료 업체를 뜻하지 않는다.

## 1. 결론

손품해방의 업체 데이터는 다음 다섯 대상을 서로 다른 레코드와 상태로 관리해야 한다.

1. **발견 후보**: 허용된 공공데이터·업체 제출·수동 조사 등에서 발견한 레코드
2. **업체 정체성**: 중복·지점·이전 주소를 정리한 손품해방의 canonical provider
3. **필드별 주장과 증거**: 업체명, 주소, 행사 가능 여부, 가격 등 각각의 값·출처·확인일
4. **주체별 검증**: 사업자 상태, 페이지 소유권, 관리자 검수, 이용자 제보, 업체 직접 입력
5. **공개 projection**: 승인되고 유효한 필드만 모은 익명 공개용 읽기 모델

공공 인허가·상권 데이터의 등록 또는 `api_collected`는 후보 발견과 일부 기본 사실의 근거일 뿐이다. 다음을 증명하지 않는다.

- 현재 영업 중인 사업자라는 것
- 사업자번호와 해당 페이지 담당자의 관계
- 돌잔치·상견례·추모모임 등 특정 가족행사를 실제로 진행할 수 있다는 것
- 가격, 인원, 주차, 사진, 취소 정책이 정확하다는 것
- 손품해방 문의를 받을 의사가 있다는 것
- 관리자가 공개를 승인했다는 것

따라서 자동 수집 결과는 항상 비공개 격리 영역에 들어가며, **자동 공개·자동 병합·자동 폐업 확정·자동 행사 가능 확정은 금지**한다. 자동화가 할 수 있는 일은 후보 생성, 변경 신호 생성, 중복 점수 계산, 만료·실패 큐 생성, 승인된 규칙에 따른 변동 필드 숨김과 문의 중지까지다.

## 2. 근거와 적용 우선순위

### 2.1 저장소 기준

다음 실제 경로를 읽고 설계했다.

- 운영 기준: `AGENTS.md`, `ops/PM_ORCHESTRATION.md`, `ops/TASK_SPECS.md`, `ops/handoffs/BE-005.md`
- 확정·실행 기준: `docs/99_의사결정기록.md`, `docs/12_통합실행계획.md`
- 데이터·운영 기준: `docs/05_업체데이터구조.md`, `docs/09_운영정책.md`, `docs/10_개발로드맵.md`, `docs/11_크롤링및데이터관리.md`
- 현재 스키마: `admin-schema.sql`, `migrations/001_taran_brand.sql` ~ `migrations/005_sonpum_brand_and_event_types.sql`
- 현재 로더·공개 판정: `data.js`, `content-runtime.js`, `scripts/core/provider-status.js`, `scripts/pages/venues.js`, `scripts/pages/provider.js`
- 현재 입력·검수: `claim.js`, `scripts/pages/provider-register.js`, `contribute.js`, `scripts/pages/admin/providers.js`, `scripts/pages/admin/data.js`
- 현재 권한·API 매핑: `scripts/core/api.js`, `scripts/core/config.js`
- 재현 기준선: `ops/reports/QA-002-data-quality-baseline.md`, `ops/reports/QA-009-naver-information-legal-review.md`

### 2.2 최신 공공데이터 경로

LOCALDATA를 신규 의존점으로 사용하지 않는다. 공식 폐쇄 안내는 지방행정인허가데이터개방시스템이 **2026-04-16 0시** 폐쇄되었고 지방행정 인허가·생활편의정보를 공공데이터포털에서 이용하라고 안내한다. 신규 구조는 data.go.kr의 전환된 **개별 데이터셋/API ID**를 등록부에 넣어 관리해야 한다.

- [LOCALDATA 폐쇄 안내](https://www.localdata.go.kr/portal/end.do)
- [지방행정 인허가·생활편의정보 공공데이터포털 이용 매뉴얼](https://www.localdata.go.kr/images/egovframework/portal/manual_260106.pdf)
- [공공데이터포털 이용정책](https://www.data.go.kr/ugs/selectPortalPolicyView.do)

공공데이터포털은 제3자 권리가 포함된 데이터는 별도 이용허락이 필요하고, 저작물이 포함된 경우 공공누리 유형으로 허락 범위를 표시한다고 설명한다. 따라서 포털에 있다는 사실만으로 모든 데이터셋을 하나의 허락으로 취급하지 않는다. 각 데이터셋별로 이용허락, 공공누리 유형, 상업 이용, 변경 가능 여부, 제3자 권리, 출처표시 문구를 별도 기록한다.

공식 후보 출처는 다음처럼 **예시 등록**만 한다. 실제 활용은 데이터셋별 승인 전에는 실행하지 않는다.

| 데이터셋/API | 발견·확인에 쓸 수 있는 범위 | 증명하지 않는 범위 |
| --- | --- | --- |
| 행안부 관광숙박업 조회서비스 `15155090` | 인허가일자, 영업상태, 사업장명, 소재지주소 등 관광숙박업 기본 사실 후보. 공식 페이지는 일간 갱신과 현재 `이용허락범위 제한 없음`을 표시 | 특정 가족행사 가능, 연회장 보유, 가격, 수용 인원, 주차 조건, 사진 권리, 문의 수신 |
| 소상공인시장진흥공단 상가(상권)정보 `15012005` | 영업 중 상가의 상호·업종·주소·좌표 후보 | 법적 사업자 상태의 최종 판정, 가족행사 가능, 최신 가격·시설·연락 의사. 상가업소번호 체계 변경 이력이 있으므로 source key 버전 필요 |
| 보건복지부 전국 묘지 현황 `15122364` 및 연결된 장례식장·봉안시설 계열 | 시설명, 주소, 전화, 홈페이지, 일부 시설 정보 후보 | 추모 가족행사 제공 의사, 예약·문의 수신, 행사 가격·정책. 관련 API도 각각 별도 dataset ID·허락으로 등록 |
| 국세청 사업자등록정보 진위확인·상태조회 `15081808` | 업체가 제출한 사업자번호의 진위·휴업·폐업·과세유형 확인. 공식 페이지 기준 1회 최대 100건 | 후보 업체 발견, 페이지 소유권, 담당자 재직, 행사 가능, 공개 승인 |

국세청 API는 사업자번호를 입력해야 하므로 **후보 발견 수단이 아니다**. 신규 등록 또는 소유권 요청에서 업체가 자발적으로 제출한 번호에만 사용하고, 외부 후보 4,960건을 역으로 사업자 조회하는 용도로 사용하지 않는다.

## 3. 현재 구조 매핑

### 3.1 정적 후보와 공개 로더

`ops/reports/QA-002-data-quality-baseline.md`가 실제 공개 스크립트 순서로 재현한 현재 기준선은 다음과 같다.

| 항목 | 현재 값 | 해석 |
| --- | ---: | --- |
| `window.publicDirectoryData` | 4,960 | 운영 DB가 아닌 정적 병합 배열 |
| 고유 ID | 4,960 | ID 중복 0은 동일 업체 중복 0을 뜻하지 않음 |
| 지역 API 계열 | 4,891 | `officialVerification.status=api_collected` |
| 검증 라이프사이클 | 39 | `officialVerification.status=verified` |
| 후기 기반 후보 | 30 | 공식 주소·출처·수집일 결측이 집중됨 |
| 공식 출처 충족 | 3,646 | 1,314건 결측 |
| 양수 가격 / 전화 | 0 / 0 | 결측을 추정값으로 채우지 않은 상태 |
| `imageVerified=true` | 0 | 6개 공통 이미지 경로 존재와 이용권은 별개 |
| 외부 링크 보유 업체 | 122 | 외부 원문 링크 합계 459 |
| 현재 목록 후기 게이트 통과 | 122 | 공개 자격과 후기 유무가 잘못 결합됨 |

현재 로더의 핵심 동작과 문제는 다음과 같다.

| 경로 | 현재 동작 | 설계상 문제 |
| --- | --- | --- |
| `data.js:388-471` | `기본 정보 등록`, `verified`, `reviewed` 등을 확인된 항목으로 보고 세 정적 배열을 `publicDirectoryData`에 합침 | `api_collected` 후보가 `sourceStatus=기본 정보 등록`만으로 공개 배열에 진입. 권리·사업자·행사·관리자 검수 분리 없음 |
| `scripts/pages/venues.js:64-75,323-329` | 내부 평점 또는 외부 링크가 있어야 목록 필터 통과 | 후기 링크 유무가 업체 공개 자격으로 작동. 4,960건 중 122건만 목록 노출 |
| `scripts/core/provider-status.js:24-68` | `profile_status`, owner, `officialVerification.status`로 basic/claimed/verified 표시. `verifiedAt` 등으로 최신성 계산 | 수집, 소유권, 운영 확인이 하나의 표시 상태로 축약됨 |
| `scripts/core/provider-status.js:70-75` | 이름+지역/주소+업종이면 public | 출처 허락, event suitability, 중복, 폐업, 관리자 승인 미검사 |
| `content-runtime.js:40-78` | 온라인 업체를 정규화하며 누락 `verifiedAt`을 오늘 날짜, 누락 `publicationStatus`를 published로 기본화 | `updated_at`/로드 시각을 확인일로 오인할 수 있고 provenance가 소실됨 |
| `content-runtime.js:188-216,333-337` | DB의 `status=published` 행을 정적 배열에 ID 기준 upsert | 정적 후보와 운영 승인 데이터의 우선순위·격리 계약이 없음 |
| `scripts/pages/provider.js:100-126` | 외부 링크와 손품해방 내부 후기를 탭으로 표시 | 외부 검색 표본과 자체 후기는 데이터상 분리돼도 신뢰·검증 축이 부족함 |

### 3.2 현재 Supabase 계약

| 현재 객체 | 활용 가능한 기반 | BE-005에 부족한 계약 |
| --- | --- | --- |
| `taran_providers` | canonical ID 후보, `data jsonb`, 공개 상태, owner, event/price/facility 확장 컬럼 | `status`가 draft/published/archived뿐. 후보·검수·폐업·병합·갱신 필요를 표현하지 못함. 필드별 출처 없음 |
| `profile_status` | basic/claimed/verified 표시 | 사업자 상태·소유권·관리자 확인·신선도를 한 축으로 오인 가능 |
| `last_verified_at` | 90/120/180일 신선도 기반 | 업체 수정 RPC가 값을 `now()`로 바꿔 어떤 필드를 누가 검증했는지 알 수 없음 |
| `taran_provider_claims` | 로그인 사용자, 업체 ID, 사업자번호, 비공개 서류, pending/approved/rejected | 사업자 API 결과, 담당자 관계, 반려 사유, 만료·분쟁·회수, 다중 담당자 권한 없음. 원문 사업자번호가 일반 컬럼에 있음 |
| `taran_provider_registrations` | 신규 업체 입력과 비공개 증빙 접수 | 승인 시 `scripts/pages/admin/providers.js:210-254`가 곧바로 provider published+claimed+inquiry enabled로 생성 |
| `taran_event_taxonomy_reviews` | legacy `wedding`의 분류 검수 큐 | 전체 후보의 행사 가능 증거·부정 판정·조건·유효기간은 없음 |
| `taran_reviews` | 자체 후기 pending/published/hidden과 RLS | 로그인 작성과 실제 이용 확인을 구분하지 않음. 예약 확인 후기를 만들 근거가 없음 |
| `taran_contributions` | quote/provider_info/photo, private file path, 관리자 승인 | 조건부 견적 스키마, 개인정보 검수, 공개 revision 연결, 사진 동의·권리 없음 |
| `taran_inquiry_responses` | 특정 문의에 대한 업체 추정 가격·포함 항목 | 고객별 비공개 응답이며 공개 시세 또는 검증 가격으로 재사용하면 안 됨 |
| `taran-private-evidence` | 사용자별 비공개 업로드와 signed URL 기반 | 증빙 종류, 보유기간, 동의 범위, 열람 감사, 공개 파생 이미지 권리 없음 |
| `taran_admin_events` | 제한된 행동 통계 | before/after, 근거, 정책 버전, 반려 사유를 가진 운영 감사 로그가 아님 |
| `taran_notification_jobs` | 문의 알림 예약·재시도 상태 | 데이터 소스 갱신·권리 중지·파서 실패 큐와 분리해야 함 |
| `taran_apply_marketplace_maintenance()` | 180일 초과·미소유 업체 문의 자동 중지 | 필드 만료·출처 실패·사업자 상태·공개 보류를 다루지 않음 |

현재 RLS의 장점은 유지한다. 공개는 `published`, 업체 사용자는 자기 소유 업체, 운영 검수는 `owner/admin/operations`, 증빙은 비공개 Storage라는 기본 방향이 이미 있다. 다만 **현재 스키마가 운영 환경에 실제 적용되었는지는 이 설계에서 확인하지 않았다.**

## 4. 불변 규칙

1. `candidate_id`와 `provider_id`를 분리한다. 후보가 발견되어도 provider 또는 공개 URL을 자동 생성하지 않는다.
2. `source_record`, `field_assertion`, `current_public_value`를 분리한다. 원천 값이 바뀌어도 공개 값을 직접 덮어쓰지 않는다.
3. 출처 허락은 데이터셋 단위, 사실 근거는 레코드·필드 단위로 저장한다.
4. `수집 완료`, `자동 규칙 통과`, `사업자 정상`, `페이지 소유권`, `관리자 승인`, `최근 확인`을 별도 상태축으로 둔다.
5. 공공 인허가·상권 분류는 행사 가능의 후보 신호일 뿐이다. 행사 가능은 행사 유형별 증거와 검수 상태를 가진다.
6. 누락, API 실패, 원천 404, 목록에서 사라짐을 폐업 또는 변경 없음으로 간주하지 않는다.
7. 가격·견적·운영시간·취소 정책은 기준일과 유효기간 없이 현재 사실처럼 공개하지 않는다.
8. 사진은 파일 존재와 공개 이용 동의를 분리한다. 권리 상태가 없으면 대체 이미지로만 표시한다.
9. 업체 소유권은 무료 편집 권한이다. 데이터의 저작권·출처 이력이나 공개 승인 권한을 업체에 넘기지 않는다.
10. 공개 projection만 anon 읽기를 허용하고 후보·원문·증빙·사업자번호·관리자 메모는 공개 번들과 공개 테이블에서 제외한다.
11. 어떤 자동화도 운영 DB에서 행을 삭제하지 않는다. 병합·폐업·철회도 상태와 alias/history로 보존한다.

## 5. 제안 논리 데이터 모델

아래 이름은 **논리명**이며 이번 작업에서 SQL 또는 실제 테이블을 만들지 않는다. BE-004와 후속 스키마 카드가 기존 `taran_*` 이름·RLS·RPC에 매핑해야 한다.

### 5.1 데이터셋·수집 계층

#### `SourceDataset`

데이터셋/API 하나당 한 행이다.

```text
dataset_id                     내부 UUID
portal_data_id                 예: 15155090
title / provider_agency
dataset_url / endpoint_version
access_method                  public_api / file / provider_submission / manual_official
allowed_field_names[]
update_cadence / rate_limit
license_scope                  unrestricted / KOG_L0..L4 / custom / unknown
commercial_use_allowed
derivative_allowed
attribution_required / attribution_text
third_party_rights_status
personal_data_scope
raw_retention_policy
terms_url / terms_checked_at / terms_checked_by
approval_status               draft / legal_review / approved / blocked / expired
approved_purpose               discovery / identity_fact / business_status / none
next_terms_check_at
```

`approval_status=approved`와 허용 field allowlist가 없으면 수집 실행을 시작하지 않는다. 포털의 `이용허락범위 제한 없음`도 조회 시점의 snapshot으로 보관하고, 제3자 권리와 개인정보 여부를 별도로 검토한다.

#### `SourceTermsSnapshot`

허락 조건의 변경 이력을 보존한다.

```text
dataset_id, captured_at, metadata_hash
license_scope, attribution_text, third_party_notes
terms_url, reviewer_id, decision, decision_reason
```

#### `SourceSyncRun`

```text
run_id, dataset_id, parser_version, cursor_from/to
started_at, finished_at
status                         queued/running/succeeded/partial/failed/stopped_rights/stopped_schema
records_seen/inserted/changed/quarantined
request_count, retry_count, error_code, error_summary
terms_snapshot_id
```

#### `SourceObservation`

원천의 한 시점 관찰이다. 허용된 필드만 저장한다.

```text
observation_id, dataset_id, source_record_key, source_key_version
observed_at, collected_at, effective_from/to
source_status_code, payload_hash, parser_version
extracted_fields, personal_data_flags
raw_pointer                     허락·보유기간이 있을 때만 비공개
run_id, terms_snapshot_id
```

`source_record_key`는 제공기관이 ID 체계를 바꿀 수 있으므로 `source_key_version`과 함께 사용한다. 원천 ID가 바뀌었다는 이유만으로 기존 provider를 새 업체로 만들거나 병합하지 않는다.

### 5.2 후보·정체성 계층

#### `ProviderCandidate`

```text
candidate_id, discovery_type, first/last_observed_at
primary_observation_id
state                          quarantined/normalized/match_pending/
                               event_review_pending/publication_review_pending/
                               linked/rejected/out_of_scope
candidate_reason, rejection_reason
matched_provider_id, match_confidence, assigned_queue
```

기존 정적 4,960건을 이 구조로 옮긴다면 최초 상태는 `quarantined`이며, `api_collected`는 source observation 속성으로만 보존한다.

#### `ProviderIdentity`

```text
provider_id                    손품해방 안정 ID
legal_name / display_name
branch_name / provider_kind
business_number_hash           원문 아님
canonical_location_id
identity_state                 active/closed/merged/archived
merged_into_provider_id
created_at / created_by
```

#### `ProviderAlias` / `ProviderSourceLink`

- 이전 ID·slug·원천 ID·과거 상호를 alias로 보존한다.
- 한 provider에 여러 source record를 연결하고, 한 source record가 중복 의심 provider 여러 개에 임시 연결될 수 있게 한다.
- 동일 브랜드의 다른 지점은 다른 provider다. 같은 지점의 여러 행사·서비스는 하나의 provider와 복수 capability다.

#### `ProviderLocationHistory`

```text
provider_id, normalized_road_address, jibun_address
province, district, latitude, longitude
valid_from/to, status(current/previous/proposed/disputed)
assertion_id, reviewed_at/by
```

주소 변경은 이전 주소를 삭제하지 않고 새 location proposal과 change case를 만든다.

### 5.3 필드·버전·공개 계층

#### `ProviderFieldAssertion`

업체의 각 필드는 값 하나가 아니라 주장과 증거의 묶음이다.

```text
assertion_id, provider_id, field_name, normalized_value
source_layer                   public_data/provider_supplied/community_contribution/
                               operator_verified/manual_official
source_observation_id / source_url
occurred_at / observed_at / submitted_at
verified_at/by, valid_from/to, next_check_at
confidence                    보조값이며 공개 승인 대체 금지
privacy_class                 public/restricted/personal/sensitive_evidence
review_status                 proposed/pending/approved/rejected/disputed/
                               superseded/expired/revoked
supersedes_assertion_id
event_type / condition_scope
```

#### `ProviderCurrentProjection`

승인된 assertion 중 정책상 현재 유효한 것만 선택한 읽기 모델이다.

- 공개 projection은 `field_name`, 공개 값, source label, 확인일, 유효 상태만 가진다.
- 원문 증빙, 사업자번호, 관리자 메모, 후보 점수는 들어가지 않는다.
- provider 전체 `updated_at`을 모든 필드의 확인일로 사용하지 않는다.
- 변경이 승인되지 않으면 기존 승인 값을 유지하되 `변경 검토 중` 또는 `재확인 필요`만 표시한다.

#### `ProviderRevision`

고객·업체·운영자가 만든 변경 제안이다.

```text
revision_id, provider_id, proposer_type/user_id
field_assertion_ids[], reason
status(pending/approved/rejected/disputed/withdrawn/rolled_back)
reviewed_by/at, review_reason, policy_version
published_projection_version
```

### 5.4 검증·권한 계층

#### `BusinessVerification`

```text
verification_id, provider_id, claim_id
business_number_hash, encrypted_input_ref
check_type                      authenticity/status
request_at, response_at, source_dataset_id=15081808
result                         valid/invalid/active/suspended/closed/unknown/api_error
result_effective_at, expires_at
response_code, reviewed_by/at
```

- 원문 사업자번호는 공개 JSON, 로그, 분석 이벤트에 넣지 않는다.
- 최소한 암호화된 제한 영역과 검색용 hash를 분리한다.
- 상태 API 정상 결과는 사업자 상태 근거이지 담당자 관계 근거가 아니다.
- API 오류 또는 한도 초과는 `unknown/api_error`이며 반려·폐업으로 바꾸지 않는다.

#### `OwnershipClaim`

```text
claim_id, provider_id, requester_user_id
relationship_type, business_verification_id
evidence_asset_ids[], work_contact
state(submitted/business_check_pending/relationship_review_pending/
      approved/rejected/expired/disputed/revoked/withdrawn)
reviewed_by/at, review_reason
```

#### `ProviderAccessGrant`

```text
provider_id, user_id
role(primary_owner/manager/editor/inquiry_responder)
scope[], granted_by/at, expires_at
status(active/suspended/revoked)
revoke_reason
```

현재 단일 `owner_user_id`는 호환성 기본 소유자로 남길 수 있지만, 실제 권한은 grant로 확장한다. 소유권 승인과 업체 공개, 사업자 정상, 문의 활성화는 각각 별도 결정을 거친다.

### 5.5 행사·미디어·후기·견적 계층

#### `ProviderEventCapability`

행사 유형별로 관리한다. 005의 최신 코드 `kids`, `parents`, `meeting`, `smallWedding`, `familyGathering`, `anniversary`, `memorial`, `other`를 기준으로 하고 legacy `wedding`은 `review_required`를 유지한다.

```text
provider_id, event_type
state(unknown/candidate/provider_asserted/evidence_confirmed/
      operator_confirmed/rejected/expired)
conditions, assertion_ids[], verified_at/by, next_check_at
```

인허가 업종·상권 업종·후기 키워드 자동 매핑은 `candidate`까지만 만든다. 검색·행사 필터에 노출하려면 `provider_asserted`를 관리자가 검수하거나 `operator_confirmed`가 되어야 한다.

#### `MediaAssetRights`

```text
asset_id, provider_id, storage_path
submitter_type/user_id
rights_basis(owned/licensed/provider_consent/user_consent/public_domain/unknown)
consent_scope(provider_page/search/marketing), attribution
persons_present/minor_present, releases_private[]
granted_at, expires_at, revoked_at
moderation_status, reviewer_id/at
public_derivative_path
```

- `rights_basis=unknown`, 동의 범위 밖, 만료·철회, 아동·인물 동의 미확인은 공개 금지다.
- 업체 로고·매장 사진·이용자 행사 사진을 같은 동의로 취급하지 않는다.
- 현재 `taran-private-evidence`는 검수 증빙에만 사용하고 공개 이미지 저장소로 재사용하지 않는다.
- 현재 4,960건의 6개 공통 이미지는 provider 사진이 아니라 placeholder다.

#### `ReviewRecord`

후기 내용 검수와 실제 이용 검증을 분리한다.

```text
review_id, provider_id, author_user_id
content_moderation              pending/published/hidden/disputed/removed
experience_verification        self_reported/evidence_checked/
                               reservation_confirmed/revoked
reservation_id / private_evidence_asset_id
verified_by/at, occurred_at
```

- 로그인 사용자가 작성한 현재 `taran_reviews`는 기본 `self_reported`다.
- `evidence_checked`는 비공개 영수증·계약서 등 최소 증빙을 운영자가 확인한 경우다.
- `reservation_confirmed`는 손품해방 내부 예약 레코드 또는 승인된 외부 예약 증빙과 reviewer가 있을 때만 가능하다.
- ADR-011에 따라 현재 예약·결제 기능과 결제자 후기는 제공하지 않는다. 따라서 기존 후기를 소급해 `reservation_confirmed`로 표시하지 않고 이 상태는 향후용으로 비활성화한다.
- 후기 검증 상태는 provider 공개 자격과 분리한다.

#### `QuoteObservation`

```text
quote_id, provider_id, contributor_user_id
quoted_at, event_date_or_month, event_type, region, guest_count
total_amount, unit_amount, currency
tax_included, service_charge, included_items[], excluded_items[], extras[]
valid_until, evidence_asset_ids[]
pii_redaction_status
moderation_status, disputed_at, withdrawn_at
public_summary_version
```

- 행사 시점·인원·포함 항목 없는 금액은 공개하지 않는다.
- 이용자 견적은 `이용자 제보 사례`이며 업체의 현재 가격이 아니다.
- `taran_inquiry_responses`의 업체 응답은 특정 고객의 비공개 견적이므로 동의·별도 정책 없이 공개 quote로 복사하지 않는다.
- 승인된 견적도 provider의 `commercial` 현재 필드를 자동 변경하지 않고 독립 observation으로 표시한다.

## 6. 표준 필드와 공개 근거

| 영역 | 표준 필드 | 허용 근거 | 공개·갱신 조건 |
| --- | --- | --- | --- |
| 식별 | display/legal name, branch, provider type | 업체 제출, 허락된 공공 인허가·상권, 운영 독립 확인 | canonical match와 관리자 승인 |
| 위치 | 도로명/지번, 시도/시군구, 좌표, 활동 지역 | 공공데이터, 업체 제출, 공식 채널 | 이전·지점 중복 검토. 주소마다 유효기간·이력 |
| 업종 | 표준 industry/service type | 공공 업종은 후보, 업체·운영 확인 | 원천 분류 원문과 손품해방 표준값 분리 |
| 행사 | 8개 event type, 조건 | 업체 제공, 공식 상품/시설 사실, 운영 확인 | 공공 업종만으로 확정 금지. 행사별 capability 승인 |
| 연락 | 법인 대표전화, 업무 이메일, 공식 URL | 업체 제공·공식 출처·허락된 데이터 | 개인 휴대전화·자택 주소 공개 금지 또는 별도 근거 |
| 사업자 | business hash, 진위, 영업 상태 | 업체 제출 번호+국세청 API | 비공개. 후보 발견에 사용 금지. 만료·오류 분리 |
| 소유권 | 담당자 관계, access grant | 업무 연락·서류·사업자 검증+관리자 | 공개 정보가 아니라 편집·문의 권한 판단 |
| 가격·인원 | 식대, 대관료, 보증/최소/최대 인원 | 업체 제공, 조건 완전한 이용자 견적, 운영 확인 | 기준일·포함/제외·세금·유효기간 필수. 만료 시 숨김 |
| 시설·정책 | 주차, 접근성, 외부 음식/업체, 취소 | 업체 제공·공식 사실·운영 확인 | 확인된 값만 표시. 결측을 false/0으로 해석 금지 |
| 사진 | asset, alt, attribution, consent | 권리 보유자·업체·이용자 명시 동의 | asset별 권리·범위·만료·철회 검사 |
| 출처 | dataset, record, URL, provider, collected/observed/verified | 모든 공개 필드 | 필드별 표시 또는 상세 provenance 제공 |
| 최근성 | verified_at, provider_attested_at, next_check_at, valid_until | assertion별 | `updated_at`·수집 실행일을 검증일로 대체 금지 |

결측은 `unknown`, 명시적으로 제공되지 않음은 `not_provided`, 해당 없음은 `not_applicable`, 확인된 0은 숫자 `0`으로 구분한다.

## 7. 상태 모델과 전이

### 7.1 출처 허락

```text
draft -> legal_review -> approved -> expired -> legal_review
                    \-> blocked

approved --약관/공공누리/제3자 권리 변경--> expired 또는 blocked
```

- `blocked/expired` 데이터셋은 신규 수집을 즉시 중지한다.
- 기존 공개 필드는 자동 삭제하지 않고 영향 assertion을 `rights_review` 큐로 보낸다. 법무·운영 결정 전 신규 projection에는 사용하지 않는다.

### 7.2 후보

```text
quarantined -> normalized -> match_pending
match_pending -> linked                    (기존 provider와 연결)
match_pending -> event_review_pending      (신규·행사 관련 가능성 있음)
event_review_pending -> publication_review_pending
publication_review_pending -> linked       (draft provider/승인 assertion 생성)
어느 단계든 -> rejected / out_of_scope
```

후보 상태에는 `published`가 없다. 공개는 provider projection의 상태다.

### 7.3 provider 게시 상태

```text
draft -> pending_review -> published
published -> needs_update -> published
published/needs_update -> suspended -> pending_review
published/needs_update/suspended -> closed
draft/published/... -> merged -> archived
closed -> pending_review                    (재개업 근거가 생긴 경우)
```

현행 DB 제약의 `draft/published/archived`는 호환 projection으로만 매핑한다.

| 논리 상태 | 현재 `taran_providers.status` 임시 매핑 | 주의 |
| --- | --- | --- |
| draft, pending_review | draft | anon 미공개 |
| published | published | 별도 gate 통과가 전제 |
| needs_update, suspended, closed, merged, archived | archived | 실제 이유는 별도 상태 레코드에 보존 |

### 7.4 사업자·소유권·문의

세 축을 결합하지 않는다.

```text
business:  unsubmitted -> check_pending -> active/suspended/closed/invalid
                                  \-> unknown/api_error -> check_pending

ownership: submitted -> business_check_pending -> relationship_review_pending
          -> approved -> expired/disputed/revoked
          -> rejected/withdrawn

inquiry:   off -> eligible -> enabled -> paused/stale/disabled
```

- `business=active`만으로 ownership 승인 금지
- `ownership=approved`만으로 provider 공개·문의 활성화 금지
- 문의는 published + active/recent business + active access grant + 문의 opt-in + 연락 경로 + 180일 이내 확인을 모두 요구한다.

### 7.5 필드와 최근성

```text
proposed -> pending -> approved -> superseded
                    -> rejected
approved -> disputed / expired / revoked
disputed -> approved(유지) / superseded(교체) / revoked
```

`last_verified_at` 하나 대신 필드 assertion의 `verified_at`, `valid_until`, `next_check_at`을 사용한다.

## 8. 중복·폐업·주소 변경·행사 분류

### 8.1 중복 판별

1. 정규화: 법인 표기, 공백·기호, 지점명, 전화 E.164, 도로명 주소, 공식 도메인, 좌표
2. 강한 신호: 동일 business hash, 동일 인허가 고유키, 동일 공식 도메인+전화
3. 보조 신호: 상호 유사도+같은 도로명 주소, 50m 내 좌표+같은 업종, 상호+전화
4. 지점 분기: 브랜드는 같아도 주소·전화·인허가가 다르면 다른 provider
5. 자동화 결과: `duplicate_case`와 점수만 생성
6. 운영자 확정 후 병합: loser ID를 삭제하지 않고 `merged_into_provider_id`와 alias로 보존. 후기·문의·revision은 canonical로 연결하되 원래 참조도 감사 이력에 유지

동일 ID 4,960건이라는 QA-002 결과는 원천의 ID 충돌이 없다는 뜻일 뿐 상호·주소 기준 실제 중복이 없다는 뜻이 아니다.

### 8.2 주소 변경

- 동일 사업자·인허가 고유키에서 새 주소가 오면 `address_change_candidate`를 만든다.
- 기존 주소를 즉시 덮지 않고 current/proposed/history를 보존한다.
- 같은 브랜드의 새 지점인지 이전인지 운영자가 확인한다.
- 이전이 확인되면 기존 URL은 유지하고 새 주소와 확인일을 공개한다.
- 주소 충돌 중에는 위치 필터·문의 수신을 일시 보수적으로 제한할 수 있다.

### 8.3 폐업·휴업

신호는 `authoritative`와 `supporting`으로 나눈다.

- authoritative 후보: 연결이 확인된 인허가 영업상태, 업체 제출 사업자번호의 국세청 휴·폐업 결과
- supporting: 공식 사이트 404/410, 전화 실패, 지도 폐업 표시, 이용자·업체 제보, 공공 목록에서 사라짐

규칙:

1. 원천 한 곳의 누락 또는 API 실패로 폐업 처리하지 않는다.
2. authoritative adverse signal은 신규 문의를 자동 보류하고 긴급 운영 큐를 만들 수 있다.
3. 공개 폐업 확정, URL 폐업 안내, 대체 업체 연결은 운영자가 source/provider 연결과 날짜를 확인한 뒤 수행한다.
4. 폐업 provider와 중복 provider를 혼동하지 않는다.
5. 재개업은 새 사업자·새 지점 여부를 검토하고 기존 provider 상태를 자동 복구하지 않는다.

### 8.4 행사 가능 분류

- 공공 인허가·상권 업종 -> `candidate`
- 업체 등록의 체크박스 -> `provider_asserted`
- 공식 상품/시설 사실 또는 조건 있는 업체 자료 -> `evidence_confirmed`
- 운영자 검수 완료 -> `operator_confirmed`
- 검색·행사 필터 허용 -> 관리자 검수된 `provider_asserted` 이상
- 모호한 `wedding` -> 005의 `taran_event_taxonomy_reviews`와 같은 `review_required`

호텔·음식점·장례시설이라는 업종만으로 가족행사 capability를 생성하지 않는다. 실제 공간, 대상 행사, 인원, 이용 조건 중 최소한 해당 행사를 제공한다는 근거가 필요하다.

## 9. 업체 신규 입력과 페이지 소유권

### 9.1 신규 업체

```text
로그인 -> registration 제출 -> 사업자 상태 확인 -> 담당자 관계 검수
-> 중복/지점 검수 -> 입력 필드 assertion pending -> 행사 capability 검수
-> 공개 gate 검수 -> draft/published 결정 -> 문의 별도 opt-in
```

현재처럼 registration 승인 한 번으로 `published`, `claimed`, `inquiry_enabled=true`를 동시에 만들지 않는다.

### 9.2 기존 페이지 소유권

```text
provider 선택 -> claim 제출 -> 비공개 서류/업무 연락 확인
-> 제출 사업자번호 진위·상태 조회 -> provider와 사업자의 관계 확인
-> access grant 승인 -> 업체 변경 제안 가능
```

- 국세청 상태조회는 번호의 상태만 확인하며 요청자의 재직·대리 권한을 확인하지 않는다.
- 승인된 담당자도 승인된 provider에만 revision을 제출한다.
- 초기에는 저위험 필드까지 모두 관리자 검수 후 공개한다(`docs/09_운영정책.md` 권고).
- 가격, 취소, 사업자 식별, ownership, 문의 수신, 주소 이전은 항상 재검수한다.
- 퇴사·대행 종료·분쟁·오승인 때 grant를 회수하고 이전 변경 이력은 보존한다.

## 10. 신뢰 상태와 사용자 표시

단일 점수나 `verified` badge 하나로 축약하지 않는다. 내부 판단은 다음 축을 가진다.

| 축 | 상태 예시 | 의미 |
| --- | --- | --- |
| source rights | approved/expired/blocked | 이 출처를 해당 목적으로 사용할 수 있는가 |
| source observation | current/stale/unavailable | 원천 관찰이 최신·재현 가능한가 |
| business | unsubmitted/active/suspended/closed/unknown | 제출된 사업자번호 상태 |
| ownership | unclaimed/pending/approved/revoked | 페이지 편집 관계 |
| field review | pending/approved/disputed/expired | 각 값의 운영 승인 상태 |
| event capability | candidate/provider_asserted/operator_confirmed | 행사별 실제 제공 근거 |
| freshness | current/recheck_due/stale/expired/unknown | assertion별 최근성 |
| publication | draft/pending_review/published/needs_update/suspended/closed/merged | 공개 lifecycle |
| inquiry | off/eligible/enabled/paused/disabled | 문의 가능 여부 |

공개 라벨은 증거 범위만 설명한다.

- `공공데이터에서 확인` — 승인된 데이터셋의 허용 필드이고 관리자 검수 완료
- `업체 제공 정보` — 승인된 담당자 제출, 제공일 표시
- `운영 확인` — 운영자가 공식 근거로 해당 필드를 확인, 확인일 표시
- `이용자 제보` — 조건·시점 있는 승인된 제보, 업체 공식 사실 아님
- `손품해방 후기` — 플랫폼 자체 작성 후기
- `이용 증빙 확인` — 비공개 증빙을 운영자가 확인한 후기
- `예약 확인 후기` — 실제 예약 연결이 있는 미래 상태. 현재는 표시 금지

`api_collected`, `autoReview.approved`, `sourceCount`, 로그인 작성 자체를 사용자용 `검증 완료`로 번역하지 않는다.

## 11. 최소 공개 조건

### 11.1 기본 정보 페이지 공개

다음 조건을 **모두** 만족해야 한다.

1. stable `provider_id`와 canonical match가 있고 미해결 강한 중복이 없음
2. 업체명, 표준 업종, 도로명 주소 또는 정확한 활동 지역이 승인된 assertion으로 존재
3. 공식 채널 또는 재현 가능한 승인 공공데이터 레코드/제공기관 출처가 있음
4. 해당 source dataset의 이용허락·공공누리·제3자 권리·출처표시 검토가 현재 유효
5. 폐업·휴업·이전의 미해결 authoritative adverse signal이 없음
6. 적어도 한 가족행사 capability가 관리자 검수된 `provider_asserted` 또는 `operator_confirmed`
7. 수집일과 **필드 확인일**이 구분되어 있고 최소 식별 필드가 만료되지 않음
8. 관리자 publication review가 승인되고 결정 이유·정책 버전·reviewer가 기록됨
9. 공개 projection에 개인정보·사업자번호·비공개 증빙·권리 미확인 사진이 없음
10. 출처 라벨과 최근 확인일을 화면에 표시할 수 있음

이 기준은 D-01~D-03의 최종 제품 결정을 대신하지 않는다. 설계상 보수적 최소 gate이며 실제 공개 정책은 의사결정 기록 승인 후 구현한다.

### 11.2 조건부 필드 공개

- 가격·인원·주차·시설·정책: 해당 필드 assertion이 승인되고 기준일·조건·유효기간이 있어야 함
- 사진: asset별 공개 동의와 권리 검수 완료
- 자체 후기: content moderation published. 이용 검증 라벨은 별도 증거 필요
- 이용자 견적: 행사 시점·인원·포함/제외·금액·개인정보 제거·관리자 승인 필수

### 11.3 직접 문의 활성화

기본 공개 조건에 더해 다음을 모두 요구한다.

1. ownership claim approved + active access grant
2. 제출 사업자번호 상태가 current active이며 invalid/closed 신호 없음
3. 업체가 문의 수신을 명시적으로 opt-in
4. 승인된 업무 연락 경로와 담당 inquiry responder 존재
5. 180일 이내 핵심 정보 확인, 반복 미응답 제한 통과
6. 운영 E2E에서 RLS·문의 생성·열람·응답·알림 실패 처리가 검증됨

## 12. 갱신 주기와 날짜 의미

### 12.1 날짜 필드

| 날짜 | 의미 | 공개 확인일로 사용 |
| --- | --- | --- |
| `collected_at` | 손품해방이 응답을 받은 시각 | 아니오 |
| `observed_at` | 원천 데이터가 표시한 관찰/기준 시각 | 단독 사용 금지 |
| `submitted_at` | 고객·업체가 값을 제출한 시각 | `업체 제공일`/`제보일`로만 |
| `verified_at` | 권한 있는 reviewer가 필드와 근거를 확인한 시각 | 예 |
| `provider_attested_at` | 업체가 자사 값을 재확인한 시각 | `업체 확인일`로 가능 |
| `valid_until` | 가격·정책·동의 등의 유효 종료 | 만료 판정 |
| `next_check_at` | 다음 자동/수동 재확인 예정 | 운영 큐 |
| `updated_at` | 행이 기술적으로 변경된 시각 | 아니오 |

### 12.2 권고 기본 주기

실제 운영 수치 확정 전 다음을 기본값으로 제안한다.

| 대상 | 자동/수동 주기 | 만료 시 조치 |
| --- | --- | --- |
| 데이터셋 약관·허락·schema | 매 실행 전 metadata hash 검사, 90일마다 수동 재검토, 변경 즉시 재검토 | 신규 실행 중지, 영향 필드 rights review |
| 공공 인허가·영업상태 | 데이터셋이 명시한 갱신 주기. 일간이면 일간 incremental | 변경 후보 생성. 누락만으로 폐업 금지 |
| 사업자 상태 API | 신규 registration/claim 제출 시와 승인 직전. 문의 활성 업체는 90일마다 또는 adverse signal 시 | 실패는 unknown; closed/suspended는 문의 보류+긴급 검수 |
| 업체명·주소·연락·행사 가능 | 90일 이내 재확인 권고 | 91~120일 재확인 안내, 이후 review queue |
| 가격·식대·대관료·취소 정책 | 최대 90일 또는 업체가 준 더 짧은 `valid_until` | 121일부터 공개 값 숨김 |
| provider 전체 문의 가능 | 마지막 핵심 확인 180일 | 문의 자동 중지. 공개는 `needs_update` 검수 |
| ownership 관계 | 365일 재확인 권고, 퇴사·분쟁·반송 신호 즉시 | grant 만료/중지 후 재검수 |
| 사진 이용 동의 | asset의 계약 만료일 또는 철회 이벤트 | 즉시 공개 derivative 차단, placeholder 전환 |
| 이용자 견적 | 과거 사례로 기준일 유지, 현재 가격으로 승격하지 않음 | 삭제보다 `historical` 라벨·비노출 정책 적용 |

90/120/180일은 `docs/05`, `docs/09`, 현행 `provider-status.js`와 004 maintenance를 유지한 값이다. 365일 ownership 재확인은 후속 운영 정책에서 승인할 권고값이다.

## 13. 자동 갱신 파이프라인

```text
[SourceDataset 승인]
  -> 권리·endpoint·schema preflight
  -> idempotent 수집(run/cursor)
  -> 허용 field만 비공개 observation 저장
  -> 정규화·개인정보 flag
  -> candidate/provider match + duplicate/change score
  -> 변경·폐업·주소·행사·만료 review case 생성
  -> 운영자 검수
  -> approved field assertion
  -> public projection 재계산
  -> 공개 read model/API
```

### 13.1 자동 허용

- 승인된 데이터셋에서 허용 field 수집
- 동일 dataset+source key+payload hash의 멱등 중복 제거
- 형식 정규화, 결측 구분, 개인 정보 flag
- 중복·주소 변경·폐업·행사 가능 후보 점수
- 필드 만료·다음 확인일·운영 큐 생성
- 121일 초과 변동 가격 숨김, 180일 초과 문의 중지
- authoritative adverse signal의 문의 임시 보류

### 13.2 수동 필수

- 데이터셋 최초 이용허락·공공누리·제3자 권리 승인
- source record와 provider canonical 연결 충돌
- 중복 병합, 지점 분리, 주소 이전 확정
- 폐업·재개업 공개 판정
- 행사 가능 capability 확정
- ownership 관계와 사업자 상태 결과 해석
- 업체 입력·고객 제보·사진·후기·견적 공개
- provider 최초 공개·suspension 해제·rollback

## 14. 실패 처리

| 실패 | 처리 | 금지 |
| --- | --- | --- |
| 429/일시 5xx/timeout | 지수 backoff+jitter, 데이터셋별 상한, cursor 보존, 반복 시 dead-letter | 실패를 변경 없음으로 기록 |
| 401/403/키 만료 | 즉시 source 중지, 비밀값 노출 없이 operations 알림 | 브라우저 anon key로 우회 |
| schema/parser 불일치 | 전체 run `stopped_schema`, 표본 격리, parser version 검수 | 부분 파싱 값을 기존 공개 값에 덮어쓰기 |
| 약관·공공누리·출처표시 변경 | `expired/blocked`, 신규 수집 중지, 영향 assertion 큐 | 이전 허락 snapshot으로 계속 신규 수집 |
| 빈 결과·페이지 누락 | `partial/anomaly`, 직전 snapshot 유지 | 전 업체 폐업 또는 삭제로 해석 |
| 원천 레코드 404/삭제 | `source_unavailable` 신호, 파생 주장 재검토 | provider 자체 폐업 자동 확정 |
| NTS API 오류/한도 | `unknown/api_error`, 재시도·수동 검수 | claim 반려·사업자 폐업 처리 |
| 중복 점수 충돌 | duplicate case와 양쪽 provider 잠금 | 자동 merge·행 삭제 |
| 사진 동의 철회 | 공개 derivative 즉시 차단, 감사 이력, placeholder | 원본을 공개 URL에 유지 |
| projection 실패 | 직전 승인 projection 유지, release 차단 | 후보/원천 JSON을 fallback 공개 |

모든 job은 `dataset_id + source_record_key + observation version` 또는 업무별 `dedupe_key`를 가져야 한다. retry count, 최종 오류, 다음 재시도 시각, 운영 처리자, 해결 사유를 기록한다.

## 15. 관리자 검수 큐와 감사

최소 큐는 다음과 같다.

1. source/rights 검토
2. 신규 후보·범위 외 판정
3. canonical match·중복·지점 분리
4. 주소 변경·휴폐업·원천 삭제
5. 행사 capability
6. 신규 registration
7. 사업자 조회·ownership claim·grant 회수
8. 업체 field revision
9. 고객 업체 정보 제안·견적
10. 사진 권리·동의
11. 자체 후기 내용·이용 증빙
12. stale/refresh/parser/API 실패
13. 신고·분쟁·철회·rollback

각 결정은 최소 다음 감사 필드를 갖는다.

```text
case_id, case_type, target_type/id
before_snapshot, proposed_snapshot, decided_snapshot
evidence_ids[], source_terms_snapshot_id
decision, reason_code, free_text_reason
policy_version, reviewer_id, reviewed_at
reversal_of_case_id
```

`taran_admin_events`의 page-view 통계는 이 감사 기록을 대신하지 않는다. `content` 역할은 업체 소유권·사업자·고객 증빙을 검수하지 않고, `owner/admin/operations` 중 승인된 최소 역할만 접근한다.

## 16. RLS·보안·개인정보 요구

| 데이터 | anon | 일반 회원 | 업체 grant | operations/admin |
| --- | --- | --- | --- | --- |
| public projection | 읽기 | 읽기 | 읽기 | 관리 |
| 후보/source observation/raw | 거부 | 거부 | 거부 | 허용된 목적만 |
| 본인 revision/quote/review | 거부 | 본인 생성·조회 | 본인 생성·조회 | 검수 |
| ownership claim | 거부 | 본인 요청·조회 | 본인 요청·조회 | 검수 |
| business number/서류 | 거부 | 본인 요청 상태만, 원문 재노출 최소화 | 동일 | 제한된 operations |
| provider revision | 거부 | 거부 | grant provider만 insert, 승인 불가 | 승인·rollback |
| media evidence | 거부 | 자기 경로 signed URL | 자기/업체 허용 경로 | 검수·감사 |

추가 요구:

- service role과 공공 API 비밀키는 Edge Function/격리 backend에만 둔다.
- 사업자번호, 담당자 전화·이메일, 견적서·영수증, 재직·관계 서류는 분석 이벤트·오류 메시지·공개 JSON에 넣지 않는다.
- 원문 사업자번호 검색이 필요하면 암호화 원문과 keyed hash를 분리하고 key rotation을 설계한다.
- 증빙 signed URL은 짧은 만료, 열람 감사, 보유기간·파기 정책을 갖는다.
- 공개 projection RLS는 후보 status가 아니라 명시적 publication gate 결과를 읽는다.
- 정적 공개 번들에 hidden/pending 후보를 넣지 않는다. OPS-009의 격리 방향과 일치해야 한다.

## 17. 상태·최근성 시나리오 점검

| 시나리오 | 기대 상태·동작 |
| --- | --- |
| 관광숙박업 API에서 새 호텔 발견 | SourceObservation+Candidate(quarantined). 행사 capability candidate. 공개·문의 0 |
| 상권 API에 음식점이 영업 중으로 존재 | 존재·업종 후보일 뿐 돌잔치 가능 아님. event review 대기 |
| 같은 상호·주소가 두 데이터셋에 존재 | 두 observation을 한 후보 match case로 묶되 자동 provider merge 금지 |
| 같은 사업자번호·인허가 ID에서 주소 변경 | location proposal과 이전 case. 이전 주소 보존, 관리자 승인 전 공개 덮어쓰기 금지 |
| source run이 빈 배열 반환 | partial/anomaly. 기존 provider 폐업 0건, 공개 값 유지 |
| 제출 사업자번호 NTS 결과 active | business=active. ownership과 publication은 계속 pending |
| NTS 결과 closed | 문의 임시 보류+긴급 검수. provider 폐업 공개는 운영 확인 후 |
| NTS API timeout | business=unknown/api_error. claim 자동 반려 금지 |
| ownership 승인 후 업체가 가격 수정 | revision/pending assertion. 승인 전 기존 가격 유지, `last_verified_at` 전체 갱신 금지 |
| 업체가 사진 업로드했지만 공개 동의 없음 | private asset만 존재, 공개 projection은 placeholder |
| 로그인 회원이 후기 작성 | self_reported+content pending. 승인 후 손품해방 후기, 예약 확인 라벨 없음 |
| 예약 증빙 없는 기존 후기 | `reservation_confirmed`로 소급 금지 |
| 견적 180만원만 제보 | 시점·인원·포함 항목 없으면 공개 불가. 비공개 보완 큐 |
| 가격 확인 121일 경과 | 가격 숨김, provider 기본 페이지는 다른 gate 충족 시 유지 가능 |
| 핵심 확인 180일 경과 | 문의 중지, needs_update 큐. 자동 폐업 처리 안 함 |
| 데이터셋 허락 조건 변경 | 신규 sync 중지, 영향 assertion rights review, 공개 확대 차단 |

## 18. 후속 구현 카드 분리

### 18.1 기존 카드·백로그에 연결

| 선후관계 | 기존 항목 | BE-005 산출물 사용 방식 |
| --- | --- | --- |
| 정책 선행 | BIZ-001, D-15~D-19 | 공개·고객 제안·업체 입력·빈 상태 정책 확정 |
| 공통 계약 | BE-004 | Source/Assertion/Revision/Ownership/Trust 논리 모델을 기존 001~005와 상세 매핑. DB 변경 금지 |
| 분류 | BE-003 | 공공 원천 업종과 8개 event capability의 candidate/confirmed 매핑 |
| 검수 운영 | OPS-008 | 13개 관리자 큐, SLA, 사유 코드, 이의·rollback 절차 |
| 공개 격리 | OPS-009 | 권리 미확인 NAVER 파생 정적 후보를 배포 산출물에서 격리. 사용자 D-18 승인 필요 |
| 공개 API | BE-001 | 승인 projection만 페이징하고 정적/운영 우선순위 확정 후 로더 전환 |
| 변경 감지 | BE-002 | SourceDataset 승인·법무·rate limit 후 허용 데이터셋만 구현. 현재 BLOCKED 유지 |
| 권한 검증 | QA-003 | 익명/회원/업체/operations/content/admin RLS·RPC·Storage E2E |

### 18.2 PM이 새 ID를 배정할 후속 카드 후보

1. **스키마 delta·migration 설계**: 기존 `taran_providers`, claims, registrations, reviews, contributions, Storage에 대한 additive table/view/RLS/RPC 계획. 운영 적용 없음.
2. **운영 DB migration 구현**: 백업·건수·rollback·staging E2E가 있는 additive migration. 운영 DB 적용은 사용자 승인.
3. **data.go.kr dataset registry seed**: 15155090, 15012005, 15122364 계열 등 승인된 dataset의 license snapshot만 seed. 각 데이터셋 법무·출처표시 승인 선행.
4. **NTS 15081808 server-side adapter**: provider-submitted number만, 100건 batch 상한, encrypted input, idempotency, retry, audit. 외부 API·비밀키·개인정보 승인 필요.
5. **candidate quarantine importer**: 4,960건을 삭제·공개하지 않고 rights_unknown/quarantined로 이관하는 dry-run+reconciliation. 원천 권리 결정과 사용자 승인 선행.
6. **public projection API·loader**: `content-runtime.js`의 오늘 날짜/published 기본값 제거, 승인 provenance·freshness 반환, 정적 fallback 금지.
7. **provider revision·claim workflow**: registration 승인과 publication/inquiry 분리, access grant·회수·reason 구현.
8. **review/quote/media evidence**: 자체 후기 검증 축, 조건부 견적, 사진 동의·철회·보유기간 구현. 예약 확인 후기는 예약 기반이 생길 때까지 비활성.
9. **refresh scheduler·dead-letter**: 허용 데이터셋별 cursor·schema/terms stop·retry·운영 큐. BE-002 법무 게이트 후.
10. **회귀·보안 검증**: 중복·주소·폐업·만료·rights change·RLS·signed URL·개인정보 비노출 테스트.

API·DB·라우팅·환경변수·공통 타입에 영향을 주는 위 카드들은 동시에 구현하지 않는다. BE-004 계약 → 운영 정책 → 스키마 delta → staging migration/RLS → projection API → 승인된 source adapter → 자동 갱신 순서가 안전하다.

## 19. 승인 게이트와 변경 요청

### `APPROVAL_REQUIRED`

- 운영 DB migration·backfill·candidate quarantine 이관
- data.go.kr 실제 활용신청·API 호출·운영계정 신청
- 국세청 API 호출, 사업자번호 저장·암호화·보유기간
- 비공개 증빙 보유·파기·열람 정책
- 운영 공개 최소 기준 D-01~D-03 확정
- 자동 문의 보류·공개 숨김의 운영 정책
- 운영 배포·최종 병합

### `CHANGE_REQUEST`

후속 구현은 다음 공통 계약을 바꾸므로 총괄 PM이 순서와 파일 소유권을 정해야 한다.

- DB: 신규 source/candidate/assertion/revision/access/audit/refresh 객체
- API/RPC: candidate ingest, provider revision, business verification, projection read
- Storage: 증빙과 공개 media derivative 분리
- 공통 loader: `content-runtime.js`, `scripts/core/config.js`, `scripts/core/api.js`
- 관리자: 검수 큐·diff·reason·rollback
- 공개 화면: source label, field 확인일, trust/freshness, 빈 상태

## 20. 완료 조건 대조

| 카드 완료 조건 | 결과 |
| --- | --- |
| 데이터 원천·허락 | SourceDataset/TermsSnapshot, data.go.kr 개별 ID, LOCALDATA 비의존, 공공누리·제3자 권리 분리 |
| 후보 ID·중복·주소·폐업 | Candidate/Identity/Alias/LocationHistory/duplicate case와 수동 확정 규칙 |
| 행사 가능 분류 | 8개 event capability의 candidate~operator_confirmed 상태 |
| 소유권·사업자 상태 | claim/business/access grant 분리, NTS API의 비발견 경계 |
| 업체 입력·표준 필드 | registration→revision→assertion→projection 계약과 필드 표 |
| 사진 동의 | asset별 rights/consent/만료/철회/placeholder |
| 관리자 검수 | 13개 큐와 immutable decision audit |
| 자체 후기·예약 확인 후기 | content moderation과 experience verification 분리, 현재 예약 확인 라벨 비활성 |
| 견적 | 시점·인원·포함/제외·증빙·PII가 있는 QuoteObservation |
| 신뢰 상태·최근 확인일 | 8개 독립 상태축과 날짜 의미 분리 |
| 최소 공개 조건 | 기본 10개 gate, 조건부 필드, 문의 6개 추가 gate |
| 자동 갱신·주기·실패 | 권리 preflight~projection pipeline, 90/120/180일, dataset cadence, failure matrix |
| 자동·수동 경계 | 자동 허용/수동 필수 명시 |
| 향후 구현 분리 | 기존 카드 연결+신규 카드 후보 10개, 승인·CHANGE_REQUEST 게이트 |

## 21. 결과 보고

```text
작업 ID: BE-005
결과: 공공데이터 발견부터 출처 허락, 후보 격리, canonical match, 필드 assertion, 행사 분류, 사업자·소유권, 업체 입력, 관리자 검수, 공개 projection, 최근 확인, 자동 갱신까지 논리 아키텍처 설계 완료
수정·추가·삭제 파일: ops/reports/BE-005-public-data-verification-architecture.md 신규 1개 / 수정·삭제 없음
스키마·API 영향: 이번 변경 없음. 후속 additive source/candidate/assertion/revision/access/audit/refresh 스키마와 projection API에 CHANGE_REQUEST 필요
실행 테스트·쿼리: 실제 스키마 001~005 및 admin-schema 정적 대조, QA-002 4,960건 기준선 대조, 로더·관리자·claim·registration·review·contribution 경로 대조, 상태/중복/최근성 15개 시나리오 설계 점검
건수 전후: 정적 후보 4,960 -> 4,960 (데이터 변경 없음), 운영 DB 미조회·미변경
완료 조건: 데이터 원천·필드·상태 전이·실패·수동 검수·갱신 주기·최소 공개·후속 카드 분리 충족
보안·개인정보 영향: 실제 변경 없음. 사업자번호·담당자·증빙·견적·사진 동의를 제한 영역으로 분리하는 요구 정의
롤백: 이 보고서 1개 제거
남은 문제: D-01~D-03/D-15~D-19, 데이터셋별 법무·출처표시, 운영 DB 적용 이력, RLS E2E, 사업자 API·보유기간 승인
범위 위반 여부: 없음. SQL/DB/API/수집기/원천/운영 권한 미변경
병합 권고: 보고서만 병합 권고. 제품·운영 적용은 승인 및 후속 카드 전 금지
```
