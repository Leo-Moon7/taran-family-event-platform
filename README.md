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

운영 DB 적용은 사용자 승인 뒤에만 진행합니다.

1. `migrations/README.md`에서 새 프로젝트와 기존 프로젝트의 절차를 구분합니다.
2. 새 프로젝트는 `admin-schema.sql`을 한 번 실행한 뒤 현재 실행 체크아웃에 실제로 존재하는 `003`부터 마지막 번호까지 순서대로 적용합니다.
3. 기존 프로젝트는 `admin-schema.sql`을 다시 실행하지 않습니다. 적용 이력과 백업을 확인한 뒤 아직 적용하지 않은 가장 이른 번호부터 현재 실행 체크아웃의 마지막 번호까지 순서대로 적용합니다.
4. 격리 환경에서 마이그레이션·권한·정리 검증을 마친 뒤 운영 적용 승인을 받습니다.
5. Netlify 환경변수 `SUPABASE_URL`, `SUPABASE_ANON_KEY`를 등록합니다.
6. GitHub 저장소를 Netlify에 연결해 배포합니다.
7. `SUPABASE-SETUP-GUIDE.md`의 최초 동작 확인을 실행합니다.

Netlify는 `npm run build`로 공개 화면에 필요한 파일만 `dist/`에 복사하고, 공개 설정을 생성한 뒤 `dist/`만 배포합니다. SQL·운영 문서·마이그레이션·테스트 파일은 공개 배포 묶음에서 제외됩니다. 비밀인 `service_role` 키는 프론트엔드와 GitHub에 저장하지 않습니다.

2026-07-30 현재 이 로컬 격리 통합 후보에는 `001`~`016`이 모두 있습니다. 이 후보는 아직 `main`이나 운영 DB에 반영되지 않았으며, 전체 검증과 별도 사용자 승인 전에는 운영 적용을 시작하지 않습니다. `013`·`014`의 데이터베이스 구조와 Edge Function·런타임·스케줄 배포는 별도 단계입니다. `015`·`016`을 적용해도 업체 자료 접수·증빙 업로드·공개 반영은 자동으로 활성화되지 않으며, `015`의 런타임 플래그 4개는 모두 `false`, `016`의 운영 검토 큐는 허용된 운영 역할의 AAL2 세션으로 유지합니다.

## 자동 검사

로컬에서는 `npm test`로 JavaScript 문법, HTML 파일 참조, 중복 스크립트, 목록→상세 이동 경로와 핵심 RLS 규칙을 검사합니다. `npm run build && npm run test:dist`는 Netlify 공개 묶음의 파일 참조와 비공개 대상 제외 여부를 확인합니다. GitHub `main`에 푸시하거나 Pull Request를 만들면 `.github/workflows/quality.yml`이 소스 검사·빌드·배포 묶음 검사를 자동 실행합니다.

## 운영 문서

- `SUPABASE-SETUP-GUIDE.md`: 최초 온라인 연결
- `ADMIN-OPERATING-GUIDE.md`: 비개발자 운영 절차
- `SONPUMHAEBANG_REDESIGN_REPORT.md`: 이번 브랜드·검색·업체·체크리스트 개편 결과
- `REFACTOR_REPORT.md`: 이전 구조 변경·검증 결과
- `OPEN-READINESS-CHECKLIST.md`: 오픈 전 최종 확인
