# 파일 소유권

이 표는 실제 존재하는 경로만 사용한다. 작업별 카드가 더 좁은 범위를 지정하면 카드가 우선한다.

| 실제 경로 | 기본 담당 | 통제 |
| --- | --- | --- |
| `AGENTS.md` | 총괄 PM | PM 단일 소유 |
| `.codex/config.toml`, `.codex/agents/**` | 총괄 PM | 오케스트레이션 설정, PM 단일 소유; 제품 작업 중 임의 수정 금지 |
| `ops/PROJECT_BOARD.md`, `ops/ACTIVE_WORK.md`, `ops/BACKLOG.md`, `ops/FILE_OWNERSHIP.md`, `ops/DEPENDENCIES.md`, `ops/APPROVALS.md`, `ops/RISKS.md`, `ops/CHANGE_REQUESTS.md`, `ops/RELEASE_CHECKLIST.md`, `ops/AUTOMATIONS.md`, `ops/TASK_SPECS.md`, `ops/handoffs/**` | 총괄 PM | PM 단일 소유 |
| `ops/PM_ORCHESTRATION.md`, `ops/PM_START_PROMPT.md` | 총괄 PM | 실행 루프와 시작 명령, PM 단일 소유 |
| `ops/reports/**` | 총괄 PM | 작업 카드에 지정된 단일 결과 파일만 전문 작업에 위임 |
| `docs/00_프로젝트현황.md`, `docs/10_개발로드맵.md`, `docs/12_통합실행계획.md`, `docs/99_의사결정기록.md` | 총괄 PM | PM 단일 소유 |
| `docs/01_사업정의.md`, `docs/03_서비스기능명세.md`, `docs/04_사용자흐름.md`, `docs/07_사업모델.md` | 사업·서비스 기획 | 카드 지정+PM 검수 |
| `docs/05_업체데이터구조.md`, `docs/11_크롤링및데이터관리.md` | 백엔드·데이터 | 운영·법무 영향 시 PM 승인 |
| `docs/06_관리자페이지기획.md`, `docs/08_마케팅전략.md`, `docs/09_운영정책.md`, `ADMIN-OPERATING-GUIDE.md` | 마케팅·운영 | 외부 실행은 승인 필요 |
| 루트 공개·회원 `*.html`, 해당 루트 `*.js`, `admin/**` | 디자인·프런트엔드 | 카드에서 개별 파일 지정 |
| `scripts/pages/**`, `scripts/components/**`, `styles/pages/**`, `styles/components/**`, `assets/**` | 디자인·프런트엔드 | 공통 계약 제외 |
| `admin-schema.sql`, `migrations/**`, 데이터 원천 `review-*.js`, `data.js`, `blog-data.js`, `community-*-data.js` | 백엔드·데이터 | 운영 적용·대량 변경 승인 필요 |
| `scripts/core/api.js`, `scripts/core/auth.js`, `scripts/core/config.js`, `content-runtime.js` | 백엔드·데이터 | 공통 API/인증 계약, 단일 작업 소유 |
| `backend/**` | 백엔드·데이터 | Git 무시 로컬 격리 영역, 실행 전 별도 승인 |
| `scripts/tests/**`, `_verify/**` | 품질·보안 | CHG-A 정본 결정 전 신규 수정 금지 |
| `package.json`, `pnpm-lock.yaml`, `netlify.toml`, `.github/**`, `_headers`, `_redirects`, `styles/tokens.css`, `styles/base.css`, `styles/layout.css`, `scripts/core/brand.js`, `scripts/core/storage.js`, `scripts/core/event-types.js`, `scripts/core/regions.js`, `scripts/core/service-scope.js` | 총괄 PM이 지정한 통합 작업 | 공통 파일, 동시 수정 금지 |
| `dist/**`, `.netlify/**`, `node_modules/**` | 빌드 산출물 | 직접 수정 금지 |

## 완료 작업 결과 파일

- QA-002: `ops/reports/QA-002-data-quality-baseline.md`만 수정 가능
- MKT-001: `ops/reports/MKT-001-seo-content-gap.md`만 수정 가능
- QA-004: `ops/reports/QA-004-baseline-document-consistency.md`만 수정 가능
- MKT-002: `ops/reports/MKT-002-content-quality-audit.md`만 수정 가능
- OPS-002: `ops/reports/OPS-002-public-claims-audit.md`만 수정 가능
- OPS-005: `ops/reports/OPS-005-public-copy-spec.md`만 수정 가능
- QA-007: `ops/reports/QA-007-external-review-compliance.md`만 수정 가능
- QA-008: `ops/reports/QA-008-home-action-route-readiness.md`만 수정 가능
- MKT-007: `ops/reports/MKT-007-home-content-mapping.md`만 수정 가능
- QA-010: `ops/reports/QA-010-naver-dependency-inventory.md`만 수정 가능
- BIZ-002: `ops/reports/BIZ-002-no-naver-business-strategy.md`만 수정 가능
- BE-005: `ops/reports/BE-005-public-data-verification-architecture.md`만 수정 가능
- MKT-009: `ops/reports/MKT-009-provider-acquisition-operations.md`만 수정 가능
- BIZ-003: `ops/reports/BIZ-003-comparison-trust-policy.md`만 수정 가능
- QA-011: `ops/reports/QA-011-public-data-source-license-register.md`만 수정 가능
- OPS-008: `ops/reports/OPS-008-provider-verification-sop.md`만 수정 가능
- BIZ-004: `ops/reports/BIZ-004-trust-label-decision-packet.md`만 수정 가능
- QA-013: `ops/reports/QA-013-privacy-evidence-decision-packet.md`만 수정 가능
- MKT-011: `ops/reports/MKT-011-seoul-dol-provider-pilot-approval-packet.md`만 수정 가능
- QA-014: `ops/reports/QA-014-outreach-contact-suppression-decision-packet.md`만 수정 가능
- OPS-011: `ops/reports/PM-2026-07-22-d23-d25-user-review.md`만 수정 가능
- QA-015: `ops/reports/QA-015-d24-current-standard-alignment.md`만 수정 가능

위 파일은 검수 통과한 `DONE` 산출물이다. 후속 작업은 수정하지 않고 읽기만 한다.

## 다음 제품 작업 소유권

- OPS-009는 `scripts/build/prepare-dist.mjs`, 지정 9개 HTML, `data.js`, `scripts/pages/home.js`, `scripts/pages/venues.js`의 카드에 적힌 최소 구간을 단일 소유한다. CHG-B 중 `provider.html`의 파생 script 4개와 `scripts/pages/venues.js`의 전체 0건 안내만 carve-out하며 기존 변경을 되돌리지 않는다.
- 루트 7개 `review-*.js`, `backend/data`, 로컬 DB·수집기·원본은 OPS-009도 수정·이동·삭제하지 않는다.
- FE-009는 OPS-009 완료·검수 뒤 `index.html`, `styles/pages/home.css`, `scripts/pages/home.js`만 단일 소유한다.
- 두 작업은 같은 홈 파일을 공유하므로 동시에 실행하지 않는다.
- FE-012는 FE-011 완료 뒤 `scripts/core/event-types.js`, `scripts/core/search-context.js`, `scripts/core/checklist-templates.js`, 홈·계산기·체크리스트 전용 파일과 지정 폼의 행사 선택 항목만 단일 소유한다. `venues.html`은 선택 옵션만 수정하며 CHG-B의 `scripts/pages/venues.js`·`provider.html`·`scripts/pages/provider.js`·`styles/components/filter.css`는 수정하지 않는다.
- FE-012 중 제품 파일 쓰기는 frontend-design 한 작업만 수행하고, 품질 검수는 구현 완료 후 읽기 전용으로 실행한다.
