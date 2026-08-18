# 작업 카드

## BE-038 / FE-044 / QA-059

```text
작업 ID: BE-038
작업명: 공식 돌잔치 패키지 업체 1곳 추가
담당 전문 에이전트: 백엔드·데이터
근거 문서: 오크우드 프리미어 코엑스 센터 공식 2026 베이비 퍼스트 모먼츠 패키지
수정 허용 경로: scripts/data/customer-provider-profiles.js, profile 전용 테스트, 보고서
수정 금지 경로: 운영 DB, API, 환경변수, 패키지·잠금 파일, 기존 7곳 사실값
구현 범위: 업체명·주소·공식 전화·서비스·패키지 가격·조건·근거 구조화
구현하지 않을 범위: 사진 복제, 예약 가능 추정, 업체 연락, 운영 배포
완료 조건: 8곳·장소 5·촬영 3·가격 3, 공식 근거와 안전 기본값 검사 PASS
사용자 승인 필요 여부: 분리 브랜치·미리보기 불필요, main·production 별도 승인
현재 상태: DONE

작업 ID: FE-044
작업명: 패키지 총액과 1인 메뉴 가격 구분 표시
담당 전문 에이전트: 디자인·프런트엔드
수정 허용 경로: venues.html, scripts/pages/venues.js, scripts/pages/provider.js, UI 전용 테스트
수정 금지 경로: DB·API·공통 라우팅·환경변수·패키지 파일
구현 범위: 정적 수량 8/5/3, 카드와 상세에서 패키지 총액 전용 문구 적용
완료 조건: 기존 1인 메뉴 가격 문구 보존, 오크우드만 패키지 총액으로 표시
현재 상태: DONE

작업 ID: QA-059
작업명: 공식 업체 8곳 공개 안전·화면 검수
담당 전문 에이전트: 품질·보안
수정 허용 경로: 관련 테스트와 QA 보고서
수정 금지 경로: 운영 DB·production·환경변수
완료 조건: 구문·profile·UI·validate·build·dist·390/768/1440 검수 PASS, 신규 P0/P1 0
현재 상태: DONE (PASS_WITH_LIMITATION)
```

모든 제품 작업은 아래 카드의 허용 경로를 따른다. 2026-07-24 기준 QA-018은 1차 보고서 사실관계 보완 후 총괄 PM·독립 검수 `PASS`로 `DONE`이다. FE-014도 `DONE`이며 QA-016·QA-017은 CHG-A 테스트 정본 소유권이 정해질 때까지 `BLOCKED`다.

## QA-056

```text
작업 ID: QA-056
작업명: GitHub 자동 검사 구계약 현행화
담당 전문 에이전트: 품질·보안
현재 문제: draft PR #1의 validate 단계는 통과하지만 과거 marketplace/redesign 검사 기준이 승인된 7곳 UI·5개 행사 분류와 달라 GitHub Actions가 실패한다.
사업적 목적: 제품을 과거 화면으로 되돌리지 않고 현행 승인 계약을 정확히 검사해 PR 상태를 신뢰할 수 있게 한다.
근거 문서: OPS-042, QA-055, FE-041, FE-042, GitHub Actions run 32089835000, 사용자 2026-08-18 승인
선행 작업: OPS-042 DONE, QA-056 사용자 승인 완료
수정 허용 경로: scripts/tests/marketplace-flow.mjs, scripts/tests/sonpum-redesign.mjs, ops 운영 상태·QA-056 보고서
수정 금지 경로: 제품 HTML·CSS·페이지 JS·데이터, API·DB·migration·환경변수·package/lock, main, production
공유 계약: 현재 7곳·분야 4/3·가격 2/문의 5, 공개 헤더, 5개 행사 분류를 제품 사실 기준으로 유지한다.
구현 범위: 실패한 구계약 기대값을 현행 동작 계약으로 교체하고 npm test·build·dist·GitHub Actions를 재검증한다.
구현하지 않을 범위: 제품 기능 추가, 과거 스켈레톤·페이지네이션 복원, 커뮤니티 삭제, main 병합, production 배포
완료 조건: 테스트 파일만 최소 수정, npm test·build·test:dist·GitHub Actions PASS, 제품 diff 0
검증 방법: 실패 로그 대조, node test 개별·npm test·build·dist, git diff, 원격 PR check
실행할 테스트: marketplace-flow, sonpum-redesign, customer-provider-profiles, customer-provider-copy-anchor, npm test, build, test:dist
위험요소: 검사를 약화해 실제 회귀를 놓치거나 승인 범위 밖 제품 변경을 유도할 수 있음
롤백 방법: QA-056 테스트 commit을 revert하고 제품 snapshot commit을 유지한다.
사용자 승인 필요 여부: 승인 완료. main 병합·production은 별도 승인.
현재 상태: DONE (총괄 PM PASS, 테스트 2개만 수정, GitHub Actions run 32090510878 PASS, 제품 diff 0)
```

## OPS-042

```text
작업 ID: OPS-042
작업명: 고객형 업체 7곳 검수본 GitHub 별도 브랜치 보존
담당 전문 에이전트: 총괄 PM·품질
현재 문제: OPS-041 검수본을 혼합 변경 worktree를 훼손하지 않고 GitHub 별도 브랜치에 정확히 보존해야 한다.
사업적 목적: 운영 배포 없이 검수 완료한 7곳 버전을 재현 가능한 별도 브랜치와 draft PR로 보존한다.
근거 문서: BE-036, FE-042, QA-055, OPS-041, 사용자 2026-08-18 GitHub 반영 승인
선행 작업: OPS-041 DONE, GitHub 인증·push 권한 확인 완료
수정 허용 경로: 승인 snapshot에 필요한 제품·데이터·검사·운영 보고서 exact 목록, 격리 브랜치/임시 조립 공간
수정 금지 경로: GitHub main, Netlify production, 운영 DB, 비밀키, backend/data 원본, 무관한 dirty 변경
공유 계약: 현재 혼합 worktree에서 `git add -A`를 사용하지 않는다. main에 직접 push하지 않고 `agent/customer-provider-seven-preview` 별도 브랜치와 draft PR만 생성한다.
구현 범위: GitHub 인증 확인, exact snapshot 목록 대조, 격리 조립, 검사, commit, push, draft PR, 원격 blob·production 불변 확인
구현하지 않을 범위: main 병합, production 배포, DB 변경, 업체 연락, 운영 공개
완료 조건: exact 검수본만 원격 별도 브랜치에 보존, draft PR 생성, main·production 불변, 검사 PASS
검증 방법: local/remote commit·blob·파일 목록·테스트·production deploy ID 대조
실행할 테스트: QA-055, build, test:dist, git diff --check, 원격 branch/PR 대조
위험요소: 혼합 변경 과다 포함, main 자동 배포, 인증 만료, 누락된 의존 파일로 preview 재현 실패
롤백 방법: draft PR을 닫고 별도 브랜치를 삭제한다. main·production은 영향을 받지 않는다.
사용자 승인 필요 여부: 별도 브랜치·draft PR은 승인됨. main 병합·production 배포는 별도 승인.
현재 상태: DONE (총괄 PM PASS, commit fde185c, draft PR #1, main·production·DB 불변)
```

## BE-036

```text
작업 ID: BE-036
작업명: 공식 근거 확인 업체 2곳 고객 공개 profile 추가
담당 전문 에이전트: 백엔드·데이터
현재 문제: 고객용 업체 목록이 5곳뿐이며, 공식 근거를 추가 확인한 업체 2곳이 아직 고객 공개 projection에 없다.
사업적 목적: 근거가 충분한 업체만 단계적으로 늘려 고객이 장소와 촬영 업체를 실제로 탐색할 수 있게 한다.
근거 문서: BIZ-010, BE-034, BE-035, QA-054, 공식 홈페이지 seorabol.kr·ilsangst.com, 사용자 2026-08-18 요청
선행 작업: BE-035·QA-054 완료, 신규 2곳 공식 근거 감사 완료
수정 허용 경로: scripts/data/customer-provider-profiles.js, scripts/tests/customer-provider-profiles.mjs, ops/reports/BE-036-next-two-provider-profiles.md
수정 금지 경로: 제품 HTML·CSS·페이지 JS, 후보 원본, DB·API·migration·환경변수·package/lock, GitHub main, Netlify production
공유 계약: NVR-DOL-005·NVR-DOL-007만 추가한다. 숫자 가격·출장 지역·영업시간은 공식 근거와 지점 적용이 명확하지 않으면 비워 둔다. 이미지 복제·핫링크 금지, inquiry/compare/save/review=false를 유지한다.
구현 범위: 서라벌한정식 서초 본점과 눈부신일상 강남점의 공식 상호·주소·서비스·전화·공식 링크·필드별 근거를 profile에 추가하고 7곳 exact 계약을 검증한다.
구현하지 않을 범위: 다른 후보 공개, 가격 추정, 사진 사용, 지도, 업체 연락, DB 적재, 외부 배포
완료 조건: profiles 7, 장소·식사 4, 스냅·영상 3, 숫자 가격 2, 업체 문의 5, 이미지·출장·활성 기능 0, 기존 5곳 회귀 0
검증 방법: exact ID·주소·공식 host·전화·필드 근거·schema·deep-freeze·결정론 검사
실행할 테스트: node --check, customer-provider-profiles.mjs, git diff --check
위험요소: 브랜드 공통 가격을 특정 지점 가격으로 오인, 공식 사진 무단 사용, 미확인 가능 여부 단정
롤백 방법: 신규 profile 2개와 대응 테스트 기대값만 제거해 기존 5곳으로 복원한다.
사용자 승인 필요 여부: 사용자가 추가 등록을 요청해 로컬 noindex 초안 범위 승인됨. production·main·DB는 별도 승인.
현재 상태: DONE (총괄 PM PASS, profiles 7·분야 4/3·가격2/문의5·이미지/출장/활성기능0)
```

## FE-042

```text
작업 ID: FE-042
작업명: 고객형 업체 목록 7곳 확장 표시 정합화
담당 전문 에이전트: 디자인·프런트엔드
현재 문제: 정적 초기 문구와 분야별 탭 수가 5곳·3/2에 고정돼 신규 2곳과 일치하지 않는다.
사업적 목적: JavaScript 실행 전후 모두 실제 업체 수와 분야별 수가 일치하게 보여 신뢰와 탐색성을 유지한다.
근거 문서: BE-036, FE-041, QA-054, 사용자 2026-08-18 요청
선행 작업: FE-041 완료, BE-036과 공유 데이터 계약만 사용
수정 허용 경로: venues.html, scripts/pages/venues.js, ops/reports/FE-042-seven-provider-list.md
수정 금지 경로: provider.html·provider.js·CSS·공통 헤더, customer-provider-profiles.js, DB·API·라우팅·환경변수·package/lock, GitHub main, Netlify production
공유 계약: 총 7곳, 장소·식사 4, 스냅·영상 3, 숫자 가격 2, 업체 문의 5다. 기존 필터·3/2/1열·noindex·고객형 문구를 유지한다.
구현 범위: 정적 결과 수와 분야 탭 수를 7·4·3으로 정합화하고 런타임 데이터 기반 갱신이 계속 작동하는지 확인한다.
구현하지 않을 범위: 새 디자인, 새 분야, 사진·지도, 상세 기능, 가격·서비스 추정, DB·배포
완료 조건: 정적·런타임 총 7, 분야 합계 7, 필터 결과와 탭 수 일치, 기존 CTA·noindex·접근성 회귀 0
검증 방법: DOM 계약·필터 합계·node 구문·validate
실행할 테스트: node --check scripts/pages/venues.js, validate.mjs, git diff --check
위험요소: 정적 수와 런타임 수 불일치, 탭 합계 오류, 기존 5곳 카드 회귀
롤백 방법: venues 정적 수를 5·3·2로 되돌린다.
사용자 승인 필요 여부: 로컬 noindex 초안 범위 불필요. production·main은 별도 승인.
현재 상태: DONE (총괄 PM PASS, 정적·런타임 7/4/3·필터/CTA/noindex 보존)
```

## QA-055

```text
작업 ID: QA-055
작업명: 고객형 업체 7곳 확장 독립 검수
담당 전문 에이전트: 품질·보안
현재 문제: 신규 2곳이 근거·가격·연락처·화면 수량 계약을 지키는지 독립 확인이 필요하다.
사업적 목적: 공개 전 잘못된 가격·서비스·사진·연락처를 차단하고 기존 5곳을 보존한다.
근거 문서: BE-036, FE-042, QA-054, 사용자 2026-08-18 요청
선행 작업: BE-036·FE-042 PASS_CANDIDATE
수정 허용 경로: scripts/tests/customer-provider-copy-anchor.mjs, ops/reports/QA-055-next-provider-expansion.md
수정 금지 경로: 제품·데이터·DB·API·환경변수·package/lock·GitHub main·Netlify production
공유 계약: exact 7곳·4/3·가격2/문의5, 이미지0, 출장0, 활성 inquiry/compare/save/review0, 정적 noindex를 검증한다.
구현 범위: profile·목록·상세·필터·연락처·공식 링크·가격 조건·회귀·390/768/1440을 독립 검수한다.
구현하지 않을 범위: 제품 수정, 실제 전화·폼 제출, 운영 DB·배포
완료 조건: 전용 검사·profile·validate·build/dist·브라우저 PASS, 신규 P0/P1 0
검증 방법: exact schema/evidence/host/phone 검사, 7개 상세 DOM, 분야·가격 필터, 브라우저 console/overflow
실행할 테스트: customer-provider-profiles, QA-055, header-account-navigation, validate, build, test:dist, 브라우저 390/768/1440
위험요소: 공식 브랜드 공통 정보의 지점 오인, 기존 5곳 변형, noindex 누락
롤백 방법: QA는 제품을 수정하지 않고 BE-036 또는 FE-042를 REVISION_REQUIRED로 반환한다.
사용자 승인 필요 여부: 읽기 전용 검수 불필요. 온라인 draft·production은 별도 게이트.
현재 상태: DONE (총괄 PM PASS_WITH_ENV_LIMITATION 수용, 신규 P0/P1 0·JS 95개 개별 구문/build/dist/3 viewport PASS)
```

## OPS-041

```text
작업 ID: OPS-041
작업명: 고객형 업체 7곳 고유 noindex 온라인 미리보기
담당 전문 에이전트: 총괄 PM·품질
현재 문제: BE-036·FE-042·QA-055 결과를 사용자가 온라인에서 확인할 고유 주소가 필요하다.
사업적 목적: 운영 공개 전 실제 온라인 환경에서 7곳 목록·필터·상세를 확인한다.
근거 문서: BE-036, FE-042, QA-055, 사용자 2026-08-18 계속 진행 요청
선행 작업: BE-036·FE-042·QA-055 총괄 PM PASS
수정 허용 경로: dist/_headers, 임시 zip, ops/reports/OPS-041-seven-provider-preview.md, 운영 문서
수정 금지 경로: 제품 원본 추가 수정, GitHub main, Netlify production, 운영 DB, 환경변수
공유 계약: 고유 draft URL만 생성하고 noindex/nofollow를 HTTP 헤더로 강제한다. production deploy와 main commit은 바꾸지 않는다.
구현 범위: clean dist 빌드, POSIX 경로 zip, 고유 Netlify draft 업로드, HTTP·브라우저 smoke, production 불변 대조
구현하지 않을 범위: production 배포, GitHub push/merge, DB 변경, 외부 홍보, 업체 연락
완료 조건: draft ready, 필수 자산 200, X-Robots noindex/nofollow, 목록 7·분야4/3·상세 7, production 불변
검증 방법: Netlify 응답·HTTP 헤더·브라우저·production deploy ID 대조
실행할 테스트: QA-055, build, test:dist, HTTP·브라우저 smoke
위험요소: zip 경로 오류, draft와 production 혼동, noindex 헤더 누락
롤백 방법: draft를 사용하지 않고 기존 production을 유지한다.
사용자 승인 필요 여부: 기존 noindex 미리보기 연속 실행 승인 범위. production·main·DB는 별도 승인.
현재 상태: DONE (PASS, draft 6a839ca595c8db1c752d5efd·7/4/3·HTTP/noindex·3 viewport PASS, production 불변)
```

## OPS-040

```text
작업 ID: OPS-040
작업명: 업체 목록·상세 최종 마감 noindex 온라인 미리보기
담당 전문 에이전트: 총괄 PM·품질
현재 문제: FE-041·BE-035 결과를 사용자가 브라우저에서 확인할 고유 주소가 필요하다.
사업적 목적: 운영 공개 전에 실제 온라인 환경에서 목록·상세·앵커·복사·공개 헤더를 확인한다.
근거 문서: 사용자 2026-08-14 피드백, D-55, BE-035, FE-041, QA-054
선행 작업: QA-054 PASS
수정 허용 경로: dist/_headers, 임시 zip, ops/reports/OPS-040-customer-provider-final-preview.md, 운영 문서
수정 금지 경로: 제품 원본 추가 수정, GitHub main, Netlify production, 운영 DB, 환경변수
공유 계약: 고유 draft URL만 생성하고 noindex/nofollow를 HTTP 헤더로 강제한다. production deploy와 main commit은 바꾸지 않는다.
구현 범위: clean dist 빌드, POSIX 경로 zip, 고유 Netlify draft 업로드, HTTP·브라우저 smoke, production/main 불변 대조
구현하지 않을 범위: production 배포, GitHub push/merge, DB 변경, 외부 게시 홍보
완료 조건: draft ready, 필수 자산 200, X-Robots noindex/nofollow, 390/768/1440 핵심 흐름 PASS, production/main 불변
검증 방법: Netlify API 응답·HTTP 헤더·브라우저·Git 상태 대조
실행할 테스트: validate, build, test:dist, QA-054 2개, HTTP smoke, 브라우저 smoke
위험요소: zip 경로 구분자 오류, draft와 production 혼동, 헤더 누락
롤백 방법: draft를 사용하지 않고 기존 production을 유지한다. 제품·DB에는 롤백할 변경이 없다.
사용자 승인 필요 여부: 기존 승인 범위의 noindex draft는 불필요. production·main은 별도 승인.
현재 상태: DONE (PASS, draft 6a7eab527c24701b7813cc2c에서 QA-054 제한 항목 보완, production·main·DB 불변)
```

## QA-054

```text
작업 ID: QA-054
작업명: 업체 고객 문구·앵커·연락처·공개 헤더 독립 검수
담당 전문 에이전트: 품질·보안
현재 문제: FE-041·BE-035 변경이 앵커 가림, 가격 오인, 미확정 사실 단정, 로그인 기능 삭제, 모바일·푸터 회귀를 만들 수 있다.
사업적 목적: 테스트 공개 전 고객이 가격과 업체 성격을 오해하지 않고 핵심 정보를 불편 없이 이용하도록 한다.
근거 문서: 사용자 2026-08-14 피드백, D-54·D-55, BE-035, FE-041, QA-053
선행 작업: BE-035·FE-041 완료
수정 허용 경로: scripts/tests/header-account-navigation.mjs, scripts/tests/customer-provider-copy-anchor.mjs, ops/reports/QA-054-customer-provider-copy-anchor.md
수정 금지 경로: 제품·데이터·DB·API·환경변수·package/lock·main·production
공유 계약: 공개 헤더에서는 로그인 진입만 숨기고 login/account/Auth 기능·직접 URL은 삭제하지 않는다. 공식 근거 없는 가능·제공 단정은 금지한다.
구현 범위: 5곳 설명·짧은 태그, 가격 2곳/문의 3곳, 참고 메뉴 가격, 앵커 140~160px, 연락처 3열/모바일1열, 복사 2초 피드백, 푸터 gap, 공개 헤더 로그인 0·직접 로그인 기능 유지, 390/768/1440을 검수한다.
구현하지 않을 범위: 제품 수정, 실제 로그인·전화·외부 링크·폼 제출, 운영 DB·배포
완료 조건: 전용 검사·현행화 헤더 검사·projection·validate·build/dist·브라우저 모두 PASS, 신규 P0/P1 0
검증 방법: 정적 계약, 5개 profile 전수, 로컬 HTTP 3개 viewport·앵커 클릭·clipboard·footer·direct login smoke
실행할 테스트: customer-provider-profiles, customer-provider-layout-refinement, header-account-navigation, QA-054, validate, build/test:dist, 브라우저
위험요소: 공개 로그인 숨김을 Auth 삭제로 확대, 일반 메뉴 가격을 돌잔치 총액으로 오인, 긴 소개 문구를 사실보다 강하게 수정
롤백 방법: QA 파일만 제거하고 BE-035 또는 FE-041을 REVISION_REQUIRED로 반환한다.
사용자 승인 필요 여부: 읽기 전용 검수 불필요. production·main은 별도 승인.
현재 상태: DONE (OPS-040 온라인 draft에서 직접 route·console 보완 PASS)
```

## FE-041

```text
작업 ID: FE-041
작업명: 업체 상세 앵커·가격 표현·연락처·공개 헤더 마감
담당 전문 에이전트: 디자인·프런트엔드
현재 문제: 내부 고정 메뉴가 제목을 가리고, 일반 메뉴 가격과 돌잔치 전체 비용이 혼동되며, 연락처·푸터·복사 완료 피드백과 공개 로그인 노출이 테스트 공개 기준에 맞지 않는다.
사업적 목적: 구조를 다시 만들지 않고 고객 이해와 실제 사용성을 마무리한다.
근거 문서: 사용자 2026-08-14 피드백, D-54, D-55, FE-040, QA-053
선행 작업: FE-040·QA-053 DONE
수정 허용 경로: venues.html, provider.html, scripts/pages/venues.js, scripts/pages/provider.js, scripts/components/header.js, styles/pages/venues.css, styles/pages/provider.css, styles/components/header.css, ops/reports/FE-041-customer-provider-final-polish.md
수정 금지 경로: 고객 profile 데이터, DB·API·Supabase·migration·환경변수·package/lock, login/account/compare 기능 코드, main·production
공유 계약: 가격 숫자는 공식 근거 2곳의 성인 1인 메뉴/코스뿐이다. 지도·사진을 추가하지 않는다. 공개 헤더 로그인만 제거하고 직접 로그인·계정·비교함 인증 기능은 보존한다.
구현 범위: 앵커 140~160px 여백, 가격 제목/안내 동적 구분, 카드 가격·문의 문구, 짧은 태그 표시, 가격 필터 `전체`, 연락처 데스크톱 3열·모바일 1열, 위치·연락처 명칭, 복사 버튼 2초 상태, 상세 푸터 gap, 데스크톱·모바일 공개 로그인 메뉴 제거
구현하지 않을 범위: Auth·login/account route 삭제, 업체 사진·지도 추가, profile 설명 수정, 운영 배포
완료 조건: 세 앵커 클릭 후 제목 비가림, 가격 카드 문구 정확, 문의 카드 1줄, 태그 매핑, 연락처 3/1열, 복사 성공 피드백, 푸터 gap, 공개 로그인 0·직접 login route 유지, 390/768/1440 overflow 0
검증 방법: DOM/CSS 대조, 자동 검사, 로컬 HTTP 브라우저
실행할 테스트: node --check, customer-provider-layout-refinement, header-account-navigation 현행 계약 확인, validate, build/test:dist, 브라우저
위험요소: 공통 헤더 변경 회귀, 로그인 기능 자체 제거, scroll-margin 부족, 복사 상태 타이머 접근성
롤백 방법: 지정 FE 파일만 FE-040 상태로 복원한다.
사용자 승인 필요 여부: 현재 요청으로 공개 헤더 로그인 제거 승인. main·production 별도 승인.
현재 상태: DONE (QA-054 신규 P0/P1 0, OPS-040 보완 검수 연계)
```

## BE-035

```text
작업 ID: BE-035
작업명: 고객형 업체 소개 문구 사실 강도 정리
담당 전문 에이전트: 백엔드·데이터
현재 문제: 5곳 소개의 `안내하는` 표현이 반복되고 고객에게 부자연스럽지만, 공식 근거보다 강한 `가능·제공` 단정으로 바꾸면 안 된다.
사업적 목적: 읽기 쉬우면서 근거 범위를 벗어나지 않는 업체 소개를 제공한다.
근거 문서: 사용자 2026-08-14 피드백, BIZ-010, BE-034, D-54
선행 작업: BE-034 DONE
수정 허용 경로: scripts/data/customer-provider-profiles.js, scripts/tests/customer-provider-profiles.mjs, ops/reports/BE-035-customer-provider-copy.md
수정 금지 경로: HTML·CSS·페이지 JS·API·DB·Supabase·migration·환경변수·package/lock·main·production
공유 계약: 기존 fieldEvidence 공식 URL과 서비스 근거 안에서만 문구를 다듬고, 새 서비스·가격·출장·예약·사진 사실을 만들지 않는다.
구현 범위: 5곳 introduction의 반복 표현 제거, 공식 근거가 명확한 범위만 자연스럽게 표현, 전용 테스트에 금지 표현·새 주장 0 확인 추가
구현하지 않을 범위: 서비스 배열·가격·연락처·근거 URL·확인일·capability 변경
완료 조건: 5곳 모두 자연스러운 소개, `안내하는` 0, 신규 사실·숫자·서비스 0, 기존 profile 계약 PASS
검증 방법: 변경 전후 필드 diff, 공식 fieldEvidence 대조, 전용 검사
실행할 테스트: node --check, customer-provider-profiles
위험요소: 마케팅 문구가 공식 근거보다 강해짐, 서비스 배열과 소개 불일치
롤백 방법: introduction 5개만 이전값으로 복원한다.
사용자 승인 필요 여부: 현재 문구 수정 요청 범위. 외부 게시·production은 별도 승인.
현재 상태: DONE (QA-054 신규 P0/P1 0)
```

## OPS-039

```text
작업 ID: OPS-039
작업명: 고객형 업체 목록·상세 간결화 고유 온라인 미리보기
담당 전문 에이전트: 총괄 PM·품질
현재 문제: FE-040·QA-053 통과본을 사용자가 온라인에서 직접 확인할 새 주소가 없다.
사업적 목적: 운영 사이트와 데이터베이스에 영향을 주지 않고 목록 분류·가격 단위·간결화된 상세 화면의 최종 피드백을 받는다.
근거 문서: 사용자 2026-08-14 피드백, FE-040, QA-053, OPS-038
선행 작업: FE-040·QA-053 PASS
수정 허용 경로: dist/** 재생성, .runtime-local/ops-039-*, ops/reports/OPS-039-customer-provider-layout-preview.md, OPS-039 관련 운영 문서
수정 금지 경로: 제품 원본 추가 수정, 운영 DB·Supabase·migration·환경변수·GitHub main·PR·Netlify production alias·정식 도메인·색인
공유 계약: 고유 draft URL만 사용하고 X-Robots-Tag noindex,nofollow를 유지한다. production deploy ID·URL·commit은 전후 불변이어야 한다.
구현 범위: 검증된 현재 산출물을 dist로 빌드하고 고유 Netlify draft에 업로드한 뒤 HTTP·asset·목록·5개 상세·필터·복사·390/768/1440을 읽기 전용 검수한다.
구현하지 않을 범위: main push·production 배포·운영 DB·실제 전화·업체 연락·폼 제출·로그인·지도 추가
완료 조건: 새 고유 HTTPS URL, noindex/nofollow, 목록 5=3+2, 상세 5, 가격2·문의3, 이미지0·지도0·중복0·질문6, 3개 viewport overflow/console 0, production 전후 불변
검증 방법: QA-053·validate·build/dist 재실행, Netlify API 전후 상태, HTTP header/asset, 브라우저 읽기 전용 회귀
실행할 테스트: customer-provider-layout-refinement, customer-provider-profiles, validate, build/test:dist, HTTP smoke, 브라우저 390/768/1440
위험요소: draft라도 링크를 아는 사람은 접근 가능, 운영 production alias 오변경, noindex 헤더 누락
롤백 방법: 고유 draft URL 공유를 중단한다. production/main/DB가 불변이므로 운영 롤백은 필요하지 않다.
사용자 승인 필요 여부: 기존 온라인 미리보기 승인 범위. production·main·운영 DB는 별도 승인.
현재 상태: DONE — 고유 noindex draft·HTTP·브라우저·production 불변 PASS
```

## QA-053

```text
작업 ID: QA-053
작업명: 고객형 업체 목록·상세 간결화 독립 검수
담당 전문 에이전트: 품질·보안
현재 문제: 분야 탭·3열 카드·상세 중복 제거·가격 단위·항상 펼친 예약 질문 변경이 데이터 과장, 접근성 저하 또는 숨긴 기능 재진입을 만들 수 있다.
사업적 목적: 고객이 업체 분야를 빠르게 나누어 보고, 반복 없이 실제 가격 단위와 문의 정보를 이해하는지 확인한다.
근거 문서: 사용자 2026-08-14 피드백, D-54, FE-040, QA-052
선행 작업: FE-040 구현 완료
수정 허용 경로: scripts/tests/customer-provider-layout-refinement.mjs, ops/reports/QA-053-customer-provider-layout-refinement.md
수정 금지 경로: 모든 제품·데이터·DB·API·환경변수·package/lock·main·production
공유 계약: 실제 데이터 기준 탭은 전체 5·장소/식사 3·스냅/영상 2이며 의상/미용 1을 만들지 않는다. 제품 결함은 직접 수정하지 않고 REVISION_REQUIRED로 반환한다.
구현 범위: 헤더 순서·sticky, 검색 폭/라벨, 탭 카운트·선택/필터 동기화, 3열/반응형, 이미지 없는 텍스트 카드, 가격 단위, CTA 통일, 상세 중복 0, 상품 3열, 예약 질문 기본 노출·복사, 위치 빈 영역 0, 공식 링크 명칭, 하단 배너, noindex/API·Auth·금지 기능 회귀를 검사한다.
구현하지 않을 범위: 제품 수정, 지도 서비스 선택, 실제 외부 링크 클릭·전화, 운영 DB·배포
완료 조건: 전용 검사·validate·build/dist·390/768/1440 브라우저 모두 PASS, 신규 P0/P1 0
검증 방법: 정적 DOM/JS/CSS 계약, 데이터 5곳 전수, 3개 viewport 읽기 전용 브라우저 검수
실행할 테스트: customer-provider-profiles, QA-052, QA-053, validate, build/test:dist, 브라우저 목록·필터·5상세·clipboard
위험요소: 사용자 예시 2/2/1을 실제 데이터로 오인, 단위 가격을 행사 전체 견적으로 오인, 지도 링크을 미승인 상태에서 임의 추가
롤백 방법: 검수 파일만 제거하고 FE-040을 REVISION_REQUIRED로 반환한다.
사용자 승인 필요 여부: 읽기 전용 검수 불필요. 외부 draft는 기존 온라인 미리보기 승인 범위, production은 별도 승인.
현재 상태: DONE — 독립 검사·390/768/1440·상세 15조합 PASS
```

## FE-040

```text
작업 ID: FE-040
작업명: 고객형 업체 목록 분야 분리·상세 중복 제거
담당 전문 에이전트: 디자인·프런트엔드
현재 문제: 업체 종류가 한 목록에 섞이고, 상세 핵심정보와 업체 정보가 반복되며, 단위 가격·대체 이미지·위치 빈 영역·하단 배너가 고객 이해를 방해한다.
사업적 목적: 장소·식사와 스냅·영상 탐색을 빠르게 분리하고, 상세 길이를 줄이면서 가격·예약 전 질문·공식 연락의 실용성을 높인다.
근거 문서: 사용자 2026-08-14 피드백, BIZ-010, BE-034, FE-039, QA-052, D-28, D-54
선행 작업: FE-039·QA-052·OPS-038 DONE
수정 허용 경로: venues.html, provider.html, scripts/pages/venues.js, scripts/pages/provider.js, styles/pages/venues.css, styles/pages/provider.css, ops/reports/FE-040-customer-provider-layout-refinement.md
수정 금지 경로: 고객 profile 데이터, 공통 header JS/CSS·디자인 토큰, DB·API·Supabase·migration·환경변수·package/lock, main·production
공유 계약: 현재 5곳의 실제 분류는 장소·식사 3, 스냅·영상 2다. 의상·미용 업체 1곳을 임의 생성하지 않는다. 지도 제공자는 D-28 미결정이므로 지도·지도 링크를 새로 추가하지 않고 빈 영역만 제거한다. 숫자 가격은 공식 근거 2곳의 성인 1인 단위만 표시한다.
구현 범위: 헤더→메인→검색 순서와 sticky 확인, 검색 폭 확대·고객 라벨, 실제 데이터 기반 분야 탭, 목록 3열/텍스트 카드·CTA 통일·단위 가격, 하단 배너 문구/버튼 대비, 상세 대체 이미지 축소·비오인, 업체 정보 중복 섹션 제거, 상품 3열·가격 안내 강화, 예약 질문 기본 노출·분야별 6개·복사, 위치/전화/공식 홈페이지 링크 간결화, 빈 회색 영역 제거
구현하지 않을 범위: profile 데이터 수정, 업체 사진 복제, 지도/지도 링크 추가, 가격·출장·예약 사실 추정, 문의·비교·저장·후기 활성, 운영 배포
완료 조건: header가 두 페이지 최상단 sticky, 탭 전체5·장소/식사3·스냅/영상2와 필터 동기화, 데스크톱 3열·태블릿2열·모바일1열, 카드 이미지 0·CTA 모두 상세 정보 보기, 가격 단위/전체견적 별도문의 표시, 상세 업체정보 중복 섹션 0·상품 3열·예약 질문 기본 노출·복사, 위치 빈 패널 0, 공식 홈페이지 문구, 배너 버튼 텍스트/대비, 390/768/1440 overflow 0
검증 방법: BE-034 데이터와 DOM을 대조하고 자동 검사·로컬 브라우저 3개 viewport에서 목록·탭·필터·상세·복사를 확인한다.
실행할 테스트: node --check, customer-provider-profiles, QA-052, validate, build/test:dist, 브라우저 390/768/1440
위험요소: 기존 5곳 공식 근거 계약 훼손, 카테고리 수 오표시, 가격 총액 오인, 대체 이미지를 실제 업체 사진으로 오인
롤백 방법: 6개 제품 파일을 FE-039 상태로 복원한다.
사용자 승인 필요 여부: 격리 미리보기 구현은 현재 요청 범위. main·production은 별도 승인.
현재 상태: DONE — QA-053 PASS
```

## OPS-038

```text
작업 ID: OPS-038
작업명: 첫 5곳 고객형 업체 화면 고유 noindex 온라인 미리보기
담당 전문 에이전트: 총괄 PM·품질
현재 문제: 고객형 업체 목록·상세는 로컬 검수만 끝나 사용자가 온라인에서 직접 확인할 주소가 없다.
사업적 목적: 운영 사이트와 DB에 영향을 주지 않고 고객용 정보 구조와 디자인 피드백을 받을 수 있는 고유 검수 화면을 제공한다.
근거 문서: BIZ-010, BE-033, FE-038, BE-034, FE-039, QA-052, 사용자의 온라인 미리보기 승인
선행 작업: BIZ-010·BE-033·FE-038·BE-034·FE-039·QA-052 PASS
수정 허용 경로: dist/** 재생성, ops/reports/OPS-038-customer-provider-online-draft.md, OPS-038 관련 운영 문서, 기존 승인된 draft 업로드 스크립트의 비밀값 없는 실행
수정 금지 경로: 제품 원본 추가 수정, 운영 DB·Supabase·migration·RLS·API 데이터, GitHub main·PR·최종 병합, Netlify production alias, 정식 도메인·색인, 실제 문의·업체 연락
공유 계약: 고객 공개 기준을 통과한 5곳만 포함한다. 전역 X-Robots-Tag noindex,nofollow를 적용한 고유 deploy URL만 사용하고 production URL과 deploy를 변경하지 않는다.
구현 범위: 현재 검증 산출물을 dist로 빌드하고 고유 Netlify draft에 업로드한 뒤 목록·상세·필터·전화/공식 채널·문의 문구 복사·asset·noindex·3개 viewport를 읽기 전용으로 재검수한다.
구현하지 않을 범위: 운영 DB 적재, 실제 폼 제출, 로그인, main push, production 배포, 정식 도메인 연결·검색 색인, 업체 연락, 포트폴리오 복제
완료 조건: 고유 HTTPS draft 1개, 업체 카드 정확히 5개, 상세 5개 접근, 숫자 가격 2곳만, 고객 화면 내부 용어 0, X-Robots-Tag noindex,nofollow, 핵심 asset 200, 390/768/1440 overflow·console 오류 0, production deploy ID·URL 불변
검증 방법: 업로드 전 BE-034·QA-052·validate·build/dist, 업로드 후 HTTP header/asset smoke와 읽기 전용 브라우저 회귀
실행할 테스트: customer-provider-profiles.mjs, customer-provider-public-ux.mjs, validate.mjs, prepare-dist.mjs, validate-dist.mjs, HTTP smoke, 브라우저 390/768/1440
위험요소: 고유 draft도 링크를 아는 사람은 접근할 수 있으며 업체 정보가 바뀔 수 있다.
롤백 방법: draft URL 공유를 중단하고 필요 시 Netlify에서 해당 deploy를 삭제한다. main·production·DB는 변경하지 않아 코드 롤백이 없다.
사용자 승인 필요 여부: 사용자가 온라인 미리보기를 요청·승인한 범위에서 고유 noindex draft만 허용. production·main·운영 DB는 별도 승인 필요.
현재 상태: DONE (총괄 PM PASS, 고유 noindex draft `6a7e7c53cd87f23aa554498f`, 고객형 5곳·HTTP·필터·상세 5곳·390/768/1440·console 0 PASS, production 불변)
```

## QA-052

```text
작업 ID: QA-052
작업명: 첫 5곳 고객형 공개 안전·접근성 검수
담당 전문 에이전트: 품질·보안
현재 문제: 고객형 문구로 전환하면서 미확정 정보가 확정 사실처럼 보이거나, 숨긴 기존 후보/API 기능이 다시 진입할 수 있다.
사업적 목적: 첫 5곳이 고객에게 유용하면서도 공식 근거·결측·연락·가격·접근성 경계를 지키는지 독립 검수한다.
근거 문서: BIZ-010, BE-033·BE-034, FE-038·FE-039, R-116·R-118·R-122
선행 작업: FE-039 구현·PM 자동 검사 PASS
수정 허용 경로: scripts/tests/customer-provider-public-ux.mjs, ops/reports/QA-052-customer-provider-public-ux.md
수정 금지 경로: 모든 제품·데이터·DB·API·환경변수·package/lock·운영 문서·main·production
공유 계약: 제품 결함은 직접 수정하지 않고 REVISION_REQUIRED로 반환한다. 고객 화면은 5곳만, 내부 용어 0, 가격 숫자 2곳만 조건/기준일과 표시, 출장·예약·취소·업체 사진·후기/문의/비교/저장 0을 유지한다.
구현 범위: projection/DOM/필터/검색/CTA/전화·공식 URL/결측/가격 의미/clipboard/noindex/JS-off/네트워크/API·Auth 조기차단/390·768·1440 접근성·overflow를 검사한다.
구현하지 않을 범위: 제품 수정, 실제 전화·외부 폼·로그인·업체 연락·DB·배포
완료 조건: 전용 검사·validate·build/dist·브라우저 모두 PASS, 신규 P0/P1 0
검증 방법: 정적 계약·변이 음성·DOM 행렬·네트워크 spy·로컬 브라우저 읽기 전용 검수
실행할 테스트: BE-034/QA-052 전용 검사, validate, build, test:dist, 390/768/1440
위험요소: 대표 메뉴 가격을 돌잔치 총액으로 오인, 공식 채널 새 창 보안, 클립보드 실패 미안내
롤백 방법: 검수 파일만 제거하고 FE-039를 REVISION_REQUIRED로 반환한다.
사용자 승인 필요 여부: 읽기 전용 검수 불필요. 외부 draft/production은 별도 게이트.
현재 상태: DONE (총괄 PM PASS, 고객형 5곳·공식 가격 2곳·공식 전화/채널 5곳·내부 용어/추정 정보/API·Auth 진입 0, 자동·브라우저 회귀 PASS)
```

## FE-039

```text
작업 ID: FE-039
작업명: 첫 5곳 고객형 업체 목록·상세 구현
담당 전문 에이전트: 디자인·프런트엔드
현재 문제: 현 화면은 20개 내부 후보 상태와 방어 문구 중심이라 고객이 서비스·가격·연락 경로를 파악하기 어렵다.
사업적 목적: 공식 근거를 확보한 5곳을 서비스·지역·가격·공식 연락 중심으로 탐색하고 상세에서 바로 확인하게 한다.
근거 문서: 사용자 요청 2026-08-14, BIZ-010, BE-033, BE-034, FE-038
선행 작업: BE-034 PASS
수정 허용 경로: venues.html, provider.html, scripts/pages/venues.js, scripts/pages/provider.js, styles/pages/venues.css, styles/pages/provider.css, ops/reports/FE-039-customer-provider-ui.md
수정 금지 경로: 고객/후보 데이터, DB·API·Supabase·migration·환경변수·공통 토큰/헤더·package/lock, main·production
공유 계약: `customerProviderProfiles`의 `customer_ready` 5곳만 고객 화면에서 우선 사용한다. 확인된 서비스·주소·연락·공식 채널·가격만 표시하고 출장·예약·취소·업체 사진은 만들지 않는다. 후보/정보 확인 전/관측/NAVER API는 고객 화면에 0건이다.
구현 범위: 목록 고객 문구·간소 검색/서비스/지역/가격 정보 필터·5개 카드·하단 준비 도구, 상세 고객 히어로·업체 정보·상품 및 가격·이용 전 확인·위치 및 공식 채널·접이식 문의 질문 복사·최하단 정정/소유권 링크
구현하지 않을 범위: 운영 DB·신규 API·지도 iframe·예약 가능일 필터·출장 필터·업체 이미지 복제·문의/비교/저장/후기 활성
완료 조건: 목록/상세 5곳, 고객 내부 용어·20곳 수치·목록 운영자 CTA 0, 서비스/지역/가격 정보/검색 필터 정확, 유효 tel/공식 링크만 표시, 숫자 가격 2곳만 조건과 기준일 포함, 나머지 가격 문의, 390/768/1440 overflow 0·44px·키보드·noindex 유지
검증 방법: BE-034 필드와 DOM을 5곳 전수 대조하고 로컬 브라우저 다중 뷰포트와 clipboard 성공/실패를 확인한다.
실행할 테스트: node --check, BE-034 전용 검사, validate, build/test:dist, 브라우저 390/768/1440
위험요소: 메뉴 가격을 돌잔치 전체 가격으로 오인, 공통 대체 이미지를 실제 사례로 오인, 오래된 연락처
롤백 방법: 6개 제품 파일을 FE-037 상태로 복원하고 고객 profile script 로드만 제거한다.
사용자 승인 필요 여부: 격리 미리보기 구현은 현재 요청 범위. main·production은 별도 승인.
현재 상태: DONE (총괄 PM PASS, 고객형 5곳 목록·상세·검색/필터·전화/공식 채널·가격 조건·문의 문구 복사 구현, QA-052 PASS)
```

## BE-034

```text
작업 ID: BE-034
작업명: 첫 5곳 고객 공개 projection
담당 전문 에이전트: 백엔드·데이터
현재 문제: BE-033 공식 근거가 보고서에만 있어 고객 UI가 안전하게 소비할 구조화 계약이 없다.
사업적 목적: 공식 근거를 확보한 5곳만 서비스·연락·공식 채널·조건부 가격 중심의 고객 데이터로 제공한다.
근거 문서: BIZ-010, BE-033, FE-038, R-116·R-118·R-122
선행 작업: BIZ-010·BE-033·FE-038 PASS
수정 허용 경로: scripts/data/customer-provider-profiles.js, scripts/tests/customer-provider-profiles.mjs, ops/reports/BE-034-customer-provider-projection.md
수정 금지 경로: 기존 후보 원본·projection·제품 HTML/CSS/페이지 JS, DB·API·환경변수·package/lock, main·production
공유 계약: 정확히 5곳만 `customer_ready`; 공식 근거 범위의 서비스·연락처·공식 링크·조건부 가격만 포함한다. 출장 지역·예약 가능일·취소 조건·이미지 파일은 추정/복제하지 않는다.
구현 범위: 고객용 view model, 필드별 evidence·checkedAt, 권리 확인 전 공통 분야 이미지 힌트, exact allowlist·금지 문자열·URL·가격 조건·결측 자동 검사
구현하지 않을 범위: UI, 신규 웹/API 호출, 업체 연락, 이미지 다운로드, DB 적재·배포
완료 조건: 5곳, ID·주소 식별 일치, 서비스·전화·공식 채널 5/5, 가격 2/5만 숫자, 출장 0, 이미지 권리 오인 0, 내부 용어 고객 표시값 0, 결정론 PASS
검증 방법: BE-033 근거표와 projection을 필드별 대조하고 음성 변이 검사를 실행한다.
실행할 테스트: node --check, node scripts/tests/customer-provider-profiles.mjs
위험요소: 메뉴 가격을 돌잔치 패키지 가격으로 오인하거나 공식 갤러리를 소유 이미지로 복제할 위험
롤백 방법: 신규 3파일만 제거하고 기존 20곳 projection은 보존한다.
사용자 승인 필요 여부: 격리 고객 projection 생성은 현재 요청 범위. 운영 DB·production은 별도 승인.
현재 상태: DONE (총괄 PM PASS, customer_ready 5·서비스/연락/공식 채널 5·가격 2·출장/복제 이미지 0·전용 검사 PASS)
```

## BIZ-010

```text
작업 ID: BIZ-010
작업명: 고객형 업체 정보 최소 공개 기준
담당 전문 에이전트: 사업·경영·서비스 기획
현재 문제: 이름·주소·검색 키워드만 있는 후보를 고객형 문구로 감싸도 실제 선택 가치가 부족하다.
사업적 목적: 고객이 업체를 비교·문의하기 전에 꼭 알아야 할 최소 정보를 정의하고 내부 검수 용어를 공개 화면에서 분리한다.
근거 문서: 사용자 요청 2026-08-14, D-51·D-53, R-116·R-118·R-121·R-122
선행 작업: BE-030·BE-032·FE-037 DONE
수정 허용 경로: ops/reports/BIZ-010-customer-provider-display-gate.md
수정 금지 경로: 제품 코드·데이터·DB·API·운영 문서·외부 게시
공유 계약: 확인되지 않은 제공 서비스·가격·출장·연락처·포트폴리오를 고객 사실처럼 표현하지 않는다.
구현 범위: 목록/상세 최소 공개 필드, 5곳 우선 공개 기준, 결측 처리, 고객 문구, 운영자 링크 위치 기준
구현하지 않을 범위: 제품 구현, 실제 업체 검증·연락, 가격 생성, DB·배포
완료 조건: 공개/보류/결측 표현을 필드별로 정의하고 5곳 승격 조건과 완료 판단표를 제시한다.
검증 방법: 사용자 요구 9개 구역과 기존 위험·결정 기록을 대조한다.
실행할 테스트: 정책 문구 상호모순·미확정 사실·내부 용어 노출 검사
위험요소: 내부 용어를 모두 제거해 검증되지 않은 정보가 확정 사실로 보일 수 있음
롤백 방법: 신규 보고서만 제거한다.
사용자 승인 필요 여부: 읽기 전용 설계는 불필요. 실제 업체 연락·production은 별도 승인.
현재 상태: DONE (총괄 PM PASS, 고객형 최소 공개 게이트·최대 5곳·결측·필터 활성 조건 확정)
```

## BE-033

```text
작업 ID: BE-033
작업명: 첫 5곳 고객 정보 보강 가능성 감사
담당 전문 에이전트: 백엔드·데이터
현재 문제: 후보 20곳 중 고객이 필요로 하는 서비스·가격·출장·연락처·포트폴리오 근거가 공개 projection에 없다.
사업적 목적: 공식 온라인 근거만으로 고객에게 유용하게 보여줄 수 있는 업체 5곳과 필드를 식별한다.
근거 문서: 사용자 요청 2026-08-14, BE-030·BE-032, R-116~R-122
선행 작업: BE-030·BE-032 DONE, BIZ-010과 정책 계약 공유
수정 허용 경로: ops/reports/BE-033-first-five-enrichment-audit.md
수정 금지 경로: 원본 JSON/XLSX·projection·제품·DB·API 키·환경변수·운영 문서·외부 게시
공유 계약: 기존 NAVER 결과는 발견 단서로만 사용하고, 공개 가능 필드는 공식 홈페이지·업체 운영 채널의 직접 근거·확인일·URL을 함께 기록한다. 추정과 블로그 후기 원문은 공개 데이터로 승격하지 않는다.
구현 범위: 20곳의 기존 링크를 감사하고 최대 5곳의 서비스·가격·지역·연락·포트폴리오 중 확보 가능한 항목과 출처를 표로 제시한다.
구현하지 않을 범위: 신규 DB 저장, 업체 연락, 로그인·폼 제출, 이미지 복제, 운영 배포
완료 조건: 최대 5곳 각각 업체 식별 근거와 최소 2개 유용 정보 필드, 출처 URL·확인일·결측·오인 위험을 기록한다. 조건 미달 업체는 승격하지 않는다.
검증 방법: 기존 후보 ID·이름·주소 대조, 공식 도메인/운영 채널과 공개 문구의 직접 근거 확인
실행할 테스트: 동명이업체·주소 불일치·오래된 가격·비공식 채널·전화번호 오류 음성 검사
위험요소: 공식처럼 보이는 제3자 채널 오인, 오래된 가격·연락처 공개
롤백 방법: 신규 보고서만 제거한다.
사용자 승인 필요 여부: 공개 웹 읽기·기존 파일 감사는 불필요. 업체 연락·운영 DB·production은 별도 승인.
현재 상태: DONE (총괄 PM PASS, 공식 근거 보강 가능 5곳·서비스/연락/포트폴리오 5·가격 2·출장 0)
```

## FE-038

```text
작업 ID: FE-038
작업명: 고객형 업체 목록·상세 재구성 설계
담당 전문 에이전트: 디자인·프런트엔드
현재 문제: 현재 후보 UI가 내부 데이터 상태와 경고를 중심으로 구성돼 고객이 업체 차이를 파악하기 어렵다.
사업적 목적: 서비스·지역·가격·공식 채널을 중심으로 업체를 탐색하고 상세를 이해하는 고객 흐름을 만든다.
근거 문서: 사용자 요청 2026-08-14, FE-036·FE-037, BIZ-010·BE-033 계약 예정
선행 작업: FE-037 DONE, 구현은 BIZ-010·BE-033 PASS 뒤 시작
수정 허용 경로: ops/reports/FE-038-customer-provider-ux-spec.md
수정 금지 경로: 모든 제품 코드·데이터·DB·공통 디자인·운영 문서·배포
공유 계약: 실제 확보 필드만 표시하고 가격·출장·연락·포트폴리오 필터는 근거 데이터가 있을 때만 활성화한다.
구현 범위: 목록 상단·안내·검색·필터·카드, 상세 4개 영역, 접이식 문의 체크리스트, 운영자 링크 배치의 DOM/반응형 명세와 정확한 파일 소유권 제시
구현하지 않을 범위: 제품 구현, 데이터 생성, 신규 라우팅·API·DB·공통 토큰 변경
완료 조건: 390/768/1440 레이아웃, 빈/결측 상태, CTA 우선순위, 접근성, 데이터 의존성을 구현 가능한 수준으로 정의한다.
검증 방법: 현재 HTML/JS/CSS와 사용자 요구 9개 구역을 일대일 대조한다.
실행할 테스트: 필드-컴포넌트 매핑, 44px, 키보드, 필터 라벨, 모바일 overflow 사전 점검
위험요소: 데이터 없는 필터와 CTA를 먼저 만들어 작동하는 기능처럼 보일 수 있음
롤백 방법: 신규 보고서만 제거한다.
사용자 승인 필요 여부: 읽기 전용 설계는 불필요. 제품 구현·production은 별도 카드/승인 적용.
현재 상태: DONE (총괄 PM PASS, 목록·상세 고객형 DOM·필드 의존성·반응형·후속 파일 소유권 확정)
```

## FE-037

```text
작업 ID: FE-037
작업명: 후보 상세 보조 출처 영역 삭제
담당 전문 에이전트: 총괄 PM·디자인/프런트엔드
현재 문제: 후보 상세 하단의 NAVER 보조 출처 섹션이 손품해방 내부 정보 확인 흐름을 방해한다.
사업적 목적: 사용자가 외부 검색으로 이탈하지 않고 손품해방 내부의 후보 정보와 확인 질문에 집중하게 한다.
근거 문서: 사용자 브라우저 피드백 2026-08-14, D-53, FE-036, QA-051
선행 작업: FE-036·QA-051·OPS-037 DONE
수정 허용 경로: provider.html, scripts/pages/provider.js, styles/pages/provider.css, scripts/tests/unverified-provider-public-safety.mjs, FE-037 관련 운영 문서·격리 draft 산출물
수정 금지 경로: 후보 원본·projection, DB·Supabase·migration·API·환경변수·package/lock, GitHub main·Netlify production
공유 계약: 목록·현재 관측 정보·관련 준비 주제·미확인 정보·문의 체크리스트·수정 제안·소유권 신청은 유지한다. 후보 상세의 보조 출처 섹션과 외부 NAVER 링크만 제거한다.
구현 범위: 선택된 섹션의 HTML·렌더링·전용 CSS를 제거하고 안전 검사를 외부 출처 UI 부재 계약으로 갱신한다.
구현하지 않을 범위: 후보 데이터 변경, 가격·전화·평점·후기·문의·비교 추가, 운영 배포·DB 적재
완료 조건: 후보 상세에서 보조 출처 제목·설명·사실표·NAVER 버튼 0, 나머지 내부 정보와 noindex 유지, build/dist·전용 안전 검사·온라인 다중 화면 검수 PASS
검증 방법: 정적 문자열·DOM 계약 검사, build/dist, 고유 noindex draft의 390/768/1440 브라우저 확인
실행할 테스트: node scripts/tests/unverified-provider-public-safety.mjs, npm run build, npm run test:dist, 브라우저 회귀
위험요소: 출처 provenance가 화면에서 사라지지만 내부 정정 계약과 비공개 projection에는 계속 보존된다.
롤백 방법: FE-036의 보조 출처 섹션·렌더링·CSS·검사 계약을 복원한다.
사용자 승인 필요 여부: 사용자가 선택 영역 삭제를 직접 요청해 승인 완료. production은 별도 승인.
현재 상태: DONE (총괄 PM PASS, 보조 출처 섹션·NAVER 버튼 0, 내부 정보·noindex 유지, 자동 검사·build/dist·390/768/1440 온라인 회귀 PASS)
```

## OPS-023

```text
작업 ID: OPS-023
작업명: D-31 격리 Supabase 환경 준비
담당 전문 에이전트: 총괄 PM
현재 문제: Docker·Supabase CLI·로컬 config가 없고 Supabase 브라우저도 로그아웃 상태라 운영 DB를 피한 실제 E2E 환경이 없다.
사업적 목적: 실제 고객·업체·운영 DB에 영향을 주지 않고 역할·문의·업체 등록의 출시 차단 결함을 확인한다.
근거 문서: D-31, OPS-012, QA-018, admin-schema.sql, migrations/001~005, Supabase 공식 로컬 개발·branch 비용 문서
선행 작업: D-31 사용자 승인 완료
후속 작업: QA-020 → QA-003 → 필요 시 단일 소유 보안 수정 카드
수정 허용 경로: ops/reports/OPS-023-d31-isolated-environment-plan.md, ops/handoffs/OPS-023.md, D-31 관련 PM 운영 문서, 새 무료 격리 Supabase 프로젝트
수정 금지 경로: 운영 Supabase·실제 개인정보·제품 코드·운영 DB·유료 branch·외부 알림·GitHub main·production·CHG-A~C
공유 계약: 합성 계정·업체·문의만 사용하고 비용 0·외부 전송 0·운영 project ref 비접촉을 fail-closed로 확인한다.
구현 범위: 환경 선택, 비용 gate, Auth/SMTP/webhook 차단, schema 적용 순서, 합성 manifest, 삭제 절차
구현하지 않을 범위: 운영 DB 적용, 제품 코드 수정, 실제 이메일·업체 연락, 비용, 도메인, 배포
완료 조건: 무료 격리 project와 합성 manifest가 준비되고 QA-020 실행 가능
검증 방법: project ref·요금·Auth·외부 integration·schema·test manifest 대조
실행할 테스트: 운영 ref 불일치, example.invalid only, sender/webhook 0, cleanup dry-run
위험요소: 운영 프로젝트 오선택, 비용 발생, 합성값이 실제 주소로 발송되는 위험
롤백 방법: 테스트 데이터를 삭제하고 project는 별도 승인 시 삭제. 운영 상태는 변경하지 않는다.
사용자 승인 필요 여부: D-31 승인 완료. Supabase 로그인만 사용자 수행 필요. 비용 발생 시 별도 승인
권장 브랜치명: ops/OPS-023-d31-isolated-environment
현재 상태: DONE (무료 격리 프로젝트·합성 manifest 준비, QA-020 인계 완료)
```

## BE-032

```text
작업 ID: BE-032
작업명: 후보 20곳 내부 정보 projection
담당 전문 에이전트: 백엔드·데이터
현재 문제: BE-031은 이름·주소·분야만 공개해 사용자가 다시 NAVER 검색 결과로 이동해야 정보를 이해할 수 있다.
사업적 목적: 확인되지 않은 사실을 만들지 않으면서 손품해방 안에서 후보의 성격과 확인할 내용을 이해하게 한다.
근거 문서: D-50, D-51, D-53, BE-030, BE-031, QA-050, R-123, R-124
선행 작업: BE-031·FE-035·QA-050·OPS-036 DONE
수정 허용 경로: scripts/data/unverified-provider-candidates.js, scripts/data/unverified-provider-denylist.js, scripts/tests/unverified-provider-projection.mjs, ops/reports/BE-032-unverified-provider-insights.md
수정 금지 경로: 그 외 제품 코드, BE-030 원본 JSON/XLSX, DB·Supabase·migration·API·환경변수·package/lock, main·production
공유 계약: 정확히 기존 20곳만 사용한다. 검색 당시 세부 업종·구/동·관련 준비 주제는 `observed` 값이며 제공 서비스·후기·추천·검증값이 아니다. 전화·가격·좌표·블로그 원문/링크/수·평점·추천은 0이다.
구현 범위: 기존 projection에 district, neighborhood, sourceCategory, observedTopics와 후보별 숨김용 denylist gate를 추가하고 exact allowlist·금지값·중복·결정론 검사를 보완한다.
구현하지 않을 범위: 신규 API 호출, 새 업체 추가, 실제 제공 서비스 추정, 공식 홈페이지 판정, 연락·DB 적재·배포
완료 조건: 20곳·5분야, 모든 주소 구조화, sourceCategory 20, observedTopics는 허용 어휘만 사용, 금지정보 0, denylist 1곳 주입 시 19곳·상세 fail-closed 계약을 자동 검증한다.
검증 방법: 원본과 projection ID·주소·업종·주제를 대조하고 변이 음성 테스트를 실행한다.
실행할 테스트: node --check, projection 전용 테스트, 금지 키/값·비밀 패턴·결정론 검사
위험요소: 관측 업종·주제의 사실 오인, 원본 금지 필드 유출
롤백 방법: BE-031 13필드 projection으로 복원하고 신규 denylist·보고서·검사 구간을 제거한다.
사용자 승인 필요 여부: D-53 승인 완료. 운영 DB·production은 별도 승인.
현재 상태: DONE (총괄 PM PASS, exact 17필드·기본20/숨김19/복구20·금지정보 0)
```

## FE-036

```text
작업 ID: FE-036
작업명: 후보 내부 정보 중심 목록·상세 UI
담당 전문 에이전트: 디자인·프런트엔드
현재 문제: 후보 카드와 상세의 핵심 행동이 외부 NAVER 검색 확인이라 손품해방 자체 정보 가치가 부족하다.
사업적 목적: 사용자가 사이트 안에서 업체 유형·지역·관측 주제와 다음 확인 질문을 이해하게 한다.
근거 문서: D-53, BE-032, FE-035, QA-050, R-123
선행 작업: BE-032 PASS
수정 허용 경로: venues.html, provider.html, claim.html의 후보 데이터 script 순서, scripts/pages/venues.js, scripts/pages/provider.js, styles/pages/venues.css, styles/pages/provider.css, ops/reports/FE-036-candidate-insight-ui.md
수정 금지 경로: 데이터 원본·projection, contact/claim 저장 계약, 공통 CSS/JS, API·DB·Supabase·migration·환경변수·package/lock, main·production
공유 계약: 외부 검색 링크는 출처 보조 링크일 뿐 주요 CTA가 아니다. 관측값과 확인 필요값을 분리하고 일반 업체의 가격·후기·문의·비교 renderer로 진입하지 않는다.
구현 범위: 목록에 세부 업종·지역·관측 주제를 표시하고 상세에 확인된 관측 정보, 관련 준비 주제, 아직 확인할 정보, 분야별 문의 체크리스트를 제공한다.
구현하지 않을 범위: 가격·전화·평점·후기·추천·실제 행사 제공 주장, 폼 제출 변경, 신규 라우팅·공통 디자인 시스템 변경
완료 조건: 20개 카드·상세 20개가 내부 정보 우선, 외부 링크는 보조, 금지 CTA 0, 390/768/1440 overflow 0·키보드/44px·noindex 유지.
검증 방법: 정적 검사, build/dist, 목록→상세→정정→소유권 흐름과 다중 viewport 브라우저 검증
실행할 테스트: node --check, npm build/test:dist, 전용 후보 안전 검사
위험요소: 관측 키워드를 실제 서비스로 오인, 모바일 카드 과밀
롤백 방법: FE-035 후보 UI로 복원한다.
사용자 승인 필요 여부: D-53 승인 완료. production은 별도 승인.
현재 상태: DONE (총괄 PM PASS, 후보 카드 20·내부 상세 20·목록 외부 링크 0·build/dist·3 viewport PASS)
```

## QA-051

```text
작업 ID: QA-051
작업명: 후보 내부 정보 공개 안전 게이트
담당 전문 에이전트: 품질·보안
현재 문제: 공개 필드와 화면이 늘어 오인·금지정보 노출·일반 기능 진입 위험이 커진다.
사업적 목적: 유용성 확대가 데이터 신뢰와 개인정보·색인 안전을 훼손하지 않게 한다.
근거 문서: D-53, BE-032, FE-036, QA-050, R-123, R-124
선행 작업: BE-032·FE-036 PASS
수정 허용 경로: scripts/tests/unverified-provider-public-safety.mjs, ops/reports/QA-051-candidate-insight-safety.md
수정 금지 경로: 모든 제품·데이터 원본·API·DB·설정·package/lock·main·production
공유 계약: 금지 필드 0, 후보 일반 renderer/API/Auth/문의/후기/비교 진입 0, noindex 유지, denylist fail-closed.
구현 범위: schema 변이, 오인 문구, 20개 DOM 행렬, network spy, JS-off/SEO, 정정·소유권, 20→19→20 hide drill, 3 viewport를 검증한다.
구현하지 않을 범위: 제품 수정, 실제 제출·로그인·운영 DB·배포
완료 조건: 전용 자동 검사·build/dist·브라우저 모두 PASS이고 신규 P0/P1 결함 0.
검증 방법: 자동·정적·브라우저 독립 검수
실행할 테스트: projection/public safety, validate, build, test:dist, 390/768/1440
위험요소: 기존 테스트 부채와 신규 회귀 혼동
롤백 방법: 검사·보고서만 제거하며 제품은 수정하지 않는다.
사용자 승인 필요 여부: 불필요. 읽기 전용 검수.
현재 상태: DONE (Revision 1 PASS, 신규 P0/P1 0, exact17·denylist·noindex·build/dist·3 viewport PASS)
```

## OPS-037

```text
작업 ID: OPS-037
작업명: 후보 내부 정보 고유 noindex 온라인 draft
담당 전문 에이전트: 총괄 PM·품질
현재 문제: D-53 결과를 사용자가 손품해방 화면에서 확인할 새 온라인 주소가 필요하다.
사업적 목적: production 영향 없이 내부 정보 중심 경험을 실제 화면으로 검토한다.
근거 문서: D-53, BE-032, FE-036, QA-051
선행 작업: QA-051 PASS
수정 허용 경로: dist/** 재생성, ops/reports/OPS-037-candidate-insight-online-draft.md, 관련 운영 문서
수정 금지 경로: 제품 원본 추가 수정, 운영 DB·Supabase, GitHub main·PR·병합, Netlify production, 실제 폼 제출·로그인
공유 계약: 고유 deploy draft와 전역 noindex,nofollow만 사용하고 기존 production deploy ID·URL을 보존한다.
구현 범위: build 후 고유 draft 업로드, HTTP/noindex/asset과 목록·상세·정정·소유권·3 viewport 재검수
구현하지 않을 범위: production·정식 색인·운영 DB·업체 연락
완료 조건: 고유 HTTPS draft 1개, 후보 20, 내부 정보·확인 체크리스트 정상, 금지정보 0, production/main/DB 불변
검증 방법: 업로드 전 QA-051 재실행, 업로드 후 HTTP·브라우저 검사
실행할 테스트: validate/build/test:dist/public safety, HTTP smoke, 390/768/1440
위험요소: noindex draft도 URL을 아는 사람이 접근 가능
롤백 방법: draft 공유 중단·삭제, 기존 OPS-036 주소 유지
사용자 승인 필요 여부: D-53의 손품해방 내부 표시 요청을 동일 고유 noindex draft 수정 승인으로 적용. production은 별도 승인.
현재 상태: DONE (총괄 PM PASS, draft `6a7d7aae781e2cd718ec9fbc`, HTTP·3 viewport·production 불변 PASS)
```

## QA-020

```text
작업 ID: QA-020
작업명: Supabase Auth URL·역할 격리 준비 검증
담당 전문 에이전트: quality-security
현재 문제: Site URL·redirect·역할 계정·외부 알림 차단이 운영과 분리됐는지 검증되지 않았다.
사업적 목적: QA-003이 운영 데이터 없이 실제 권한 흐름을 검증할 안전 전제조건을 만든다.
근거 문서: D-31, OPS-012, OPS-023, QA-018, R-40·R-58·R-60
선행 작업: OPS-023 무료 격리 project
후속 작업: QA-003
수정 허용 경로: ops/reports/QA-020-supabase-auth-isolation.md, 격리 Supabase의 Auth URL·합성 계정·테스트 설정
수정 금지 경로: 운영 Supabase·실제 이메일·제품 코드·원본 SQL·production·비용·외부 발송
공유 계약: example.invalid 합성 계정, 운영 ref 0, 외부 알림 0, 역할별 최소권한
구현 범위: Site URL·redirect, account role 준비, 토큰·행 기본 격리, 외부 SMTP·전화 provider·Edge Function·Webhook·pg_cron·외부 secret 0건 확인, cleanup 준비
구현하지 않을 범위: 제품 수정, 운영 Auth 설정, 실제 이메일 확인, 도메인 확정
완료 조건: 역할 계정과 격리 설정이 QA-003에 인계 가능
검증 방법: project ref·Auth 설정·role row·외부 integration·삭제 절차 대조
실행할 테스트: anonymous/customer A·B/provider A·B/operations/content/admin/owner/delete-user 기본 allow/deny, project ref 불일치, 외부 egress·sender·webhook 0
위험요소: 운영 키 혼입, 외부 메일 발송, 과권한 role
롤백 방법: 합성 계정·role row 삭제
사용자 승인 필요 여부: D-31 승인 완료
권장 브랜치명: qa/QA-020-supabase-auth-isolation
현재 상태: DONE (격리 Auth·역할·외부 알림 0 preflight PASS)
```

## QA-003

```text
작업 ID: QA-003
작업명: 스테이징 Auth·RLS·RPC·Storage·업체·문의 E2E
담당 전문 에이전트: quality-security
현재 문제: 공개·비로그인 화면은 검수했지만 실제 역할별 허용·거부와 업체 신청·문의 상태 전이는 미검증이다.
사업적 목적: 개인정보·업체 정보·문의가 다른 역할이나 업체로 노출되는 출시 차단 사고를 막는다.
근거 문서: D-31, QA-020, OPS-008, QA-013, QA-015, BE-006, QA-018
선행 작업: OPS-023·QA-020 PASS
후속 작업: 결함별 단일 소유 수정 → 같은 범위 재검수, PASS 후 MKT-010/D-30 판단
수정 허용 경로: ops/reports/QA-003-staging-auth-rls-e2e.md, 격리 Supabase의 합성 데이터·테스트 로그
수정 금지 경로: 운영 Supabase·실제 개인정보·제품 코드·원본 SQL·GitHub main·production·외부 연락
공유 계약: T5만 공개·비교, T6만 문의, 업체는 자기 정보만, content는 민감정보 접근 금지, 운영 역할 최소권한
구현 범위: Auth·RLS·RPC·Storage allow/deny, IDOR, 등록·claim·수정·승인·문의·응답·실패·삭제, 공개 projection의 내부 UUID 비노출, maintenance·response metrics RPC 최소권한, provider recipient 열 제한, 검수 전 업체 수정 비공개, 탈퇴·파기 잔존 확인
구현하지 않을 범위: 결함 수정, 운영 migration, 실제 알림, 업체 연락, 배포
완료 조건: 역할·행·파일·상태 전이의 허용/거부가 재현되고 cleanup 잔존 0. HTTP 성공처럼 보이는 RLS 0행도 DB 불변을 함께 확인한다. DB에서 승인한 업체와 브라우저의 정적 `data.js` projection이 단절되면 PASS하지 않는다.
검증 방법: 브라우저와 REST/RPC/Storage 응답, SQL 상태, audit/notification queue 대조
실행할 테스트: handoff의 전체 역할·업체·문의·Storage 시나리오, provider A/B 교차 접근, customer A/B 교차 접근, 미소유 업체 문의 실패 표시, 등록·소유권 승인과 응답 저장의 부분 실패, 동의·필수 입력, operations UI/RLS 범위 불일치
위험요소: 과권한 RPC, RLS 우회, signed URL IDOR, 선택 외 문의 전달, 실패 성공 오표시
롤백 방법: 합성 데이터·계정 삭제. 운영 상태는 변경하지 않는다.
사용자 승인 필요 여부: D-31 승인 완료
권장 브랜치명: qa/QA-003-staging-auth-rls-e2e
현재 상태: DONE (QA-040까지 격리 역할·RLS·RPC·Storage·Auth 삭제 최종 PASS, 운영 미적용)
```

## BE-014

```text
작업 ID: BE-014
작업명: D-31 권한·RPC·Storage 최소권한 보안 수정
담당 전문 에이전트: backend-data
현재 문제: QA-003에서 일반 회원 maintenance, anon 지표 재계산, 문의 RLS 무한 재귀, content 증빙 열람, 동의 없는 접수, 미검수 업체 직접 공개 수정이 재현됐다.
사업적 목적: 실제 고객·업체 데이터를 받기 전에 과권한과 개인정보 노출 경로를 fail-closed로 차단한다.
근거 문서: D-31, QA-003, QA-015, BE-006, R-70~R-81
선행 작업: OPS-023·QA-020 PASS, QA-003 1차 재현
후속 작업: BE-015 → QA-003 수정 2차
수정 허용 경로: migrations/006_d31_security_baseline.sql, scripts/tests/d31-security-migration.mjs, 전용 보고서·handoff, 격리 Supabase
수정 금지 경로: admin-schema.sql, migrations 001~005, 제품 UI, 운영 DB, 실제 데이터, CHG-A~C, main, production
공유 계약: additive·멱등 migration, 운영 미적용, 합성 데이터만, 외부 전송 0
구현 범위: RPC ACL, inquiry RLS 재귀 제거, recipient 직접 UPDATE 차단, evidence role 경계, 서버 동의 검증, 공개 safe view, 탈퇴 요청 비식별화
구현하지 않을 범위: 업체 수정 요청 UI·승인 workflow, 정적 data.js 연결, Auth 최종 삭제 worker, 견적 v2
완료 조건: 격리 환경 최초·재실행 성공, 핵심 expected allow/deny 통과, 기존 migration 무수정
검증 방법: SQL role/JWT E2E, 공개 view 열 검사, 정적 migration contract
실행할 테스트: maintenance·metrics·customer/provider 교차·evidence·consent·public view·logical deletion
위험요소: 운영 적용 오인, 기존 UI payload와 새 서버 동의 계약 불일치
롤백 방법: 격리 프로젝트 폐기 또는 006 적용 전 프로젝트 재생성. 운영에는 적용하지 않는다.
사용자 승인 필요 여부: D-31 격리 구현 승인 범위. 운영 적용·병합은 별도 승인
권장 브랜치명: codex/be-014-d31-security
현재 상태: DONE (총괄 PM PASS, commit d144922, 로컬 격리 branch·운영 미적용)
```

## BE-015

```text
작업 ID: BE-015
작업명: 업체 등록·수정 요청·관리자 검수 원자성 백엔드
담당 전문 에이전트: backend-data
현재 문제: 관리자 화면이 등록 승인과 업체 공개를 여러 REST 요청으로 나눠 처리하고, 업체 직접 수정의 안전한 대기·승인 경로가 없다.
사업적 목적: 업체가 제출한 정보가 관리자 승인 전 공개되지 않고, 승인·반려·업체 소유권 부여가 한 번에 성공하거나 전부 실패하게 한다.
근거 문서: QA-003, BE-014, BE-006, OPS-008, D-17, R-74·R-77~R-79
선행 작업: BE-014 DONE
후속 작업: FE-019 브라우저 adapter·관리자 UI → QA-003 수정 2차
수정 허용 경로: migrations/007_provider_review_projection_flow.sql, scripts/tests/provider-review-projection-migration.mjs, ops/reports/BE-015-provider-review-projection.md
수정 금지 경로: 기존 migration, 제품 HTML·JS·CSS, 운영 DB, 실제 업체·고객·증빙, CHG-A~C, main, production
공유 계약: additive·멱등, 업체 등록/수정 request와 public provider 분리, 검수 RPC 원자성, 내부 UUID 공개 금지
구현 범위: provider change request, 등록 승인/반려 RPC, 수정 승인/반려 RPC, provider 응답 저장 RPC, 감사 이벤트, 안전 projection
구현하지 않을 범위: 브라우저 UI 연결, 운영 적용, 실제 업체 접수, 견적 v2, Auth 삭제 worker
완료 조건: 격리 환경 최초·재실행 성공, provider·operations·content/customer 역할 allow/deny, 승인 전 public 불변, 승인 후 단일 변경, 실패 rollback
검증 방법: 합성 등록·수정·응답 SQL E2E와 정적 migration contract
실행할 테스트: 중복 심사, 타 업체 요청, content 승인, 미소유 recipient 응답, 승인 전/후 view, 실패 주입
위험요소: legacy 관리자 화면이 새 RPC를 사용하지 않아 기존 부분 성공 경로가 남음
롤백 방법: 격리 프로젝트 폐기 또는 새 007 객체 제거. 운영에는 적용하지 않는다.
사용자 승인 필요 여부: D-31 격리 구현 범위. 운영 적용·제품 연결·병합은 별도 승인
권장 브랜치명: codex/be-015-provider-review-projection
현재 상태: DONE (총괄 PM PASS, commit b16ecd8, 격리 적용·멱등·원자성 E2E PASS, 운영 미적용)
```

## FE-019

```text
작업 ID: FE-019
작업명: 업체 등록 심사·문의 동의 client 계약 연결
담당 전문 에이전트: frontend-design
현재 문제: 관리자 등록 승인이 여러 REST 쓰기로 분리되고, 문의 UI의 동의가 서버 payload에 전달되지 않는다.
사업적 목적: 승인·공개 부분 성공과 동의 없는 문의 저장을 브라우저 경로에서도 막는다.
근거 문서: BE-014, BE-015, QA-003, R-78·R-79
선행 작업: BE-015 DONE
후속 작업: FE-020 → QA-003 수정 2차
수정 허용 경로: scripts/core/inquiry-flow.js, scripts/pages/admin/providers.js, scripts/tests/provider-review-client.mjs
수정 금지 경로: CHG-A~C, 업체 목록·상세, migration, 환경변수, 패키지, main, production
공유 계약: inquiry-contact-v1, atomic provider registration review RPC
구현 범위: 문의 동의 payload, 관리자 등록 승인·반려 RPC, 분할 REST 쓰기 제거
구현하지 않을 범위: 목록·상세 DB 연결, 업체 수정 UI, 배포
완료 조건: 전용 계약·정적 검사 PASS, 허용 3개 외 변경 0
검증 방법: 정적 함수 범위·RPC 이름·동의 값 대조
실행할 테스트: provider-review-client.mjs, validate.mjs
위험요소: migration 미적용 환경에서는 새 RPC가 없어 관리자 승인이 실패함
롤백 방법: local branch 폐기. 운영 미배포
사용자 승인 필요 여부: 운영 적용·병합·배포 별도 승인
권장 브랜치명: codex/fe-019-provider-review-client
현재 상태: DONE (총괄 PM PASS, commit 8096618, 운영 미배포)
```

## FE-020

```text
작업 ID: FE-020
작업명: 공개 업체 safe view·수정 요청 UI 연결
담당 전문 에이전트: frontend-design
현재 문제: 브라우저 업체 목록·상세는 정적 data.js를 읽고 provider/venues 파일은 CHG-B 미할당 변경과 겹친다.
사업적 목적: 관리자 승인 업체가 고객에게 보이고 업체 수정은 검수 전 공개되지 않게 한다.
근거 문서: QA-003, BE-015, FE-019, CHG-B
선행 작업: CHG-B exact 소유권 D-41 승인 완료
후속 작업: QA-003 수정 2차
수정 허용 경로: provider.html, scripts/pages/provider.js, scripts/pages/venues.js, scripts/tests/provider-public-adapter.mjs
수정 금지 경로: 승인 전 CHG-B, CHG-A·C, 공통 설정·패키지, 운영 DB, main, production
공유 계약: public safe view 우선, static fallback 명시, 내부 UUID 0, pending 수정 비공개
구현 범위: 목록·상세 DB adapter, 수정 요청 UI, 빈/오류 상태
구현하지 않을 범위: 디자인 전면 재작성, 견적 v2, 운영 배포
완료 조건: 승인 업체 목록·상세 노출, 수정 승인 전 public 불변, 교차 접근 거부
검증 방법: 격리 Supabase 브라우저·REST·SQL 대조
실행할 테스트: 390·768·1440px 목록·상세·수정 요청·IDOR
위험요소: CHG-B 기존 사용자 변경 혼입·회귀
롤백 방법: 별도 branch 폐기, primary dirty worktree 불변
사용자 승인 필요 여부: D-41 승인 완료. main·운영 DB·production은 별도 승인 필요
권장 브랜치명: codex/fe-020-public-provider-adapter
현재 상태: DONE (총괄 PM PASS, commit aa8d491, 운영 미배포)
```

## BE-020

```text
작업 ID: BE-020
작업명: 자체 후기 제출 최소권한 RPC
담당 전문 에이전트: backend-data
현재 문제: BE-014가 후기 base table client 권한을 차단했지만 상세 후기 작성은 table upsert를 사용해 실패한다.
사업적 목적: 자체 후기를 검수 대기로 안전하게 접수하고 초기 신뢰 데이터를 축적한다.
근거 문서: QA-003 수정 2차, BE-014, FE-020
선행 작업: FE-020 DONE
후속 작업: FE-021 → QA-035 완료, FE-022·BE-021·BE-022·QA-036
수정 허용 경로: migrations/008_review_submission_flow.sql, scripts/tests/review-submission-migration.mjs
수정 금지 경로: CHG-A~C, 기존 migration, 제품 UI, 운영 DB, main, production
공유 계약: 로그인 사용자, 공개 업체만 대상, 1~5점, 10~3000자, 본인 UUID 서버 주입, pending 고정, 검수는 operations 이상
구현 범위: 후기 제출 RPC·운영자 pending 목록·승인/숨김 RPC·입력 검증·grant/revoke·멱등 정적 검사
구현하지 않을 범위: 후기 카드 디자인, 예약 확인 후기, 포인트, 운영 적용
완료 조건: direct table 쓰기 없이 pending 후기 생성·검수 계약, 익명·미공개 업체·잘못된 입력·비운영자 검수 거부
검증 방법: migration 정적 검사와 격리 역할 E2E
실행할 테스트: review-submission-migration.mjs, validate.mjs, migration 반복 적용
위험요소: client가 과거 upsert를 계속 사용하거나 RPC가 user_id/status를 입력에서 신뢰할 수 있음
롤백 방법: 별도 branch 폐기. 운영 미적용
사용자 승인 필요 여부: 로컬 격리 구현은 불필요. 운영 DB·main·배포 별도 승인
권장 브랜치명: codex/be-020-review-submission
현재 상태: DONE (QA-035 역할 E2E 13/13 PASS, commit d698488, 운영 미적용)
```

## FE-021

```text
작업 ID: FE-021
작업명: 자체 후기 제출 RPC client 연결
담당 전문 에이전트: frontend-design
현재 문제: provider 상세 후기 form이 권한이 제거된 taran_reviews base table을 upsert한다.
사업적 목적: 사용자가 자신의 후기를 실제로 검수 대기로 접수할 수 있게 한다.
근거 문서: BE-020, QA-003 수정 2차, FE-020
선행 작업: BE-020 완료
후속 작업: QA-035 완료, FE-022 최소 보정
수정 허용 경로: scripts/pages/provider.js, scripts/pages/admin/providers.js, scripts/tests/review-submission-client.mjs
수정 금지 경로: provider.html, venues.js, CHG-A~C, migration, 공통 설정, 운영 DB, main, production
공유 계약: taran_submit_review·taran_list_pending_reviews·taran_moderate_review, 로그인, pending은 서버 고정, 검수는 운영 역할만
구현 범위: 사용자·관리자 base table direct write/read 제거, 제출·목록·검수 RPC, 한국어 성공·거부·오류 상태
구현하지 않을 범위: 후기 카드 디자인, 예약 확인, 포인트
완료 조건: provider 후기 form과 관리자 후기 검수의 direct table 접근 0, 전용 RPC 연결, 기존 FE-020·FE-019 회귀 0
검증 방법: 정적 client 계약·로컬 합성 form 상태
실행할 테스트: review-submission-client.mjs, provider-public-adapter.mjs, validate.mjs
위험요소: BE-020 미적용 환경에서는 RPC가 없어 제출이 실패함
롤백 방법: 별도 branch 폐기. 운영 미배포
사용자 승인 필요 여부: 로컬 구현은 불필요. 운영 적용·병합·배포 별도 승인
권장 브랜치명: codex/fe-021-review-submission-client
현재 상태: REVISION_REQUIRED (commit ae12db2, direct table 접근 0; 성공 뒤 실패 오표시)
```

## QA-035

```text
작업 ID: QA-035
작업명: 격리 Auth·Storage·역할 브라우저 최종 E2E
담당 전문 에이전트: quality-security
현재 문제: QA-003의 DB 역할 검사는 보정됐지만 Storage API, Auth 최종 삭제, 등록·문의·응답·후기 브라우저 성공/거부가 남았다.
사업적 목적: 운영 적용 전에 실제 사용자 화면과 권한 경계를 함께 통과시킨다.
근거 문서: QA-003, BE-014·015·020, FE-019·020·021
선행 작업: BE-020·FE-021 완료, 격리 환경 사용 가능
후속 작업: FE-022·BE-021→BE-022→QA-036→QA-003 최종 판정
수정 허용 경로: ops/reports/QA-035-isolated-browser-security-e2e.md, QA-003 보고서 상태
수정 금지 경로: 제품 코드, 운영 DB, 실제 데이터, 외부 알림, main, production
공유 계약: example.invalid 합성 계정·업체·문의·증빙만 사용, 외부 발송 0
구현 범위: Storage signed URL/read/delete, 등록·문의·응답·후기, operations/content 메뉴와 REST, 탈퇴 즉시 비식별·Auth worker 준비 상태
구현하지 않을 범위: 운영 적용, 실제 회원 삭제, 외부 메일·문자, 배포
완료 조건: 역할별 allow/deny·UI 상태·DB 불변 근거와 QA-003 최종 판정
검증 방법: 격리 브라우저·REST·SQL 교차 확인
실행할 테스트: 390·768·1440px, Auth 역할 9개, Storage synthetic object, RPC allow/deny
위험요소: Auth 최종 삭제 worker 부재 또는 격리 환경 자격 증명 부족
롤백 방법: 합성 객체·계정만 격리 프로젝트 정리
사용자 승인 필요 여부: D-31 범위 안의 합성 검사는 승인 완료. 실제 계정·운영 환경은 별도 승인
권장 브랜치명: 해당 없음(격리 감사)
현재 상태: REVISION_REQUIRED (보고서 완료, 합성 잔존 0)
```

## QA-018

```text
작업 ID: QA-018
작업명: 공개·비로그인 전체 기능 및 권한 경계 회귀 점검
담당 전문 에이전트: quality-security
현재 문제: FE-014까지 홈과 핵심 화면별 검수는 통과했지만, 최신 고유 draft를 기준으로 로그인·관리자 비로그인 보호, 계산기·체크리스트·비교함·견적 문의·업체 등록의 전체 연결과 공개 페이지 전반을 하나의 기능 행렬로 확인한 결과가 없다. 실제 Supabase 역할별 쓰기 E2E는 운영 데이터 변경 위험 때문에 이번 점검과 분리해야 한다.
사업적 목적: 디자인 추가 수정 전에 사용자가 실제로 누르는 핵심 기능과 잘못 노출되면 안 되는 관리자·업체 기능의 경계를 확인해, 다음 개발 우선순위를 기능 오류와 출시 위험 기준으로 정한다.
근거 문서: 사용자의 2026-07-24 `2번부터 진행` 지시, AGENTS.md, docs/99_의사결정기록.md ADR-001·002·011·013·016, ops/PM_ORCHESTRATION.md, FE-014 결과 보고서
선행 작업: FE-014 DONE, 고유 noindex draft `6a62af9bb40288afb67fd7eb`
수정 허용 경로: ops/reports/QA-018-full-functional-audit.md
수정 금지 경로: 제품 코드 전체, admin/**, scripts/**, styles/**, assets/**, data 파일, package.json, pnpm-lock.yaml, netlify.toml, docs/**, 다른 ops 문서, API·DB·RLS·Storage·RPC·마이그레이션·환경변수, GitHub·Netlify 설정
공유 계약: 공개 행사 분류 5종, 전국 서비스 범위·서울 돌잔치 우선 검수, 최대 3곳 비교, 예약·결제 보류, NAVER 파생 후보 비공개, 미확정 가격·평점·업체 수 미표시를 유지한다. 실제 개인정보·문의·업체 신청·로그인 데이터는 제출하지 않는다.
구현 범위: 최신 고유 draft와 현재 소스·dist를 읽기 전용으로 점검한다. 홈 검색, 업체 찾기 빈 상태, 계산기, 체크리스트, 비교함, 견적 문의, 업체 등록 1~4단계, 준비백과 목록·상세, 로그인 입력 검증, 비로그인 관리자·회원·업체 화면 보호, 주요 내비게이션·푸터·404/리디렉션 상태를 확인한다. 390·768·1440px에서 주요 화면의 가로 넘침·깨진 이미지·콘솔 오류를 확인한다. 실제 인증·DB 쓰기가 필요한 항목은 실행하지 않고 재현 조건과 승인 필요성을 분리한다.
구현하지 않을 범위: 제품 코드 수정, 실제 로그인 성공, 테스트 회원·업체·문의 생성, 실제 양식 제출, 운영 DB 읽기·쓰기, 관리자 권한 변경, 증빙 업로드, 외부 연락, GitHub push·main 병합, production 배포, 디자인 재작업
완료 조건: 핵심 기능별 PASS·FAIL·BLOCKED와 재현 절차·URL·화면 크기가 기록된다. 공개·비로그인 범위의 주요 경로가 연결되고 개인정보나 관리자 기능이 무단 노출되지 않는지 판정한다. 실제 역할별 E2E가 필요한 항목은 필요한 계정·데이터·승인과 함께 별도 목록화한다. 정적 검사·빌드·dist 검사 결과와 CHG-A 기존 테스트 충돌을 구분한다. 발견 문제는 BACKLOG와 중복 여부·심각도·권장 후속 작업을 포함한다.
검증 방법: git 상태·금지 파일 무수정 확인, node 정적 검사·빌드·dist 검사, 브라우저 실제 클릭·입력 검증, HTTP 상태·noindex 헤더 확인, 결과 근거 스크린샷 또는 DOM 상태 기록
실행할 테스트: node scripts/tests/validate.mjs, node scripts/build/prepare-dist.mjs, node scripts/tests/validate-dist.mjs, 기존 pnpm test 결과 확인, 브라우저 기능 행렬
위험요소: Netlify draft에는 Supabase 설정이 있어 최종 제출을 누르면 실제 데이터 쓰기가 발생할 수 있다. 로그인 성공·관리자 역할·업체 제출·견적 문의는 자격 증명과 격리 테스트 데이터 없이 완전 검증할 수 없다. CHG-A의 과거 자동검사 계약은 현재 승인된 5종 행사·정보 나눔 정책과 충돌한다.
롤백 방법: 읽기 전용 점검이므로 제품·데이터 롤백 없음. 결과 보고서와 PM 운영 문서만 작업 전 상태로 되돌릴 수 있다.
사용자 승인 필요 여부: 공개·비로그인 읽기 전용 점검은 승인됨. 실제 로그인 성공, DB 쓰기, 문의·업체 신청 제출, 운영 권한 검증은 결과 확인 뒤 별도 승인 필요.
권장 브랜치명: 해당 없음(읽기 전용 감사)
현재 상태: DONE (보고서 사실관계 1차 보완 후 총괄 PM·독립 reviewer PASS, 공개 draft는 기존 OPS-007 차단 전 REVISION_REQUIRED)
```

## FE-014

```text
작업 ID: FE-014
작업명: 공개 전 핵심 흐름·신뢰·홈 시각 안정화
담당 전문 에이전트: frontend-design(읽기 전용 진단) + 총괄 PM 단일 쓰기 통합
현재 문제: FE-013 초안은 시각 완성도는 높지만 메인 사진이 호텔 연회장 광고처럼 보이고, 홈페이지가 길며 공개 업체 0건 상태의 행동 우선순위가 약하다. 업체 등록 단계 검증과 오류 안내가 충분하지 않고, 비용 계산기의 마지막 버튼은 결과가 이미 갱신된 상태에서 추가 피드백이 없어 무반응처럼 보인다. 일부 공개 화면에는 taran·무료 도구·준비 가이드·업체 입점 같은 과거 용어, 날짜·읽는 시간·푸터 링크 결합, 준비백과 초기 글 수 불일치가 남아 있다.
사업적 목적: 공개 업체가 아직 없는 초기 단계에서도 방문자가 서울 돌잔치 검수 상태를 정확히 이해하고 비용 계산기·체크리스트·준비백과를 바로 이용하게 한다. 업체 담당자에게는 실제 접수 가능 상태와 수집하지 않는 증빙을 먼저 알리고, 모든 화면에서 손품해방 브랜드와 메뉴명을 일관되게 제공한다.
근거 문서: 사용자의 2026-07-24 최신 수정 요청과 첨부 디자인 감사, FE-013 사용자 시각 피드백, ADR-001·ADR-016, QA-019 읽기 전용 진단
선행 작업: FE-013 DONE, 사용자 최신 수정 요청 승인
후속 작업: QA-020 핵심 흐름·다중 뷰포트 회귀, 고유 noindex 온라인 미리보기, 사용자 확인, GitHub·production 별도 승인
수정 허용 경로: assets/images/home-family-*.webp, index.html, styles/pages/home.css, scripts/pages/home.js, calculator.html, styles/pages/calculator.css, scripts/pages/calculator.js, checklist.html, styles/pages/checklist.css, compare.html, styles/pages/compare.css, provider-register.html, styles/pages/provider-register.css, scripts/pages/provider-register.js, venues.html, styles/pages/venues.css, articles.html, article.html, blog.js, styles/pages/articles.css, account.html, contact.html, guides.html, inquiry.html, login.html, privacy.html, provider-join.html, terms.html, styles/pages/member.css, ui.js, netlify.toml, ops/TASK_SPECS.md, ops/ACTIVE_WORK.md, ops/PROJECT_BOARD.md, ops/DEPENDENCIES.md, ops/RISKS.md, ops/handoffs/FE-014.md, ops/reports/FE-014-public-readiness-stabilization.md
수정 금지 경로: package.json, pnpm-lock.yaml, scripts/tests/**, _verify/**, provider.html, scripts/pages/provider.js, scripts/pages/venues.js, styles/components/filter.css, docs/**, favicon.ico, API·DB·RLS·마이그레이션·환경변수·업체·후기 원본 데이터, 운영 production과 GitHub main
공유 계약: 전국 가족행사 범위는 유지하되 검수·콘텐츠·업체 확보의 현재 우선순위는 서울 돌잔치로 표시한다. 기존 5종 행사 ID, URL 쿼리, 계산기·체크리스트 저장 키, 최대 3곳 비교 계약을 유지한다. 테스트 Netlify는 noindex이고 공식 도메인 canonical·대표 URL은 D-10 전 확정하지 않는다.
구현 범위: 메인 상단을 밝은 실제 가족 돌잔치 이미지와 분리된 검색 카드로 바꾸고 제목·높이·오버레이를 줄인다. 행사와 지역 탐색의 중복을 합쳐 홈 길이를 줄이고, 공개 업체 0건에서는 비용 계산기·체크리스트를 우선 행동으로 제공한다. 업체 등록은 현재 단계 필드만 활성화·검증하고 한국어 인라인 오류를 제공하며, 미연결 테스트 환경과 사업자 증빙 미수집 상태를 입력 전에 알린다. 계산 완료는 명시적 결과 상태·메시지·초점 이동으로 피드백한다. 공개 주요 화면의 브랜드·메뉴·준비백과 용어, 준비백과 글 수와 메타 간격, 푸터 구조를 통일한다. 기능 페이지 히어로는 260~360px 수준으로 축소하고 업체 찾기 빈 상태를 중앙 행동 카드로 정리한다. 테스트 호스트 전역 noindex 헤더를 적용한다.
구현하지 않을 범위: 공식 도메인 canonical·og:url 확정, /venues 대표 URL 301 결정, 운영 DB·Supabase 설정·RLS·Storage·RPC 변경, 실제 업체 신청·증빙 수집, 후기 없는 업체 공개 게이트 변경, 가짜 업체·평점·가격·회원 활동 생성, GitHub push·main 병합·production 전환
완료 조건: 업체 등록 1~4단계가 현재 단계 입력만으로 이동하고 잘못된 필드는 해당 입력 아래 한국어 오류를 표시한다. 미연결 환경에서 개인정보·증빙을 실제 접수한 것처럼 보이지 않는다. 계산 마지막 버튼 후 결과 완료 안내·초점 이동이 확인된다. 홈은 가족행사 이미지, 서울 돌잔치 검수 상태, 비용 계산·체크리스트 우선 행동, 짧아진 섹션 구조를 제공한다. 준비백과 초기 글 수와 날짜·읽는 시간, 상세 메타, 푸터 링크가 붙지 않는다. 390·768·1440px에서 가로 넘침·깨진 이미지·콘솔 오류가 없고 정적 검증·빌드·dist 검증이 통과한다. 고유 온라인 미리보기는 noindex다.
검증 방법: 수정 허용 파일 diff와 CHG-A~C 불변 확인, 정적 검증·dist 빌드·dist 검증, 로컬 브라우저에서 업체 등록 단계 이동·계산 결과 완료·홈/목록/준비백과/상세/푸터를 390·768·1440px로 확인, 테스트 응답의 X-Robots-Tag 확인
실행할 테스트: node scripts/tests/validate.mjs, node scripts/build/prepare-dist.mjs, node scripts/tests/validate-dist.mjs, 브라우저 수동 회귀
위험요소: 기존 미커밋 FE-013 변경과 같은 파일을 이어 수정하므로 부분 되돌리기가 어렵다. provider.html·venues.js 후기 공개 게이트와 대표 URL/canonical은 CHG-B·D-10 때문에 이번 작업에서 해결하지 못한다. 테스트 noindex 설정을 공식 도메인에 그대로 사용하면 색인이 막히므로 정식 도메인 전환 전에 별도 변경이 필요하다.
롤백 방법: FE-014에서 추가한 이미지와 이번 허용 파일 변경만 FE-013 완료 상태로 되돌린다. DB·운영 데이터 롤백은 없다.
사용자 승인 필요 여부: 본 구현과 고유 온라인 미리보기는 최신 요청으로 승인됨. 실제 업체 접수·증빙 수집, 공식 도메인 canonical·대표 URL, GitHub push·main 병합·production 배포는 별도 승인 필요.
권장 브랜치명: task/FE-014-public-readiness-stabilization
현재 상태: DONE (1차 독립 검수 보완 후 총괄 PM·독립 QA PASS, 고유 noindex draft `6a62af9bb40288afb67fd7eb`, GitHub main·production 미반영)
```

## FE-013

```text
작업 ID: FE-013
작업명: 최신 생성 시안 기반 통합 UI 구현
담당 전문 에이전트: 총괄 PM 직접 통합 구현
현재 문제: 현재 웹 화면은 사용자가 마지막으로 승인한 기능 구조는 반영했지만, 가장 최근에 생성한 이미지 시안의 짙은 녹색·웜 아이보리·코랄 중심 디자인, 실사 이미지 활용, 섹션 비율과 시각적 위계가 충분히 반영되지 않았다.
사업적 목적: 방문자가 서비스 소개를 읽기보다 업체 검색, 행사 비용 계산, 업체 탐색, 체크리스트, 비교와 견적 문의로 곧바로 이동할 수 있는 신뢰감 있는 가족행사 플랫폼 화면을 제공한다.
근거 문서: 사용자의 2026-07-23 최신 이미지 기준 구현 지시, 최근 생성 이미지 묶음, FE-011·FE-012 완료 결과, ADR-015~016
선행 작업: FE-011 DONE, FE-012 DONE, 사용자 최신 이미지 구현 지시
수정 허용 경로: styles/tokens.css, styles/base.css, styles/components/header.css, styles/components/button.css, index.html, styles/pages/home.css, calculator.html, styles/pages/calculator.css, checklist.html, styles/pages/checklist.css, compare.html, styles/pages/compare.css, venues.html, styles/pages/venues.css, articles.html, styles/pages/articles.css, provider-register.html, styles/pages/provider-register.css
수정 금지 경로: package.json, pnpm-lock.yaml, scripts/tests/**, _verify/**, provider.html, scripts/pages/provider.js, scripts/pages/venues.js, styles/components/filter.css, docs/**, favicon.ico, API·DB·RLS·마이그레이션·라우팅·환경변수·패키지·잠금 파일, 업체·후기 원본 데이터, 운영 production과 GitHub main
공유 계약: 기존 URL, 검색 쿼리, 최대 3곳 비교 계약, 계산기·체크리스트 저장 키, 공개 행사 분류 5종(kids, parents, meeting, anniversary, other)을 유지한다. 코랄은 주요 고객 행동, 녹색은 탐색·보조·업체 행동에 사용한다.
구현 범위: 가장 최근 생성 이미지 묶음을 하나의 디자인 시스템으로 해석해 공통 색상·헤더·버튼, 홈, 업체 찾기, 행사 계산기, 체크리스트, 비교함, 준비백과, 업체 등록 화면의 레이아웃과 반응형 표현을 구현한다. 이미지 속 표·버튼·입력창은 실제 HTML 요소로 표현한다. 공개 가능한 실제 업체가 없으면 가짜 순위·평점·가격 대신 준비 상태를 명확히 표시한다.
구현하지 않을 범위: 가짜 업체·후기·평점·가격 생성, 새 API·DB·인증·결제·예약·정산, 업체 데이터 수정, 운영 배포, GitHub main 병합, CHG-A~C 변경
완료 조건: 1440px·768px·390px에서 최신 시안의 색감·사진 중심 구성·섹션 위계가 일관되게 보인다. 5종 행사 분류와 기존 주요 링크가 유지되고 가로 넘침과 콘솔 오류가 없다. 빌드와 허용 범위 내 검증이 통과한다. 고유 온라인 미리보기에서 홈·계산기·체크리스트·비교함을 확인할 수 있다.
검증 방법: 허용 파일 diff, 금지 경로 불변 확인, 정적 검증과 dist 빌드, 390·768·1440 브라우저 캡처, 검색·계산기·체크리스트·비교함 링크 수동 확인
실행할 테스트: node scripts/tests/validate.mjs, node scripts/build/prepare-dist.mjs, node scripts/tests/validate-dist.mjs, 로컬 브라우저 390×844·768×1024·1440×1000 확인
위험요소: 공통 토큰 변경으로 기존 비대상 화면 색상이 일부 변할 수 있음, 실사 이미지 수량 제한, CHG-B 업체 화면과의 시각 차이, 과거 8종 행사 기준 테스트와 현재 5종 정책의 불일치
롤백 방법: FE-013에서 수정한 허용 파일의 이번 변경만 되돌리고 FE-012 완료 상태로 복원한다. DB·저장 데이터 롤백은 필요 없다.
사용자 승인 필요 여부: 구현과 고유 draft 미리보기는 승인됨. GitHub push·main 병합·Netlify production 배포는 별도 승인 필요.
권장 브랜치명: task/FE-013-latest-visual-implementation
현재 상태: DONE (총괄 PM 기능·다중 뷰포트 검수 PASS, 고유 Netlify draft 생성, 사용자 시각 확인 대기)
```

## FE-012

```text
작업 ID: FE-012
작업명: 행사 분류 5종 통합과 실용형 체크리스트 개편
담당 전문 에이전트: frontend-design
현재 문제: 화면에는 상견례·스몰웨딩, 가족모임·추모 가족행사가 각각 나뉘어 있어 사용자가 비슷한 준비를 여러 분류에서 다시 판단해야 한다. 체크리스트 왼쪽에는 행사 종류 외에도 준비 상태·날짜·인원·지역·장소 여부가 한꺼번에 있어 시작 부담이 크고, 실제 할 일은 행사별 4~6개뿐이라 충분히 도움이 되는 준비 목록으로 느끼기 어렵다.
사업적 목적: 방문자가 5개 행사 분류 중 하나만 선택해 바로 시작하고, 준비 단계별로 구체적인 확인 사항을 보며 행사 준비를 끝까지 관리하게 한다.
근거 문서: 사용자의 2026-07-23 행사 분류 통합·체크리스트 단순화 요청, FE-011 완료 결과, ADR-015~016, 기존 event-types·checklist 저장 계약
선행 작업: FE-011 DONE, 사용자 변경 방향 승인
후속 작업: 독립 QA 검수, 고유 Netlify draft 미리보기, 사용자 확인, 최종 배포·GitHub 반영 별도 승인
수정 허용 경로: scripts/core/event-types.js, scripts/core/search-context.js, scripts/core/checklist-templates.js, index.html, styles/pages/home.css, scripts/pages/home.js, calculator.html, scripts/pages/calculator.js, checklist.html, styles/pages/checklist.css, scripts/pages/checklist.js, venues.html, inquiry.html, scripts/pages/inquiry.js, provider-register.html, partner.html, claim.html
수정 금지 경로: provider.html, scripts/pages/provider.js, scripts/pages/venues.js, styles/components/filter.css, 데이터 원천과 review-*.js, API·DB·RLS·마이그레이션·라우팅·환경변수·패키지·잠금 파일, 공통 헤더·디자인 토큰, scripts/tests/**, CHG-A~C의 기존 변경
예상 변경 파일: 위 17개. venues.html·provider-register.html·partner.html·claim.html은 행사 선택 항목만 최소 수정하고, inquiry.html·scripts/pages/inquiry.js는 이전 쿼리 정규화에 필요한 최소 구간만 수정한다.
공통 파일 변경 필요 여부: 예. scripts/core/event-types.js와 scripts/core/search-context.js는 행사 표시·검색 전달 계약의 단일 소유 파일이므로 FE-012가 단독으로 수정한다. DB 값이나 URL 경로는 바꾸지 않는다.
다른 작업과 공유하는 계약: 기존 행사 ID kids, parents, meeting, smallWedding, familyGathering, anniversary, memorial, other와 checklist:{eventId} 저장 키. 대표 ID는 meeting=결혼 준비, other=기타 가족행사로 사용하고 이전 smallWedding은 meeting, familyGathering·memorial은 other로 읽기 호환한다.
구현 범위: 공개 선택지를 돌잔치·백일, 환갑·칠순·팔순, 결혼 준비, 기념일·생신, 기타 가족행사 5개로 통합한다. 이전 URL과 저장 체크리스트는 대표 분류로 자동 연결한다. 체크리스트 왼쪽은 행사 종류와 진행률·초기화만 남기고, 날짜는 선택 사항으로 본문에 둔다. 행사별 체크리스트를 준비 단계로 묶고 각 할 일에 이유·확인 포인트·권장 시점·관련 기능 연결을 제공한다. 결혼 준비와 기타 가족행사는 통합 범위 안에서 선택 항목임을 표시한다.
구현하지 않을 범위: 기존 저장 데이터 삭제·일괄 변환, DB 행사 enum 변경, 신규 API, 업체 데이터·후기·가격 생성, 공통 헤더 개편, 예약·결제·정산, production 배포, GitHub push·PR
완료 조건: 공개 화면의 행사 선택은 5개로 일관되고 이전 smallWedding·familyGathering·memorial 링크가 각각 meeting·other로 정상 연결된다. 체크리스트 왼쪽의 필수 선택은 행사 종류 1개뿐이며, 5개 행사 모두 단계별 세부 할 일이 충분히 제공된다. 기존 완료 항목·메모·사용자 추가 항목을 삭제하지 않고 읽을 수 있다. 390/768/1440px에서 가로 넘침·콘솔 오류가 없고 빌드·배포 번들 검사가 통과한다.
검증 방법: 허용 파일 diff와 금지 경로 불변 확인, 5개 선택지 정적 검사, 레거시 URL·저장 키 호환 검사, 체크리스트 저장·새로고침·초기화 검사, 모바일·태블릿·PC 브라우저 검사
실행할 테스트: 변경 JS node --check, node scripts/tests/validate.mjs, pnpm build, pnpm test:dist, 로컬 브라우저 390×844·768×1024·1440×1000, smallWedding·familyGathering·memorial 레거시 쿼리 수동 검사
위험요소: 기존 8개 ID를 사용하는 데이터·URL·저장 키가 끊길 위험, 결혼 준비·기타 가족행사의 목록이 지나치게 길어질 위험, CHG-B 업체 목록 코드와 충돌할 위험
롤백 방법: FE-012 허용 파일에서 이번 변경만 되돌리고 FE-011 완료 상태와 기존 8개 표시를 복원한다. 기존 저장 키는 삭제하지 않았으므로 별도 데이터 롤백이 필요 없다.
사용자 승인 필요 여부: 이번 구현과 고유 draft 미리보기 승인 완료. GitHub push·Netlify production·최종 병합은 별도 승인 필요
권장 브랜치명: task/FE-012-event-taxonomy-checklist
현재 상태: DONE (REVISION 2 후 총괄 PM·독립 QA PASS, 고유 draft 생성, 최종 배포·GitHub 반영 금지)
```

## FE-011

```text
작업 ID: FE-011
작업명: 승인된 최종 홈·준비 도구·비교 화면 구현
담당 전문 에이전트: frontend-design
현재 문제: FE-009는 안전 축소 홈까지만 구현했고, 사용자가 최종 승인한 홈 8개 섹션 순서와 독립 계산기·체크리스트·비교 화면의 시각·행동 계약은 아직 코드에 반영되지 않았다.
사업적 목적: 방문자가 업체 검색 → 비용 계산 → 검증 가능한 업체 탐색 → 비교함 → 통합 견적 문의 흐름을 이해하고, 체크리스트는 별도 일정 관리 도구로 사용할 수 있게 한다.
근거 문서: 사용자의 2026-07-23 최종 수정안과 전체 승인, ADR-015~016, BIZ-003, BIZ-004, OPS-008, QA-015, FE-009 결과
선행 작업: OPS-009·FE-009 DONE, 사용자 최종 디자인 전체 승인
후속 작업: 로컬 빌드·브라우저 QA, 고유 Netlify draft 미리보기, 사용자 확인, 최종 배포 별도 승인
수정 허용 경로: index.html, styles/pages/home.css, scripts/pages/home.js, calculator.html, styles/pages/calculator.css, scripts/pages/calculator.js, checklist.html, styles/pages/checklist.css, scripts/pages/checklist.js, compare.html, styles/pages/compare.css, scripts/pages/compare.js
수정 금지 경로: 그 외 모든 제품 파일, 공통 토큰·공통 CSS·공통 JS, venues.html, provider.html, 데이터 원천, review-*.js, API·DB·라우팅·환경변수·패키지·잠금 파일, CHG-A~C
예상 변경 파일: 위 12개
공통 파일 변경 필요 여부: 아니오. 각 화면의 기존 공통 토큰·헤더·저장 모듈을 읽기만 하고 수정하지 않는다.
다른 작업과 공유하는 계약: 8개 행사 ID, venues.html 검색 쿼리, calculator/checklist/compare/inquiry/articles/provider-register/claim URL, 비교함 최대 3개, 신뢰 라벨과 최근 확인일 정책
구현 범위: 홈 8개 섹션 순서, 서울특별시+돌잔치·백일 기본 검색, 3단계 이용 흐름, 행사 8종 카드, 별도 계산기 안내, 검증 가능한 업체 영역의 안전한 빈 상태, 읽기 전용 체크리스트 미리보기, 지역·조건 탐색, 준비백과, 업체 등록 CTA, 계산기 단계·행사별 항목·범위 결과·검색 필터 전달, 체크리스트 설정·일정 관리·기능 연결, 비교 최대 3개·동적 CTA·교체/삭제·모바일 가로 스크롤 안내
구현하지 않을 범위: 가짜 업체·인기 순위·평점·후기·가격, 신규 업체 데이터 생성, 운영 DB/API/RLS, 예약·결제·정산, 업체 연락, 개인정보 처리, 공통 헤더 스크립트 변경, production 배포
완료 조건: 승인된 순서와 문구가 반영되고 모든 CTA가 기존 실제 경로로 연결되며, 가짜 데이터·죽은 버튼 0, 계산 조건이 업체 검색으로 전달되고, 체크리스트 목적이 일정 관리로 유지되며, 비교 CTA가 실제 선택 수를 표시하고 390/768/1440px에서 가로 넘침·콘솔 오류가 없다.
검증 방법: 수정 허용 파일 diff, DOM·링크·쿼리 계약 정적 검사, pnpm test/build/test:dist의 기존 기준선 비교, 로컬 HTTP 브라우저에서 홈·계산기·체크리스트·비교 화면 및 키보드·모바일 검수
실행할 테스트: node scripts/tests/validate.mjs, node scripts/tests/sonpum-redesign.mjs, node scripts/tests/marketplace-flow.mjs, pnpm build, pnpm test:dist, 로컬 브라우저 390×844·768×1024·1440×1000
위험요소: FE-009와 OPS-009의 기존 dirty diff를 덮어쓸 위험, CHG-A의 과거 marketplace 검사 충돌, 공개 가능한 업체 0건에서 예시 카드가 실제 업체처럼 보일 위험
롤백 방법: 허용된 12개 파일에서 FE-011 변경만 되돌리고 FE-009 완료 상태를 복원한다.
사용자 승인 필요 여부: 디자인 구현과 고유 draft 미리보기 승인 완료. GitHub push·Netlify production·최종 병합은 별도 승인 필요
권장 브랜치명: task/FE-011-approved-marketplace-tools
현재 상태: DONE (총괄 PM·독립 QA PASS, 고유 draft 생성, 최종 배포·GitHub 반영 금지)
```

## FE-009

```text
작업 ID: FE-009
작업명: 베이지 C안 홈 안전 축소 구현
담당 전문 에이전트: frontend-design
현재 문제: 사용자가 승인한 C안은 아직 코드에 반영되지 않았고, 기존 홈은 NAVER 파생 업체와 미완성 업체 행동을 전제로 한다. index.html과 home.js는 D-22/OPS-009의 직접 수정 경로와 겹친다.
사업적 목적: 방문자가 첫 화면에서 행사 검색·준비 도구·검수 콘텐츠를 바로 사용하게 하되, 검증되지 않은 업체·후기·가격과 작동하지 않는 참여 기능을 노출하지 않는다.
근거 문서: ADR-015~016, FE-006 베이지 C안, FE-006 콘텐츠 구조 v2, QA-008, MKT-008, FE-007, BIZ-003, BIZ-004, D-23, D-25, QA-015
선행 작업: D-22 승인과 OPS-009 PM PASS 완료. MKT-008·FE-007·D-23~D-25·QA-015 완료.
후속 작업: 로컬 브라우저 미리보기, 사용자 시각 검수, 별도 외부 미리보기/최종 배포 승인
수정 허용 경로: index.html, styles/pages/home.css, scripts/pages/home.js
수정 금지 경로: 그 외 모든 파일, 공통 토큰·CSS·JS, venues.html, provider.html, compare.html, 데이터 원천, review-*.js, API·DB·라우팅·환경변수·패키지·잠금 파일, CHG-A~C
예상 변경 파일: index.html, styles/pages/home.css, scripts/pages/home.js 3개
공통 파일 변경 필요 여부: 아니오. 단 index.html·home.js는 OPS-009와 순차 실행해야 함
다른 작업과 공유하는 계약: 기존 검색 쿼리와 8개 행사 ID, calculator/checklist/articles/community/login/account/contact URL, 공개 준비백과 6개, 운영팀 시작 질문 6개
구현 범위: 베이지·포레스트 그린·코랄 홈 전용 디자인, 첫 화면 검색, 8개 행사 빠른 시작, 업체 정보 준비 상태, 계산기·체크리스트, 공개 준비백과 대표 글, 운영팀 시작 질문 미리보기, 로그인·내 계정, 반응형·키보드 접근성
구현하지 않을 범위: 업체 카드·수·지역별 수·후기·평점·추천·가격, 실제 신뢰 라벨 부착, 비교·견적 문의 강조, 정보 수정 제안, 업체 권한 요청, 신규 업체 등록, API·DB, 생성 시안 이미지의 운영 자산 직접 사용
완료 조건: 검색과 안전 CTA가 실제 경로로 작동, NAVER 파생 홈 렌더링 0, 가상 활동·과장 문구·죽은 버튼 0, 기존 쿼리 유지, 390/768/1440px 가로 넘침 0, 키보드 사용 가능, 허용 3개 외 변경 0
검증 방법: DOM·링크·검색 쿼리·금지 문구 정적 검사, 빌드·dist, 3개 뷰포트 브라우저 검수, 홈 변경 전후 비교
실행할 테스트: pnpm test, pnpm build, pnpm test:dist, 로컬 HTTP 브라우저 스모크와 390×844·768×1024·1440×1000 직접 확인
위험요소: D-22 파일 충돌, 오래된 CHG-A 테스트 정본, 업체 입점·내 준비 현황을 실제 준비도보다 넓게 약속할 위험
롤백 방법: 허용된 홈 3개 파일의 FE-009 변경만 되돌린다.
사용자 승인 필요 여부: C안·D-22·D-24와 별도 온라인 draft 미리보기는 승인 완료. 최종 배포는 금지
권장 브랜치명: task/FE-009-safe-beige-home
현재 상태: DONE (총괄 PM·독립 reviewer PASS, 온라인 draft 생성, 최종 배포 금지)
```

## QA-016

```text
작업 ID: QA-016
작업명: 승인된 정보 나눔 홈 링크와 marketplace 검사 정합화
담당 전문 에이전트: quality-security
현재 문제: 승인된 FE-009 상단 메뉴와 콘텐츠에는 정보 나눔 링크가 필요하지만 scripts/tests/marketplace-flow.mjs 117~121행은 index.html을 포함한 5개 화면에서 모든 community 링크를 실패 처리해 pnpm test가 1건 실패한다.
사업적 목적: 승인된 커뮤니티 진입점을 유지하면서, 업체 비교·견적 핵심 흐름에 커뮤니티 링크를 다시 끼워 넣지 못하도록 테스트 의도를 정확히 분리한다.
근거 문서: D-14, D-19~D-20, FE-007, FE-009, ops/reports/FE-009-safe-beige-home.md, R-48
선행 작업: FE-009 DONE, CHG-A의 테스트 정본과 소유자 확정
후속 작업: pnpm test 전체 통과 확인, QA-012 공개 번들 회귀에 결과 반영
수정 허용 경로: scripts/tests/marketplace-flow.mjs, ops/reports/QA-016-marketplace-home-nav-contract.md
수정 금지 경로: index.html을 포함한 모든 제품 코드, package.json, pnpm-lock.yaml, _verify/browser-smoke.cjs, scripts/tests/browser-smoke.cjs, API·DB·라우팅·환경변수, CHG-B~C
예상 변경 파일: scripts/tests/marketplace-flow.mjs, ops/reports/QA-016-marketplace-home-nav-contract.md
공통 파일 변경 필요 여부: 예. CHG-A에 포함된 테스트 계약이므로 소유권 확정 전 수정 금지
다른 작업과 공유하는 계약: index.html에서는 승인된 준비백과·정보 나눔 콘텐츠 탐색을 허용하고, venues.html·provider.html·compare.html·inquiry.html의 마켓플레이스 핵심 흐름에서는 기존 금지를 유지
구현 범위: 실패 규칙을 화면별 의도로 분리, 승인된 홈 링크의 긍정 검사 추가, 나머지 4개 화면 금지 회귀 유지, 전후 실패·통과 근거 기록
구현하지 않을 범위: 제품 메뉴 수정, 커뮤니티 기능 확대, 테스트 삭제·전체 완화, 패키지 스크립트 변경, 브라우저 스모크 정본 선택
완료 조건: FE-009 홈 정보 나눔 링크는 허용·존재 검사, 나머지 4개 화면 금지는 유지, 기존 리워드 금지 검사 유지, pnpm test·build·test:dist 통과, 제품 파일 변경 0
검증 방법: 변경 전 단일 실패 재현, 테스트 규칙 단위 검토, 전체 pnpm test와 빌드·dist 재실행
실행할 테스트: node scripts/tests/marketplace-flow.mjs, pnpm test, pnpm build, pnpm test:dist, git diff --check
위험요소: CHG-A 소유권 침범, 홈 예외가 다른 화면까지 넓어져 회귀를 놓칠 위험
롤백 방법: QA-016에서 변경한 테스트 파일 1개만 이전 규칙으로 되돌리고 보고서를 보존한다.
사용자 승인 필요 여부: 테스트 정본 소유권을 총괄 PM이 확정해야 한다. 제품 정책·외부 실행·배포 승인은 필요하지 않다.
권장 브랜치명: task/QA-016-marketplace-home-nav-contract
현재 상태: BLOCKED (CHG-A 테스트 정본 소유권 대기)
```

## QA-015

```text
작업 ID: QA-015
작업명: D-24 현행 안전조치 기준 정합성 보완
담당 전문 에이전트: quality-security
현재 문제: QA-013의 최소수집 방향은 타당하지만 폐기된 2025-9 안전조치 고시를 참조하고, grant 감사 1년 제안이 현행 2026-9 고시의 접근권한 부여·변경·말소 이력 최소 3년과 충돌하며, OPS-008의 사업자번호 암호화 원문/keyed hash 후보가 최종 폐기됐다는 연결도 명시해야 한다.
사업적 목적: 사용자가 오래된 기준이나 모순된 보유안 없이 D-24를 안전하게 결정하고 후속 기술 계약이 잘못된 개인정보 보관을 구현하지 않게 한다.
근거 문서: OPS-011, QA-013, OPS-008, 현행 개인정보 보호법, 개인정보의 안전성 확보조치 기준 제2026-9호, 2026-09-11 시행 예정 법률
선행 작업: OPS-011 D-24 재검토 REVISION_REQUIRED
후속 작업: 사용자 D-24 결정, BE-006 보안 계약, QA-003 역할·RLS·로그·파기 E2E
수정 허용 경로: ops/reports/QA-015-d24-current-standard-alignment.md
수정 금지 경로: 그 외 모든 파일과 완료 보고서, 실제 사업자번호·관계서류·사진/후기 증빙 수집·조회·저장, 제품·DB/API/RLS/Storage/환경변수/패키지, 외부 실행, CHG-A~C
예상 변경 파일: ops/reports/QA-015-d24-current-standard-alignment.md 1개
공통 파일 변경 필요 여부: 아니오
다른 작업과 공유하는 계약: 사업자번호는 request-scope 메모리에서만 사용 후 즉시 폐기하고 암호문·hash/token도 보존하지 않으며, 증빙 원본 기간과 시스템 접근권한/접속기록의 법정 최소기간을 분리한다.
구현 범위: 현행 2026-9 고시 URL·시행상태, 접근권한 부여/변경/말소 이력 최소 3년, 접속기록 최소 1년·조건부 2년, QA-013의 1년 내부 감사 제안 정정, OPS-008 구안 폐기, D24-1~8/R-A 사용자 결정문 재작성, 2026-09-11 재확인 게이트
구현하지 않을 범위: 법률 자문 확정, 실제 개인정보 처리, DB/RLS/Storage 구현, D-23·D-25 정책 변경, 제품/운영 배포
완료 조건: D-24 추천문이 현행 공식 기준과 모순되지 않고 원본·결정감사·접근권한이력·접속기록 기간을 분리하며 사용자가 승인할 수 있음
검증 방법: 국가법령정보센터·개인정보보호위원회 공식 1차 출처 재확인, QA-013·OPS-008 문구별 대체 관계와 기간 교차 검사
실행할 테스트: 폐기 고시 URL 0, 사업자번호 암호화 원문/keyed hash 허용 0, 접근권한 이력 3년·접속기록 1/2년·원본 30/90일 경계, D24-1~8 누락 정적 검사
위험요소: 접근권한 이력과 개인정보 원본을 같은 감사자료로 오인해 원본을 3년 보관하거나, 반대로 내부 1년 제안으로 법정 기록을 조기 삭제할 위험
롤백 방법: 보완 보고서 1개 제거
사용자 승인 필요 여부: 아니오(보완안 작성); D-24 결정과 실제 개인정보 처리는 별도 사용자·법률·기술 게이트 필요
권장 브랜치명: docs/qa-015-d24-current-standard
현재 상태: DONE (총괄 PM·독립 reviewer PASS; D-24 사용자 승인 완료)
```

## OPS-011

```text
작업 ID: OPS-011
작업명: D-23~D-25 추천안 사용자 결정 통합 검토
담당 전문 에이전트: 총괄 PM + 분야별 읽기 전용 전문 검토
현재 문제: D-23 공공데이터, D-24 개인정보, D-25 공개 신뢰표시의 전문 보고서는 통과했지만 사용자가 세 결정을 한 번에 이해하고 각각 승인·수정·보류하기 쉬운 통합 설명이 없다.
사업적 목적: 제품 개발 전에 데이터 원천·민감정보 처리·고객 신뢰표시의 경계를 사용자가 쉬운 말로 확인하고 독립적으로 결정하게 한다.
근거 문서: QA-011, QA-013, BIZ-004, OPS-008, BIZ-003, BE-005, D-23~D-25, ADR-016~017
선행 작업: QA-011·QA-013·BIZ-004 DONE 및 PM·독립 reviewer PASS, D-29 승인 완료
후속 작업: 사용자 D-23~D-25 개별 결정, 승인된 범위의 BE-006 상세 계약, 이후 FE-008·QA-003
수정 허용 경로: 전문 검토 산출물은 ops/reports/PM-2026-07-22-d23-d25-user-review.md 1개. 총괄 PM 통합에 한해 ops/ACTIVE_WORK.md, ops/PROJECT_BOARD.md, ops/BACKLOG.md, ops/FILE_OWNERSHIP.md, ops/DEPENDENCIES.md, ops/APPROVALS.md, ops/RISKS.md, ops/TASK_SPECS.md와 신규 ops/handoffs/QA-015.md를 갱신 가능
수정 금지 경로: 위 총괄 PM 통합 문서 외 모든 파일, 원본 전문 보고서, 제품 코드, 공공데이터 호출·수집·저장, 개인정보·사업자번호·증빙 수집, DB/API/RLS, 외부 연락·게시·비용·배포, CHG-A~C
예상 변경 파일: 통합 검토 보고서 1개, QA-015 전달문 1개, 총괄 PM 관리 문서 8개
공통 파일 변경 필요 여부: 아니오
다른 작업과 공유하는 계약: D-23은 후보 발견·행정 상태 신호, D-24는 사업자/소유권/증빙 최소수집, D-25는 공개 라벨·최근성만 결정하며 서로를 포괄 승인하지 않는다.
구현 범위: 세 추천안의 현재 근거 재확인, 쉬운 요약, 추천/대안/보류 영향, 결합 승인 위험, 승인 후에도 남는 법률·기술·배포 게이트, 사용자 응답 형식
구현하지 않을 범위: 세 결정의 자동 승인, 제품/스키마 구현, 데이터 활용신청·API 호출, 실제 개인정보 처리, 화면 문구 적용, 외부 실행
완료 조건: 사용자가 D-23·D-24·D-25를 각각 추천 승인·수정·보류할 수 있고 무엇이 허용·금지되며 다음에 어떤 작업이 풀리는지 이해할 수 있음
검증 방법: QA-011·QA-013·BIZ-004 완료 조건과 운영 문서를 교차 대조하고 D-23 공식 데이터셋/이용조건 및 D-24 현행 공식 기준의 확인일·시행 상태를 재확인
실행할 테스트: 데이터셋 ID·이용범위·미허용 주장, 사업자번호 즉시 폐기·증빙 보유/접근, 6개 라벨·90/120/180/365일 경계, 세 결정 간 포괄 승인 오인 정적 검사
위험요소: 세 결정을 한꺼번에 승인하면서 공공데이터를 검증 업체로, 사업자 상태를 소유권으로, 하나의 라벨을 전체 정보 인증으로 오인할 위험
롤백 방법: 통합 검토 보고서 1개 제거
사용자 승인 필요 여부: 아니오(검토안 작성); D-23~D-25 실제 결정은 사용자 승인 필요
권장 브랜치명: docs/ops-011-d23-d25-user-review
현재 상태: DONE (분야별 검토 및 독립 reviewer PASS; D-23 PASS, D-24 REVISION_REQUIRED, D-25 PASS)
```

## QA-014

```text
작업 ID: QA-014
작업명: 외부 영업 연락 데이터·수신거부 최소수집 D-29 결정안
담당 전문 에이전트: quality-security
현재 문제: MKT-011 파일럿에는 공식 업무 연락처·발송 이력·수신거부 차단 기록이 필요하지만, QA-013의 D-24는 사업자·소유권·사진/후기 증빙 범위여서 이 데이터의 목적·최소 필드·보유·삭제를 승인하지 않았다.
사업적 목적: 업체의 연락 거부를 확실히 지키면서 연락처·메시지·발송 이력을 불필요하게 수집하거나 무기한 보유하지 않는다.
근거 문서: MKT-011, QA-013, OPS-008, MKT-009, D-26, R-46, 개인정보 보호법·정보통신망 관련 현행 공식 기준
선행 작업: QA-013·MKT-011 DONE 및 PM 통합 PASS
후속 작업: D-29 승인 완료, D-26 실행 승인·법률 확인·기술 E2E 후 MKT-010 제한 파일럿, 필요한 경우 단일 소유 기술 계약
수정 허용 경로: ops/reports/QA-014-outreach-contact-suppression-decision-packet.md
수정 금지 경로: 그 외 모든 파일, 실제 업체·연락처·메시지 수집/조회/저장, 외부 연락·게시·비용, 제품·DB/API/RLS/환경변수/패키지, CHG-A~C
예상 변경 파일: ops/reports/QA-014-outreach-contact-suppression-decision-packet.md 1개
공통 파일 변경 필요 여부: 아니오
다른 작업과 공유하는 계약: 공식 서면 업무 채널만 검토하고 수신거부·거절 후 재접촉 0, D-24 공통 최소수집·접근 통제를 적용하되 외부 영업 목적은 D-29로 별도 승인한다.
구현 범위: 공식 업무 연락처·발송 시도/결과·거절/수신거부 식별값의 목적·필수/선택/금지 필드, 원문/정규화/HMAC 등 식별 방식 선택안, 업체·지점·브랜드 범위, 접근 역할, 보유·삭제·철회·오류 정정, 발송 전 중복 검사, 로그/분석/개인 도구 금지, 20개 이상 위협·오남용 시나리오, D-29 승인표와 추천·대안
구현하지 않을 범위: 실제 연락처 조사·수집·발송, 법률 자문 확정, DB/API/RLS 구현, 발송 도구 선정·비용, D-26 연락 문구 재작성
완료 조건: 사용자가 D-29를 목적·필드·식별·범위·접근·보유·삭제별로 승인할 수 있고, 승인 전 연락 0·수신거부 재접촉 0·개인 연락처 과수집 금지 조건이 재현 가능함
검증 방법: MKT-011 D26-05/D26-10·Day0·시나리오와 QA-013 D-24 공통 통제를 대조하고 현행 공식 1차 법령·기관 자료의 시행일·범위를 확인
실행할 테스트: 중복·지점/본사 범위·채널 변경·반송·거절·수신거부·삭제·backup 복원·로그 노출·HMAC 오인·개인 연락처 혼입 정적 시나리오 검사
위험요소: hash/HMAC을 익명정보로 오인하거나 수신거부 준수를 이유로 연락처를 무기한 보유하고, 지점 거부를 다른 채널·본사 연락으로 우회할 위험
롤백 방법: 보고서 1개 제거
사용자 승인 필요 여부: 아니오(결정안 작성); D-29 정책 승인 완료, 실제 연락 데이터 처리와 외부 실행은 D-26·법률/기술 게이트 필요
권장 브랜치명: docs/qa-014-outreach-suppression-decision
현재 상태: DONE (총괄 PM·독립 reviewer 검수 PASS; D-29 추천안 승인 완료, 법률/기술·D-26 게이트 대기)
```

## BIZ-004

```text
작업 ID: BIZ-004
작업명: 공개 신뢰 라벨·최근성 D-25 결정안
담당 전문 에이전트: business-product
현재 문제: 6개 신뢰 상태의 의미는 정리됐지만 `업체 직접 제출`과 `업체 제공 정보` 같은 명칭, 보조 문구, 90/120/180/365일 주기가 사용자 승인용 한 장으로 정리되지 않았다.
사업적 목적: 고객이 각 정보의 출처와 확인 범위를 쉽게 이해하고 `검증 완료`라는 과장된 단일 배지를 피하도록 D-25 결정을 준비한다.
근거 문서: BIZ-003, OPS-008, QA-011, BE-005, ADR-016, PM-2026-07-22-prep-policy-review
선행 작업: BIZ-003·QA-011·OPS-008 DONE 및 PM 통합 PASS
후속 작업: D-25 사용자 승인, BE-006 상세 계약, FE-008 표시 구현
수정 허용 경로: ops/reports/BIZ-004-trust-label-decision-packet.md
수정 금지 경로: 그 외 모든 파일, 제품 코드, DB/API/라우팅/디자인 토큰/환경변수/패키지, CHG-A~C
예상 변경 파일: ops/reports/BIZ-004-trust-label-decision-packet.md 1개
공통 파일 변경 필요 여부: 아니오
다른 작업과 공유하는 계약: 6개 상태는 독립 축이며 T5만 공개·비교, T6만 견적 문의 자격을 검토한다.
구현 범위: 라벨별 쉬운 명칭·한 줄 설명·상세 설명·금지 의미, 함께 표시하는 순서, 모바일 축약안, 90/120/180/365일 선택안과 영향, 용어 불일치 해소, 15개 이상 오인 방지 사례, 추천안과 대안 비교
구현하지 않을 범위: 사용자 조사 실행, UI 디자인·제품 구현, 공개 문구 최종 승인, 데이터/DB 변경
완료 조건: 비전문가가 선택할 수 있는 D-25 결정표, 추천안·대안·영향, 단일 용어 사전, 경계 사례와 승인 후 후속 계약이 완전함
검증 방법: BIZ-003·OPS-008 용어 및 상태 전이 대조, 과장·중복·모바일 문맥 검사
실행할 테스트: 라벨 조합·최근성 경계·가격 숨김·문의 비활성 정적 시나리오 검사
위험요소: 짧은 라벨이 검수 범위를 과장하거나 경고가 많아 화면 이해를 방해할 위험
롤백 방법: 보고서 1개 제거
사용자 승인 필요 여부: 아니오(결정안 작성); 실제 공개 명칭·주기 확정은 D-25 승인 필요
권장 브랜치명: docs/biz-004-trust-label-decision
현재 상태: DONE (PM·독립 reviewer 검수 PASS; D-25 승인 대기)
```

## QA-013

```text
작업 ID: QA-013
작업명: 사업자·소유권·사진/후기 증빙 D-24 개인정보 결정안
담당 전문 에이전트: quality-security
현재 문제: 업체 검수 절차는 마련됐지만 실제로 어떤 개인정보·증빙을 왜 받고 얼마나 보관하며 누가 볼지 승인 가능한 형태로 확정되지 않았다.
사업적 목적: 업체 소유권과 정보 신뢰를 확인하면서 불필요한 사업자번호·관계 서류·신분증·사진/후기 증빙 수집을 막는다.
근거 문서: OPS-008, BE-005, QA-011, R-40, D-24, PM-2026-07-22-prep-policy-review
선행 작업: OPS-008·QA-011 DONE 및 PM 통합 PASS
후속 작업: D-24 사용자 승인, BE-006 보안 계약, QA-003 역할·RLS E2E
수정 허용 경로: ops/reports/QA-013-privacy-evidence-decision-packet.md
수정 금지 경로: 그 외 모든 파일, 개인정보·사업자번호·증빙 실제 수집, 제품·DB/Storage/API/RLS·환경변수·패키지, CHG-A~C
예상 변경 파일: ops/reports/QA-013-privacy-evidence-decision-packet.md 1개
공통 파일 변경 필요 여부: 아니오
다른 작업과 공유하는 계약: D-24 승인 전 민감 증빙 수집 금지, 사업자 상태·담당자 관계·소유권·편집 권한을 분리한다.
구현 범위: 목적별 최소 항목, 필수/선택/금지 정보, 대체 확인 수단, 보유기간 선택안, 역할별 접근, 마스킹·암호화·signed access·감사 로그, 철회·파기·이의·사고 대응, 15개 이상 오남용 시나리오, 추천안과 대안
구현하지 않을 범위: 개인정보 처리방침 법률 확정, 실제 정보 수집·API 호출·DB 설계/변경, 운영 권한 사용
완료 조건: 사용자가 D-24를 항목별로 승인할 수 있고 수집 전/후 통제·보유·파기·접근 책임이 재현 가능하게 정리됨
검증 방법: OPS-008의 Q6·Q7·Q10·Q11·Q13과 역할 매트릭스 대조, 최소수집·목적 제한·권한 우회 검사
실행할 테스트: 과수집·무권한 열람·로그 노출·철회·만료·삭제·분쟁 위협 시나리오 정적 검사
위험요소: 사업자 증빙을 공개 정보로 오인하거나 보유기간을 법적 확정처럼 제시할 위험
롤백 방법: 보고서 1개 제거
사용자 승인 필요 여부: 아니오(결정안 작성); 실제 수집·보유·법률 문구는 D-24 및 별도 검토 필요
권장 브랜치명: docs/qa-013-privacy-evidence-decision
현재 상태: DONE (역사 보고서 완료; OPS-011 최신성 검토에서 QA-015 보완 필요, 현재 D-24 결정 근거로 단독 사용 금지)
```

## MKT-011

```text
작업 ID: MKT-011
작업명: 서울 돌잔치 업체 제한 파일럿 D-26 승인안
담당 전문 에이전트: marketing-operations
현재 문제: 업체 확보 전략과 SOP는 있으나 실제 연락 전 승인해야 할 대상 기준·문구·횟수·수신거부·검수 처리량·중단선이 한 문서에 없다.
사업적 목적: 무리한 영업이나 과장 약속 없이 소수 업체가 정확한 정보를 직접 제출하는 초기 가설을 안전하게 검증한다.
근거 문서: MKT-009, OPS-008, BIZ-003, QA-011, D-26, PM-2026-07-22-prep-policy-review
선행 작업: BIZ-003·QA-011·OPS-008 DONE 및 PM 통합 PASS
후속 작업: QA-014 DONE·D-29 승인 완료, D-26 사용자 승인·법률 확인·제품 E2E 완료 후 MKT-010 제한 파일럿
수정 허용 경로: ops/reports/MKT-011-seoul-dol-provider-pilot-approval-packet.md
수정 금지 경로: 그 외 모든 파일, 실제 업체 목록·연락처 수집, 업체 연락·외부 게시·광고 집행·비용, 제품·DB/API, 가격·수수료 확정, CHG-A~C
예상 변경 파일: ops/reports/MKT-011-seoul-dol-provider-pilot-approval-packet.md 1개
공통 파일 변경 필요 여부: 아니오
다른 작업과 공유하는 계약: 서울 돌잔치부터 시작하고 무료 기본 등록·정보 수정과 유료 상품을 묶지 않으며 예약·결제·수수료를 약속하지 않는다.
구현 범위: 대상군과 제외 기준, 연락 전 준비물, 채널별 초안 문구, 연락 빈도·수신거부, 한 주 검수 용량과 배치 상한, 등록·검수·문의 지표, 중단·재개 기준, 12주 운영안, 추천안과 대안
구현하지 않을 범위: 실제 후보 추출·연락처 수집·연락·게시·비용 집행, Premium 가격·수수료·SLA 확정, 제품 기능 구현
완료 조건: 사용자가 D-26을 쉽게 승인·보류할 수 있는 실행 범위·문구·용량·성공/중단 기준과 외부 약속 금지 목록이 완전함
검증 방법: MKT-009·OPS-008의 역할·검수 용량·가짜 활동/과장 금지 대조, 수신거부와 개인정보 경계 검사
실행할 테스트: 무응답·거절·중복 연락·검수 적체·권리 미확인·문의 E2E 미완료 시나리오 정적 검사
위험요소: 제품 준비 전 업체를 모집하거나 무료 등록을 유료 전환 약속처럼 오해시키는 위험
롤백 방법: 보고서 1개 제거
사용자 승인 필요 여부: 아니오(승인안 작성); 실제 업체 연락·외부 게시·비용·파일럿 시작은 D-26 승인 필요
권장 브랜치명: docs/mkt-011-provider-pilot-approval
현재 상태: DONE (2차 수정 후 PM·독립 reviewer 검수 PASS; D-29 승인 완료, D-26·법률 확인·E2E 대기)
```

## BIZ-003

```text
작업 ID: BIZ-003
작업명: 서울 돌잔치 비교 필드·행사 분류·신뢰 라벨 정책
담당 전문 에이전트: business-product
현재 문제: 공공데이터 후보, 업체 제출, 사업자 확인, 관리자 검수, 최근성을 한 화면에서 오해 없이 구분할 최종 사업 규칙이 없다.
사업적 목적: 고객이 가격·인원·주차·시설을 같은 기준으로 비교하고 각 정보의 근거와 최신성을 이해하게 한다.
근거 문서: ADR-016, BIZ-002, BE-005, QA-010, 사용자 지정 6개 신뢰 상태
선행 작업: BIZ-002·BE-005·QA-010 DONE 및 PM 통합 판정
후속 작업: OPS-010 기준 문서 현행화, BE-006 상세 계약, FE-008 표시 구현
수정 허용 경로: ops/reports/BIZ-003-comparison-trust-policy.md
수정 금지 경로: 그 외 모든 파일, 제품 코드, DB/API/라우팅/디자인 토큰/환경변수/패키지, CHG-A~C
예상 변경 파일: ops/reports/BIZ-003-comparison-trust-policy.md 1개
공통 파일 변경 필요 여부: 아니오
다른 작업과 공유하는 계약: 전국 범위·서울 돌잔치 우선, 4,960건 legacy_source_hold, 필드별 출처·확인일, 예약·결제 보류
구현 범위: 행사 가능 후보 분류 질문표, 비교 표준 항목과 단위·결측·유효기간, 6개 공개 라벨의 적용/금지 문구, 기본 페이지·비교·문의 최소 자격, 서울 파일럿 판단 지표
구현하지 않을 범위: UI 디자인, 가격·수수료 확정, 제품·스키마·DB 구현, 외부 조사·연락
완료 조건: 돌잔치 장소/서비스 포함·제외·확인 기준, 가격·인원·주차·시설 사전, 신뢰 축과 화면 문구, 10개 이상 경계 사례, 승인 필요 항목이 재현 가능하게 기록됨
검증 방법: ADR-016·BIZ-002·BE-005 상태와 모순 검사, 과장 표현·미확정 거래 기능 검사
실행할 테스트: 문서 상태 전이·결측·최근성 시나리오 검사
위험요소: 사업자 확인을 전체 정보 검증으로 오인하거나 단일 점수로 축약할 위험
롤백 방법: 보고서 1개 제거
사용자 승인 필요 여부: 아니오(정책안 작성); 최종 공개 문구와 주기는 D-25 승인 필요
권장 브랜치명: docs/biz-003-comparison-trust-policy
현재 상태: DONE (PM·독립 reviewer 검수 PASS; D-25 공개 명칭·주기는 승인 대기)
```

## QA-011

```text
작업 ID: QA-011
작업명: 서울 돌잔치 공공데이터 원천·이용허락 후보 레지스트리
담당 전문 에이전트: quality-security
현재 문제: `공공데이터`를 통칭할 뿐 실제 사용할 dataset ID, 허용 필드, 이용허락과 제3자 권리, 갱신·출처 문구가 확정되지 않았다.
사업적 목적: 권리와 출처가 확인된 최소 데이터만 업체 발견·영업 상태 후보에 사용한다.
근거 문서: ADR-016, QA-010, BE-005, 공공데이터포털 공식 데이터·정책 페이지
선행 작업: QA-010·BE-005 DONE 및 PM 통합 판정
후속 작업: D-23 사용자 승인, BE-006 source registry 계약, 승인된 원천별 수집 카드
수정 허용 경로: ops/reports/QA-011-public-data-source-license-register.md
수정 금지 경로: 그 외 모든 파일, API 활용신청·키 사용·데이터 다운로드/저장, 제품·DB·backend/data, CHG-A~C
예상 변경 파일: ops/reports/QA-011-public-data-source-license-register.md 1개
공통 파일 변경 필요 여부: 아니오
다른 작업과 공유하는 계약: 공공데이터는 후보 발견·영업 상태 확인까지만 사용하고 행사 가능·가격·사진·문의 의사를 확정하지 않음
구현 범위: 서울 돌잔치 관련 가능 원천별 제공기관·dataset ID·공간/업종 범위·이용허락·상업 이용·변경·출처표시·제3자 권리·갱신주기·허용 필드·금지 해석·종료/대체 endpoint 기록
구현하지 않을 범위: 실제 활용신청, 호출·수집·저장, 법률 자문 확정, 제품/DB 수정
완료 조건: 제안 원천마다 공식 URL과 확인일, 권리·필드·갱신·중단 조건이 있고 미확정 원천은 사용 가능으로 표시하지 않음
검증 방법: 공식 제공기관·공공데이터포털 1차 자료 교차 확인, URL·dataset ID 중복/종료 검사
실행할 테스트: 링크·필수 열·분류값·출처 문구 정적 검사
위험요소: LOCALDATA 종료 URL이나 공공누리 유형을 일괄 적용하고 제3자 권리를 놓칠 위험
롤백 방법: 보고서 1개 제거
사용자 승인 필요 여부: 아니오(읽기 전용 조사); 실제 원천 채택·활용신청은 D-23 승인 필요
권장 브랜치명: docs/qa-011-public-data-register
현재 상태: DONE (PM·독립 reviewer 검수 PASS; 실제 원천 채택은 D-23 승인 대기)
```

## OPS-008

```text
작업 ID: OPS-008
작업명: 업체 소유권·직접 입력·관리자 검수·이의 처리 SOP
담당 전문 에이전트: marketing-operations
현재 문제: 업체가 페이지를 등록·인수·수정하고 관리자가 사업자·담당자·필드·사진을 검수하는 실제 운영 절차와 책임 경계가 없다.
사업적 목적: 업체의 정확한 자사 정보 입력을 유도하면서 무권한 편집·과장·사진 권리·폐업·분쟁을 통제한다.
근거 문서: ADR-016, BIZ-002, BE-005, MKT-009, docs/06_관리자페이지기획.md, docs/09_운영정책.md
선행 작업: BIZ-002·BE-005·MKT-009 DONE 및 PM 통합 판정
후속 작업: OPS-010 기준 문서 현행화, BE-006·FE-008 구현 계약, QA-003 E2E
수정 허용 경로: ops/reports/OPS-008-provider-verification-sop.md
수정 금지 경로: 그 외 모든 파일, 외부 업체 연락, 제품·DB·법률 문서·환경변수·패키지, CHG-A~C
예상 변경 파일: ops/reports/OPS-008-provider-verification-sop.md 1개
공통 파일 변경 필요 여부: 아니오
다른 작업과 공유하는 계약: registration·business status·ownership·access grant·field review·publication·inquiry 상태를 분리함
구현 범위: 신규 등록/기존 페이지 소유권/사업자 상태/담당자 관계/직접 입력/사진 동의/관리자 13개 큐/승인·반려·보완·회수·이의·폐업·최근성 재확인/감사 기록/SLA 제안
구현하지 않을 범위: 실제 업체 연락·외부 게시, 법률 문서 확정, 사업자 API 호출, 제품·DB 구현, SLA 공개 약속
완료 조건: 역할별 입력·증빙·결정·상태·사유·기록·에스컬레이션과 10개 이상 운영 시나리오, 개인정보 최소화, 승인 게이트가 완전함
검증 방법: BE-005 상태 전이·RLS 요구와 일치 검사, 권한 우회·철회·분쟁·폐업 시나리오 점검
실행할 테스트: 운영 체크리스트·큐 누락·개인정보 접근 역할 정적 검사
위험요소: 사업자 상태 확인만으로 담당자 권한을 승인하거나 업체 제출을 즉시 공개할 위험
롤백 방법: 보고서 1개 제거
사용자 승인 필요 여부: 아니오(내부 SOP안); 개인정보·보유기간·실제 SLA·외부 연락은 D-24·D-26 승인 필요
권장 브랜치명: docs/ops-008-provider-verification-sop
현재 상태: DONE (PM·독립 reviewer 검수 PASS; 실제 개인정보 수집·외부 연락은 D-24·D-26 승인 대기)
```

## QA-010

```text
작업 ID: QA-010
작업명: NAVER 의존성 전수 감사·대체 분류
담당 전문 에이전트: quality-security
현재 문제: 문서·코드·운영계획 곳곳에 NAVER 블로그·지역검색·플레이스 기반 발견·검증·후기·추천 흐름이 남아 있다.
사업적 목적: NAVER를 사업 데이터 원천에서 제외해도 서비스 전략과 실행 순서가 모순 없이 유지되도록 영향 범위를 확정한다.
근거 문서: AGENTS.md, docs/**, ops/**, backend/**, 공개 HTML·JS, QA-007·QA-009
선행 작업: QA-009 DONE, 사용자 NAVER 비의존 방향 제시
수정 허용 경로: ops/reports/QA-010-naver-dependency-inventory.md
수정 금지 경로: 그 외 모든 파일, 제품 코드, 데이터, backend/data, DB, 환경변수, 패키지, CHG-A~C
공유 계약: 현재 4,960건은 공개 검증 업체가 아니라 출처 재확인이 필요한 후보 데이터로 취급한다.
구현 범위: NAVER 의존 문서·코드·산출물·운영·표시를 전수 목록화하고 삭제/공공데이터/업체입력/사용자제보/자체콘텐츠/외부API보조/사용자결정으로 분류한다.
구현하지 않을 범위: 파일 삭제·수정, 데이터 변환, API 호출, 법률 자문 확정, 배포
완료 조건: 실제 경로·라인·기능 영향·대체 분류·중단 우선순위·중복 항목이 재현 가능하게 기록된다.
검증 방법: rg 전수 검색, 데이터 로더·빌드·문서 교차 대조
실행할 테스트: 읽기 전용 정적 검색과 목록 중복 검사
위험요소: 과거 보고서까지 현재 계획으로 오인하거나 NAVER 문자열만 제거해 실제 데이터 계약을 놓칠 위험
롤백 방법: 보고서 1개 제거
사용자 승인 필요 여부: 아니오(읽기 전용); 삭제·격리·전략 확정은 별도 승인
현재 상태: DONE (PM 검수 PASS; 의존성 48개·대체 분류·중단 순서 재현)
```

## BIZ-002

```text
작업 ID: BIZ-002
작업명: NAVER 비의존 초기 사업·서비스 전략
담당 전문 에이전트: business-product
현재 문제: 초기 정보 플랫폼 방향과 전국 가족행사 범위는 유지해야 하지만 데이터 확보·검증·수익화 순서를 새 원천에 맞춰 재설계해야 한다.
사업적 목적: 공공데이터 후보, 업체 직접 입력, 관리자 검수, 자체 후기·콘텐츠, 비교·견적 문의로 1차 시장을 검증한다.
근거 문서: docs/01, 03, 04, 07, 10, 12, 99; QA-009; 사용자 확정 방향
선행 작업: 사용자 NAVER 비의존 방향 제시
수정 허용 경로: ops/reports/BIZ-002-no-naver-business-strategy.md
수정 금지 경로: 그 외 모든 파일과 제품·데이터·DB·가격·외부 실행
공유 계약: 전국 범위 유지, 초기 실행은 서울 돌잔치, 전환 종점은 비교·견적 문의, 예약·결제·에스크로·정산은 후속 보류다.
구현 범위: 초기 서비스 범위, 역할별 가치, 4,960건 후보 재정의, 신뢰 단계, 서울 우선 검증, 전국 확장, 단계별 수익모델과 90일 실행계획을 설계한다.
구현하지 않을 범위: 가격·수수료 확정, 실제 영업·게시·배포, 제품·DB 구현
완료 조건: 16개 요청 업무의 사업 소유·선후관계·완료 지표와 30/60/90일 계획이 있다.
검증 방법: 기존 의사결정·기능·운영 문서와 모순 검사, 미확정 주장의 공개 금지 확인
실행할 테스트: 문서 매트릭스와 사용자 결정 항목 검사
위험요소: 전국 범위를 초기 실행 범위로 오인하거나 후속 거래 기능을 현재 약속으로 되돌릴 위험
롤백 방법: 보고서 1개 제거
사용자 승인 필요 여부: 아니오(설계); 최종 전략·수익모델·외부 실행은 별도 승인
현재 상태: DONE (PM 검수 PASS; ADR-016 사업 경계로 통합)
```

## BE-005

```text
작업 ID: BE-005
작업명: 공공데이터·업체 검증·자동 갱신 구조 설계
담당 전문 에이전트: backend-data
현재 문제: 공공데이터 발견부터 업체 소유권·사업자 상태·직접 입력·관리자 검수·최근 확인일까지 연결되는 데이터 계약이 없다.
사업적 목적: 가격·전화·이미지가 없는 후보를 완성 업체처럼 노출하지 않고 신뢰 수준과 출처를 필드 단위로 관리한다.
근거 문서: docs/05, 09, 11, 기존 Supabase 001~005, QA-002·QA-009, 사용자 신뢰 단계
선행 작업: QA-002·QA-009 DONE, 사용자 NAVER 비의존 방향 제시
수정 허용 경로: ops/reports/BE-005-public-data-verification-architecture.md
수정 금지 경로: 그 외 모든 파일, SQL·DB·API·수집기·원본 데이터·환경변수·패키지·CHG-A~C
공유 계약: 4,960건은 후보 데이터이며 출처·허락·영업 상태·업체 제출·사업자 확인·관리자 검수·최근 확인일을 분리한다.
구현 범위: 공공데이터 허락·출처, 중복/폐업/주소 탐지, 행사 가능 분류, 소유권, 사업자 상태, 표준 필드, 사진 동의, 검수, 자체 후기, 견적, 신뢰 상태, 자동 갱신 구조를 설계한다.
구현하지 않을 범위: 실제 공공데이터 수집, 사업자 API 호출, DB 마이그레이션, 데이터 삭제·정정, 운영 권한 사용
완료 조건: 데이터 원천·필드·상태 전이·실패 처리·수동 검수·갱신 주기·최소 공개 조건·향후 구현 작업 분리가 완전하다.
검증 방법: 기존 스키마·정적 데이터·화면 계약 대조, 존재 경로만 근거로 사용
실행할 테스트: 스키마 매핑 정적 검사, 상태 전이·중복·최근성 시나리오 점검
위험요소: 공공데이터 등록을 사업자·행사 가능·관리자 검수 완료로 오인할 위험
롤백 방법: 보고서 1개 제거
사용자 승인 필요 여부: 아니오(설계); 운영 DB·외부 API·사업자 조회는 별도 승인
현재 상태: DONE (PM 검수 PASS; 제품·DB 변경 없는 논리 구조 설계)
```

## MKT-009

```text
작업 ID: MKT-009
작업명: 서울 돌잔치 업체 확보·콘텐츠 운영 전략
담당 전문 에이전트: marketing-operations
현재 문제: NAVER 후기 취합 없이 초기 업체와 자체 콘텐츠·후기를 확보할 구체적 운영 방식이 필요하다.
사업적 목적: 서울 돌잔치에서 업체 등록·소유권 신청·정확한 정보 입력과 사용자 견적 문의를 먼저 검증하고 전국·행사별로 확장한다.
근거 문서: docs/06, 07, 08, 09, 12, MKT-008, 사용자 확정 방향
선행 작업: MKT-008 DONE, 사용자 NAVER 비의존 방향 제시
수정 허용 경로: ops/reports/MKT-009-provider-acquisition-operations.md
수정 금지 경로: 그 외 모든 파일, 외부 게시·업체 연락·가격 확정·제품·DB·환경변수
공유 계약: 가짜 활동·미확정 가격·예약·결제·에스크로·정산 약속을 만들지 않는다.
구현 범위: 업체 입점 유도, 서울 돌잔치 90일 검증 큐, 자체 콘텐츠·자체 후기·예약 확인 후기의 단계적 기준, 운영 인력·지표·전국 확장 게이트를 설계한다.
구현하지 않을 범위: 실제 업체 연락, 광고 집행, 외부 게시, 가격·수수료 확정, 예약 확인 시스템 구현
완료 조건: 대상군·제안 가치·접촉 전 준비물·등록 전환·검수·콘텐츠 일정·지표·중단 기준이 있다.
검증 방법: 기존 운영·마케팅 문구와 중복·과장 검사, BIZ/BE 입력 계약 요구사항 명시
실행할 테스트: 운영 시나리오와 공개 문구 금지 목록 검사
위험요소: 무료 입점을 유료상품처럼 약속하거나 자체 후기 기반이 없는 상태에서 신뢰를 과장할 위험
롤백 방법: 보고서 1개 제거
사용자 승인 필요 여부: 아니오(설계); 외부 연락·게시·비용은 별도 승인
현재 상태: DONE (PM 검수 PASS; 외부 연락·게시·비용·제품 변경 없음)
```

## QA-007

```text
작업 ID: QA-007
작업명: 외부 후기 수집·공개 준수 기준선 감사
담당 전문 에이전트: quality-security
현재 문제: 네이버 검색 API 메타데이터 수집 코드와 공개 산출물이 있으나 현행 약관·보관·가공·표시·삭제 요청 기준의 준수 여부가 하나의 재현 가능한 보고서로 확정되지 않았다.
사업적 목적: 초기 정보 플랫폼이 외부 후기를 원문 복제·전체 평점·추천 순위처럼 오인시키지 않도록 공개 가능 범위를 정한다.
근거 문서: docs/11_크롤링및데이터관리.md, docs/09_운영정책.md, docs/99_의사결정기록.md ADR-014~015, ops/RISKS.md R-27~R-31
선행 작업: 없음
수정 허용 경로: ops/reports/QA-007-external-review-compliance.md
수정 금지 경로: 그 외 모든 파일, 제품 코드, backend/data, DB, 환경변수, 패키지, CHG-A~C
공유 계약: 외부 후기·이용자 제보·업체 제공·운영 확인을 분리하고 원문·이미지·개인정보를 재게시하지 않는다.
구현 범위: 현재 수집 코드·정적 공개 산출물·현행 공식 정책을 읽고 수집 필드, 저장, 가공, 공개 표시, 삭제·중지 조건을 증거와 함께 판정한다.
구현하지 않을 범위: 크롤러/API 실행, 키 사용, 데이터 재수집·수정, 법률 자문 확정, 제품 수정
완료 조건: 파일·라인·공식 URL 근거, 재현 명령, 허용/보류/금지 매트릭스, D-15 영향, PASS/REVISION_REQUIRED/BLOCKED 판정이 있다.
검증 방법: 수집기와 공개 데이터 로더의 필드 흐름 대조, 공식 문서 교차 확인, 표본 정적 검사
실행할 테스트: rg 기반 코드·필드 추적, 공개 산출물 표본, 비밀·개인정보 비노출 확인
위험요소: 약관 해석 불확실성, API 이관·정책 변경, 메타데이터와 파생 정보의 경계
롤백 방법: 보고서 1개만 제거한다.
사용자 승인 필요 여부: 아니오(읽기 전용); 공개 정책 확정은 별도 승인
현재 상태: DONE (PM 검수 PASS; 제품 공개 게이트는 BLOCKED)
```

## QA-008

```text
작업 ID: QA-008
작업명: 홈페이지 행동 경로 준비 상태 감사
담당 전문 에이전트: frontend-design
현재 문제: C안의 검색·계산기·체크리스트·후기 원문·정보 수정·업체 권한·입점·콘텐츠 CTA가 현재 코드에서 실제로 작동하는지 통합 근거가 없다.
사업적 목적: 작동하지 않는 버튼이나 저장되지 않는 입력을 새 홈에 노출하지 않는다.
근거 문서: ops/reports/FE-006-homepage-redesign-beige-platform-c.md, ops/reports/FE-006-homepage-content-structure-v2.md, docs/04_사용자흐름.md
선행 작업: D-14 승인
수정 허용 경로: ops/reports/QA-008-home-action-route-readiness.md
수정 금지 경로: 그 외 모든 파일, 제품 코드, 라우팅, API, DB, 환경변수, 패키지, CHG-A~C
공유 계약: 기존 URL·쿼리·저장 키를 변경하지 않고 실제 경로와 빈 상태까지 확인한다.
구현 범위: C안의 모든 CTA를 현재 HTML·JS·Supabase 경로·테스트 공개 URL과 대조해 준비/부분/부재/차단으로 분류한다.
구현하지 않을 범위: 버튼·페이지·API 신규 구현, 폼 제출, 운영 데이터 쓰기, 로그인 계정 변경
완료 조건: CTA별 화면 문구, 목표 URL, 핸들러, 저장 위치, 인증 조건, 결과 화면, 공개 가능 여부와 FE-006 선행 작업이 기록된다.
검증 방법: 정적 코드 추적, 링크·요소 검색, 공개 페이지 비파괴 확인
실행할 테스트: rg 링크/핸들러 추적, 필요 시 GET 기반 공개 페이지 확인; 제출·변경 금지
위험요소: 배포본과 로컬 차이, localStorage와 Supabase 혼재, 로그인 필요 흐름 미검증
롤백 방법: 보고서 1개만 제거한다.
사용자 승인 필요 여부: 아니오
현재 상태: DONE (PM 검수 PASS; 제품 준비도는 BLOCKED)
```

## MKT-007

```text
작업 ID: MKT-007
작업명: 홈 준비백과·커뮤니티 콘텐츠 매핑 감사
담당 전문 에이전트: marketing-operations
현재 문제: C안 5번에 사용한 제목은 시안용이며 실제 준비백과·커뮤니티 데이터에서 그대로 노출 가능한 콘텐츠와 대표 경로가 확정되지 않았다.
사업적 목적: 가상 게시글·가상 반응 수 없이 현재 콘텐츠만으로 유용한 홈 미리보기를 구성한다.
근거 문서: ops/reports/FE-006-homepage-redesign-beige-platform-c.md, ops/reports/MKT-002-content-quality-audit.md, docs/08_마케팅전략.md
선행 작업: D-14, MKT-002
수정 허용 경로: ops/reports/MKT-007-home-content-mapping.md
수정 금지 경로: 그 외 모든 파일, 콘텐츠 원문, 제품 코드, 라우팅, 데이터, CHG-A~C
공유 계약: 기존 URL을 보존하고 반복 템플릿·근거 없는 수치·법률 확정 표현을 대표 콘텐츠로 선정하지 않는다.
구현 범위: 현재 준비백과와 커뮤니티 데이터를 전수 또는 재현 가능한 방식으로 조회해 홈 노출 후보, 제목, 유형, URL, 제외 이유, 빈 상태 대안을 제시한다.
구현하지 않을 범위: 새 원고 작성, 게시글 수정·게시, canonical·sitemap 변경, 외부 게시
완료 조건: 준비백과·커뮤니티 후보 매트릭스, 실제 URL, 근거 파일·라인, 중복·품질 제외 기준, C안 문구 대체안이 기록된다.
검증 방법: 콘텐츠 데이터와 렌더링 코드 대조, MKT-002 중복 감사 결과 교차 확인
실행할 테스트: rg/정적 데이터 파싱, 링크 존재 확인, 가상 수치·작성자·반응 수 사용 여부 검사
위험요소: 28개 반복 템플릿, 커뮤니티 데이터 부족, 대표 URL 미확정
롤백 방법: 보고서 1개만 제거한다.
사용자 승인 필요 여부: 아니오
현재 상태: DONE (PM 검수 PASS; C안 5번 콘텐츠 준비도는 BLOCKED)
```

## BIZ-001

```text
작업 ID: BIZ-001
작업명: 초기 정보 플랫폼 공개 라벨·공동 편집 정책 명세
담당 전문 에이전트: business-product
현재 문제: 외부 검색 파생 정보, 이용자 수정 제안, 업체 제공 정보, 운영 확인 정보를 어떤 이름과 절차로 공개할지 확정되지 않았고 C안의 일부 행동은 실제 기능보다 넓다.
사업적 목적: 입점 업체가 적은 초기에도 사실·출처·책임 범위를 분명히 하면서 고객과 업체가 안전하게 정보를 보완하는 운영 모델을 확정한다.
근거 문서: docs/99_의사결정기록.md ADR-014~015, ops/reports/QA-007-external-review-compliance.md, ops/reports/QA-008-home-action-route-readiness.md, ops/reports/MKT-007-home-content-mapping.md, D-15~D-20
선행 작업: 사용자 D-15~D-18 승인; D-19·D-20 완료
수정 허용 경로: ops/reports/BIZ-001-information-platform-policy.md
수정 금지 경로: 그 외 모든 파일, 제품 코드, 데이터, API, DB, 라우팅, 환경변수, 패키지, CHG-A~C
공유 계약: 외부 검색 파생 정보·이용자 제보·업체 제공·운영 확인을 분리하고, 검수 전 정보와 가상 활동을 공개 사실로 보이지 않게 한다.
구현 범위: 1차 공개 정보원, 라벨, 금지 표현, 사용자 수정 제안, 업체 권한·입점, 변경 이력, 신고·이의·삭제 요청, 홈 행동별 공개 가능 상태를 정책 매트릭스로 명세한다.
구현하지 않을 범위: 법률 자문 확정, API 계약 체결, 제품·DB 구현, 가격·수수료 결정, 외부 연락·게시
완료 조건: D-15~D-20이 모순 없이 반영되고 출처별 허용 필드·검수·공개·수정·회수 절차, C안 13개 행동의 현재/후속 문구, BE-004·OPS-008 입력 계약이 완전하다.
검증 방법: 세 감사 보고서의 수치·차단 조건과 정책 조항을 교차 대조하고 사실·제안·승인을 구분한다.
실행할 테스트: 문서 누락·모순·금지 표현 정적 검사; 제품·외부 테스트 없음
위험요소: 사용자 승인보다 범위를 넓히거나 외부 API의 별도 허락을 정책 문구만으로 대체할 위험
롤백 방법: 보고서 1개만 제거한다.
사용자 승인 필요 여부: 필요(D-15~D-18); D-19·D-20 완료
권장 브랜치명: task/BIZ-001-information-platform-policy
현재 상태: SUPERSEDED (ADR-016·BIZ-002가 NAVER 비의존 공개·공급 정책으로 대체; 실행하지 않음)
```

## FE-007

```text
작업 ID: FE-007
작업명: 운영팀 시작 질문 기반 커뮤니티 초기 화면
담당 전문 에이전트: frontend-design
현재 문제: 현재 preview 31건은 가상 회원 이름·상대 시각·반응 수를 사용해 실제 사용자 활동으로 오인될 수 있지만, 초기 커뮤니티가 완전히 비어 보이지 않게 할 시작 콘텐츠는 필요하다.
사업적 목적: 운영팀이 먼저 유용한 질문과 대화 주제를 제공해 커뮤니티 사용법을 보여주되 가짜 회원 활동으로 위장하지 않는다.
근거 문서: 사용자 2026-07-22 요청, D-19, ops/reports/MKT-007-home-content-mapping.md, R-33
선행 작업: MKT-007 DONE, D-19 완료
수정 허용 경로: community.html, community-list.js, community-post.js, community-post-data.js, community-extra-data.js
수정 금지 경로: 그 외 모든 파일, 공통 CSS/JS, API, DB, 라우팅, 환경변수, 패키지, CHG-A~C
공유 계약: 기존 community.html과 community-post.html?id= URL, Supabase published 조회, 로그인 후 검수 대기 글쓰기·댓글 흐름을 유지한다.
구현 범위: preview를 소수의 고유한 `운영팀 시작 질문`으로 정리하고 운영팀 작성·예시 성격을 목록과 상세에서 알 수 있게 표시한다. 가상 상대 시각·댓글·저장·공감 수를 제거한다. 온라인 published 글이 있으면 실제 글을 우선하며, 없으면 시작 질문을 보여준다.
구현하지 않을 범위: 가짜 회원 프로필·반응 생성, 실제 게시글·댓글 DB 생성, DB·RLS 변경, 디자인 전면 개편, 검색·정렬 기능 구현
완료 조건: 가짜 회원명·상대 시각·반응 수 0, 시작 질문마다 운영팀 표시와 고유한 실용 내용, 온라인 실제 글 우선, 목록·상세·작성 흐름 유지, 허용 경로 외 변경 0
검증 방법: 목록·상세 DOM, 가상 작성자·시간·반응 수 정적 검색, online 0건/실제 글/비구성 분기 확인, 기존 테스트·빌드
실행할 테스트: pnpm test, pnpm build, pnpm test:dist, 목록·상세 390/768/1440px 브라우저 스모크
위험요소: 시작 질문이 실제 회원 글처럼 보이거나 online 글과 중복되고 기존 글쓰기 흐름을 손상할 위험
롤백 방법: 지정된 커뮤니티 5개 파일의 FE-007 변경만 되돌린다.
사용자 승인 필요 여부: D-19 완료; 최종 병합·배포는 별도 승인
권장 브랜치명: task/FE-007-community-starter-content
현재 상태: DONE (PM 검수 PASS; 실제 published 글 우선·운영팀 시작 질문 6건, 배포 별도 승인)
```

## OPS-009

```text
작업 ID: OPS-009
작업명: NAVER 파생 공개 경로 가역적 격리
담당 전문 에이전트: backend-data
현재 문제: 공개 dist에 NAVER 파생 후기·후보 파일이 포함되고 9개 HTML과 홈·목록·상세·비교·문의·소유권·관리자 경로가 이를 실제 업체 정보로 소비한다. 기존 6개 파일 격리안은 `review-coverage.js`를 놓쳤다.
사업적 목적: ADR-016에 따라 NAVER 파생 값을 공개 업체·후기·추천·문의 자격에서 제거하되 로컬 원본과 기존 제품을 가역적으로 보존한다.
근거 문서: ADR-016, QA-010, BE-005, CR-005, R-32·R-35·R-36, D-22·D-27
선행 작업: 사용자 D-22 승인 완료, 2026-07-22 파일 단일 소유권과 정확한 source 변경 경로 확정
후속 작업: QA-012 공개 번들·행동 회귀, 별도 테스트 재배포 승인
수정 허용 경로: scripts/build/prepare-dist.mjs; index.html; venues.html; provider.html; compare.html; inquiry.html; claim.html; venue.html; admin/index.html; admin/providers.html; data.js의 NAVER 파생 병합 블록; scripts/pages/home.js의 NAVER 정본 소비; scripts/pages/venues.js의 전체 0건 준비 상태 문구
수정 금지 경로: 위 이외 전부. 특히 루트 7개 review-*.js, backend/data와 로컬 DB·수집기·원본 데이터 이동/삭제/재가공, 공공데이터 수집, 운영 DB, 환경변수·패키지, CHG-A·CHG-C, CHG-B 기존 변경의 되돌림·확대, 디자인 전면 개편
예상 변경 파일: scripts/build/prepare-dist.mjs, 지정 9개 HTML, data.js, scripts/pages/home.js, scripts/pages/venues.js
공통 파일 변경 필요 여부: 예. 빌드·공개 데이터·사용자 흐름을 공유하므로 다른 FE/BE/라우팅/배포 작업과 병행 금지
공유 계약: 4,960건 legacy_source_hold, 공개 재고·SEO·파일럿 분모 제외, 독립 출처 없는 필드 승계 금지, 명시적 빈/준비 상태
구현 범위: `review-candidates.js`, `review-coverage.js`, `review-venue-candidates.js`, `review-provider-candidates.js`, `review-lifecycle-candidates.js`, `review-lifecycle-verified.js`, `review-local-api-partners.js`의 공개 배포와 참조/소비 제거, 관련 화면 대체 상태, 캐시·dist 검증
구현하지 않을 범위: 로컬 데이터 삭제·수정, 새 데이터 원천, DB 마이그레이션, 업체 화면 재설계, 외부 연락·계약·법률 판단, 배포 자동 실행
완료 조건: source HTML의 7개 파생 script 참조 0, dist의 7개 파생 파일과 미사용 레거시 app.js/venues.js 0, NAVER 파생 URL·병합·표시 0, 관련 9개 HTML과 홈/목록/상세/비교/문의/claim/관리자에 오류·허위 업체 수·죽은 행동 0, 준비백과·커뮤니티 회귀 0, 허용 경로 외 변경 0. 고정 NAVER 지도 편의 링크는 D-28 별도 결정으로 제외
검증 방법: source/dist 파일·해시·참조·URL 전수 검사, 데이터 병합 건수, 390/768/1440px 행동 경로, 비밀·개인정보 검사
실행할 테스트: 승인 시점의 테스트 정본으로 unit/build/dist, rg 공개 참조 0, 브라우저 스모크, 롤백 재현
위험요소: 데이터 로더와 여러 화면의 공통 계약을 건드려 목록 0건·상세 404·문의/claim·관리자 회귀 또는 CHG-B 충돌이 발생할 수 있음
롤백 방법: 승인된 단일 커밋/Worktree를 되돌려 이전 배포로 복귀하고 로컬 원본은 그대로 유지한다.
사용자 승인 필요 여부: D-22와 별도 온라인 미리보기는 승인 완료. 최종 병합·최종 배포는 금지. 로컬 원본 삭제는 D-27 별도이며 현재 금지
권장 브랜치명: task/OPS-009-quarantine-derived-public-data
현재 상태: DONE (구현·PM 로컬 검수 PASS; 최종 배포 금지)
```

## QA-009

```text
작업 ID: QA-009
작업명: NAVER 업체·후기 정보 이용 기준 상세 재검토
담당 전문 에이전트: quality-security
현재 문제: 사용자는 공개 업체 기본 정보 활용은 허용될 수 있다고 판단하지만, QA-007은 NAVER API 결과의 대량 저장·가공·혼합 공개를 보류했다. 사실 정보 자체와 취득·가공 방식의 법적 차이를 더 자세히 설명해야 한다.
사업적 목적: 사용할 수 있는 업체 정보와 사용할 수 없는 취득 방식을 분리해 초기 데이터 전략을 불필요하게 막지 않으면서 약관·저작권·DB·개인정보·표시 위험을 줄인다.
근거 문서: QA-007, docs/11_크롤링및데이터관리.md, NAVER 현행 공식 약관·API HUB 문서, 국가법령정보센터·공공기관 공식 자료
선행 작업: QA-007 DONE
수정 허용 경로: ops/reports/QA-009-naver-information-legal-review.md
수정 금지 경로: 그 외 모든 파일, 제품 코드, 데이터, backend/**, API 키, DB, 환경변수, 패키지, CHG-A~C
공유 계약: 업체명·주소 같은 사실 정보와 NAVER 검색 결과·블로그 표현·파생 추천을 구분하고, 별도 계약 내용을 확인하지 못한 경우 허용으로 추정하지 않는다.
구현 범위: 공식 자료를 사용해 ① 업체 기본 사실 ② NAVER 지역검색 결과 ③ 블로그 제목·요약·URL ④ 후기 요약·분석 ⑤ 대량 저장·DB화 ⑥ 화면 표시·출처 ⑦ 삭제·정정·보관을 각각 허용/조건부/보류/금지로 판정하고 안전한 대체 수집 방식을 제시한다.
구현하지 않을 범위: 법률 자문 확정, NAVER 문의·계약 체결, API 호출·크롤링, 데이터 삭제·재수집, 제품 수정
완료 조건: 공식 URL·확인일·조항 근거, 사실/표현/DB/계약 차이, 현재 코드에 대한 재판정, 최소 준수 설계, D-15·D-18 권고와 비개발자 설명이 있다.
검증 방법: NAVER 공식 약관·API 문서와 법령·공공기관 자료 교차 확인, 현재 저장·공개 흐름과 항목별 대조
실행할 테스트: 공식 링크 유효성, 보고서 주장-근거 매핑, 제품·외부 쓰기 없음
위험요소: 일반 공개 사실을 무조건 금지하거나 반대로 공개 사실이라는 이유만으로 취득 경로·DB 권리를 무시할 위험
롤백 방법: 보고서 1개만 제거한다.
사용자 승인 필요 여부: 아니오(읽기 전용); 최종 공개 정책·데이터 격리·외부 문의는 별도 승인
권장 브랜치명: task/QA-009-naver-information-legal-review
현재 상태: DONE (감사 PASS; 현재 NAVER 파생 공개는 APPROVAL_REQUIRED)
```

## MKT-008

```text
작업 ID: MKT-008
작업명: 준비백과 공개 품질 개선·노출 통제
담당 전문 에이전트: marketing-operations
현재 문제: 기존 28개 글은 반복 문단·같은 날짜·근거 부족으로 전체를 추천 콘텐츠로 공개하기 어렵다.
사업적 목적: 사용자가 사이트에서 바로 도움을 받을 수 있는 핵심 준비 글을 실제 공개 수준으로 만들고, 미완성 글은 노출하지 않는다.
근거 문서: 사용자 2026-07-22 요청, D-20, MKT-002, MKT-007, docs/08_마케팅전략.md
선행 작업: MKT-002·MKT-007 DONE, D-20 완료
수정 허용 경로: blog-data.js, blog.js, ops/reports/MKT-008-article-publication-upgrade.md
수정 금지 경로: 그 외 모든 파일, articles.html, article.html, 공통 CSS/JS, API, DB, 라우팅, 환경변수, 패키지, CHG-A~C
공유 계약: 기존 articles.html과 article.html?slug= URL 형식을 유지하고 검수 완료 글만 목록·관련 글·직접 URL에서 공개한다.
구현 범위: 초기 핵심 글 최소 6개를 중복 없는 실용 원고로 전면 편집하고 공개 상태·검토일·근거 링크를 기록한다. 나머지는 draft로 분류해 목록·관련 글·직접 URL fallback에서 제외한다. blog.js에 공개 상태 필터와 출처·검토일 표시를 구현한다.
구현하지 않을 범위: 미확정 가격·법률 보장·업계 평균 생성, 외부 이미지 사용, canonical·sitemap·라우팅 변경, DB 게시, 28개를 억지로 모두 공개
완료 조건: 공개 글 6개 이상, 글별 고유 본문·핵심·질문·체크리스트·다음 행동, 근거 링크·검토일, 반복 공통 문단 0, draft 비노출, 잘못된 slug가 다른 글로 대체되지 않음
검증 방법: 데이터 파싱, 문단 중복·근거 없는 숫자·확정 법률 표현 검사, 목록·상세·관련 글 DOM, 기존 URL·빌드 검사
실행할 테스트: pnpm test, pnpm build, pnpm test:dist, 공개/draft/없는 slug 브라우저 스모크
위험요소: 출처를 붙였어도 본문이 출처보다 넓거나, draft가 직접 URL로 공개되거나, 모든 글이 다시 같은 형식으로 반복될 위험
롤백 방법: blog-data.js와 blog.js의 MKT-008 변경만 되돌리고 보고서 제거
사용자 승인 필요 여부: D-20 완료; 최종 병합·배포는 별도 승인
권장 브랜치명: task/MKT-008-publishable-articles
현재 상태: DONE (PM 검수 PASS; 공개 6개·draft 22개, 배포 별도 승인)
```

## QA-005

```text
작업 ID: QA-005
작업명: 서브에이전트 오케스트레이션 읽기 전용 시험
담당 전문 에이전트: reviewer 역할의 읽기 전용 서브에이전트
현재 문제: 프로젝트 custom agent 설정과 총괄 PM 루프가 작성됐지만 실제 생성·결과 회수·독립 판정 흐름을 아직 이 저장소에서 시험하지 않았다.
사업적 목적: 제품 작업을 위임하기 전에 범위 통제와 검수 회수가 작동하는지 안전하게 증명한다.
근거 문서: AGENTS.md, .codex/config.toml, .codex/agents/*.toml, ops/PM_ORCHESTRATION.md, ops/FILE_OWNERSHIP.md
선행 작업: TOML 7개 문법·필수 필드 검사 통과
수정 허용 경로: 없음. 읽기 전용
수정 금지 경로: 저장소의 모든 파일
공유 계약: 제품 코드·완료 보고서·CHG-A~C를 변경하지 않는다.
구현 범위: 서브에이전트를 생성해 설정 파일의 역할·범위·승인·충돌·보고 규칙과 PM 실행 루프를 점검하고 PASS 또는 REVISION_REQUIRED로 반환한다.
구현하지 않을 범위: 제품 코드 수정, 기존 작업 실행, Git 브랜치·Worktree·커밋·PR 생성, 외부 실행
완료 조건: 서브에이전트 생성, 필수 문서 읽기, 구조화된 결과 회수, 루트 PM의 범위·근거 검수와 최종 판정이 모두 기록된다.
검증 방법: 서브에이전트 결과의 파일 근거 대조, 전후 Git 상태와 완료 보고서 해시 비교
실행할 테스트: TOML 파싱, read-only 파일 검사, Git 상태 비교
위험요소: 현재 생성 도구가 custom agent 이름 선택 인자를 노출하지 않아 자동 로드 자체는 새 세션에서 추가 확인해야 한다.
롤백 방법: 운영 시험 기록만 제거한다. 제품 파일은 변경하지 않는다.
사용자 승인 필요 여부: 아니오
현재 상태: DONE
```

## QA-002

```text
작업 ID: QA-002
작업명: 정적 업체 데이터 품질 기준선 재현
담당 영역: 품질·보안
현재 문제: docs/02_현재사이트분석.md에 4,960건, 후기 근거 122건, api_collected 4,891건 등의 수치가 있으나 재현 명령·집계 정의·표본 근거가 하나의 검수 보고서로 고정되지 않았다.
사업적 목적: 공개 정책 결정과 검색 안정화 전에 데이터 품질의 객관적 기준선을 확보한다.
근거 문서: docs/00_프로젝트현황.md, docs/02_현재사이트분석.md, docs/05_업체데이터구조.md, docs/12_통합실행계획.md
선행 작업: 없음. 운영 Supabase 데이터는 범위에서 제외한다.
후속 작업: D-01~D-03 결정, FE-002 검색 공개 게이트, BE-001 데이터 API 전환
수정 허용 경로: ops/reports/QA-002-data-quality-baseline.md
수정 금지 경로: 그 외 모든 파일, 특히 review-*.js, data.js, scripts/pages/**, scripts/core/**, admin-schema.sql, migrations/**, package.json, pnpm-lock.yaml
예상 변경 파일: ops/reports/QA-002-data-quality-baseline.md 신규 1개
공통 파일 변경 필요 여부: 아니오
다른 작업과 공유하는 계약: publicDirectoryData의 현재 ID·publicationStatus·officialVerification·지역·행사 태그 의미를 읽기만 하며 변경하지 않는다.
구현 범위: 정적 데이터의 입력 파일, 병합 결과, 전체/부분 합계, ID 중복, 지역·행사·출처·확인 상태·필수 필드·후기 근거·이미지 확인 상태를 읽기 전용으로 재집계하고 명령과 표본을 문서화한다.
구현하지 않을 범위: 데이터 수정, 운영 DB 접근, 공개 자격 결정, 크롤링, API 개발, 제품 코드 수정
완료 조건: 같은 입력에서 다시 계산 가능한 명령·정의·합계가 있고, 부분합이 전체합과 일치하며, 정적 데이터와 운영 미확인을 명확히 구분한다.
검증 방법: 합계 교차검산, ID 중복 검사, 최소 10건의 결정적 표본 대조, 기존 문서 수치 차이 설명
실행할 테스트: 기존 읽기 전용 집계 명령, 필요 시 임시 one-off 명령; 저장소 파일을 생성하는 테스트나 pnpm 의존성 변경은 금지
위험요소: 정적 배열을 운영 데이터로 오인하거나 api_collected를 검증 완료로 해석할 위험
롤백 방법: 신규 보고서 파일 1개만 제거하면 된다. 원천·제품 파일은 변경하지 않는다.
사용자 승인 필요 여부: 아니오
권장 브랜치명: task/QA-002-data-quality-baseline
현재 상태: DONE
```

## MKT-001

```text
작업 ID: MKT-001
작업명: SEO·콘텐츠 공백 기준선 작성
담당 영역: 마케팅·운영
현재 문제: sitemap, 공개 HTML, 기존 준비백과와 마케팅 전략 사이의 색인·메타데이터·지역×행사×의도 콘텐츠 공백이 실행 가능한 목록으로 정리되지 않았다.
사업적 목적: 검증되지 않은 대량 페이지 제작 없이 초기 출시의 검색 기반과 콘텐츠 우선순위를 확정할 근거를 만든다.
근거 문서: docs/01_사업정의.md, docs/02_현재사이트분석.md, docs/08_마케팅전략.md, docs/09_운영정책.md, sitemap.xml, robots.txt
선행 작업: 없음. 공식 도메인 확정이 필요한 변경은 보고서에서 승인 대기로만 분류한다.
후속 작업: D-06 공식 도메인·운영 주체 결정, 검증 콘텐츠 제작, 실제 SEO 메타데이터 작업
수정 허용 경로: ops/reports/MKT-001-seo-content-gap.md
수정 금지 경로: 그 외 모든 파일, 특히 공개 HTML, sitemap.xml, robots.txt, docs/08_마케팅전략.md, 콘텐츠 데이터, 제품 코드, 외부 채널
예상 변경 파일: ops/reports/MKT-001-seo-content-gap.md 신규 1개
공통 파일 변경 필요 여부: 아니오
다른 작업과 공유하는 계약: 전국·8개 가족행사 범위와 서울 돌잔치 초기 우선순위를 유지하며 변경하지 않는다.
구현 범위: 현재 공개 경로·title·description·canonical·OG·JSON-LD·sitemap 포함 여부, 기존 글 주제, 지역×행사×검색 의도 공백을 읽기 전용으로 조사하고 사실/제안/승인 필요를 분리한다.
구현하지 않을 범위: 메타태그 수정, sitemap 변경, 새 공개 페이지·글 작성, 외부 검색엔진 제출, 외부 게시, 광고, 경쟁사 수치의 근거 없는 작성
완료 조건: 현재 경로 인벤토리, 기술 SEO 공백, 기존 콘텐츠 중복, 초기 우선 콘텐츠 후보, 데이터/승인 선행 항목이 표로 정리된다.
검증 방법: 공개 HTML 수와 sitemap 항목 교차 대조, 기존 article/blog 데이터 제목 중복 확인, 8개 행사와 초기 서울 우선순위 대조
실행할 테스트: rg 기반 메타데이터·경로 검사와 읽기 전용 파일 집계; 빌드·제품 테스트 변경 없음
위험요소: 실제 업체 데이터가 부족한 지역·행사를 우선 콘텐츠로 제안하거나 테스트 도메인을 공식 도메인으로 오인할 위험
롤백 방법: 신규 보고서 파일 1개만 제거하면 된다. 공개 사이트와 기존 전략 문서는 변경하지 않는다.
사용자 승인 필요 여부: 아니오
권장 브랜치명: task/MKT-001-seo-content-gap
현재 상태: DONE
```

## QA-004

```text
작업 ID: QA-004
작업명: 기준 문서 수치·정의 일관성 감사
담당 영역: 품질·보안
현재 문제: QA-002 재현 결과가 기존 문서의 서울 업체 수·검증 수와 주소 집계 정의가 부정확함을 확인했고, 일부 문서의 브라우저 테스트 상태도 현재 작업 트리와 다르다.
사업적 목적: D-01~D-03과 안정화 개발이 잘못된 기준 수치에 의존하지 않도록 정정 근거를 한 문서로 고정한다.
근거 문서: ops/reports/QA-002-data-quality-baseline.md, docs/00_프로젝트현황.md, docs/02_현재사이트분석.md, docs/10_개발로드맵.md, docs/12_통합실행계획.md, docs/99_의사결정기록.md
선행 작업: QA-002 DONE
후속 작업: 총괄 PM의 기준 문서 현행화, D-01~D-03 결정
수정 허용 경로: ops/reports/QA-004-baseline-document-consistency.md
수정 금지 경로: 그 외 모든 파일, 특히 docs/**, 제품 코드, 원천 데이터, package.json, pnpm-lock.yaml
예상 변경 파일: ops/reports/QA-004-baseline-document-consistency.md 신규 1개
공통 파일 변경 필요 여부: 아니오
다른 작업과 공유하는 계약: QA-002에서 확정한 입력 해시·집계 정의·수치를 읽기만 하며 변경하지 않는다.
구현 범위: 기준 문서별 기존 주장, 재현값, 오류 원인, 정확한 대체 문구, 영향받는 의사결정·후속 작업을 줄 단위로 정리한다. Playwright 상태 등 현재 작업 트리와 다른 기술 주장도 증거가 있는 범위에서 포함한다.
구현하지 않을 범위: 기존 문서 직접 수정, 정책 결정, 제품 코드·테스트·패키지 변경
완료 조건: 수정 필요 문서·문구·근거·대체안·영향이 완전한 정정 매트릭스로 작성되고 사실 정정과 사용자 결정을 구분한다.
검증 방법: QA-002 해시·수치 대조, 현재 파일 검색, 같은 주장의 문서 간 교차 확인
실행할 테스트: rg 및 읽기 전용 재집계 명령; 저장소 파일 생성·변경 테스트 금지
위험요소: QA-002의 정적 데이터를 운영 DB 기준으로 확대 해석하거나 제안을 확정 정책처럼 바꿀 위험
롤백 방법: 신규 보고서 1개만 제거한다.
사용자 승인 필요 여부: 아니오
권장 브랜치명: task/QA-004-baseline-doc-consistency
현재 상태: DONE (1차 수정 후 PASS)
```

## MKT-002

```text
작업 ID: MKT-002
작업명: 기존 준비백과 콘텐츠 품질·통합 감사
담당 영역: 마케팅·운영
현재 문제: 준비백과 28개 글 전부에 동일 본문 문단 8개가 반복되고 계약 질문 콘텐츠가 쿼리 글과 정적 HTML 두 경로에 중복되어 있다.
사업적 목적: 신규 글을 늘리기 전에 기존 정보 품질·중복·근거를 개선할 우선순위를 확보해 검색 신뢰와 편집 효율을 높인다.
근거 문서: ops/reports/MKT-001-seo-content-gap.md, docs/01_사업정의.md, docs/08_마케팅전략.md, docs/09_운영정책.md, blog-data.js, article-contract-questions.html
선행 작업: MKT-001 DONE
후속 작업: 콘텐츠별 편집 카드, 대표 URL·리디렉션 설계(D-10)
수정 허용 경로: ops/reports/MKT-002-content-quality-audit.md
수정 금지 경로: 그 외 모든 파일, 특히 blog-data.js, 공개 HTML, sitemap.xml, robots.txt, docs/**, 제품 코드, 외부 채널
예상 변경 파일: ops/reports/MKT-002-content-quality-audit.md 신규 1개
공통 파일 변경 필요 여부: 아니오
다른 작업과 공유하는 계약: 전국·8개 행사, 서울 돌잔치 초기 우선순위, 사실·제안·광고 구분 원칙을 변경하지 않는다.
구현 범위: 28개 글의 주제·고유 정보·반복 문단·사실 근거·기준일·내부 링크를 감사하고 유지/보강/통합/보류 후보를 분류한다. 계약 질문 두 경로의 중복 범위와 대표 URL 결정에 필요한 사실을 정리한다.
구현하지 않을 범위: 콘텐츠 원문 수정·삭제, 새 글 작성, canonical·리디렉션 구현, 외부 게시, 검색량·순위 추정
완료 조건: 28개 전수 인벤토리, 반복·중복 근거, 우선순위, 콘텐츠별 권고, 별도 결정이 필요한 URL 항목이 재현 가능한 표로 작성된다.
검증 방법: blog-data.js 읽기 전용 파싱, 제목·문단·섹션·내부 링크 교차 대조, 정적 계약 글 비교
실행할 테스트: 읽기 전용 Node/rg 집계; 빌드·제품 테스트·패키지 변경 없음
위험요소: 글 길이만으로 저품질을 단정하거나 D-10 전 대표 URL을 확정할 위험
롤백 방법: 신규 보고서 1개만 제거한다.
사용자 승인 필요 여부: 아니오
권장 브랜치명: task/MKT-002-content-quality-audit
현재 상태: DONE
```

## OPS-002

```text
작업 ID: OPS-002
작업명: 공개 사업·기능 약속 문구 감사
담당 영역: 마케팅·운영
현재 문제: 공개 `partners.html`에 미확정 Premium 가격·수수료와 미구현 실시간 예약·에스크로·정산이 확정 기능처럼 보이는 문구가 있고, 입점·검수·문의 약속도 운영 E2E와 완전히 대조되지 않았다.
사업적 목적: 초기 공개 전에 이용자와 업체가 가격·기능·검수 수준을 오인할 수 있는 약속을 식별하고 승인 가능한 수정 범위를 만든다.
근거 문서: ops/reports/MKT-001-seo-content-gap.md, docs/02_현재사이트분석.md, docs/03_서비스기능명세.md, docs/07_사업모델.md, docs/09_운영정책.md, docs/99_의사결정기록.md
선행 작업: MKT-001 DONE
후속 작업: D-04·D-09 결정, 공개 문구 최소 수정 작업, 스테이징 기능 E2E
수정 허용 경로: ops/reports/OPS-002-public-claims-audit.md
수정 금지 경로: 그 외 모든 파일, 특히 공개 HTML, docs/**, 제품 코드, 데이터, 외부 채널
예상 변경 파일: ops/reports/OPS-002-public-claims-audit.md 신규 1개
공통 파일 변경 필요 여부: 아니오
다른 작업과 공유하는 계약: 현재 구현/조건부 구현/미구현 판정과 D-04·D-09를 읽기만 하며 변경하지 않는다.
구현 범위: 공개 소개·입점·신뢰·정책 화면의 가격, 수수료, 예약, 결제, 에스크로, 정산, 검수, 문의, 정보 신뢰 주장을 전수 검색해 구현됨/조건부/미확인/미구현/미승인으로 분류하고 근거 파일·문구·위험·추천 담당을 기록한다.
구현하지 않을 범위: 공개 문구 수정·삭제, 가격·수수료 결정, 기능 구현, 법적 문서 확정, 외부 연락·게시
완료 조건: 대상 공개 화면 목록, 줄 단위 주장 매트릭스, 기준 문서·코드 근거, 즉시 위험과 승인 선행 항목, 중복 백로그 판정이 포함된다.
검증 방법: 공개 HTML 전체 문자열 검색, 기준 문서 기능 상태 대조, 관련 버튼·링크의 코드 경로 읽기
실행할 테스트: rg 및 읽기 전용 파일 검사; 빌드·브라우저·제품 코드 변경 없음
위험요소: 마케팅 표현을 실제 보장 기능으로 과대 판정하거나 승인 없이 삭제를 권고할 위험
롤백 방법: 신규 보고서 1개만 제거한다.
사용자 승인 필요 여부: 아니오
권장 브랜치명: task/OPS-002-public-claims-audit
현재 상태: DONE
```

## OPS-005

```text
작업 ID: OPS-005
작업명: 공개 유료·3단계 기능 문구 정정 명세
담당 전문 에이전트: marketing-operations
현재 문제: partners.html, claim.html, 레거시 vendor-dashboard.html에 미확정 가격·수수료·혜택과 미구현 예약·결제·정산 기능이 현재 제공 범위처럼 보인다.
사업적 목적: 이용자·업체 오인을 줄이고 1차 출시 범위를 문의·응답까지로 일치시킨다.
근거 문서: ADR-011, ops/reports/OPS-002-public-claims-audit.md, D-04, D-09
선행 작업: OPS-002 DONE, D-04·D-09 승인 완료
수정 허용 경로: ops/reports/OPS-005-public-copy-spec.md
수정 금지 경로: 그 외 모든 파일, 특히 공개 HTML·JS·CSS·docs/**
공유 계약: 기존 URL과 업체 등록·소유권·문의 흐름은 유지한다.
구현 범위: 세 HTML의 삭제·대체 대상 문구와 정확한 대체안을 작성하고 현재 제공/조건부 제공/향후 검토를 분리한다.
구현하지 않을 범위: 제품 파일 수정, 가격 결정, 예약·결제 구현, 외부 게시
완료 조건: 줄 단위 대상, 정확한 대체 문구, 유지할 기능, 금지 표현, FE 검증 기준이 포함된다.
검증 방법: OPS-002 32개 주장과 현재 HTML 교차 대조
실행할 테스트: rg 기반 읽기 전용 검사
위험요소: 향후 기능을 제공 중으로 오인시키거나 기존 문의 흐름까지 삭제할 위험
롤백 방법: 신규 명세 보고서 1개 제거
사용자 승인 필요 여부: 승인 완료(D-04, D-09)
현재 상태: DONE (2차 수정 후 PASS)
```

## FE-004

```text
작업 ID: FE-004
작업명: 일반·개인정보 문의 접수 경로 최소 구현
담당 전문 에이전트: frontend-design
현재 문제: contact.html이 접수를 약속하고 privacy.html이 이를 권리 요청 창구로 안내하지만 실제 제출 수단이 없다.
사업적 목적: 테스트 공개 단계에서 검증 가능한 최소 문의 채널을 제공한다.
근거 문서: ADR-012, OPS-002, R-22, D-06·D-07 부분 승인
선행 작업: OPS-002 DONE, Netlify Forms 임시 채널 승인
수정 허용 경로: contact.html, contact-success.html
수정 금지 경로: 그 외 모든 파일, 특히 privacy.html, 공통 CSS·JS, API·DB·환경변수·패키지 파일
공유 계약: 기존 contact.html URL과 privacy.html 링크를 유지하고 개인 관리자 이메일을 공개하지 않는다.
구현 범위: 정적 Netlify form, 문의 유형, 최소 연락정보, 관련 URL, 내용, 개인정보 처리 동의, honeypot, 성공 페이지를 구현한다.
구현하지 않을 범위: 이메일/SMS 발송기, 파일 업로드, 로그인, SLA 약속, 법률 문서 수정, 운영 DB 저장
완료 조건: 빌드 결과에서 Netlify가 인식할 정적 폼이 존재하고 필수 필드·동의·성공 경로가 있으며 비밀값이 없다.
검증 방법: 정적 DOM 검사, pnpm test/build/test:dist, 공개 배포 후 UI 확인. 실제 개인정보 제출은 하지 않는다.
실행할 테스트: pnpm test, pnpm build, pnpm test:dist, 브라우저 390/768/1440px 확인
위험요소: 개인정보 과수집, 성공처럼 보이지만 제출되지 않는 폼, 공통 스타일 회귀
롤백 방법: contact.html 이전 마크업 복원과 contact-success.html 제거
사용자 승인 필요 여부: 부분 승인 완료(D-06, D-07); 정식 사업자·SLA는 별도 대기
현재 상태: DONE
```

## FE-005

```text
작업 ID: FE-005
작업명: 미확정 유료·예약·결제 공개 문구 최소 수정
담당 전문 에이전트: frontend-design
현재 문제: 미승인 가격·혜택과 미구현 3단계 기능이 공개 페이지에 남아 있다.
사업적 목적: 현재 제공 범위를 정확히 알리고 테스트 사이트의 공개 약속을 구현 상태와 맞춘다.
근거 문서: ADR-011, OPS-005 결과, OPS-002
선행 작업: OPS-005 DONE
수정 허용 경로: partners.html, claim.html, vendor-dashboard.html
수정 금지 경로: 그 외 모든 파일, 특히 JS·CSS·라우팅·API·DB·환경변수·패키지
공유 계약: 입점, 업체 소유권, 정보 수정, 견적 문의·응답 흐름과 기존 URL을 유지한다.
구현 범위: 가격·수수료·Premium 혜택을 숨기고 예약·결제·에스크로·정산·결제자 후기를 현재 미제공/향후 검토로 명확히 바꾼다.
구현하지 않을 범위: 기능 구현, 디자인 재작성, 가격 확정, 라우팅 삭제
완료 조건: 39,000·10~15%·Premium 혜택 노출이 0이고 미구현 기능을 제공 중으로 읽히는 문구가 없다.
검증 방법: rg 정적 검사, pnpm test/build/test:dist, 공개 배포 확인
실행할 테스트: pnpm test, pnpm build, pnpm test:dist
위험요소: 미래 기능 설명이 다시 현재 약속으로 보이거나 기존 무료 입점 흐름이 약화될 위험
롤백 방법: 세 HTML의 해당 문구만 이전 상태로 복원
사용자 승인 필요 여부: 승인 완료(D-04, D-09)
현재 상태: DONE
```

## OPS-006

```text
작업 ID: OPS-006
작업명: GitHub main·Netlify 테스트 배포
담당 전문 에이전트: root PM
현재 문제: 승인 변경을 사용자가 온라인에서 확인할 수 있도록 원격과 테스트 배포에 반영해야 한다.
사업적 목적: 실제 공개 상태를 기준으로 승인 여부와 후속 수정을 판단한다.
근거 문서: ops/PROJECT_HANDOVER.md, 사용자 온라인 확인 요청
선행 작업: FE-004·FE-005 PASS, pnpm test/build/test:dist PASS
수정 허용 경로: Git 인덱스·커밋과 origin/main push. 제품 커밋과 운영 문서 기준선 커밋을 분리한다.
수정 금지 경로: CHG-A·B 제품 변경, favicon.ico, scripts/tests/browser-smoke.cjs, 운영 DB·Netlify 환경변수
공유 계약: 기존 origin/main과 Netlify 자동 배포를 사용한다.
구현 범위: 승인 파일만 선택 스테이징·커밋, main push, Netlify 배포 응답 확인
구현하지 않을 범위: PR 병합, 운영 DB 변경, 비밀값 변경, 외부 업체 연락
완료 조건: 원격 main에 승인 커밋이 있고 테스트 URL이 새 문구·문의 폼을 제공한다.
검증 방법: git status/log, HTTP·브라우저 확인
실행할 테스트: 배포 전 pnpm test/build/test:dist, 배포 후 QA-006
위험요소: 기존 CHG-A~C 혼입, 자동 배포 실패, 환경변수 노출
롤백 방법: 승인 커밋 revert 후 main push; 데이터 변경 없음
사용자 승인 필요 여부: 온라인 테스트 배포 승인 완료
현재 상태: DONE (커밋 `b837ea9`, origin/main 일치, Netlify 반영 확인)
```

## QA-006

```text
작업 ID: QA-006
작업명: Netlify 공개 화면 다중 뷰포트 검수
담당 전문 에이전트: quality-security
현재 문제: 로컬 통과만으로 실제 자동 배포와 공개 반응형·링크 상태를 증명할 수 없다.
사업적 목적: 사용자가 확인하기 전에 배포 결과의 오인 문구·접수 화면·회귀를 차단한다.
근거 문서: FE-004, FE-005, ops/PROJECT_HANDOVER.md
선행 작업: OPS-006 배포 완료
수정 허용 경로: ops/reports/QA-006-netlify-public-smoke.md
수정 금지 경로: 그 외 모든 파일과 외부 설정
공유 계약: 실제 문의 폼에 개인정보를 제출하지 않는다.
구현 범위: 홈·contact·contact-success·partners·claim·vendor-dashboard 리디렉션을 390×844, 768×1024, 1440×1000에서 확인한다.
구현하지 않을 범위: 운영 로그인·DB 쓰기·실제 문의 제출·Netlify 설정 변경
완료 조건: 새 커밋 배포, 폼 표시, 금지 문구 0, 주요 링크·리디렉션·콘솔 오류 결과가 기록된다.
검증 방법: 공개 DOM·스크린샷·콘솔·HTTP 상태 확인
실행할 테스트: 브라우저 다중 뷰포트 읽기 전용 스모크
위험요소: CDN 지연, 자동 배포 실패, 테스트와 운영 환경 혼동
롤백 방법: 보고서 제거; 배포 문제는 OPS-006 롤백
사용자 승인 필요 여부: 아니오
현재 상태: DONE (D-30 production deploy `6a6b08fdbf620b000895e2c1`; 핵심 경로·레거시 관리자 301·계산기 PC/모바일·전역 noindex 재검수 PASS)
```

## OPS-007

```text
작업 ID: OPS-007
작업명: vendor-dashboard 강제 리디렉션 핫픽스
담당 전문 에이전트: frontend-design (총괄 PM 승인 범위 통제)
현재 문제: /vendor-dashboard.html 정적 파일이 Netlify 301 규칙을 shadowing해 레거시 화면과 JavaScript 오류가 공개된다.
사업적 목적: 레거시 업체 관리 경로를 실제 관리자 업체 관리 화면으로 일관되게 연결하고 공개 콘솔 오류 노출을 차단한다.
근거 문서: ops/reports/QA-006-netlify-public-smoke.md, CR-004, Netlify redirect shadowing 문서
선행 작업: OPS-006 DONE, QA-006 1차 검수 완료, D-13 승인
수정 허용 경로: netlify.toml
수정 금지 경로: 그 외 모든 파일, 특히 _redirects, vendor-dashboard.html, vendor-dashboard.js, admin/**, API·DB·환경변수·패키지 파일
공유 계약: 기존 /vendor-dashboard.html URL을 보존하고 /admin/providers.html로 301 이동하며 관리자 인증 흐름은 변경하지 않는다.
구현 범위: 해당 redirect 블록에 force = true를 추가하고 빌드·응답·브라우저 최종 URL을 검증한다.
구현하지 않을 범위: 레거시 페이지 삭제·재작성, 관리자 기능 변경, 다른 라우팅 정리, Netlify 환경변수 변경
완료 조건: 무추적 GET이 301과 /admin/providers.html Location을 반환하고 브라우저 최종 URL에서 관리자 로그인 안내가 표시되며 vendor-dashboard.js 오류가 새로 발생하지 않는다.
검증 방법: pnpm build, pnpm test:dist, curl 무추적 응답, 390×844·768×1024·1440×1000 브라우저 재검수
실행할 테스트: pnpm build, pnpm test:dist, QA-006 해당 경로 재실행
위험요소: 잘못된 force 규칙이 관리자 라우팅을 순환시키거나 캐시된 301이 오랫동안 남을 수 있음
롤백 방법: netlify.toml의 force = true 한 줄을 되돌리고 이전 배포로 복귀
사용자 승인 필요 여부: 필요(D-13: 공통 라우팅 변경과 Netlify 테스트 재배포)
현재 상태: DONE (D-13 승인, `netlify.toml` 한 줄 최소 수정, draft `6a62c78790a1d9262eab53d3`, 총괄 PM·독립 QA PASS, production 미배포)
```

## FE-006

```text
작업 ID: FE-006
작업명: 행동 중심 정보·공동 편집 홈페이지 개편
담당 전문 에이전트: frontend-design
현재 문제: 홈이 12개 독립 섹션과 10,257px 모바일 길이로 분산돼 첫 행동이 늦고, 입점 업체와 즉시 문의가 충분하다는 전제가 초기 정보 플랫폼 운영모델과 맞지 않는다.
사업적 목적: 방문자가 행사 조건으로 독립 출처와 검수 상태가 있는 업체를 찾고, 준비 도구를 사용하고, 고객 제보 또는 업체 권한 요청으로 정보 품질을 함께 높이게 한다.
근거 문서: ops/reports/FE-006-homepage-redesign-beige-platform-c.md, ops/reports/FE-006-homepage-content-structure-v2.md, docs/99_의사결정기록.md ADR-015~016, QA-010, BIZ-002, BE-005, MKT-009
선행 작업: D-22, BIZ-003, QA-011, OPS-008, BE-006/FE-008의 검수 projection·실제 연결 경로
수정 허용 경로: index.html, styles/pages/home.css, scripts/pages/home.js
수정 금지 경로: 그 외 모든 파일, 특히 공통 토큰·공통 CSS/JS, provider.html, venues.html, compare.html, partners.html, contact.html, API·DB·라우팅·환경변수·패키지 파일, CHG-A~C
공유 계약: 기존 URL, 행사·지역·인원 쿼리, 전국·8개 행사, 계산기·체크리스트·가이드·커뮤니티·업체 신청 경로를 유지한다. NAVER 파생 후보를 사용하지 않고 공공 후보·업체 제출·사업자 확인·관리자 검수·최근성을 섞지 않으며 죽은 버튼을 만들지 않는다.
구현 범위: 상단 메뉴, 바로 업체 찾기, 행사별 빠른 시작, 승인된 출처의 업체 정보 또는 빈 상태, 준비 도구, 검수 콘텐츠 또는 빈 상태의 준비백과·정보 나눔, 실제 경로가 준비된 참여 행동만으로 홈을 재구성하고 승인된 C안의 시각 언어와 반응형을 홈 전용 파일에서 구현한다.
구현하지 않을 범위: 고객 수정 제안·업체 권한 승인 기능 자체의 신규 구현, 하위 화면 개편, 추천·평점 알고리즘, 공통 디자인 토큰 변경, 업체 데이터/API/DB 변경, 예약·결제 기능, 생성 시안 이미지를 운영 자산으로 직접 사용
완료 조건: 6개 행동 영역·상단 메뉴, 모든 CTA의 실제 경로 존재, 정보 출처 라벨 구분, 인기·평점·즉시 견적 과장 0, 기존 기능·링크 보존, 3개 뷰포트 가로 넘침 0, 모바일 첫 CTA·전체 길이 개선, 허용 경로 외 변경 0
검증 방법: DOM·링크·쿼리 계약 검사, 전후 모바일 높이 비교, 키보드 탐색, 브라우저 다중 뷰포트, 기존 빌드·배포 산출물 검사
실행할 테스트: pnpm test, pnpm build, pnpm test:dist, 390×844·768×1024·1440×1000 브라우저 스모크
위험요소: NAVER 후보를 검수 업체처럼 재사용, 작동하지 않는 수정 CTA, 업체 제공·사업자 확인·관리자 검수 혼동, 기존 동적 렌더링 ID 삭제, 이미지 사용권, 모바일 카드 과밀, CHG-B 범위 침범
롤백 방법: 세 허용 파일만 이전 커밋 상태로 복원하며 데이터·DB 변경은 없다.
사용자 승인 필요 여부: D-14 완료; D-22·D-25와 후속 구현/배포 승인 필요
현재 상태: SUPERSEDED (초기 안전 홈 구현은 FE-009로 재구성; 완전한 업체·참여 기능은 BE-006·FE-008 후 별도 확장)
```

## BIZ-005

```text
작업 ID: BIZ-005
작업명: 운영자 선등록형 출시·수익 준비 모델 확정
담당 전문 에이전트: business-product (marketing-operations·quality-security 읽기 전용 검토 참여)
현재 문제: 업체가 스스로 등록할 때까지 기다리는 구조만으로는 출시 직후 검색할 정보가 부족하고, 반대로 출처·권리·최근성 확인 없이 운영자가 업체 정보를 채우면 오정보·저작권·개인정보 위험이 생긴다.
사업적 목적: 운영자가 확인 가능한 최소 업체 정보를 먼저 등록해 고객이 출시 첫날부터 검색·비교·준비 도구를 사용할 수 있게 하고, 업체 소유권 수정과 고객 정정 제보로 품질을 높이며, 과장 없는 수익 실험의 기반을 마련한다.
근거 문서: 사용자 2026-07-24 결정, ADR-016, BIZ-003, QA-011, OPS-008, D-23~D-25, docs/00·01·03·04·05·07·09·12·99
선행 작업: BIZ-003·QA-011·OPS-008·BIZ-004·QA-015 DONE
수정 허용 경로: ops/reports/BIZ-005-operator-seeded-launch-model.md, ops/handoffs/BIZ-005.md, ops/TASK_SPECS.md, ops/ACTIVE_WORK.md, ops/PROJECT_BOARD.md, ops/APPROVALS.md, ops/BACKLOG.md, ops/DEPENDENCIES.md, ops/RISKS.md, ops/CHANGE_REQUESTS.md
수정 금지 경로: 제품 HTML·JS·CSS, API·DB·마이그레이션·환경변수·패키지, docs/**(CHG-C 정리 전), 공공데이터 실제 수집, 업체 연락, 외부 게시, 결제·과금 활성화
공유 계약: NAVER 파생 4,960건은 legacy_source_hold로 유지하고 공개 업체로 승계하지 않는다. D-23 원천도 데이터셋별 이용조건을 다시 확인한 뒤 기초 후보 발견·행정 상태 신호로만 사용한다. 업체 제공·운영자 확인·고객 제안의 출처를 분리하고 최근 확인일과 변경 이력을 유지한다.
구현 범위: 운영자 선등록→검수→제한 공개→업체 소유권 신청·정정→고객 오류/이용 정보 제안→재검수의 기준, 최소 공개 필드와 금지 필드, 출시 가능 업체 품질 게이트, 초기 고객 가치, 수익 준비 단계, 문서 반영안과 후속 작업 카드를 확정한다.
구현하지 않을 범위: 실제 업체 레코드 생성, 공공 API 호출·다운로드, 운영 DB 변경, 업체·고객 연락, 가격·수수료 확정, 광고·리드 과금·결제 실행, 법률 문서 확정, 제품 코드 수정, 배포
완료 조건: 운영자·업체·고객·관리자의 역할과 공개 게이트가 명확하고, 출처 없는 사진·가격·평점·후기가 금지되며, 출시 첫날 가치와 수익 준비/과금 승인 경계가 구분되고, 중복 없는 후속 카드와 사용자 승인 항목이 기록된다.
검증 방법: 현재 기준 문서·작업 보고서 교차 대조, 공식 공공데이터·개인정보·저작권 1차 출처 확인, business-product·marketing-operations·quality-security 결과 교차 검수
실행할 테스트: 문서 링크·용어·승인 게이트 정적 점검; 제품 빌드·DB·브라우저 테스트 없음
위험요소: 공개된 사업장 정보라는 이유만으로 자유로운 재사용을 가정하거나, 미확인 업체를 추천·검증 업체처럼 보이게 하거나, 수익모델을 확정 가격처럼 공개할 위험
롤백 방법: 신규 보고서·전달문과 이번 카드의 운영 문서 항목만 제거한다. 기존 제품·데이터는 변경하지 않는다.
사용자 승인 필요 여부: 운영자 선등록형 방향과 정정 구조는 D-32로 승인. 실제 데이터 수집·공개, 외부 연락, 가격·과금, 운영 배포는 별도 승인 필요.
권장 브랜치명: task/BIZ-005-operator-seeded-launch
현재 상태: DONE (1차 독립 검수 보완 후 PASS)
```

## FE-010

```text
작업 ID: FE-010
작업명: 모바일 메뉴 열림·닫힘 접근성 상태명 정리
담당 전문 에이전트: frontend-design
현재 문제: 모바일 공통 메뉴를 연 뒤에도 보조기기 이름이 `메뉴 열기`로 남아 현재 상태와 다음 행동을 잘못 안내한다.
사업적 목적: 모바일 사용자가 메뉴 상태를 정확히 이해하고 키보드·보조기기로 닫기 동작까지 예측할 수 있게 한다.
근거 문서: QA-018, R-49, 승인된 공통 헤더 계약
선행 작업: QA-018 DONE, `scripts/components/header.js` 단일 소유권 확인
수정 허용 경로: scripts/components/header.js, ops/reports/FE-010-mobile-menu-state.md
수정 금지 경로: 그 외 모든 제품 파일, 특히 HTML, 공통 CSS·토큰, 홈 CTA, API·DB·라우팅·환경변수·패키지·CHG-A~C
공유 계약: 기존 `aria-expanded`, `data-menu-open`, 첫 메뉴 링크 포커스, Escape 닫기, desktop 전환 닫기 동작을 유지한다.
구현 범위: 메뉴가 닫혔을 때 `메뉴 열기`, 열렸을 때 `메뉴 닫기`로 토글의 접근성 이름을 갱신한다.
구현하지 않을 범위: 모바일 하단 비교함 노출 정책, 헤더 디자인·링크·구조 변경, 다른 접근성 개선 묶음
완료 조건: 초기·열기·클릭 닫기·Escape 닫기·desktop 전환 닫기에서 접근성 이름과 aria-expanded가 일치하고 기존 포커스 동작이 유지된다.
검증 방법: 정적 JavaScript 검사, 390px 브라우저에서 상태 전환·키보드 검증, 768·1440px 회귀
실행할 테스트: validate, build, validate-dist, 브라우저 390·768·1440px
위험요소: 숨김 텍스트를 새로 추가해 중복 이름이 생기거나 closeNavigation 경로와 클릭 경로가 불일치할 수 있음
롤백 방법: `scripts/components/header.js`의 접근성 이름 갱신 구간만 되돌린다.
사용자 승인 필요 여부: 아니오
권장 브랜치명: task/FE-010-mobile-menu-state
현재 상태: DONE (PM 통합 검증·독립 QA PASS)
```

## FE-015

```text
작업 ID: FE-015
작업명: 결혼 준비 체크리스트 제목 중복 정리
담당 전문 에이전트: frontend-design
현재 문제: `결혼 준비` 템플릿에 공통 접미사 `준비 순서`를 붙여 `결혼 준비 준비 순서`가 표시된다.
사업적 목적: 행사별 체크리스트 제목을 자연스럽고 신뢰감 있게 보여준다.
근거 문서: QA-018, 공개 5개 행사 분류, scripts/core/checklist-templates.js
선행 작업: QA-018 DONE, 공개 5개 행사 라벨 유지
수정 허용 경로: scripts/pages/checklist.js, ops/reports/FE-015-checklist-title.md
수정 금지 경로: 그 외 모든 제품 파일, 특히 체크리스트 템플릿·저장 키·HTML·CSS, API·DB·라우팅·패키지·CHG-A~C
공유 계약: `kids/parents/meeting/anniversary/other` 5개 ID, 레거시 alias, 체크 상태·메모·사용자 추가 항목 저장 구조를 변경하지 않는다.
구현 범위: `결혼 준비`만 `결혼 준비 순서`로 표시하고 다른 네 행사 라벨은 기존 `${label} 준비 순서` 규칙을 유지한다.
구현하지 않을 범위: 체크리스트 항목·단계·레이아웃·저장 정책·행사 분류 변경
완료 조건: 5개 행사 제목이 각각 자연스럽고 `준비 준비` 중복 0건이며 저장된 체크 상태가 유지된다.
검증 방법: 정적 JavaScript 검사, 5개 행사 선택 제목·저장 상태 브라우저 회귀
실행할 테스트: validate, build, validate-dist, 브라우저 390·768·1440px
위험요소: 라벨 문자열에 강하게 결합해 향후 이름 변경 시 재발할 수 있음
롤백 방법: `scripts/pages/checklist.js` 제목 계산 한 구간만 되돌린다.
사용자 승인 필요 여부: 아니오
권장 브랜치명: task/FE-015-checklist-title
현재 상태: DONE (PM 통합 검증·독립 QA PASS)
```

## FE-016

```text
작업 ID: FE-016
작업명: 로그인 화면 업체 등록 메뉴 목적지 통일
담당 전문 에이전트: frontend-design
현재 문제: 대부분의 공통 헤더는 업체 등록 메뉴를 `provider-register.html`로 보내지만 로그인 화면만 `provider-join.html`로 보내 일관성이 깨진다.
사업적 목적: 어느 화면에서든 업체 등록을 누르면 같은 신청 시작점으로 이동하게 한다.
근거 문서: QA-018, 현재 공개 HTML 링크 전수 검색, 사용자 승인 공통 메뉴
선행 작업: QA-018 DONE, 대표 목적지 `provider-register.html` 정적 대조 완료
수정 허용 경로: login.html, ops/reports/FE-016-provider-registration-link.md
수정 금지 경로: 그 외 모든 제품 파일, 특히 provider-join.html, provider-register.html, 공통 헤더 JS·CSS, API·DB·라우팅·패키지·CHG-A~C
공유 계약: `provider-join.html` 소개 페이지와 `provider-register.html` 신청 페이지 URL은 모두 유지한다. 이번 작업은 로그인 헤더 링크 한 곳만 통일한다.
구현 범위: login.html의 `업체 등록` 메뉴 href를 `provider-register.html`로 변경한다.
구현하지 않을 범위: 업체 등록 흐름·문구·디자인·리디렉션·URL 삭제
완료 조건: 로그인 화면의 업체 등록 링크가 신청 페이지로 이동하고 다른 인증·회원가입 동작과 헤더 링크가 회귀하지 않는다.
검증 방법: HTML 정적 검사, 로그인 화면 링크 클릭과 최종 URL 브라우저 검증
실행할 테스트: validate, build, validate-dist, 브라우저 390·768·1440px
위험요소: 소개 페이지를 의도한 유입 경로가 줄 수 있으므로 `provider-join.html` 자체는 유지한다.
롤백 방법: login.html 한 href를 이전 값으로 되돌린다.
사용자 승인 필요 여부: 아니오
권장 브랜치명: task/FE-016-provider-registration-link
현재 상태: DONE (PM 통합 검증·독립 QA PASS)
```

## OPS-012

```text
작업 ID: OPS-012
작업명: 도메인 구매 전 출시·연결 준비 확정
담당 전문 에이전트: root PM (marketing-operations·quality-security 기준 적용)
현재 문제: 공식 도메인이 없고 테스트 호스트는 noindex 상태이며, Netlify 도메인·DNS·HTTPS, Supabase Auth Site URL, canonical·OG·sitemap, production 승인 순서가 한 문서로 정리되지 않았다.
사업적 목적: 사용자가 도메인을 구매한 뒤 시행착오 없이 연결하고, 테스트 사이트의 noindex가 정식 서비스에 남거나 로그인 링크가 잘못된 호스트로 가는 출시 사고를 막는다.
근거 문서: BIZ-005, D-06·D-10·D-30·D-31, R-11·R-17·R-53, Netlify·Supabase 공식 문서, 현재 netlify.toml·_headers·robots.txt·sitemap.xml·공개 HTML·Auth 코드
선행 작업: BIZ-005 PASS, FE-010·FE-015·FE-016 PASS
수정 허용 경로: ops/DOMAIN_LAUNCH_CHECKLIST.md, ops/reports/OPS-012-pre-domain-launch-readiness.md, ops/handoffs/OPS-012.md, ops/TASK_SPECS.md, ops/ACTIVE_WORK.md, ops/PROJECT_BOARD.md, ops/BACKLOG.md, ops/DEPENDENCIES.md, ops/APPROVALS.md, ops/RISKS.md, ops/RELEASE_CHECKLIST.md
수정 금지 경로: 제품 HTML·JS·CSS, netlify.toml·_headers·_redirects·robots.txt·sitemap.xml, API·DB·마이그레이션·환경변수·패키지, docs/**, GitHub main, Netlify production, Supabase 운영 설정
공유 계약: 현재 고유 draft와 production 별칭은 noindex 테스트 환경으로 유지한다. 실제 도메인·canonical·대표 host는 사용자가 도메인을 선택한 뒤 D-10/D-30으로 확정한다.
구현 범위: 현재 파일·설정 기준선, 도메인 구매 전 완료 항목, 구매 직후 Netlify/DNS/HTTPS/Supabase/SEO/보안 적용 순서, 검증·롤백, 담당자와 사용자 입력값, 로컬 격리 E2E 가능성, 출시 차단 항목을 문서화한다.
구현하지 않을 범위: 도메인 검색·구매·등록·비용, DNS 변경, custom domain 추가, 환경변수 수정, canonical·OG 제품 구현, production 배포, 운영 DB·개인정보·외부 게시
완료 조건: 사용자가 구매할 정보와 구매 후 순서가 분리되고, apex/www·HTTPS·Supabase Site URL/redirect·noindex→index·canonical/OG/sitemap·QA·rollback을 빠짐없이 포함하며 현재 차단 항목과 담당자가 명확하다.
검증 방법: 현재 저장소 정적 대조, Netlify·Supabase 공식 문서 확인, 파일·URL·환경별 상태표 검수
실행할 테스트: rg·정적 파일 검사. 제품 빌드는 FE 세 작업 통합 결과를 참조하고 외부 설정 변경 없음
위험요소: 실제 도메인 없이 canonical을 미리 확정하거나 테스트 noindex를 production에 남기거나 Auth redirect를 누락할 위험
롤백 방법: 신규 문서와 운영 문서 상태 항목만 제거한다. 외부 설정과 제품은 변경하지 않는다.
사용자 승인 필요 여부: 문서 준비는 아니오. 도메인 구매·등록·DNS·custom domain·main·production은 필요.
권장 브랜치명: task/OPS-012-pre-domain-readiness
현재 상태: DONE (공식 문서·현재 저장소 대조 및 독립 검수 PASS)
```

## BE-006

```text
작업 ID: BE-006
작업명: 운영자 선등록 source·assertion·public projection 상세 계약
담당 전문 에이전트: backend-data
현재 문제: 공공데이터 후보, 운영자 작성 초안, 업체 직접 제출, 고객 정정 제안, 사업자·소유권 확인, 필드별 검수·최근성, 공개 화면 투영을 현행 001~005 마이그레이션에 어떻게 안전하게 연결할지 상세 계약이 없다.
사업적 목적: 운영자와 AI가 업체 초안을 효율적으로 만들되, 출처가 확인된 승인 필드만 공개하여 고객에게 쓸모 있는 정보와 업체 정정권을 함께 제공한다.
근거 문서: BIZ-003, QA-011, OPS-008, BIZ-004, QA-015, BIZ-005, D-23~D-25, D-32, migrations/001~005, docs/05_업체데이터구조.md, docs/06_관리자페이지기획.md, docs/09_운영정책.md
선행 작업: BIZ-003·QA-011·OPS-008·BIZ-004·QA-015·BIZ-005 DONE, D-23~D-25·D-32 승인
후속 작업: BE-007 격리 로컬 seed 도구 → QA-019 안전 게이트 → 실제 데이터 활용 승인 → OPS-013 첫 20곳 운영 검수
수정 허용 경로: ops/reports/BE-006-source-assertion-projection-contract.md
수정 금지 경로: 그 외 모든 파일, SQL·마이그레이션·admin-schema.sql, 제품 HTML·JS·CSS, API·DB·RLS·RPC·Storage·환경변수·패키지, docs/**, backend/data, 실제 데이터 수집·저장·외부 연락·배포, CHG-A~C
공유 계약: 기존 NAVER 파생 4,960건은 legacy_source_hold로 공개·추천·문의에서 제외한다. D-23 원천, D-24 증빙·개인정보, D-25 라벨·최근성, D-32 운영자 초안 원칙을 훼손하지 않는다.
구현 범위: 현행 001~005 구조의 읽기 전용 매핑, source·terms·candidate·provider identity·field assertion·revision·business status·ownership·grant·media·audit·public projection·freshness·retention 계약, 역할·RLS 기대값, 공개 화이트리스트, BE-007 입력·오류 형식, additive delta 순서·롤백·E2E 기준을 문서화한다.
구현하지 않을 범위: SQL·스키마·RLS·RPC·Storage 구현, 공공데이터 호출·다운로드, 실제 업체 레코드·증빙·사업자번호 처리, 제품 화면·관리자 화면·업체 연락·배포
완료 조건: 원천 관측값이 공개 정보를 직접 덮어쓰지 않고 승인된 assertion만 public projection에 반영되는 계약, 후보·사업자·소유권·정보 검수 상태의 분리, D-24·D-25의 재현 가능한 규칙, BE-007이 새 계약을 만들지 않고 구현 가능한 입력·검수·오류 계약이 모두 정의된다.
검증 방법: 근거 보고서·승인 결정·현행 SQL 001~005와 교차 대조하고, 대표 등록·정정·업체 인수·최근성 만료·출처 철회 시나리오를 추적한다.
실행할 테스트: 문서 계약 completeness·state transition·public whitelist·deny-by-default·rollback 정적 검토와 독립 reviewer 검수
위험요소: 운영자/AI 초안이 검증 정보로 오인되거나 관측값이 승인 필드를 자동 덮어쓰는 위험, 기존 스키마를 실제 구현된 계약처럼 과장하는 위험
롤백 방법: 신규 보고서와 운영 문서 상태 항목만 제거한다. 제품·DB·수집 데이터는 변경하지 않는다.
사용자 승인 필요 여부: 문서 계약 작성은 아니오. 실제 데이터 수집·저장·공개, DB 변경, 업체 연락은 별도 승인 필요.
권장 브랜치명: task/BE-006-source-assertion-projection
현재 상태: DONE (2차 보완 후 독립 reviewer PASS)
```

## BE-007

```text
작업 ID: BE-007
작업명: 격리 로컬 업체 후보 seed 배치 검수 도구
담당 전문 에이전트: backend-data
현재 문제: 운영자와 AI가 업체 초안을 만들기 전, 승인 원천·이용조건·허용 필드·중복·개인정보·출력 대사를 자동 검사하는 비공개 도구가 없다.
사업적 목적: 실제 첫 업체 배치를 운영 DB나 공개 사이트에 넣기 전에 잘못된 정보·금지 필드·중복·출처 위조를 자동으로 걸러 수작업 부담과 공개 사고를 줄인다.
근거 문서: BE-006, QA-011, BIZ-005, D-23·D-24·D-25·D-32
선행 작업: BE-006 2차 보완 후 독립 reviewer PASS
후속 작업: QA-019 synthetic 안전 게이트 → 실제 데이터 활용 승인 → OPS-013 서울 돌잔치 첫 20곳 비공개 검수
수정 허용 경로: backend/public_data_seed/seed_tool.py, backend/public_data_seed/test_seed_tool.py, backend/public_data_seed/README.md, ops/reports/BE-007-local-seed-tool.md
수정 금지 경로: 그 외 모든 파일, backend/data/**, 기존 NAVER 수집·가공·공개 스크립트, 제품 HTML·JS·CSS, SQL·마이그레이션·API·운영 DB·RLS·RPC·Storage·환경변수·패키지·docs/**, CHG-A~C
공유 계약: BE-006-v1 registry·manifest·JSONL·7개 immutable output·runtime response·15개 이상 고정 오류·24 fixture 계약을 변경하지 않는다. 실제 source data 대신 synthetic fixture만 사용한다.
구현 범위: Python 표준 라이브러리 기반 CLI, 격리 root path 검사, 승인 registry/schema/hash/기간/목적/field map 검사, input hash·dryRun·NAVER·개인정보·사업자번호·금지 필드 차단, 날짜·source key·동일/충돌 중복 처리, 7개 출력 원자적 생성, 합계·hash·collision·멱등 재사용, 안전한 오류 메시지, synthetic 단위 테스트를 구현한다.
구현하지 않을 범위: 네트워크 호출·공공데이터 다운로드, 운영 DB/SQLite 입력, provider 공개 projection, 실제 업체 후보·사업자번호·개인정보·사진·가격·평점·후기, 기존 4,960건 접근·변환, 패키지 추가, 외부 연락·게시·배포
완료 조건: synthetic 정상·금지필드·개인정보·사업자번호·NAVER·만료 terms·path escape·hash 불일치·동일 중복·충돌·빈 배치·output collision·멱등 재실행을 자동 테스트하고, 정상 출력에도 published/verified/inquiryEnabled·가격·평점·후기·사업자번호가 0건이며 7개 파일의 대사가 일치한다.
검증 방법: Python unittest와 임시 격리 작업 폴더를 사용해 CLI exit code·stdout runtime response·파일 집합·schema·hash·counts·오류 코드·원자성·재실행 timestamp 불변을 확인한다.
실행할 테스트: python -m unittest backend.public_data_seed.test_seed_tool, compileall, synthetic CLI dry-run, git diff --check
위험요소: 로컬 초안 bundle이 운영 DB import 파일이나 공개 검증 정보로 오인되거나, 오류에 원문 개인정보가 남거나, 재실행이 기존 결과를 덮어쓰는 위험
롤백 방법: backend/public_data_seed/ 신규 폴더와 BE-007 보고서만 제거한다. 기존 데이터·제품·DB에는 영향이 없다.
사용자 승인 필요 여부: synthetic 로컬 도구 구현은 아니오. 실제 데이터 호출·저장·배치 실행·공개·DB 반영은 별도 승인 필요.
권장 브랜치명: task/BE-007-local-seed-tool
현재 상태: DONE (2차 수정 후 QA-019 PASS, synthetic unittest 14개 PASS)
```

## QA-019

```text
작업 ID: QA-019
작업명: 공공데이터 seed 배치 이용조건·중복·개인정보·권리 안전 게이트
담당 전문 에이전트: quality-security
현재 문제: BE-007 로컬 도구가 계약상 차단 규칙을 구현했지만, 잘못된 registry·입력·중복·개인정보·NAVER lineage·출력 덮어쓰기·공개 오인을 독립적으로 검증하지 않았다.
사업적 목적: 첫 실제 업체 후보를 다루기 전에 자동 등록 과정이 고객과 업체에게 잘못된 정보를 공개하거나 개인정보·권리 문제를 만들지 않는지 확인한다.
근거 문서: BE-006, BE-007, QA-011, D-23~D-25, D-32
선행 작업: BE-006 PASS, BE-007 구현 및 synthetic unittest 9개 PASS 후보
후속 작업: 실제 데이터 활용 승인 → OPS-013 서울 돌잔치 첫 20곳 비공개 검수
수정 허용 경로: ops/reports/QA-019-seed-safety-gate.md
수정 금지 경로: 그 외 모든 파일, BE-006·BE-007 구현·보고서, backend/data/**, 실제 데이터, 제품·DB·API·패키지·docs/**, CHG-A~C
공유 계약: BE-006-v1과 BE-007 파일을 읽기 전용으로 검사한다. 테스트는 synthetic 임시 폴더만 사용하며 운영 DB·네트워크·실제 업체 데이터는 0건이다.
구현 범위: 허용 경로·변경 범위, registry 신뢰·만료·schema/field map, input hash·dry-run, NAVER·사업자번호·개인정보·금지 필드, 날짜·필수 키, 중복·충돌, 빈 배치, 7개 출력·대사·hash·원자성·멱등·collision, 공개/검증/문의/가격/평점/후기 금지, 안전한 오류를 독립 재현하고 PASS/REVISION_REQUIRED/BLOCKED를 판정한다.
구현하지 않을 범위: 도구 수정, 실제 데이터 다운로드·배치, 운영 DB·제품·배포·외부 연락·법률 확정
완료 조건: BE-007 카드의 모든 완료 조건을 독립 재현하고, 금지 입력 원문이 오류·quarantine에 남지 않으며, 정상 bundle이 공개/운영 import로 오인되지 않는 경계와 남은 위험을 보고한다.
검증 방법: 소스·테스트 정적 리뷰, Python unittest 재실행, 추가 synthetic adversarial 사례, output hash·mtime·line count·금지 문자열 검사
실행할 테스트: python -B -m unittest backend.public_data_seed.test_seed_tool, reviewer synthetic mutation, git diff --check(읽기 전용 확인)
위험요소: 테스트가 구현과 같은 가정을 공유해 오류를 놓치거나, JCS·JSON Schema 수동 검증이 실제 승인 schema 변형을 완전히 막지 못하는 위험
롤백 방법: QA-019 보고서와 운영 상태 항목만 제거한다. 제품·도구·데이터는 변경하지 않는다.
사용자 승인 필요 여부: synthetic 검수는 아니오. 실제 데이터 활용·저장·배치·공개는 필요.
권장 브랜치명: audit/QA-019-seed-safety-gate
현재 상태: DONE (2차 수정 최종 재검수 PASS)
```

## OPS-013

```text
작업 ID: OPS-013
작업명: 서울 돌잔치 첫 20곳 공공데이터 비공개 검수 배치
담당 전문 에이전트: marketing-operations + backend-data + quality-security
현재 문제: 사이트에서 공개·비교할 업체가 0곳이라 고객이 도구·콘텐츠 외에 실제 업체 정보를 얻거나 견적 문의로 전환할 수 없다.
사업적 목적: 서울 돌잔치에 집중해 공개 가능한 최소 업체 기반을 만들고, 이후 업체 소유권·정정·문의·수익 검증으로 이어질 첫 공급을 준비한다.
근거 문서: D-23~D-25, D-32, BIZ-005, BE-006, BE-007, QA-019, OPS-008
선행 작업: BE-007·QA-019 DONE, D-33 사용자 실행 승인, 공식 dataset 접근 수단·schema snapshot·PM registry hash pin
후속 작업: 운영자 수동 적합성·출처 검수 → 공개 승인 후보 분리 → 별도 DB/staging/E2E → 제한 공개 → 문의 표본 → BIZ-006 수익 실험 결정
수정 허용 경로: backend/public_data_seed/workspaces/ops013/**, ops/reports/OPS-013-seoul-dol-first20.md
수정 금지 경로: 그 외 모든 파일, backend/data 기존 원본, NAVER 자료·스크립트, 제품 HTML·JS·CSS, SQL·마이그레이션·운영 DB·API·환경변수·패키지·docs/**, CHG-A~C
공유 계약: 행정안전부 D-23 승인 원천 1개부터 사용한다. 서울 소재 조건만 20건 이내로 dry-run하며 eventFitSignal=unknown·match_pending을 유지한다. 사진·가격·평점·후기·개인 연락처·사업자번호·업체 추천·문의 활성화는 만들지 않는다.
구현 범위: 공식 원천·이용조건·schema snapshot 확인, PM registry hash pin, 승인된 파일/API 응답을 격리 workspace에 저장, BE-007 dry-run 실행, 중복·폐업·주소·금지 필드·출처·최근성 검수, 최대 20개 비공개 후보와 제외/격리 이유·재현 hash 보고
구현하지 않을 범위: 업체 연락, 소유권·사업자번호·증빙 수집, 운영 DB 입력, 공개 업체 페이지, 추천 순위, 가격·평점·후기, 견적 발송, 외부 게시, 배포, 과금
완료 조건: 원천·이용조건·schema·hash가 재현되고, 최대 20건의 서울 후보가 accepted/quarantined/excluded로 대사되며, 민감정보·NAVER lineage·공개 flag 0건, 공개 가능 판정은 운영자 별도 검수 대기로 남는다.
검증 방법: BE-007 immutable bundle·QA-019 회귀, official source URL·terms·schema hash, line count·payload hash·중복·행정 상태·서울 주소 대사, 출력 금지 문자열 검사
실행할 테스트: BE-007 CLI dry-run, 14 unittest 회귀, batch 7파일 대사, QA-019 actual-batch read-only spot check
위험요소: 공공데이터 업종이 실제 돌잔치 가능 업체를 뜻한다고 오인하거나, 개인사업자 주소·연락처를 과도하게 노출하거나, 20건을 추천·검증 업체로 잘못 공개하는 위험
롤백 방법: OPS-013 전용 격리 workspace와 보고서만 제거한다. 기존 제품·DB·원본에는 영향이 없다.
사용자 승인 필요 여부: 필요 — D-33. 실제 공식 데이터 다운로드·로컬 저장·20건 dry-run만 승인하며 DB·공개·연락·비용은 포함하지 않는다.
권장 브랜치명: data/OPS-013-seoul-dol-first20
현재 상태: REPLANNED (활용신청 완료 후 D-34 전국·관련 업종 확대로 BIZ-007·QA-022·BE-008에 재구성)
```

## BIZ-007

```text
작업 ID: BIZ-007
작업명: 전국 가족행사 관련 업체 범위·공개 게이트 정책
담당 전문 에이전트: business-product
현재 문제: 모든 일반음식점과 가족행사 관련 업체를 같은 공개 대상으로 취급하면 수백만 무관 업체가 노출되고 고객 신뢰와 운영비가 악화된다.
사업적 목적: 전국 공급을 넓히면서 고객이 실제로 찾을 가치가 있는 업체만 단계적으로 공개하고 비교·견적 문의로 연결한다.
근거 문서: D-04, D-15, D-17, D-18, D-23~D-25, D-32~D-34, BIZ-003, BIZ-005, BE-006
선행 작업: D-34 사용자 방향 승인
후속 작업: QA-022·BE-008 통합 검수 → 전국 후보 수집 배치 → 지역·분야별 검수 → 제한 공개
수정 허용 경로: ops/reports/BIZ-007-nationwide-provider-scope.md
수정 금지 경로: 그 외 모든 파일, 제품 코드, DB·API·SQL·환경변수·패키지, 실제 데이터 수집, 외부 게시·업체 연락, CHG-A~C
공유 계약: `후보 등록`과 `공개 업체`를 분리하고 공공 업종은 행사 가능성을 증명하지 않는다. 가격·평점·후기·사진은 추정하지 않는다. ADR-018에 따라 NAVER는 후보·검수 신호·공개 assertion에 사용하지 않는다.
구현 범위: 행사별 업체 분야 taxonomy, 포함·제외·보류 기준, 공개 최소조건, 검수 우선순위, 전국 확장 wave, 고객 가치와 운영 용량 기준
구현하지 않을 범위: 실제 업체 수집·등록·공개, 가격·수수료 결정, DB 설계·제품 구현, 업체 연락
완료 조건: 관련 업체 분야가 중복 없이 정의되고 분야별 발견 신호·행사 적합성 증거·공개 게이트·전국 wave가 재현 가능한 표로 작성된다.
검증 방법: 현재 5종 행사 분류·BIZ-003 비교 계약·D-25 라벨·BIZ-005 수익 준비 모델과 교차 대조
실행할 테스트: 무관 음식점·호텔·사진관·미용실·장례식장·온라인 판매업체 경계 시나리오 15개 이상
위험요소: 범위를 넓혀 무관 업체를 가족행사 업체로 오인하거나 운영 검수량이 감당 불가능해지는 위험
롤백 방법: 보고서와 정책 후보만 폐기하며 제품·데이터에는 영향 없음
사용자 승인 필요 여부: 보고서 작성은 불필요. 전면 공개·운영 DB·외부 연락·과금은 별도 승인
권장 브랜치명: biz/BIZ-007-nationwide-provider-scope
현재 상태: DONE (1차 보완 후 총괄 PM·독립 reviewer PASS)
```

## OPS-022

```text
작업 ID: OPS-022
작업명: 사업·수익·업체 데이터 실행 인수인계 통합
담당 전문 에이전트: 총괄 PM
현재 문제: 기존 PROJECT_HANDOVER가 2026-07-21의 저장소·배포 상태 중심이라 이후 확정된 NAVER 비의존, 전국 범위·서울 우선, 수익 준비, 공공데이터 차단 상태와 다음 실행 순서를 한 번에 인수인계하기 어렵다.
사업적 목적: 새 담당자가 기존 제품과 완료 결과를 훼손하지 않고 현재 승인 범위 안에서 바로 운영을 재개하게 한다.
근거 문서: AGENTS.md, docs/07_사업모델.md, docs/09_운영정책.md, docs/99_의사결정기록.md, BIZ-005, BIZ-007, BE-008, BE-009, BE-013, OPS-008, OPS-016, MKT-009, 현재 Git·온라인 draft 상태
선행 작업: 관련 전략·운영·데이터 보고서 DONE
후속 작업: OPS-021 DONE, D-31 승인 완료 후 OPS-023→QA-020→QA-003 진행, 데이터셋별 계약 해소와 비공개 seed, D-26 승인 후 MKT-010, D-30 승인 후 production
수정 허용 경로: ops/PROJECT_HANDOVER.md, ops/handoffs/OPS-022.md, ops/TASK_SPECS.md, ops/PROJECT_BOARD.md, ops/ACTIVE_WORK.md, ops/BACKLOG.md
수정 금지 경로: 제품 코드, DB·SQL·API·환경변수, 실제 데이터, Git index·commit·push, GitHub main, Netlify production, CHG-A~C
공유 계약: 확정 사실·내부 제안·사용자 승인 필요를 분리하고 T5만 공개·비교, T6만 문의 가능으로 설명한다. NAVER는 사업 데이터 원천으로 재사용하지 않는다.
구현 범위: 사업 방향, 참여자 운영, 단계별 수익화, 업체 데이터 수집·검수·신뢰 상태, 완료·차단·Git·배포, 다음 실행과 첫날 체크리스트 통합
구현하지 않을 범위: 신규 사업 정책 확정, 가격·수수료 결정, 제품·DB 변경, 데이터 수집, 업체 연락, 도메인 구매, 배포
완료 조건: PROJECT_HANDOVER 한 문서만으로 다른 담당자가 현재 사실·위험·승인·다음 순서를 실행 가능하게 이해하며 비밀·개인정보를 포함하지 않는다.
검증 방법: 기준 문서 교차 대조, Git·draft·GitHub 인증 상태 재확인, 금지 범위와 경로 diff 확인
실행할 테스트: 문서 링크·핵심 상태 키워드 검색, 제품 코드 변경 0건 확인
위험요소: 내부 제안값을 확정 목표로 오인하거나 최신 draft를 production으로 오인할 수 있음
롤백 방법: OPS-022가 수정한 운영 문서 부분만 이전 버전으로 복원한다.
사용자 승인 필요 여부: 아니오 — 기존 승인·사실 통합만 수행
권장 브랜치명: ops/OPS-022-project-handover
현재 상태: DONE (총괄 PM 사실 대조·문서 검증 완료, build·dist 통과, 전체 test의 기존 QA-016 충돌 1건 재현, 제품·외부 상태 변경 없음)
```

## BE-009

```text
작업 ID: BE-009
작업명: 전국 공식 원천 source registry 확장 계약
담당 전문 에이전트: backend-data
현재 문제: QA-022가 11개 공식 원천 후보를 찾았지만 데이터셋별 schema, 허용·금지 필드, pagination, quota, 갱신과 원천 키가 실행 가능한 단일 계약으로 고정되지 않았다.
사업적 목적: 전국 관련 업체 후보를 데이터셋별로 안전하게 준비하면서 무관 업종·개인정보·제3자 권리와 중복을 수집 전에 차단한다.
근거 문서: D-23~D-25, D-34, BIZ-007, QA-022, BE-006~BE-008, QA-019
선행 작업: BIZ-007·QA-022·BE-008 DONE
후속 작업: QA-023 synthetic gate → 데이터셋별 활용신청·호출 승인 → 소규모 격리 dry-run
수정 허용 경로: ops/reports/BE-009-public-source-registry-contract.md
수정 금지 경로: 그 외 모든 파일, backend/**, 제품 코드, DB·SQL·API 구현, 환경변수·키·패키지, 실제 활용신청·API 호출·다운로드, NAVER 자료, CHG-A~C
공유 계약: QA-022 `USE_CANDIDATE` 11종만 후보로 다룬다. source→observation→candidate→identity→assertion→approved projection을 유지하고, 모든 후보는 비공개·match_pending이다. `15012005`와 NAVER는 포함하지 않는다.
구현 범위: dataset별 ID·기관·terms snapshot·schema version/hash 계획·허용/금지 필드·record key·pagination·quota·갱신·지역/업종 filter·attribution·retention·중복 lineage·중단 조건 계약
구현하지 않을 범위: 활용신청, credential 사용, 실제 호출·수집·가공·업체 등록, 운영 DB·제품 구현, 공개·외부 연락
완료 조건: 11종 각각에 실행 전 필수 registry 항목, 미확정값, fail-closed 조건, QA fixture 입력 계약과 데이터셋별 실행 선후관계가 작성된다.
검증 방법: QA-022 공식 URL과 BE-008 registry 필수 항목 대조, 미확정 schema·quota·권리값이 허용으로 추정되지 않는지 확인
실행할 테스트: 누락 terms/schema/hash, unknown field, 개인정보 필드, mirror 중복, 종료 endpoint, quota·pagination 불명, 행사 관련성 미확정 시 차단 표 작성
위험요소: 메타데이터만 보고 실제 schema와 권리 범위를 확정하거나 11종을 한 번에 활용신청·수집하는 오인
롤백 방법: 보고서만 폐기하며 제품·데이터에는 영향 없음
사용자 승인 필요 여부: 계약 작성은 불필요. 실제 활용신청·API 호출·다운로드·저장·비용은 데이터셋별 별도 승인
권장 브랜치명: be/BE-009-public-source-registry
현재 상태: DONE (1차 문구 수정 후 총괄 PM·독립 reviewer PASS, 실제 API·데이터·DB 변경 없음)
```

## QA-023

```text
작업 ID: QA-023
작업명: 신규 공공 원천 registry·schema·금지 필드 합성 안전 게이트
담당 전문 에이전트: quality-security
담당 영역: 품질·보안 / 비공개 공공데이터 수집 전 안전 검사
현재 문제: BE-009가 11개 원천을 모두 BLOCKED_REGISTRY로 분류하고 합성 fixture 계약을 정의했지만, 누락된 이용조건·schema·금지 필드·중복·관련성 오류를 자동으로 fail-closed 처리하는 실행 가능한 검사가 아직 없다.
사업적 목적: 실제 공공데이터를 받기 전에 잘못된 원천·필드·개인정보·무관 업체가 후보 데이터로 들어오는 것을 차단한다.
근거 문서: ADR-018, D-23~D-25, D-34, QA-019, QA-022, BE-006~BE-009
선행 작업: BE-009 DONE
후속 작업: 데이터셋별 공식 terms/schema snapshot 확보와 사용자 실행 승인 → 소규모 비공개 dry-run → QA 대사
수정 허용 경로: backend/public_data_seed/source_registry_gate.py, backend/public_data_seed/source_registry_gate_fixtures.json, backend/public_data_seed/test_source_registry_gate.py, ops/reports/QA-023-public-source-synthetic-gate.md
수정 금지 경로: 그 외 모든 파일, 기존 seed_tool.py·test_seed_tool.py·workspaces/**, 제품 코드, 운영·로컬 원본 DB, SQL·API·라우팅, 환경변수·키·패키지, 실제 API 호출·다운로드·업체 데이터, NAVER 자료·수집 코드, CHG-A~C
예상 변경 파일: 신규 파일 4개
공통 파일 변경 필요 여부: 없음
다른 작업과 공유하는 계약: BE-009의 11개 현재 차단 fixture, 2개 합성 PASS archetype, 18개 적대적 fixture, 오류 우선순위와 BE-006 projection 계약을 그대로 사용한다. 합성 PASS는 실제 데이터셋 실행 승인으로 해석하지 않는다.
구현 범위: 네트워크가 없는 결정론적 validator와 fixture를 작성한다. registry 필수값, terms/schema hash, 허용·금지·미지 필드, 값 수준 민감정보, source key, pagination·quota, attribution·retention, mirror lineage, 행사 관련성, terminal endpoint를 검사하고 exact error set을 재현한다.
구현하지 않을 범위: 실제 포털 schema 확정, terms 법률 판정, 활용신청, credential 사용, API 호출·수집·저장, 실제 업체 값 사용, 운영 DB·Supabase·제품 화면 변경, 공개·업체 연락
완료 조건: 현재 11개 fixture는 모두 BLOCKED_REGISTRY이고, 합성 JSON/XML archetype 2개는 계약 검사만 통과하며, 적대적 fixture 18개는 정해진 오류 집합으로 차단된다. 알 수 없는 필드·상태·오류는 통과시키지 않는다. 테스트는 네트워크·비밀키·실제 레코드 없이 반복 실행 가능하다.
검증 방법: BE-009 14~16절과 fixture ID·수·순서·exact error set을 대조하고, 허용값 하나씩 제거·변조했을 때 fail-closed인지 확인한다.
실행할 테스트: python backend/public_data_seed/test_source_registry_gate.py, python -m unittest backend.public_data_seed.test_source_registry_gate, python -m unittest backend.public_data_seed.test_seed_tool, 제품 파일·DB·네트워크·환경변수 비접촉 검사
위험요소: 합성 PASS를 실제 원천 승인으로 오인하거나, 보고서의 논리 필드를 실제 physical schema로 고정하거나, 금지되지 않은 필드를 자동 허용할 위험
롤백 방법: QA-023에서 새로 만든 4개 파일만 제거한다. 제품·데이터·DB 롤백은 없다.
사용자 승인 필요 여부: 합성 검사 작성·실행은 불필요. 실제 terms/schema 취득, 활용신청, API 호출·다운로드·저장·비용은 데이터셋별 별도 승인 필요.
권장 브랜치명: qa/QA-023-public-source-synthetic-gate
현재 상태: DONE (2차 범위 내 보완 후 총괄 PM·독립 reviewer PASS, 합성 31개·unittest 11개·기존 seed 14개 통과)
```

## BE-013

```text
작업 ID: BE-013
작업명: 15154916 첫 공식 원천 terms·schema 증거 패킷
담당 전문 에이전트: backend-data
담당 영역: 백엔드·데이터 / 실제 호출 전 공식 계약 증거
현재 문제: D-33 활용신청은 완료됐지만 `15154916`은 BE-009에서 실제 terms snapshot, schema artifact/hash, pagination·quota·field map이 고정되지 않아 BLOCKED_REGISTRY다.
사업적 목적: 첫 공공데이터 후보를 추측 없이 안전하게 실행 가능한 상태로 만들고, 향후 다른 원천에도 재사용할 증거 형식을 확정한다.
근거 문서: D-23, D-33, D-34, QA-022, BE-006~BE-009, QA-019, QA-023
선행 작업: BE-009·QA-023 DONE, `15154916` 활용신청 완료
후속 작업: 총괄 PM 검수 → D-33 범위의 최대 20건 비공개 dry-run 여부 판정 → QA 대사
수정 허용 경로: backend/public_data_seed/evidence/15154916/**, ops/reports/BE-013-15154916-official-contract-evidence.md
수정 금지 경로: 그 외 모든 파일, 제품 코드, 운영·로컬 원본 DB, SQL·Supabase, 환경변수·비밀키·패키지, 실제 API 데이터 endpoint 호출·업체 레코드 다운로드, NAVER 자료, 외부 연락·게시, CHG-A~C
예상 변경 파일: 공식 메타·schema·terms 증거 파일과 전용 보고서
공통 파일 변경 필요 여부: 없음
다른 작업과 공유하는 계약: portal ID `15154916`, QA-022 `USE_CANDIDATE`, BE-009 control registry, QA-023 fail-closed 규칙. 공식 문서에 없는 필드·quota·권리값은 추정하지 않는다.
구현 범위: data.go.kr과 제공기관의 공식 공개 문서만 읽어 terms/license·제3자 권리·상업/변형 가능 범위, 공식 endpoint 문서, response schema·record path·source key 후보, pagination·quota·갱신·출처표시를 캡처하고 날짜·URL·SHA-256·미확정값을 기록한다. 실제 업체 응답 레코드는 받지 않는다.
구현하지 않을 범위: 서비스 키 사용, 실제 API 호출·다운로드, 업체 후보 생성·저장, 운영 DB·제품 구현, 법률 확정, 다른 10개 데이터셋 일괄 승인
완료 조건: 공식 URL과 기준일, terms/schema artifact hash, physical field 목록, 금지 field 대조, endpoint·pagination·quota·source key·attribution·retention의 공식 근거 또는 명시적 미확정 상태가 재현 가능하게 작성된다. BE-009 blocker별 해소/잔존 판정이 있고 하나라도 필수값이 없으면 실행 가능으로 표시하지 않는다.
검증 방법: 공식 출처만 사용했는지, artifact bytes와 SHA-256이 일치하는지, QA-023 규칙으로 registry 후보가 PASS/BLOCKED 중 무엇인지 합성 projection에서 검사한다.
실행할 테스트: 공식 URL 재접속, artifact SHA-256 재계산, schema field 중 금지·미지 field 대조, 누락 blocker fail-closed 표, 실제 API·키·DB·제품 비접촉 검사
위험요소: 포털 소개 문구를 법적 허가나 실행 schema로 확대 해석하거나, 문서의 예시 응답을 실제 업체 데이터로 저장할 위험
롤백 방법: BE-013 증거 폴더와 보고서만 제거한다. 제품·DB·업체 데이터 롤백은 없다.
사용자 승인 필요 여부: 공식 공개 문서 읽기·증거화는 불필요. 실제 API 호출·레코드 다운로드는 D-33 범위·필수 계약 충족을 총괄 PM이 재확인한 뒤 별도 실행한다.
권장 브랜치명: be/BE-013-15154916-contract-evidence
현재 상태: DONE (1차 범위 내 보완 후 총괄 PM·독립 reviewer PASS. 공식 정규화 증거·39개 field 분류 완료, `T,S,F,K,P,Q,G,A,R` 9개 blocker 잔존, 실제 API·업체 레코드 0)
```

## OPS-018

```text
작업 ID: OPS-018
작업명: 공공데이터 안전 도구·증거 Git 추적 경계 결정
담당 전문 에이전트: quality-security
담당 영역: 총괄 PM·운영·보안 / Git 추적 경계 읽기 전용 감사
현재 문제: `.gitignore`의 `backend/` 전체 제외로 BE-007·QA-023·BE-013의 검수 완료 도구와 증거도 GitHub에 보존되지 않지만, 예외를 넓게 열면 로컬 DB·원본·비밀·실행 workspace가 유출될 수 있다.
사업적 목적: 다른 PC와 GitHub에서도 검수 가능한 안전 도구·합성 fixture·공식 증거만 재현하면서 실제 업체 데이터와 비밀값은 계속 로컬에 격리한다.
근거 문서: R-08, R-67, BE-007, QA-019, BE-009, QA-023, BE-013, ops/FILE_OWNERSHIP.md
선행 작업: BE-007·QA-019·QA-023·BE-013 DONE
후속 작업: 총괄 PM 검수 → `.gitignore` 공통 파일 변경 카드와 단일 소유권 결정 → 비밀·대용량·원본 0건 검사 → GitHub 반영 별도 승인
수정 허용 경로: ops/reports/OPS-018-public-seed-git-tracking-boundary.md
수정 금지 경로: 그 외 모든 파일, `.gitignore`, `backend/**`, 제품 코드, DB·원본·workspace·환경변수·비밀키, 패키지·잠금 파일, CHG-A~C
예상 변경 파일: 전용 감사 보고서 1개
공통 파일 변경 필요 여부: 현재 작업에서는 없음. 후속 구현에서 `.gitignore` 단일 소유 카드 필요
다른 작업과 공유하는 계약: `backend/data/**`, `.env*`, 실행 workspace, `.test-tmp`, `__pycache__`, 실제 레코드·credential은 항상 제외한다. 완료 도구와 공식 정규화 증거를 실제 데이터로 오인하지 않는다.
구현 범위: 현재 ignore 규칙과 `backend/public_data_seed/**` 파일을 metadata·경로·크기·Git 추적 상태만으로 감사한다. 추적 허용 후보와 영구 제외 대상을 나누고, 최소 예외 규칙 초안·실행 전 검사·롤백을 작성한다. 파일 내용에서 비밀값이 의심되면 값은 출력하지 않고 blocker만 보고한다.
구현하지 않을 범위: `.gitignore` 수정, git add·commit·push, 제품·DB·backend 파일 수정, 실제 데이터 열람·API 호출, 임시 폴더 삭제, 외부 게시
완료 조건: 추적 허용 후보가 파일 단위로 열거되고 실제 DB·원본·workspace·temp·cache·비밀 제외 규칙이 명확하다. 제안 규칙이 `backend/` 전체를 무분별하게 해제하지 않으며, 후속 구현에서 실행할 check-ignore·비밀·대용량·테스트 검증과 롤백이 재현 가능하다.
검증 방법: git check-ignore, 파일 목록·크기·확장자, 기존 소유권·보고서 대조, 제안 규칙의 긍정/부정 경로 표
실행할 테스트: 읽기 전용 git check-ignore, 허용 후보/금지 fixture 경로 대조, `.env`·DB·workspace·temp·cache가 계속 ignored인지 확인하는 명령 초안
위험요소: negation 규칙을 넓게 작성해 `backend/data`, credential, 실제 업체 레코드 또는 테스트 임시 파일이 Git에 노출될 위험
롤백 방법: 전용 보고서 1개만 제거한다. `.gitignore`와 backend는 변경하지 않는다.
사용자 승인 필요 여부: 읽기 전용 감사와 보고서 작성은 불필요. `.gitignore` 수정·GitHub 반영은 총괄 PM 검수와 별도 변경 카드 후 진행한다.
권장 브랜치명: ops/OPS-018-public-seed-tracking-boundary
현재 상태: DONE (1차 범위 내 보완 후 총괄 PM·독립 reviewer PASS. exact 9-file 경계·현재 Git 상태·비밀 count-only·비-reparse 검증 완료)
```

## OPS-019

```text
작업 ID: OPS-019
작업명: 공공데이터 안전 도구·증거 exact allowlist 로컬 구현
담당 전문 에이전트: 총괄 PM 단일 소유, quality-security 읽기 전용 검수
담당 영역: 총괄 PM·운영·보안 / 공통 `.gitignore`
현재 문제: OPS-018에서 안전 후보 9개와 영구 제외 경계를 확정했지만 현재 `backend/` 전체 ignore 때문에 도구·증거가 Git 후보로도 보이지 않는다.
사업적 목적: 검수 완료된 도구·합성 fixture·공식 정규화 증거만 향후 GitHub에 보존할 수 있게 하면서 DB·원본·비밀·workspace·temp·cache는 계속 차단한다.
근거 문서: OPS-018, R-67, CR-010, BE-007, QA-019, QA-023, BE-013
선행 작업: OPS-018 DONE·독립 reviewer PASS
후속 작업: 독립 보안 검수 → GitHub stage·commit·push 별도 승인
수정 허용 경로: .gitignore, ops/reports/OPS-019-public-seed-git-boundary-implementation.md
수정 금지 경로: 그 외 모든 파일, backend/** 내용, 제품 코드, DB·원본·workspace·temp·cache, 환경변수·비밀키, 패키지·잠금 파일, Git index·commit·push, CHG-A~C
예상 변경 파일: .gitignore, 전용 보고서
공통 파일 변경 필요 여부: 있음 — `.gitignore`를 OPS-019가 단일 소유
다른 작업과 공유하는 계약: OPS-018 exact 9-file allowlist만 사용한다. 새 파일·디렉터리는 기본 ignored이며 자동 허용하지 않는다.
구현 범위: 기존 `backend/` blanket을 단계별 재차단+정확한 9개 negation으로 교체한다. check-ignore·tracked/untracked exact equality, deny probe 10개, 일반 파일·비-reparse, SHA-256, 1 MiB, count-only 비밀 형식, QA-023/seed 회귀를 검증한다.
구현하지 않을 범위: backend 파일 수정, 실제 데이터·API·키·DB 접근, git add·commit·push, GitHub·배포, 다른 ignore 규칙 정리
완료 조건: `backend/public_data_seed`의 non-ignored untracked가 정확히 9개이고 deny probe 10개가 모두 ignored다. DB·원본·workspace·temp·cache·미검수 파일은 보이지 않으며 비밀·대용량·reparse 0, 테스트 회귀가 통과한다.
검증 방법: 번들 Git check-ignore·ls-files·status·diff, SHA-256, PowerShell count-only regex, Python synthetic unittest
실행할 테스트: allow 9 not ignored, deny 10 ignored, exact set·regular non-reparse, QA-023 31/31·11 unittest, seed 14 unittest
위험요소: negation 순서 오류로 backend 전체 또는 신규 파일이 노출되거나 기존 dirty worktree 변경을 섞는 위험
롤백 방법: OPS-019 `.gitignore` 블록만 원래 `backend/` 한 줄로 되돌린다. backend 파일을 삭제하지 않고 reset/checkout을 사용하지 않는다.
사용자 승인 필요 여부: 로컬 가역 구현·검수는 불필요. git add·commit·push와 GitHub 반영은 별도 승인 필요
권장 브랜치명: ops/OPS-019-public-seed-exact-allowlist
현재 상태: DONE (총괄 PM 단일 소유 구현·독립 reviewer PASS. allow 9/9, deny 10/10, exact untracked 9, 비밀·대용량·reparse 0, 회귀 31+11+14 통과, Git index·GitHub 0)
```

## OPS-021

```text
작업 ID: OPS-021
작업명: 안전 도구·증거 별도 GitHub 브랜치 반영
담당 전문 에이전트: 총괄 PM
담당 영역: Git·GitHub / 승인 10개 경로 게시
현재 문제: D-36 승인 뒤 GitHub 계정 인증이 완료돼 안전 게시 절차를 exact 범위로 수행해야 한다.
사업적 목적: 다른 PC에서도 공공데이터 안전 게이트와 공식 증거를 재현할 수 있도록 검수 파일만 별도 브랜치에 보존한다.
근거 문서: D-36, OPS-018, OPS-019, CR-010
선행 작업: OPS-019 DONE, D-36 승인 완료, GitHub CLI 2.96.0 설치·GitHub 인증 완료
후속 작업: 원격 브랜치 존재·커밋 범위 확인. PR·main 병합·배포는 별도 승인
수정 허용 경로: .gitignore와 ops/handoffs/OPS-021.md에 열거된 backend/public_data_seed 9개
수정 금지 경로: 그 외 모든 변경, 제품·운영 문서·DB·원본·workspace·temp·cache·비밀, PR·main·배포
예상 변경 파일: 승인 10개 경로만 Git stage·commit·push
공통 파일 변경 필요 여부: `.gitignore`는 OPS-019 검수본을 그대로 사용하며 추가 수정하지 않는다.
다른 작업과 공유하는 계약: mixed dirty worktree에서 explicit path만 stage하고 staged exact equality를 검증한다.
구현 범위: GitHub CLI 인증 확인, 별도 agent 브랜치 생성, 승인 10개만 stage, diff·hash·테스트 재확인, 단일 커밋과 origin push
구현하지 않을 범위: PR, main 병합, 배포, 다른 변경 stage, 제품·DB 수정
완료 조건: 별도 브랜치에 승인 10개 경로만 존재하고 다른 dirty 변경 stage 0, 원격 브랜치와 로컬 커밋 일치, PR·main·배포 0
검증 방법: gh auth status, git diff --cached --name-only exact equality, git show --name-only, origin branch SHA 대조
실행할 테스트: OPS-019 allow/deny·비밀·hash·회귀 재검증
위험요소: mixed worktree의 관련 없는 제품·문서 변경을 함께 stage하거나 현재 브랜치 기반 변경을 잘못 포함하는 위험
롤백 방법: push 전 index만 안전하게 unstage. push 후 문제는 강제 push 없이 별도 승인된 revert로 처리
사용자 승인 필요 여부: D-36 승인 완료. PR·main·배포는 포함하지 않음
권장 브랜치명: agent/ops-019-public-seed-exact-allowlist
현재 상태: DONE (exact 10개만 commit `1e7f654`로 원격 `agent/ops-019-public-seed-exact-allowlist`에 push; PR·main·배포 0)
```

## OPS-016

```text
작업 ID: OPS-016
작업명: 전국 업체 후보 검수 용량·운영 순서 설계
담당 전문 에이전트: marketing-operations
현재 문제: 전국·15개 분야 후보를 한꺼번에 만들면 관리자가 확인할 수 있는 양을 넘고, 미확인 후보가 완성된 업체 정보처럼 오인될 수 있다.
사업적 목적: 고객에게 신뢰할 수 있는 업체를 실제로 늘리면서 검수 적체와 전국 빈 페이지를 통제한다.
근거 문서: D-32~D-34, BIZ-005, BIZ-007, OPS-008, QA-022, BE-008
선행 작업: BIZ-007·BE-008 DONE
후속 작업: 데이터셋별 소규모 격리 dry-run → QA 대사 → 지역·분야별 공개 승인
수정 허용 경로: ops/reports/OPS-016-nationwide-review-capacity.md
수정 금지 경로: 그 외 모든 파일, 제품 코드, DB·API·SQL, 실제 업체 데이터·연락처, 활용신청·API 호출·다운로드, 외부 연락·게시·공개, 가격·수수료, CHG-A~C
공유 계약: 전량은 비공개 후보이며 BIZ-007 T5/T6를 통과한 업체만 공개·비교·문의 가능하다. 서울 돌잔치는 첫 품질 표본일 뿐 전국 공개 완료로 표현하지 않는다.
구현 범위: 지역·분야 wave, 관리자 일일/주간 처리량 가정, 무관 후보·중복·폐업·주소변경 queue, 공개 승격·반려·재확인 SOP, 적체·정확도·중단 지표
구현하지 않을 범위: 실제 검수·업체 등록·연락·공개, 인력 채용·비용 확정, 제품·DB 구현
완료 조건: 작은 첫 배치부터 전국 확장까지 검수량·역할·상태·SLA 후보·중단 기준·재개 조건과 90일 운영 순서가 수치 가정과 함께 작성된다.
검증 방법: BE-008 규모 예시와 BIZ-007 W0~W6를 대조하고 1인 운영, 빈 원천 분야, 무관 후보 급증, 정정 요청 급증 시나리오를 확인
실행할 테스트: 처리량 50% 감소, 중복률 급증, 행사 적합성 통과율 저하, 최근성 만료, 이의제기 적체, 공개 후보 0건 시 운영 대응 표
위험요소: 확정되지 않은 인력·비용·처리량을 공개 약속이나 완료 일정으로 오인
롤백 방법: 보고서만 폐기
사용자 승인 필요 여부: 설계는 불필요. 실제 업체 연락·외부 게시·공개·비용·인력 계약은 별도 승인
권장 브랜치명: ops/OPS-016-nationwide-review-capacity
현재 상태: DONE (총괄 PM·독립 reviewer PASS, 실제 업체 데이터·연락·공개·비용 변경 없음)
```

## QA-027

```text
작업 ID: QA-027
작업명: NAVER API 보조 활용 공식 서면 범위 확인
담당 전문 에이전트: quality-security
현재 문제: NAVER 공식 약관은 지역정보의 별도 DB 구축과 허용 범위 밖 저장·가공·혼합 표시를 제한할 수 있어, 내부 후보 발견·중복 대조조차 허용된다고 단정할 수 없다.
사업적 목적: NAVER 검색 결과를 무단 축적하지 않으면서 법적으로 허용되는 보조 활용이 실제로 있는지 공식 답변으로 확인한다.
근거 문서: D-15, D-18, D-27, D-35, QA-009~QA-010, QA-022, BE-008, R-65, CR-009
선행 작업: D-35 사용자 승인 및 NAVER에 외부 문의할 권한
후속 작업: 허용 답변이면 BIZ-008 정책·BE-011 격리 adapter·QA synthetic gate, 불허/무응답이면 NAVER 의존 종료 유지
수정 허용 경로: ops/reports/QA-027-naver-written-permission.md
수정 금지 경로: 그 외 모든 파일, 실제 NAVER API 호출·검색 결과 저장, 기존 backend/data/** 열람·가공·삭제, 제품·DB·환경변수·키, 공개·업체 연락, CHG-A~C
공유 계약: 공개 업체 정보의 정본은 공공데이터·업체 제출·고객 제안 후 독립 확인·관리자 검수뿐이다. NAVER 답변이 없거나 모호하면 fail-closed로 사용하지 않는다.
구현 범위: 공식 문의문과 구상별 질문 확정, 승인 후 NAVER 공식 채널 문의, 답변 원문·일자·채널·담당 식별정보 최소 기록, 저장·가공·상업 이용·혼합 표시·보유·삭제·지도 비용·표시 조건 판정
구현하지 않을 범위: 법률 자문 확정, API 호출, 업체 데이터 수집·분석·공개, 지도 구현, 비용 결제
완료 조건: 후보 발견, 최소 식별자/URL 보관, 중복 대조, 관련성 분석, 별도 DB, 공개 표시, 지도 사용 각각에 공식 서면 허용/불허/미확정을 기록한다.
검증 방법: NAVER 공식 약관·제품 문서와 회신을 항목별 교차 확인하고 구두·커뮤니티·블로그 답변을 근거로 채택하지 않는다.
실행할 테스트: 부분 허용, 조건부 보유, 무응답, 약관과 회신 충돌, 제3자 저작물 제외, 유료 Maps 별도 계약 시 판정표
위험요소: 외부 문의가 서비스 구상을 공개하거나 일반 상담 답변을 법적 보장으로 오인하는 위험
롤백 방법: 외부 문의는 회수할 수 없으므로 승인 전 발송하지 않는다. 보고서 초안은 폐기 가능
사용자 승인 필요 여부: 필요 — D-35와 NAVER 공식 채널 외부 문의 승인. API 호출·비용은 포함하지 않는다.
권장 브랜치명: qa/QA-027-naver-written-permission
현재 상태: CANCELLED (ADR-018 — 사용자 결정으로 NAVER 문의·보조 활용 경로 종료)
```

## QA-026

```text
작업 ID: QA-026
작업명: 기존 NAVER 로컬 자료 metadata-only 삭제 대상 감사
담당 전문 에이전트: quality-security
현재 문제: backend/data와 저장소의 공개·파생 산출물에 NAVER 자료가 섞여 있을 수 있으나, 파일명만 보고 전체 DB나 공공데이터를 삭제하면 정상 자료까지 훼손할 수 있다.
사업적 목적: 권리 위험 자료를 제거하면서 공공데이터·업체 직접 제출·운영 문서와 제품 코드를 보존한다.
근거 문서: ADR-016, ADR-018, D-27, D-35, QA-010, QA-022, R-65, CR-009
선행 작업: D-27 사용자 삭제 승인
후속 작업: 총괄 PM 대상 검수 → 정확한 NAVER 파생 파일·테이블만 삭제 → 잔존 복제본·공개 번들 재검사
수정 허용 경로: ops/reports/QA-026-naver-deletion-inventory.md
수정 금지 경로: 그 외 모든 파일, 실제 파일·DB·레코드 삭제·수정·이동, API 호출, 네트워크, 제품 코드·환경변수·키, CHG-A~C
공유 계약: 레코드 본문·업체명·주소·전화·블로그 글·사진을 보고서에 복제하지 않는다. 파일명·경로·크기·형식·schema·table/field 이름·건수·시간·hash·생성 스크립트·lineage만 확인한다.
구현 범위: backend/data, 공개 데이터 bundle, dist·캐시·백업·CSV·JSON·SQLite의 NAVER 원본·파생·혼합 후보를 식별하고 삭제/부분삭제/보존 판정, 정확한 삭제 manifest와 삭제 후 검증 명령 작성
구현하지 않을 범위: 실제 삭제, 내용 샘플링, 데이터 재분석, 운영 DB·외부 저장소·GitHub·Netlify 변경
완료 조건: 명확한 NAVER 전용 파일, 혼합 DB/파일, 비NAVER 보존 파일, 확인 불가 대상을 분리하고 각 대상의 절대 경로·크기·hash·근거·권장 처리와 잔존 검사 방법을 작성한다.
검증 방법: 파일명·schema·생성 스크립트 읽기, SQLite table/schema/count metadata, 텍스트 파일의 source marker·field name만 최소 검색, 공공데이터 seed와 제품 파일 비접촉 확인
실행할 테스트: 동일 자료 복제본, 공개 bundle 파생본, DB 혼합 table, 백업·임시·캐시, 파일명에 NAVER가 없는 파생 산출물, 공공데이터 오탐 시나리오
위험요소: 혼합 DB 전체 삭제, 개인정보·원문 노출, 보고서에 민감값 복제, 파일명만으로 오판
롤백 방법: 감사 보고서만 폐기. 실제 삭제는 총괄 PM이 별도 검수 후 수행
사용자 승인 필요 여부: 감사 승인 완료. 명확한 NAVER 파생 대상 삭제는 D-27 범위에서 허용. 혼합 DB 전체 삭제나 정상 자료 동반 삭제는 별도 보고
권장 브랜치명: qa/QA-026-naver-deletion-inventory
현재 상태: DONE (보고서 보완 후 총괄 PM·독립 reviewer PASS, D-27에 따라 전용 파일 19개와 혼합 DB의 NAVER 원문 28,879행 삭제·무결성 확인)
```

## QA-022

```text
작업 ID: QA-022
작업명: 전국 가족행사 관련 분야별 공식 데이터 원천·이용조건 레지스트리
담당 전문 에이전트: quality-security
현재 문제: D-23의 3개 인허가 원천은 음식점·관광식당·관광숙박업만 포함하며 촬영·의상·미용·장식·답례품 등 전체 관련 업체를 발견할 수 없다.
사업적 목적: 전국 후보 확보에 실제 사용할 수 있는 공식 원천과 사용할 수 없는 원천을 구분해 권리·개인정보·최신성 사고를 막는다.
근거 문서: D-15, D-23~D-25, D-34, QA-011, QA-013, QA-015, BE-006, R-37~R-46, R-54~R-62
선행 작업: D-34 사용자 방향 승인
후속 작업: BE-008 source registry 통합 → 데이터셋별 별도 수집 카드
수정 허용 경로: ops/reports/QA-022-nationwide-public-data-register.md
수정 금지 경로: 그 외 모든 파일, 활용신청·API 호출·파일 다운로드, 실제 데이터·키·개인정보, 제품·DB·패키지, CHG-A~C
공유 계약: 공식 1차 출처만 승인 원천으로 조사한다. NAVER·검색 결과·제3자 권리 미확정 상가정보는 승인 원천처럼 쓰지 않으며, NAVER 공식 약관은 D-35 보조 활용 가능성 판단을 위한 별도 HOLD 항목으로만 감사한다.
구현 범위: 분야별 공식 데이터셋·기관·ID·범위·갱신·이용허락·제3자 권리·필드·API 제한·중복 lineage·사용/보류/제외 판정
구현하지 않을 범위: 활용신청, 실제 호출·다운로드, 법률 자문 확정, 데이터 수집·공개
완료 조건: BIZ-007 분야별로 사용할 수 있는 원천·없는 분야·추가 확인이 필요한 원천이 공식 URL 근거와 함께 분리된다.
검증 방법: 공공데이터포털·공식 기관 상세·공공누리 조건 교차 확인, 수정일·이용조건·제3자 권리 기록
실행할 테스트: 무관 업종 오인, 동일 원천 mirror 중복, 종료 endpoint, 제3자 권리, 개인정보 필드, 서울 편향 검사
위험요소: 일반 상가정보를 권리 확인 없이 상업 서비스 원천으로 사용하거나 데이터 존재를 행사 가능성으로 오인
롤백 방법: 보고서만 폐기
사용자 승인 필요 여부: 조사 불필요. 신규 원천 활용신청·대량 수집·저장은 데이터셋별 별도 승인
권장 브랜치명: qa/QA-022-nationwide-source-register
현재 상태: DONE (총괄 PM·독립 reviewer PASS)
```

## BE-008

```text
작업 ID: BE-008
작업명: 전국 다분야 업체 후보 수집·중복·검수 배치 설계
담당 전문 에이전트: backend-data
현재 문제: BE-007은 단일 데이터셋·최대 소규모 검수 bundle에 맞춰져 있어 전국 다분야·대용량 후보를 한 번에 안전하게 처리할 용량·중복·재시작 계약이 없다.
사업적 목적: 전국 후보를 지역·분야별로 나누어 비용과 실패를 통제하고 중복·폐업·주소변경을 추적 가능한 형태로 준비한다.
근거 문서: D-23~D-25, D-32~D-34, BE-005~BE-007, QA-019, OPS-008, R-36~R-46, R-54~R-62
선행 작업: D-34 사용자 방향 승인, BE-007·QA-019 DONE
후속 작업: QA-022 승인 원천 pin → 데이터셋별 local dry-run → QA 대사 → staging import 별도 카드
수정 허용 경로: ops/reports/BE-008-nationwide-ingestion-plan.md
수정 금지 경로: 그 외 모든 파일, seed_tool.py·제품 코드·SQL·DB·API·환경변수·패키지, 실제 API 호출·다운로드·데이터 생성, CHG-A~C
공유 계약: source→observation→candidate→identity→assertion→approved projection 분리, 전량 후보는 비공개·match_pending이며 공개 flag를 만들지 않는다. ADR-018에 따라 NAVER raw/derived adapter와 보조 활용 경로를 만들지 않는다.
구현 범위: 데이터셋·지역·업종 shard, cursor/checkpoint, rate limit, immutable raw hash, 중복·지점 매칭, 폐업·주소 변경, 실패 재시작, 비용·용량 추정, 단계별 검수·rollback
구현하지 않을 범위: 실제 수집, 운영 DB schema·migration, 공개 projection, 업체 연락, 가격·평점·후기 생성
완료 조건: 수백만 건 원천도 작은 재실행 가능한 배치로 처리하고 원본·후보·검수·공개를 섞지 않는 설계와 수용 기준이 작성된다.
검증 방법: 일반음식점 대규모 원천, 관광식당·숙박 중복, 다분야 source key 충돌, 빈/부분 응답·schema 변경·rate limit 시나리오
실행할 테스트: 중단 재개, 동일 레코드 재수집, conflicting duplicate, 지점 분리, 사라진 레코드, 민감필드, 공개 flag 차단 시나리오 12개 이상
위험요소: 대량 수집이 저장공간·API quota·검수 용량을 초과하거나 후보가 공개 업체로 오인되는 위험
롤백 방법: 설계 보고서만 폐기
사용자 승인 필요 여부: 설계 불필요. 실제 대량 다운로드·저장·DB import·공개는 별도 승인
권장 브랜치명: be/BE-008-nationwide-ingestion-plan
현재 상태: DONE (1차 보완 후 총괄 PM·독립 reviewer PASS)
```
## BE-016

```text
작업 ID: BE-016
작업명: 미용·제과·장례식장 공식 원천 증거 패킷
담당 전문 에이전트: backend-data
현재 문제: QA-022가 미용업·제과점영업·전국 장례식장을 USE_CANDIDATE로 분류했지만 BE-009 실행 registry에 필요한 공식 계약 증거와 필드·차단 상태가 고정되지 않았다.
사업적 목적: 음식점 중심 후보를 넘어 가족행사 관련 미용·케이크·추모 시설의 전국 비공개 후보 기반을 안전하게 준비한다.
근거 문서: D-23~D-25, D-34, D-37, QA-022, BE-006, BE-008, BE-009, BE-013, PM-2026-07-25 전국 업체정보 확보 실행계획
선행 작업: QA-022·BE-009·BE-013 DONE, D-37 승인
후속 작업: 총괄 PM·독립 QA 검수 → dataset별 synthetic gate 보강 → 실제 canary 실행 별도 승인
수정 허용 경로: backend/public_data_seed/evidence/15154918/**, backend/public_data_seed/evidence/15155252/**, backend/public_data_seed/evidence/15122367/**, ops/reports/BE-016-next-public-source-evidence.md
수정 금지 경로: 그 외 모든 파일, 제품 코드, 운영 DB·Supabase·SQL·migration, backend/data/**, 기존 도구·fixture, 환경변수·API 키, 패키지·잠금 파일, CHG-A~C
공유 계약: 공식 1차 문서만 사용하고 실제 업체값·서비스 키를 저장하지 않는다. 미확정값은 blocker로 유지하며 공공 업종을 가족행사 가능으로 확정하지 않는다.
구현 범위: 3개 데이터셋의 공식 endpoint/schema/field/pagination/quota metadata/갱신/이용조건 증거, allow/forbidden field 완전 분류, hash manifest, BE-009 blocker 판정
구현하지 않을 범위: API 호출·실제 업체 다운로드·active registry·DB import·업체 공개·NAVER·일반 웹검색
완료 조건: 데이터셋별 공식 URL·확인일·artifact·hash, field 완전 분류, T/S/F/K/P/Q/G/A/R 판정, 실제 API·업체·비밀·DB·제품 0건, READY_FOR_SYNTHETIC 또는 BLOCKED_REGISTRY 판정
검증 방법: artifact parse, SHA-256 재계산, field 합집합·교집합·누락, 금지값·실제 업체값 부재, 허용 경로 diff
실행할 테스트: schema 변경, unknown field, 개인 연락처·좌표·시설 수치, 불완전 pagination, quota·terms 미확정, source key 충돌
위험요소: 포털 메타를 실행 승인으로 오인, 인허가를 행사 적합성으로 오인, 실제 업체값·개인정보 저장
롤백 방법: 신규 evidence 디렉터리와 전용 보고서만 폐기. 기존 도구·DB·제품은 불변
사용자 승인 필요 여부: 공식 문서 증거 작업은 불필요. 실제 API 호출·다운로드·저장은 별도 승인
권장 브랜치명: be/BE-016-next-public-source-evidence
현재 상태: DONE (총괄 PM PASS, 공식 증거·field 완전 분류 완료, 세 dataset은 BLOCKED_REGISTRY 유지)
```

## OPS-025

```text
작업 ID: OPS-025
작업명: 공공데이터 공백 8개 분야 직접 등록·제안 SOP
담당 전문 에이전트: marketing-operations
현재 문제: 촬영·의상·장식·꽃·답례품·진행/사회·공연·차량은 전국 공식 공공데이터만으로 후보를 채울 수 없지만 접수·검수 절차가 분야별 실행 체크리스트 수준으로 정리되지 않았다.
사업적 목적: 스튜디오·스냅 등 실제 서비스 제공자가 손품해방에 들어올 수 있는 안전한 공급 확보 경로를 준비한다.
근거 문서: D-17, D-24~D-25, D-29, D-32, D-34, D-37, BIZ-007, QA-022, OPS-008, OPS-016, PM-2026-07-25 전국 업체정보 확보 실행계획
선행 작업: BIZ-007·QA-022·OPS-008·OPS-016 DONE, D-37 승인
후속 작업: 총괄 PM·독립 QA 검수 → 접수 데이터 계약 → 제품 구현 카드 → 격리 E2E
수정 허용 경로: ops/reports/OPS-025-public-gap-provider-intake-sop.md
수정 금지 경로: 그 외 모든 파일, 제품·DB·API·SQL·Storage·환경변수·패키지, 실제 업체·고객·연락처·증빙·견적, 외부 게시·연락, CHG-A~C
공유 계약: 업체 직접 제출과 고객 제안을 분리하고 T5/T5-C/T6를 건너뛰지 않는다. 포트폴리오·개인 연락처·자택 가능 주소는 권리·개인정보 확인 전 공개하지 않는다.
구현 범위: 8개 분야별 접수 필드·증빙·반려·보완, queue/state, 중복·사칭·사진 권리·주소 처리, 관리자 체크리스트, micro-wave, 이의·rollback
구현하지 않을 범위: 고객 견적 보상·열람 정책, 화면·DB 구현, 실제 모집·접수·연락·공개·과금
완료 조건: 8개 분야 전체의 접수·검수·공개 gate, 제출 주체 분리, 개인정보·권리 통제, 운영 체크리스트와 기록 형식, 실제 외부·DB·제품 0건
검증 방법: 사칭·중복·자택 주소·무권리 사진·조건 없는 가격·오제안·정정/삭제 시나리오와 BIZ-007/OPS-008/OPS-016 대조
실행할 테스트: 스냅 프리랜서, 고정 스튜디오, 여러 지역 출장, 고객 제안, 업체 이의, 권리 철회, 중복 지점
위험요소: 직접 제출을 검증 완료로 오인, 개인 연락처·주거지·포트폴리오 무단 공개, 운영 용량 초과
롤백 방법: 전용 운영 보고서만 폐기
사용자 승인 필요 여부: SOP 작성은 불필요. 실제 업체 연락·정보 접수·개인정보 처리·공개는 별도 승인
권장 브랜치명: ops/OPS-025-public-gap-intake-sop
현재 상태: DONE (총괄 PM PASS, 8개 분야 직접 등록·고객 제안 SOP 완료)
```

## BIZ-009

```text
작업 ID: BIZ-009
작업명: 고객 견적 공유·열람 정책
담당 전문 에이전트: business-product
현재 문제: 고객이 실제 견적을 제공하면 다른 견적을 볼 수 있게 하려는 방향은 있으나 기본 무료 정보, 인정 견적, 열람 범위, 보상 기간, 개인정보, 조작 방지, 업체 정정권이 확정되지 않았다.
사업적 목적: 초기 업체 데이터 공백을 고객 기여로 보완하면서 재방문 가치와 향후 수익 검증 기반을 만든다.
근거 문서: D-04, D-09, D-16, D-24~D-25, D-32, D-37, BIZ-003, BIZ-005, BIZ-007, QA-015, OPS-008, PM-2026-07-25 전국 업체정보 확보 실행계획
선행 작업: BIZ-003·BIZ-005·BIZ-007·QA-015·OPS-008 DONE, D-37 승인
후속 작업: 총괄 PM·품질·보안 검수 → 사용자 정책 결정 → 데이터 계약 → 제품 구현·격리 E2E
수정 허용 경로: ops/reports/BIZ-009-quote-contribution-access-policy.md
수정 금지 경로: 그 외 모든 파일, 제품·DB·API·SQL·Storage·환경변수·패키지, 실제 견적·업체·고객 정보, 가격·수수료·Premium, 외부 게시·연락·결제, CHG-A~C
공유 계약: 견적은 조건과 기준일이 있는 사례이며 업체 현재 고정가격·추천·평점이 아니다. 원본과 공개 구조화 정보를 분리하고 기본 서비스 이용을 원본 제출에 강제 연동하지 않는다.
구현 범위: 무료/기여 열람 경계, 인정·반려 조건, 혜택 기간, 개인정보·원본 보유, 중복·조작·광고 방지, 업체/고객 정정·삭제·이의, MVP와 후속 수익 실험 분리
구현하지 않을 범위: 화면·업로드·열람권·DB 구현, 실제 견적 수집·공개, 유료 가격·수수료 확정, 법률 문서 최종 확정
완료 조건: 제출자·제출물·열람 범위·기간이 명확하고, 무료 기본 정보 보장, 조작·개인정보·오래된 견적 통제, 양측 정정·삭제·이의, 무료 MVP/후속 수익 분리, 실제 데이터·제품·외부 실행 0건
검증 방법: 반복·허위·업체 위장·개인정보·조건 없는 금액·오래된 견적·업체 이의·고객 삭제·혜택 악용 시나리오
실행할 테스트: 동일 hash 반복, 핵심 조건 누락, 민감 원본, 광고성 제출, 분쟁, 권리 철회, 혜택 회수
위험요소: 가짜 견적 양산, 개인정보·영업정보 노출, 오래된 가격 오인, 업체 비방·광고, 열람 장벽으로 기본 가치 훼손
롤백 방법: 전용 정책 보고서만 폐기
사용자 승인 필요 여부: 결정안 작성은 불필요. 실제 원본 수집·열람 혜택·유료화 구현은 사용자 승인 필요
권장 브랜치명: biz/BIZ-009-quote-contribution-policy
현재 상태: DONE (총괄 PM PASS, 무료 MVP 견적 기여·상세 열람 정책 결정안 완료)
```

## OPS-026

```text
작업 ID: OPS-026
작업명: BE-016 신규 공식 증거 Git 추적 경계 설계
담당 전문 에이전트: quality-security
현재 문제: BE-016 신규 evidence 6개가 기존 exact allowlist 밖에서 ignored 상태라 다른 PC 재현이 끊기지만, backend 전체를 열면 실제 데이터·DB·미검수 파일이 추적될 수 있다.
사업적 목적: 공식 계약 증거만 안전하게 보존하고 로컬 원본·실제 업체 데이터·비밀은 계속 차단한다.
근거 문서: D-36, BE-016, OPS-018, OPS-019, OPS-021, R-67, R-83
선행 작업: BE-016 DONE
후속 작업: 총괄 PM 검수 → exact `.gitignore` 구현 카드 → 비밀·경계 QA → 별도 Git 반영 승인
수정 허용 경로: ops/reports/OPS-026-be016-evidence-git-boundary.md
수정 금지 경로: 그 외 모든 파일, .gitignore, evidence 내용, 제품·DB·원본·workspace·temp·cache, git add·commit·push·PR, CHG-A~C
공유 계약: 신규 allow는 BE-016 JSON 3개와 SHA256SUMS 3개 exact path뿐이며 directory wildcard와 backend 전체 예외를 금지한다.
구현 범위: 현재 ignore 재현, exact 6-file negation 설계, deny fixture, 비밀·대용량·실제 업체값·reparse 검사, 예상 추적 집합
구현하지 않을 범위: 실제 ignore 수정, stage·commit·push, evidence 보완, 제품·데이터 변경
완료 조건: exact 6-file allowlist·상위 negation·deny·검증 명령·예상 결과, 외부 상태 변경 0
검증 방법: git check-ignore -v, exact set, SHA manifest, secret/data/size/reparse deny
실행할 테스트: 허용 6개, sibling 파일, DB·CSV·workspace·cache·secret·1MiB 초과·reparse
위험요소: 넓은 negation, hash 불일치 파일 추적, evidence에 실제 업체값·비밀 혼입
롤백 방법: 전용 보고서만 폐기
사용자 승인 필요 여부: 설계 불필요. `.gitignore` 구현·GitHub 반영은 별도 검수·승인
권장 브랜치명: ops/OPS-026-be016-evidence-boundary
현재 상태: DONE (총괄 PM PASS, exact 6-file 경계·deny·검증·구현 카드 완료)
```

## QA-032

```text
작업 ID: QA-032
작업명: 견적 기여·상세 열람 개인정보·악용 사전 검수
담당 전문 에이전트: quality-security
현재 문제: BIZ-009 정책은 방향을 정했지만 실제 업로드가 최소수집·권리·조작·IDOR·삭제·열람권 원자성 위험을 안전하게 통제하는지 독립 검수가 필요하다.
사업적 목적: 고객 기여를 유도하면서 개인정보 사고·가짜 견적·업체 분쟁으로 신뢰가 무너지는 것을 막는다.
근거 문서: D-24, D-25, D-29, D-37, BIZ-009, OPS-025, QA-013, QA-015, R-29, R-40, R-82
선행 작업: BIZ-009·OPS-025 DONE
후속 작업: BE-017 데이터 계약 → 사용자 D-38 → 구현 카드·QA-003 E2E
수정 허용 경로: ops/reports/QA-032-quote-contribution-preimplementation-review.md
수정 금지 경로: 그 외 모든 파일, 실제 견적·개인정보, 제품·DB·API·Storage·SQL·환경변수·패키지, 법률 문서 확정, 외부 실행, CHG-A~C
공유 계약: 기본 서비스는 견적 제출 없이 제공하고 제한 원본·구조화 정보·공개 projection·열람권을 분리한다.
구현 범위: 정책 대조, 20개 이상 위협, 통제·fail-closed, 180/365일·24개월·30/90일 검수, BE-017 요구사항
구현하지 않을 범위: 실제 구현·수집·법률 확정·가격·과금
완료 조건: 위협 20개 이상, 명확한 판정, 구현 차단 조건, BE-017 필수 계약, 실제 데이터·코드 0
검증 방법: 법령·D-24/D-25/OPS-008 대조, STRIDE·개인정보·원자성 시나리오
실행할 테스트: IDOR, 악성 파일, 로그·분석 노출, 중복·도용, 업체 위장, 기밀, 철회·삭제·backup, grant 부분 실패
위험요소: 정책 PASS를 법률 확정·기술 안전으로 오인
롤백 방법: 전용 보고서만 폐기
사용자 승인 필요 여부: 검수 불필요. 실제 업로드·원본 저장·열람권은 D-38 필요
권장 브랜치명: qa/QA-032-quote-preimplementation-review
현재 상태: DONE (총괄 PM PASS, 위협 32개·fail-closed·BE-017 필수 계약 완료; 제품 구현은 D-38 대기)
```

## BE-017

```text
작업 ID: BE-017
작업명: 업체 직접등록·고객제안·견적 통합 데이터 계약
담당 전문 에이전트: backend-data
현재 문제: OPS-025와 BIZ-009의 운영·사업 정책을 현재 source/assertion/projection·Auth/RLS 구조에 연결할 구현 전 데이터 계약이 없다.
사업적 목적: 스튜디오·스냅을 포함한 직접 공급 확보와 견적 공유 기능을 재작성·권한 누수 없이 구현할 기준을 만든다.
근거 문서: BE-006, OPS-008, OPS-025, BIZ-009, QA-032, D-24~D-25, D-37
선행 작업: QA-032 PASS
후속 작업: 총괄 PM 검수 → D-38 → migration/API/FE/QA 단일 소유 구현 카드
수정 허용 경로: ops/reports/BE-017-provider-contribution-quote-data-contract.md
수정 금지 경로: 그 외 모든 파일, 제품·DB·SQL·migration·API·Storage·RLS, 실제 업체·고객·견적·개인정보, 환경변수·패키지, CHG-A~C
공유 계약: source→observation→submission→assertion→approved projection을 분리하고 quote evidence와 access grant는 공개 projection에 포함하지 않는다.
구현 범위: 엔터티·ID·필드·관계·상태·불변조건, 공개/제한/비밀, 보유·삭제·권한, 원자성, 기존 스키마 영향, 후속 카드 분리
구현하지 않을 범위: 실제 schema·migration·API·UI·RLS·데이터
완료 조건: 전체 계약과 QA-032 통제, 공개 누출 0 설계, 후속 구현 카드 분리 가능, 실제 변경 0
검증 방법: BE-006/OPS-008 상태 대조와 IDOR·중복·철회·만료·부분 실패 시나리오
실행할 테스트: provider/customer/quote 출처 혼합, evidence 무권한 열람, quote 승인+grant 부분 실패, 삭제 후 backup 부활
위험요소: 목표 계약을 현재 DB에 바로 적용해 운영 데이터·권한 손상
롤백 방법: 전용 보고서만 폐기
사용자 승인 필요 여부: 설계 불필요. 실제 DB·개인정보·제품 구현은 D-38·D-31 E2E 뒤 별도 승인
권장 브랜치명: be/BE-017-contribution-quote-contract
현재 상태: DONE (QA-032 PASS 반영, 총괄 PM PASS; 실제 DB·제품 구현은 D-38·QA-003 대기)
```

## OPS-027

```text
작업 ID: OPS-027
작업명: BE-016 공식 근거 exact Git 경계 로컬 구현
담당 전문 에이전트: quality-security
현재 문제: OPS-026은 새 근거 6개의 안전 경계를 설계했지만 현재 `.gitignore`에서는 모두 ignored라 다른 PC 보존 준비가 완료되지 않았다.
사업적 목적: 공식 계약 근거만 재현 가능하게 노출하고 실제 데이터·DB·비밀은 계속 차단한다.
근거 문서: OPS-019, OPS-026, BE-016, R-83
선행 작업: OPS-026 PASS
후속 작업: 총괄 PM 검수 → 별도 Git 변경 집합·승인
수정 허용 경로: .gitignore, ops/reports/OPS-027-be016-evidence-git-boundary-implementation.md
수정 금지 경로: 그 외 모든 파일, evidence 내용, git add·commit·push·PR, 제품·DB·원본·workspace·temp·cache, CHG-A~C
공유 계약: 기존 tracked 9개와 신규 6개 exact path만 허용하며 wildcard로 새 파일을 자동 노출하지 않는다.
구현 범위: exact negation 추가, positive/deny, tracked/untracked 집합, UTF-8 JSON·hash·비밀·크기·reparse 검사
구현하지 않을 범위: evidence 수정, stage·원격 반영, 공공데이터 실행, 제품 변경
완료 조건: 신규 6개만 visible untracked, 기존 9개 tracked, deny 전부 ignored, index·원격 변경 0
검증 방법: git check-ignore, ls-files, UTF-8 parse, SHA256, count-only secret, metadata 검사
실행할 테스트: allow 6, sibling/raw/DB/secret/workspace/temp/cache, 1MiB, reparse
위험요소: 넓은 allow, 예상 외 backend 노출, 검수 전 stage
롤백 방법: `.gitignore`의 OPS-027 exact block만 제거, evidence는 보존
사용자 승인 필요 여부: 로컬 exact 구현은 현재 자동 진행 범위. stage·commit·push·PR은 별도 승인
권장 브랜치명: ops/OPS-027-be016-evidence-boundary
현재 상태: DONE (총괄 PM PASS, exact 6-file 로컬 구현·검증 완료; GitHub 반영은 D-39 대기)
```

## QA-033

```text
작업 ID: QA-033
작업명: 현행 업체·견적 SQL 개인정보·스키마 차이 감사
담당 전문 에이전트: quality-security
현재 문제: BE-017 목표 계약과 현행 admin-schema/001~005의 generic JSON, 사업자번호, 파일 경로, 포인트 RPC, RLS·Storage 사이의 정확한 차이가 구현 카드 단위로 분해되지 않았다.
사업적 목적: 기존 기능을 성급히 재사용해 개인정보·권한·보상 정책이 깨지는 것을 막는다.
근거 문서: BE-006, BE-017, QA-015, QA-032, D-24, D-38, R-70~R-85
선행 작업: BE-017 PASS
후속 작업: BE-018·D-38 → additive migration/RLS/Storage 카드
수정 허용 경로: ops/reports/QA-033-current-schema-privacy-delta.md
수정 금지 경로: 그 외 모든 파일, SQL·DB·RLS·Storage·제품·실제 데이터·CHG-A~C
공유 계약: 정적 파일 근거만 사용하고 운영 DB의 실제 객체·행은 OPS-023/QA-003 전 추정하지 않는다.
구현 범위: 관련 table/column/policy/RPC/bucket 전수, 일치·조건부·금지 분류, 위험·선후관계
구현하지 않을 범위: SQL 수정, migration, 데이터 조회·정리, 실제 E2E
완료 조건: 파일·줄 근거, 위험도, BE-017 매핑, 사용 금지 객체, additive·정리·E2E 순서
검증 방법: rg DDL/policy/RPC/storage 전수 검색과 D-24/BE-017 대조
실행할 테스트: 사업자번호 저장, generic file paths, 포인트 승인, 공개 UUID, IDOR, 삭제·로그·부분 실패 시나리오
위험요소: 정적 선언을 운영 적용 상태로 오인, 기존 행을 임의 삭제
롤백 방법: 전용 보고서만 폐기
사용자 승인 필요 여부: 감사 불필요. 운영 DB 확인·migration·삭제는 별도 승인
권장 브랜치명: qa/QA-033-schema-privacy-delta
현재 상태: DONE (총괄 PM PASS, 현행 관련 객체 25개·P0 6개·P1 10개 정적 delta 확정)
```

## BE-018

```text
작업 ID: BE-018
작업명: 업체·견적 통합 계약 합성 수용 테스트 명세
담당 전문 에이전트: backend-data
현재 문제: BE-017의 상태·권한·원자성·보유 계약을 실제 migration 전에 반복 검증할 fixture와 기대 결과가 없다.
사업적 목적: 실제 개인정보 없이 실패를 먼저 재현해 안전한 구현·수익 검증 기반을 만든다.
근거 문서: BE-017, QA-032, QA-033, QA-015, D-24, D-38
선행 작업: QA-033 PASS
후속 작업: D-38 → migration/API/FE → QA-003 E2E
수정 허용 경로: ops/reports/BE-018-contribution-quote-synthetic-test-spec.md
수정 금지 경로: 그 외 모든 파일, 제품·DB·SQL·migration·RLS·Storage·API·실제 데이터·비밀·CHG-A~C
공유 계약: 합성 actor/provider/quote/evidence만 사용하고 미결정 정책은 fail-closed 기대값으로 둔다.
구현 범위: fixture 사전, 상태 전이, 역할 allow/deny, IDOR·중복·악성 파일·로그·원자성·만료·삭제·backup 수용 테스트
구현하지 않을 범위: 실제 SQL·테스트 코드·환경·외부 호출
완료 조건: 최소 30개 테스트, BE-017 불변조건·QA-032 P0 전부 추적, 실패 주입·cleanup·재실행 포함
검증 방법: 요구사항 traceability matrix와 positive/negative/rollback/expiry/deletion coverage
실행할 테스트: 문서 구조·번호·coverage 정적 검사
위험요소: 명세 통과를 실제 기술 E2E PASS로 오인
롤백 방법: 전용 보고서만 폐기
사용자 승인 필요 여부: 명세 불필요. 실제 환경·개인정보·제품 구현은 D-38·QA-003 필요
권장 브랜치명: be/BE-018-quote-synthetic-test-spec
현재 상태: DONE (총괄 PM PASS, 합성 수용 52개·레거시 회귀 6개·실패 주입 10개 명세)
```

## OPS-028

```text
작업 ID: OPS-028
작업명: BE-016 신규 공식 근거 exact GitHub 별도 브랜치 보존
담당 전문 에이전트: quality-security
현재 문제: OPS-027 신규 근거 6개와 .gitignore는 로컬에만 있고 GitHub에는 보존되지 않았다.
사업적 목적: 공식 근거 재현성을 다른 PC에서도 확보하되 dirty 제품·DB·운영 문서를 섞지 않는다.
근거 문서: OPS-021, OPS-026, OPS-027, D-36, D-39
선행 작업: OPS-027 PASS, D-39 승인
후속 작업: 별도 검수, 필요 시 PR 결정
수정 허용 경로: .gitignore와 BE-016 신규 evidence exact 6개
수정 금지 경로: 그 외 모든 파일, 제품·DB·원본·workspace·temp·cache·운영 문서·CHG-A~C·main
공유 계약: 안전한 별도 작업 공간에서 exact 7개만 stage/commit/push하고 PR·main·배포하지 않는다.
구현 범위: branch 기반 확인, exact delta, hash·secret·deny, commit·push
구현하지 않을 범위: PR, main 병합, 배포, evidence 수정, 제품 변경
완료 조건: exact 7-file commit, 검증 PASS, 별도 branch push, PR/main/배포 0
검증 방법: staged diff, UTF-8 JSON, SHA256, secret, git object file list
실행할 테스트: OPS-027 positive/deny와 remote commit exact list
위험요소: dirty 변경 혼입, 넓은 allow, 잘못된 base branch
롤백 방법: push 전 중단; push 후 별도 branch 삭제는 사용자 승인 아래 수행
사용자 승인 필요 여부: D-39 필요
권장 브랜치명: codex/ops-028-be016-evidence
현재 상태: DONE (commit 9cdfb6c, 원격 별도 branch push, PR·main·배포 0)
```

## BE-019

```text
작업 ID: BE-019
작업명: 업체·견적 v2 additive migration·최소권한 RPC/RLS 구현
담당 전문 에이전트: backend-data
현재 문제: BE-017 계약은 완성됐지만 현행 스키마는 QA-033 P0 6개 때문에 신규 견적 흐름에 재사용할 수 없다.
사업적 목적: 실제 견적 기여와 업체 직접 입력을 개인정보·권한·삭제 누수 없이 구현할 서버 기반을 만든다.
근거 문서: BE-017, QA-032, QA-033, BE-018, D-24, D-38, QA-003
선행 작업: D-38 승인 완료, OPS-023·QA-020 PASS, QA-003 수정 2차 PASS
후속 작업: FE 제출/관리자 UI → QA-003 v2 E2E → 별도 운영 승인
수정 허용 경로: migrations/015_provider_contribution_quote_v2.sql, scripts/tests/provider-contribution-quote-v2.mjs, scripts/tests/provider-contribution-quote-v2-model.mjs, ops/reports/BE-019-provider-contribution-quote-v2.md
수정 금지 경로: 운영 DB, 기존 행 destructive 변경, 제품 UI, 실제 데이터, 비밀, CHG-A~C
공유 계약: v2 additive만, 기존 claim/contribution/points/direct update 재사용 금지, public/case/evidence/grant 분리
구현 범위: v2 schema, RLS, server command, retention/deletion, 합성 tests
구현하지 않을 범위: 운영 적용, 기존 행 이관·삭제, UI, 외부 서비스
완료 조건: v2 additive 객체만 생성, 비공개 case/evidence와 공개 projection 분리, 기본 runtime 비활성, 제출·검수·승인·철회·분쟁·삭제 상태 계약과 RLS/RPC 최소권한 구현, 기존 객체 변경 0, 정적 계약 및 BE-018 상태 모델 테스트 통과
검증 방법: migration 정적 계약 검사, BE-018 결정론적 상태 모델, 기존 001~014 및 제품 파일 diff 0 확인. 실제 격리 DB E2E는 후속 QA 카드에서 수행
실행할 테스트: provider-contribution-quote-v2.mjs, provider-contribution-quote-v2-model.mjs, 기존 migration 보안 테스트 회귀
위험요소: 기존 DB 손상, 실제 개인정보 수집, 권한 우회
롤백 방법: 격리 환경 additive migration 폐기, 운영 미적용
사용자 승인 필요 여부: 격리 구현은 D-38 승인 범위. 실제 업로드·실제 견적·운영 DB 적용·외부 공개는 개인정보/법률 확인과 별도 운영 승인 필요
권장 브랜치명: codex/be-019-contribution-quote-v2
현재 상태: DONE (commit b969191 + Supabase 호환 수정 97a5dfb, 정적 28/28·MODEL_ONLY 60/60·PGlite·독립 reviewer PASS, 운영 적용 0)
```

## QA-041

```text
작업 ID: QA-041
작업명: 업체·견적 v2 실제 격리 Supabase RPC/RLS E2E
담당 전문 에이전트: quality-security
현재 문제: BE-019는 PGlite와 계약 검사에서 통과했지만 실제 Supabase Auth·RLS·PostgREST 동작은 아직 검증하지 않았다.
사업적 목적: 실제 견적 수집 기능을 켜기 전에 사용자·업체·운영자 권한과 개인정보 삭제 경계를 운영과 분리된 환경에서 검증한다.
근거 문서: BE-019, BE-018, BE-017, QA-032, QA-033, QA-003, D-38
선행 작업: BE-019 commit b969191 + 97a5dfb 및 독립 보안 reviewer PASS
후속 작업: 결과 독립 검수 → OPS 설치 문서 migration 015 반영 → 개인정보·약관·scanner/preview 별도 승인
수정 허용 경로: scripts/tests/provider-contribution-quote-v2-supabase-e2e.mjs, ops/reports/QA-041-provider-contribution-quote-v2-e2e.md, 격리 Supabase의 QA-041 전용 합성 계정·행·Storage 없는 metadata
수정 금지 경로: migration 001~015, 제품 UI, 운영 DB, 실제 고객·업체·견적·증빙, Storage bucket/policy, 외부 알림, 환경변수·비밀의 저장, CHG-A~C, main·production
공유 계약: BE-019 b969191 + 호환 수정 97a5dfb, runtime은 시작·종료 시 모두 false, 합성 namespace만 사용하고 종료 잔여 0
구현 범위: migration 015 최초·멱등 적용, Auth 역할별 RPC/RLS, AAL1 거부·AAL2 2인 검수, 동일 HMAC 중복, 업체 계정 고객 보상 위장, 공개 RPC 최소 열, 철회·독립 분쟁 재심·삭제·계정 삭제 연계
구현하지 않을 범위: 실제 파일 업로드, Storage/signed URL/scanner/preview, 실제 견적·개인정보, 운영 적용, UI, 배포
완료 조건: anon/customer/provider/content/operations 역할 기대값 일치, 원검수자 분쟁 재심 거부, 9-target 완료 전 삭제 미완료·완료 후 private 잔여 0, 계정 삭제 조기 완료 거부, 전용 합성 Auth·행·함수·역할 잔여 0, runtime 4종 false 복구
검증 방법: 격리 프로젝트에서 SQL/API 역할 E2E, 시작·종료 count 감사, secret·PII output 0
실행할 테스트: provider-contribution-quote-v2.mjs, provider-contribution-quote-v2-model.mjs, provider-contribution-quote-v2-supabase-e2e.mjs, 기존 migration·계정 삭제 보안 회귀
위험요소: 격리 프로젝트 기존 합성 fixture 오염, runtime 복구 누락, 로그에 토큰·UUID·이메일 노출
롤백 방법: QA-041 합성 namespace만 삭제하고 runtime false 복구; migration 015는 격리 프로젝트에만 남기며 운영에는 적용하지 않음
사용자 승인 필요 여부: 없음. D-31·D-38의 격리 합성 검증 범위. 운영 DB·실제 업로드·공개 활성화는 별도 승인 필요
권장 브랜치명: codex/qa-041-provider-contribution-quote-v2-e2e
현재 상태: DONE (SQL managed-session PASS + QA-042 실제 GoTrue/JWT/PostgREST/TOTP AAL2 PASS)
```

## QA-042

```text
작업 ID: QA-042
작업명: 업체·견적 v2 실제 GoTrue JWT·PostgREST·AAL2 MFA E2E
담당 전문 에이전트: quality-security
현재 문제: QA-041 SQL 역할 E2E는 통과했지만 set local role/request.jwt.claims는 실제 로그인·서명 JWT·HTTP gateway·MFA 세션을 대체하지 않는다.
사업적 목적: 실제 고객·업체·운영자 브라우저 세션에서 서버 권한이 동일하게 차단·허용되는지 출시 전에 확인한다.
근거 문서: QA-041, BE-019, QA-032, BE-017, D-31, D-38
선행 작업: QA-041 SQL managed-session PASS, 종료 namespace 0·runtime false
후속 작업: QA-041 최종 판정 갱신 → BE-027 review queue → 설치 문서 015 반영
수정 허용 경로: scripts/tests/provider-contribution-quote-v2-auth-http-e2e.mjs, ops/reports/QA-042-provider-contribution-quote-v2-auth-http-e2e.md, 격리 Supabase의 QA-042 임시 합성 Auth·행·MFA factor
수정 금지 경로: migration 001~015, 제품 UI, 운영 DB, 실제 고객·업체·견적·증빙, Storage object/bucket/policy, 외부 알림, 비밀의 파일·보고서 저장, CHG-A~C, main·production
공유 계약: 정확한 Sonpum QA Isolated만 사용, 공개 anon key와 임시 credential은 메모리에서만 사용, runtime 시작·종료 false, 종료 Auth·factor·행 0
구현 범위: anon HTTP, 합성 customer/provider/content/operations 로그인, 실제 서명 JWT PostgREST base deny·RPC allow/deny, operations AAL1 deny, TOTP enrollment/challenge/verify 뒤 AAL2 허용, 세션·factor·Auth cleanup
구현하지 않을 범위: 실제 파일·Storage·scanner/preview, 실제 견적·개인정보, 외부 이메일/SMS, 운영 적용, 제품 변경
완료 조건: 실제 HTTP 상태와 DB 변화가 역할 기대값과 일치, AAL1/AAL2 경계 재현, 다른 프로젝트·실제 데이터 영향 0, 종료 전용 Auth·factor·행 0, runtime 4종 false, token/key/secret output 0
검증 방법: 브라우저에서 정확한 프로젝트 재식별, 메모리 전용 Node fetch, 전후 count-only 감사, 토큰 redaction
실행할 테스트: provider-contribution-quote-v2-auth-http-e2e.mjs, QA-041 preflight/cleanup, 기존 정적·SQL 역할 회귀
위험요소: 임시 credential 노출, MFA factor 잔존, 이메일 발송, 잘못된 프로젝트 선택
롤백 방법: QA-042 prefix 행과 임시 factor/Auth 삭제, 세션 폐기, runtime false 복구, final count 감사
사용자 승인 필요 여부: 없음. D-31·D-38 무료 격리 합성 범위. 운영·실제 사용자·외부 알림은 별도 승인 필요
권장 브랜치명: codex/qa-042-provider-contribution-quote-v2-auth-http-e2e
현재 상태: DONE (PASS, commit b84d307, 원격 별도 브랜치 보존 완료)
```

## BE-027

```text
작업 ID: BE-027
작업명: 운영 review queue 최소권한 RPC 계약
담당 전문 에이전트: backend-data
현재 문제: QA-041에서 private review case base table을 열지 않고 운영자가 review ID를 찾을 전용 조회 계약이 없음을 확인했다.
사업적 목적: 운영자가 검수 대상을 안전하게 찾고 배정하되 고객·업체·증빙·원본 식별자를 과도하게 열지 않는다.
근거 문서: QA-041, BE-019, BE-023, QA-038, R-94
선행 작업: QA-041 SQL 역할 E2E PASS
후속 작업: 운영 review client 단일 소유 카드와 실제 Auth E2E
수정 허용 경로: migrations/016_provider_contribution_review_queue_v2.sql, scripts/tests/provider-contribution-review-queue-v2.mjs, ops/reports/BE-027-provider-contribution-review-queue-v2.md
수정 금지 경로: migration 001~015, UI, base table browser grant, 운영 DB, 실제 자료, package/lock, CHG-A~C
공유 계약: operations 이상+AAL2, 최소 열·상태 필터·50 이하 page limit, contributor/evidence/private amount 비노출, 감사·base grant 0
구현 범위: review queue 조회와 필요한 review ID·source/event/risk/state/created time 최소 projection
구현하지 않을 범위: 검수 결정 재작성, UI, Storage, 실제 할당, 운영 적용
완료 조건: operations AAL2 allow, AAL1/content/provider/customer/anon deny, 금지 열 0, page limit, 기존 assign/decide 계약 불변, 최초·재적용 PASS
검증 방법: 정적 계약·PGlite·격리 Supabase 역할 테스트
실행할 테스트: 신규 review queue test와 BE-019·BE-023·BE-024 회귀
위험요소: 제출자 식별 노출, 대량 조회, base grant 회귀
롤백 방법: 격리 additive migration 폐기, 운영 미적용
사용자 승인 필요 여부: 없음. 격리 구현만. 운영 적용은 별도 승인 필요
권장 브랜치명: codex/be-027-v2-review-queue-rpc
현재 상태: DONE (PASS, commit 8e7eb81, 원격 별도 브랜치 보존 완료)
```

## QA-034

```text
작업 ID: QA-034
작업명: 기존 민감 claim·contribution·evidence metadata-only 운영 전 감사
담당 전문 에이전트: quality-security
현재 문제: 정적 SQL 위험은 확인됐지만 운영 DB에 기존 민감 행·객체가 실제 존재하는지 알 수 없다.
사업적 목적: 기존 데이터를 임의 삭제하지 않고 v2 전환·파기 범위를 정확히 산정한다.
근거 문서: QA-015, QA-033, BE-017, D-24, D-38
선행 작업: D-38·운영 DB read-only 접근 승인
후속 작업: 기존 행 이관·파기 별도 승인안
수정 허용 경로: 선행 완료 후 전용 보고서와 count-only query를 exact 지정
수정 금지 경로: 운영 데이터 변경·원문 출력·Storage download·제품·비밀·CHG-A~C
공유 계약: count/metadata만 보고 실제 값·파일을 열지 않는다.
구현 범위: 객체·행·기간·Storage count와 보유정책 gap
구현하지 않을 범위: UPDATE/DELETE/migration/download
완료 조건: 원문 0, count-only 결과, 후속 범위
검증 방법: read-only transaction, query allowlist, output secret/PII 0
실행할 테스트: rollback/read-only enforcement
위험요소: 운영 개인정보 출력·변경
롤백 방법: read-only session 종료, 산출물에 값이 있으면 안전 폐기·사고 검토
사용자 승인 필요 여부: D-38와 운영 DB read-only 접근 승인
권장 브랜치명: qa/QA-034-legacy-sensitive-metadata-audit
현재 상태: BLOCKED_D38
```

## FE-022

```text
작업 ID: FE-022
작업명: 후기 접수 성공 상태 오표시 보정
담당 전문 에이전트: frontend-design
현재 문제: 후기 RPC가 pending 행을 정상 생성한 뒤에도 비동기 event.currentTarget 참조 오류로 화면이 실패를 표시한다.
사업적 목적: 고객이 성공한 후기를 중복 제출하거나 서비스 오류로 오인하지 않게 한다.
근거 문서: QA-035, FE-021, BE-020, R-88
선행 작업: QA-035 REVISION_REQUIRED 판정
후속 작업: QA-036 격리 브라우저 재검증
수정 허용 경로: scripts/pages/provider.js, scripts/tests/review-submission-client.mjs, ops/reports/FE-022-review-success-state.md
수정 금지 경로: 그 외 모든 제품 파일, migrations, API·DB·라우팅·공통 토큰·환경변수·패키지·잠금 파일, CHG-A~C 원본, main·production
공유 계약: BE-020 taran_submit_review RPC 이름·payload·pending 서버 고정 계약은 변경하지 않는다.
구현 범위: form·status·submit button 참조를 await 전에 고정하고 성공·중복·실패 한국어 상태를 정확히 표시한다.
구현하지 않을 범위: 후기 스키마·검수 정책·디자인 전면 변경·새 필드·실제 데이터
완료 조건: 실제 RPC 성공 뒤 성공 문구와 form reset, pending 1건만 생성, 중복 오류 정확 표시, 기존 direct table 접근 0
검증 방법: 정적 계약 테스트와 격리 브라우저 고객 제출 재현
실행할 테스트: review-submission-client.mjs, build, validate-dist, QA-036 고객 후기 시나리오
위험요소: 성공 뒤 catch 진입, 중복 제출, event 참조 회귀
롤백 방법: FE-022 별도 branch 폐기, FE-021 commit ae12db2 유지
사용자 승인 필요 여부: 없음. 운영 반영·배포는 별도 승인 필요
권장 브랜치명: codex/fe-022-review-success-state
현재 상태: DONE
```

## BE-024

```text
작업 ID: BE-024
작업명: 관리자 업체 저장·소유권 심사·운영 지표 최소권한 계약
담당 전문 에이전트: backend-data
현재 문제: 관리자 업체 저장·상태 변경·소유권 심사가 차단된 base write를 직접 사용하고 dashboard/inquiries용 provider 지표 계약이 없다.
사업적 목적: 운영자가 업체를 검수·공개하고 소유권 요청을 원자적으로 처리하면서 내부 원본 권한은 열지 않는다.
근거 문서: QA-038, BE-015, BE-023, R-94
선행 작업: QA-038 PASS
후속 작업: FE-025·FE-026 병렬, QA-039
수정 허용 경로: 신규 migrations/012_admin_provider_operations.sql, 신규 전용 테스트, ops/reports/BE-024-admin-provider-operations.md
수정 금지 경로: 기존 migration, 모든 UI, base table anon/auth grant, 운영 DB, 실제 자료, 패키지·잠금 파일, CHG-A~C
공유 계약: owner/admin/operations만 save/status/claim review와 최소 provider operations snapshot 사용; content/customer/anon deny
구현 범위: provider ID 고정 save, 허용 status 변경, claim 승인·반려 원자성, owner UUID 대신 has_owner를 포함한 최소 운영 지표 read
구현하지 않을 범위: 후기·등록 승인 재작성, 업체 ID rename/delete, 역할 정책·디자인 변경, 실제 승인
완료 조건: operations allow, content/customer/anon deny, claim 중간 실패 rollback, save allowlist, status 검증, snapshot 금지 열 0, base grant 0, 멱등 적용
검증 방법: 정적 계약·격리 SQL 역할 E2E·실패 rollback·BE-022/023 회귀
실행할 테스트: admin-provider-operations.mjs, 기존 workspace/public projection 테스트
위험요소: SECURITY DEFINER 과권한, owner UUID·사업자번호 노출, 비원자적 소유권 승인
롤백 방법: 격리 migration 012 폐기, 운영 미적용
사용자 승인 필요 여부: 없음. 운영 DB 적용은 별도 승인 필요
권장 브랜치명: codex/be-024-admin-provider-operations
현재 상태: DONE
```

## FE-025

```text
작업 ID: FE-025
작업명: 관리자 업체 저장·상태·소유권 심사 RPC 연결
담당 전문 에이전트: frontend-design
현재 문제: providers.js의 save/toggle/claim review 버튼이 차단된 base write를 직접 호출한다.
사업적 목적: 운영자가 화면에서 업체 정보와 소유권 요청을 실패·부분 성공 없이 처리하게 한다.
근거 문서: QA-038, BE-024, FE-024
선행 작업: BE-024 PASS
후속 작업: QA-039
수정 허용 경로: scripts/pages/admin/providers.js, 신규 전용 테스트, ops/reports/FE-025-admin-provider-actions.md
수정 금지 경로: 다른 관리자 화면, migration, base grant, 패키지·잠금 파일, CHG-A~C, main·production
공유 계약: BE-024 save/status/claim review RPC만 사용하고 업체 편집 시 ID를 바꾸거나 삭제하지 않는다.
구현 범위: 세 direct write 제거, 버튼별 RPC 연결, 성공 뒤 독립 큐 refresh, 한국어 오류 표시 유지
구현하지 않을 범위: 관리자 디자인 개편, 후기·등록 승인 변경, 새 역할·공개 기능
완료 조건: providers/providerClaims direct write 0, operations 실제 저장·상태·승인/반려, content/customer deny, 부분 성공 0
검증 방법: 정적 client 테스트, build·dist, QA-039 브라우저 E2E
실행할 테스트: admin-provider-actions-client.mjs, validate-dist.mjs, QA-039
위험요소: ID 변경 삭제, 중복 클릭, 실패 뒤 버튼 비활성 유지
롤백 방법: 단일 client 커밋 폐기
사용자 승인 필요 여부: 없음. 운영 반영은 별도 승인 필요
권장 브랜치명: codex/fe-025-admin-provider-actions
현재 상태: DONE
```

## FE-026

```text
작업 ID: FE-026
작업명: 관리자 현황·운영 예외 최소 조회 연결
담당 전문 에이전트: frontend-design
현재 문제: dashboard.js와 inquiries.js가 차단된 providers/claims/registrations를 직접 읽고 오류를 0건으로 숨긴다.
사업적 목적: 운영자가 실제 대기 업무와 업체 상태를 누락 없이 확인하게 한다.
근거 문서: QA-038, BE-023, BE-024
선행 작업: BE-024 PASS
후속 작업: QA-039
수정 허용 경로: scripts/pages/admin/dashboard.js, scripts/pages/admin/inquiries.js, 신규 전용 테스트, ops/reports/FE-026-admin-operations-read.md
수정 금지 경로: providers.js, migration, 다른 관리자 화면, 패키지·잠금 파일, CHG-A~C, main·production
공유 계약: claims/registrations는 BE-023, provider 운영 지표는 BE-024 RPC 사용; 실패와 실제 0건을 구분한다.
구현 범위: 세 direct read 제거, 페이지별 독립 요청, 오류 안내와 성공 큐 보존
구현하지 않을 범위: 지표 정의 변경, 디자인 개편, 다른 테이블 권한 수정
완료 조건: 두 파일의 세 base read 0, 실제 건수 표시, 한 RPC 실패 시 다른 업무 유지, content/customer deny
검증 방법: 정적 client 테스트, build·dist, QA-039 역할 브라우저 E2E
실행할 테스트: admin-operations-read-client.mjs, validate-dist.mjs, QA-039
위험요소: 실패를 0으로 오표시, 내부 UUID DOM 노출
롤백 방법: 두 client 커밋 폐기
사용자 승인 필요 여부: 없음. 운영 반영은 별도 승인 필요
권장 브랜치명: codex/fe-026-admin-operations-read
현재 상태: DONE
```

## QA-039

```text
작업 ID: QA-039
작업명: 관리자 업체 업무 역할·원자성 최종 격리 E2E
담당 전문 에이전트: quality-security
현재 문제: BE-024·FE-025·FE-026 결합 뒤 실제 버튼·현황·운영 예외와 역할 경계를 검증해야 한다.
사업적 목적: 공개 전 관리자 핵심 운영이 실제로 동작하고 내부 정보가 새지 않게 한다.
근거 문서: QA-038, BE-024, FE-025, FE-026
선행 작업: 세 구현 PASS
후속 작업: Auth 최종 삭제 worker, QA-003 최종 판정
수정 허용 경로: 전용 QA 보고서와 QA-003 상태만
수정 금지 경로: 제품·migration, 운영 DB, 실제 자료, main·production
공유 계약: 합성 자료만, 외부 알림 0, 종료 잔존 0
구현 범위: operations 저장·상태·claim 승인/반려, 실패 rollback, dashboard/inquiries 건수, content/customer deny
구현하지 않을 범위: Auth worker, 실제 업체 승인·연락, 운영 적용
완료 조건: 역할·원자성·세 화면·회귀·cleanup 모두 PASS
검증 방법: 격리 SQL 역할 E2E와 실제 브라우저
실행할 테스트: BE/FE 전용 테스트, build·dist, 실제 Auth 세션
위험요소: 합성 자료 잔존, 버튼 일부 성공, 내부 필드 노출
롤백 방법: 합성 자료 정리, 결합 worktree 폐기
사용자 승인 필요 여부: 없음
권장 브랜치명: codex/qa-039-admin-operations-e2e
현재 상태: DONE
```

## BE-021

```text
작업 ID: BE-021
작업명: 관리자 본인 역할 조회 최소권한 보정
담당 전문 에이전트: backend-data
현재 문제: authenticated 역할에 taran_admin_profiles SELECT privilege가 없어 operations/content 관리자 화면이 역할 확인 단계에서 실패한다.
사업적 목적: 운영자에게 필요한 메뉴만 열고 일반 회원에게 관리자 정보는 노출하지 않는다.
근거 문서: QA-035, BE-014, FE-019, R-81, R-89
선행 작업: QA-035 REVISION_REQUIRED 판정
후속 작업: BE-022 공개 projection 보안 보정, QA-036 역할 브라우저 재검증
수정 허용 경로: migrations/009_admin_profile_self_access.sql, scripts/tests/admin-profile-self-access.mjs, ops/reports/BE-021-admin-profile-self-access.md
수정 금지 경로: 기존 migration 수정, 관리자 UI, 공개 provider/review view, 운영 DB, 실제 계정, 환경변수·패키지·잠금 파일, CHG-A~C, main·production
공유 계약: authenticated는 자신의 admin profile 행만 읽고 일반 회원은 0행, owner/admin/operations/content 역할 값은 기존대로 유지한다.
구현 범위: additive·멱등 grant/RLS 또는 동등한 최소권한 self-profile RPC, customer/operations/content 교차 역할 테스트
구현하지 않을 범위: 역할 생성·승격 UI, 전체 admin table 권한 확대, Security Advisor 공개 view 수정
완료 조건: operations/content 본인 역할 1행, customer·타인 profile 0행, 수정·삽입·삭제 거부, 재실행 성공
검증 방법: 격리 SQL 역할 E2E와 실제 admin shell 메뉴 비교
실행할 테스트: 신규 migration 정적 테스트, customer/operations/content allow·deny, QA-036
위험요소: 일반 회원 역할 열람, 타 관리자 이메일 노출, content 과권한
롤백 방법: 별도 격리 migration 폐기; 운영 미적용
사용자 승인 필요 여부: 없음. 운영 DB 적용은 별도 승인 필요
권장 브랜치명: codex/be-021-admin-profile-self-access
현재 상태: READY
```

## BE-022

```text
작업 ID: BE-022
작업명: 공개 provider·review projection Security Advisor 오류 해소
담당 전문 에이전트: backend-data
현재 문제: taran_public_providers와 taran_public_reviews가 Security Definer View 오류로 탐지된다.
사업적 목적: 내부 UUID·비공개 값을 숨기면서도 공개 조회가 view 소유자 권한을 무조건 상속하지 않게 한다.
근거 문서: QA-035, BE-014, BE-015, FE-020, R-73, R-90
선행 작업: BE-021 완료 후 DB 공통 migration 순차 적용
후속 작업: QA-036 Security Advisor·anon/auth 공개 조회 재검증
수정 허용 경로: 선행 완료 후 신규 additive migration·전용 테스트·ops/reports/BE-022-public-projection-security.md를 revision에서 exact 지정
수정 금지 경로: 기존 migration 수정, base table 전체 SELECT 허용, 제품 UI, 운영 DB, 실제 데이터, 패키지·잠금 파일, CHG-A~C
공유 계약: anon/auth는 승인된 공개 projection만 읽고 base table과 내부 UUID·이메일·원문은 계속 거부된다.
구현 범위: 보안 어드바이저 오류 2건을 제거하는 최소 projection 계약과 역할·열 allowlist 테스트
구현하지 않을 범위: 공개 필드 확대, provider/review 데이터 이관, 전체 SECURITY DEFINER warning 일괄 변경
완료 조건: Advisor 오류 2→0, 공개 allow 유지, base table deny·금지 열 0, 멱등·rollback 근거
검증 방법: 격리 Advisor 재실행과 anon/customer/operations SQL·브라우저 E2E
실행할 테스트: 공개 projection allow·deny, base table deny, 내부 필드 비노출, build adapter 회귀
위험요소: security_invoker 전환 중 base table 권한 확대, 공개 목록 0건 회귀
롤백 방법: 격리 신규 migration 폐기; 운영 미적용
사용자 승인 필요 여부: 없음. 운영 DB 적용은 별도 승인 필요
권장 브랜치명: codex/be-022-public-projection-security
현재 상태: READY_AFTER_BE021
```

## QA-036

```text
작업 ID: QA-036
작업명: 후기·역할·Storage·보안 어드바이저 최종 격리 재검증
담당 전문 에이전트: quality-security
현재 문제: QA-035에서 후기 성공 오표시, 관리자 역할 조회 실패, 공개 view 오류와 실제 파일 업로드 미완료가 남았다.
사업적 목적: 운영 적용 전 실제 브라우저와 Supabase 권한이 같은 결과를 내는지 최종 확인한다.
근거 문서: QA-035, QA-003, FE-022, BE-021, BE-022
선행 작업: FE-022·BE-021·BE-022 완료, Chrome 확장 로컬 파일 URL 접근 허용
후속 작업: QA-003 PASS 또는 남은 최소 보정, 이후 OPS-024
수정 허용 경로: ops/reports/QA-036-final-isolated-e2e.md, QA-003 최종 상태
수정 금지 경로: 제품 코드·migration·운영 DB·실제 계정·실제 업체·외부 발송·main·production
공유 계약: example.invalid 계정과 합성 파일만 사용하고 종료 시 Auth·DB·Storage 잔존 0을 확인한다.
구현 범위: 고객 후기 성공/중복, operations/content 메뉴, Storage upload/signed URL/delete, 공개 view Advisor, Auth 삭제 worker 준비 상태
구현하지 않을 범위: 운영 적용·배포·실제 증빙·외부 연락
완료 조건: 모든 allow/deny·UI·DB 불변·cleanup 근거와 QA-003 최종 판정
검증 방법: 실제 브라우저, Storage API, SQL 역할 E2E, Advisor 재실행
실행할 테스트: 후기·관리자·Storage·Auth cleanup 전체 시나리오
위험요소: 합성 데이터 잔존, 권한 확대, 외부 전송
롤백 방법: 합성 객체·계정 삭제, 격리 세션 종료
사용자 승인 필요 여부: 없음. Chrome 확장 설정은 사용자 조치 필요
권장 브랜치명: qa/QA-036-final-isolated-e2e
현재 상태: BLOCKED_BROWSER_PERMISSION_AND_FIXES
```

## FE-023

```text
작업 ID: FE-023
작업명: 업체 등록 동의 버전 전송 보정
담당 전문 에이전트: frontend-design
현재 문제: 실제 파일 업로드 뒤 taran_submit_provider_registration RPC가 요구하는 consent_version이 누락되어 등록 접수가 실패한다.
사업적 목적: 업체가 자료를 올린 뒤 같은 화면에서 등록 요청까지 정상 완료하게 한다.
근거 문서: QA-036, BE-014, provider-register.js
선행 작업: QA-036 실제 Storage 업로드 재현
후속 작업: QA-036 업체 등록 성공·Storage cleanup 재검증
수정 허용 경로: scripts/pages/provider-register.js, scripts/tests/provider-registration-consent.mjs, ops/reports/FE-023-provider-registration-consent.md
수정 금지 경로: 다른 제품 파일, migration, API·DB·라우팅·공통 설정, 패키지·잠금 파일, CHG-A~C, main·production
공유 계약: consent_version은 provider-registration-v1로 고정하고 개인정보·담당자 필드는 기존 이름을 유지한다.
구현 범위: 등록 RPC payload에 현재 동의 버전 추가, 누락 회귀 정적 검사, 격리 브라우저 재접수
구현하지 않을 범위: 동의 문구 변경, 새 개인정보 수집, 업체 승인·공개, 운영 DB 적용
완료 조건: 합성 PDF 업로드 뒤 pending 등록 1건과 성공 화면, 서버 동의 오류 0, 기존 4단계 검증 유지
검증 방법: 전용 정적 테스트, build·dist, 격리 브라우저·DB 확인
실행할 테스트: provider-registration-consent.mjs, validate-dist.mjs, QA-036 등록 흐름
위험요소: 동의 없는 접수, 파일만 남고 등록행이 없는 고아 객체
롤백 방법: 단일 client 변경 커밋 폐기, 합성 object·등록행 삭제
사용자 승인 필요 여부: 없음. 운영 반영은 별도 승인 필요
권장 브랜치명: codex/fe-023-provider-registration-consent
현재 상태: DONE
```

## QA-038

```text
작업 ID: QA-038
작업명: 관리자 업체 업무 잔여 직접 접근 감사
담당 전문 에이전트: quality-security / reviewer
현재 문제: 업체 관리의 조회는 복구됐지만 providers.js의 직접 write와 dashboard.js·inquiries.js의 claims/registrations 직접 read가 차단된 base 계약과 맞는지 확인되지 않았다.
사업적 목적: 운영자가 보이는 버튼을 눌렀을 때 실패하지 않고, 필요한 내부 업무만 최소권한으로 수행하게 한다.
근거 문서: QA-037, BE-014, BE-015, BE-023, FE-024, R-94
선행 작업: QA-037 PASS
후속 작업: BE-024 → FE-025·FE-026 → QA-039
수정 허용 경로: 없음(읽기 전용), 검수 결과는 총괄 PM에게 반환
수정 금지 경로: 모든 제품·migration·운영 문서, 격리·운영 DB, 실제 자료, main·production
공유 계약: base table browser grant 0, 승인·상태 변경은 역할 확인 원자적 RPC만 사용
구현 범위: 관리자 관련 direct list/upsert/update/remove 전수 목록, 현 grant/RLS/RPC 대조, 실패 영향과 최소 후속 범위
구현하지 않을 범위: 코드·DB 수정, 실제 승인, 역할 정책 변경, 디자인 개편
완료 조건: 잔여 호출의 파일·함수·역할·현재 결과·위험도·대체 계약과 서로 겹치지 않는 후속 카드 경계가 명확함
검증 방법: rg 기반 호출 전수, migration grant/RLS/RPC 대조, 기존 보고서와 중복 검사
실행할 테스트: 읽기 전용 정적 검색과 기존 테스트 목록 확인
위험요소: 실패를 빈 배열로 숨겨 운영 누락, 직접 write 재개방으로 과권한 회귀
롤백 방법: 읽기 전용 감사이므로 해당 없음
사용자 승인 필요 여부: 없음
권장 브랜치명: 없음(읽기 전용)
현재 상태: DONE
```

## BE-023

```text
작업 ID: BE-023
작업명: 운영자 업체 관리 조회 최소권한 계약
담당 전문 에이전트: backend-data
현재 문제: 공개 base table 차단 뒤 운영자 업체 관리 화면이 providers·claims·registrations를 직접 읽어 전체 초기화가 중단된다.
사업적 목적: 내부 자료를 공개하지 않으면서 운영자가 업체·후기·등록 검수 업무를 수행하게 한다.
근거 문서: QA-036, BE-014, BE-015, BE-022
선행 작업: QA-036 범위 실패 근거와 실제 필요한 열 allowlist 확정
후속 작업: FE-024 관리자 화면 전용 RPC 연결
수정 허용 경로: 신규 additive migration, 전용 테스트, ops/reports/BE-023-admin-provider-workspace-rpc.md
수정 금지 경로: base table anon/auth 전체 SELECT, 관리자 UI, 운영 DB, 실제 자료, 패키지·잠금 파일, CHG-A~C
공유 계약: owner/admin/operations만 최소 열을 전용 RPC로 읽고 content/customer/anon은 거부한다.
구현 범위: 업체 목록·소유권 요청·등록 요청을 위한 operations 전용 읽기 계약과 역할 E2E
구현하지 않을 범위: 승인 정책 변경, 공개 필드 확대, 실제 업체 승인·연락
완료 조건: operations 최소 목록 allow, content/customer/anon deny, 내부 자료 공개 projection 0, 멱등 적용
검증 방법: 격리 SQL 역할 E2E와 허용 열 비교
실행할 테스트: 전용 migration 정적 테스트, 역할 allow·deny, BE-022 회귀
위험요소: 사업자번호·증빙 경로·담당자 이메일 과다 노출, base table 권한 회귀
롤백 방법: 신규 격리 migration 폐기, 운영 미적용
사용자 승인 필요 여부: 없음. 운영 DB 적용은 별도 승인 필요
권장 브랜치명: codex/be-023-admin-provider-workspace-rpc
현재 상태: DONE
```

## FE-024

```text
작업 ID: FE-024
작업명: 관리자 업체 관리 전용 계약 연결
담당 전문 에이전트: frontend-design
현재 문제: admin/providers.js가 차단된 base table을 직접 읽어 목록·검수 큐 초기화가 중단된다.
사업적 목적: 운영자가 업체 등록과 후기 검수를 실제 화면에서 이어서 처리하게 한다.
근거 문서: QA-036, BE-023, FE-021
선행 작업: BE-023 PASS
후속 작업: QA-037 관리자 업체 관리 브라우저 E2E
수정 허용 경로: scripts/pages/admin/providers.js, 전용 테스트, ops/reports/FE-024-admin-provider-workspace-client.md
수정 금지 경로: 다른 관리자 화면, migration, base table 권한, 패키지·잠금 파일, CHG-A~C, main·production
공유 계약: 목록은 BE-023 전용 RPC만 사용하고 후기 검수·등록 승인 기존 RPC는 유지한다.
구현 범위: 화면 초기 조회를 전용 RPC로 전환하고 일부 큐 실패가 전체 화면을 막지 않게 분리한다.
구현하지 않을 범위: 관리자 디자인 개편, 승인 정책·역할 변경, 새 공개 기능
완료 조건: operations 업체·후기·등록 큐 표시, content 메뉴·데이터 거부, base table 직접 읽기 0
검증 방법: 전용 정적 테스트, build·dist, 격리 관리자 브라우저 E2E
실행할 테스트: admin-provider-workspace-client.mjs, validate-dist.mjs, QA-037
위험요소: 한 큐 오류로 전체 초기화 중단, 내부 필드 DOM 노출
롤백 방법: 단일 client 커밋 폐기
사용자 승인 필요 여부: 없음. 운영 반영은 별도 승인 필요
권장 브랜치명: codex/fe-024-admin-provider-workspace-client
현재 상태: DONE
```

## QA-037

```text
작업 ID: QA-037
작업명: 관리자 업체 관리 최소권한 최종 독립 검수
담당 전문 에이전트: reviewer / quality-security
현재 문제: BE-023·FE-024가 새 관리자 조회 경계를 지키고 QA-036 실패를 실제로 해소했는지 독립 판정이 필요하다.
사업적 목적: 운영자가 업체 검수 큐를 사용할 수 있으면서 고객·콘텐츠 담당자에게 내부 정보가 노출되지 않게 한다.
근거 문서: QA-036, BE-023, FE-024, CR-015, R-93
선행 작업: BE-023·FE-024 구현·자체 검증 완료
후속 작업: QA-003 판정 갱신, Auth 최종 삭제 worker 카드
수정 허용 경로: 없음(읽기 전용), 검수 결과는 총괄 PM에게 반환
수정 금지 경로: 모든 제품·migration·운영 문서, 운영 DB, 실제 자료, main·production
공유 계약: owner/admin/operations allow, content/customer/anon deny, base table 직접 접근 0
구현 범위: 두 커밋 diff, 정적 테스트, SQL 역할 근거, 브라우저 근거, cleanup 근거 독립 감사
구현하지 않을 범위: 재구현, 운영 적용, 실제 업체 승인·연락, Auth worker 구현
완료 조건: 허용 범위·역할·필드·멱등·회귀·브라우저·cleanup 근거가 재현 가능하고 P0/P1 미해결이 없음
검증 방법: worktree·커밋·보고서 읽기, 허용 테스트 재실행, 금지 패턴 검사
실행할 테스트: admin-provider-workspace-rpc.mjs, admin-provider-workspace-client.mjs, public-projection-security.mjs, git diff 범위
위험요소: SECURITY DEFINER 과다 반환, base 권한 재개방, 일부 큐 실패의 전체 초기화 전파
롤백 방법: 읽기 전용 감사이므로 해당 없음
사용자 승인 필요 여부: 없음
권장 브랜치명: 없음(읽기 전용)
현재 상태: DONE
```

## BE-025

```text
작업 ID: BE-025
작업명: Auth 최종 삭제 worker와 비식별 완료 이력
담당 전문 에이전트: backend-data
현재 문제: 회원 탈퇴 RPC는 식별 필드를 비식별화하지만 auth.users 최종 삭제는 관리자가 수동 수행하며, 삭제 성공을 개인정보 없이 남기는 운영 이력이 없다.
사업적 목적: 고객의 탈퇴 요청을 누락 없이 끝내고 재처리·중복 삭제·비밀키 노출 없이 파기 책임을 증명한다.
근거 문서: D-24, D-31, QA-003, QA-035, QA-039, R-75
선행 작업: D-42 실행 방식 승인
후속 작업: QA-040 → QA-003 최종 판정
수정 허용 경로: D-42 승인 뒤 신규 migrations/013_account_deletion_worker.sql, 신규 supabase/functions/finalize-account-deletion/**, 신규 전용 테스트, ops/reports/BE-025-account-deletion-worker.md
수정 금지 경로: 기존 migration, 브라우저 코드, 운영 DB, 실제 계정·개인정보, service_role의 source·로그·Git 저장, 패키지·잠금 파일, CHG-A~C, main·production
공유 계약: 기존 taran_request_account_deletion 요청을 입력으로 사용하고, worker만 Auth 관리자 삭제를 수행하며 완료 이력에는 이메일·전화·원본 user UUID를 남기지 않는다.
구현 범위: pending 요청 claim, 중복 방지, 제한된 재시도, Auth 삭제, 비식별 완료·실패 코드, service-role-only 실행, 합성 dry-run·격리 E2E 준비
구현하지 않을 범위: 운영 스케줄 활성화, 실제 고객 삭제, 법정 보관 정책 변경, 계정 복구, UI·약관·알림 변경
완료 조건: 중복 실행 1회 효과, 성공 시 Auth 사용자·요청 행 제거와 비식별 완료 이력 1건, 실패 시 재시도 가능·완료 오표시 0, 일반 client 실행 거부, 비밀·개인정보 로그 0, 멱등 적용
검증 방법: 정적 secret·권한 계약, 격리 Supabase 합성 Auth 성공·실패·중복·동시 실행 E2E, 종료 잔존 확인
실행할 테스트: 신규 worker 계약 테스트, migration 재적용, QA-040 실제 격리 E2E
위험요소: 잘못된 계정 삭제, service_role 노출, Auth 삭제 뒤 완료 이력 누락, 무한 재시도, 법정 보관 데이터 오삭제
롤백 방법: 운영 미적용 상태에서 격리 function·migration 폐기. 운영 배포·스케줄은 별도 승인 전 0건
사용자 승인 필요 여부: 필요. D-42에서 실행 환경과 삭제 자동화 방식을 승인해야 함
권장 브랜치명: codex/be-025-account-deletion-worker
현재 상태: BLOCKED_AFTER_REVISION_2 (commit `5d66de8`; 독립 reviewer가 stale JWT Storage·NULL 문의 우회·잠금 교착 가능성 확인)
```

## QA-040

```text
작업 ID: QA-040
작업명: Auth 최종 삭제 worker 격리 보안 E2E
담당 전문 에이전트: quality-security / reviewer
현재 문제: BE-026의 Auth 독립 tombstone·JWT drain·cutover barrier가 실제 Supabase Auth·RLS·Storage·두 세션 경쟁에서도 합성 계정만 정확히 삭제하고 비식별 완료 이력을 남기는지 검증해야 한다.
사업적 목적: 운영 공개 전에 개인정보 파기 누락과 오삭제를 막는다.
근거 문서: D-43, BE-025 BLOCKED_AFTER_REVISION_2, BE-026 commits `fe02b45`·`09701bb`, BE-026 독립 reviewer PASS, D-24, QA-003, R-75·R-97·R-98
선행 작업: BE-026 독립 reviewer PASS
후속 작업: QA-003 최종 판정
수정 허용 경로: ops/reports/QA-040-account-deletion-worker-e2e.md, 격리 Supabase의 합성 계정·테스트 로그
수정 금지 경로: 제품·migration, 운영 DB, 실제 계정·개인정보, main·production
공유 계약: 이번 작업용 신규 합성 계정만 사용, 기존 D-31 합성 계정 불변, 외부 알림 0, service_role·원본 UUID를 보고서와 로그에 기록하지 않음, 종료 잔존 0
구현 범위: migration 013→014 최초·재적용, cutover 두 세션 경쟁, stale JWT DB·Storage·Auth metadata 거부, NULL 문의 거부, 정상 사용자 불변, 성공·실패·중복·재시도·mark gap·JWT drain·완료 이력·cleanup 검증
구현하지 않을 범위: worker 수정, 운영 스케줄 활성화, 실제 탈퇴 처리, 법적 정책 확정
완료 조건: 의도한 합성 Auth 1명만 삭제, 타 계정 불변, 완료 이력 최소화, 실패 재시도, client 거부, 비밀·개인정보 로그 0, 종료 합성 잔존 0
검증 방법: 격리 SQL과 실제 Supabase Auth 관리자 API·Security Advisor·로그 대조
실행할 테스트: BE-026 전용 테스트 38개, 실제 합성 Auth·RLS·Storage·두 세션 E2E, cleanup count
위험요소: 대상 혼동, 기존 D-31 합성 계정 삭제, 보고서에 UUID·이메일 노출
롤백 방법: 읽기·검수 전용. 생성한 합성 자료만 정리하고 운영 미적용 유지
사용자 승인 필요 여부: BE-025와 같은 D-42 승인 범위. 실제 운영 활성화는 별도 승인 필요
권장 브랜치명: codex/qa-040-account-deletion-worker-e2e
현재 상태: DONE
```

## BE-026

```text
작업 ID: BE-026
작업명: Auth 독립 탈퇴 tombstone·JWT drain·동시성 안전화
담당 전문 에이전트: backend-data
현재 문제: BE-025는 Auth 삭제 뒤 request.user_id가 NULL이 되면 기존 JWT의 Storage 쓰기를 막지 못하고, taran_inquiries의 NULL user_id 입력이 사용자 차단을 우회하며, row lock과 advisory lock 순서 역전으로 교착될 수 있다.
사업적 목적: 탈퇴 요청 이후 기존 로그인 세션이 개인정보를 다시 만들지 못하게 하고 계정 삭제를 중복·교착·오완료 없이 처리한다.
근거 문서: D-43, BE-025 `5d66de8`, BE-025 독립 reviewer 최종 판정, D-24, R-75
선행 작업: D-43 승인, BE-025 BLOCKED_AFTER_REVISION_2
후속 작업: 독립 reviewer → QA-040 → QA-003 최종 판정
수정 허용 경로: 신규 migrations/014_account_deletion_tombstone.sql, supabase/functions/finalize-account-deletion/index.ts, supabase/functions/finalize-account-deletion/worker.mjs, scripts/tests/account-deletion-worker.test.mjs, scripts/tests/account-deletion-worker-contract.test.mjs, 신규 전용 tombstone 테스트, ops/reports/BE-026-account-deletion-tombstone.md
수정 금지 경로: admin-schema.sql, migrations/001~013, 제품 화면·프런트엔드·디자인, package.json·잠금 파일, 환경변수·비밀키, 다른 ops 문서, 운영 DB·실제 계정·실제 Storage, CHG-A~C, main·production
공유 계약: Auth 삭제, PostgreSQL RLS/RPC, storage.objects, 비식별 완료 감사 이력, 실제 Supabase 최대 JWT TTL
구현 범위: Auth FK 없는 단기 tombstone, 013 advisory guard의 no-lock tombstone guard 교체, user-owned·Auth metadata·비공개 Storage 쓰기 차단, taran_inquiries NULL user_id 우회 제거, request/claim/mark-auth-deleted/finalize 상태 전이, Edge JWT drain, 완료 직전 원본 재검사, 2-session 동시성 테스트
구현하지 않을 범위: 운영 적용·배포·스케줄, 실제 계정 삭제, UI 변경, 개인정보 보유 정책 변경, migrations/001~013 수정, 기존 8개 ON DELETE SET NULL FK 원복
완료 조건: Auth 삭제 후 기존 JWT 쓰기 0, taran_inquiries NULL user_id 일반 client insert 0, 삭제 guard advisory lock 0, auth_deleted_at+최대 JWT TTL+buffer 전 tombstone 제거 0, 완료 이력 식별자 0, 동시 실행 Auth 삭제·완료 이력 각 1회, 교착 0, 합성 잔존 0
검증 방법: 정적 계약 테스트, 상태 모델 테스트, migration 최초·재적용, 실제 격리 Supabase 두 세션 stale JWT·NULL 문의·Storage·교착 E2E
실행할 테스트: account-deletion worker·tombstone 전용 테스트, validate/build/dist, 독립 reviewer, QA-040
위험요소: JWT TTL 추측, tombstone 조기 제거, 013 활성 요청 상태 유실, Storage RLS 우회, 교착 재발
롤백 방법: 격리 환경 transaction 실패 시 전체 중단·환경 초기화. 운영은 별도 승인과 사전 worker 중지·활성 요청 0 확인 없이는 적용하지 않는다.
사용자 승인 필요 여부: 격리 구현은 D-43 승인 완료. 운영 DB·Edge 배포·스케줄·실제 회원 처리는 별도 승인 필요
권장 브랜치명: codex/be-026-account-deletion-tombstone
현재 상태: DONE
```

## OPS-024

```text
작업 ID: OPS-024
작업명: Supabase bootstrap·마이그레이션 문서 정합화
담당 전문 에이전트: quality-security / backend-data
현재 문제: 공개 설치 문서는 admin-schema와 001~005만 설명하지만 격리 검증 후보에는 006~014가 누적되어 있고, admin-schema 재실행·탈퇴 worker 활성화 경계도 현재 문서와 다르다.
사업적 목적: 다른 사람이 새 환경을 만들 때 누락·중복 SQL·운영 데이터 손상을 피하고 검증된 순서로 재현하게 한다.
근거 문서: QA-003 PASS, QA-040 PASS, OPS-023, migrations 001~014, R-76
선행 작업: QA-003·QA-040 PASS, 통합 후보 commit 09701bb
후속 작업: 별도 통합 검수와 사용자 승인 뒤 main·운영 적용
수정 허용 경로: README.md, migrations/README.md, SUPABASE-SETUP-GUIDE.md, OPEN-READINESS-CHECKLIST.md, BACKEND_AUDIT.md, ops/handoffs/OPS-024.md, ops/reports/OPS-024-supabase-bootstrap-docs.md
수정 금지 경로: SQL·migration·제품 HTML/JS/CSS, 운영 DB, 실제 계정·개인정보, 환경변수·비밀, 패키지·잠금 파일, main·production
공유 계약: admin-schema는 새 프로젝트에서 1회만, 기존 프로젝트는 적용 이력 확인 후 누락 migration만 번호 순서대로, 013·014와 Edge/runtime 활성화는 분리, QA 값을 운영값으로 복사 금지
구현 범위: 새 프로젝트·기존 프로젝트 순서, 001~014 역할, 사전 점검, 013·014 fail-closed 조건, 운영 활성화 게이트, 적용 후 확인과 중단·롤백 문서화
구현하지 않을 범위: SQL 수정, branch 통합, 운영 적용, 실제 탈퇴, Edge 배포·스케줄, main 병합·배포
완료 조건: 다섯 설치 문서가 같은 순서를 가리키고 006~014 누락·admin-schema 재실행 권고·운영값 추측이 0이며 제품 파일 변경 0
검증 방법: 실제 파일 존재·번호 연속성·문서 참조 대조, git diff 범위 검사
실행할 테스트: migration 파일 001~014 연속성, 문서의 잘못된 001~005-only·재실행 문구 검색, git diff --check
위험요소: 아직 main에 없는 migration을 현재 운영 파일처럼 안내, 격리 PASS를 운영 승인으로 오인, runtime 값을 복사
롤백 방법: 문서 전용 commit 폐기. DB·제품 상태는 변하지 않는다.
사용자 승인 필요 여부: 문서 정리는 불필요. branch 통합·운영 DB·Edge·스케줄·main·production은 별도 승인 필요
권장 브랜치명: codex/ops-024-supabase-bootstrap-docs
현재 상태: DONE (commit e8510ca, migration 연속성·문서 참조·diff 검사 PASS, 운영 미적용)
```

## FE-027

```text
작업 ID: FE-027
작업명: 조건 연계형 가족행사 비용 계산기 세분화
담당 전문 에이전트: frontend-design
현재 문제: 현재 계산기는 행사·지역·인원·공간·추가 항목만 선택해 프라이빗 룸의 음식점 종류, 원하는 1인 식대, 공간별 이용 방식처럼 실제 선택에 필요한 세부 조건이 다음 질문과 계산 결과에 연결되지 않는다.
사업적 목적: 사용자가 자신의 행사 방식과 예산을 구체적으로 입력하고, 그 선택이 다음 보기·비용 범위·업체 검색 조건에 실제 반영된다고 느끼게 한다.
근거 문서: 사용자 2026-07-28 계산기 세분화 요청, 승인된 5종 행사 분류, FE-011·FE-012·FE-014, Adham Dannaway UI 원칙 첨부문
선행 작업: FE-014 계산 완료 피드백 PASS
후속 작업: QA-043 계산기 조건 분기·모바일·접근성 브라우저 검수, 온라인 미리보기는 별도 승인 범위
수정 허용 경로: calculator.html, scripts/pages/calculator.js, styles/pages/calculator.css, scripts/tests/calculator-conditional-flow.mjs, ops/reports/FE-027-calculator-conditional-flow.md
수정 금지 경로: styles/tokens.css 및 공통 컴포넌트, 다른 페이지·JS·CSS, API·DB·Supabase·migration, package.json·잠금 파일, 환경변수, CHG-A~C의 계산기 외 파일, main·production·배포
공유 계약: 5종 행사 ID, calculator.html URL, 기존 TaranSearchContext 쿼리와 calculator-state 저장 키, 비용은 검증된 시세가 아니라 사용자 선택을 합산한 준비 계획용 범위라는 안내를 유지한다.
구현 범위: 공간 선택 뒤 해당 공간에 필요한 세부 질문을 조건부 표시한다. 프라이빗 룸은 한정식·파인다이닝·중식·뷔페·일반 레스토랑과 원하는 1인 식대 범위를 선택한다. 호텔·파티룸·자택·야외도 공간에 맞는 최소 세부 조건을 제공한다. 행사+공간 선택에 따라 추가 준비 보기와 추천 설명을 바꾸고, 사용자가 고른 식대·이용 방식이 계산 내역과 저장 상태에 반영되게 한다. UI는 관련 항목 간격 그룹화, 일관된 상호작용, 명확한 위계, 불필요한 장식 축소, 목적 있는 코랄/녹색, 색 외 선택 표시, UI 3:1·본문 4.5:1 대비, 단일 sans-serif·regular/bold·좌측 정렬·본문 1.5 line-height를 적용한다.
구현하지 않을 범위: 실제 시세·업체 가격 데이터 도입, 추천 순위·평점, API·DB 저장 스키마 변경, 업체 검색 필터 계약 확장, 다른 페이지 디자인 변경, 운영 배포
완료 조건: 5개 공간 각각에서 조건부 세부 질문이 나타나며 특히 프라이빗 룸의 음식 유형과 1인 식대가 필수 선택이다. 상위 선택 변경 시 맞지 않는 하위 선택이 초기화된다. 결과 내역에 사용자 선택이 한국어로 표시되고 금액 범위에 반영된다. 키보드·스크린리더 상태, 모바일 390px, 데스크톱 1440px에서 가로 넘침과 죽은 버튼이 없다. 기존 저장·공유·업체/체크리스트 링크 계약이 유지된다.
검증 방법: exact 파일 diff, 전용 정적/상태 전이 테스트, validate/build/dist, 로컬 브라우저에서 프라이빗 룸·호텔·파티룸·자택·야외 분기와 390/1440px 확인
실행할 테스트: calculator-conditional-flow.mjs, validate.mjs, prepare-dist.mjs, validate-dist.mjs, 기존 calculator 수동 회귀
위험요소: 임의 비용을 시세처럼 오인, 상위 선택 변경 뒤 하위 상태 잔존, 선택 단계 과다, 작은 화면 세로 길이·접근성 저하
롤백 방법: FE-027 exact 5개 파일 변경만 되돌리고 기존 FE-014 계산 흐름으로 복귀한다.
사용자 승인 필요 여부: 없음. 사용자 직접 요청 범위. 온라인 배포·main 반영은 별도 승인 필요
권장 브랜치명: codex/fe-027-calculator-conditional-flow
현재 상태: DONE (Revision 1, QA-043 PASS)
```

## QA-043

```text
작업 ID: QA-043
작업명: 조건 연계형 계산기 독립 기능·접근성 검수
담당 전문 에이전트: quality-security
현재 문제: FE-027 구현과 자체 검사는 통과했지만 조건 분기, 금액 반영, 상위 선택 초기화, 모바일·키보드·ARIA를 독립적으로 확인하지 않았다.
사업적 목적: 사용자가 세부 조건을 바꿔도 잘못된 비용이나 숨은 선택이 남지 않고 모바일에서 안전하게 계산을 완료하도록 한다.
근거 문서: FE-027 카드·handoff·결과 보고서, 사용자 2026-07-28 첨부 요청
선행 작업: FE-027 AWAITING_QA
후속 작업: PASS 시 FE-027 DONE 및 온라인 미리보기/배포는 별도 승인
수정 허용 경로: ops/reports/QA-043-calculator-conditional-flow-review.md (제품 파일은 읽기 전용)
수정 금지 경로: calculator.html, scripts/pages/calculator.js, styles/pages/calculator.css, 공통 파일, API·DB·migration, package/lock, main·production
공유 계약: FE-027 exact 5파일, 5종 행사 ID, 검색·저장 계약, 계획용 비시세 안내
구현 범위: 프라이빗 룸 음식 유형·1인 식대 필수, 네 다른 공간 이용 방식, 행사/공간 변경 시 하위 상태 초기화, 계산 내역·저장·검색 계약, 390/1440 레이아웃, 키보드·focus·ARIA·대비·색 외 선택 표시를 읽기 전용 검수한다.
구현하지 않을 범위: 코드 수정, 디자인 확대, 가격/시세 확정, 다른 페이지 검수, 배포
완료 조건: 범위 위반 0, 조건 분기·초기화·계산 0결함, 검색 계약 확장 0, 치명 접근성 오류 0, 가로 넘침·콘솔 오류 0 또는 정확한 재현과 REVISION_REQUIRED 판정
검증 방법: exact diff·전용 테스트 재실행·빌드/dist·로컬 브라우저 390/1440·키보드 및 DOM/ARIA 검사
실행할 테스트: calculator-conditional-flow.mjs, 개별 node --check, prepare-dist/validate-dist, 브라우저 분기 회귀
위험요소: 자기검사와 동일한 기대만 확인, 임의 비용 범위를 시세로 오인, 잘못된 ARIA 속성을 통과
롤백 방법: 읽기 전용 검수. 생성 보고서만 제거
사용자 승인 필요 여부: 없음. 읽기 전용 로컬 QA
권장 브랜치명: 없음
현재 상태: DONE (Revision 1 재검수 PASS)
```

## FE-028

```text
작업 ID: FE-028
작업명: 행사 세부 유형·예상 인원·공간별 식비 계산기 고도화
담당 전문 에이전트: frontend-design
현재 문제: 계산기는 대분류 행사와 넓은 인원 구간만 받아 백일·돌잔치, 상견례·소규모 예식처럼 실제 준비 항목이 다른 행사를 구분하지 못하고, 프라이빗 룸 외 공간에서는 사용자가 원하는 1인 식비를 반영하지 못한다.
사업적 목적: 사용자가 자신의 행사와 인원에 맞는 조건을 더 정확히 입력하고 결과 내역을 이해해 업체 탐색으로 이어가게 한다.
근거 문서: 사용자 2026-07-29 계산기 상세화 요청, FE-027·QA-043 PASS
선행 작업: FE-027·QA-043 DONE
후속 작업: QA-045 통합 브라우저·접근성 검수
수정 허용 경로: calculator.html, scripts/pages/calculator.js, styles/pages/calculator.css, scripts/tests/calculator-conditional-flow.mjs, ops/reports/FE-028-calculator-detail-depth.md
수정 금지 경로: 공통 헤더·다른 페이지·API·DB·Supabase·migration·package/lock·환경변수·main·production
공유 계약: 5종 행사 ID, calculator.html URL, TaranSearchContext 공개 검색 쿼리, calculator-state 저장 키, 준비 계획용 비시세 안내를 유지한다.
구현 범위: 행사 대분류 선택 뒤 세부 행사 유형을 필수 선택한다. 인원은 아직 확정되지 않은 상태를 고려해 대략적인 예상 인원을 직접 입력하거나 인원 바로가기로 정한다. 모든 공간에서 원하는 1인 식비 범위를 선택하고, 프라이빗 룸은 음식 종류까지 선택한다. 선택한 세부 행사·예상 인원·공간 이용 방식·식비를 결과 요약·내역·저장 상태에 반영한다. 상위 선택 변경 시 맞지 않는 하위 상태를 초기화한다.
구현하지 않을 범위: 검증된 시세·업체 가격 도입, 추천 순위, 검색 API 필터 계약 확장, 체크리스트·비교함·공통 메뉴 변경, 배포
완료 조건: 5개 대분류 모두에서 세부 행사를 선택할 수 있고 예상 인원 1~500명을 입력할 수 있다. 다섯 공간 모두 식비가 필수이며 프라이빗 룸은 음식 종류도 필수다. 결과에 세부 행사·예상 인원·공간 조건·1인 식비가 한국어로 표시되고 계산·저장에 반영된다. 390/1440px·키보드·ARIA·상태 초기화·기존 검색/저장 링크 회귀가 통과한다.
검증 방법: exact 파일 diff, 전용 상태 전이 테스트, build/dist, 로컬 브라우저 390/1440
실행할 테스트: calculator-conditional-flow.mjs, validate.mjs, prepare-dist.mjs, validate-dist.mjs
위험요소: 입력값과 표시값 불일치, 식비 이중 합산, 세부 유형을 검증된 가격 모델처럼 오인
롤백 방법: FE-028 exact 파일 변경만 되돌려 FE-027 PASS 상태로 복귀한다.
사용자 승인 필요 여부: 없음
권장 브랜치명: codex/fe-028-calculator-detail-depth
현재 상태: DONE (QA-045 PASS)
```

## FE-029

```text
작업 ID: FE-029
작업명: 공개 헤더 도구 분리·로그인 전용 비교함 동선
담당 전문 에이전트: frontend-design
현재 문제: 공개 상단 메뉴에 비교함이 노출되고 계산기와 체크리스트가 준비 도구 드롭다운으로 합쳐져 사용자가 각각의 기능을 바로 찾기 어렵다.
사업적 목적: 공개 탐색 메뉴를 단순화하고 개인 비교 목록은 로그인 계정의 마이페이지에서 이어보게 한다.
근거 문서: 사용자 2026-07-29 상단 카테고리·비교함 접근 요청, 현행 header.js·account.html·compare.html
선행 작업: 로그인·마이페이지·비교함 기존 기능 존재
후속 작업: QA-045 통합 브라우저·접근성 검수
수정 허용 경로: scripts/components/header.js, account.html, account.js, compare.html, scripts/pages/compare.js, styles/pages/member.css, 신규 scripts/tests/header-account-navigation.mjs, ops/reports/FE-029-header-account-compare.md
수정 금지 경로: calculator.html 및 계산기 JS/CSS, checklist 제품 파일, 공통 디자인 token, API·DB·Supabase·migration, package/lock, 환경변수, main·production
공유 계약: 공개 상단은 업체 찾기·비용 계산기·준비 체크리스트·준비백과·업체 등록·로그인/내 정보 순서다. 비교 데이터 키와 최대 3곳 계약은 유지한다.
구현 범위: 공통 헤더가 기존 정적 헤더를 실행 시 위 순서로 정규화하며 공개 비교함 링크와 준비 도구 드롭다운을 제거한다. 모바일 하단에서도 계산기와 체크리스트를 분리하고 비교함을 제거한다. 로그인 마이페이지에 비교함 카드/링크와 선택 수를 표시한다. compare.html 직접 접근은 로그인 전 로그인 화면으로 안전하게 돌려보내고 로그인 뒤 원래 비교함으로 복귀한다.
구현하지 않을 범위: 업체 목록·상세의 비교 담기 UX 변경, 비교 데이터 DB 동기화, 로그인·회원가입 정책 변경, 비교표 재설계, 배포
완료 조건: 공개 상단·모바일 메뉴에 비교함과 준비 도구 묶음이 없고 계산기·체크리스트가 각각 표시된다. 로그인 전 compare.html은 return 경로를 포함해 로그인으로 이동한다. 로그인 계정은 마이페이지에서 비교함 선택 수와 링크를 보고 접근할 수 있다. 기존 최대 3곳 비교·견적 링크는 유지된다.
검증 방법: DOM 정적 테스트, auth ready 유·무 상태 테스트, build/dist, 로컬 브라우저 데스크톱·모바일
실행할 테스트: header-account-navigation.mjs, validate.mjs, prepare-dist.mjs, validate-dist.mjs
위험요소: 헤더 초기 표시 깜박임, Auth 미설정 로컬 환경에서 무한 이동, 로그인 return 경로 손실
롤백 방법: FE-029 exact 파일만 되돌려 기존 헤더·비교함 공개 링크로 복귀한다.
사용자 승인 필요 여부: 없음
권장 브랜치명: codex/fe-029-header-account-compare
현재 상태: DONE (QA-045 PASS)
```

## QA-045

```text
작업 ID: QA-045
작업명: 계산기 상세화·로그인 비교함 동선 통합 검수
담당 전문 에이전트: quality-security / reviewer
현재 문제: FE-028과 FE-029가 서로 파일은 분리되지만 계산기 링크·공통 헤더·Auth 복귀 동선에서 함께 작동하는지 독립 검수가 필요하다.
사업적 목적: 계산기 입력 정확도 개선과 로그인 전용 비교함 정책을 공개 전에 안전하게 확인한다.
근거 문서: FE-028·FE-029 카드와 결과 보고서
선행 작업: FE-028·FE-029 구현·자체 검증 완료
후속 작업: PASS 시 두 작업 DONE, 온라인 미리보기·GitHub·배포는 별도 사용자 지시
수정 허용 경로: ops/reports/QA-045-calculator-header-account-review.md
수정 금지 경로: 모든 제품·공통·API·DB·운영 파일, main·production
공유 계약: 계산기 5종 행사 ID·기존 검색 계약, 공개 헤더 6개 링크, 비교 최대 3곳, Auth 안전 return 경로
구현 범위: exact diff, 계산기 상태·금액·저장, 헤더 데스크톱/모바일, 로그인 전 compare 차단과 로그인 후 마이페이지 접근, 키보드·ARIA·390/1440·build/dist 독립 감사
구현하지 않을 범위: 코드 수정, 배포, DB·실제 계정 변경
완료 조건: 범위 위반 0, 완료 조건 재현, P0/P1 미해결 0, 운영·외부 변경 0
검증 방법: 전용 테스트 재실행과 로컬 브라우저
실행할 테스트: calculator-conditional-flow.mjs, header-account-navigation.mjs, validate.mjs, prepare-dist.mjs, validate-dist.mjs
위험요소: 비로그인 리디렉션 루프, 모바일 메뉴 항목 누락, 계산 조건 손실
롤백 방법: 읽기 전용
사용자 승인 필요 여부: 없음
권장 브랜치명: 없음
현재 상태: DONE (PASS)
```

## QA-044

```text
작업 ID: QA-044
작업명: 공통 JavaScript validate harness 오류 보고 안전화
담당 전문 에이전트: quality-security
현재 문제: 현재 sandbox에서 validate.mjs의 child spawn이 실패하면 stderr가 undefined인데 trim을 호출해 실제 원인 대신 TypeError로 중단된다.
사업적 목적: 전체 정적 검사가 실행되지 못하더라도 어느 파일·어떤 실행 오류인지 정확히 보고해 결함을 숨기거나 잘못된 PASS로 처리하지 않는다.
근거 문서: FE-027, QA-043, scripts/tests/validate.mjs:41
선행 작업: QA-042·BE-027·FE-027 exact 파일과 비중복 확인 완료. Git stage·commit 없이 로컬 QA 보완만 허용
후속 작업: 전체 validate 재실행과 기존 오류 분류
수정 허용 경로: scripts/tests/validate.mjs, scripts/tests/validate-harness-error-reporting.mjs, ops/reports/QA-044-validate-harness-error-reporting.md
수정 금지 경로: 제품 HTML/JS/CSS, package/lock, API·DB·migration, 환경변수, main·production
공유 계약: child spawn 실패를 PASS로 바꾸지 않고 error code·대상 파일을 fail-closed로 보고한다.
구현 범위: result.error와 stderr/stdout 부재를 안전하게 처리하고 TypeError 대신 재현 가능한 검증 실패 메시지를 출력한다.
구현하지 않을 범위: sandbox 권한 우회, 실제 syntax 실패 무시, 제품 수정, 배포
완료 조건: stderr undefined·spawn EPERM/ENOENT에서 TypeError 0, 대상 파일·error code 보고, 정상 syntax check 계약 불변
검증 방법: 전용 합성 테스트와 실제 validate 실행 결과 비교
실행할 테스트: validate-harness-error-reporting.mjs, validate.mjs
위험요소: 실행 실패를 syntax PASS로 오인, 검증 오류 대량 출력
롤백 방법: exact 3파일 변경 제거
사용자 승인 필요 여부: 없음. 로컬 QA 도구 보완만. Git 반영은 현재 보존 작업 뒤 진행
권장 브랜치명: codex/qa-044-validate-harness-error-reporting
현재 상태: DONE (PASS, commit 5f1e6d0, 원격 별도 브랜치 보존 완료)
```

## OPS-029

```text
작업 ID: OPS-029
작업명: migration 015·016 설치 순서·운영 승인 게이트 문서 정합화
담당 전문 에이전트: 총괄 PM / quality-security
현재 문제: 검수 완료된 OPS-024 문서는 001~014까지만 설명하고 현재 루트 문서는 일부가 005까지만 안내해, 015·016의 순서와 기본 비활성·AAL2·개인정보·Storage 게이트가 인수인계 문서에 반영되지 않았다.
사업적 목적: 다른 운영자도 DB를 임의로 실행하지 않고 015 다음 016 순서와 출시 전 안전 조건을 정확히 이해하게 한다.
근거 문서: OPS-024, BE-019, QA-041, QA-042, BE-027, D-24, D-31, D-38, R-100~R-106
선행 작업: BE-019·QA-042·BE-027 원격 별도 브랜치와 지정 파일 해시 검증 완료
후속 작업: 문서 독립 검수, 운영 적용은 별도 사용자 승인 뒤 별도 카드
수정 허용 경로: README.md, migrations/README.md, SUPABASE-SETUP-GUIDE.md, OPEN-READINESS-CHECKLIST.md, BACKEND_AUDIT.md, ops/RELEASE_CHECKLIST.md, ops/reports/OPS-029-migrations-015-016-bootstrap-docs.md, ops/handoffs/OPS-029.md, 관련 PM 운영 문서
수정 금지 경로: migration SQL, 제품 HTML·JS·CSS, API·DB·Supabase, 환경변수, package/lock, 실제 데이터, main·production
공유 계약: 현재 작업 체크아웃은 001~005, 검증된 통합 후보 브랜치는 001~016이다. 통합 후 새 프로젝트는 admin-schema 1회 뒤 003~016, 기존 프로젝트는 적용 이력 확인 뒤 누락 첫 번호부터 순차 적용한다. 015는 014 뒤, 016은 015 뒤이며 두 파일 적용은 runtime 활성화·실제 수집·Storage·공개·운영 배포 승인이 아니다.
구현 범위: OPS-024 검수본을 기준으로 015·016 역할·순서·중단 조건·적용 후 확인·테스트 명령·운영 승인 게이트를 문서화한다.
구현하지 않을 범위: SQL 수정·실행, 운영 DB 조회/변경, 실제 견적·증빙, Storage/scanner/preview 구축, UI 연결, 브랜치·PR·배포
완료 조건: 대상 문서가 현재 체크아웃 001~005와 통합 후보 001~016을 구분하고, 통합 후 순서와 015 runtime 4종 false·Storage 생성 0·실제 견적 0, 016 operations 이상+AAL2·최대 50·최소 6열, 운영 적용 별도 승인 조건을 명시한다.
검증 방법: 현재 체크아웃과 통합 후보 브랜치의 실제 파일 존재·순서·링크·명령 대조, 금지 문구와 승인 게이트 검색, git diff --check
실행할 테스트: 문서 계약 정적 검사, 통합 후보 001~016 연속 파일 확인, 현재 체크아웃 001~005 차이 확인, migration·제품 diff 0 확인
위험요소: 격리 PASS를 운영 승인으로 오인, 015 없이 016 실행, 증빙 업로드·공개 runtime 조기 활성화, QA 값을 운영에 복사
롤백 방법: OPS-029 허용 문서 변경만 OPS-024 검수본으로 복귀
사용자 승인 필요 여부: 문서 정합화는 없음. 운영 DB·실제 수집·Storage·runtime·main·production은 별도 승인 필요
권장 브랜치명: codex/ops-029-migrations-015-016-docs
현재 상태: DONE (PASS, 문서 전용, 통합 후보 누락·오타 0)
```

## OPS-030

```text
작업 ID: OPS-030
작업명: 검증 브랜치 통합 순서·충돌·회귀 게이트 읽기 전용 계획
담당 전문 에이전트: 총괄 PM / quality-security
현재 문제: 006~016과 검증 하네스가 여러 분리 브랜치에 안전하게 보존됐지만, 현재 체크아웃에는 001~005만 있고 어떤 커밋을 어떤 순서로 한 통합 후보에 조립할지 확정된 실행 계획이 없다.
사업적 목적: 검증 완료 자산을 잃거나 중복 적용하지 않고, 사용자 승인 뒤 한 번에 재현 가능한 통합 후보를 만들 수 있게 한다.
근거 문서: OPS-024, OPS-028, BE-019, QA-041, QA-042, BE-027, QA-044, OPS-029, R-83·R-100~R-107
선행 작업: OPS-029 PASS, BE-019·BE-027·QA-042·QA-044 원격 exact 보존 완료
후속 작업: 사용자 승인 뒤 별도 통합 Worktree 조립, 전체 회귀, main·운영은 각각 별도 승인
수정 허용 경로: Git 읽기 전용 명령, ops/reports/OPS-030-validated-branch-integration-plan.md, ops/handoffs/OPS-030.md, 관련 PM 운영 문서
수정 금지 경로: 제품 HTML·JS·CSS, migration SQL, 테스트 코드, API·DB·Supabase, 환경변수, package/lock, 실제 데이터, Git branch/index/commit/PR/main·production
공유 계약: 기존 dirty 작업 폴더를 통합 작업장으로 쓰지 않는다. 원격 보존 커밋의 SHA와 파일 집합을 먼저 고정하고, 새 Worktree에서만 조립하며 015는 014 뒤, 016은 015 뒤를 유지한다.
구현 범위: 브랜치 ancestry·커밋·파일 집합·중복·충돌 가능성을 읽기 전용으로 대조하고 권장 조립 순서, 중단 조건, 테스트와 승인 게이트를 작성한다.
구현하지 않을 범위: checkout·cherry-pick·merge·rebase·stage·commit·push·PR·main·DB·배포·실제 기능 활성화
완료 조건: 원격 보존 4개 브랜치의 기준·커밋·파일 관계와 통합 순서, 충돌 파일, 필수 검증, rollback, 사용자 승인 지점이 재현 가능하게 문서화된다.
검증 방법: git merge-base·log·diff-tree·ls-tree·rev-parse 읽기 전용 대조, 원격 ref 존재 확인, 문서 diff check
실행할 테스트: commit ancestry·exact file matrix·migration 연속성·중복 커밋 검사
위험요소: dirty 루트에 통합, 같은 패치를 중복 cherry-pick, QA 브랜치를 제품 기준으로 사용, 016만 단독 적용, 운영 승인으로 오인
롤백 방법: 문서 변경만 제거. Git 객체·브랜치·제품·DB는 변경하지 않으므로 별도 기술 rollback 없음
사용자 승인 필요 여부: 읽기 전용 계획은 없음. 통합 Worktree 조립·최종 main 병합·운영 DB·배포는 각각 별도 승인
권장 브랜치명: codex/ops-030-validated-integration-plan
현재 상태: DONE (PASS, 읽기 전용 계획 완료, 실제 통합은 FE exact 보존 대기)
```

## OPS-031

```text
작업 ID: OPS-031
작업명: FE-028·FE-029·QA-045 exact GitHub 별도 브랜치 보존
담당 전문 에이전트: 총괄 PM / quality-security
현재 문제: 계산기 상세화와 로그인 전용 비교함 동선의 검수 완료 파일이 dirty 루트에만 있고 전용 로컬·원격 브랜치가 없어 전체 통합 전에 유실될 수 있다.
사업적 목적: 사용자가 승인한 최신 계산기·헤더·마이페이지 결과를 다른 dirty 변경과 섞지 않고 인수인계 가능한 Git 자산으로 보존한다.
근거 문서: FE-027·QA-043·FE-028·FE-029·QA-045 보고서, OPS-030, R-108
선행 작업: QA-045 PASS, 기준 HEAD 1e7f654, current index staged 0
후속 작업: 원격 blob·파일 집합 검증 뒤 통합 Worktree 조립 계획 갱신
수정 허용 경로: ops/preserve-fe-028-fe-029-qa-045.ps1, ops/handoffs/OPS-031.md, ops/reports/OPS-031-fe-validated-git-preservation.md, 관련 PM 운영 문서, 사용자 실행 시 exact 16파일 Git commit·별도 branch·origin push
수정 금지 경로: exact 16파일 밖 Git index/commit, 현재 checkout, main, PR, 제품 내용 추가 수정, DB·Supabase·환경변수·package/lock, Netlify·production
공유 계약: 기준 parent는 1e7f654이며 임시 index로 exact 16파일만 snapshot한다. 현재 index·worktree·branch를 바꾸지 않고 force push를 사용하지 않는다.
구현 범위: exact allowlist·기준 SHA·tree·parent·remote SHA·전후 status를 검증하는 fail-closed PowerShell 스크립트 작성과 구문 검증
구현하지 않을 범위: 제품 수정, 현재 index stage, checkout, merge/rebase/cherry-pick, PR/main, 배포, DB
완료 조건: 스크립트가 exact 16파일만 단일 commit으로 만들고 codex/fe-028-fe-029-qa-045-validated-snapshot에 push하며 전후 worktree status 동일·remote SHA 일치를 확인한다.
검증 방법: PowerShell parser, exact 배열 16개·파일 존재·tracked/untracked 상태, 금지 경로 부재, Git 명령 안전 플래그 정적 검사
실행할 테스트: parser 0 error, current HEAD·branch·staged 0 확인, dry static allowlist 검사
위험요소: dirty 전체 stage, package/lock 포함, 현재 branch 이동, 기존 원격 덮어쓰기, QA 보고서 누락
롤백 방법: 실패 시 임시 index 삭제. 원격 생성 후 문제가 있으면 해당 전용 브랜치만 별도 확인 후 삭제하며 현재 worktree는 변하지 않는다.
사용자 승인 필요 여부: 스크립트 작성·검증은 없음. 실제 commit·원격 push는 사용자가 스크립트를 직접 실행
권장 브랜치명: codex/fe-028-fe-029-qa-045-validated-snapshot
현재 상태: DONE (PASS, commit b424156, 원격 exact 16파일·blob 16/16 검증)
```

## OPS-032

```text
작업 ID: OPS-032
작업명: BE-027 백엔드 후보와 FE snapshot 통합 충돌 읽기 전용 감사
담당 전문 에이전트: 총괄 PM / quality-security
현재 문제: 백엔드 통합 기준 8e7eb81과 FE snapshot b424156이 같은 1e7f654 기준에서 갈라져 있어 실제 파일·사용자 흐름·테스트 계약 충돌을 확인해야 한다.
사업적 목적: 최신 계산기·헤더를 잃지 않으면서 검증된 DB·권한 변경을 한 통합 후보로 안전하게 조립한다.
근거 문서: OPS-030, OPS-031, BE-027, FE-028, FE-029, QA-045, QA-044
선행 작업: OPS-031 원격 exact 16파일 PASS
후속 작업: 충돌 판정에 따른 통합 Worktree 카드 또는 범위 분리
수정 허용 경로: Git 읽기 전용 명령, ops/reports/OPS-032-be027-fe-snapshot-conflict-audit.md, ops/handoffs/OPS-032.md, 관련 PM 운영 문서
수정 금지 경로: 제품·migration·테스트 코드, Git checkout/index/branch/commit/push/PR/main, DB·Supabase·Netlify·환경변수·package/lock
공유 계약: 공통 base 1e7f654에서 두 tip의 파일·patch를 대조한다. 자동 merge 가능과 사업·사용자 흐름 계약 충돌은 별도로 판정한다.
구현 범위: 변경 파일 교집합, 동일/상충 hunks, API·DB·라우팅·Auth·저장키·헤더·계산기 흐름, QA-044 적용 영향과 권장 선후관계를 읽기 전용으로 감사한다.
구현하지 않을 범위: 실제 merge/cherry-pick, 충돌 해결, 코드 수정, 테스트 실행을 위한 checkout, PR·배포·DB
완료 조건: 겹치는 파일과 계약을 정확히 분류하고 자동 통합 가능 여부, 수동 소유자, 권장 순서, 필수 회귀와 승인 지점을 제시한다.
검증 방법: git merge-base·diff --name-status·diff --check·blob SHA·3-way patch 대조
실행할 테스트: 파일 교집합, add/add·modify/modify 후보, 저장키·Auth·라우팅 문자열 계약 검색
위험요소: 텍스트 충돌 0을 의미 충돌 0으로 오인, FE snapshot으로 BE 보안 변경 덮어쓰기, QA-044 validator 누락
롤백 방법: 읽기 전용 보고서만 제거. Git·제품·DB 상태 변경 없음
사용자 승인 필요 여부: 읽기 전용 감사는 없음. 실제 통합 Worktree와 commit·push는 별도 승인
권장 브랜치명: 없음
현재 상태: DONE (PASS, 직접 파일 교집합 0·3-way 충돌 0, 의미상 4흐름 회귀 필요)
```

## OPS-033

```text
작업 ID: OPS-033
작업명: 격리 통합 후보 조립·전체 회귀
담당 전문 에이전트: 총괄 PM / quality-security
현재 문제: 검증된 BE-027·FE snapshot·QA 증거·OPS-029 문서가 각각 안전하게 보존됐지만 한 통합 후보에서 함께 검증되지 않았다.
사업적 목적: 최신 화면과 검증된 권한·DB 계약을 잃지 않고 온라인 미리보기 전 하나의 재현 가능한 후보로 만든다.
근거 문서: OPS-029~OPS-032, BE-027, QA-041·QA-042·QA-044, FE-028·FE-029·QA-045
선행 작업: OPS-032 PASS, D-45 사용자 승인
후속 작업: 통합 QA PASS 뒤 별도 원격 보존·고유 온라인 미리보기 승인
수정 허용 경로: 새 전용 Worktree와 새 로컬 branch, 승인된 commit·exact 파일, OPS-029 핵심 문서, 전용 통합 보고서·운영 문서
수정 금지 경로: 현재 dirty root, 승인되지 않은 제품 파일, 운영 DB·실제 자료·환경변수·package/lock, 원격 push·PR·main·Netlify production
공유 계약: BE-027 8e7eb81을 base로 FE b424156, QA-041 2 blob, QA-042 b84d307, QA-044 5f1e6d0, OPS-029 문서를 순서대로 적용한다. 예상 밖 충돌은 직접 해결하지 않고 중단한다.
구현 범위: 새 Worktree 조립, 로컬 commit 분리, migration 001~016, 정적·build·dist·브라우저 390/1440, 격리 Auth/RLS/RPC E2E와 cleanup 0
구현하지 않을 범위: 신규 기능·디자인 변경, 운영 데이터, 실제 업체/견적, remote push, PR, main, production
완료 조건: 통합 후보가 clean이고 모든 승인 파일·commit을 보유하며 필수 회귀와 네 의미상 흐름이 PASS한다.
검증 방법: commit ancestry·exact file matrix·pnpm test/build/test:dist·브라우저·격리 Supabase
실행할 테스트: OPS-032 필수 회귀 전체
위험요소: dirty root 오염, 예상 밖 충돌, validator 환경 오류, 격리 cleanup 실패, 통합 후보를 production으로 오인
롤백 방법: 새 Worktree와 새 로컬 통합 branch만 폐기. 현재 root·원격·main·DB는 불변
사용자 승인 필요 여부: D-45 필요. 승인 범위는 새 로컬 Worktree·로컬 branch·검증까지이며 remote push/PR/main/DB/배포는 제외
권장 브랜치명: codex/integration-be027-fe029-local
현재 상태: DONE (PASS, local HEAD cdd0929·제품 기준 a66b510·직접 검사 26/26·build·브라우저·QA-047 실제 격리 Auth/RLS/RPC·cleanup 0)
```

## QA-046

```text
작업 ID: QA-046
작업명: 현행 5행사·공개 헤더 테스트 계약 정합화
담당 전문 에이전트: quality-security
현재 문제: 통합 후보의 제품·전용 검사는 승인된 5개 행사와 공개 헤더 6개를 통과하지만 marketplace-flow와 sonpum-redesign은 과거 8개 행사·상견례/스몰웨딩 분리와 푸터 정보 나눔 링크 제거를 요구해 실패한다.
사업적 목적: 승인된 현행 제품을 과거 기획으로 되돌리지 않고 전체 회귀가 실제 공개 헤더와 행사 분류 계약을 검사하게 한다.
근거 문서: D-45, FE-028, FE-029, QA-045, OPS-033, docs/99_의사결정기록.md
선행 작업: OPS-033 로컬 통합 후보 조립과 실패 2건 재현
후속 작업: QA-047 통합 후보 격리 Auth/RLS/RPC E2E, OPS-033 최종 재검수
수정 허용 경로: scripts/tests/marketplace-flow.mjs, scripts/tests/sonpum-redesign.mjs, ops/reports/QA-046-current-navigation-event-contract.md
수정 금지 경로: 제품 HTML·JS·CSS, event-types.js, API·DB·migration, 환경변수, package/lock, 운영 DB, main·production
공유 계약: 행사는 kids·parents·meeting·anniversary·other 5개이며 meeting은 결혼 준비, other는 기타 가족행사다. 핵심 내비게이션 검사는 실제 header/site-nav 범위만 대상으로 하고 푸터 정보 링크를 헤더 위반으로 오인하지 않는다.
구현 범위: 과거 assertion 두 곳만 현행 계약으로 교체하고 나머지 marketplace·브랜드·보안·공개 게이트 검사를 약화하지 않는다.
구현하지 않을 범위: 제품 문구·메뉴·행사 분류 변경, 실패 무시, 검사 삭제, 신규 기능, 배포
완료 조건: marketplace-flow·sonpum-redesign·calculator-conditional-flow·header-account-navigation·build·dist가 모두 PASS하고 제품 diff가 0이다.
검증 방법: exact diff, assertion 전후 대조, 테스트 직접 실행, git diff --check
실행할 테스트: 위 4개 전용 검사, prepare-dist.mjs, validate-dist.mjs
위험요소: 실제 제품 결함을 단순 테스트 노후화로 오인하거나 검사 범위를 과도하게 줄일 수 있음
롤백 방법: QA-046 테스트·보고서 변경만 제거
사용자 승인 필요 여부: 없음. 테스트 계약 현행화만 수행하며 제품·DB·외부 상태는 변경하지 않음
권장 브랜치명: codex/qa-046-current-navigation-event-contract
현재 상태: DONE (PASS, local commit a66b510, 제품 diff 0)
```

## QA-047

```text
작업 ID: QA-047
작업명: 통합 후보 실제 격리 Auth·RLS·RPC 최종 재검증
담당 전문 에이전트: quality-security
현재 문제: QA-042 실제 Auth·HTTP·TOTP AAL2 PASS 증거는 보존됐지만 OPS-033 통합 후보 자체에서 migration 001~016과 최신 FE를 함께 둔 상태의 실제 격리 Supabase 재실행이 없다.
사업적 목적: 로그인·비교·문의·업체 등록·운영 검수 권한이 최종 통합 후보에서도 같은 방식으로 차단·허용되는지 출시 전에 확인한다.
근거 문서: QA-041, QA-042, BE-027, QA-045, OPS-033, R-102, R-109
선행 작업: QA-046 PASS 완료, 정확한 무료 격리 Supabase 세션 또는 메모리 전용 자격 경로
후속 작업: OPS-033 최종 PASS 검수, D-46 원격 보존·고유 draft 승인
수정 허용 경로: OPS-033 격리 저장소, scripts/tests/provider-contribution-quote-v2-supabase-e2e.mjs, scripts/tests/provider-contribution-quote-v2-auth-http-e2e.mjs, scripts/tests/provider-contribution-review-queue-v2.mjs, scripts/tests/provider-contribution-review-queue-v2-auth-http-e2e.mjs, ops/reports/QA-047-integrated-auth-rls-rpc-e2e.md, 격리 Supabase의 QA-047 prefix 합성 Auth·행·MFA
수정 금지 경로: 운영 Supabase, 실제 고객·업체·견적·증빙, Storage 실파일, 운영 환경변수, 제품 코드, main·production
공유 계약: 정확한 격리 프로젝트만 사용하고 runtime 4종은 시작·종료 false다. 임시 credential은 메모리 밖에 기록하지 않으며 종료 Auth·identity·factor·session·refresh·합성 행·Storage는 0이다.
구현 범위: migration 적용 상태 확인, 실제 GoTrue JWT·PostgREST, customer/provider/content/operations 역할, AAL1 deny·TOTP AAL2 allow, migration 016 review queue 최소 열·최대 50·base grant 0, 전후 cleanup
구현하지 않을 범위: 운영 DB, 실제 자료, 외부 이메일·문자, 기능 활성화, 원격 push·PR·배포
완료 조건: 실제 HTTP·DB 결과가 계약과 일치하고 cleanup 대상 전부 0, runtime false, 비밀·개인정보 출력 0이다.
검증 방법: 프로젝트 식별, preflight, 합성 시나리오, count-only audit, cleanup, final preflight
실행할 테스트: QA-041·QA-042·BE-027 통합 E2E와 기존 정적·모델 회귀
위험요소: 잘못된 프로젝트 선택, 임시 Auth/MFA 잔존, 자격 노출, cleanup 실패
롤백 방법: QA-047 prefix 합성 객체와 임시 factor/Auth를 제거하고 runtime false 복구 후 final count 감사
사용자 승인 필요 여부: 무료 격리 합성 범위는 D-31·D-38·D-45 안에서 가능. 운영 DB·실제 자료는 별도 승인 필요
권장 브랜치명: codex/qa-047-integrated-auth-rls-rpc-e2e
현재 상태: DONE (PASS, 실제 JWT·TOTP AAL2·migration 016 review queue·cleanup 11종 0·runtime 4종 false)
```

## OPS-034

```text
작업 ID: OPS-034
작업명: 최종 통합 후보 원격 보존·고유 온라인 draft
담당 전문 에이전트: 총괄 PM / quality-security
현재 문제: 검증 완료된 로컬 통합 후보가 아직 원격과 온라인 확인 주소에 보존되지 않았다.
사업적 목적: main과 production을 바꾸기 전에 사용자가 최종 후보를 온라인에서 확인할 수 있게 한다.
근거 문서: D-46, OPS-033, QA-047, ops/RELEASE_CHECKLIST.md
선행 작업: OPS-033·QA-047 PASS, D-46 사용자 승인
수정 허용 경로: OPS-033 격리 저장소의 Git ref, 원격 별도 codex 브랜치, Netlify 고유 draft, OPS-034 보고서·운영 문서
수정 금지 경로: GitHub main, PR, 운영 Supabase, 실제 데이터, Netlify production 별칭, 정식 도메인
공유 계약: exact HEAD cdd0929만 보존하며 배포 입력은 해당 HEAD에서 새로 만든 dist다. noindex를 유지한다.
구현 범위: 원격 브랜치 push, 원격 SHA 대조, clean build, 고유 draft 생성, HTTP·noindex·핵심 화면 smoke
구현하지 않을 범위: PR 생성, main 병합, production 배포, 운영 DB migration, 외부 게시·업체 연락
완료 조건: 원격 SHA가 local과 일치하고 고유 draft가 200·noindex이며 production URL과 main SHA가 불변이다.
검증 방법: git ls-remote, build·dist, draft URL HTTP/브라우저, production URL과 main ref 전후 대조
실행할 테스트: prepare-dist, validate-dist, 홈·계산기·체크리스트·로그인·업체 등록 smoke
위험요소: 잘못된 브랜치·production 배포, 오래된 dist, 환경변수 누락
롤백 방법: 고유 draft를 사용하지 않고 원격 별도 브랜치만 삭제 후보로 기록한다. main·production은 원래 상태라 롤백 불필요
사용자 승인 필요 여부: D-46 승인 완료. main·production·운영 DB는 별도 승인 필요
권장 브랜치명: codex/ops-034-integrated-preview
현재 상태: DONE (PASS, remote branch `codex/ops-034-integrated-preview`=`cdd0929`, deploy `6a6aba4d5ef57d8288accfea`, 홈·업체 찾기·계산기·체크리스트·로그인과 중첩 JS/CSS 200·noindex, main·production·운영 DB 불변)
```

## QA-048

```text
작업 ID: QA-048
작업명: 최종 통합 draft 공개·비로그인 다중 뷰포트 회귀
담당 전문 에이전트: quality-security
현재 문제: OPS-034 고유 draft는 HTTP·핵심 런타임 smoke를 통과했지만 최종 통합 후보 전체를 390·768·1440px에서 하나의 공개·비로그인 기능 행렬로 검수한 최신 결과가 없다.
사업적 목적: main과 production 승인 전에 사용자가 실제로 접할 공개 화면의 깨짐·잘못된 메뉴·작동하지 않는 도구를 낮은 비용으로 차단한다.
근거 문서: D-46, OPS-033, OPS-034, QA-045, QA-047, ops/RELEASE_CHECKLIST.md
선행 작업: OPS-034 PASS, 고유 draft 6a6aba4d5ef57d8288accfea
수정 허용 경로: ops/reports/QA-048-final-draft-public-regression.md, ops/ACTIVE_WORK.md, ops/BACKLOG.md, ops/PROJECT_BOARD.md, ops/DEPENDENCIES.md, ops/RISKS.md, ops/RELEASE_CHECKLIST.md, ops/TASK_SPECS.md
수정 금지 경로: 제품 HTML·JS·CSS·이미지, API·DB·migration·Supabase·환경변수·package/lock, Git index·commit·push·PR·main, Netlify draft·production, 실제 폼 제출·로그인·개인정보
공유 계약: 공개 헤더는 업체 찾기·비용 계산기·준비 체크리스트·준비백과·업체 등록·로그인 6개다. 비교함은 공개 헤더에 없고 로그인 뒤 마이페이지 경로다. 행사는 5개 분류를 유지하고 테스트 주소는 noindex다.
구현 범위: 최종 draft의 홈·업체 찾기·계산기·체크리스트·준비백과·업체 등록·로그인·비교함 직접 접근을 390·768·1440px에서 읽기 전용 검수한다. 주요 링크, 이미지, 가로 overflow, console error, 공개 헤더, 계산기 인원 문구, 체크리스트 행사 선택, 빈 업체 상태, noindex를 확인한다.
구현하지 않을 범위: 실제 로그인, 견적·업체·문의·정보 제출, DB 쓰기, 운영 역할 E2E, 디자인 취향 변경, 발견 결함 수정, 배포·병합
완료 조건: 대상 화면의 핵심 콘텐츠와 JS/CSS가 200이고 noindex다. 3개 뷰포트에서 가로 overflow와 깨진 이미지·console error가 없다. 공개 헤더·계산기·체크리스트·비교함 경계가 승인 계약과 일치한다. 발견 사항은 재현 경로·뷰포트·심각도와 함께 보고한다.
검증 방법: 온라인 HTTP asset smoke, 브라우저 DOM·console·viewport read-only 점검, 현재 task contract 대조
실행할 테스트: /, /venues, /calculator, /checklist, /articles, /provider-register, /login, /compare; 390×844, 768×1024, 1440×1000; scrollWidth/clientWidth, img naturalWidth, console error/warn
위험요소: Supabase 설정이 없는 draft에서 인증 기능을 실패로 오판, 단순 취향을 결함으로 분류, 실제 제출 버튼을 누름
롤백 방법: 읽기 전용 검사라 외부 롤백 없음. 운영 문서 판정만 근거에 맞게 수정한다.
사용자 승인 필요 여부: 읽기 전용 검수는 불필요. 제품 수정·main·production·운영 DB는 별도 승인 필요.
권장 브랜치명: 해당 없음(읽기 전용)
현재 상태: DONE (PASS, 공개 경로 8개×390·768·1440=24/24, overflow 0·깨진 이미지 0·console 0, 공개 헤더·계산기·체크리스트·비교함 경계 일치, 제품·DB·배포 변경 0)
```

## FE-031

```text
작업 ID: FE-031
작업명: 핵심 세부 페이지 톤앤매너·폰트 규격 통합
담당 전문 에이전트: frontend-design
현재 문제: 업체 찾기, 비용 계산기, 체크리스트, 준비백과 등 핵심 세부 화면이 52~72px의 서로 다른 제목 크기와 분홍·사진형 녹색·적갈색 배경을 따로 사용해 같은 서비스로 보이지 않는다.
사업적 목적: 페이지를 이동해도 손품해방의 따뜻한 아이보리·딥그린·코랄 시각 언어와 동일한 정보 위계를 유지해 신뢰와 사용성을 높인다.
근거 문서: 사용자의 2026-07-30 세부 페이지 디자인 피드백과 첨부 화면 3건, OPS-034, QA-048
선행 작업: OPS-034 통합 미리보기 및 QA-048 PASS
수정 허용 경로: OPS-033 격리 후보의 venues.html, calculator.html, checklist.html, articles.html, provider-register.html, compare.html, login.html, styles/components/subpage-hero.css, FE-031 운영 문서
수정 금지 경로: dirty root 제품 파일, JavaScript, API, DB, RLS, 마이그레이션, 라우팅, 환경변수, 패키지·잠금 파일, styles/tokens.css, styles/base.css, styles/layout.css, CHG-A~C
공유 계약: 현재 URL, 폼 ID, 데이터 속성, 행사 분류, 계산기·체크리스트·업체 등록 동작과 기존 디자인 토큰 값을 변경하지 않는다.
구현 범위: 핵심 세부 화면의 히어로 배경·제목·본문·eyebrow·보조 패널·간격을 전용 공통 컴포넌트로 통합하고 로그인 제목도 같은 반응형 폰트 규격에 맞춘다.
구현하지 않을 범위: 페이지 본문 재설계, 기능 변경, 콘텐츠 정책 변경, 공통 헤더 구조 변경, main·production 배포
완료 조건: 지정 화면의 데스크톱 h1이 52px로 통일되고 반응형 크기가 일관되며, 390/768/1440px에서 가로 넘침과 깨진 이미지가 0이고 기존 자동 검사가 통과한다.
검증 방법: 계산 스타일 비교, 다중 뷰포트 브라우저 검사, 정적·마켓플레이스·리디자인·배포 번들 검사
실행할 테스트: validate.mjs, marketplace-flow.mjs, sonpum-redesign.mjs, prepare-dist.mjs, validate-dist.mjs, 온라인 브라우저 390/768/1440px
위험요소: 페이지 전용 CSS 우선순위가 공통 규격을 덮거나 작은 화면에서 보조 정보가 기능 시작을 늦출 수 있다.
롤백 방법: 7개 HTML의 공통 클래스·링크를 제거하고 styles/components/subpage-hero.css를 삭제한다.
사용자 승인 필요 여부: 구현·별도 branch·draft 승인됨. GitHub main 병합과 production 배포는 D-30 별도 승인 필요
권장 브랜치명: codex/fe-031-subpage-visual-system
현재 상태: DONE (PASS, commit 6a227a5, noindex draft 6a6ad5c2311d65fe29d4076f, 온라인 18/18 규격·overflow·이미지 검사 PASS)
```

## FE-032

```text
작업 ID: FE-032
작업명: 세부 페이지 이미지 톤·공통 구조·정적 준비백과 정리
담당 전문 에이전트: frontend-design
현재 문제: 기능 페이지의 큰 히어로, 페이지마다 다른 헤더·푸터, 낮은 코랄 대비, 준비백과의 레거시 브랜드·혼합 날짜·JS 의존 본문이 사용성과 검색 미리보기를 저해한다.
사업적 목적: 방문자가 첫 화면에서 기능을 바로 사용하고 모든 페이지를 같은 서비스로 인식하며, 공개 준비백과가 검색엔진과 링크 미리보기에 읽히게 한다.
근거 문서: 사용자 2026-07-30 화면·문구 수정 요청, FE-031 결과, ops/DOMAIN_LAUNCH_CHECKLIST.md
선행 작업: OPS-034, QA-048, FE-031
수정 허용 경로: 승인 통합 후보의 관련 공개 HTML·CSS·blog·build·test 파일
수정 금지 경로: DB·migration·API·RLS·환경변수·package/lock·실제 데이터
공유 계약: 기존 URL·검색 쿼리·저장 키·5개 행사 분류·Supabase 계약 불변
구현 범위: 페이지별 희미한 이미지, 기능 히어로 축소, 홈 압축, 공통 헤더·푸터, 접근성, 날짜·브랜드, 정적 글 6개, canonical·OG·sitemap
구현하지 않을 범위: 정식 도메인 확정, 운영 배포, DB·API, 글 내용의 법률 확정
완료 조건: 자동 검사와 390·768·1440 브라우저 검사, 접근성·SEO·noindex 검사가 모두 PASS
검증 방법: 정적/회귀/build/dist 검사와 로컬·고유 draft 브라우저 계산 스타일
실행할 테스트: validate, marketplace-flow, sonpum-redesign, calculator-conditional-flow, validate-dist
위험요소: 임시 테스트 canonical을 정식 도메인으로 오인할 수 있음
롤백 방법: commit ce3a409의 부모로 branch draft를 폐기하고 production 불변 유지
사용자 승인 필요 여부: 구현·고유 noindex draft는 불필요, main·production은 필요
권장 브랜치명: codex/fe-032-page-polish-seo
현재 상태: DONE (PASS, commit ce3a409, noindex draft 6a6ade53311d652a67d406fa)
```

## FE-033

```text
작업 ID: FE-033
작업명: 계산기 결과 하단 배치·완료 후 자동 이동
담당 전문 에이전트: frontend-design
현재 문제: PC에서 결과 패널이 입력 단계 옆에 고정돼 선택 흐름보다 먼저 시선을 끌고, 결과 확인 행동과 실제 결과 위치의 연결이 약하다.
사업적 목적: 사용자가 조건 입력을 끝낸 뒤 자연스럽게 결과를 읽고 다음 행동으로 이어가게 한다.
근거 문서: 사용자 2026-07-30 계산기 결과 위치 수정 요청
선행 작업: FE-032
수정 허용 경로: styles/pages/calculator.css, scripts/pages/calculator.js, scripts/tests/calculator-conditional-flow.mjs
수정 금지 경로: 계산식·저장·검색 계약, 다른 페이지, API·DB·migration·환경변수·package/lock
공유 계약: 5단계·행사 분류·예상 인원·공간 식비·calculator-state·TaranSearchContext 불변
구현 범위: 결과 패널 단일 열 하단 배치, 완료 후 결과 상단 스크롤·초점
구현하지 않을 범위: 계산 기준·금액·문구·저장·공유·검색 기능 변경
완료 조건: 자동 검사와 모바일·PC 실제 클릭 검수 PASS
검증 방법: 결과와 form 위치 계산, 마지막 버튼 클릭 전후 scrollY·focus 측정
실행할 테스트: calculator-conditional-flow, validate, build, validate-dist
위험요소: 큰 결과 패널의 가운데 정렬 스크롤이 상단 내용을 잘라낼 수 있음
롤백 방법: FE-033 commit을 되돌리고 FE-032 계산기 레이아웃으로 복원
사용자 승인 필요 여부: 별도 branch·noindex draft는 불필요, main·production은 필요
권장 브랜치명: codex/fe-033-calculator-result-below
현재 상태: DONE (PASS, commit 41f90e8, noindex draft 6a6ae305b9f8279eabcca42e)
```

## FE-034

```text
작업 ID: FE-034
작업명: 계산기 우측 세부 선택 작업공간·실사용 계획 로직 고도화
담당 전문 에이전트: frontend-design
현재 문제: 세부 행사와 공간 조건이 기본 선택 아래로 길게 이어져 PC에서 화면을 내려야 하며, 결과가 총액 범위만 보여 실제 준비자가 비용 변동 원인과 계약 전 확인사항을 이해하기 어렵다.
사업적 목적: 한 화면 안에서 기본 조건과 세부 조건을 함께 선택하고, 식사 인원·알고 있는 공간비·비용 영향·빠뜨리기 쉬운 확인사항을 제공해 실제 행사 준비 의사결정에 도움이 되는 계산기로 만든다.
근거 문서: 사용자 2026-07-30 계산기 우측 세부 배치·정교한 로직 요청, FE-028, FE-033
선행 작업: FE-033
수정 허용 경로: calculator.html, styles/pages/calculator.css, scripts/pages/calculator.js, scripts/tests/calculator-conditional-flow.mjs, FE-034 운영 문서
수정 금지 경로: 다른 제품 페이지, 공통 헤더·디자인 토큰, API·DB·migration·RLS·환경변수·package/lock, GitHub main, Netlify production
공유 계약: 기존 5단계, 행사 분류, calculator-state, TaranSearchContext, 저장·공유·업체 검색·체크리스트 연결 계약을 유지한다.
구현 범위: PC에서 행사 세부 유형·인원 바로가기·공간 세부 조건을 우측 패널로 배치, 모바일 순차 배치, 총 참석 인원과 식사 인원 분리, 알고 있는 공간비 선택 입력, 항목별 중간값 합산, 1인당 계획액·인원 변동 영향·고정비 비중·계약 전 확인사항 표시
구현하지 않을 범위: 실제 시세 확정, 지역별 임의 가중치, 업체 추천 순위, 결제·예약, API·DB 저장 계약 확대
완료 조건: 1440×900에서 세부 선택 패널이 기본 선택 오른쪽에 보이고 내부 가로 넘침 없이 주요 선택이 한 화면에 들어온다. 390px에서는 자연스러운 순차 흐름이며, 식사 인원과 공간비 입력이 계산 및 결과 설명에 반영되고 기존 저장·검색 연결이 유지된다.
검증 방법: 자동 정적·상태 전이·build/dist 검사와 PC·모바일 실제 5단계 클릭 흐름
실행할 테스트: calculator-conditional-flow, validate, marketplace-flow, sonpum-redesign, prepare-dist, validate-dist, 1440×900·390×844 브라우저 검수
위험요소: 입력 증가로 인한 복잡도, 근거 없는 가격 정확성 인상, 좁은 화면에서 우측 패널 넘침
롤백 방법: FE-034 commit을 되돌려 FE-033 하단 결과 구조로 복원
사용자 승인 필요 여부: 별도 branch·noindex draft까지 자동 수행 가능. GitHub main 병합과 production 배포는 D-30 별도 승인 필요
권장 브랜치명: codex/fe-034-calculator-planning-workspace
현재 상태: DONE (PASS, commit 15cf755, noindex draft 6a6aea33214bb52650f7896c)
```

## OPS-035

```text
작업 ID: OPS-035
작업명: 업체 후보 수집·연락·방문 실무 양식과 카테고리별 출처 정리
담당 전문 에이전트: 총괄 PM·마케팅·운영
현재 문제: 사용자가 업체를 직접 확인하고 견적을 모을 때 쓸 통일된 기록 양식과 카테고리별 안전한 발견 경로가 없다.
사업적 목적: 베타 운영에 필요한 업체 후보, 확인 결과, 견적과 공개 동의를 재현 가능한 구조로 축적한다.
근거 문서: docs/99_의사결정기록.md, ops/reports/QA-022-nationwide-public-data-register.md, backend/public_data_seed/README.md, 사용자 2026-07-31 요청
선행 작업: QA-022
수정 허용 경로: ops/TASK_SPECS.md, ops/ACTIVE_WORK.md, ops/APPROVALS.md, 이번 대화 전용 outputs 폴더
수정 금지 경로: 제품 HTML·CSS·JS, Supabase DB·migration·RLS, backend/data 원본, API·환경변수, GitHub main, Netlify production
공유 계약: 공공데이터는 출처·확인일을 기록하고, 네이버 검색 결과는 별도 업체 DB의 원천으로 저장하지 않는다. 업체 적합성·가격·사진·연락처는 업체 직접 확인 전 확정 사실로 표시하지 않는다.
구현 범위: 업체 후보, 연락·방문, 상세 질문, 견적, 카테고리별 수집 방법, 현장 질문과 선택 목록이 포함된 엑셀 양식 작성. 기존 공공데이터 후보 10곳을 확인 전 후보로 수록.
구현하지 않을 범위: 신규 외부 API 수집, 네이버 결과 저장, 업체 연락·방문, 운영 DB 적재, 외부 공개, 유료 계약
완료 조건: 사용자가 파일 하나로 후보 정리부터 연락·방문·견적 기록까지 수행할 수 있고, 카테고리별 공공데이터 가능 범위와 직접 확인 항목이 구분되며, 모든 수록 후보에 출처와 상태가 표시된다.
검증 방법: 전체 시트 렌더링, 필수 열·드롭다운·수식 확인, 수식 오류 검사
실행할 테스트: XLSX 내보내기, 주요 범위 검사, #REF!·#DIV/0!·#VALUE!·#NAME?·#N/A 오류 검색
위험요소: 검색 결과를 별도 DB로 오인해 축적하는 위험, 허가 업종을 가족행사 적합 업체로 오인하는 위험, 공개 동의 없는 견적·사진 공개 위험
롤백 방법: 이번 대화 전용 산출물 폴더만 제거하고 기존 저장소 파일과 데이터는 유지
사용자 승인 필요 여부: 양식 제작은 불필요. 실제 업체 연락·방문·공개·유료 계약은 사용자 직접 수행 또는 별도 승인 필요.
현재 상태: DONE (PASS, 업체 수집·연락·방문 워크북 1개, 공공데이터 후보 10곳, 카테고리 15개, 전체 8개 시트 검수 완료)
```

## MKT-012

```text
작업 ID: MKT-012
작업명: 서울 가족행사 연락 가능 업체 후보 1차 확장
담당 전문 에이전트: 총괄 PM·마케팅·운영
현재 문제: 기존 워크북의 공공데이터 후보 10곳에는 공식 대표 연락처가 없어 사용자가 바로 전화·문의하기 어렵다.
사업적 목적: 베타 준비자가 장소·촬영·장식·미용 분야의 공식 연락 채널을 이용해 실제 행사 가능 조건과 견적을 확인할 수 있게 한다.
근거 문서: OPS-035, QA-009, QA-010, NAVER 개발자 이용약관, 사용자 2026-07-31 요청
선행 작업: OPS-035 DONE
수정 허용 경로: ops/TASK_SPECS.md, ops/ACTIVE_WORK.md, 이번 대화 전용 outputs/019f8241-b823-7982-94f7-ba1a171e591a/손품해방_업체정보_수집양식.xlsx 및 해당 워크북 생성 스크립트·검수 미리보기
수정 금지 경로: 제품 HTML·CSS·JS, Supabase DB·migration·RLS, backend/data 원본, NAVER 검색·플레이스·블로그 결과 저장 파일, API·환경변수, GitHub main, Netlify production
공유 계약: NAVER는 수동 업체 발견과 공식 채널 탐색에만 보조적으로 사용한다. 검색 결과 설명·리뷰·사진·전화번호를 별도 DB로 복제하지 않고, 공식 홈페이지 또는 공식 사업자 공개자료에서 독립 확인된 대표 채널만 워크북에 기록한다.
구현 범위: 서울 돌잔치·가족연회 우선 후보와 촬영·돌상/장식·미용 후보의 공식 전화·이메일·문의 URL·확인일·행사 적합성·다음 행동을 기존 워크북에 추가한다.
구현하지 않을 범위: 업체 실제 연락, NAVER API 수집, 리뷰·사진 저장, 운영 DB 적재, 외부 공개, 가격 확정, 입점 제안
완료 조건: 공식 연락 채널이 확인된 신규 후보가 15곳 이상 추가되고 장소 외 카테고리가 포함된다. 모든 신규 행에 공식 출처 URL·확인일·공개 금지 상태가 표시되며 중복·수식 오류가 없다.
검증 방법: 공식 출처 교차 확인, 워크북 전체 시트 렌더링, 후보 행·드롭다운·수식·오류 검사
실행할 테스트: XLSX 내보내기, 8개 시트 렌더링, 신규 후보 수·카테고리·공식 연락 채널 검사, #REF!·#DIV/0!·#VALUE!·#NAME?·#N/A 검색
위험요소: NAVER 발견 사실을 데이터 이용 허락으로 오인, 공식 대표 채널과 개인 연락처 혼동, 행사 페이지가 기간 종료된 프로모션일 수 있음
롤백 방법: 기존 워크북 생성 스크립트의 신규 후보 행과 확장 범위만 제거한 뒤 같은 파일을 재생성한다.
사용자 승인 필요 여부: 공개 정보 조사와 내부 워크북 갱신은 불필요. 실제 전화·방문·문의 제출·공개·계약은 사용자 직접 수행 또는 별도 승인 필요.
현재 상태: DONE (PASS, 신규 공식 연락 가능 후보 19곳 추가, 장소·음식 14·돌상/장식 2·촬영 2·미용/메이크업 1, 공식 출처·전화·연락 채널·확인일 19/19, 중복 0·수식 오류 0·공개 검토 0)
```

## MKT-013

```text
작업 ID: MKT-013
작업명: 전국 업체 후보 500곳 이상 내부 연락 전 목록 확장
담당 전문 에이전트: 총괄 PM·마케팅·운영
현재 문제: 기존 워크북은 29곳뿐이라 사용자가 전국 업체를 지역별로 찾아 연락할 출발 목록이 부족하다.
사업적 목적: 전국 무료 베타 준비를 위해 실제 업체 연락 전 확인 대상을 충분히 확보하고 지역별 탐색과 우선순위 선정을 가능하게 한다.
근거 문서: D-34, D-37, D-48, QA-022, OPS-035, MKT-012, 사용자 2026-07-31 요청과 공공데이터포털 전환 공지
선행 작업: OPS-035·MKT-012 DONE
수정 허용 경로: ops/TASK_SPECS.md, ops/ACTIVE_WORK.md, ops/APPROVALS.md, 이번 대화 전용 outputs/019f8241-b823-7982-94f7-ba1a171e591a/**, 사용자 Downloads의 공식 파일데이터 원본 읽기
수정 금지 경로: 제품 HTML·CSS·JS, Supabase DB·migration·RLS, backend/data, NAVER 검색·플레이스·블로그 결과 저장, API·환경변수, GitHub main, Netlify production
공유 계약: 공공데이터의 영업상태는 행정 신호일 뿐 주문제작·가족행사 적합성·연락 가능·가격·품질을 뜻하지 않는다. NAVER 결과는 대량 저장하지 않고 개별 공식 채널을 찾을 때만 수동 보조로 쓴다.
구현 범위: 행정안전부 전국 파일데이터에서 장소·음식, 숙박, 미용·메이크업, 케이크 후보를 각 128곳씩 총 512곳으로 균형 선정하고, 기존 29곳과 함께 출처·주소·상태·다음 확인 행동이 있는 워크북으로 확장한다.
구현하지 않을 범위: 업체 실제 연락, 연락처 자동 수집, 촬영·장식 등 공식 파일 공백 분야의 무근거 대량 생성, NAVER 결과 저장, 운영 DB 적재, 외부 공개, 가격·평점·후기·사진 확보
완료 조건: 전체 후보 500곳 이상, 신규 전국 공공데이터 후보 512곳, 장소·음식·숙박·미용·메이크업·케이크 각 128곳, 지역 16개 이상, 후보 ID 중복 0, 수식 오류 0, 모든 신규 후보 공개 금지
검증 방법: 원본 CSV 영업상태 필터·지역별 표본 수 확인, XLSX 전체 구조·수식·드롭다운·공개 상태 검사, 시트 미리보기
실행할 테스트: 원본 행·지역 집계, JSON 후보 집계, XLSX 내보내기, 8개 시트 렌더링, 중복·공식채널 누락·수식 오류 검사
위험요소: 인허가 업종을 가족행사 적합 업체로 오인, 행정상 영업을 실제 영업으로 보증, 공공데이터가 부족한 촬영·장식 분야를 억지로 채우는 위험
롤백 방법: 전국 후보 JSON과 생성 스크립트의 추가 로딩을 제거하고 MKT-012의 29곳 워크북으로 재생성한다.
사용자 승인 필요 여부: D-48로 내부 후보 목록 확장 승인 완료. 업체 연락·DB·사이트 공개·유료 계약은 별도 수행 또는 승인 필요.
현재 상태: DONE (PASS, 사용자 피드백으로 케이크 편중을 해소해 장소·음식·숙박·미용·메이크업·케이크 각 128곳, 전국 공공데이터 후보 512곳, 기존 후보 포함 총 541곳, 후보 ID 중복 0·수식 오류 0·의도하지 않은 공개 가능 0)
```

## MKT-014

```text
작업 ID: MKT-014
작업명: 가족사진 스튜디오·가족행사 스냅 작가 공식 연락 후보 보강
담당 전문 에이전트: 총괄 PM·마케팅·운영
현재 문제: 공공데이터 후보 512곳에는 촬영 분야가 없고 기존 공식 촬영 후보도 2곳뿐이라 사용자가 스튜디오와 사진작가에게 실제로 문의하기 어렵다.
사업적 목적: 전국 가족행사 준비에 필요한 스튜디오 촬영과 현장 스냅을 분리해 연락·견적 확인을 시작할 수 있는 첫 촬영 후보군을 만든다.
근거 문서: D-37, D-48, OPS-035, MKT-012, MKT-013, 사용자 2026-08-03 촬영업체 추가 요청
선행 작업: OPS-035·MKT-012·MKT-013 DONE
수정 허용 경로: ops/TASK_SPECS.md, ops/ACTIVE_WORK.md, ops/PROJECT_BOARD.md, ops/BACKLOG.md, 이번 대화 전용 outputs/019f8241-b823-7982-94f7-ba1a171e591a/**
수정 금지 경로: 제품 HTML·CSS·JS, Supabase DB·migration·RLS, backend/data, NAVER 검색·플레이스·블로그 결과 저장, API·환경변수, GitHub main, Netlify production
공유 계약: 후보명은 발견 단계이며 공식 홈페이지·공공기관 소개·공식 매칭 채널에서 연락 경로를 독립 확인한다. 가격·평점·후기·사진·가용 일정은 복제하지 않고 업체 확인 전 확정하지 않는다.
구현 범위: 가족사진·베이비·돌 촬영 스튜디오 12곳과 돌잔치·가족행사 스냅 작가 8곳을 추가하고, 공식 홈페이지·대표전화 또는 문의 채널·지역·확인일·문의할 세부 조건을 기록한다.
구현하지 않을 범위: 업체 실제 연락, 예약·견적 요청 제출, 가격 저장, 포트폴리오 사진 복제, 리뷰·평점 저장, 운영 DB·사이트 공개, 외부 게시
완료 조건: 신규 촬영 후보 20곳, 전체 공식 촬영 후보 22곳, 스튜디오 14·사진작가/스냅 8, 공식 연락 채널 누락 0, 후보 ID 중복 0, 수식 오류 0, 공개 가능 오표시 0
검증 방법: 공식 출처 확인, 워크북 재생성, 촬영 후보 구분 집계, 연락 채널·확인일·수식·공개 상태 검사, 촬영 후보 범위 렌더링
실행할 테스트: XLSX 내보내기, 8개 시트·561행 검사, 스튜디오/작가 집계, 공식 연락 채널 누락·후보 ID 중복·수식 오류·공개 오표시 검사
위험요소: 공식 사이트가 오래되었거나 지점·작가 활동 지역이 바뀌었을 수 있고, 공개 대표 연락처라도 영업 문의 수신 의사가 없을 수 있음
롤백 방법: 생성 스크립트의 MKT-014 후보 20행을 제거하고 MKT-013 균형 후보 워크북으로 재생성한다.
사용자 승인 필요 여부: 공개 정보 조사와 내부 워크북 갱신은 불필요. 실제 전화·방문·문의 제출·견적 공개·계약은 사용자 직접 수행 또는 별도 승인 필요.
현재 상태: DONE (PASS, 신규 스튜디오 12·사진작가/스냅 8, 공식 촬영 후보 총 22, 전체 후보 561, 연락 채널 누락 0·중복 0·수식 오류 0·공개 오표시 0)
```

## MKT-015

```text
작업 ID: MKT-015
작업명: 스튜디오·사진작가 문의 체크리스트와 투명한 가상 상담 스크립트
담당 전문 에이전트: 총괄 PM·마케팅·운영
현재 문제: 촬영 업체 후보는 확보됐지만 사용자가 전화·문의폼에서 어떤 조건을 어떻게 묻고 기록해야 하는지 분야별 실무 문장이 없다.
사업적 목적: 업체별 가격과 서비스 범위를 같은 기준으로 비교하고, 예약·취소·납품·촬영물 권리까지 빠뜨리지 않는 첫 상담 자료를 축적한다.
근거 문서: OPS-035, MKT-014, 사용자 2026-08-10 문의 체크리스트·가상 인물 스크립트 요청
선행 작업: OPS-035·MKT-014 DONE
수정 허용 경로: ops/TASK_SPECS.md, ops/ACTIVE_WORK.md, ops/PROJECT_BOARD.md, 이번 대화 전용 outputs/019f8241-b823-7982-94f7-ba1a171e591a/**
수정 금지 경로: 제품 HTML·CSS·JS, Supabase DB·migration·RLS, backend/data, API·환경변수, GitHub main, Netlify production
공유 계약: 가상 인물은 연습과 예시 조건에만 사용한다. 실제 문의에서는 손품해방 베타 운영자임과 예약 확정 문의가 아님을 먼저 밝히며, 업체 답변과 정보 공개 동의를 분리한다.
구현 범위: 공통 시작·마무리 문장, 스튜디오 14개 확인 항목, 사진작가·스냅 15개 확인 항목, 통화 후 확인 메시지 3개를 기존 업체정보 워크북에 추가한다.
구현하지 않을 범위: 실제 업체 연락·예약·견적 제출, 고객 사칭, 가격 확정, 업체 답변 생성, 운영 DB·사이트 공개, 배포
완료 조건: 스튜디오와 사진작가의 확인 항목이 분리되고 가격·부가세·추가금·취소·납품·백업·저작권·초상권·공개 동의가 포함된다. 실제 신분과 비예약 목적을 명시한 복사용 스크립트가 있으며 기존 후보 561곳과 공개 금지 상태가 보존된다.
검증 방법: 워크북 재생성·재열기, 문의스크립트 렌더링, 필수 문구·질문 수·후보 수·수식·중복·공개 상태 검사
실행할 테스트: XLSX 내보내기, 9개 시트 검사, 문의 질문 32개·필수 용어 검사, 후보 561행·촬영 후보 22곳·중복·수식·공개 오표시 검사
위험요소: 가상 조건을 실제 예약 의사로 오해시키는 위험, 통화 답변을 공개 허락으로 오인하는 위험, 구두 가격의 유효기간·포함 항목 누락
롤백 방법: 생성 스크립트의 문의스크립트 시트와 검증 항목을 제거하고 MKT-014 워크북으로 재생성한다.
사용자 승인 필요 여부: 양식·스크립트 작성은 불필요. 실제 전화·문자·문의폼 제출·방문·예약·공개는 사용자 직접 수행 또는 별도 승인 필요.
현재 상태: DONE (PASS, 문의스크립트 1개 시트·확인 항목 32개, 전체 9개 시트·후보 561곳 보존, 필수 문구 누락 0·중복 0·수식 오류 0·공개 오표시 0)
```

## MKT-016

```text
작업 ID: MKT-016
작업명: 검색 보조 촬영업체 22곳 공식 상세정보 보강
담당 전문 에이전트: 총괄 PM·마케팅·운영
현재 문제: 촬영 후보 22곳은 이름과 연락 채널만 중심으로 기록돼 사용자가 문의 전에 서비스 범위·결과물·예약 조건을 비교하기 어렵다.
사업적 목적: 검색을 업체 발견에만 사용하고 공식 채널에서 재확인된 상세 사실을 출처·확인일과 함께 축적해 실제 문의의 효율과 정확도를 높인다.
근거 문서: MKT-014·MKT-015, NAVER API 서비스 이용약관, Kakao Local API 문서, Google Places API 정책, 사용자 2026-08-11 요청
선행 작업: MKT-014·MKT-015 DONE
수정 허용 경로: ops/TASK_SPECS.md, ops/ACTIVE_WORK.md, ops/PROJECT_BOARD.md, 이번 대화 전용 outputs/019f8241-b823-7982-94f7-ba1a171e591a/**
수정 금지 경로: 제품 HTML·CSS·JS, Supabase DB·migration·RLS, backend/data, API 키·환경변수, GitHub main, Netlify production
공유 계약: 네이버·다음·구글 검색 결과·지도·리뷰·사진·평점을 복제하거나 별도 업체 DB의 사실로 저장하지 않는다. 검색은 공식 채널 발견에만 쓰고 공식 홈페이지·공식 공공기관 페이지에서 재확인된 공개 사실만 출처 URL·확인일과 함께 기록한다.
구현 범위: 스튜디오 14곳과 사진작가·스냅 8곳의 가능한 촬영, 서비스 지역, 공간·촬영 방식, 공개된 결과물·예약·취소·납품 조건, 공식 문의 채널, 미확인 항목을 기존 워크북의 업체상세에 추가한다. 검색·API 이용 경계도 사용안내에 반영한다.
구현하지 않을 범위: 검색 결과 원문·리뷰·평점·사진 저장, 자동 크롤링, API 키 발급·유료 호출, 업체 연락·예약·견적 제출, 운영 DB·사이트 공개, 가격 보증
완료 조건: 촬영 후보 22곳 모두 후보 ID·업체명·확인일·출처 URL·서비스 요약·공식 문의 채널·미확인 항목이 기록된다. 검색 결과 파생 사실은 0건이며 기존 후보 561곳과 공개 금지 상태가 보존된다.
검증 방법: 공식 출처 교차 확인, 워크북 재생성·재열기, 22개 상세행 필수 열 검사, 후보·중복·수식·공개 상태 검사, 업체상세 렌더링
실행할 테스트: XLSX 내보내기, 9개 시트·업체상세 22행·후보 561행 검사, 출처 URL·확인일·공식 문의 누락·중복·수식 오류·공개 오표시 검사
위험요소: 공식 페이지도 갱신이 늦거나 가격·예약 조건이 바뀔 수 있음, 검색 스니펫을 공식 확정 사실로 오인, 동일 브랜드 지점 조건을 전체 지점에 일반화
롤백 방법: 생성 스크립트의 촬영 상세행과 사용안내 검색 정책 문구를 제거하고 MKT-015 워크북으로 재생성한다.
사용자 승인 필요 여부: 공개 웹 조사와 내부 워크북 갱신은 불필요. API 키 발급·비용 발생·업체 연락·외부 공개는 별도 승인 필요.
현재 상태: DONE (PASS, 스튜디오 14곳·사진작가/스냅 8곳 상세 보강, 출처·확인일·공식 문의·미확인 항목 누락 0, 검색 결과 파생 출처 0, 후보 561곳·공개 금지 상태 보존, 수식 오류 0)
```

## BE-028

```text
작업 ID: BE-028
작업명: 전국 업체 후보 561곳 전체 상세행·외부 API 보강
담당 전문 에이전트: 총괄 PM·백엔드·데이터
현재 문제: 업체후보 561곳을 동일한 상세 기준으로 연결하고, 승인된 공공데이터 API로 기존 후보의 최신 행정상태와 연락 가능성을 보수적으로 대조해야 한다.
사업적 목적: 모든 후보를 상세 검수표에 연결하고, 허용된 API와 공식 출처로 확인된 사실만 단계적으로 보강해 업체 연락·비교·공개 검수의 기반을 만든다.
근거 문서: D-01~D-03, D-15, D-23, D-35, D-37, D-48, QA-022, MKT-016, NAVER API 서비스 이용약관, Kakao Maps API 문서·서비스 약관, Google Places API 정책, 공공데이터포털 이용정책, 사용자 2026-08-11 요청
선행 작업: MKT-013·MKT-014·MKT-016 DONE
수정 허용 경로: ops/TASK_SPECS.md, ops/ACTIVE_WORK.md, ops/PROJECT_BOARD.md, ops/APPROVALS.md, ops/RISKS.md, ops/DEPENDENCIES.md, ops/reports/BE-028-*.md, 이번 대화 전용 outputs/019f8241-b823-7982-94f7-ba1a171e591a/**
수정 금지 경로: 제품 HTML·CSS·JS, Supabase 운영 DB·migration·RLS, backend/data, GitHub main, Netlify production, API 비밀키가 포함된 추적 파일
공유 계약: 공공데이터는 업체 존재·행정 영업상태·주소·원천 갱신일의 후보 사실만 제공한다. 네이버 지역정보는 별도 DB 구축에 사용하지 않는다. Google Places 콘텐츠는 허용된 예외 외 영구 저장하지 않는다. 외부 API 결과는 필드별 출처·확인일·보관 조건을 함께 기록한다.
구현 범위: 후보 561곳 모두 업체상세 행 생성, 후보 ID 일대일 연결, 이름·주소·행정상태·지역·업종·공식 근거 URL·공식 연락채널 또는 확인 필요 상태·재확인일·미확인 항목 기록. 사용 가능한 공공데이터 API 키가 연결되면 행정상태·주소·원천 갱신일을 새로 조회해 비교한다.
구현하지 않을 범위: API에 없는 가격·수용인원·주차·예약·취소 조건 추정, 네이버 검색·플레이스·블로그 결과의 별도 DB화, Google Places 콘텐츠 영구 저장, 유료 API·비즈월렛·Google Cloud 결제 활성화, 업체 연락, 운영 DB 적재, 사이트 공개·배포
완료 조건: 업체상세 561행, 후보 ID 누락·추가·중복 0, 근거·문의 상태·메모 누락 0, 공공데이터 522행의 가격 임의 입력 0, 검색 결과 URL 저장 0, 수식 오류 0. 실제 API 단계는 유효 키·이용조건·비용 승인이 확보되고 재현 가능한 호출 로그가 있어야 완료한다.
검증 방법: XLSX 재열기, 후보와 상세 ID 집합 대조, 필수 열·출처 URL·미확인 가격 검사, 검색 결과 도메인 검사, 수식 오류 검사, 전체 시트 렌더링
실행할 테스트: 10개 시트 검사, 후보/상세 561행 일대일 검사, 공공데이터 522행 가격 공란 검사, 촬영 22행 기존 상세 보존 검사, 일반음식점 API 결과 128행·정확 일치·폐업 연락 제외 검사, 중복·출처·연락 상태·메모·수식 오류·서비스키 노출 검사
위험요소: API가 제공하지 않는 값을 자동 추정하는 오류, 동명이업체·지점 오매칭, API 콘텐츠 저장 약관 위반, 유료 호출 비용, 비밀키 노출, 행정상 영업과 실제 영업의 차이
롤백 방법: 새 `_전체후보상세` 워크북을 제거하고 MKT-016 `_검색보강` 워크북을 그대로 사용한다. 생성 스크립트의 전체 상세행 생성 블록만 이전 촬영 22행 블록으로 되돌린다.
사용자 승인 필요 여부: 승인된 공공데이터 일반음식점 API 범위는 완료. Google Places 결제 또는 Kakao 비즈월렛·유료 쿼터는 별도 비용 승인 필요. NAVER 지역정보 별도 DB화는 하지 않으며 D-35를 유지한다.
현재 상태: DONE (전체 상세 561행, 일반음식점 API 128행 대조, 정확 일치 72·영업 후보 34·폐업 제외 38·수동 검토 10·미일치 46, API 오류·ID 불일치·중복·수식 오류·서비스키 노출 0. 총괄 PM PASS)
```

## BE-029

```text
작업 ID: BE-029
작업명: NAVER API HUB 지역·블로그 비저장 canary
담당 전문 에이전트: 총괄 PM·백엔드·데이터
현재 문제: NAVER API HUB 키가 설정됐지만 실제 API 권한·호출 경로·응답 구조·호출 비용 위험을 확인하지 않았다.
사업적 목적: 대량 수집이나 DB 보강 전에 최소 호출로 연결 상태와 제공 필드를 확인해 기술·비용·권리 위험을 판단한다.
근거 문서: D-15, D-35, D-50, R-65, R-117, R-120, NAVER API HUB 공식 Application·지역 검색·블로그 검색 문서, 사용자 2026-08-12 설정 완료
선행 작업: API HUB 이용 신청·Application 등록·로컬 환경변수 설정 완료
수정 허용 경로: ops/TASK_SPECS.md, ops/ACTIVE_WORK.md, ops/PROJECT_BOARD.md, ops/APPROVALS.md, ops/RISKS.md, ops/DEPENDENCIES.md, ops/reports/BE-029-*.md
수정 금지 경로: 제품 코드, 업체 워크북·후보 JSON·모든 DB, backend/data, Supabase, GitHub, Netlify, API 키가 포함된 파일·로그, 외부 게시·업체 연락
공유 계약: API 응답 원문·업체명·주소·URL·블로그 제목·요약·작성자 등 결과 콘텐츠를 디스크나 운영 문서에 저장하지 않는다. 호출 상태·결과 건수·필드명·오류 코드만 기록한다.
구현 범위: `서울 돌잔치` 한 검색어로 지역 검색 1회·블로그 검색 1회, 각 최대 5개 응답의 상태·건수·필드 구조만 메모리에서 검사한다.
구현하지 않을 범위: 업체 후보 생성·병합·분류·영업 활용, 검색 결과 분석·요약·DB 저장, 지도/플레이스 화면 추출, 대량 호출, 제품·운영 DB·워크북 반영
완료 조건: 두 endpoint의 HTTP/API 성공 여부, 결과 개수, 최상위·항목 필드명, 비밀키 비출력·비저장, 생성된 업체/블로그 데이터 파일 0건이 재현 가능하게 기록된다.
검증 방법: 환경변수 존재 여부만 확인하고 메모리 호출 후 비민감 메타데이터만 출력한다. 프로젝트에서 키 패턴과 신규 결과 파일을 검사한다.
실행할 테스트: 지역 검색 1회, 블로그 검색 1회, HTTP 상태·응답 건수·필드명 검사, 비밀키·결과 파일 0건 검사
위험요소: 종량제 호출 비용, 키 노출, 애플리케이션 API 권한 누락, 검색 결과 저장·가공 범위 오인
롤백 방법: 결과 콘텐츠를 저장하지 않으므로 데이터 롤백 없음. 운영 카드와 보고서만 제거 가능하다.
사용자 승인 필요 여부: 사용자가 API HUB 설정 완료로 약속한 최소 canary 호출을 승인한 것으로 적용. 대량 호출·DB 저장·영업 활용은 별도 서면 권리 근거와 비용 승인 필요.
현재 상태: DONE (지역·블로그 각 1회 HTTP 200, 각 5개 응답, 상태·건수·필드명만 검사, 검색 결과 콘텐츠·비밀키·결과 파일 저장 0. 총괄 PM PASS)
```

## BE-030

```text
작업 ID: BE-030
작업명: NAVER API HUB 서울 돌잔치 업체 20곳 제한 시험
담당 전문 에이전트: 총괄 PM·백엔드·데이터
현재 문제: API 연결은 확인됐지만 활용예시 범위에서 수집한 후보의 중복·관련성·정보 충실도·실제 비용을 검증한 표본이 없다.
사업적 목적: 전국 확대 전에 서울 돌잔치 관련 업체 20곳을 여러 분야로 균형 있게 확보해 실제 연락·보완 가능성을 평가한다.
근거 문서: BE-029, D-50, R-120, NAVER API HUB 공식 활용예시·지역 검색·블로그 검색 문서, 사용자 2026-08-12 활용예시 확인
선행 작업: BE-029 DONE, 일 25,000회 호출 한도 확인
수정 허용 경로: ops/TASK_SPECS.md, ops/ACTIVE_WORK.md, ops/PROJECT_BOARD.md, ops/APPROVALS.md, ops/RISKS.md, ops/DEPENDENCIES.md, ops/reports/BE-030-*.md, outputs/019f8241-b823-7982-94f7-ba1a171e591a/**
수정 금지 경로: 제품 코드, 기존 운영 업체 DB·Supabase·backend/data, GitHub·Netlify, API 비밀키가 포함된 파일, 업체 연락·외부 게시·운영 공개
공유 계약: 지역 검색은 업체 후보 이름·분류·주소·링크·좌표를 제공한다. 블로그 검색은 업체별 돌잔치 관련 언급 주제와 원문 확인 링크의 보조 신호로만 사용하며 평점·추천 순위·공식 사실로 표시하지 않는다.
구현 범위: 서울 돌잔치 장소·촬영·돌상·의상/미용·답례/케이크 관련 지역 검색을 최대 10회 실행하고, 중복 제거·분야 균형 후 20곳을 선정한다. 각 업체 블로그 검색은 최대 1회·3개 결과로 제한해 링크·게시일·언급 키워드만 분석한다. 검토용 XLSX와 비밀값 없는 재현 보고서를 만든다.
구현하지 않을 범위: 블로그 본문·이미지·작성자 프로필 복제, 임의 가격·평점·리뷰 수·인기 순위 생성, 업체 추천 확정, 외부 연락, 제품·운영 DB·사이트 반영, 전국 대량 수집
완료 조건: 서울 업체 후보 정확히 20곳, 분야 4개 이상, 중복 ID 0, 지역·블로그 호출 합계와 오류 기록, 후보별 지역 검색 출처·확인일·블로그 링크/게시일·분석 키워드·확인 필요 항목, API 키 노출 0, 수식 오류 0이 검증된다.
검증 방법: API 호출 응답 코드·호출 수 대사, 정규화 이름+주소 중복 검사, 서울 주소·분야 수 검사, 원천/분석/확인 필요 필드 분리, XLSX 재열기·렌더링·키 패턴·수식 오류 검사
실행할 테스트: 최대 10회 지역 검색, 최대 20회 블로그 검색, 후보 20·분야 4+·중복 0·서울 주소 검사, 워크북 렌더링, 키·수식 오류 검사
위험요소: 검색 결과의 행사 관련성 부족, 동일 브랜드 지점 중복, 블로그 광고성 글을 실제 후기·공식 사실로 오인, 종량제 비용, 약관의 저장 범위 확대 해석
롤백 방법: BE-030 전용 결과 JSON·XLSX·보고서만 제거한다. 기존 업체 워크북·제품·DB에는 영향이 없다.
사용자 승인 필요 여부: 이번 20곳 제한 시험과 API 호출은 사용자 현재 요청으로 승인. 업체 연락·운영 DB·사이트 공개·전국 확대는 별도 승인 필요.
현재 상태: DONE (서울 후보 20곳·5분야, 높음 14·보통 6·낮음 0, 블로그 언급 신호 19, 중복·비서울·필수 누락·API 오류·수식 오류·키 노출 0. 총괄 PM PASS)
```

## BE-031

```text
작업 ID: BE-031
작업명: 미검수 후보 20곳 안전 공개 projection
담당 전문 에이전트: 백엔드·데이터
현재 문제: BE-030 결과에는 공개하면 안 되는 전화·블로그 분석·좌표 등 내부 필드가 포함돼 있고, 현재 공개 계약은 검수 완료 업체만 허용한다.
사업적 목적: 전수 수기 검수 없이도 이용자가 업체의 존재와 위치·분야를 탐색하고 오류를 제보할 수 있는 최소 정보 기반을 만든다.
근거 문서: ADR-019, D-51, BE-030, R-122
선행 작업: BE-030 DONE, D-51 승인
수정 허용 경로: scripts/data/unverified-provider-candidates.js, scripts/tests/unverified-provider-projection.mjs, ops/reports/BE-031-unverified-provider-projection.md, BE-031 관련 운영 문서
수정 금지 경로: 기존 원본 후보 JSON·XLSX, 운영 DB·Supabase·migration·RLS, 기존 공개 업체 데이터, 제품 HTML·CSS·페이지 JS, API 키·환경변수, GitHub main·Netlify
공유 계약: 공개 필드는 후보 ID·업체명·후보 분야·지역·주소·NAVER 지역검색 관측 출처·관측일·`정보 확인 전` 상태와 UI 제어값만 허용한다. 가격·전화·좌표·블로그 결과·평점·후기·추천·문의·사진은 공개 projection에 포함하지 않는다.
구현 범위: BE-030 20곳을 공개 allowlist로 재구성하고, 중복·서울 주소·필수 필드·금지 필드·NAVER 확인 링크·문의 비활성·비밀값 부재를 자동 검사한다.
구현하지 않을 범위: 화면 연결, DB 적재, API 재호출, 업체 연락, 정보 검증, 가격·후기 생성, 외부 공개·배포
완료 조건: 후보 정확히 20곳, 5개 분야 유지, ID·이름+주소 중복 0, 필수 필드 누락 0, 금지 필드·비밀값 0, inquiry/review/compare 비활성, 서울 외 주소 0
검증 방법: 공개 JS를 격리 실행해 스키마 allowlist·값·URL·중복·금지 문자열을 검사한다.
실행할 테스트: node scripts/tests/unverified-provider-projection.mjs, node --check
위험요소: 동명이업체·폐업·업종 오분류를 최소 필드만으로도 사실로 오인할 수 있음
롤백 방법: 신규 공개 projection 파일과 전용 테스트·보고서만 제거한다.
사용자 승인 필요 여부: 로컬 미리보기 projection 생성은 D-51로 승인. 운영 DB·외부 게시·배포는 별도 승인 필요.
현재 상태: DONE (총괄 PM PASS, 후보 20곳·5분야, 공개 13필드 allowlist, 중복·비서울·금지 필드·민감값·문의·후기·비교 활성 0)
```

## FE-035

```text
작업 ID: FE-035
작업명: 미검수 후보 목록·상세·수정 제안 UI
담당 전문 에이전트: 디자인·프런트엔드
현재 문제: 현 목록은 후기·검수 정보가 있는 업체만 표시하고 상세 화면은 가격·후기·비교·견적 행동을 기본 가정해 미검수 후보를 안전하게 보여줄 수 없다.
사업적 목적: 사용자가 20곳의 기본 정보를 탐색하고 오류를 바로 제안하며 업체 담당자가 소유권을 신청할 수 있게 한다.
근거 문서: ADR-019, D-51, BE-031, R-122
선행 작업: BE-031 PASS
수정 허용 경로: data.js, venues.html, provider.html, claim.html, contact.html, scripts/pages/venues.js, scripts/pages/provider.js, scripts/pages/contact.js, scripts/core/provider-status.js, styles/pages/venues.css, styles/pages/provider.css, BE-031 공개 데이터 로드에 필요한 script 태그, ops/reports/FE-035-unverified-provider-ui.md, FE-035 관련 운영 문서
수정 금지 경로: 운영 DB·Supabase·migration·RLS, API·환경변수, 기존 원본 후보 JSON·XLSX, 공통 디자인 토큰·헤더 계약, package·lock, GitHub main·Netlify
공유 계약: `unverifiedCandidate=true`인 항목만 기존 검수 gate의 예외로 표시한다. 상태는 `정보 확인 전`, 확인일은 `NAVER API 관측일`로 표현하고 가격·전화·평점·후기·인기·추천·견적·비교를 표시하거나 활성화하지 않는다.
구현 범위: 목록 20곳 노출, 후보 전용 카드, 상세 최소 정보·출처·관측일·주의 안내, 수정 제안 contact prefill, 소유권 신청 연결, 명시적 noindex, 모바일 접근성
구현하지 않을 범위: 실제 수정 자동 반영, 업체 검증, DB 저장, 전화·가격·후기·평점·추천·견적·비교 기능, 외부 게시·배포
완료 조건: 20곳 모두 목록·상세 접근 가능, 각 화면에 `정보 확인 전`·출처·관측일·수정 제안·소유권 신청 표시, 금지 정보·행동 0, 수정 제안 폼 업체 ID/이름 자동 입력, 390/768/1440px 가로 넘침 0
검증 방법: 자동 DOM 계약 검사와 로컬 HTTP 브라우저에서 목록·상세·수정 제안·소유권 흐름을 확인한다.
실행할 테스트: node scripts/tests/unverified-provider-projection.mjs, npm test, npm run build, 브라우저 390/768/1440px
위험요소: 상태 문구가 약하면 검증 완료로 오인하거나 외부 출처 링크를 공식 홈페이지로 오해할 수 있음
롤백 방법: 후보 script 로드와 data.js 병합·후보 전용 UI 분기를 제거해 기존 빈 공개 목록으로 복원한다.
사용자 승인 필요 여부: 로컬 미리보기 구현은 D-51로 승인. 운영 DB·GitHub main·Netlify 공개는 별도 승인 필요.
현재 상태: DONE (총괄 PM PASS, 후보 20곳 목록·상세·수정 제안·소유권 연결, 390/768/1440 overflow·console 오류 0, 금지 정보·기능 노출 0, build·dist PASS)
```

## QA-050

```text
작업 ID: QA-050
작업명: 미검수 후보 20곳 공개 안전 게이트
담당 전문 에이전트: 품질·보안
현재 문제: 미검수 후보의 단계 공개는 기존 검수 완료 공개보다 오정보·업체 피해·검색 노출 위험이 크다.
사업적 목적: 운영 공개 전 최소 정보·정정 경로·검색 차단이 실제 화면과 산출물에서 강제되는지 독립 검수한다.
근거 문서: ADR-019, D-51, R-122, BE-031, FE-035
선행 작업: BE-031·FE-035 구현 완료
수정 허용 경로: scripts/tests/unverified-provider-public-safety.mjs, ops/reports/QA-050-unverified-provider-safety.md, QA-050 관련 운영 문서
수정 금지 경로: 모든 제품 HTML·CSS·JS·데이터, 운영 DB·Supabase·migration·API·환경변수·package·lock, GitHub·Netlify
공유 계약: 제품 문제를 직접 수정하지 않고 REVISION_REQUIRED로 반환한다. 전화·가격·좌표·블로그 콘텐츠·평점·후기·추천·견적·비교 노출은 한 건이라도 실패다.
구현 범위: 20곳 스키마, 목록·상세·수정 제안·소유권, noindex, 접근성, 모바일, 빌드 산출물, 기존 핵심 회귀를 읽기 전용으로 검사한다.
구현하지 않을 범위: 제품 수정, 실제 폼 제출, 로그인·개인정보 입력, 운영 DB·외부 게시·배포
완료 조건: 후보 20, 필수 표시 누락 0, 금지 필드·문구·행동 0, 정정·소유권 링크 오류 0, noindex 누락 0, console·깨진 asset·가로 overflow 0, npm test/build PASS
검증 방법: 정적 계약 검사와 로컬 HTTP Playwright 390/768/1440px 읽기 전용 회귀
실행할 테스트: node scripts/tests/unverified-provider-public-safety.mjs, npm test, npm run build, npm run test:dist, 브라우저 smoke
위험요소: 기존 공통 상세 코드가 숨겨진 상태에서도 후기나 문의 데이터를 비동기로 불러올 수 있음
롤백 방법: 검수 전 제품 변경 없음. 실패 시 FE-035를 REVISION_REQUIRED로 돌리고 외부 공개를 금지한다.
사용자 승인 필요 여부: 읽기 전용 로컬 검수 불필요. 외부 게시·배포는 별도 승인 필요.
현재 상태: DONE (총괄 PM PASS, 후보 20곳·13필드 allowlist·5분야, 금지 정보·민감값·문의·후기·비교 활성 0, 정정·소유권·noindex·390/768/1440 회귀 PASS)
```

## OPS-036

```text
작업 ID: OPS-036
작업명: 후보 20곳 격리 noindex 온라인 미리보기
담당 전문 에이전트: 총괄 PM·품질
현재 문제: 후보 20곳의 안전 미리보기는 로컬에서만 확인 가능해 사용자가 온라인 화면을 직접 검토할 주소가 없다.
사업적 목적: 운영 사이트와 DB에 영향을 주지 않고 사용자 피드백을 받을 수 있는 고유 온라인 검수 화면을 제공한다.
근거 문서: D-51, D-52, BE-031, FE-035, QA-050, R-122
선행 작업: BE-031·FE-035·QA-050 DONE, D-52 승인
수정 허용 경로: dist/** 재생성, ops/reports/OPS-036-unverified-candidates-online-draft.md, OPS-036 관련 운영 문서, 기존 승인된 draft 업로드 스크립트의 비밀값 없는 실행
수정 금지 경로: 제품 원본 코드, 운영 DB·Supabase·migration·RLS·API 데이터, GitHub main·PR·최종 병합, Netlify production alias, 정식 도메인·색인, 실제 문의·소유권 폼 제출
공유 계약: BE-031·FE-035·QA-050 통과 파일과 전역 `noindex,nofollow` 헤더만 배포한다. 고유 deploy draft URL을 사용하고 production URL을 변경하지 않는다.
구현 범위: 검증된 현재 산출물을 새 dist로 빌드하고 고유 Netlify draft에 업로드한 뒤 목록·상세·정정·소유권·asset·noindex·3개 viewport를 읽기 전용으로 재검수한다.
구현하지 않을 범위: 운영 DB 적재, 실제 폼 제출, 로그인, main push, production 배포, 정식 도메인 연결·검색 색인, 업체 연락
완료 조건: 고유 HTTPS draft 1개, 후보 20곳, 정정·소유권 링크 각 20개, 금지 정보·기능 0, X-Robots-Tag noindex, 핵심 asset 200, 390/768/1440 overflow·console 오류 0, production deploy ID·URL 불변
검증 방법: 업로드 전 build·dist·QA-050 재실행, 업로드 후 HTTP header/asset smoke와 읽기 전용 브라우저 회귀
실행할 테스트: node scripts/tests/unverified-provider-public-safety.mjs, npm run build, npm run test:dist, ops/http-preview-smoke.mjs 또는 동등한 HTTP 검사, 브라우저 390/768/1440
위험요소: 고유 draft도 외부 접근 가능한 URL이며 잘못 공유되면 미검수 후보가 확정 정보처럼 전달될 수 있음
롤백 방법: draft를 공유 중단하고 필요 시 Netlify에서 해당 deploy를 삭제한다. main·production·DB는 변경하지 않아 코드 롤백이 없다.
사용자 승인 필요 여부: 필요. D-52 명시 승인 후에만 외부 draft 업로드 실행.
현재 상태: DONE (총괄 PM PASS, 고유 noindex draft `6a7d58e2955d753e991f76b4`, 후보·수정·소유권 각 20, HTTP·390/768/1440 회귀 PASS, main·production·운영 DB 불변)
```
