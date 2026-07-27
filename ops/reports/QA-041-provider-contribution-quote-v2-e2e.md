# QA-041 업체·견적 v2 실제 격리 Supabase RPC/RLS E2E

## 작업 ID / 결과

- 작업 ID: `QA-041`
- 판정: `BLOCKED`
- 완료 상태: 격리 프로젝트·migration·runtime·합성 잔여 안전 게이트만 실제 확인했다. 역할별 변이 시나리오와 실제 Auth/JWT/PostgREST E2E는 실행하지 않았으므로 `PASS`가 아니다.

## 수정·추가·삭제 파일

- 추가: `scripts/tests/provider-contribution-quote-v2-supabase-e2e.mjs`
- 추가: `ops/reports/QA-041-provider-contribution-quote-v2-e2e.md`
- 수정·삭제: 없음
- migration `001~015`, 제품, package/lock, 환경변수, 브라우저 테스트 정본 변경: 0

## 환경

- 로컬 기준: branch `codex/qa-041-provider-contribution-quote-v2-e2e`, base `b969191`
- 격리 DB: Taran 조직의 Free 프로젝트 `Sonpum QA Isolated`
- 재식별 결과: `Healthy`, compute `nano`
- 금지 환경 영향: 운영 Supabase, 실제 고객·업체·견적·증빙, Storage, 외부 알림, GitHub main, production 모두 0
- 비밀값: token, key, 실제 이메일, 실제 UUID, project ref를 파일·보고·메시지에 기록하지 않음

## 실행 테스트·명령

| 검사 | 결과 | 근거 |
| --- | --- | --- |
| 브라우저 프로젝트 재식별 | PASS | Taran / Free / 정확한 프로젝트명 / Healthy / nano |
| migration 015 설치 상태 | PASS | public v2 table 22개 |
| migration 015 최초·동일 원문 재적용 | 이전 재개 지점 PASS | 이전 에이전트가 commit 원문으로 각 1회 실행했고 오류 0. 이번 재개에서는 재실행하지 않음 |
| 마지막 읽기 전용 통합 감사 | PASS | JSON 결과가 `v2_tables=22`, `runtime_false=true`, `namespace_zero=true` |
| QA-041 합성 Auth·행 사전 잔여 | PASS | Auth/admin/provider/submission/evidence/provider grant/audit prefix count 모두 0 |
| E2E harness 모듈 구문 로드 | PASS | 브라우저 제어용 Node 환경에서 ESM import 및 SQL 세 그룹 export 확인 |
| 로컬 CLI 실행 | BLOCKED_ENV | 현재 PowerShell PATH에 `node` 실행 파일이 없어 CLI 실행 불가 |
| SQL 역할 변이 시나리오 | NOT_RUN | 중단 지시에 따라 실제 합성 변이를 시작하지 않음 |
| 실제 Auth 가입·로그인·JWT·PostgREST HTTP | NOT_RUN | 안전하게 범위가 고정된 test credential/token을 확보하지 않음 |

작성한 harness는 `preflight`, `scenario`, `cleanup` 세 모드를 제공한다. 고정 `QA-041` namespace, transaction, `set local role`, `request.jwt.claims`, base-table deny, 최소권한 RPC, 2인 검수, HMAC unique, 철회·분쟁·9-target 삭제·계정 삭제 연계, 별도 cleanup, 최종 runtime false/잔여 0을 포함한다. 단, scenario SQL은 실제 DB에서 실행·파싱되지 않았으므로 검증 완료 근거로 사용하면 안 된다.

## 통과·실패

### 통과

- 정확한 무료 격리 프로젝트를 재식별했다.
- migration 015의 v2 table 22개가 존재한다.
- runtime 4종이 모두 `false`다.
- QA-041 합성 Auth와 prefix 행은 모두 0이다.
- 실제 합성 변이를 시작하지 않았으므로 cleanup 대상도 0이다.
- Storage object·bucket·policy, signed URL, scanner, preview, 외부 전송을 만들지 않았다.

### 미검증

- anon/customer/provider/content/operations의 실제 PostgREST base-table/RPC HTTP
- 실제 Auth user 생성·로그인·세션 갱신과 JWT `aal`
- SQL managed session에서의 `set local role`·`request.jwt.claims` 역할 시나리오
- AAL1 거부와 서로 다른 AAL2 운영자 2인 승인
- 자기검수 거부
- 동일 HMAC 두 번째 `unique` 거부
- 활성 provider grant 계정의 customer reward 위장 거부
- public RPC 반환 private 열 0
- 철회 뒤 public 0과 grant revoke
- 원검수자 dispute resolve 거부, 독립 operations 허용, 자유문 reason 거부
- 9-target 완료 전 미완료와 완료 후 private 잔여 0
- v2 job 전 계정 삭제 완료 거부와 완료 후 허용

## 재현 근거

1. 기준 commit `b969191`의 migration 015는 격리 프로젝트에 설치되어 v2 table 22개를 반환했다.
2. 마지막 읽기 전용 감사는 한 셀에 다음 세 값만 반환했다.
   - v2 tables: 22
   - runtime 4종 false: true
   - QA-041 namespace zero: true
3. harness의 `preflight`는 동일 prefix와 고정 합성 actor namespace를 count-only로 검사한다.
4. harness의 `scenario`는 실제 파일 없이 evidence metadata만 사용하도록 작성했다.
5. harness의 `cleanup`은 해당 prefix·actor만 대상으로 하며 runtime을 false로 복구한 뒤 동일 preflight를 재실행하도록 작성했다.

## 완료 조건

| 완료 조건 | 상태 |
| --- | --- |
| migration 최초·멱등 적용 | 이전 재개 지점 PASS |
| 정확한 격리 프로젝트·runtime 시작 false | PASS |
| anon/customer/provider/content/operations 역할 기대값 | 미검증 |
| AAL1 deny·AAL2 2인 승인·자기검수 deny | 미검증 |
| HMAC unique·provider reward deny | 미검증 |
| public RPC 최소 열 | 미검증 |
| 철회·분쟁 독립 재심 | 미검증 |
| 9-target 삭제·계정 삭제 연계 | 미검증 |
| 종료 합성 Auth·행·임시 객체 0 | PASS — 합성 변이 자체가 0 |
| 종료 runtime 4종 false | PASS |
| secret·PII output 0 | PASS |

## 보안·개인정보 영향

- 실제 개인정보·실제 견적·실제 증빙 처리: 0
- 실제 Auth 계정 생성: 0
- 실제 upload/Storage/signed URL/scanner/preview: 0
- 외부 이메일·SMS·webhook: 0
- DB 변이: 이전 에이전트의 격리 migration 015 적용 외 이번 재개 변이 0
- SQL Editor의 count-only 감사만 실행했다.

SQL Editor의 `set local role`과 `request.jwt.claims`는 실제 Supabase Postgres의 권한 함수·RLS·RPC를 검증하는 데 유효하지만 실제 GoTrue 로그인, 서명된 JWT, PostgREST HTTP 권한 경계를 대체하지 않는다.

## 신규 결함

- 제품·migration 결함으로 확정한 항목은 없다. 필수 역할 시나리오가 미실행이라 결함 부재도 증명하지 못했다.
- 환경 blocker:
  - 현재 로컬 shell에서 `node` CLI를 실행할 수 없다.
  - 실제 Auth/JWT/PostgREST용으로 안전하게 격리된 credential/token 경로가 제공되지 않았다.
  - 중단 지시에 따라 SQL 역할 scenario도 실행하지 않았다.

## 병합 권고

- 제품·migration의 `PASS` 또는 운영 적용 근거로 병합 금지.
- 이 commit은 미실행 harness와 `BLOCKED` 감사 기록으로만 보존 가능하다.
- 재개 시 정확한 같은 격리 프로젝트에서 `preflight → scenario → cleanup → final preflight`를 실행하고, 별도의 합성 Auth/PostgREST 세션으로 HTTP 상태·DB 변화까지 확인해야 한다.
- 재개 후에도 실제 upload/signed URL/scanner/preview는 fail-closed 미검증으로 유지한다.
