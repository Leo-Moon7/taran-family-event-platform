# 따란(T'ARAN) 가족행사 플랫폼

가족행사 장소·업체 검색, 상세 조건, 비용 계산, 체크리스트, 후기, 견적 문의, 커뮤니티, 정보 공유 포인트, 업체 담당자 직접 수정과 운영 관리자 기능을 제공하는 정적 프론트엔드 + Supabase 프로젝트입니다.

## 주요 화면

- 공개 홈: `index.html`
- 업체 검색: `venues.html`
- 업체 상세: `provider.html?id=업체ID`
- 비용 계산: `calculator.html`
- 체크리스트: `checklist.html`
- 준비백과: `articles.html`
- 정보 공유·포인트: `contribute.html`
- 커뮤니티: `community.html`, `community-post.html?id=게시글ID`
- 업체 담당자 권한 요청: `claim.html?id=업체ID`
- 승인된 업체 담당자 편집: `partner.html?id=업체ID`
- 로그인·내 정보: `login.html`, `account.html`
- 관리자: `admin/`

## 로컬 실행

`file://` 직접 열기보다 이 폴더를 로컬 HTTP 서버 루트로 사용합니다. Supabase 값이 비어 있으면 로그인·온라인 저장·견적 문의 버튼은 숨겨지고 공개 데이터 탐색만 동작합니다.

## 운영 배포

1. `admin-schema.sql`을 Supabase SQL Editor에서 전체 실행
2. Netlify 환경변수 `SUPABASE_URL`, `SUPABASE_ANON_KEY` 등록
3. GitHub 저장소를 Netlify에 연결해 배포
4. `SUPABASE-SETUP-GUIDE.md`의 최초 동작 확인 실행

Netlify는 `netlify.toml`의 빌드 명령으로 공개 설정을 생성하고 보안 헤더·관리자 noindex를 적용합니다. 비밀인 `service_role` 키는 프론트엔드와 GitHub에 저장하지 않습니다.

## 운영 문서

- `SUPABASE-SETUP-GUIDE.md`: 최초 온라인 연결
- `ADMIN-OPERATING-GUIDE.md`: 비개발자 운영 절차
- `REFACTOR_REPORT.md`: 구조 변경·검증 결과
- `OPEN-READINESS-CHECKLIST.md`: 오픈 전 최종 확인
