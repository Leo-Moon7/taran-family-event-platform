# BE-027 업체 기여 review queue v2 최소권한 RPC

## 작업 ID / 결과

- 작업 ID: `BE-027`
- 결과: `IMPLEMENTED — 총괄 PM·독립 검수 전`
- 기준: migration `015_provider_contribution_quote_v2.sql` 위에 additive `016`을 추가했다.
- 운영 DB·실제 Auth·실제 업체/고객/견적/증빙·외부 서비스 변경: `0`

## 수정·추가·삭제 파일

추가:

- `migrations/016_provider_contribution_review_queue_v2.sql`
- `scripts/tests/provider-contribution-review-queue-v2.mjs`
- `ops/reports/BE-027-provider-contribution-review-queue-v2.md`

수정·삭제: 없음.

## 스키마·API 영향

신규 RPC 하나만 추가한다.

```sql
public.taran_list_review_queue_v2(
  p_review_state text default 'open',
  p_page_size integer default 20,
  p_before_created_at timestamptz default null,
  p_before_review_case_id uuid default null
)
```

반환 열은 다음 6개로 고정했다.

1. `review_case_id`
2. `source_kind`
3. `canonical_event_code`
4. `risk_level`
5. `review_state`
6. `created_at`

동작 계약:

- `owner`·`admin`·`operations`이면서 AAL2인 인증 사용자만 허용한다.
- 익명, customer, provider, content, AAL1 운영자, 탈퇴 tombstone 활성 사용자는 함수 본문에서 `42501`로 거부한다.
- 상태는 `open`, `assigned`, `approved`, `rejected`, `cancelled` 중 하나를 반드시 사용하며 그 외 값과 `NULL`은 `22023`으로 거부한다.
- page size는 `1..50`만 허용하며 clamp하지 않는다.
- `(created_at DESC, review_case_id DESC)`로 정렬하고 두 값을 함께 받는 exclusive cursor를 사용한다. offset pagination은 사용하지 않는다.
- `SECURITY DEFINER`, `search_path = public, pg_catalog`, `row_security = off`를 고정했다.
- 실행 권한은 `authenticated`에만 부여하며 `PUBLIC`·`anon`에는 부여하지 않는다. 인증 역할에 실행 권한이 있어도 함수 본문의 역할·AAL·탈퇴 게이트가 다시 거부한다.
- 신규/변경 base-table browser grant는 없다.
- 기존 `taran_assign_review_case_v2`, `taran_decide_information_v2`, `taran_decide_quote_v2`를 재정의하지 않는다.

## 실행 테스트·쿼리

실행 환경:

- Node.js `v24.14.0`
- 기존 pnpm store의 `@electric-sql/pglite 0.3.16`을 임시 모듈 경로로 참조
- 패키지·잠금 파일 설치/변경 없음
- 네트워크·운영 DB 연결 없음

결과:

| 검사 | 결과 |
| --- | --- |
| `node --check scripts/tests/provider-contribution-review-queue-v2.mjs` | PASS |
| BE-027 정적 계약 | PASS, 11/11 |
| PGlite migration 016 최초 적용 | PASS |
| PGlite migration 016 재적용 | PASS |
| PGlite ACL·역할·AAL·탈퇴·필터·limit·cursor·projection 행동 | PASS, 20/20 |
| `scripts/tests/provider-contribution-quote-v2.mjs` | PASS, 28/28 |
| `scripts/tests/provider-contribution-quote-v2-model.mjs` | PASS, 60/60 |
| `scripts/tests/admin-provider-workspace-rpc.mjs` | PASS |
| `scripts/tests/admin-provider-operations.mjs` | PASS |

PGlite 합성 행동 검증:

- `owner`·`admin`·`operations` AAL2 허용
- 익명·customer·provider·content·operations AAL1·탈퇴 활성 operations 거부
- `anon` EXECUTE 없음, `authenticated` EXECUTE 있음
- 잘못된/NULL 상태, page size `0`·`51`, 한쪽만 있는 cursor 거부
- 같은 생성시각의 UUID tie-break, 다음 페이지 중복·누락 없음
- 상태 필터 분리와 반환 열 이름 6개 일치

## 건수 전후

| 항목 | 전 | 후 |
| --- | ---: | ---: |
| 신규 review queue RPC | 0 | 1 |
| 신규/변경 테이블 | 0 | 0 |
| 신규/변경 base-table browser grant | 0 | 0 |
| 변경된 기존 assign/decide RPC | 0 | 0 |
| 반환 열 | 없음 | 6 |
| 최대 page size | 없음 | 50 |
| 운영 DB 행 변경 | 0 | 0 |
| 실제 자료 사용 | 0 | 0 |

PGlite fixture는 메모리 내 합성 submission 4건과 review case 4건만 사용했고 종료 시 폐기했다.

## 완료 조건

- operations 이상+AAL2 허용: 충족
- AAL1/content/provider/customer/anon 거부: 충족
- contributor/evidence/금액/fingerprint/provider owner/reviewer 신원 비노출: 충족
- 상태 필터와 page size 50 상한: 충족
- 안정적·결정론적 cursor pagination: 충족
- base table grant 0 유지: 충족
- 기존 assign/decide 계약 불변: 충족
- 최초·재적용: PGlite PASS
- BE-019·BE-023·BE-024 회귀: PASS

## 보안·개인정보 영향

- 제출자 UUID·이메일, 증빙/object key, 실제 금액, fingerprint, 업체 ID·소유자, 배정/결정 검수자 신원은 SELECT와 반환 선언에 포함하지 않았다.
- 권한 검사 전에 queue 데이터를 조회하지 않아 실패 요청이 행 존재 여부를 확인할 수 없다.
- 엄격한 상태 한정과 50건 상한으로 전체 private queue 대량 열람을 막는다.
- 읽기 RPC는 audit·review·submission·quote·evidence base table 권한을 브라우저 역할에 열지 않는다.
- 운영 DB, Storage, 실제 개인정보, 외부 통신 영향은 없다.

## 롤백

격리 환경에서 다음 신규 함수만 제거하면 된다.

```sql
drop function public.taran_list_review_queue_v2(
  text, integer, timestamptz, uuid
);
```

migration `001~015`와 기존 데이터는 변경하지 않았으므로 데이터 롤백은 없다. 운영에는 적용하지 않았다.

## 남은 문제

- PGlite는 SQL 계약·권한 함수 본문을 검증했지만 실제 GoTrue JWT, PostgREST, MFA AAL2 세션을 대신하지 않는다. 격리 Supabase 실제 Auth E2E는 후속 QA 카드에서 검증해야 한다.
- 관리자 UI 연결, 실제 review 배정/결정, 운영 적용은 BE-027 범위 밖이다.
- 변경 요청·승인 필요: 없음. 운영 DB 적용은 별도 사용자 승인 필요.

## 병합 권고

`PASS` 독립 검수 후 세 파일을 함께 병합할 것을 권고한다. 적용 순서는 migration `015` 다음 `016`이다. 운영 DB 적용·배포는 이 병합 권고에 포함하지 않는다.
