# QA-055 고객형 업체 7곳 확장 독립 검수

- 작업 ID: `QA-055`
- 최종 판정: `PASS_WITH_LIMITATION`
- 기준일: 2026-08-18
- 신규 P0/P1: 0건
- 제품·데이터·DB·API·환경변수·package/lock·GitHub main·Netlify production 수정: 0건

## 수정·추가 파일

QA 소유 범위만 변경했다.

- `scripts/tests/customer-provider-copy-anchor.mjs` — 7곳·4/3·가격2/문의5 계약과 신규 2곳의 공식 근거·전화·도메인 검사를 추가
- `ops/reports/QA-055-next-provider-expansion.md` — 본 검수 보고서

제품, 고객 profile, 원천 데이터, DB·API, 배포 파일은 읽기 전용으로 검수했다.

## 환경

- Windows PowerShell
- Node.js 20.19.2
- 로컬 HTTP: `http://127.0.0.1:4195`
- Codex 인앱 브라우저
- 뷰포트: 390×900, 768×900, 1440×900
- 실제 전화·외부 링크·폼 제출·로그인·운영 API/DB 쓰기 없음

## 데이터·근거 검수

| 항목 | 결과 |
| --- | --- |
| 고객 공개 profile | 정확히 7곳 PASS |
| 기존 5곳 보존 | 승인 ID와 순서 전부 보존 PASS |
| 신규 업체 | `NVR-DOL-005`, `NVR-DOL-007`만 추가 PASS |
| 분야 | 장소·식사 4 / 돌사진·스튜디오 3 PASS |
| 숫자 가격 / 업체 문의 | 2 / 5 PASS |
| 이미지 / 출장 지역 | 0 / 0 PASS |
| inquiry·compare·save·review | 활성 0 PASS |
| 공식 연락처 | 7곳 전화 형식·`tel:` 링크 PASS |
| 공식 링크·필드 근거 | HTTPS, 허용 host, `official_website`, 확인일 PASS |
| 스키마·동결·결정론 | exact schema, deep-freeze, 2회 로드 동일 PASS |

신규 2곳의 독립 대조 결과는 다음과 같다.

- 서라벌한정식 서초 본점: 주소 `서울특별시 서초구 법원로3길 6-9`, 전화 `02-599-5288`, 공식 host `seorabol.kr`, 가격 비공개 유지
- 눈부신일상 강남점: 주소 `서울특별시 서초구 양재천로21길 33 치금빌딩`, 전화 `02-555-5909`, 공식 host `www.ilsangst.com`, 지점 적용이 불명확한 브랜드 공통 가격 비공개 유지

두 profile 모두 식별·위치·서비스·전화·공식 링크 근거가 있고, 사진·출장·예약 가능일·활성 기능을 새로 주장하지 않는다.

## 자동 검사

통과 결과:

```text
PASS QA-055 customer provider expansion/copy/anchor
profiles=7 categories=7/4/3 price=2 inquiry=5 images=0 travel=0 capabilities=0
contacts=3/1 clipboard=immediate+2s footerGap=true desktopNav=5 mobileNav=4 publicLogin=0

customer-provider-profiles PASS profiles=7 venueDining=4 studio=3 services=7 contacts=7 priceReady=2 priceInquiry=5 travel=0 copiedImages=0
PASS QA-054 header/account navigation: public desktop=5 mobile=4 login=0, direct login/account/compare routes preserved
checked=95 failed=0
SONPUM HAEBANG Netlify deployment bundle created in dist/.
배포 검사 통과: HTML 40개, 로컬 파일 참조 및 공개 제외 목록
```

실행 범위:

- `node --check` — 변경 파일과 저장소 JavaScript 95개, 실패 0
- `node scripts/tests/customer-provider-copy-anchor.mjs`
- `node scripts/tests/customer-provider-profiles.mjs`
- `node scripts/tests/header-account-navigation.mjs`
- `node scripts/build/prepare-dist.mjs`
- `node scripts/tests/validate-dist.mjs`
- `git diff --check` — 오류 0, 기존 LF→CRLF 예고 경고만 있음

`node scripts/tests/validate.mjs`는 `account.js` 검사 과정의 내부 `spawnSync ... EPERM`으로 중단됐다. 제품 구문 오류가 아니라 현재 샌드박스의 자식 프로세스 제한이며, 동일 JavaScript 95개를 PowerShell에서 개별 `node --check`하여 실패 0으로 교차 확인했다. 이 환경 제한 때문에 판정을 `PASS_WITH_LIMITATION`으로 남긴다.

## 목록·필터 브라우저 검수

| 뷰포트 | 카드 | 실제 열 | 분야 수 | 가격/문의 | overflow | CTA 높이 |
| ---: | ---: | ---: | --- | --- | ---: | ---: |
| 390 | 7 | 1 | 4 / 3 | 2 / 5 | 0 | 46px |
| 768 | 7 | 2 | 4 / 3 | 2 / 5 | 0 | 46px |
| 1440 | 7 | 3 | 4 / 3 | 2 / 5 | 0 | 46px |

- 정적·런타임 제목은 `서울 돌잔치 업체 7곳`으로 일치했다.
- 탭은 `전체 7 / 장소·식사 4 / 스냅·영상 3`으로 일치했다.
- `장소·식사` 탭 4곳, `스냅·영상` 탭 3곳을 실제 클릭해 확인했다.
- 가격 필터는 `가격 정보 있음` 2곳, `업체 문의 필요` 5곳으로 동작했다.
- 초기화 후 7곳으로 복원됐다.
- 3개 뷰포트 모두 `noindex,nofollow`, 가로 overflow 0, 고객 CTA 최소 44px 이상이었다.

## 상세 브라우저 검수

1440px에서 7개 상세를 전수 확인했다.

- 문서 제목과 H1이 실제 업체명과 일치: 7/7
- 고객 섹션 표시·구형 섹션 숨김: 7/7
- 주소·전화·정보 업데이트 3개 fact: 7/7
- 문의 질문 6개: 7/7
- 공식 링크 host가 profile 계약과 일치: 7/7
- `noindex,nofollow`: 7/7
- 가로 overflow: 0/7
- 가격 공개 2곳은 `참고 메뉴 가격`, 나머지 5곳은 `가격 안내`: PASS

신규 2곳은 390px과 768px에서 추가 확인했다.

- 390px 연락처 1열, 768px 연락처 3열
- 세 앵커의 `scroll-margin-top` 150px
- 실제 클릭 후 제목 상단 150px, 고정 영역 하단 최대 130px로 가림 0
- 복사 버튼 높이 44px
- 두 뷰포트 모두 overflow 0
- 브라우저 console warning/error 0

## 범위 준수·보안·개인정보

- BE-036은 허용된 profile·profile test·보고서만 변경했고 제품·DB·API를 수정하지 않았다.
- FE-042는 `venues.html`의 정적 수량과 보고서만 변경했으며 공통 UI·라우팅·DB를 변경하지 않았다.
- 외부 공식 사이트를 열거나 전화하지 않았고, 저장소에 비밀키·개인정보·운영 권한을 추가하지 않았다.
- 공식 공개 사업자 전화와 링크만 기존 고객 profile 계약 안에서 사용했다.
- 이미지 복제·핫링크, 브랜드 공통 가격의 지점 가격 오인, 미확인 출장·예약·활성 기능 노출은 없었다.

## 완료 조건·제한·권고

| 완료 조건 | 결과 |
| --- | --- |
| 전용 QA·profile·header 검사 | PASS |
| exact 7·4/3·가격2/문의5 | PASS |
| 신규 2곳 공식 근거·전화·host | PASS |
| 기존 5곳 보존 | PASS |
| 이미지·출장·활성 기능 0 | PASS |
| 목록·상세·필터 | PASS |
| 390·768·1440 브라우저 | PASS |
| build·dist | PASS |
| 전체 `validate.mjs` | 환경 제한 EPERM, 개별 95개 구문 검사로 대체 |
| 신규 P0/P1 | 0건 |

최종 판정은 `PASS_WITH_LIMITATION`이다. BE-036·FE-042는 로컬/noindex 격리 미리보기 병합 후보로 권고한다. GitHub main, Netlify production, 운영 DB 반영은 이 판정에 포함하지 않으며 별도 사용자 승인 게이트를 유지한다.
