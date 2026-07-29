# QA-045 계산기 상세화·로그인 비교함 동선 통합 검수

## 최종 판정

`PASS`

FE-028과 FE-029는 지정된 파일 범위를 지켰고 P0/P1 결함은 발견되지 않았다.
제품 코드·API·DB·migration·패키지·환경변수·운영 배포·Git 외부 상태 변경은
없다.

## 범위 검수

- FE-028: `calculator.html`, 계산기 전용 JS/CSS·테스트·보고서만 변경
- FE-029: 공통 header, account, compare 전용 HTML/JS/CSS·테스트·보고서만 변경
- 두 작업의 제품 수정 파일 중복: 0
- API·DB·라우팅 설정·디자인 토큰·package/lock 변경: 0
- 기존 최대 3곳 비교와 `compare-providers` 저장 계약 변경: 0

## 완료 조건 검수

### FE-028

- 5개 행사 대분류마다 세부 행사 유형을 필수 선택: PASS
- 예상 인원 1~500명 입력, 0·501·소수·지수 거부: PASS
- 프라이빗 룸은 음식 유형+식비, 나머지 4개 공간은 이용 방식+식비 필수: PASS
- 선택 식비를 예상 인원에 한 번만 곱하고 공간·서비스 범위와 합산: PASS
- 세부 행사·예상 인원·공간 조건·식비를 결과·공유·저장에 반영: PASS
- 행사·세부 행사·공간 변경 시 관련 하위 상태 초기화: PASS
- 기존 5단계·행사 ID·검색 쿼리·저장 키·비시세 안내 유지: PASS

### FE-029

- 공개 상단 메뉴를 업체 찾기·비용 계산기·준비 체크리스트·준비백과·업체
  등록·로그인/내 정보로 정규화: PASS
- 공개 데스크톱·모바일 메뉴에서 비교함과 준비 도구 묶음 제거: PASS
- 계산기와 체크리스트를 각각 직접 노출: PASS
- 로그인 마이페이지에 비교함 선택 수와 링크 제공: PASS
- 비로그인 compare 직접 접근을 `login.html?return=compare.html`로 이동: PASS
- Auth 미설정 file 로컬에서 무한 redirect 없이 안내 gate 표시: PASS
- 로그인 상태에서 기존 비교표·삭제·교체·견적 링크 유지: PASS

## 재현 검사

| 검사 | 결과 |
| --- | --- |
| `scripts/tests/calculator-conditional-flow.mjs` | PASS |
| `scripts/tests/header-account-navigation.mjs` | PASS |
| FE-028·FE-029 관련 JS 8개 직접 `node --check` | PASS |
| 저장소 JS 77개 직접 `node --check` | PASS |
| `scripts/build/prepare-dist.mjs` | PASS |
| `scripts/tests/validate-dist.mjs` | PASS, HTML 40개 |
| exact 경로 `git diff --check` | PASS |
| 390×844 구현 검수 | PASS, 가로 넘침 0·44px 상호작용 |
| 1440×1000 구현 검수 | PASS, 가로 넘침 0·계산기 2열 |
| Auth configured guest/file guest/signed-in VM | PASS |

37명·호텔 연회 진행·1인 5만~8만 원 사례에서 식사
185만~296만 원, 장소 100만~400만 원, 합계 285만~696만 원으로 재현되어
식비 이중 합산이 없음을 확인했다.

## 기존 검사 도구 이슈

표준 `scripts/tests/validate.mjs`는 이 환경에서 자식 `spawnSync` 결과의
`stderr`가 `undefined`인데 41행에서 `.trim()`을 호출해 중단된다. 관련 제품
JS의 직접 문법 검사와 원본 validator의 나머지 HTML·CSS·보안 검사는
통과했으므로 FE-028·FE-029 제품 결함으로 판정하지 않는다. 기존 QA-044
후보에서 별도로 다룬다.

## 제한과 후속 확인

- 실제 운영 Supabase 계정·운영 DB는 사용하지 않았다.
- 로그인 전/후 계약은 전용 VM과 로그인 return 코드로 재현했다.
- 구현 담당의 390/1440 브라우저 결과를 독립 정적·상태 검사와 대조했다.
- GitHub 반영·Netlify 미리보기·production 배포는 수행하지 않았다.

## 결론

FE-028, FE-029, QA-045를 `DONE` 처리할 수 있다. 다음 단계는 별도 승인 또는
사용자 지시에 따른 Git exact 보존·온라인 미리보기이며, 현재 결과를 자동으로
main 또는 production에 반영하지 않는다.
