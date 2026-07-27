# BE-019 업체 정보 기여·과거 견적 v2 구현 보고서

## 판정

`PASS_IN_ISOLATION`

운영 적용, 실제 견적·증빙 수집, Storage 생성, 외부 공개는 하지 않았다. 새 기능은 기본 설정에서 모두 꺼져 있으며 개인정보·약관·보안 처리 체계를 별도로 승인하고 실제 Supabase E2E를 통과하기 전에는 활성화하면 안 된다.

2026-07-28 QA-041 실제 격리 Supabase 1차 실행에서 지원되지 않는
`jsonb_object_length(jsonb)` 호출(SQLSTATE `42883`)이 발견됐다. 해당 호출을
`jsonb_object_keys()`의 행 개수 검사로 교체하고 `NULL`, 빈 객체, 20개 초과를
명시적으로 거부하도록 보완했다. 이 보완본은 QA-041 재검증 전까지 운영 적용
근거가 아니다.

## 변경 범위

- `migrations/015_provider_contribution_quote_v2.sql`
- `scripts/tests/provider-contribution-quote-v2.mjs`
- `scripts/tests/provider-contribution-quote-v2-model.mjs`
- `ops/reports/BE-019-provider-contribution-quote-v2.md`

기존 migration `001~014`, 제품 HTML·CSS·JavaScript, API 라우팅, 환경변수, 패키지·잠금 파일은 수정하지 않았다.

## 구현 결과

### 1. additive v2 구조

기존 객체를 교체하지 않고 v2 table 22개를 추가하는 migration을 작성했다.

- 정책: runtime config, 보유기간 정책, 제출 필드 사전
- 업체: 업체 신원, 행사 가능 범위, 업체 사용자 권한
- 제출·검수: 제출 건·필드·검증 상태, 증빙, 검수 건·결정
- 견적: 견적 건·금액·항목, 공개용 projection, 열람 권한
- 사후 처리: 이의 제기, 법적 보존, 삭제 작업, 감사 기록, outbox

기존 업체 소유권·기여·포인트 관련 객체는 읽거나 변경하거나 호출하지 않는다.

### 2. 기본 비활성화

다음 네 기능은 migration 적용 직후 모두 `false`다.

- 정보·견적 기여
- 증빙 접수
- 공개용 견적 projection
- 정확한 금액 표시

증빙 접수는 개인정보처리방침·약관·보유기간·악성 파일 검사·안전 미리보기 처리자가 등록돼야 켤 수 있다. 공개 기능은 별도 승인 시각이 있어야 켤 수 있다.

### 3. 최소 권한과 공개 경계

- 모든 v2 table에 RLS를 적용했다.
- `public`, `anon`, `authenticated`의 base-table 권한을 제거했다.
- 공개 정보는 `taran_list_quote_public_v2` RPC만 반환한다.
- 공개 결과에는 제출자·증빙·저장 위치·검수자·실제 금액·비공개 case ID가 없다.
- 증빙 등록·검사 결과·HMAC fingerprint·삭제 매니페스트는 서버 역할만 기록할 수 있다.
- 이 migration은 Storage bucket, 업로드 URL, signed URL, Storage policy를 만들지 않는다.

### 4. 증빙 보안과 보유기간

- 원본 SHA 값은 저장하지 않고 버전이 있는 HMAC만 저장한다.
- 등록 직후 증빙은 격리 상태이며 24시간 임시 보유기간을 적용한다.
- 허용 MIME, 크기 제한 15MB, 악성 파일 검사, 개인정보·이용권리 확인, 안전 미리보기 준비를 모두 통과해야 검수에 사용할 수 있다.
- 견적에 연결된 원본은 기본 30일, 최초 생성일부터 절대 최대 90일을 넘지 않는다.
- 실제 파일 접근 경로는 아직 만들지 않았으므로 현재 상태에서는 원본 열람이 실패한다.

### 5. 업체·고객 역할 분리

- 업체 사용자 권한은 업체·범위·만료일이 일치해야 한다.
- 활성 업체 권한이 하나라도 있는 계정은 다른 업체를 선택하더라도 고객 견적 보상 경로를 사용할 수 없다.
- 고객이 낸 견적은 운영자가 업체를 별도로 매칭해야 한다.
- 업체 매칭과 견적 fingerprint 기록이 끝나기 전에는 중복 상태를 `unique`로 지정할 수 없다.

### 6. 중복 견적과 독립 검수

- 견적 fingerprint는 버전이 있는 HMAC으로 기록한다.
- 부분 unique index가 동일 HMAC을 두 건 이상 `unique`로 분류하는 경쟁 상태를 DB에서 차단한다.
- 고위험 정보와 견적은 서로 다른 운영 검수자 2명이 승인해야 한다.
- 검수자는 자신의 제출을 승인할 수 없다.
- 운영 변경 RPC는 관리자 역할과 AAL2를 함께 요구한다.
- 두 번째 승인 transaction에서 공개 projection·열람 권한·outbox·감사 기록을 함께 만든다.
- 24개월보다 오래된 견적은 접수 기록만 남길 수 있고 승인·공개·보상 대상이 아니다.

### 7. 철회·이의 제기·삭제

- 철회와 이의 제기는 공개 결과를 즉시 차단한다.
- 철회 시 남은 기간과 무관하게 견적 열람 권한을 즉시 회수한다.
- 업체의 이의 제기만으로 삭제하거나 열람 권한을 회수하지 않으며, AAL2 운영자 해결 단계에서만 후속 조치를 한다.
- 법적 보존은 대상·근거·검토일이 있는 범위형 기록으로만 설정할 수 있고, 활성 보존 중에는 삭제를 중단한다.
- 삭제 작업은 다음 9개 target이 모두 성공해야 완료된다.
  - DB 비공개 값
  - 원본 Storage
  - 미리보기 Storage
  - OCR 파생물
  - 캐시 매니페스트
  - 큐 payload
  - export 사본
  - backup 만료 확인
  - 복원 차단 tombstone
- 최종 완료 시 견적 금액·항목·증빙·필드·공개 projection을 실제 삭제하고, 제출·검수 이력은 사용자·업체 식별 연결을 끊은 최소 증명만 남긴다.
- 계정 삭제는 연결된 모든 v2 삭제 작업이 완료되기 전 기존 계정 삭제 요청을 `completed`로 바꿀 수 없다.
- 검수 결정과 감사 기록은 append-only다. 단, 활성 계정 삭제 중 발생하는 정확한 사용자 FK `UUID → NULL` 변경만 허용하며 다른 내용은 그대로여야 한다.

## 검증 결과

### 전용 검사

- migration 계약 검사: `28/28 PASS`
- 결정론 상태 모델: `60/60 PASS`
- 모델 표기: `MODEL_ONLY`
- 실제 데이터 사용: `0건`
- 제품 네트워크 요청: `0건`

결정론 모델은 정책 상태 전이를 확인하는 보조 검사이며 실제 Supabase, signed URL, rate limit, Storage 보안을 증명하지 않는다.

### 일회성 격리 PostgreSQL 호환 실행

프로젝트 의존성을 변경하지 않고 Windows 임시 폴더의 PGlite `0.5.4`에서 실행했다.

- migration 015 전체 적용: PASS
- 생성된 v2 table: 22개
- runtime 4종 기본 `false`: PASS
- 동일 HMAC 두 번째 견적의 `unique` 지정: DB unique index가 차단
- 증빙 보유기간 전환: 임시 24시간 → 검수 중 최대 90일 → 최종 결정 후 30일
- 1차 승인: `pending_independent_review`
- 다른 검수자의 2차 승인: `approved`
- 기존 검수자의 분쟁 재심: DENY
- 독립 운영자의 분쟁 재심: PASS
- 분쟁 감사 로그의 자유 문장 사유: DENY, 허용 사유 코드만 PASS
- 공개 RPC 결과: 1건
- anon의 공개 base table 직접 조회: DENY
- authenticated의 증빙 base table 직접 조회: DENY
- anon의 공개 RPC 조회: PASS
- 업체 권한 보유 계정의 고객 보상 견적 제출: DENY
- 검수자 계정 삭제 시 검수·감사 이력 본문 보존과 사용자 ID 해제: PASS
- 철회 직후 공개 RPC 결과: 0건
- 삭제 9개 target 완료: PASS
- 완료 후 견적·금액·증빙·필드·projection 잔여: 모두 0건
- 계정 삭제 요청의 조기 완료 차단: PASS
- v2 삭제 완료 뒤 계정 삭제 완료: PASS

### 기존 회귀 검사

기준 commit `e8510ca`에서 다음 기존 검사는 PASS였다.

- `validate.mjs`
- D-31 migration
- provider review/projection migration
- review submission migration
- admin profile self access
- public projection security
- admin provider workspace RPC
- admin provider operations
- account deletion worker contract `15/15`
- account deletion worker `13/13`
- account deletion tombstone `10/10`
- build
- validate-dist

아래 두 기존 검사는 BE-019 변경 전 기준 commit에서도 실패했다. BE-019는 제품 파일과 해당 검사를 수정하지 않았다.

- `marketplace-flow.mjs`: 현재 헤더와 과거 커뮤니티 링크 기대값 불일치
- `sonpum-redesign.mjs`: 현재 canonical 행사 5분류와 과거 8분류 기대값 불일치

## 보호 범위 확인

- 기존 migration `001~014` diff: 0
- 제품 파일 diff: 0
- package·lock diff: 0
- 실제 업체·견적·사업자번호·증빙: 0
- 운영 DB·Storage·Netlify·GitHub main·배포 변경: 0
- CHG-A~C 접촉: 0

## 남은 게이트

1. 실제 Supabase Postgres/Auth/RLS/PostgREST의 격리 환경에서 migration 015와 RPC 전체 E2E를 실행해야 한다.
2. 실제 증빙 업로드는 악성 파일 검사, 안전 미리보기, MIME 판별, signed access, rate limit, 접근 로그 구현 전까지 비활성 상태를 유지해야 한다.
3. 개인정보처리방침, 견적 이용약관, 실제 보유기간과 삭제 책임자를 확정해야 한다.
4. 공개 projection 활성화와 실제 견적 수집은 별도 사용자 승인이 필요하다.
5. UI와 기존 업체 공개 데이터 연결은 별도 작업으로 진행해야 한다.

## 권고

- BE-019는 격리 구현으로 완료 처리할 수 있다.
- 다음 작업은 `QA-041` 격리 Supabase v2 RPC/RLS E2E로 한다.
- QA-041가 통과해도 실제 업로드와 공개 runtime은 켜지 않는다.
