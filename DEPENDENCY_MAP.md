# 따란 리팩터링 의존성 지도

## 실행 구조

- 빌드 도구가 없는 정적 HTML/CSS/JavaScript 구조입니다.
- 새 공개 화면은 `styles/` 디자인 시스템과 `scripts/` 페이지 모듈을 사용합니다.
- 브랜드 설정은 `scripts/core/brand.js`, 저장 키 마이그레이션은 `scripts/core/storage.js`가 담당합니다.
- 업체 데이터는 기존 전역 데이터 파일을 유지하고 `data.js`가 공개 목록으로 합칩니다.
- 운영 문구는 미리 정의한 `contentSlotId`만 `content-runtime.js`가 반영합니다.

## 핵심 페이지

| 페이지 | 스타일 | 동작·데이터 |
| --- | --- | --- |
| `index.html` | `styles/pages/home.css` | `scripts/pages/home.js`, 검증 업체 데이터 |
| `venues.html` | `styles/pages/venues.css` | `scripts/pages/venues.js`, `data.js` |
| `provider.html` | `styles/pages/provider.css` | `scripts/pages/provider.js`, `data.js` |
| `admin/index.html` | `styles/pages/admin.css` | 공통 `admin-shell.js`와 페이지별 관리자 스크립트 |

## 관리자 경로

- `/admin/index.html`: 운영 현황
- `/admin/inquiries.html`: 견적·정보 공유
- `/admin/providers.html`: 업체 관리
- `/admin/content.html`: 준비백과
- `/admin/banners.html`: 배너
- `/admin/members.html`: 회원
- `/admin/analytics.html`: 통계
- `/admin/settings.html`: 권한 안내

루트 `admin.html`은 `/admin/index.html`로 이동만 담당합니다.

## 유지한 레거시 의존성

- 기존 URL과 대용량 데이터 파일은 회귀 방지를 위해 유지했습니다.
- 아직 전환하지 않은 보조 페이지는 기존 CSS/스크립트를 사용할 수 있습니다.
- `auth.js`의 실제 `/api/...` 서버는 정적 호스팅에 존재하지 않으므로 온라인 인증으로 간주하면 안 됩니다.

## 삭제한 의존성

- 단일 관리자 구현 `admin.js`, `admin-config.js`, `scripts/pages/admin.js`
- 사용자 입력 CSS selector/임의 HTML 기반 CMS 적용 경로
- 목록 페이지의 중복 정렬 입력

## 다음 연결 지점

1. Supabase Auth와 관리자 역할 테이블
2. RLS가 적용된 업체·글·배너 저장
3. 비공개 Storage와 검증된 업로드 API
4. 공개 데이터의 전역 파일 로딩을 페이지 단위 API로 교체
