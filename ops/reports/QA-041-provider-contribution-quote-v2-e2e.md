# QA-041 업체·견적 v2 실제 격리 Supabase RPC/RLS E2E

## 작업 ID / 결과

- 작업 ID: `QA-041`
- 수정 회차: 2 — 마지막 허용 회차
- 전체 판정: `BLOCKED`
- SQL managed-session 판정: `PASS`
- 결과: 호환 수정이 포함된 `f11339d`의 migration 015 원문을 정확한 격리 Supabase에 재적용했고, `00e7522`의 최종 harness scenario가 `QA-041_SQL_ROLE_E2E_PASS`를 반환했다.
- 차단 이유: 실제 GoTrue 로그인·서명 JWT·PostgREST HTTP와 실제 AAL2 MFA 세션은 안전하게 고정된 자격 경로가 없어 실행하지 않았다. SQL의 `set local role`·`request.jwt.claims` 검증을 실제 자격 경계의 `PASS`로 대체하지 않는다.
- 안전 종료: 최종 통과 scenario 뒤 cleanup과 별도 final preflight를 실행했다. QA-041 namespace는 0이고 runtime 4종은 모두 `false`다.

## 수정·추가·삭제 파일

- 수정:
  - `scripts/tests/provider-contribution-quote-v2-supabase-e2e.mjs`
  - `ops/reports/QA-041-provider-contribution-quote-v2-e2e.md`
- harness commit:
  - `d3e4c28`: 허용되지 않은 합성 `operator_seed` 필드 키를 허용 필드로 교체
  - `00e7522`: review ID 조회를 postgres 테스트 setup으로 격리하고 동일 JWT claims·authenticated 역할을 재설정
- migration 015는 QA가 수정하지 않았다. backend-data 호환 수정 `f11339d`를 원문 그대로 재적용했다.
- 제품, package/lock, 환경변수, 브라우저 테스트 정본 변경: 0
- 추가·삭제: 없음

## 환경

- branch: `codex/qa-041-provider-contribution-quote-v2-e2e`
- 최종 scenario 대상 commit: `00e7522`
- 격리 DB: Taran 조직 Free 프로젝트 `Sonpum QA Isolated`
- 브라우저 재식별: 프로젝트명 일치, `Healthy`, compute `nano`
- migration 상태: v2 table 22개, migration 015 원문 재적용 성공
- 금지 환경 영향: 운영 Supabase, 다른 프로젝트, 실제 고객·업체·견적·증빙, 실제 Storage, 외부 알림, production 모두 0
- 비밀값: token, key, 실제 이메일, 실제 UUID, project ref를 파일·보고·메시지에 기록하지 않음

## 실행 테스트·명령

| 검사 | 결과 | 재현 근거 |
| --- | --- | --- |
| 수정 2회 시작 preflight | PASS | QA 카운트 7종 0, `namespace_zero=true`, runtime false 플래그 4종 true |
| migration 015 원문 확인 | PASS | `f11339d`, 2,261줄·93,138 bytes, 작업 트리 diff 0 |
| migration 015 재적용 | PASS | SQL Editor `Success. No rows returned` |
| 갱신 함수 정의 확인 | PASS | `jsonb_object_keys(p_fields)` 존재 true, `jsonb_object_length` 부재 true |
| 최초 수정 2회 scenario | FAIL_FIXED | SQLSTATE `22023`, 합성 `price_note` 필드가 사전에 없음 |
| harness 필드 수정 자체검사 | PASS | 세 모드 출력·구문·diff check 통과, `d3e4c28` |
| 두 번째 scenario | FAIL_FIXED | SQLSTATE `42501`, authenticated base-table SELECT가 정상 거부됨 |
| review setup 격리 자체검사 | PASS | 세 모드 출력·구문·diff check 통과, `00e7522` |
| 최종 SQL managed-session scenario | PASS | `QA-041_SQL_ROLE_E2E_PASS`, synthetic submissions 4, completed v2 job 1, runtime false 4종 |
| 최종 cleanup | PASS | QA 카운트 7종 모두 0, `namespace_zero=true` |
| 별도 final preflight | PASS | namespace 0, runtime false 플래그 4종 모두 true |
| 실제 GoTrue/JWT/PostgREST HTTP | BLOCKED | 고정 격리 자격 경로 없음 |
| 실제 AAL2 MFA | BLOCKED | 실제 MFA 세션 없음 |

최종 harness 로컬 검사:

```text
C:\Users\mch45\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe --check scripts\tests\provider-contribution-quote-v2-supabase-e2e.mjs
C:\Users\mch45\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\tests\provider-contribution-quote-v2-supabase-e2e.mjs preflight
C:\Users\mch45\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\tests\provider-contribution-quote-v2-supabase-e2e.mjs scenario
C:\Users\mch45\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\tests\provider-contribution-quote-v2-supabase-e2e.mjs cleanup
```

최종 브라우저 순서:

```text
preflight → migration 015 원문 재적용 → 함수 정의 확인
→ scenario → cleanup → final preflight
```

## 통과·실패

### SQL managed-session 통과

최종 scenario는 다음 계약을 모두 통과했다.

- anon/customer/provider/content/operations·service role 분리
- anon·authenticated의 v2 private base-table 직접 조회 거부
- content의 operations RPC 거부
- operations AAL1 거부와 AAL2 허용
- 업체 권한 보유 계정의 customer reward 위장 거부
- customer 견적 제출과 private base-table 조회 거부
- 자기검수 배정 거부
- 동일 HMAC 두 번째 `unique` 거부
- 서로 다른 AAL2 운영자 2인의 독립 승인
- 공개 RPC 1건과 비공개 열 노출 0
- 분쟁 직후 공개 결과 0
- 원검수자 분쟁 해결 거부, 독립 운영자 해결 허용
- 자유 문장 분쟁 사유 거부와 허용 사유 코드 통과
- 철회 뒤 active quote grant 0
- 9-target 완료 전 삭제 미완료와 private 행 유지
- target 9 완료 후 private 잔여 0
- v2 삭제 job 전 계정 삭제 완료 거부와 job 완료 후 허용
- scenario 종료 runtime 4종 false

### 중간 실패와 조치

1. SQLSTATE `22023`, `Unknown or disallowed field: price_note`
   - 단계: operations 자기검수용 합성 `operator_seed` 정보 제출
   - 원인: harness fixture가 migration의 허용 필드 사전에 없는 키를 사용
   - 조치: 허용된 `provider_name`으로 키만 교체, commit `d3e4c28`
2. SQLSTATE `42501`, `permission denied for table taran_review_cases_v2`
   - 단계: 합성 review ID를 직접 조회하는 테스트 준비
   - 의미: authenticated base-table 차단이 정상 작동
   - 조치: review ID 조회 2개 구간만 postgres 테스트 setup으로 격리하고 동일 claims·role을 복원, commit `00e7522`

각 실패 뒤에는 즉시 cleanup과 별도 final preflight를 실행해 namespace 0과 runtime false를 확인한 후 다음 수정을 진행했다.

### 미실행

- 실제 GoTrue 계정 가입·로그인·세션 갱신
- 실제 서명 JWT의 PostgREST base-table/RPC HTTP 상태
- 실제 MFA enrollment·challenge를 거친 AAL2 토큰
- 실제 Storage upload/object/bucket/signed URL/scanner/preview
- 실제 이메일·SMS·webhook·outbox 전달

## 재현 근거

1. 수정 2회 시작 preflight는 namespace 0과 runtime 4종 false를 반환했다.
2. `f11339d`의 migration 015 원문 전체를 SQL Editor에 붙여 재적용했고 오류 없이 완료됐다.
3. `pg_get_functiondef` 확인에서 portable count가 존재하고 이전 호출은 제거됐음을 확인했다.
4. 중간 harness 준비 오류 2건을 각각 첫 오류에서 중단·cleanup한 뒤 최소 범위로 수정하고 별도 commit했다.
5. `00e7522` scenario는 `QA-041_SQL_ROLE_E2E_PASS / 4 / 1 / true / true / true / true`를 반환했다.
6. 최종 cleanup과 별도 final preflight에서 모든 QA 카운트가 0이고 runtime false 플래그가 모두 true였다.

## 완료 조건

| 완료 조건 | 상태 |
| --- | --- |
| migration 최초·멱등 적용 | PASS |
| 호환 수정 함수 CREATE OR REPLACE 갱신 | PASS |
| 정확한 격리 프로젝트·runtime 시작 false | PASS |
| anon/customer/provider/content/operations SQL 역할 기대값 | PASS |
| AAL1 deny·AAL2 2인 승인·자기검수 deny | PASS — SQL claims |
| HMAC unique·provider reward deny | PASS |
| public RPC 최소 열 | PASS |
| 철회·분쟁 독립 재심 | PASS |
| 9-target 삭제·계정 삭제 연계 | PASS |
| 종료 합성 Auth·행 0 | PASS |
| 종료 runtime 4종 false | PASS |
| 실제 GoTrue JWT/PostgREST HTTP | BLOCKED |
| 실제 AAL2 MFA | BLOCKED |
| secret·PII output 0 | PASS |

## 보안·개인정보 영향

- 실제 개인정보·실제 견적·실제 증빙 처리: 0
- 실제 upload/Storage object·bucket/signed URL/scanner/preview: 0
- 외부 이메일·SMS·webhook: 0
- 고정 QA-041 합성 Auth·행만 사용했고 최종 잔여는 0이다.
- runtime contribution/evidence/public projection/exact amount는 종료 시 모두 `false`다.
- 실제 운영 권한·비밀값을 파일이나 보고서에 저장하지 않았다.

SQL Editor의 `set local role`과 `request.jwt.claims`는 실제 Supabase PostgreSQL 함수 권한·RLS·RPC를 검증하는 데 유효하다. 그러나 실제 GoTrue 로그인, 서명된 JWT, PostgREST HTTP 권한 경계, 실제 AAL2 MFA를 대체하지 않는다.

## 신규 결함

- migration 015의 `jsonb_object_length` 호환 결함은 `f11339d` 재적용과 함수 정의 확인으로 해소됐다.
- 최종 SQL scenario에서 새 migration/RLS/RPC 결함은 발견되지 않았다.
- 후속 후보: 운영자가 private base table을 열지 않고 review queue·review ID를 조회할 최소권한 RPC가 현재 없다.
  - 심각도: `MEDIUM`
  - 영향: 테스트는 postgres setup으로 ID를 준비할 수 있지만 실제 운영 UI/API는 review 대상 탐색 경로가 필요하다.
  - 추천 담당: `backend-data`
  - 권고: 운영 review queue의 공개 열·역할·AAL·페이지 제한·감사 정책을 별도 카드로 설계하고, base-table 권한을 열지 않는다.

## 병합 권고

- `f11339d`, `d3e4c28`, `00e7522`와 이 보고서는 격리 SQL 재현·회귀 근거로 총괄 PM 검수 대상에 포함할 수 있다.
- SQL managed-session E2E는 `PASS`로 인정할 수 있다.
- QA-041 전체는 실제 GoTrue JWT/PostgREST HTTP 및 실제 AAL2 MFA가 없어 `BLOCKED`이며 `DONE` 처리하지 않는다.
- runtime 4종은 계속 `false`로 유지하고 실제 업체·견적·증빙 접수·공개를 활성화하지 않는다.
- 운영 review queue RPC는 base-table 권한 확대 없이 별도 backend-data 카드로 진행한다.
