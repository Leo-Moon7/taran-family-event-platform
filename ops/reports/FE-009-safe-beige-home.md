# FE-009 베이지 C안 홈 안전 축소 구현 결과

- 작업 ID: FE-009
- 검수일: 2026-07-23
- 총괄 PM 판정: PASS
- 독립 reviewer 판정: PASS
- 외부 반영: Netlify draft만 생성, GitHub main·Netlify production·PR 병합 없음

## 결과

승인된 베이지 C안을 홈 전용 3개 파일에 구현했다. 방문자가 첫 화면에서 행사·지역·예상 인원을 고르고 바로 업체 찾기로 이동할 수 있으며, 검증되지 않은 업체·후기·가격·추천 수치와 준비되지 않은 업체 참여 기능은 노출하지 않는다.

## 수정 파일

- `index.html`
- `styles/pages/home.css`
- `scripts/pages/home.js`

FE-009는 위 3개 파일만 소유했다. 선행 OPS-009의 빌드 제외·공개 데이터 격리 변경과 기존 CHG-A~C는 수정 범위로 가져오지 않았다.

## 구현한 영역

1. 고정 상단 메뉴: 행사 계산기, 체크리스트, 준비백과, 정보 나눔, 로그인, 내 계정
2. 첫 화면: 행사·지역·예상 인원 선택과 `조건에 맞는 업체 찾기`
3. 현재 계약을 유지한 8개 행사 빠른 시작
4. 미검증 업체 카드 대신 정직한 `업체 정보 준비 상태`
5. 예산 계산기와 준비 체크리스트
6. MKT-008 공개 준비백과 대표 글과 FE-007 운영팀 시작 질문

## 보존한 계약

- 검색 이동: `venues.html?event=<행사>&province=<지역>&guests=<인원>`
- 8개 행사 ID: `kids`, `parents`, `meeting`, `smallWedding`, `familyGathering`, `anniversary`, `memorial`, `other`
- 계산기·체크리스트·준비백과·정보 나눔·로그인·계정의 기존 URL

브라우저에서 `parents + 경기도 + 30명`과 온라인 draft의 `meeting + 서울특별시 + 10명` 이동을 재현했다.

## 숨긴 미준비 기능

- 업체 카드·업체 수·지역별 수
- 외부 후기·평점·추천·가격
- 실제 업체 신뢰 라벨 부착
- 고객 정보 수정 제안, 업체 권한 요청, 신규 업체 등록
- 비교·견적 문의의 과도한 전면 강조
- 가상 회원 활동과 반응 수

## OPS-009 보존 확인

- `dist`의 NAVER 파생 7개 파일: 0개
- `dist` HTML/JavaScript의 파생 파일명·NAVER 블로그/플레이스 URL: 0건
- 공개 후보 렌더링: 0건
- 로컬 원본 7개 SHA-256: OPS-009 완료 시점과 동일
- 로컬 DB, 수집기, API, DB 스키마, 환경변수, 패키지: FE-009 변경 없음

## 검증 결과

| 검사 | 결과 |
| --- | --- |
| `pnpm build` | PASS |
| `pnpm test:dist` | PASS, HTML 40개 |
| `node scripts/tests/validate.mjs` | PASS, JavaScript 82개·HTML 40개 |
| `node scripts/tests/sonpum-redesign.mjs` | PASS, 행사 8개·대체 이미지 12개·핵심 화면 8개 |
| `git diff --check` | PASS |
| 1440×1000 | 가로 넘침 0, 검색·로그인·8개 행사 확인 |
| 768×1024 | 가로 넘침 0, 모바일 메뉴 전환 확인 |
| 390×844 | 가로 넘침 0, 메뉴 열기/닫기와 CTA 확인 |
| 브라우저 콘솔 | 오류 0건 |

`pnpm test`는 한 건만 실패했다. `scripts/tests/marketplace-flow.mjs`의 과거 규칙이 `index.html`의 모든 `community.html` 링크를 금지하지만, D-14·D-19~D-20과 FE-009는 홈의 `정보 나눔` 링크를 명시적으로 요구한다. 제품을 되돌리거나 검사를 무력화하지 않고 QA-016으로 테스트 계약 정합화를 분리했다.

## 온라인 draft

- 주소: `https://6a614bf21e9fc5a87195f051--taran-family-event-test.netlify.app/`
- Deploy ID: `6a614bf21e9fc5a87195f051`
- 확인: 홈 제목, 8개 행사, 로그인 링크, 검색 이동, NAVER 공개 문구 부재, 콘솔 오류 0

이 주소는 고유 draft다. 기존 production 주소를 바꾸지 않았고 최종 배포 승인을 의미하지 않는다.

## 범위·위험·롤백

- 범위 위반: 없음
- 남은 문제: QA-016은 CHG-A 테스트 정본 소유권 확정 전 `BLOCKED`; QA-012와 최종 production 검수 미실행
- 범위 밖 후보: 공통 모바일 메뉴의 열린 상태 접근성 이름과 기존 `비교함` 하단 노출은 FE-010에서 검토
- 롤백: `index.html`, `styles/pages/home.css`, `scripts/pages/home.js`의 FE-009 변경만 되돌린다. OPS-009 격리와 로컬 원본은 유지한다.
