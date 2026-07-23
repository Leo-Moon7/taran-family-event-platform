# 공통 변경 요청

## CR-001 — 기존 브라우저 검사 변경 정리

- 요청 출처: CHG-A 미할당 변경
- 대상: `package.json`, `pnpm-lock.yaml`, `_verify/browser-smoke.cjs`, `scripts/tests/browser-smoke.cjs`
- 상태: REVIEW
- 필요 결정: 두 스모크 파일 중 정본, CI 포함 여부, 깨끗한 설치 재현
- 통제: 검토 완료 전 다른 작업이 패키지·잠금 파일을 수정하지 않는다.

## CR-002 — 검색 공개 정책 변경

- 요청 작업: FE-002
- 대상 후보: `scripts/pages/venues.js`, 관련 전용 테스트
- 상태: APPROVAL_REQUIRED
- 선행: D-01~D-03, QA-002, CHG-B 정리
- 제외: API 페이징, 디자인 전면 개편, 크롤러, 예약·결제

## CR-003 — 공식 도메인·SEO 설정

- 대상 후보: `sitemap.xml`, 공개 HTML 메타데이터, 구조화 데이터
- 상태: APPROVAL_REQUIRED
- 선행: D-06

## CR-004 — vendor-dashboard 강제 리디렉션

- 요청 출처: QA-006 공개 다중 뷰포트 검수
- 대상: `netlify.toml`의 `/vendor-dashboard.html` 301 블록
- 상태: APPROVAL_REQUIRED
- 원인: 동일 경로의 정적 파일이 존재하고 `force` 기본값이 `false`여서 redirect shadowing 발생
- 최소 변경: 해당 블록에만 `force = true` 추가
- 선행: D-13
- 검증: 무추적 HTTP 301·Location, 브라우저 최종 URL, 관리자 로그인 안내, 신규 콘솔 오류 없음
- 통제: `_redirects`, 레거시 HTML·JS, 관리자 코드, 다른 라우팅은 수정하지 않는다.

## CR-005 — NAVER 검색 파생 데이터 공개 번들 격리

- 요청 출처: QA-007, QA-009, QA-010, ADR-016
- 대상 후보: `scripts/build/prepare-dist.mjs`, NAVER 파생 배열을 직접 읽는 9개 HTML, 홈·목록·상세·비교·문의·소유권·관리자 소비 경로
- 상태: DONE
- 선행: D-22 승인 완료, 수정된 작업 카드와 파일 단일 소유권 확정 완료
- 필수 격리 대상: `review-candidates.js`, `review-coverage.js`, `review-venue-candidates.js`, `review-provider-candidates.js`, `review-lifecycle-candidates.js`, `review-lifecycle-verified.js`, `review-local-api-partners.js`의 공개 배포본과 참조
- 구현 전 분리: 빌드 제외만으로 끝내지 않고 `index.html`, `venues.html`, `provider.html`, `compare.html`, `inquiry.html`, `claim.html`, `admin/index.html`, `admin/providers.html`, `venue.html`의 참조와 관련 페이지 로더가 NAVER 후보를 실제 업체로 소비하지 않도록 범위를 확정한다. 이 경로는 공통 계약이므로 단일 통합 작업으로 순차 실행한다.
- 제외: 로컬 원본·`backend/data`·수집기·DB 삭제, 독립 출처 없는 값의 재가공·승계, 공공데이터 수집, CHG-A~C, 디자인 전면 개편
- 검증: source와 `dist`에서 7개 파생 파일·script 참조·공개 NAVER URL 0, 홈/목록/상세/비교/문의/claim/관리자가 오류 없이 정직한 빈/준비 상태, 기존 검수된 준비백과·커뮤니티 회귀 없음, 공개 비밀·개인정보 검사
- 통제: 이는 공개 격리이며 로컬 원본 삭제·재수집·대체 데이터 수집·배포 승인을 뜻하지 않는다. 로컬 원본은 D-27, 재배포는 D-22 승인 범위에서 별도 검수한다.
- 완료 결과: source HTML 파생 참조 30→0, dist 파생 7개와 레거시 소비기 2개 9→0, 공개 후보 4,960→0, 원본·DB 해시 불변. PM 로컬 검수 PASS, 최종 배포 금지.

## CR-006 — 운영팀 시작 질문 기반 커뮤니티 초기 화면

- 요청 출처: MKT-007
- 대상: `community.html`, `community-list.js`, `community-post.js`
- 상태: DONE
- 선행: MKT-007 DONE, D-19 완료
- 최소 변경: 기존 preview를 가짜 회원 활동이 아닌 `운영팀 시작 질문`으로 줄이고, 실제 published 글이 있으면 우선 표시하며, 실제 글이 없을 때 시작 질문을 제공한다.
- 제외: 가짜 회원·상대 시각·댓글·저장·공감 수 생성, DB·RLS·API·라우팅·패키지 변경
- 검증: 실제 글 우선, 0건/미구성 시작 질문, 운영팀 표시, 가상 반응 수 0, 기존 글쓰기 인증·검수 대기 흐름, 빌드·배포 검사
- 완료 결과: 실제 published 글 우선, 운영팀 시작 질문 6건, 가짜 회원·상대 시각·반응 수 0. PM 로컬 검수와 3개 뷰포트 테스트 통과. 배포는 별도 승인 대기.

## CR-007 — C안 차단 행동의 실제 기능 계약

- 요청 출처: QA-008
- 대상: BIZ-003 비교·신뢰 정책 + QA-011 원천 레지스트리 + OPS-008 운영 절차 → BE-006 데이터 계약 → 별도 FE/QA 구현 카드
- 상태: REPLANNED
- 선행: ADR-016, BIZ-003·QA-011·OPS-008 PM PASS 완료. 남은 게이트는 D-22~D-25와 BE-006
- 포함: 업체별 정보 수정 제안, 공개 가능한 변경 이력, 업체 권한 요청 상태, 신규 입점 인증 복귀·상태, 내 준비 현황 범위
- 통제: FE-006 홈 파일에서 저장·검수·상태 기능을 임시로 흉내 내거나 죽은 버튼을 만들지 않으며 NAVER 후보를 실제 업체 카드로 사용하지 않는다.
- 현재 결과: 비교·신뢰 정책, 공공 원천 레지스트리, 업체 등록·소유권·검수 SOP는 `ops/reports/PM-2026-07-22-prep-policy-review.md`에서 통합 PASS. 제품 구현은 아직 시작하지 않는다.

첫 실행 QA-002와 MKT-001은 공통 변경 요청이 없다.
