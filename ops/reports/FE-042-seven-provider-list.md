# FE-042 고객형 업체 목록 7곳 확장 표시 정합화 결과

- 작업 ID: `FE-042`
- 판정: `PASS_CANDIDATE`
- 기준: `ops/handoffs/FE-042.md`, `ops/TASK_SPECS.md` FE-042
- 범위: 업체 목록의 정적·런타임 수량 정합화만 수행

## 구현 결과

- JavaScript 실행 전 초기 표시를 `서울 돌잔치 업체 7곳`으로 변경했다.
- 분야별 초기 탭 수를 `전체 7 / 장소·식사 4 / 스냅·영상 3`으로 변경했다.
- `scripts/pages/venues.js`는 이미 `customer_ready` profile 배열을 기준으로 전체 수와 분야별 수를 자동 계산하므로 변경하지 않았다.
- BE-036 데이터 반영 후 런타임 계약을 대조해 실제 `7 / 4 / 3`, 숫자 가격 2곳, 업체 문의 5곳임을 확인했다.
- 기존 검색어·분야·지역·가격 필터, 상세 CTA, 비용 계산기·체크리스트 CTA, 정적 `noindex,nofollow`를 보존했다.

## 수정 파일

- `venues.html` — 정적 초기 전체·분야별 수량 변경
- `ops/reports/FE-042-seven-provider-list.md` — 신규 결과 보고서

`scripts/pages/venues.js`는 검사만 수행했고 수정하지 않았다. 허용 범위 밖 파일과 다른 에이전트의 변경은 수정하거나 되돌리지 않았다.

## 검증 결과

| 검사 | 결과 |
| --- | --- |
| 정적 DOM 계약 | PASS — 제목 7, 전체 7, 장소·식사 4, 스냅·영상 3 |
| 런타임 profile 집계 | PASS — 전체 7, 장소·식사 4, 스냅·영상 3, 가격 2, 문의 5 |
| 런타임 자동 갱신 코드 | PASS — 제목은 `profiles.length`, 탭은 분야별 profile 포함 수로 계산 |
| `node --check scripts/pages/venues.js` | PASS |
| `node scripts/tests/customer-provider-profiles.mjs` | PASS — profiles=7, venueDining=4, studio=3, priceReady=2, priceInquiry=5 |
| CTA·noindex 정적 계약 | PASS — 계산기·체크리스트 링크 및 `noindex,nofollow` 유지 |
| `git diff --check -- venues.html scripts/pages/venues.js` | PASS — 줄 끝 변환 예고 경고만 있음 |
| `node scripts/tests/validate.mjs` | 환경 제한 — 내부 Node 실행이 `account.js`에서 `spawnSync ... EPERM`으로 차단됨. FE-042 변경 파일의 직접 구문 검사는 PASS |

## 화면·뷰포트 검증

- FE-042는 기존 레이아웃과 CSS를 변경하지 않았고 숫자 텍스트만 바꿨다.
- 390/768/1440 브라우저 회귀와 전체 validate/build/dist 검사는 후속 독립 검수 `QA-055`에서 수행해야 한다.

## 완료 조건 대조

- 정적·런타임 총 7: 충족
- 분야 합계 7(4+3): 충족
- 필터 결과와 탭 수의 동일 데이터 기반 계산: 충족
- 기존 CTA·noindex 보존: 충족
- 접근성 구조 변경 없음: 충족
- 전체 독립 회귀: `QA-055` 대기

## 남은 위험·병합 권고

- 신규 profile이 이후 다른 분야로 재분류되면 런타임 수는 자동 변경되지만 정적 초기값도 함께 갱신해야 한다.
- QA-055가 390/768/1440, 필터별 결과, build/dist와 전체 회귀를 통과하면 병합 후보로 권고한다.
- GitHub main, Netlify production, 운영 DB에는 반영하지 않았다.
