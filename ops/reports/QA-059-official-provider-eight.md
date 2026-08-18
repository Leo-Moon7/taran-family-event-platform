# QA-059 공식 업체 8곳 공개 안전·화면 검수

- 판정: `PASS_WITH_LIMITATION`
- 브랜치: `agent/official-provider-eight`
- commit: `e835020`
- draft PR: <https://github.com/Leo-Moon7/taran-family-event-platform/pull/3>
- Netlify preview: <https://deploy-preview-3--taran-family-event-test.netlify.app/venues.html>

## 검수 결과

- 정확히 8곳, 장소·식사 5곳, 스냅·영상 3곳
- 가격 정보 3곳, 업체 문의 5곳
- 오크우드 프리미어 코엑스 센터는 공식 2026 돌잔치 패키지의 8인·10인 총액, 포함 항목, 조건, 공식 전화와 링크만 사용
- 기존 레스토랑은 `성인 1인 코스`, 오크우드는 `돌잔치 패키지 총액`으로 구분
- 사진·출장·예약 가능 여부 추정 0
- inquiry·compare·save·review 활성값 0
- 목록·상세 noindex 유지, 내부 후보·관측 용어 0

## 실행 검사

- JavaScript 구문 3건 PASS
- `customer-provider-profiles.mjs` PASS: `8/5/3`, 가격 `3/5`
- QA-059 UI 계약 PASS
- validate PASS: JavaScript 121·HTML 40
- build PASS
- test:dist PASS: HTML 40
- GitHub Quality checks와 Netlify preview checks PASS
- 실제 1280px 브라우저: 카드 8, 탭 8/5/3, 오크우드 목록·상세 가격 단위, 전화·공식 링크, overflow 0 PASS

## 제한

현재 브라우저 제어 화면의 크기를 직접 바꾸지 못해 390·768·1440 실화면 전수 검수는 이번 실행에서 완료하지 못했다. 반응형 CSS 계약과 자동검사는 통과했으며, main·production 반영 전 실제 3개 화면 크기 검수를 한 번 더 수행한다.

## 안전 경계

운영 DB, API, 환경변수, main, production, 업체 연락과 예약 제출은 변경하지 않았다. 운영 반영은 사용자 승인 전 금지한다.
