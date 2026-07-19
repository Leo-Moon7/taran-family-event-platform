# Supabase migration order

새 Supabase 프로젝트는 저장소 루트의 `admin-schema.sql`을 한 번 실행합니다.

기존 프로젝트는 적용된 버전 다음 번호부터 순서대로 실행합니다.

1. `001_taran_brand.sql`: 이전 브랜드 테이블과 사이트 ID를 따란 기준으로 이관
2. `002_security_hardening.sql`: 운영 역할, 업체 권한, 커뮤니티 검수, 통계 중복 기록 정책 보강

`002_security_hardening.sql` 적용 후 확인할 항목:

- `editor` 역할이 `content`로 이관되었는지
- 업체 계정이 다른 업체의 비공개 정보와 소유권 요청을 읽거나 수정할 수 없는지
- 일반 회원의 커뮤니티 글과 댓글이 항상 `pending`으로 저장되는지
- 게시 상태는 운영 권한 계정만 변경할 수 있는지
- 동일 세션의 같은 화면 조회가 30분 안에 중복 집계되지 않는지

운영 프론트엔드에는 `SUPABASE_ANON_KEY`만 사용합니다. `service_role` 키는 Netlify 환경변수나 브라우저 파일에도 넣지 않습니다.
