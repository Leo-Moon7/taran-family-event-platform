# Supabase 마이그레이션 실행 순서

이 문서는 `001`~`016`이 한 체크아웃에 모두 존재하는 로컬 격리 통합 후보의 최종 순서입니다. 2026-07-30 현재 이 후보에는 `001`~`016`이 모두 있습니다. 실행 전 현재 체크아웃에 아래 SQL 파일이 실제로 모두 있는지 확인하며, 운영 DB에는 사용자 승인 없이 적용하지 않습니다.

## 공통 안전 규칙

- 운영 DB에서 바로 시작하지 않고 별도 격리 프로젝트에서 같은 순서를 검증합니다.
- 적용 전 Supabase의 마이그레이션 이력과 대상 표·함수의 존재 여부를 확인합니다.
- 스키마·주요 표 행 수·Storage metadata 백업과 건수 대조 기준을 먼저 확보합니다.
- 여러 파일을 합쳐 붙이지 않고 한 파일씩 실행하며, 번호를 건너뛰거나 뒤 번호부터 실행하지 않습니다.
- 오류가 나면 다음 파일로 넘어가지 않고 해당 파일에서 중단합니다.
- `service_role` 키와 DB 비밀번호를 저장소·브라우저·채팅에 기록하지 않습니다.
- SQL 적용, Edge Function 배포, 런타임 활성화, 스케줄 설정, 실제 데이터 접수는 서로 다른 승인 단계입니다.

## 새 프로젝트

1. 저장소 루트의 `admin-schema.sql`을 한 번 실행합니다.
2. 아래 파일을 번호 순서대로 실행합니다.

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
015_provider_contribution_quote_v2.sql
016_provider_contribution_review_queue_v2.sql
```

`admin-schema.sql`에 포함된 초기 구조와 겹치는 `001`·`002`는 새 프로젝트에서 다시 실행하지 않습니다.

## 기존 프로젝트

1. `admin-schema.sql`을 다시 실행하지 않습니다.
2. Supabase의 적용 이력과 실제 객체를 확인합니다.
3. 운영 백업과 주요 표의 적용 전 건수를 기록합니다.
4. 아직 적용하지 않은 가장 이른 번호부터 `016`까지 순서대로 실행합니다.
5. 각 파일 적용 직후 오류·권한·건수 변화를 확인합니다.

## 파일별 역할

| 번호 | 역할 |
| --- | --- |
| `001` | 이전 브랜드 테이블과 사이트 ID 정리 |
| `002` | 관리자 역할·업체 소유권·커뮤니티 검수·통계 보안 보강 |
| `003` | 비교함·통합 견적 문의·업체 등록·체크리스트·전환 통계 |
| `004` | 업체 정보 완성도·문의 만료·알림 예약·응답률·운영 예외 |
| `005` | 가족행사 분류와 행사별 조건 구조 |
| `006` | D-31 역할·RLS·RPC·Storage 최소권한 기준 |
| `007` | 업체 등록·수정 요청·검수·공개 projection |
| `008` | 자체 후기 제출 최소권한 RPC |
| `009` | 관리자 본인 역할 최소 조회 |
| `010` | 공개 업체·후기 projection 보안 |
| `011` | 관리자 업체 검수 큐 최소 조회 RPC |
| `012` | 관리자 업체 저장·상태·소유권·현황 RPC |
| `013` | server-only 계정 삭제 worker 상태·완료 이력 기반 |
| `014` | Auth 독립 tombstone·stale JWT drain·동시성 안전화 |
| `015` | 업체 자료 제보·과거 견적 v2 저장 기반. 런타임 기본 비활성 |
| `016` | 운영 검토 큐 읽기 RPC. 운영 역할+AAL2, 최소 6개 필드, 최대 50건 |

## 013·014 특별 게이트

`013`과 `014`는 같은 유지보수 작업으로 연속 적용하되 다음 조건을 먼저 확인합니다.

- 계정 삭제 worker·cron·외부 호출이 실행 중이지 않은지
- 기존 `pending`·`processing`·claim 보유 삭제 요청이 0건인지
- 다른 장시간 쓰기 transaction이 없는지
- 운영자에게 롤백·중단 절차와 영향 시간이 공유됐는지

`014`는 불일치 활성 요청이나 cutover 위험을 발견하면 의도적으로 실패합니다. 실패 원인을 제거하지 않은 채 우회하지 않습니다. SQL 적용 뒤에도 계정 삭제는 기본 비활성이며 Edge Function 배포, 대상 프로젝트의 실제 최대 JWT TTL·진행 중 쓰기 시간 측정, runtime config, 합성 E2E, 스케줄 활성화는 각각 별도 승인 단계입니다. QA 숫자를 운영값으로 복사하지 않습니다.

## 015·016 특별 게이트

- `015`는 `014` 다음에, `016`은 `015` 다음에만 실행합니다.
- 적용 전 `013`·`014`의 권한·삭제 검증이 완료됐는지 확인합니다.
- `015` 적용 후 런타임 설정 `contribution_enabled`, `evidence_upload_enabled`, `public_projection_enabled`, `allow_exact_amount`가 모두 `false`인지 확인합니다.
- `015`는 Storage 버킷·정책·업로드 URL·서명 URL을 만들지 않습니다. 실제 증빙 업로드는 개인정보·이용약관·보유기간·악성 파일 검사·안전 미리보기 승인이 끝날 때까지 시작하지 않습니다.
- `016`의 `taran_list_review_queue_v2`는 `owner`·`admin`·`operations`의 AAL2 세션만 허용하고, 한 번에 1~50건만 반환해야 합니다.
- `016`의 반환 필드는 `review_case_id`, `source_kind`, `canonical_event_code`, `risk_level`, `review_state`, `created_at` 6개로 제한합니다.
- `015`·`016` 적용 뒤에도 실제 업체 자료 접수, 정확한 견적 금액 저장, 증빙 업로드, 공개 반영은 활성화하지 않습니다.

## 적용 후 공통 확인

- 현재 실행 체크아웃에 `001`~`016` 후보 파일이 모두 있고 적용 이력과 번호 순서가 일치하는지
- 기존 업체·회원·후기·견적 등 주요 데이터 건수가 의도치 않게 줄지 않았는지
- 익명·고객·업체·콘텐츠·운영·관리자 역할의 허용·거부 결과가 명세와 일치하는지
- 공개 뷰와 공개 RPC가 비공개·개인정보·증빙 필드를 반환하지 않는지
- 직접 테이블 권한이 새로 열리지 않았는지
- 테스트 합성 데이터와 Auth 사용자가 모두 정리됐는지
- `015` 런타임 플래그 4개가 모두 `false`인지
- v2 증빙용 Storage 버킷·정책·URL이 생성되지 않았는지
- `016` 검토 큐가 운영 역할+AAL2·6개 필드·최대 50건 계약을 지키는지

`taran_notification_jobs`는 웹 알림 작업을 저장하는 큐입니다. 이메일·문자 발송을 추가할 때는 브라우저에 비밀키를 넣지 않고 Supabase Edge Function 또는 별도 서버에서 처리해야 합니다. 운영 프론트엔드에는 `SUPABASE_ANON_KEY`만 사용합니다.
