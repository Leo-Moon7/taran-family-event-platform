# BE-025 Auth 최종 삭제 worker와 비식별 완료 이력

- 작업 ID: BE-025
- 결과: PASS 후보 — 실제 격리 Supabase E2E는 QA-040에서 수행
- 기준: D-42 승인, D-24 R-A, D-31 탈퇴 비식별화, BE-025 작업 카드
- 실행 범위: 신규 migration·Edge Function·전용 테스트만 구현. 운영 DB·실제 계정·제품 UI·배포·스케줄은 변경하지 않음

## 1. 구현 결과

### migration 계약

`migrations/013_account_deletion_worker.sql`은 다음 계약을 추가한다.

1. 기존 탈퇴 요청에 시도 횟수, 다음 시도 시각, claim token, lease 만료, 제한된 오류 코드를 추가한다.
2. pending·processing 활성 요청은 사용자당 1개만 허용하는 partial unique index를 추가한다. migration 006 RPC가 processing 중 재호출되어 새 pending 행을 만들려 하면 안전하게 거부된다. 기존 DB에 이미 두 활성 행이 있으면 어느 행도 자동 삭제하지 않고 migration을 중단해 수동 검토를 요구한다.
3. `FOR UPDATE SKIP LOCKED`와 5분 lease로 하나의 요청을 동시에 두 worker가 claim하지 못하게 한다.
4. 자동 시도는 최대 3회이며 1회 실패 뒤 1분, 2회 실패 뒤 5분 후 재시도한다. 3회 실패는 `retry_exhausted`로 종결한다.
5. 관리자 프로필, 업체 소유자, 업체 claim·registration·변경 요청·문의 응답, 비식별화되지 않은 제보, 남은 비공개 증빙이 연결된 계정은 Auth 삭제 전에 `manual_review_required`로 차단한다.
6. D-31 RPC가 이미 비식별화한 후기·커뮤니티·고객 문의·제보와 거래성 포인트 기록의 8개 사용자 FK만 nullable `ON DELETE SET NULL`로 바꾸어 Auth 삭제 cascade로 사라지지 않게 한다. D-31에서 비식별화하지 않는 업체 변경 요청과 업체 문의 응답은 이 대상에서 제외한다.
7. Auth 삭제가 성공하면 요청 행을 제거하고 식별자가 없는 job 이력에서 완료 상태를 정확히 1건 만든다.
8. 완료·실패 이력에는 원본 사용자 식별자, 이메일, 전화, 요청 ID, 자유 입력 오류, 삭제된 내용 컬럼이 없다. D-24의 삭제 증명 1년 기준을 적용할 수 있도록 `purge_after`를 기록하지만 자동 파기 스케줄은 만들지 않는다.
9. claim·완료·실패 RPC는 `service_role`만 실행할 수 있고 `anon`·일반 회원에게는 권한이 없다.

### Edge Function 계약

`supabase/functions/finalize-account-deletion/`은 다음 동작을 한다.

- POST와 서버 환경의 service role bearer가 모두 확인된 요청만 처리한다.
- service role 값은 환경에서만 읽으며 source·응답·로그에 출력하지 않는다.
- 내부 claim RPC에서만 대상 식별자를 메모리로 받아 Auth 관리자 API를 호출한다.
- 외부 응답은 `idle`, `blocked`, `completed`, `already_completed`, `retry_scheduled`, `retry_exhausted`, `incomplete`, `error` 같은 비식별 상태와 제한 코드만 반환한다.
- Auth 삭제 직후 완료 기록이 실패한 간극은 다음 실행에서 `complete_only`로 복구하며 Auth를 다시 호출하지 않는다.
- Auth 대상이 이미 사라진 404는 성공 후보로 취급하되, 완료 RPC가 요청 FK의 `null` 전환을 다시 확인해야만 완료로 기록한다.
- upstream 오류 본문, 사용자 식별자, claim token을 HTTP 응답이나 console log로 내보내지 않는다.

## 2. 수정·추가·삭제 파일

추가:

- `migrations/013_account_deletion_worker.sql`
- `supabase/functions/finalize-account-deletion/index.ts`
- `supabase/functions/finalize-account-deletion/worker.mjs`
- `scripts/tests/account-deletion-worker.test.mjs`
- `scripts/tests/account-deletion-worker-contract.test.mjs`
- `ops/reports/BE-025-account-deletion-worker.md`

수정·삭제: 없음

## 3. 스키마·API 영향

| 구분 | 영향 |
| --- | --- |
| 기존 요청 테이블 | 사용자당 활성 요청 1개 + worker claim·lease·최대 3회 재시도용 컬럼과 제한 조건 추가 |
| 기존 비식별 기록 | D-31이 비식별화하는 8개 사용자 FK만 nullable `ON DELETE SET NULL`로 전환 |
| 신규 이력 | 비식별 job 이력과 1년 후 파기 기준 시각 추가 |
| 신규 내부 RPC | claim, complete, fail 3개. service role 전용 |
| 신규 서버 API | Edge Function POST 1개. 일반 client 거부 |
| Auth | 격리/운영에 배포된 뒤 서버 worker만 관리자 삭제 API 사용 |
| Storage | 읽기 전용 잔존 확인만 수행. 삭제·보유기간·정책 변경 없음 |

## 4. 실행 테스트

실행 명령:

```powershell
$node = 'C:\Users\mch45\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
& $node --test scripts/tests/account-deletion-worker.test.mjs scripts/tests/account-deletion-worker-contract.test.mjs
git diff --check
```

결과:

- 전용 테스트 16개 통과, 실패 0
- idle·manual review 차단·성공·Auth 실패·재시도 소진·완료 간극 복구·동시 호출 1회 효과·사용자당 활성 요청 1개 계약 검증
- service role 전용 RPC, client 거부, 최대 3회, `SKIP LOCKED`, D-24 1년 기준, Storage mutation·scheduler 부재 정적 검증
- 신규 migration·Function source에서 구체적인 secret·이메일·사용자 식별자 값 0건
- console 출력 0건
- `git diff --check` 통과
- 공통 `validate.mjs` 통과, 제품 build와 dist 검증 통과
- 기존 `marketplace-flow.mjs`는 기준 HEAD의 홈 커뮤니티 링크 때문에 1건 실패, 기존 `sonpum-redesign.mjs`는 기준 HEAD의 행사 분류 개수 기대값 때문에 1건 실패. BE-025 변경 파일과 겹치지 않으며 제품 파일 diff는 0건

## 5. 완료 조건 판정

| 완료 조건 | 판정 | 근거 |
| --- | --- | --- |
| 중복·동시 실행 1회 효과 | 코드 충족, E2E 대기 | DB skip-locked claim + 동시 unit test |
| processing 중 재요청 중복 방지 | 코드 충족, E2E 대기 | 사용자당 pending·processing partial unique index + 기존 중복 fail-closed 검사 |
| 성공 시 Auth 사용자·요청 제거·완료 이력 1건 | 코드 충족, E2E 대기 | Auth delete → FK null 확인 → job 완료/요청 삭제 |
| 실패 재시도·완료 오표시 0 | 충족 | 최대 3회와 complete FK 재확인, 단위 테스트 |
| 일반 client 실행 거부 | 충족 | Edge bearer 검사 + RPC revoke/grant 정적 검사 |
| 비밀·개인정보 로그 0 | 충족 | console 없음, 제한 응답, 정적 값 검사 |
| migration 멱등 적용 | 정적 충족, 실제 재적용 대기 | `if exists`/`if not exists`/`create or replace`; QA-040에서 실제 2회 적용 필요 |
| 격리 Supabase 실제 Auth E2E | 대기 | QA-040 전용 범위 |

## 6. 건수 전후

제품·운영 데이터: 전 0건 접근 / 후 0건 변경.

로컬 정적·단위 검증만 실행했으며 실제 Auth 사용자, 탈퇴 요청, 업체, 증빙, Storage 객체는 만들거나 삭제하지 않았다.

## 7. 보안·개인정보 영향

- 자동 완료 대상은 privileged/provider/raw dependency가 없는 일반 고객으로 제한한다.
- 내부 RPC 경계 밖으로 사용자 식별자를 반환하지 않는다.
- 완료 이력은 삭제 사실·결과·시각·파기 기준만 보유한다.
- 기존 D-24 보유기간, 증빙 Storage, 사업자번호 정책은 변경하지 않는다.
- 운영 schedule, cron secret/Vault, 실제 고객 처리, 운영 배포는 이번 작업에 포함하지 않는다.

## 8. 롤백

운영 미적용 상태에서는 이 신규 migration과 Function 후보를 폐기하면 된다. 격리 환경에 QA-040을 위해 적용한 경우 생성한 합성 계정·테스트 행을 먼저 정리하고 Function을 비활성화한 뒤, QA 전용 환경을 초기화하거나 신규 객체를 제거한다. 운영 DB 롤백 SQL과 실제 데이터 변환은 별도 승인·백업·검증 없이 실행하지 않는다.

## 9. 남은 위험과 후속 검증

1. 로컬에는 Supabase CLI/PostgreSQL 격리 실행기가 없어 실제 migration 재적용, RLS, Auth 관리자 API는 아직 검증하지 않았다.
2. Auth 삭제와 완료 RPC는 분산 트랜잭션이므로 QA-040에서 삭제 직후 완료 실패와 `complete_only` 복구를 실제로 검증해야 한다.
3. QA-040에서 processing 상태 중 같은 사용자의 재요청이 새 pending 행을 만들지 않고, worker 두 개가 동시에 호출돼도 Auth 실제 삭제 효과와 완료 이력이 각 1건인지 검증해야 한다.
4. Edge Function 배포 시 JWT gateway 설정과 service role 전달 경로가 일반 client에 노출되지 않는지 확인해야 한다.
5. `purge_after`를 실제로 파기하는 운영 스케줄은 구현하지 않았다. 운영 활성화와 보존 이력 파기는 별도 카드·승인이 필요하다.
6. manual review 대상의 실제 파기 절차는 별도 운영 절차가 필요하며 이 worker가 임의로 삭제하지 않는다.

## 10. 병합 권고

QA-040에서 격리 Supabase 합성 계정으로 migration 2회 적용, client 거부, 일반 고객 성공, privileged/provider/raw dependency 차단, 실패 3회, 중복·동시 실행, 완료 이력·cleanup을 확인한 뒤 병합을 권고한다. 운영 DB 적용, 운영 스케줄, 실제 고객 처리, main·production 병합·배포는 별도 사용자 승인 전 금지한다.
