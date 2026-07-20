# 손품해방(SONPUM HAEBANG) 가족행사 플랫폼

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
- 업체 입점 안내: `provider-join.html`
- 통합 견적 문의: `inquiry.html`
- 로그인·내 정보: `login.html`, `account.html`
- 관리자: `admin/`

## 로컬 실행

`file://` 직접 열기보다 이 폴더를 로컬 HTTP 서버 루트로 사용합니다. Supabase 값이 비어 있으면 로그인·온라인 저장·견적 문의 버튼은 숨겨지고 공개 데이터 탐색만 동작합니다.

## 운영 배포

1. 새 프로젝트는 `admin-schema.sql`, 기존 프로젝트는 `migrations/README.md`의 번호 순서대로 Supabase SQL Editor에서 실행
2. Netlify 환경변수 `SUPABASE_URL`, `SUPABASE_ANON_KEY` 등록
3. GitHub 저장소를 Netlify에 연결해 배포
4. `SUPABASE-SETUP-GUIDE.md`의 최초 동작 확인 실행

Netlify는 `npm run build`로 공개 화면에 필요한 파일만 `dist/`에 복사하고, 공개 설정을 생성한 뒤 `dist/`만 배포합니다. SQL·운영 문서·마이그레이션·테스트 파일은 공개 배포 묶음에서 제외됩니다. 비밀인 `service_role` 키는 프론트엔드와 GitHub에 저장하지 않습니다.

기존 Supabase 프로젝트를 이전 버전 스키마로 이미 운영 중이라면 전체 스키마를 다시 붙여넣지 않고 `migrations/002_security_hardening.sql`부터 `005_sonpum_brand_and_event_types.sql`까지 번호 순서대로 실행합니다. 각 파일은 기존 업체·회원·후기 데이터를 삭제하지 않고 필요한 구조와 정책만 보강합니다.

## 자동 검사

로컬에서는 `npm test`로 JavaScript 문법, HTML 파일 참조, 중복 스크립트, 목록→상세 이동 경로와 핵심 RLS 규칙을 검사합니다. `npm run build && npm run test:dist`는 Netlify 공개 묶음의 파일 참조와 비공개 대상 제외 여부를 확인합니다. GitHub `main`에 푸시하거나 Pull Request를 만들면 `.github/workflows/quality.yml`이 소스 검사·빌드·배포 묶음 검사를 자동 실행합니다.

## 운영 문서

- `SUPABASE-SETUP-GUIDE.md`: 최초 온라인 연결
- `ADMIN-OPERATING-GUIDE.md`: 비개발자 운영 절차
- `SONPUMHAEBANG_REDESIGN_REPORT.md`: 이번 브랜드·검색·업체·체크리스트 개편 결과
- `REFACTOR_REPORT.md`: 이전 구조 변경·검증 결과
- `OPEN-READINESS-CHECKLIST.md`: 오픈 전 최종 확인
