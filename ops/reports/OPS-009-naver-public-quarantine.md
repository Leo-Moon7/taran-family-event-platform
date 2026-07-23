# OPS-009 NAVER 파생 공개 경로 가역적 격리 결과

- 실행일: 2026-07-22
- PM 판정: `PASS`
- 승인: D-22
- 온라인 업로드·최종 배포: 실행하지 않음

## 결과

- 공개 HTML의 NAVER 파생 script 참조: 30건 → 0건
- 공개 디렉터리에 병합되던 NAVER 파생 후보: 4,960건 → 0건
- 홈이 직접 읽던 NAVER 검증 배열: 39건 → 0건
- `dist`의 파생 파일 7개와 미사용 레거시 소비기 `app.js`, `venues.js`: 9개 → 0개
- 공개 번들의 NAVER 블로그·플레이스 파생 URL: 0건
- D-28 별도 결정 대상인 고정 지도 편의 링크 `map.naver.com`: 1건 유지

## 수정 범위

- 빌드: `scripts/build/prepare-dist.mjs`
- HTML 9개: `index.html`, `venues.html`, `provider.html`, `compare.html`, `inquiry.html`, `claim.html`, `venue.html`, `admin/index.html`, `admin/providers.html`
- 소비 경로: `data.js`, `scripts/pages/home.js`
- 준비 상태: `scripts/pages/venues.js`

삭제·이동한 소스 파일은 없다. CHG-B의 기존 접근성·이미지 변경은 보존했고, `provider.html`의 파생 script 제거와 `scripts/pages/venues.js`의 전체 재고 0건 분기만 OPS-009가 소유했다.

## 원본 보존

루트 파생 원본 7개와 `backend/data` 15개 파일은 실행 전후 SHA-256이 동일하다. 로컬 DB, 수집기, 원본 데이터의 수정·이동·삭제, API 호출과 DB 변경은 0건이다.

## 검증

- `pnpm test`: PASS — JavaScript 82개, HTML 40개, 보안·운영 규칙
- `pnpm build`: PASS
- `pnpm test:dist`: PASS — HTML 40개와 공개 제외 목록
- 정적 검사: source 파생 참조 0, dist 대상 파일 0, 블로그·플레이스 파생 URL 0, `data.js`/홈 직접 소비 0
- 브라우저: 390×844, 768×1024, 1440×1000에서 홈·목록·상세·비교·문의·claim·레거시 상세·관리자 2개 경로 확인
- 화면 결과: 명시적 빈/준비 상태, 가로 넘침 0, 콘솔 오류 0

## 남은 게이트

- FE-009 새 홈 디자인을 순차 구현·검수한다.
- D-28에서 외부 지도 편의 링크 유지 여부를 별도로 결정한다.
- 최종 병합과 최종 배포는 사용자 승인 전 금지한다.

## 롤백

위 13개 소스의 OPS-009 변경 구간만 되돌린 뒤 `pnpm build`로 `dist`를 다시 생성한다. 보존한 원본은 롤백 과정에서도 수정하지 않는다.
