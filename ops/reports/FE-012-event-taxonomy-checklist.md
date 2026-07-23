# FE-012 행사 분류 5종 통합과 실용형 체크리스트 개편 결과

- 판정: `PASS` / `DONE`
- 검수일: 2026-07-23
- 수정 반복: 2회
- 온라인 draft: `https://6a61a2981e9fc538d795f061--taran-family-event-test.netlify.app/`
- Netlify deploy ID: `6a61a2981e9fc538d795f061`
- GitHub 분리 브랜치: `agent/approved-marketplace-checklist-update`
- GitHub main·Netlify production: 변경하지 않음

## 구현 결과

- 공개 행사 분류를 돌잔치·백일, 환갑·칠순·팔순, 결혼 준비, 기념일·생신, 기타 가족행사 5개로 통합했다.
- 기존 `smallWedding`은 `meeting`, `familyGathering`·`memorial`·`home`은 `other`로 자동 연결한다.
- 홈, 계산기, 체크리스트, 업체 목록, 견적 문의, 업체 등록과 지정 폼의 표시 분류를 5개로 일치시켰다.
- 체크리스트 왼쪽 입력은 행사 종류 하나만 남기고 날짜는 본문의 선택 항목으로 이동했다.
- 5개 행사 모두 4단계와 12개 이상 세부 할 일을 제공하며, 각 할 일에는 이유·확인 포인트·권장 시점·관련 기능 연결이 있다.
- 결혼 준비와 기타 가족행사의 세부 유형별 할 일은 선택 배지로 구분한다.

## 기존 저장 호환

- `meeting+smallWedding`, `other+familyGathering+memorial+home`의 완료 항목·복수 메모·사용자 추가 항목을 대표키에 즉시 병합한다.
- 레거시 저장 키는 삭제하거나 덮어쓰지 않는다.
- 여러 레거시 메모는 원래 행사 라벨을 붙여 함께 표시한다.
- 초기화의 최신 빈 메모 tombstone을 존중해 레거시 메모가 다시 나타나지 않는다.

## 수정 범위

제품 파일은 FE-012 카드가 허용한 다음 17개만 수정했다.

- 공통 표시·검색·체크리스트 계약: `scripts/core/event-types.js`, `scripts/core/search-context.js`, `scripts/core/checklist-templates.js`
- 홈: `index.html`, `styles/pages/home.css`, `scripts/pages/home.js`
- 계산기: `calculator.html`, `scripts/pages/calculator.js`
- 체크리스트: `checklist.html`, `styles/pages/checklist.css`, `scripts/pages/checklist.js`
- 지정 폼·목록: `venues.html`, `inquiry.html`, `scripts/pages/inquiry.js`, `provider-register.html`, `partner.html`, `claim.html`

API·DB·RLS·마이그레이션·환경변수·패키지·잠금 파일·업체 데이터·후기 원천과 CHG-A~C는 수정하지 않았다.

## 독립 검수 결과

- 변경 JavaScript 7개 문법 검사: PASS
- `validate.mjs`: PASS — JavaScript 82개, HTML 40개, 보안 규칙
- 빌드·`validate-dist.mjs`: PASS — HTML 40개
- 5개 템플릿: 각 4단계, 할 일 12·12·12·12·13개
- Chrome 390×844·768×1024·1440×1000: 핵심 6화면 root overflow 0, H1 각 1개, 콘솔·페이지 오류 0
- 레거시 URL 4종: 대표 분류 선택 PASS
- 체크리스트 병합·대표키 기록·레거시 키 보존·초기화·새로고침: PASS
- 온라인 draft: 홈·체크리스트 HTTP 200, `X-Robots-Tag: noindex`

## 별도 테스트 부채

- `sonpum-redesign.mjs`는 과거 8개 행사 분류를 기대해 실패한다. 제품 회귀가 아니라 CHG-A 테스트 정본 부채이며 QA-017 후보로 등록했다.
- `marketplace-flow.mjs`의 홈 정보 나눔 1건은 기존 QA-016 known failure다.
- 두 테스트 파일은 이번 작업에서 수정하지 않았다.
