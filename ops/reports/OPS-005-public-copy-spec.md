# OPS-005 — 공개 유료·3단계 기능 문구 정정 명세

## 1. 작업 개요

- 작업 ID: OPS-005
- 담당 전문 에이전트: marketing-operations
- 근거: docs/99_의사결정기록.md ADR-011, ops/TASK_SPECS.md OPS-005, ops/reports/OPS-002-public-claims-audit.md
- 적용 대상: partners.html, claim.html, vendor-dashboard.html
- 이 작업의 변경 파일: ops/reports/OPS-005-public-copy-spec.md
- 제품 HTML·JS·CSS 변경: 없음

## 2. 확정 원칙

ADR-011에 따라 다음을 변경 불가능한 계약으로 사용한다.

1. 현재 제공 범위는 업체 등록, 업체 소유권 확인, 업체 정보 수정, 견적 문의, 업체 응답까지다.
2. 예약, 결제, 에스크로, 정산, 결제자 후기는 현재 제공하지 않으며 향후 검토 범위다.
3. Premium 월 39,000원, 중개 수수료 10~15%, 검색 상단, 광고 제거, 상담 버튼 혜택은 공개 화면에서 숨긴다.
4. 새 가격, 수수료, 유료 상품명이나 혜택을 만들지 않는다.
5. 기존 URL, 입점 문의, 소유권 요청, 정보 수정, 견적 문의·응답 흐름은 유지한다.

## 3. 공통 구현 규칙

- 아래 “교체 후 정확한 마크업”은 FE-005에서 해당 현재 줄 전체를 대체하는 정본이다.
- 문구만 바꾸고 섹션 클래스, 폼, 링크와 JS가 참조하는 필수 ID는 유지한다.
- 향후 기능은 “현재 제공하지 않음”과 “향후 검토”를 같은 문맥에서 명시한다.
- 예약 마감 조건이나 예약 가능일을 실시간 재고·예약 확정 기능처럼 표현하지 않는다.
- 무료 정보 수정은 유지하되 요금제 비교나 유료 전환 문맥으로 만들지 않는다.

## 4. partners.html 교체 명세

### 4.1 기능 카드 3개

대상: partners.html:47-49

삭제 대상:

- 실시간 예약 마감 캘린더
- 에스크로·분할 정산
- 행사일 익일 정산 검토
- 중개 수수료 10~15% 가정
- 실제 결제자 후기
- 예약·결제 인증 표시

교체 후 정확한 마크업:

    <section class="partner-feature-grid">
      <article><span>01</span><h2>업체 정보 관리</h2><p>승인된 업체 담당자가 업체명·지역·주소 등 기본 정보와 가격·이용 조건을 최신 상태로 관리합니다.</p><ul><li>업체명·지역·주소 등 기본 정보 수정</li><li>가격·이용 조건 수정</li><li>문의 가능 시간 관리</li></ul></article>
      <article><span>02</span><h2>견적 문의와 응답</h2><p>고객이 보낸 행사 조건을 확인하고 가능 여부와 예상 금액을 답변하는 범위까지 제공합니다.</p><ul><li>행사·지역·인원·예산 확인</li><li>진행 가능 여부 응답</li><li>예상 금액·포함 항목 안내</li></ul></article>
      <article><span>03</span><h2>향후 검토 범위</h2><p>예약·결제·에스크로·정산과 결제자 후기는 현재 제공하지 않으며 운영·법률 검토 후 별도 단계에서 검토합니다.</p><ul><li>현재 예약·결제 기능 없음</li><li>현재 에스크로·자동 정산 기능 없음</li><li>현재 결제자 인증 후기 기능 없음</li></ul></article>
    </section>

판정:

- 01은 업체 정보 수정 범위를 유지한다.
- 02는 ADR-011의 현재 전환 종점인 견적 문의·응답을 명시한다.
- 03은 미구현 기능을 삭제하지 않고 현재 미제공·향후 검토로 정확히 구분한다.

### 4.2 업체 소유권 흐름

대상: partners.html:52-55

조치: 유지.

유지 이유:

- 업체 소유권 요청, 사업자 확인, 해당 업체 전용 편집 권한은 현재 제공 범위에 포함된다.
- 기존 partner-claim-flow 클래스, 순서, 문구와 링크 구조를 바꾸지 않는다.

### 4.3 가격·Premium 섹션

대상: partners.html:57-61

삭제 대상:

- 파트너 요금제 기획
- 더 잘 보이는 기능은 선택
- 일반 광고 영역 유지
- Premium
- 월 39,000원 예정
- 검색 상단 스폰서 영역
- 고해상도 사진·홍보 영상 확대
- 경쟁 업체·제휴 광고 제거
- 카카오톡 상담 버튼 제공 예정
- Premium 상담 문의

교체 후 정확한 마크업:

    <section class="partner-pricing">
      <div class="partner-pricing-heading"><p class="eyebrow">업체 정보 관리</p><h2>기본 정보 수정과<br>견적 문의 응답을 지원합니다.</h2></div>
      <article><span>기본 제공</span><strong>정보 수정 무료</strong><p>승인된 업체 담당자가 기본 정보를 직접 관리합니다.</p><ul><li>업체명·지역·주소 등 기본 정보 수정</li><li>가격·이용 조건 수정</li><li>최종 갱신일 표시</li><li>견적 문의 확인·응답</li></ul><a class="button button-quiet" href="contact.html">무료 입점 문의</a></article>
      <article><span>향후 검토</span><strong>추가 상품은 현재 제공하지 않습니다.</strong><p>운영 범위와 이용 조건은 검토 후 별도로 안내합니다.</p></article>
    </section>

유지 요소:

- partner-pricing 클래스
- 무료 정보 수정 원칙
- contact.html 무료 입점 문의 링크

### 4.4 단계별 적용

대상: partners.html:63-67

삭제 대상:

- 2단계 견적 문의와 예약 가능일 관리
- 3단계 에스크로 결제·자동 정산·검증 후기

교체 후 정확한 마크업:

    <section class="partner-roadmap">
      <p class="eyebrow">현재 제공 범위</p><h2>정보 확인과 견적 문의부터 제공합니다.</h2>
      <ol><li><b>현재</b><span>업체 페이지 무료 소유권 확인과 정보 수정</span></li><li><b>현재</b><span>견적 문의 확인과 업체 응답</span></li><li><b>향후 검토</b><span>예약·결제·에스크로·정산·결제자 후기</span></li></ol>
      <a class="button button-primary" href="index.html">소비자 화면으로 돌아가기</a>
    </section>

유지 요소:

- partner-roadmap 클래스
- index.html 복귀 링크
- 업체 소유권·정보 수정 흐름

## 5. claim.html 교체 명세

### 5.1 권한 및 광고 안내

대상: claim.html:69-78

삭제 대상:

- 권한 및 광고 안내
- Basic 요금제 표현
- Premium 광고 안내받기
- 월 39,000원 예정
- 검색 상단 노출
- 광고 제거
- 상담 버튼
- 광고 상품 별도 신청

중요 호환 조건:

- claim.js는 #claim-ad-interest를 직접 조회한다.
- FE-005는 JS 수정 권한이 없으므로 이 ID를 삭제하면 소유권 요청 제출이 깨진다.
- 공개 문구와 체크박스는 숨기되 ID와 기본 false 상태는 유지한다.

교체 후 정확한 마크업:

    <fieldset class="claim-plan-section claim-rights-section">
      <legend><span>04</span> 권한 안내</legend>
      <article class="claim-free-rights">
        <span>수정 권한</span>
        <b>무료 수정 권한</b>
        <small>업체 기본 정보·가격·이용 조건을 직접 수정할 수 있습니다.</small>
      </article>
      <input id="claim-ad-interest" type="checkbox" hidden aria-hidden="true" tabindex="-1">
      <p class="claim-plan-note">이 화면은 업체 정보 수정 권한 검수 요청만 접수합니다.</p>
    </fieldset>

### 5.2 승인 후 가능한 일

대상: claim.html:85-89

현재 “주차·반입·예약 마감 조건 갱신”은 실시간 예약 기능으로 오인될 수 있으므로 정보 관리 표현으로 좁힌다.

교체 후 정확한 마크업:

    <aside class="claim-side">
      <span class="mini-label">승인 후 가능한 일</span>
      <ul><li>메뉴 가격과 보증 인원 수정</li><li>업체명·지역·주소 등 기본 정보 관리</li><li>문의 가능 시간과 이용 조건 갱신</li><li>수정자와 최종 갱신일 표시</li></ul>
      <div class="claim-security"><strong>권한 원칙</strong><p>한 계정은 승인받은 업체만 수정할 수 있으며, 관리자 승인 전에는 편집 화면에 접근할 수 없습니다.</p></div>
    </aside>

### 5.3 접수 완료 문구

대상: claim.html:92-95

삭제 대상:

- 광고 안내 신청 여부는 승인에 영향을 주지 않습니다.

교체 후 정확한 마크업:

    <section class="claim-result" id="claim-result" hidden>
      <span>✓</span><h2>검수 요청이 접수되었습니다.</h2><p>담당자 확인 후 승인되면 내 계정에 ‘내 업체 관리’ 메뉴가 표시됩니다. 이 요청은 업체 정보 수정 권한 검수를 위한 절차입니다.</p>
      <div><a class="button button-primary" href="account.html">내 계정으로</a><a class="button button-quiet" href="venues.html">업체 목록으로</a></div>
    </section>

유지 요소:

- claim-form과 제출 버튼
- #claim-ad-interest 호환 ID
- 사업자 확인 자료, 검수 동의, 권한 요청 흐름
- account.html과 venues.html 링크

## 6. vendor-dashboard.html 교체 명세

대상: vendor-dashboard.html:49-54

삭제 대상:

- 현재 요금제
- 검색 결과 스폰서 영역
- 고해상도 사진·영상 확대
- 경쟁 광고 제거
- 카카오톡 상담 버튼
- Premium 상담 신청
- 월 39,000원 예정

중요 호환 조건:

- vendor-dashboard.js는 #vendor-plan-name, #vendor-plan-copy, #premium-interest를 직접 조회하고 이벤트를 연결한다.
- FE-005는 JS 수정 권한이 없으므로 세 ID를 삭제하면 레거시 편집 흐름이 깨진다.
- 세 요소를 hidden 처리해 기존 JS 참조는 보존하고 사용자에게는 노출하지 않는다.
- 정적 대체 문구에는 새 요금제·가격·혜택을 추가하지 않는다.

교체 후 정확한 마크업:

    <aside class="vendor-plan-card">
      <span>업체 정보 관리</span>
      <strong id="vendor-plan-name" hidden aria-hidden="true">Basic</strong>
      <p id="vendor-plan-copy" hidden aria-hidden="true">기본 정보 수정 기능을 이용 중입니다.</p>
      <strong>기본 정보 수정</strong>
      <p>승인된 담당자는 업체의 가격과 이용 조건을 관리할 수 있습니다.</p>
      <button class="button button-ink" id="premium-interest" type="button" hidden aria-hidden="true" tabindex="-1">추가 기능 관심</button>
      <small>유료 상품은 현재 제공하지 않습니다.</small>
    </aside>

유지 요소:

- vendor-plan-card 클래스
- #vendor-plan-name, #vendor-plan-copy, #premium-interest 호환 ID
- 업체 가격·이용 조건 수정 안내
- 레거시 편집 폼과 승인 상태 흐름

## 7. 유지해야 할 기존 흐름

| 흐름 | 반드시 유지할 요소 |
| --- | --- |
| 입점 문의 | partners.html의 contact.html 링크와 무료 입점 문의 |
| 업체 소유권 | partners.html의 partner-claim-flow, claim.html의 검수 폼 |
| 무료 정보 수정 | 무료 수정 권한, 담당자 확인, 해당 업체만 편집 |
| 견적 문의·응답 | partners.html에서 현재 제공 범위로 명시 |
| claim 제출 | #claim-ad-interest ID를 hidden 상태로 유지해 claim.js 오류 방지 |
| 레거시 대시보드 | #vendor-plan-name, #vendor-plan-copy, #premium-interest를 hidden 상태로 유지해 vendor-dashboard.js 오류 방지 |
| URL·라우팅 | partners.html, claim.html, vendor-dashboard.html 및 기존 href를 삭제·변경하지 않음 |

## 8. 금지 표현

세 HTML의 사용자 노출 문구에 다음 표현을 사용하지 않는다.

- 월 39,000원 또는 다른 Premium 가격
- 중개 수수료 10~15% 또는 다른 수수료율
- 검색 상단 스폰서·상단 노출
- 경쟁 광고·제휴 광고 제거
- 카카오톡 상담 버튼 또는 유료 상담 혜택
- Premium 상담·Premium 광고 신청
- 실시간 예약 마감 캘린더
- 예약 확정·예약 가능일을 현재 기능으로 단정하는 표현
- 에스크로·분할 정산·자동 정산·익일 정산을 현재 기능으로 단정하는 표현
- 실제 결제자 후기·예약 결제 인증을 현재 기능으로 단정하는 표현

향후 기능 명칭은 partners.html의 “현재 제공하지 않음·향후 검토” 문맥에서만 허용한다.

## 9. FE-005 정적 검증 조건

### 9.1 금지 가격·혜택·과거 문구 0건

다음 명령은 출력이 없어야 한다.

    rg -n '39,000|10~15%|실시간 예약 마감 캘린더|에스크로·분할 정산|행사일 익일 정산|실제 결제자 후기|예약·결제 인증 표시|검색 상단 스폰서 영역|검색 상단 노출|경쟁 업체·제휴 광고 제거|카카오톡 상담 버튼|Premium 상담|Premium 광고|업체 연락처·가격·사진|연락처·영업 정보 수정|최신 사진과 영업 정보 관리' partners.html claim.html vendor-dashboard.html

### 9.2 현재 제공 범위와 향후 검토 문구 존재

다음 명령은 각 핵심 문구를 찾아야 한다.

    rg -n '업체 정보 관리|업체명·지역·주소 등 기본 정보 수정|가격·이용 조건 수정|견적 문의와 응답|현재 제공 범위|견적 문의 확인과 업체 응답|향후 검토 범위|현재 제공하지 않으며|추가 상품은 현재 제공하지 않습니다' partners.html

### 9.3 무료 소유권·정보 수정 흐름 존재

다음 명령은 모두 일치해야 한다.

    rg -n '업체 소유권 확인|수정 권한 요청|정보 확인|대시보드 승인|정보 수정 무료|무료 입점 문의' partners.html
    rg -n '무료 수정 권한|업체 기본 정보·가격·이용 조건을 직접 수정|무료 수정 권한 검수 요청|업체 정보 수정 권한 검수 요청만 접수|claim-form' claim.html

### 9.4 JS 호환 ID 보존과 비노출

다음 명령은 모두 일치해야 한다.

    rg -n 'id="claim-ad-interest"[^>]*hidden' claim.html
    rg -n 'id="vendor-plan-name"[^>]*hidden|id="vendor-plan-copy"[^>]*hidden|id="premium-interest"[^>]*hidden' vendor-dashboard.html

예상 일치 수:

- claim-ad-interest: 1
- vendor-plan-name: 1
- vendor-plan-copy: 1
- premium-interest: 1

### 9.5 미래 기능의 현재 제공 오인 방지

다음 명령은 partners.html의 향후 검토 카드와 로드맵에서만 일치해야 하며, 각 일치 줄에 “현재 제공하지”, “기능 없음” 또는 “향후 검토”가 함께 있어야 한다.

    rg -n '예약·결제|에스크로|정산|결제자 후기' partners.html

FE-005 완료 보고에는 이 명령의 전체 출력을 첨부한다.

### 9.6 변경 범위

FE-005 diff에는 다음 세 파일만 있어야 한다.

- partners.html
- claim.html
- vendor-dashboard.html

JS, CSS, 라우팅, API, DB, 환경변수, 패키지 파일 변경이 하나라도 있으면 범위 위반이다.

## 10. 완료 조건 점검

| 완료 조건 | 결과 |
| --- | --- |
| 세 HTML의 줄 단위 삭제·대체 대상 | 충족 |
| 정확한 대체 문구와 마크업 | 충족 |
| 현재 제공·향후 검토 분리 | 충족 |
| 기존 입점·소유권·정보 수정·문의·응답 흐름 보존 | 충족 |
| JS 호환 ID 보존 지시 | 충족 |
| 금지 표현 목록 | 충족 |
| FE-005 rg 검증 조건 | 충족 |
| 가격·기능 신규 결정 없음 | 충족 |
| 제품 HTML 직접 수정 없음 | 충족 |

## 11. 남은 문제

- claim.js와 vendor-dashboard.js에는 과거 Premium 관련 처리 문자열이 남지만 FE-005 수정 금지 경로다. 이번 명세는 필수 DOM ID를 hidden 처리해 공개 노출과 런타임 오류를 함께 막는다.
- 레거시 vendor-dashboard.html은 리디렉션 대상이지만 소스 수준 공개 문구도 ADR-011에 맞추도록 명세했다.
- 실제 운영 E2E, 유료 상품 재검토, 예약·결제 구현은 OPS-005와 FE-005 범위 밖이다.

## 12. PM 완료 보고

    작업 ID: OPS-005
    작업 결과: ADR-011에 따라 partners.html, claim.html, vendor-dashboard.html의 미승인 가격·혜택과 미구현 기능 문구를 줄 단위로 삭제·대체하는 정본 명세를 작성했다.
    수정한 파일: 없음
    추가한 파일: ops/reports/OPS-005-public-copy-spec.md
    삭제한 파일: 없음
    완료 조건: 충족
    재현 검사: 세 HTML의 현재 줄과 OPS-002 매트릭스를 rg로 교차 대조했고 FE-005용 금지·필수·호환 ID 검증식을 작성했다.
    남은 문제: JS 내부의 과거 Premium 처리 문자열은 FE-005 범위 밖이며, 명세는 참조 ID를 hidden으로 유지해 공개 노출과 흐름 손상을 방지한다.
    FE-005 실행 가능 여부: 가능. 본 명세를 정본으로 사용하고 지정된 세 HTML 외 파일을 수정하지 않아야 한다.
    병합 권고: 총괄 PM 검수 PASS 후 보고서 병합 권고.
