# QA-046 현행 5행사·공개 헤더 테스트 계약 정합화

- 작업 ID: `QA-046`
- 판정: `PASS`
- 기준일: 2026-07-30

## 결과

OPS-033 통합 후보에서 재현된 두 실패는 제품 결함이 아니라 과거 QA 조건이었다.
제품 파일을 수정하지 않고 다음 assertion만 현행 승인 계약에 맞췄다.

1. `marketplace-flow.mjs`
   - 이전: HTML 전체에서 `community.html` 링크를 찾으면 실패
   - 변경: 실제 `.site-nav` 범위를 먼저 확인하고 그 안의 커뮤니티 링크만 실패
   - 효과: 푸터의 정보 링크를 핵심 헤더 위반으로 오인하지 않음
2. `sonpum-redesign.mjs`
   - 이전: 행사 8개와 상견례·스몰웨딩 분리 요구
   - 변경: `kids`, `parents`, `meeting`, `anniversary`, `other` 5개를 정확히 요구
   - 효과: 승인된 결혼 준비·기타 가족행사 통합을 과거 분류로 되돌리지 않음

나머지 marketplace·브랜드·공개·RLS·저장·디자인 회귀 assertion은 삭제하거나
완화하지 않았다.

## 수정 파일

- `scripts/tests/marketplace-flow.mjs`
- `scripts/tests/sonpum-redesign.mjs`
- 이 보고서

제품 HTML·JavaScript·CSS, API·DB·migration, package/lock 변경은 0이다.

## 검증

| 검사 | 결과 |
| --- | --- |
| `marketplace-flow.mjs` | PASS |
| `sonpum-redesign.mjs` | PASS — 행사 5개 |
| `calculator-conditional-flow.mjs` | PASS |
| `header-account-navigation.mjs` | PASS |
| `prepare-dist.mjs` | PASS |
| `validate-dist.mjs` | PASS — HTML 40개 |
| 제품 파일 diff | 0 |

## 판정

현행 계약과 충돌하던 과거 검사 2건은 해소됐다. QA-046은 `DONE`으로 처리할 수
있다. 후속 QA-047 실제 격리 Auth·RLS·RPC 재검증도 PASS해 OPS-033 차단은
해소됐다.
