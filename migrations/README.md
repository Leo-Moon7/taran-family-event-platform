# Supabase 마이그레이션 실행 순서

이 문서는 `001`~`014`가 모두 존재하는 통합 후보 기준이다. 실행 전 현재 checkout에 같은 파일이 실제로 있는지 확인한다. 격리 QA의 통과는 운영 적용 승인이 아니다.

## 공통 안전 규칙

- 운영 DB에서 바로 시작하지 않는다. 먼저 별도 격리 프로젝트에서 같은 순서를 검증한다.
- 실행 전 스키마·행 수·Storage metadata 백업과 적용 이력을 남긴다.
- SQL Editor에서 여러 파일을 합쳐 붙이지 않고 한 파일씩 번호 순서대로 실행한다.
- 오류가 나면 다음 번호로 넘어가지 않는다.
- `admin-schema.sql`과 migration을 이미 적용했는지 추측하지 않는다.
- `service_role` 키, DB 비밀번호, 실제 개인정보를 저장소·브라우저·채팅에 넣지 않는다.

## 새 프로젝트

1. 저장소 루트의 `admin-schema.sql`을 새 빈 프로젝트에 한 번만 적용한다.
2. `admin-schema.sql`은 현재 기본 스키마와 `001`·`002` 상당 상태를 포함하므로 새 프로젝트에서 `001`·`002`를 다시 실행하지 않는다.
3. 다음 파일을 한 개씩 순서대로 실행한다.

```text
003_marketplace_comparison_flow.sql
004_provider_automation.sql
005_sonpum_brand_and_event_types.sql
006_d31_security_baseline.sql
007_provider_review_projection_flow.sql
008_review_submission_flow.sql
009_admin_profile_self_access.sql
010_public_projection_security.sql
011_admin_provider_workspace_rpc.sql
012_admin_provider_operations.sql
013_account_deletion_worker.sql
014_account_deletion_tombstone.sql
```

## 기존 프로젝트

1. `admin-schema.sql`을 실행하지 않는다.
2. 현재 적용된 마지막 migration과 각 핵심 객체의 존재를 읽기 전용으로 확인한다.
3. 기존 백업과 주요 테이블 행 수 기준선을 남긴다.
4. 누락된 첫 번호부터 한 파일씩 순서대로 실행한다. 중간 번호를 건너뛰지 않는다.
5. 과거 브랜드 자료가 있어 `001`이 필요한지는 별도 확인한다. 현재 손품해방 스키마라면 무조건 재실행하지 않는다.

## 파일별 역할

| 번호 | 역할 |
| --- | --- |
| 001 | 과거 브랜드 식별자 이전 |
| 002 | 초기 관리자·소유권·커뮤니티 보안 강화 |
| 003 | 비교함·문의·등록·체크리스트 기반 |
| 004 | 업체 자동화·문의 상태·알림 작업 기반 |
| 005 | 행사 분류와 행사별 조건 |
| 006 | D-31 역할·RLS·RPC·Storage 최소권한 기준 |
| 007 | 업체 등록·수정 요청·검수·공개 projection |
| 008 | 자체 후기 제출 최소권한 RPC |
| 009 | 관리자 본인 역할 최소 조회 |
| 010 | 공개 업체·후기 projection 보안 |
| 011 | 관리자 업체 검수 큐 최소 조회 RPC |
| 012 | 관리자 업체 저장·상태·소유권·현황 RPC |
| 013 | server-only 계정 삭제 worker 상태·완료 이력 기반 |
| 014 | Auth 독립 tombstone·stale JWT drain·동시성 안전화 |

## 013·014 특별 게이트

`013`과 `014`는 같은 유지보수 작업으로 연속 적용하되 다음을 먼저 확인한다.

- 계정 삭제 worker·cron·외부 호출이 실행 중이지 않다.
- 기존 `pending`·`processing`·claim 보유 삭제 요청이 0건이다.
- 다른 장시간 쓰기 transaction이 없다.
- 운영자에게 롤백·중단 절차와 영향 시간이 공유됐다.

`014`는 불일치 활성 요청이나 cutover 위험을 발견하면 의도적으로 실패한다. 실패 원인을 제거하지 않은 채 우회하거나 다음 단계로 진행하지 않는다.

DB 적용 뒤에도 계정 삭제는 기본 비활성이다. 다음 네 단계를 별도로 완료해야 한다.

1. Edge Function 코드와 비밀 설정을 별도 승인 후 배포
2. 대상 프로젝트의 실제 최대 JWT TTL과 최대 진행 중 쓰기 시간을 다시 측정
3. 측정 근거·buffer·검증시각을 기록하고 runtime config 활성화
4. 합성 계정으로 DB·Storage·Auth 삭제·재시도·정리 E2E 후 스케줄 활성화

QA에서 사용한 숫자를 운영값으로 복사하지 않는다.

## 적용 후 확인

- migration 001~014 파일 순서와 적용 이력이 일치한다.
- anon/customer/provider/content/operations/owner의 허용·거부가 QA-003 계약과 일치한다.
- 공개 projection에 내부 UUID·연락처·원문이 없다.
- 업체 등록·검수·후기·문의·관리자 큐의 성공과 실패가 구분된다.
- Storage signed URL·삭제가 역할별로 제한된다.
- 계정 삭제 runtime은 승인 전 `enabled=false`이고 TTL·in-flight·buffer·검증시각이 비어 있다.
- 합성 테스트 계정·행·파일·임시 역할·함수가 남지 않는다.

운영 프론트엔드에는 `SUPABASE_ANON_KEY`만 사용한다. `service_role` 키는 HTML, JavaScript, `content-config.js`, GitHub, Netlify 공개 파일에 넣지 않는다.
