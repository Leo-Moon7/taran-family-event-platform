# QA-041 업체·견적 v2 실제 격리 Supabase RPC/RLS E2E

## 작업 ID / 결과

- 작업 ID: `QA-041`
- 수정 회차: 1
- 판정: `REVISION_REQUIRED`
- 결과: commit `9fe7b76`의 `scenario` SQL을 정확한 격리 프로젝트에서 실제 실행했다. 업체 정보 제출 단계에서 migration 015의 PostgreSQL 호환성 결함이 SQLSTATE `42883`로 재현되어 이후 역할 시나리오는 진행되지 않았다.
- 안전 종료: 실패 직후 `cleanup`과 별도 final preflight를 실행했다. QA-041 namespace는 0이고 runtime 4종은 모두 `false`다.
- 별도 차단: 실제 GoTrue 서명 JWT/PostgREST HTTP 및 AAL2 MFA 자격 경로는 실행하지 않았으므로 이 부분은 계속 `BLOCKED`다.

## 수정·추가·삭제 파일

- 수정: `ops/reports/QA-041-provider-contribution-quote-v2-e2e.md`
- harness: `scripts/tests/provider-contribution-quote-v2-supabase-e2e.mjs`는 변경하지 않았다. 기존 scenario가 실제 결함을 정확히 재현했고 migration 오류를 우회하거나 기대값을 낮출 변경은 하지 않았다.
- 추가·삭제: 없음
- migration `001~015`, 제품, package/lock, 환경변수, 브라우저 테스트 정본 변경: 0

## 환경

- 로컬 branch: `codex/qa-041-provider-contribution-quote-v2-e2e`
- 실행 대상 commit: `9fe7b76`
- 격리 DB: Taran 조직 Free 프로젝트 `Sonpum QA Isolated`
- 브라우저 재식별: 프로젝트명 일치, `Healthy`, compute `nano`
- migration 상태: 015 최초 적용과 동일 원문 재적용 성공 이력, v2 table 22개
- 금지 환경 영향: 운영 Supabase, 다른 프로젝트, 실제 고객·업체·견적·증빙, Storage, 외부 알림, production 모두 0
- 비밀값: token, key, 실제 이메일, 실제 UUID, project ref를 파일·보고·메시지에 기록하지 않음

## 실행 테스트·명령

| 검사 | 결과 | 재현 근거 |
| --- | --- | --- |
| 브라우저 프로젝트 재식별 | PASS | Taran / Free / 정확한 프로젝트명 / Healthy / nano |
| scenario 전 안전 게이트 확인 | PASS | SQL Editor의 직전 감사 결과 `v2_tables=22`, `runtime_false=true`, `namespace_zero=true`를 확인했고 PM이 해당 값으로 실행을 승인 |
| harness 구문 검사 | PASS | 지정 Node로 `--check` 성공 |
| commit scenario SQL 생성 | PASS | 지정 Node로 `scenario` 출력 587줄·21,591자 생성 |
| SQL managed-session scenario | FAIL | SQLSTATE `42883`, 첫 실패 단계와 함수는 아래에 기록 |
| cleanup | PASS | prefix 카운트 7종 모두 0, `namespace_zero=true` |
| 별도 final preflight | PASS | prefix 카운트 7종 모두 0, namespace 0, runtime false 플래그 4종 모두 `true` |
| 실제 Auth/JWT/PostgREST HTTP | BLOCKED | 안전하게 고정된 실제 자격 경로가 없어 실행하지 않음 |
| 실제 AAL2 MFA | BLOCKED | SQL의 claim 모의와 별개인 실제 MFA 세션이 없어 실행하지 않음 |

사용한 로컬 명령:

```text
C:\Users\mch45\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe --check scripts\tests\provider-contribution-quote-v2-supabase-e2e.mjs
C:\Users\mch45\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\tests\provider-contribution-quote-v2-supabase-e2e.mjs scenario
```

브라우저 실행 순서:

```text
직전 안전 감사 확인 → scenario → cleanup → final preflight
```

추가 scenario 재실행은 하지 않았다.

## 통과·실패

### 실패

- SQLSTATE: `42883`
- 오류: `function jsonb_object_length(jsonb) does not exist`
- migration 함수: `public.taran_submit_information_v2(text,text,text,jsonb,text,text)`
- 함수 위치: PL/pgSQL 함수 line 25의 입력 필드 개수 검사
- scenario 위치: inline code block line 195의 첫 `taran_submit_information_v2` 대입
- 시나리오 단계: `provider: scoped submission RPC allowed, base table denied`
- 중단 지점: 업체 역할의 정보 제출 RPC 호출. 이 호출이 실패해 뒤의 base-table deny, 자기검수, 견적, 2인 승인, 공개 RPC, 분쟁, 철회, 9-target 삭제 시나리오는 실행되지 않았다.

migration 015는 PL/pgSQL 함수 본문에서 `jsonb_object_length(p_fields)`를 호출한다. 해당 함수가 대상 PostgreSQL에 없기 때문에 함수 생성과 migration 재적용은 성공해도 실제 RPC 실행 시 이름 해석에서 `42883`이 발생한다.

### 통과

- 정확한 격리 프로젝트와 Healthy/nano 상태를 재확인했다.
- scenario 전 v2 table 22개, runtime 4종 false, namespace 0을 확인했다.
- scenario SQL 전체 587줄을 SQL Editor에 붙여 실행해 첫 migration 오류를 재현했다.
- 실패 직후 cleanup을 완료했다.
- final preflight에서 Auth/admin/provider/submission/evidence/provider grant/audit QA-041 카운트가 모두 0이었다.
- final preflight에서 contribution/evidence/public projection/exact amount runtime이 모두 `false`였다.
- 실제 Storage object·bucket·policy, signed URL, scanner, preview, 외부 이메일·SMS·webhook을 만들거나 호출하지 않았다.

## 재현 근거

1. `9fe7b76`의 harness를 지정 Node로 실행해 scenario SQL을 생성했다.
2. 브라우저에서 정확한 프로젝트명, Taran Free, Healthy, nano를 확인했다.
3. 직전 안전 감사의 `22 / true / true` 값을 확인한 뒤 scenario를 실행했다.
4. PostgreSQL은 첫 정보 제출 RPC에서 SQLSTATE `42883`과 함수/inline-block 위치를 반환했다.
5. 즉시 cleanup을 실행했고 7개 namespace 카운트가 모두 0이었다.
6. 별도 final preflight를 다시 실행해 namespace 0과 runtime 4종 false를 확인했다.

## 완료 조건

| 완료 조건 | 상태 |
| --- | --- |
| migration 최초·멱등 적용 | PASS — 이전 실행 이력 |
| 정확한 격리 프로젝트·runtime 시작 false | PASS |
| commit 그대로 scenario SQL 실제 실행 | PASS |
| anon/customer/provider/content/operations 역할 기대값 | FAIL/BLOCKED — provider 정보 제출 RPC에서 `42883` |
| AAL1 deny·AAL2 2인 승인·자기검수 deny | NOT_REACHED |
| HMAC unique·provider reward deny | NOT_REACHED |
| public RPC 최소 열 | NOT_REACHED |
| 철회·분쟁 독립 재심 | NOT_REACHED |
| 9-target 삭제·계정 삭제 연계 | NOT_REACHED |
| 종료 합성 Auth·행 0 | PASS |
| 종료 runtime 4종 false | PASS |
| 실제 GoTrue JWT/PostgREST/AAL2 MFA | BLOCKED |
| secret·PII output 0 | PASS |

## 보안·개인정보 영향

- 실제 개인정보·실제 견적·실제 증빙 처리: 0
- 실제 upload/Storage/signed URL/scanner/preview: 0
- 외부 이메일·SMS·webhook: 0
- scenario의 고정 QA-041 합성 Auth·행은 transaction 실패 후 cleanup됐고 final 잔여는 0이다.
- runtime 4종은 종료 시 모두 `false`다.
- 실제 운영 권한·비밀값을 파일이나 보고서에 저장하지 않았다.

SQL Editor의 `set local role`과 `request.jwt.claims`는 실제 Supabase Postgres의 함수 권한·RLS/RPC를 검증하는 데 유효하지만 실제 GoTrue 로그인, 서명된 JWT, PostgREST HTTP 권한 경계, 실제 AAL2 MFA를 대체하지 않는다. 이번 scenario는 첫 RPC 오류에서 중단됐으므로 SQL managed-session 역할 검증도 완료되지 않았다.

## 신규 결함

- 결함: migration 015의 `taran_submit_information_v2`가 대상 PostgreSQL에 없는 `jsonb_object_length(jsonb)`를 호출한다.
- 심각도: `HIGH` — 정보 제출 핵심 RPC가 실행 불가하고 이후 RLS/RPC E2E 전체를 차단한다.
- 영향: provider/content/operations의 정보 제출 경로가 동일 함수에서 실패할 수 있다. 현재 runtime이 기본 비활성이고 격리 환경만 사용해 운영 데이터 노출은 없다.
- 예상 원인: PGlite 모델 검사에서 허용된 JSONB 함수 가정과 실제 Supabase PostgreSQL 함수 집합의 차이.
- 추천 담당: `backend-data`, BE-019/migration 015 소유자.
- 재현: 고정 QA-041 namespace에서 유효한 JSON object를 전달해 `taran_submit_information_v2`를 호출하면 SQLSTATE `42883`.
- 수정 요청: migration 015의 JSON object 필드 수 검사를 실제 PostgreSQL 호환 방식으로 고친 뒤 동일 원문 멱등 적용과 QA-041 전체 재실행이 필요하다.

## 병합 권고

- QA-041 제품 판정과 migration 015의 Supabase 준비 상태는 `PASS`로 병합하거나 릴리스하지 않는다.
- 이 보고서 수정 commit은 재현·cleanup 증거로 보존할 수 있다.
- backend-data 수정 후 새 격리 프로젝트 또는 정리된 동일 프로젝트에서 migration 적용·재적용을 확인하고 `preflight → scenario → cleanup → final preflight` 전체를 다시 실행한다.
- SQL scenario 통과 뒤에도 실제 GoTrue JWT/PostgREST HTTP와 실제 AAL2 MFA는 별도 안전 자격 경로에서 검증해야 한다.
