# 백로그

아래는 실행 카드가 아니라 후보 목록이다. `TASK_SPECS.md` 형식의 전체 카드와 단일 소유 경로가 작성되기 전에는 시작하지 않는다.

| 후보 ID | 작업명 | 영역 | 상태 | READY 전 조건 | 현재 저장소의 대상 후보 |
| --- | --- | --- | --- | --- | --- |
| FE-002 | 검색 공개 게이트 최소 수정 | 디자인·프런트엔드 | SUPERSEDED | ADR-016으로 기존 후기 게이트 전제 폐기 | FE-008의 검수 projection·신뢰 표시 범위로 재작성 |
| QA-003 | 스테이징 Auth/RLS/RPC/Storage E2E | 품질·보안 | BLOCKED | 스테이징·역할 계정·적용 이력 | 등록·소유권·업체 수정·문의·응답 흐름 포함; `scripts/tests/**` 또는 `_verify/**` 중 정본 결정 후 지정 |
| OPS-001 | 운영 공개 기준 정리 | 마케팅·운영 | APPROVAL_REQUIRED | D-06~D-07, 운영 인력 정보 | `docs/09_운영정책.md`, `ADMIN-OPERATING-GUIDE.md` |
| BE-001 | 업체 데이터 API 페이징 | 백엔드·데이터 | BACKLOG | 정적/운영 우선순위·API 계약 | `data.js`, `content-runtime.js`, `scripts/core/api.js`, 페이지 로더 |
| BE-002 | 승인 대상 변경 감지 자동화 | 백엔드·데이터 | BLOCKED | ADR-008·법무·robots·약관 | 격리된 `backend/**` 검토 후 재지정 |
| FE-003 | 게스트→회원 찜 상태 동기화 | 디자인·프런트엔드 | BACKLOG | 저장 키·병합 정책 | `scripts/pages/venues.js`, `scripts/pages/provider.js`, `scripts/core/auth.js` |
| QA-004 | 기준 문서 수치·정의 일관성 감사 | 품질·보안 | DONE | 없음 | 결과 파일 `ops/reports/QA-004-baseline-document-consistency.md` |
| MKT-002 | 기존 준비백과 콘텐츠 품질·통합 감사 | 마케팅·운영 | DONE | 없음 | 결과 파일 `ops/reports/MKT-002-content-quality-audit.md` |
| OPS-002 | 공개 사업·기능 약속 문구 감사 | 마케팅·운영 | DONE | 없음 | 결과 파일 `ops/reports/OPS-002-public-claims-audit.md` |
| MKT-005 | 준비백과 남은 draft 22개 주제별 편집 | 마케팅·운영 | BACKLOG | MKT-008, 주제별 공식 근거·검토일 기준 | `blog-data.js`의 draft를 소규모 묶음으로 편집; 한 번에 전체 공개 금지 |
| MKT-006 | 계약 글 중복 경로·대표 URL 통합 | 마케팅·운영 | BACKLOG | MKT-008, D-10 대표 URL 정책 | `article-contract-questions.html`과 `article.html?slug=contract-questions` 중 대표 경로·canonical·리디렉션 지정 후 범위 확정 |
| OPS-005 | 공개 유료·3단계 기능 문구 정정 명세 | 마케팅·운영 | DONE | 없음 | `ops/reports/OPS-005-public-copy-spec.md` |
| FE-004 | 일반·개인정보 문의 접수 경로 최소 구현 | 디자인·프런트엔드 | DONE | 없음 | `contact.html`, `contact-success.html` |
| FE-005 | 미확정 유료·예약·결제 공개 문구 최소 수정 | 디자인·프런트엔드 | DONE | 없음 | `partners.html`, `claim.html`, `vendor-dashboard.html` |
| OPS-006 | GitHub main·Netlify 테스트 배포 | 총괄 PM | DONE | 없음 | 커밋 `b837ea9`, Netlify 반영 확인 |
| QA-006 | Netlify 공개 화면 다중 뷰포트 검수 | 품질·보안 | BLOCKED | OPS-007 적용·재배포 | `ops/reports/QA-006-netlify-public-smoke.md` |
| OPS-007 | vendor-dashboard 강제 리디렉션 핫픽스 | 디자인·프런트엔드/총괄 PM | APPROVAL_REQUIRED | D-13 | `netlify.toml` |
| FE-006 | 행동 중심 정보·공동 편집 홈페이지 개편 | 디자인·프런트엔드 | SUPERSEDED | 초기 안전 홈은 FE-009로 재구성 | 디자인 보고서는 FE-009 기준으로 보존 |
| MKT-003 | 서울 돌잔치 자체 콘텐츠 후속 편집 | 마케팅·운영 | BACKLOG | MKT-008, BIZ-003, 주제별 공식 근거 | 준비 순서·예산 항목·계약 질문·주차/인원 비교법을 소규모 묶음으로 편집 |
| BE-003 | 지역·업종·8개 행사 capability 정규화 설계 | 백엔드·데이터 | BACKLOG | BIZ-003, 기존 005 매핑 검토 | 공공 업종은 후보만 생성하고 업체 제출·관리자 확인 단계를 분리 |
| OPS-003 | 공식 출처·확인일 보강 큐 설계 | 마케팅·운영/백엔드·데이터 | SUPERSEDED | QA-011·BE-005로 재구성 | source registry와 field assertion 계약으로 대체 |
| OPS-004 | 이미지 출처·권리 검증 운영 설계 | 마케팅·운영/백엔드·데이터 | BACKLOG | 이미지 권리 기준·보유 정책 | `assets/**`, 업체 데이터 모델 읽기 후 범위 지정 |
| MKT-004 | URL·색인·canonical 정보 구조 설계 | 마케팅·운영/디자인·프런트엔드 | APPROVAL_REQUIRED | D-06, D-10, D-11 | `sitemap.xml`, `robots.txt`, 공개 HTML·라우팅 읽기 후 범위 지정 |
| BIZ-001 | 초기 정보 플랫폼 공개 라벨·정렬·공동 편집 정책 명세 | 사업·서비스 기획 | SUPERSEDED | ADR-016·BIZ-002가 NAVER 비의존 전략으로 대체 | 실행하지 않음; 역사 카드 보존 |
| QA-007 | 외부 후기 수집·공개 준수 기준선 감사 | 품질·보안 | DONE | 없음 | `ops/reports/QA-007-external-review-compliance.md` |
| QA-008 | 홈페이지 행동 경로 준비 상태 감사 | 품질·디자인 | DONE | D-14 승인 | `ops/reports/QA-008-home-action-route-readiness.md` |
| MKT-007 | 홈 준비백과·커뮤니티 콘텐츠 매핑 감사 | 마케팅·운영 | DONE | D-14 승인, MKT-002 | `ops/reports/MKT-007-home-content-mapping.md` |
| BE-004 | 출처 계층·수정 제안·업체 권한 데이터 계약 설계 | 백엔드·데이터 | SUPERSEDED | BE-005가 공공데이터·업체 검증 구조로 통합 | 후속 상세 계약은 BE-006 신규 카드로 분리 |
| OPS-008 | 업체 소유권·직접 입력·관리자 검수·이의 처리 SOP | 마케팅·운영 | DONE | PM·독립 reviewer PASS | `ops/reports/OPS-008-provider-verification-sop.md` |
| FE-007 | 운영팀 시작 질문 기반 커뮤니티 초기 화면 | 디자인·프런트엔드 | DONE | 없음 | 커뮤니티 전용 HTML·JS·preview 데이터 5개 |
| OPS-009 | NAVER 파생 공개 경로 가역적 격리 | 백엔드·통합 | DONE | 구현·PM 로컬 검수 PASS | 7개 파생 파일·9개 HTML·최소 소비 경로 격리; 로컬 원본/DB 해시 불변 |
| QA-009 | NAVER 업체·후기 정보 이용 기준 상세 재검토 | 품질·보안 | DONE | 없음 | `ops/reports/QA-009-naver-information-legal-review.md` |
| MKT-008 | 준비백과 공개 품질 개선·노출 통제 | 마케팅·운영 | DONE | 없음 | `blog-data.js`, `blog.js`, 전용 보고서 |
| QA-010 | NAVER 의존성 전수 감사·대체 분류 | 품질·보안 | DONE | 없음 | `ops/reports/QA-010-naver-dependency-inventory.md` |
| BIZ-002 | NAVER 비의존 초기 사업·서비스 전략 | 사업·서비스 기획 | DONE | 없음 | `ops/reports/BIZ-002-no-naver-business-strategy.md` |
| BE-005 | 공공데이터·업체 검증·자동 갱신 구조 | 백엔드·데이터 | DONE | 없음 | `ops/reports/BE-005-public-data-verification-architecture.md` |
| MKT-009 | 서울 돌잔치 업체 확보·콘텐츠 운영 전략 | 마케팅·운영 | DONE | 없음 | `ops/reports/MKT-009-provider-acquisition-operations.md` |
| BIZ-003 | 서울 돌잔치 비교 필드·행사 분류·신뢰 라벨 정책 | 사업·서비스 기획 | DONE | PM·독립 reviewer PASS | `ops/reports/BIZ-003-comparison-trust-policy.md` |
| QA-011 | 서울 돌잔치 공공데이터 원천·이용허락 후보 레지스트리 | 품질·보안 | DONE | PM·독립 reviewer PASS | `ops/reports/QA-011-public-data-source-license-register.md` |
| BE-006 | 공공데이터 source·field assertion·public projection 상세 계약 | 백엔드·데이터 | BLOCKED | QA-011·BIZ-003·OPS-008 DONE, D-23~D-25 | 보고서→스키마 delta→staging 순서; 운영 DB 변경 별도 승인 |
| FE-008 | 후보·검수 업체 분리와 신뢰·최근성 표시 | 디자인·프런트엔드 | BLOCKED | D-22, BIZ-003, BE-006, CHG-B 정리 | 홈·목록·상세·비교·문의 공통 계약; 파일 범위 추후 지정 |
| FE-009 | 베이지 C안 홈 안전 축소 구현 | 디자인·프런트엔드 | DONE | PM 브라우저 검수 PASS | 홈 3개 파일; 업체/후기/가격/참여 기능은 숨김, draft만 생성 |
| FE-011 | 승인된 최종 홈·준비 도구·비교 화면 구현 | 디자인·프런트엔드 | DONE | PM·독립 QA PASS | 12개 전용 파일, draft `6a619622202cedff2ed28f92`, production·GitHub 미반영 |
| QA-012 | NAVER 비의존 공개 번들·흐름 회귀 검증 | 품질·보안 | BLOCKED | OPS-009·FE-008 구현, CHG-A 테스트 정본 | 공개 NAVER URL/파생 파일 0, 빈/대체 상태, 역할·문의 회귀 |
| QA-016 | 승인된 정보 나눔 홈 링크와 marketplace 검사 정합화 | 품질·보안 | BLOCKED | CHG-A 테스트 정본 소유권 확정 | `scripts/tests/marketplace-flow.mjs`의 홈 예외를 명시하고 나머지 핵심 흐름 금지는 유지 |
| QA-017 | 5개 행사 분류·레거시 alias 자동검사 정합화 | 품질·보안 | BLOCKED | CHG-A 테스트 정본 소유권 확정 | `scripts/tests/sonpum-redesign.mjs`의 8개 분류 기대를 5개 대표 분류, smallWedding→meeting, familyGathering·memorial·home→other 회귀로 교체 |
| FE-010 | 공통 모바일 메뉴 상태명·홈 CTA 정합성 | 디자인·프런트엔드/품질 | BACKLOG | `scripts/components/header.js` 단일 소유권, 모바일 비교함 노출 정책 확인 | 열린 메뉴의 접근성 이름을 `메뉴 닫기`로 갱신하고 홈 하단 `비교함` 노출을 승인된 안전 CTA와 대조 |
| MKT-010 | 서울 돌잔치 업체 온보딩 제한 파일럿 | 마케팅·운영 | APPROVAL_REQUIRED | OPS-008, D-23~D-26·D-29, 제품 E2E | 실제 외부 연락·온보딩은 사용자 승인 후 별도 실행 |
| OPS-010 | NAVER 비의존 기준 문서 00~12 현행화 | 총괄 PM/문서 | BACKLOG | BIZ-003·QA-011·OPS-008 PM PASS | `docs/00_프로젝트현황.md`~`docs/12_통합실행계획.md`; 역사 보고서 보존 |
| BIZ-004 | 공개 신뢰 라벨·최근성 D-25 결정안 | 사업·서비스 기획 | DONE | PM·독립 reviewer PASS | `ops/reports/BIZ-004-trust-label-decision-packet.md` |
| QA-013 | 사업자·소유권·사진/후기 증빙 D-24 개인정보 결정안 | 품질·보안 | DONE | 역사 보고서; 최신 정본은 QA-015 PASS 보완안 | `ops/reports/QA-013-privacy-evidence-decision-packet.md` |
| MKT-011 | 서울 돌잔치 업체 제한 파일럿 D-26 승인안 | 마케팅·운영 | DONE | 2차 수정 후 PM·독립 reviewer PASS | `ops/reports/MKT-011-seoul-dol-provider-pilot-approval-packet.md` |
| QA-014 | 외부 영업 연락 데이터·수신거부 D-29 결정안 | 품질·보안 | DONE | 총괄 PM·독립 reviewer PASS | `ops/reports/QA-014-outreach-contact-suppression-decision-packet.md` |
| OPS-011 | D-23~D-25 추천안 사용자 결정 통합 검토 | 총괄 PM/운영 | DONE | 분야별 읽기 전용 검토 완료 | `ops/reports/PM-2026-07-22-d23-d25-user-review.md` |
| QA-015 | D-24 현행 안전조치 기준 정합성 보완 | 품질·보안 | DONE | 총괄 PM·독립 reviewer PASS, D-24 승인 완료 | `ops/reports/QA-015-d24-current-standard-alignment.md` |

예약·결제·유료 노출·추천·대규모 수집은 문의·응답 실증 전 후보 상태를 유지한다.
