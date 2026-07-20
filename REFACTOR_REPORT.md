# 손품해방 구조 리팩터링 완료 보고서

기준일: 2026-07-19

## 완료 범위

- 공개 브랜드를 `손품해방`, 영문을 `SONPUM HAEBANG`, 코드 식별자를 `taran`으로 통일했습니다.
- 디자인 토큰, 기본 스타일, 레이아웃, 공통 버튼·폼·카드·헤더·배지·모달을 분리했습니다.
- 홈페이지, 업체 목록, 업체 상세, 회원·도구·콘텐츠·정책 페이지와 관리자 화면을 공통 디자인 구조로 전환했습니다.
- 홈페이지 검색은 행사·지역·인원 3개 조건으로 단순화했습니다.
- 업체 목록에 필터, 정렬, 선택 조건 칩, 로딩·빈 결과·오류 상태, 페이지네이션을 적용했습니다.
- 업체 상세에서 실제 값이 있는 가격·인원·주차·시설·정책만 노출합니다.
- 내부 후기와 외부 후기를 분리하고 내부 후기 등록·관리자 공개 검수를 연결했습니다.
- 이메일 회원가입·로그인, 관심 업체, 계산기·체크리스트 저장을 Supabase에 연결했습니다.
- 견적 문의, 견적·사진 공유, 포인트 적립·리워드 교환, 계정 삭제 요청을 연결했습니다.
- 업체 담당자 권한 요청은 비공개 파일 저장, 관리자 서류 확인, 승인·반려, 승인 계정 전용 업체 편집 흐름으로 연결했습니다.
- 커뮤니티 글·댓글 저장과 커뮤니티 글 관리자 공개 검수를 연결했습니다.
- 관리자 화면을 대시보드, 견적, 업체, 콘텐츠, 배너, 회원, 통계, 설정으로 분리했습니다.
- 관리자 역할을 최고관리자, 운영관리자, 콘텐츠관리자, 업체관리자로 구분했습니다.
- Netlify 배포 설정, 보안 헤더, 404, robots.txt, sitemap.xml을 추가했습니다.
- 업체 역할의 전체 업체·후기·권한 요청 관리 권한을 제거하고 본인 업체 수정 RPC만 허용했습니다.
- 커뮤니티 글과 댓글은 항상 검수 대기로 접수되며, 회원의 직접 상태 변경을 차단했습니다.
- 기존 `editor` 역할을 `content`로 이전하고 관리자 메뉴와 DB 역할 범위를 일치시켰습니다.
- 세션별 통계 이벤트 중복을 줄이고 임의 메타데이터 저장을 제한했습니다.
- GitHub Actions와 저장소 자체 검사 스크립트를 추가했습니다.
- Netlify 공개 묶음을 `dist/`로 분리해 SQL·마이그레이션·운영 문서·테스트 파일이 외부에 배포되지 않도록 했습니다.

## 생성한 핵심 파일

- `styles/tokens.css`, `styles/reset.css`, `styles/base.css`, `styles/layout.css`
- `styles/components/*.css`, `styles/pages/*.css`
- `scripts/core/config.js`, `api.js`, `auth.js`, `analytics.js`, `storage.js`
- `scripts/components/header.js`, `toast.js`, `admin-shell.js`
- `scripts/pages/admin/*.js`, `scripts/pages/home.js`, `venues.js`, `provider.js`
- `admin/*.html`, `admin-schema.sql`, `netlify.toml`, `_headers`, `_redirects`
- `partner.html`, `scripts/pages/partner.js`
- `migrations/002_security_hardening.sql`
- `scripts/build/prepare-dist.mjs`
- `scripts/tests/validate.mjs`, `scripts/tests/validate-dist.mjs`, `.github/workflows/quality.yml`

## 삭제한 레거시 파일

- `styles.css`
- `upgrade.css`

모든 사용자 페이지가 `styles/` 아래의 토큰·컴포넌트·페이지 스타일만 불러오도록 전환했습니다.

## 저장 데이터 마이그레이션

`scripts/core/storage.js`가 이전 브랜드 저장 키를 대응하는 `taran-` 키로 한 번 복사합니다. 새 키에 값이 있으면 덮어쓰지 않으며 이후 쓰기는 새 키만 사용합니다. 이전 명칭은 이 호환 목록과 DB 이전 스크립트에만 남아 사용자에게 노출되지 않습니다.

## 공개 화면에서 숨긴 기능

- 연결되지 않은 구형 상세페이지 견적 버튼
- 구형 관리자 검수 페이지와 구형 업체 대시보드: 새 관리자 경로로 리디렉션
- 구형 `venue.html`: 동일한 쿼리 문자열을 유지해 `provider.html`로 리디렉션
- 실제 값이 없는 전화·가격·시설·취소 정책
- Supabase가 설정되지 않은 환경의 온라인 전용 행동 버튼

## 보안 적용

- 프론트엔드에는 공개 anon key만 사용하며 service role key를 포함하지 않습니다.
- 모든 운영 테이블에 RLS와 역할별 정책을 적용합니다.
- 업로드 파일은 비공개 버킷에 사용자별 경로로 저장합니다.
- 관리자 파일 열람은 짧은 만료 시간의 서명 URL만 사용합니다.
- 사용자·업체 입력은 일반 텍스트로 렌더링하고 URL 프로토콜을 제한합니다.
- 관리자 경로는 검색 제외와 no-store 헤더를 적용합니다.
- 업체 계정은 관리자 전체 데이터에 접근할 수 없고 승인된 본인 업체만 RPC로 수정합니다.
- 커뮤니티 공개·숨김 상태는 운영 역할만 변경할 수 있습니다.

## 배포 시 필요한 외부 설정

코드 작업과 별개로 운영자가 Supabase 프로젝트와 Netlify 환경변수를 한 번 연결해야 합니다. 순서는 `SUPABASE-SETUP-GUIDE.md`에 정리했습니다. 개인정보처리방침 푸터에 표시할 실제 사업자명·대표자·연락처도 운영자 정보로 교체해야 합니다.
