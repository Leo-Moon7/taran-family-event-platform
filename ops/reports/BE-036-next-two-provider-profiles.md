# BE-036 공식 근거 확인 업체 2곳 고객 공개 profile 추가

- 작업 ID: `BE-036`
- 기준일: 2026-08-14
- 판정: `PASS_CANDIDATE`
- 추가 대상: `NVR-DOL-005`, `NVR-DOL-007`
- 제품 HTML·CSS·페이지 JS, 후보 원본, DB·API·migration, 환경변수, package/lock, GitHub main, Netlify production 변경: 0건

## 1. 결과

기존 고객 공개 profile 5곳을 보존하면서 공식 홈페이지 근거가 충분한 2곳만 추가했다.

| 항목 | 변경 전 | 변경 후 |
| --- | ---: | ---: |
| 고객 공개 profile | 5 | 7 |
| 장소·식사 | 3 | 4 |
| 돌사진·스튜디오 | 2 | 3 |
| 숫자 가격 보유 | 2 | 2 |
| 가격·상품 구성 문의 필요 | 3 | 5 |
| 출장 지역 | 0 | 0 |
| 업체 이미지 | 0 | 0 |
| 활성 inquiry/compare/save/review | 0 | 0 |

## 2. 추가 profile과 공식 근거

### NVR-DOL-005 서라벌한정식 서초 본점

- 공식 기본 정보: <https://seorabol.kr/>
- 공식 행사 안내: <https://seorabol.kr/50>
- 주소: 서울특별시 서초구 법원로3길 6-9
- 전화: 02-599-5288
- 고객 공개 서비스: 돌잔치·백일, 한정식, 단독 룸, 행사 장비
- 영업시간: 공식 기본 정보에 명시된 화~일 운영, 월요일 휴무, 평일·주말 휴게시간을 구조화했다.
- 가격: 공식 행사 페이지의 프로모션 가격은 적용 조건과 현재 유효성이 불명확하므로 `products: []`로 유지했다.
- 출장: 고정 방문형 `visit`만 사용하고 `serviceAreas: []`로 유지했다.
- 이미지: 복제·핫링크하지 않았다.

### NVR-DOL-007 눈부신일상 강남점

- 공식 지점 정보: <https://www.ilsangst.com/branches/korea>
- 공식 상품 안내: <https://www.ilsangst.com/price>
- 주소: 서울특별시 서초구 양재천로21길 33 치금빌딩
- 전화: 02-555-5909
- 고객 공개 서비스: 백일 촬영, 돌 촬영, 가족 촬영
- 영업시간: 지점별 공식 영업시간 근거를 확보하지 못해 빈 배열로 유지했다.
- 가격: 공식 가격 페이지가 브랜드 공통 정보이며 강남점 적용 여부가 명확하지 않아 `products: []`로 유지했다.
- 출장: 고정 방문형 `visit`만 사용하고 `serviceAreas: []`로 유지했다.
- 이미지: 복제·핫링크하지 않았다.

각 profile의 `fieldEvidence`에는 식별·위치·서비스·전화·공식 링크의 공식 URL과 확인일을 보존했다. 서라벌한정식은 공식 기본 정보에서 확인된 영업시간 근거도 추가했다.

## 3. 데이터 계약

- 전역 계약 `window.customerProviderProfiles`와 재귀 `Object.freeze`를 유지한다.
- 기존 5곳의 ID·상호·주소·소개·가격·연락처는 변경하지 않았다.
- 신규 2곳의 `displayGate`는 `customer_ready`다.
- 정책, 예약 가능일, 추가비용은 확인되지 않은 상태를 `null` 또는 빈 배열로 보존한다.
- 문의·비교·저장·후기 기능은 모두 `false`다.
- 고객 문구에 `후보`, `정보 확인 전`, `관측`, `NAVER API`를 노출하지 않는다.

## 4. 검증

실행 명령:

```powershell
node --check scripts/data/customer-provider-profiles.js
node --check scripts/tests/customer-provider-profiles.mjs
node scripts/tests/customer-provider-profiles.mjs
git diff --check -- scripts/data/customer-provider-profiles.js scripts/tests/customer-provider-profiles.mjs ops/reports/BE-036-next-two-provider-profiles.md
```

전용 검사 범위:

- 정확히 7개 승인 ID·상호·주소·소개문
- 장소·식사 4, 돌사진·스튜디오 3
- 공식 HTTPS 도메인 allowlist, 전화 형식, 필드별 근거
- 숫자 가격 profile 정확히 2, 가격 문의 profile 정확히 5
- 신규 2곳 `products: []`
- 출장 0, 복제 이미지 0, 활성 기능 0
- exact schema, deep-freeze, 결정론, 금지 고객 문구

실행 결과:

```text
customer-provider-profiles PASS profiles=7 venueDining=4 studio=3 services=7 contacts=7 priceReady=2 priceInquiry=5 travel=0 copiedImages=0
```

`node --check` 2건과 `git diff --check`도 종료 코드 0으로 통과했다.

## 5. 스키마·API·보안 영향

- Supabase 스키마, RLS, RPC, Storage, Auth, API 영향: 없음
- 운영 DB 읽기·쓰기: 없음
- 개인정보 신규 수집: 없음
- 공식 공개 사업자 연락처와 공식 링크만 고객 profile에 구조화했다.
- 비밀키·환경변수 접근: 없음

## 6. 위험·롤백·병합 권고

- 공식 페이지가 존재해도 실제 예약 가능 여부와 당일 가격을 보장하지 않는다. 화면은 기존 `업체 문의` 계약을 유지해야 한다.
- 서라벌한정식 프로모션 가격과 눈부신일상 브랜드 공통 가격은 특정 지점 가격으로 공개하면 안 된다.
- 롤백은 `NVR-DOL-005`, `NVR-DOL-007` profile과 대응 테스트 기대값만 제거해 기존 5곳으로 복원한다.
- 독립 QA-055 전에는 `DONE`이 아니다. 현재 병합 권고는 `PASS_CANDIDATE`다.
- GitHub main, Netlify production, 운영 DB 반영은 별도 사용자 승인 대상이다.
