# 손품해방 전면 개편 결과

## 1. 작업 범위

- 사용자 노출 브랜드를 `손품해방 / SONPUM HAEBANG`으로 통일했습니다.
- 서비스 범위를 서울 돌잔치 중심에서 전국 모든 가족행사로 확장했습니다.
- 홈페이지·업체 목록·상세·비용 계산·체크리스트·견적 문의·입점 안내·관리자 업체 입력을 같은 행사 분류와 디자인 기준으로 정리했습니다.
- 기존 Supabase 표·RPC의 `taran_*` 이름은 데이터 연결을 끊지 않기 위해 내부 식별자로 유지했습니다. 이는 사용자 화면에 노출되지 않습니다.

## 2. 공식 식별자

- 한글명: 손품해방
- 영문명: SONPUM HAEBANG
- 공개 슬러그: `sonpum-haebang`
- 공개 스토리지 접두사: `sonpum-haebang-`
- 기존 백엔드 사이트 ID: `taran` 유지

`scripts/core/storage.js`는 `taran`, `memoa`, `nopoom` 접두사의 기존 브라우저 저장값을 새 키가 비어 있을 때만 한 번 복사합니다. 이전 키는 즉시 삭제하지 않아 복구 가능성을 남기고, 마이그레이션 완료 표식으로 중복 복사를 막습니다.

## 3. 행사 분류

모든 주요 입력 화면은 다음 8개 코드를 공유합니다.

1. `kids` — 돌잔치·백일
2. `parents` — 환갑·칠순·팔순
3. `meeting` — 상견례
4. `smallWedding` — 스몰웨딩
5. `familyGathering` — 가족모임
6. `anniversary` — 기념일·생신
7. `memorial` — 추모 가족행사
8. `other` — 기타 가족행사

기존 `home`은 가족모임으로 안전하게 바꾸고, `wedding`은 상견례와 스몰웨딩 근거가 분명할 때만 분리합니다. 애매한 자료는 임의로 확정하지 않습니다.

## 4. 공개 화면

- 홈페이지: 전국 검색, 행사 바로가기, 정보 확인 기준, 서울 돌잔치 추천, 조건·지역 탐색, 최근 확인 업체, 비교, 계산기·체크리스트, 이용 방법, 준비 가이드, 입점 안내 순으로 구성했습니다.
- 업체 목록: 행사·지역·인원·예산·날짜·정렬을 한 필터에 통합하고, 선택 조건 칩·모바일 필터·스켈레톤·빈 결과·오류·더 보기 상태를 제공합니다.
- 검색 정렬: 추천순, 조건 일치순, 최근 확인순, 가격순, 최소 보증 인원순, 수용 인원순, 응답 빠른순만 제공합니다. 후기·평점 순은 제거했습니다.
- 업체 카드: 이미지, 업체명, 지역, 행사·서비스, 최대 인원, 최소 보증 인원, 가격, 주차, 정보 확인일을 우선 표시합니다. 실제 사진이 없으면 유형별 이미지와 `업체 사진 준비 중` 안내를 사용합니다.
- 업체 상세: 기본 정보와 대표 이미지, 핵심 조건, 가격·상품, 시설, 포트폴리오, 내부 후기·외부 후기, 정책, 위치, 문의 순으로 배치했습니다.
- 비용 계산: 행사별 질문과 비용 항목을 다르게 적용하고 로그인 없이 계산할 수 있습니다. 저장할 때만 로그인을 요청합니다.
- 체크리스트: 행사별 독립 상태, 직접 추가 항목, 메모, 비로그인 로컬 저장, 로그인 시 Supabase 병합을 지원합니다.
- 업체 입점: 검색 노출용 안내 페이지와 검색 차단된 실제 등록 폼을 분리했습니다.

## 5. 관리자와 파트너

- 업체 등록·수정 시 행사 코드를 직접 입력하지 않고 8개 체크박스로 선택합니다.
- 파트너 편집·견적 문의도 같은 값을 사용합니다.
- 공개 준비가 되지 않은 기능은 버튼만 남겨두지 않고 데이터·권한이 연결됐을 때만 보이도록 유지했습니다.
- 업체별 행사 조건은 `event_profiles`에 구조화해 저장할 수 있도록 005 마이그레이션을 추가했습니다.

## 6. 생성·수정한 핵심 파일

### 새 파일

- `scripts/core/service-scope.js`
- `scripts/core/display-defaults.js`
- `scripts/core/event-types.js`
- `scripts/core/regions.js`
- `scripts/core/provider-placeholder.js`
- `scripts/core/search-context.js`
- `provider-join.html`
- `scripts/pages/provider-join.js`
- `styles/pages/provider-join.css`
- `assets/images/placeholders/*.webp` 12개
- `migrations/005_sonpum_brand_and_event_types.sql`
- `scripts/tests/sonpum-redesign.mjs`

### 주요 수정

- `index.html`, `venues.html`, `provider.html`, `calculator.html`, `checklist.html`
- `inquiry.html`, `partner.html`, `provider-register.html`
- `scripts/pages/home.js`, `venues.js`, `provider.js`, `calculator.js`, `checklist.js`
- `scripts/pages/admin/common.js`, `scripts/pages/admin/providers.js`
- `styles/tokens.css` 및 페이지별 스타일

## 7. 데이터 마이그레이션

기존 Supabase 프로젝트에서는 아래 파일을 SQL Editor에서 직접 실행합니다.

`migrations/005_sonpum_brand_and_event_types.sql`

이 파일은 기존 데이터를 삭제하지 않습니다. 행사별 조건 열과 검수 표를 추가하고, 명확한 기존 `wedding` 자료만 분류합니다. 실행 전후 업체 건수를 비교하는 것을 권장합니다.

## 8. 보안과 접근성

- 일반 텍스트는 DOM `textContent`로 렌더링하고 외부 URL은 허용 프로토콜을 확인하는 기존 보안 규칙을 유지했습니다.
- Supabase `service_role` 키는 프론트엔드·GitHub에 포함하지 않습니다.
- 포커스 표시, 키보드 조작, 모션 감소, 44px 터치 영역, 모바일 필터와 하단 내비게이션을 유지했습니다.
- 업체 등록 폼은 `noindex`, 입점 안내 랜딩은 검색 노출 상태입니다.

## 9. 검사 방법

- `pnpm test`: 소스·보안·마켓플레이스·손품해방 개편 검사
- `pnpm build`: Netlify 공개 폴더 생성
- `pnpm test:dist`: 배포 폴더 링크·비공개 파일 제외 검사

## 10. 남은 외부 작업

코드 작업과 별도로 운영자가 해야 하는 일은 한 가지입니다.

- Supabase SQL Editor에서 `migrations/005_sonpum_brand_and_event_types.sql` 실행

실제 이메일·문자 발송처럼 외부 유료 서비스가 필요한 기능은 비밀키를 브라우저에 넣지 않고 Edge Function 또는 별도 서버로 연결해야 합니다.
