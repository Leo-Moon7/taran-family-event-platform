# FE-029 공개 헤더 도구 분리·로그인 전용 비교함 동선

## 작업 ID

FE-029

## 결과

구현 완료. 공개 상단 메뉴를 `업체 찾기 / 비용 계산기 / 준비 체크리스트 /
준비백과 / 업체 등록 / 로그인(내 정보)` 순서로 런타임 정규화했다. 공개
헤더와 모바일 하단에서 비교함을 제거하고 계산기와 체크리스트를 각각 직접
노출했다.

비교함은 로그인 계정의 마이페이지에서 선택 수와 함께 진입한다. 비로그인
`compare.html` 직접 접근은 `login.html?return=compare.html`로 이동하고,
로그인 상태에서는 기존 비교표를 연다. Auth 미설정 `file:` 로컬은 이동하지
않고 로그인 환경 안내 gate를 표시해 무한 redirect를 막았다.

Git stage·commit·push, PR, Netlify draft·production 배포, DB·API·migration
변경은 0건이다.

## 수정·추가·삭제 파일

### 수정

- `scripts/components/header.js`
  - 정적 헤더를 최종 공개 메뉴 순서로 교체하는 런타임 정규화 추가
  - 준비 도구 드롭다운·공개 비교함·비교 수 배지 제거
  - 모바일 하단을 홈·업체 찾기·비용 계산기·준비 체크리스트·로그인/내 정보로
    구성
  - 기존 메뉴 토글 접근성 보완 diff 보존
- `account.html`
  - 소유 페이지의 정적 헤더도 계산기·체크리스트 직접 링크로 정리
  - 비교함 `0/3곳 선택` 링크 추가
  - 기존 준비백과·브랜드 표기 diff 보존
- `account.js`
  - `TaranCompareStore.subscribe()`로 마이페이지 비교 선택 수 초기값·변경값 반영
- `compare.html`
  - 소유 페이지의 정적 공개 헤더에서 비교함·도구 묶음 제거
  - 인증 확인 전 비교 본문 숨김
  - Auth 미설정 file 로컬용 로그인 안내 gate 추가
- `scripts/pages/compare.js`
  - `TaranAuth.ready` 확인 뒤 렌더링
  - 비로그인 HTTPS/HTTP는 안전한 return 경로로 로그인 이동
  - Auth 미설정 file 로컬은 redirect 없이 안내
  - 로그인 계정은 기존 최대 3곳 비교·교체·삭제·견적 링크 로직 실행
- `styles/pages/member.css`
  - 마이페이지 비교함 링크와 선택 수 강조
  - 기존 footer·blog meta diff 보존

### 추가

- `scripts/tests/header-account-navigation.mjs`
  - 공개·모바일 메뉴 정적 계약
  - 마이페이지 비교 수 런타임 갱신
  - 비로그인 configured, Auth 미설정 file, 로그인 상태의 비교함 인증 3분기
  - 최대 3곳·견적 링크 회귀
- `ops/reports/FE-029-header-account-compare.md`

### 삭제

- 없음

## 실행 테스트

| 검사 | 결과 | 근거 |
| --- | --- | --- |
| `node scripts/tests/header-account-navigation.mjs` | PASS | 공개 메뉴 6개, 모바일 도구 분리, 마이페이지 선택 수, Auth 3상태, 최대 3곳·견적 링크 |
| 제품 JS `node --check` | PASS | `header.js`, `account.js`, `compare.js` |
| 전체 JS 직접 `node --check` | PASS | 77개 |
| `scripts/tests/validate.mjs`의 HTML·CSS·보안 검사 | PASS | 원본 검사 코드에서 자식 Node 문법 검사 구간만 분리, HTML 40개·보안 규칙 통과 |
| `node scripts/build/prepare-dist.mjs` | PASS | Supabase 미설정 로컬 번들 생성 |
| `node scripts/tests/validate-dist.mjs` | PASS | dist HTML 40개, 로컬 참조·공개 제외 목록 |
| source/dist SHA-256 대조 | PASS | FE-029 제품 파일 6개 모두 동일 |
| `git diff --check` | PASS | 공백 오류 0 |

현재 샌드박스에서 표준 `node scripts/tests/validate.mjs` 진입점은 내부
`spawnSync(process.execPath, ["--check", file])`가 자식 Node를 시작하지
못해 `result.stderr`가 없는 상태에서 `trim()`을 호출하며 중단됐다. 제품
문법 오류가 아니라 실행 환경 제약으로 재현됐고, 같은 77개 JS를 부모
PowerShell에서 직접 `node --check`한 뒤 원본 validator의 나머지 검사를
메모리에서 실행해 모두 통과했다. 검사 파일은 범위 밖이므로 수정하지 않았다.

## 화면·뷰포트 검증

| 화면·상태 | 뷰포트 | 결과 |
| --- | --- | --- |
| 홈 공개 상단 | 1440×1000 | 지정된 6개 링크와 순서 확인, 비교함·준비 도구 묶음 0 |
| 홈 모바일 | 390×844 | 하단에 계산기·체크리스트 각각 표시, 비교함 0, 로그인 표시, 가로 넘침 0 |
| 비로그인 `compare.html` 직접 접근 | 390×844 HTTP | `login.html?return=compare.html` 이동 확인 |
| Auth 미설정 `file:` | 전용 VM | redirect 0, 안내 gate 표시, 비교 렌더링 0 |
| 로그인 마이페이지 | 전용 VM | 선택 2곳 주입 시 `2/3곳 선택` 갱신, 계정 초기화 유지 |
| 로그인 비교함 | 전용 VM | redirect 0, 인증 gate 숨김, 비교 본문 표시·store 구독 시작 |

브라우저 플러그인의 URL 정책이 `file:` 직접 열기를 차단해 해당 한 분기는
실브라우저 대신 같은 제품 스크립트를 실행하는 전용 VM으로 확인했다. 실제
Supabase 계정 입력·인증·외부 요청은 수행하지 않았다.

## 완료 조건

- 공개 상단에 계산기·체크리스트 각각 표시: 충족
- 공개 상단·모바일에서 비교함과 준비 도구 묶음 제거: 충족
- 비로그인 비교함의 `return=compare.html` 로그인 이동: 충족
- 로그인 마이페이지 비교 선택 수·링크: 충족
- 로그인 뒤 비교함 접근: 전용 Auth 런타임 시나리오 충족
- 비교 최대 3곳·기존 견적 링크: 유지
- Auth 미설정 file 로컬 무한 redirect 방지: 충족
- build/dist: 충족
- 배포 0: 충족

## 회귀 영향

- `compare-providers` 저장 키와 `TaranCompareStore.limit = 3`을 변경하지 않았다.
- 업체 목록·상세의 비교 담기 UX와 파일을 변경하지 않았다.
- 비교표의 교체·삭제·결측 표시와 문의 가능한 업체만 전달하는
  `inquiry.html?providers=...` 계약을 유지했다.
- 계산기·체크리스트 제품 파일, 공통 token, API·Auth core, DB·migration,
  package/lock, 라우팅·환경 설정을 변경하지 않았다.
- 공개 헤더의 런타임 정규화는 `data-site-header`가 있는 공개 화면 전체에
  적용된다. 관리자 화면은 기존 제외 조건을 유지한다.

## 남은 문제

- 실제 Supabase 로그인 계정의 브라우저 E2E는 이번 로컬 미설정 환경에서
  수행하지 않았다. QA-045에서 격리 Auth 계정으로 로그인 return과 마이페이지
  선택 수를 최종 통합 검수해야 한다.
- 브라우저 정책상 `file:` 실브라우저 검증은 불가했다. 전용 VM 재현은 통과했다.
- 표준 validator의 자식 프로세스 실행 제약은 제품 결함이 아니며 전용 우회
  검사로 범위를 충족했다.

## 변경 요청

없음.

## 병합 권고

QA-045가 FE-028 계산기 링크와 FE-029 헤더·로그인 return 동선을 한 번 더
통합 검수해 `PASS`한 뒤 병합 권고. 현재 작업공간의 다른 미할당·병렬 변경과
분리해 위 8개 FE-029 파일만 exact 검토해야 한다. 배포는 별도 승인 전 금지한다.
