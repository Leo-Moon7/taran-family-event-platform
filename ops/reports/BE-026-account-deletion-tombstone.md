# BE-026 Auth 독립 탈퇴 tombstone·JWT drain

- 작업 ID: BE-026
- 결과: PASS 후보 — 독립 reviewer와 QA-040 실제 격리 Supabase E2E 대기
- 기준: D-43 승인, BE-025 `5d66de8`, D-24 비식별 완료 이력
- 실행 범위: migration 014, 기존 Edge worker, 전용 테스트와 이 보고서만 변경
- 미실행: 운영 DB, 실제 Auth/Storage, Edge 배포, 스케줄, main·production

## 1. 구현 결과

### DB·RLS

1. `taran_account_deletion_tombstones`를 추가했다. `user_id`와 `request_id`에 Auth/request FK를 두지 않아 Auth 삭제가 `request.user_id`를 NULL로 바꿔도 차단 상태가 유지된다.
2. migration 전체를 명시적 transaction으로 감싸고 가장 먼저 `taran_account_deletion_requests`에 `ACCESS EXCLUSIVE` 전환 잠금을 획득한다. 이미 request 테이블을 수정한 013 transaction이 끝날 때까지 기다리고, 아직 테이블을 건드리지 않은 구 RPC는 014 commit 뒤까지 대기한다.
3. pending·processing 또는 claim token이 있는 request는 정확히 일치하는 tombstone이 없으면 INSERT·UPDATE를 거부하는 영속 trigger를 설치했다. 구 RPC가 cutover 검사 뒤 재개되더라도 tombstone 없는 request를 커밋할 수 없다.
4. 최초 적용과 재적용 모두 모든 active/claimed request와 tombstone의 일치 여부를 검사한다. tombstone 테이블이 이미 존재해도 불일치가 있으면 `55000`으로 전체 transaction을 중단한다.
5. 새 request RPC는 UUID를 먼저 생성하고 `tombstone → request` 순서로 같은 subtransaction에 기록한다. 둘 중 하나가 충돌하면 tombstone도 함께 롤백한 뒤 이미 커밋된 일치 pair만 다시 사용한다.
6. 013의 public 21개 user-owned trigger, Storage trigger, Auth metadata trigger가 참조하는 함수를 no-lock tombstone 검사로 재정의했다. row trigger 안의 account-deletion advisory lock을 제거하고 Auth delete advisory trigger와 helper를 제거했다.
7. 일반 사용자의 legacy `taran_inquiries` 직접 INSERT 정책을 제거했다. 현재 제품의 견적 문의는 `taran_create_inquiry_group()` 서버 RPC가 `auth.uid()`를 강제로 저장한다.
8. 후기·제보·회원 상태·저장 업체·업체 claim·커뮤니티·비교함·체크리스트·문의 응답·Storage upload/delete 정책에 tombstone 조건을 추가했다.
9. UUID를 받는 내부 `taran_account_deletion_is_active(uuid)`는 일반 사용자에게 계속 비공개다. RLS는 UUID 인자가 없는 `taran_account_deletion_self_is_active()`만 호출하고, authenticated에는 이 self-only helper만 EXECUTE를 허용한다. 다른 사용자의 tombstone 존재 여부를 조회하는 oracle을 만들지 않았다.
10. 설정값을 추측하지 않는다. `taran_account_deletion_runtime_config`는 기본 비활성이며 다음 값과 검증시각이 모두 설정되어야 요청 RPC가 작동한다.
   - 실제 Supabase 최대 access JWT TTL
   - PostgREST·Storage·Auth metadata 쓰기 중 가장 긴 검증된 transaction 상한
   - 상한보다 큰 안전 buffer
   - 설정 검증시각
11. old-snapshot write는 `max_inflight_write_seconds + buffer_seconds`가 지난 뒤 다시 비식별화하고 preflight한다. 실제 상한이 설정되지 않았거나 buffer가 상한 이하이면 요청을 fail-closed한다.

### 상태 전이

```text
requested
→ auth_deleting
→ token_drain
→ finalizing
→ completed
```

예외 상태는 `retry_wait`, `manual_review_required`, `blocked`다.

- Auth 삭제 전: 지연 preflight에서 cleanup과 raw/privileged dependency scan을 반복한다.
- Auth 삭제 후: `auth_deleted_at`을 확인한 뒤 `max_jwt_ttl_seconds + buffer_seconds` 동안 tombstone을 유지한다.
- drain 완료 후: final cleanup과 raw dependency scan을 한 번 더 통과해야 request와 tombstone을 삭제한다.
- 완료 이력 `taran_account_deletion_jobs`에는 사용자 UUID, request ID, 이메일, 전화, 자유 입력 오류를 추가하지 않았다.
- 013의 즉시 complete RPC는 fail-closed로 비활성화해 구버전 worker가 drain을 건너뛰지 못하게 했다.

### Edge worker

worker 계약을 다음 순서로 변경했다.

```text
claim
→ delete Auth
→ mark_auth_deleted
→ token_drain 동안 wait
→ finalize claim
→ final preflight
→ completed
```

- Auth 삭제 뒤 mark 기록이 실패하면 tombstone과 Auth 부재를 이용해 다음 호출에서 `mark_auth_deleted`로 복구한다.
- public 응답은 `idle`, `waiting`, `blocked`, `retry_scheduled`, `retry_exhausted`, `completed`, `incomplete`, `error`와 제한된 코드만 사용한다.
- 사용자 UUID와 claim token은 서비스 역할 RPC·메모리 경계 밖으로 반환하지 않는다.

## 2. 수정·추가·삭제 파일

추가:

- `migrations/014_account_deletion_tombstone.sql`
- `scripts/tests/account-deletion-tombstone.test.mjs`
- `ops/reports/BE-026-account-deletion-tombstone.md`

수정:

- `supabase/functions/finalize-account-deletion/index.ts`
- `supabase/functions/finalize-account-deletion/worker.mjs`
- `scripts/tests/account-deletion-worker.test.mjs`
- `scripts/tests/account-deletion-worker-contract.test.mjs`

삭제: 없음.

## 3. 실행 검증

전용 테스트:

```powershell
$node = 'C:\Users\mch45\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
& $node --test `
  scripts/tests/account-deletion-worker.test.mjs `
  scripts/tests/account-deletion-worker-contract.test.mjs `
  scripts/tests/account-deletion-tombstone.test.mjs
```

결과: 38개 통과, 실패 0.

검증 범위:

- runtime config 비활성·불충분 buffer fail-closed
- requests 전환 table lock과 commit 범위
- cutover 뒤 재개되는 legacy request의 영속 trigger 거부
- cutover 전 커밋된 legacy orphan의 전체 migration 중단
- 최초·재적용 모두 active/claimed request와 tombstone 일치 검사
- 신규 RPC의 tombstone→request 원자 작성 순서
- Auth/request FK 독립 tombstone
- self-only RLS helper EXECUTE와 UUID oracle 차단
- 013 guard advisory lock 제거
- legacy inquiry NULL user_id 우회 제거
- stale JWT DB·Storage·Auth metadata 차단 계약
- old-snapshot 지연 preflight 재정리
- Auth 삭제 gap 복구
- Auth 삭제시각 기준 JWT TTL+buffer
- 동시 worker 단일 delete/finalize 효과
- 비식별 public 응답과 완료 감사

공통 검증:

```powershell
& $node scripts/tests/validate.mjs
& $node scripts/build/prepare-dist.mjs
& $node scripts/tests/validate-dist.mjs
git diff --check
```

결과:

- validate PASS: JavaScript 100개, HTML 40개, 보안·운영 규칙
- build PASS
- dist PASS: HTML 40개, 공개 제외·로컬 참조
- `git diff --check` PASS
- build 후 tracked 제품·dist 변경 0건

## 4. 보안·개인정보 영향

- tombstone의 UUID는 미완료 삭제를 차단하는 단기 운영 식별자이며 RLS와 table revoke로 일반 client·service role 직접 접근을 막았다.
- Auth 삭제 직전 발급된 access JWT도 tombstone 최종 제거 전까지 DB·Storage 쓰기를 수행하지 못한다.
- Storage 원본 삭제나 보유기간 변경은 수행하지 않았다. 원본이 남아 있으면 자동 완료 대신 manual review로 차단한다.
- 완료 뒤 request와 tombstone은 제거하고 비식별 job 이력만 D-24 기준으로 남긴다.
- 비밀키, 이메일, 실제 UUID, 실제 사용자·업체·증빙 데이터에 접근하지 않았다.

## 5. 롤백

- 격리 환경: 명시적 migration transaction 실패 시 cutover lock·trigger·DDL을 포함해 전체 중단하고 합성 환경을 초기화한다.
- 운영 적용 전: 신규 후보 변경을 폐기하면 된다.
- 운영 적용 뒤: tombstone을 임의 삭제하거나 013의 교착 가능 구조로 즉시 복귀하지 않는다. worker를 중지하고 상태별 건수를 확인한 뒤 forward-fix한다.
- 014 적용과 Edge worker 교체 사이에는 worker schedule을 반드시 중지한다. 구 worker용 immediate completion RPC는 의도적으로 비활성화되어 있다.

## 6. 남은 실제 E2E와 위험

QA-040에서 다음을 실제 격리 Supabase 두 세션으로 검증해야 한다.

1. migration 014 최초 적용과 재적용
2. cutover lock 직전·직후 두 session legacy request 경쟁에서 orphan commit 0
3. active/claimed request와 tombstone 불일치 상태의 최초·재적용 실패
4. 실제 authenticated RLS self helper 실행
5. stale JWT의 문의 NULL insert, 후기·커뮤니티·비교·체크리스트 쓰기 거부
6. 실제 Storage upload/update/delete 거부
7. Auth metadata update 거부
8. old-snapshot transaction과 request/preflight 경쟁에서 deadlock 0·원본 잔존 0
9. 동시 worker Auth 삭제·완료 이력 각 1건
10. Auth 삭제 직후 mark 실패 복구
11. drain 전 tombstone 삭제 0, drain 후 request/tombstone 0
12. 다른 사용자 기능 정상
13. 합성 Auth·행·Storage 객체 cleanup 0건

운영 활성화 전에는 실제 Supabase JWT TTL과 PostgREST·Storage·Auth metadata transaction 상한을 확인해야 한다. 값이 확인되지 않으면 runtime config를 활성화하지 않고 탈퇴 요청은 fail-closed 상태를 유지한다.

## 7. 병합 권고

독립 reviewer PASS 후 QA-040 실제 격리 E2E를 통과할 때까지 운영 적용·Edge 배포·schedule 활성화·main 병합을 권고하지 않는다. 코드 후보는 지정 범위 안에서 구현 및 정적·상태 모델 검증을 완료했다.
