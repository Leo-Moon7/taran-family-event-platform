# 작업 의존성과 충돌

## 전체 선후관계

```text
BE-014(DONE) → BE-015(DONE) → FE-019(DONE) → FE-020(DONE) → BE-020(DONE) → FE-021(REVISION_REQUIRED) → QA-035(REVISION_REQUIRED)
QA-035 → FE-022(DONE) + BE-021(DONE) → BE-022(DONE) → FE-023(DONE) → QA-036(REVISION_REQUIRED)
QA-036 → BE-023(DONE) → FE-024(DONE) → QA-037(DONE, revision 1 PASS) → QA-038(DONE) → BE-024(DONE) → FE-025(DONE) + FE-026(DONE) → QA-039(DONE) → D-42 → BE-025(BLOCKED_AFTER_REVISION_2) → D-43 → BE-026(DONE, revision 1 PASS) → D-44(APPROVED) → QA-040(DONE, PASS) → QA-003(DONE, PASS)
QA-003(PASS) → OPS-024(DONE, `e8510ca`) / BE-019(DONE, `b969191` + `97a5dfb`, 원격 별도 브랜치) → QA-041(DONE, SQL PASS) → QA-042(DONE, 실제 Auth/JWT/MFA·`b84d307`) → BE-027(DONE, `8e7eb81`)
QA-002 데이터 품질 기준선(DONE) ─> QA-004 문서 일관성 감사(DONE) ─> CHG-C 소유권 정리 ─> PM 기준 문서 현행화
QA-002 데이터 품질 기준선(DONE) ─> D-01~D-03 결정 ─> FE-002 검색 공개 게이트
MKT-001 SEO·콘텐츠 공백(DONE) ─> MKT-002 기존 콘텐츠 품질 감사(DONE) ─> MKT-008 공개 글 6개·draft 22개(DONE) ─> MKT-005 남은 draft 순차 편집 / MKT-006 계약 중복 경로 ─> D-10 대표 URL 결정
MKT-001 SEO·콘텐츠 공백(DONE) ─> OPS-002 공개 약속 문구 감사(DONE) ─> D-04·D-09 승인(DONE) ─> OPS-005 문구 명세 ─> FE-005 공개 문구 수정
D-06·D-07 임시 폼 승인 ─> FE-004 일반·개인정보 문의 접수 경로
FE-004 + FE-005 + 로컬 테스트 ─> OPS-006 GitHub main·Netlify 배포(DONE) ─> D-13(APPROVED) ─> OPS-007 강제 리디렉션(DONE) ─> D-30 main·production 반영(DONE) ─> QA-006 production 재검수(DONE)
ADR-014 정보·공동 편집 방향 ─> QA-007 외부 후기 준수 감사(DONE) + D-15~D-19 ─> BIZ-001 공개 정책 ─> BE-004 데이터 계약 / OPS-008 검수 절차 ─> 실제 수정 경로 확인 ─> FE-006 홈페이지 구현 ─> 공개 전 브라우저 검수
ADR-015 C안 승인 ─> QA-007 + QA-008 + MKT-007(DONE) ─> D-15~D-19/BIZ-001 ─> FE-006 구현
QA-007(DONE) ─> QA-009 재검토(DONE) ─> D-18 ─> OPS-009 공개 번들 격리 ─> 공개 번들·빈 상태 QA ─> 별도 허락·계약 확인 전 재포함 금지
MKT-007(DONE) + D-19 ─> FE-007 운영팀 시작 질문(DONE) ─> 실제 published 커뮤니티 우선 표시 ─> 홈 카드 연결
MKT-002·MKT-007(DONE) + D-20 ─> MKT-008 공개 글 6개·draft 22개(DONE) ─> 배포 승인 ─> 공개 화면 QA
QA-008(DONE) ─> BIZ-001 ─> BE-004 / OPS-008 ─> 차단 행동별 FE 구현 ─> QA-003 역할·RLS E2E ─> FE-006 CTA 공개
MKT-001 SEO·콘텐츠 공백(DONE) ─> D-06·D-10·D-11 ─> URL·색인·canonical 설계
D-06~D-07 운영 기준 + 스테이징 접근 ─> QA-003 역할·문의 E2E
QA-002 + 운영 데이터 계약 ─> BE-001 API 페이징
ADR-008 + 대상별 법무 검토 ─> BE-002 변경 감지 자동화
CHG-A 정리 ─> 패키지/브라우저 테스트 변경
CHG-B 정리 ─> FE-002 및 `scripts/pages/venues.js` 변경
오케스트레이션 설정 문법 검증 ─> QA-005 읽기 전용 시험 ─> 새 루트 대화에서 PM 시작
```

ADR-016 이후의 현재 선후관계가 위 과거 NAVER 중심 흐름보다 우선한다.

2026-08-18 고객형 업체 7곳 확대 선후관계:

```text
BE-035·FE-041·QA-054·OPS-040(DONE)
  -> 공식 근거 감사(005·007만 통과)
  -> BE-036(DONE, profiles 7·분야4/3·가격2/문의5)
     + FE-042(DONE, 목록 정적·런타임 7/4/3)
  -> QA-055(DONE, 신규 P0/P1 0·환경 제한은 JS 95개 개별 검사로 대체)
  -> OPS-041(noindex 고유 draft)
  -> 사용자 확인
  -> GitHub main·Netlify production·운영 DB는 별도 승인
```

BE-036과 FE-042는 파일이 겹치지 않아 병렬 실행했다. QA-055와 OPS-041은 각각 앞 단계 결과를 소비하므로 순차 실행한다. NVR-DOL-006·010·011은 최신 공식 근거 부족 또는 공식 도메인 오류로 고객형 profile에 포함하지 않는다.

2026-08-14 고객형 업체 화면 선후관계:

```text
BIZ-010(DONE) + BE-033(DONE) + FE-038(DONE)
  -> BE-034(DONE, customer_ready 5·공식 가격 2·전화/공식 채널 5)
  -> FE-039(DONE, 고객형 목록·상세)
  -> QA-052(DONE, 안전·접근성 PASS)
  -> OPS-038(DONE, 고유 noindex 온라인 draft)
  -> 사용자 시각 확인
  -> 별도 승인 후 GitHub main·Netlify production 검토
```

고객형 화면은 BE-030의 20곳 전체나 기존 후보 projection을 직접 소비하지 않는다. BE-034의 5곳만 사용하며, 공식 근거가 없는 가격·출장 지역·예약 가능일·업체 사진은 후속 확인 전 필터와 화면에 추가하지 않는다.

```text
QA-010 NAVER 의존성 감사(DONE) + BIZ-002 비의존 전략(DONE) + BE-005 검증 구조(DONE) + MKT-009 확보 운영(DONE)
  ├─> QA-011 공공데이터 원천·허락 레지스트리(DONE) ─> D-23(APPROVED) ─> BE-006 source/assertion/projection 상세 계약
  ├─> BIZ-003 행사 분류·비교 필드·신뢰 라벨(DONE) ─> BIZ-004(DONE) ─> D-25(APPROVED) ─> BE-006 / FE-008
  └─> OPS-008 소유권·직접 입력·검수 SOP(DONE) ─> QA-013·MKT-011(DONE) ─> QA-015(DONE) ─> D-24·D-26
       └─> QA-014 외부 영업 연락 데이터·수신거부 결정안(DONE) ─> D-29(APPROVED) ─> 법률·기술 E2E·D-26 ─> MKT-010

D-22 ─> OPS-009 NAVER 공개 경로 격리(DONE) ─> QA-012 공개 번들 회귀 ─> 별도 테스트 재배포 승인
OPS-009 홈 격리 완료 ─> FE-009 베이지 C안 안전 축소 구현(DONE) ─> 로컬·외부 draft 미리보기 완료 ─> 사용자 시각 확인 ─> 최종 배포 별도 승인
FE-009(DONE) + 사용자 최종 디자인 전체 승인 ─> FE-011 홈·계산기·체크리스트·비교 구현 ─> 로컬 다중 뷰포트 QA ─> 고유 draft 미리보기 ─> 사용자 확인 ─> 최종 배포 별도 승인
FE-012(DONE) + 사용자 최신 이미지 기준 구현 지시 ─> FE-013 공통 디자인·주요 8개 화면 구현(DONE) ─> 고유 draft 사용자 시각 확인 ─> QA-018 전체 공개 화면 회귀 ─> GitHub 반영·production 별도 승인
FE-013(DONE) + 사용자 2026-07-24 시각·기능·신뢰 수정 요청 ─> FE-014 단일 쓰기 구현(DONE) ─> 독립 QA 1차 보완 후 PASS ─> 고유 noindex draft `6a62af9bb40288afb67fd7eb` ─> 사용자 시각 확인 ─> GitHub·production 각각 별도 승인
FE-014(DONE) ─> QA-018 공개·비로그인 전체 기능 점검(DONE) ─> D-13(APPROVED) ─> OPS-007 강제 리디렉션(DONE, draft PASS) ─> D-30 production 별도 승인
QA-018(DONE) ─> D-31(APPROVED) ─> OPS-023(DONE) ─> QA-020(DONE) ─> QA-003(REVISION_REQUIRED_AFTER_FIX_1) ─> BE-014(DONE) ─> BE-015 ─> QA-003 수정 2차
QA-018(DONE) ─> FE-015 체크리스트 제목 / FE-016 업체 등록 메뉴 목적지 후보. 두 작업은 공통 헤더 변경 여부를 확인한 뒤 순차 실행
QA-018(DONE) ─> FE-010(`scripts/components/header.js`) + FE-015(`scripts/pages/checklist.js`) + FE-016(`login.html`), 직접 파일·API·DB·라우팅·패키지 공유 없음으로 병렬 가능
BIZ-003 + QA-011 + OPS-008 + BIZ-004 + QA-015 ─> D-32 운영자 선등록형 방향 승인 ─> BIZ-005 출시·수익 준비 모델 ─> BE 공개 projection/운영 등록 도구/정정 흐름/QA 출시 게이트
BIZ-005(DONE) ─> BE-006(DONE) ─> BE-007 격리 로컬 seed 도구(DONE) ─> QA-019 배치 안전 게이트(DONE) ─> D-33·활용신청(DONE) ─> D-34 전국·다분야 확대 ─> BIZ-007 + QA-022 + BE-008(DONE) ─> BE-009 source registry + OPS-016 검수 용량(DONE) ─> QA-023 synthetic gate(DONE) ─> BE-013 `15154916` 공식 terms/schema 증거(DONE) ─> BE-028 승인 키 canary·후보 대조(DONE)

`15154916` 일반음식점 API는 BE-028에서 승인 키·공식 스키마·키 비저장 조건으로 실제 대조를 완료했다. 이 완료를 숙박·미용·제과 등 다른 데이터셋 승인으로 확대 해석하지 않는다.

QA-031은 QA-023 파일과 겹치므로 다른 registry gate 변경과 병렬 실행하지 않는다. OPS-018(DONE)은 exact 9-file 경계를 확정했고 OPS-019(DONE)은 `.gitignore` 단일 소유로 로컬 경계를 구현했다. D-36 승인 뒤 OPS-021이 승인 10개만 원격 별도 브랜치에 보존했으며 PR·main·배포는 하지 않았다.
NAVER 실행선은 ADR-018로 종료했다: QA-027·BIZ-008·BE-011·QA-030을 실행하지 않으며 신규 API 호출·크롤링·저장·AI 분석·보조 신호·공개 projection을 만들지 않는다.
기존 NAVER 로컬 자료는 재사용 선이 아니라 삭제 완료 선이다: D-27 ─> QA-026 metadata-only inventory(PASS) ─> 전용 파일 19개와 혼합 DB `review_sources` 28,879행 삭제 ─> 잔존 0·DB 무결성 확인. 보존한 수집 코드는 실행하지 않고 레코드 재처리·상품화·신규 adapter 입력도 하지 않는다.
BE-006 ─> additive 스키마 delta ─> staging migration/RLS ─> 검수 projection/API ─> FE-008 ─> QA-003/QA-012
BIZ-003 + QA-011 + OPS-008 PM PASS ─> OPS-010 docs/00~12 기준 문서 현행화
D-29 승인 완료 + 나머지 제품·개인정보·외부 연락 게이트(D-23~D-26, 법률 확인, 역할/문의 E2E) 통과 ─> MKT-010 서울 돌잔치 제한 파일럿 ─> 품질·문의·운영 기준 ─> 다음 지역×행사 1개
문의·응답 실증과 별도 승인 ─> 유료 가치 실험 ─> 예약·결제·에스크로·정산은 후속
```

## 완료 작업 충돌 검수

| 비교 항목 | QA-002 | MKT-001 | 겹침/판정 |
| --- | --- | --- | --- |
| 수정 경로 | `ops/reports/QA-002-data-quality-baseline.md` | `ops/reports/MKT-001-seo-content-gap.md` | 파일 분리, 안전 |
| 예상 변경 파일 | 위 1개 | 위 1개 | 없음 |
| 공통 컴포넌트 | 수정 없음 | 수정 없음 | 없음 |
| API | 호출·변경 없음 | 호출·변경 없음 | 없음 |
| 데이터베이스 | 접근·변경 없음 | 접근·변경 없음 | 없음 |
| 라우팅 | 읽기만 함 | 공개 경로 읽기만 함 | 변경 없음 |
| 디자인 토큰 | 없음 | 없음 | 없음 |
| 환경변수 | 없음 | 없음 | 없음 |
| 패키지·잠금 파일 | 없음 | 없음 | 없음 |
| 사용자 흐름 | 업체 데이터 공개 품질을 분석 | 검색 유입용 정보 공백을 분석 | 산출 목적 분리 |

결론: 두 작업은 지정된 서로 다른 보고서 1개씩만 추가했고 공유 계약을 변경하지 않았다. 중복은 공개 기준·SEO 선행 조건을 서로 보강한 수준이며 결론 충돌은 없다.

## 다음 실행 작업 충돌 최종 검사

| 비교 항목 | QA-004 | MKT-002 | OPS-002 | 판정 |
| --- | --- | --- | --- | --- |
| 수정 경로 | `ops/reports/QA-004-baseline-document-consistency.md` | `ops/reports/MKT-002-content-quality-audit.md` | `ops/reports/OPS-002-public-claims-audit.md` | 파일 분리 |
| 예상 변경 파일 | 위 1개 | 위 1개 | 위 1개 | 없음 |
| 공통 컴포넌트 | 수정 없음 | 수정 없음 | 수정 없음 | 없음 |
| API | 변경 없음 | 변경 없음 | 변경 없음 | 없음 |
| 데이터베이스 | 접근·변경 없음 | 접근·변경 없음 | 접근·변경 없음 | 없음 |
| 라우팅 | 문서의 경로 주장만 검토 | 중복 콘텐츠 경로 읽기 | 공개 경로 읽기 | 변경 없음 |
| 디자인 토큰 | 없음 | 없음 | 없음 | 없음 |
| 환경변수 | 없음 | 없음 | 없음 | 없음 |
| 패키지·잠금 파일 | 없음 | 없음 | 없음 | CHG-A 비접촉 |
| 사용자 흐름 | 기준 수치 의사결정 | 정보성 콘텐츠 품질 | 업체 입점·신뢰 약속 | 분석 대상 분리 |

결론: 세 작업은 별도 브랜치/Worktree에서 병렬 실행 가능하다. 모두 읽기 전용 감사이며 정확한 결과 파일 외 수정은 금지한다.

## 병행 금지

- FE-002와 CHG-B 또는 FE-003: `scripts/pages/venues.js`와 검색·찜 흐름이 겹친다.
- QA 브라우저 체계 변경과 다른 패키지 변경: `package.json`, `pnpm-lock.yaml`이 겹친다.
- BE-001과 FE-002: 공개 데이터 계약과 목록 로딩을 동시에 바꾼다.
- 스키마 변경과 QA-003: 마이그레이션 기준을 먼저 고정해야 한다.
- 실제 SEO 변경과 D-06: 도메인·운영 주체 결정이 선행한다.
- 수집 자동화와 ADR-008: 법무·robots·약관 검토가 선행한다.
- OPS-007과 다른 Netlify 라우팅·헤더 변경: `netlify.toml` 공통 설정이 겹치므로 병행하지 않는다.
- FE-006과 CHG-B는 직접 파일이 겹치지 않지만 하위 업체 화면의 시각 계약을 동시에 확장하지 않는다. FE-006은 홈 전용 3개 파일로 제한한다.
- FE-014는 FE-013의 동일 미커밋 파일을 이어 수정하므로 다른 쓰기 작업과 병렬 실행하지 않는다. frontend-design과 quality-security는 읽기 전용 진단·검수만 수행하고 제품 파일 쓰기는 총괄 PM 한 명이 맡는다.
- FE-014는 CHG-B의 `provider.html`, `scripts/pages/provider.js`, `scripts/pages/venues.js`, `styles/components/filter.css`를 수정하지 않는다. 따라서 후기 없는 신규 업체 공개 게이트와 0건 분기의 URL 직렬화는 별도 소유권 정리 후 수행한다.
- FE-014는 완료됐다. 다음 제품 코드 쓰기는 사용자 미리보기 확인과 새 작업 카드 전 시작하지 않는다. 공식 canonical·OG·대표 URL은 D-10, 실제 업체 접수·증빙·Supabase 권한 E2E는 별도 개인정보·운영 승인, production은 D-30이 선행한다.
- QA-018은 읽기 전용으로 완료됐다. OPS-007은 `netlify.toml`, FE-010·FE-016은 공통 헤더, FE-015는 체크리스트 전용 파일을 다루므로 동시에 시작하지 않고 D-13 출시 차단 항목을 먼저 처리한다.
- FE-006과 OPS-007은 파일이 겹치지 않지만 둘 다 재배포가 필요하므로 구현·검수는 분리하고 승인된 배포 묶음만 PM이 순서를 정한다.
- FE-006에서 `정보 수정 제안`, `업체 수정 권한 요청`을 노출하기 전에 실제 저장·검수·결과 안내 경로가 존재해야 한다. 링크가 없으면 임시 버튼을 만들지 않는다.
- BE-004는 데이터 계약 설계만 수행하며 운영 DB를 변경하지 않는다. 스키마 구현은 D-16~D-17과 RLS 검토 후 별도 작업으로 분리한다.
- FE-007과 OPS-009는 수정 파일이 겹치지 않지만, 둘 다 공개 결과를 바꾸므로 별도 Worktree에서 구현하고 배포는 승인된 순서로 통합한다.
- OPS-009와 OPS-007은 소스 파일이 다르지만 같은 Netlify 배포 검증을 사용하므로 동시에 배포하지 않는다.
- BIZ-001은 보고서 1개만 작성하므로 FE-007·OPS-009와 파일·API·DB·라우팅 계약이 겹치지 않는다.
- ADR-016 이후 BIZ-001·FE-002·BE-004의 기존 전제는 대체됐다. 새 구현은 BIZ-003·QA-011·OPS-008의 정책 결과와 BE-006 공통 계약을 먼저 고정한다.
- OPS-009는 7개 파생 파일, 9개 HTML, 홈·목록·상세·비교·문의·소유권·관리자 소비 경로를 함께 다루므로 다른 공개 데이터·홈·라우팅·빌드 작업과 병행하지 않는다.
- BE-006 이후 스키마, RLS, API, loader, 관리자 검수, 공개 화면은 같은 계약을 공유하므로 순차 실행한다.
- MKT-010 외부 연락은 D-29 승인만으로 시작하지 않는다. D-26·법률 확인·역할/문의 E2E 전 시작하지 않으며 문서 설계 작업과 실제 연락을 같은 카드에 넣지 않는다.

## 다음 준비 작업 충돌 검사

| 비교 항목 | BIZ-001 | FE-007 | OPS-009 | 판정 |
| --- | --- | --- | --- | --- |
| 수정 경로 | `ops/reports/BIZ-001-information-platform-policy.md` | `community.html`, `community-list.js`, `community-post.js` | `scripts/build/prepare-dist.mjs` | 직접 겹침 없음 |
| 예상 변경 파일 | 보고서 1개 | 제품 3개 | 빌드 스크립트 1개 | 분리 가능 |
| 공통 컴포넌트 | 없음 | 커뮤니티 전용 렌더러 | 배포 복사·HTML 후처리 | 없음 |
| API | 변경 없음 | 기존 조회만 유지 | 변경 없음 | 없음 |
| 데이터베이스 | 변경 없음 | 변경 없음 | 변경 없음 | 없음 |
| 라우팅 | 변경 없음 | 기존 URL 유지 | 원본 라우팅 유지 | 없음 |
| 디자인 토큰 | 없음 | 변경 금지 | 없음 | 없음 |
| 환경변수 | 없음 | 기존 구성 여부 읽기만 함 | 변경 없음 | 없음 |
| 패키지·잠금 파일 | 없음 | 변경 금지 | 변경 금지 | CHG-A 비접촉 |
| 사용자 흐름 | 공개·검수 정책 | 커뮤니티 빈 상태 | 업체 디렉터리 공개 데이터 격리 | 목적 분리 |

역사 판정: FE-007은 D-19 범위에서 완료됐고 BIZ-001은 ADR-016·BIZ-002로 대체됐다. OPS-009의 현재 게이트는 D-22와 정확한 파일 단일 소유권이며, 이후 생성되는 `dist`는 해당 작업에서 검증하고 별도 사용자 승인 뒤 배포한다.

## 2026-07-22 콘텐츠·준수 작업 충돌 검사

| 비교 항목 | QA-009 | MKT-008 | FE-007 | 판정 |
| --- | --- | --- | --- | --- |
| 수정 경로 | 전용 보고서 1개 | `blog-data.js`, `blog.js`, 전용 보고서 | 커뮤니티 전용 5개 파일 | 직접 겹침 없음 |
| API·DB | 변경 없음 | 변경 없음 | 기존 조회만 유지 | 계약 변경 없음 |
| 라우팅 | 읽기만 함 | 기존 article URL 유지 | 기존 community URL 유지 | 변경 없음 |
| 환경·패키지 | 변경 없음 | 변경 금지 | 변경 금지 | CHG-A 비접촉 |
| 사용자 흐름 | 업체 정보 기준 | 준비백과 열람 | 커뮤니티 열람·작성 | 목적 분리 |

판정: 세 작업은 파일과 공유 계약이 겹치지 않아 병렬 완료했다. MKT-008과 FE-007은 서로 다른 데이터·렌더러를 단일 소유했고, QA-009은 제품을 수정하지 않았다. PM 검수와 로컬 빌드·브라우저 검사 통과.

## NAVER 비의존 다음 준비 작업 충돌 검사

| 비교 항목 | BIZ-003 | QA-011 | OPS-008 | 판정 |
| --- | --- | --- | --- | --- |
| 수정 경로 | `ops/reports/BIZ-003-comparison-trust-policy.md` | `ops/reports/QA-011-public-data-source-license-register.md` | `ops/reports/OPS-008-provider-verification-sop.md` | 서로 다른 보고서 1개씩 |
| 예상 변경 파일 | 위 1개 | 위 1개 | 위 1개 | 직접 겹침 없음 |
| 공통 컴포넌트 | 수정 없음 | 수정 없음 | 수정 없음 | 없음 |
| API | 변경 없음 | 호출·활용신청 없음 | 변경 없음 | 없음 |
| 데이터베이스 | 변경 없음 | 접근·변경 없음 | 변경 없음 | 없음 |
| 라우팅 | 변경 없음 | 변경 없음 | 변경 없음 | 없음 |
| 디자인 토큰 | 변경 없음 | 변경 없음 | 변경 없음 | 없음 |
| 환경변수 | 변경 없음 | 키 사용 금지 | 변경 없음 | 없음 |
| 패키지·잠금 파일 | 변경 없음 | 변경 없음 | 변경 없음 | CHG-A 비접촉 |
| 사용자 흐름 | 비교·신뢰 정책 | 후보 원천·허락 | 업체 등록·검수 운영 | 각자 다른 계약을 제안하고 PM이 통합 |
| 사용자 승인 | 문서안 작성 불필요; 최종 문구 D-25 | 읽기 전용 조사 불필요; 실제 채택 D-23 | 내부 SOP안 불필요; 개인정보·외부 연락 D-24·D-26 | 현재 카드 실행은 승인 불필요 |

판정: 세 작업은 제품·API·DB·공통 설정을 바꾸지 않고 각자 전용 보고서만 작성하므로 독립 Worktree에서 최대 3개 병렬 실행 가능하다. 결과를 서로 직접 덮어쓰지 않으며, 총괄 PM이 세 결과를 검수·조정하기 전 BE-006·FE-008·MKT-010을 시작하지 않는다. 긴급 공개 격리인 OPS-009는 이 세 보고서와 독립적으로 D-22 승인과 정확한 파일 단일 소유권 확정 후에만 순차 실행할 수 있다.

완료 판정: BIZ-003·QA-011·OPS-008은 2026-07-22 총괄 PM과 독립 reviewer 검수에서 모두 `PASS`를 받아 `DONE` 처리했다. 제품·API·DB·외부 실행은 없었다.

## D-24~D-26 승인 준비 작업 충돌 검사

| 비교 항목 | BIZ-004 | QA-013 | MKT-011 | 판정 |
| --- | --- | --- | --- | --- |
| 수정 경로 | `ops/reports/BIZ-004-trust-label-decision-packet.md` | `ops/reports/QA-013-privacy-evidence-decision-packet.md` | `ops/reports/MKT-011-seoul-dol-provider-pilot-approval-packet.md` | 전용 보고서 1개씩 |
| 예상 변경 파일 | 위 1개 | 위 1개 | 위 1개 | 직접 겹침 없음 |
| 공통 컴포넌트 | 없음 | 없음 | 없음 | 수정 없음 |
| API·DB | 변경 없음 | 접근·변경 없음 | 변경 없음 | 없음 |
| 라우팅·디자인 토큰 | 변경 없음 | 변경 없음 | 변경 없음 | 없음 |
| 환경변수·패키지 | 변경 없음 | 비밀 접근·변경 없음 | 변경 없음 | CHG-A 비접촉 |
| 사용자 흐름 | 신뢰 라벨·최근성 결정안 | 개인정보·증빙 결정안 | 외부 파일럿 승인안 | 서로 다른 승인 축 |
| 공유 계약 | T5/T6와 6개 라벨 읽기 | 사업자·소유권 상태 분리 읽기 | 무료 등록·검수·문의 gate 읽기 | 선행 보고서를 읽기만 하고 직접 수정하지 않음 |
| 사용자 승인 | 결정안 작성은 불필요, 적용은 D-25 | 결정안 작성은 불필요, 수집은 D-24 | 결정안 작성은 불필요, 외부 실행은 D-26 | 현재 READY 작업은 승인 불필요 |

완료 판정: 세 작업은 파일·API·DB·라우팅·공통 설정·사용자 흐름이 겹치지 않게 병렬 실행됐다. BIZ-004는 바로 PASS, QA-013은 1차 수정 후 PASS, MKT-011은 2차 수정 후 PASS다. 제품·개인정보·외부 상태는 변경하지 않았다.

## QA-014 완료 및 다음 게이트

| 비교 항목 | QA-014 | 현재 다른 READY 작업 | 판정 |
| --- | --- | --- | --- |
| 수정 경로 | `ops/reports/QA-014-outreach-contact-suppression-decision-packet.md` | 없음 | 단일 보고서 |
| API·DB·라우팅 | 변경 없음 | 없음 | 충돌 없음 |
| 개인정보·외부 실행 | 실제 연락처 수집·저장·발송 금지 | 없음 | 읽기 전용 정책 조사 |
| 선행 | QA-013·MKT-011 DONE | - | 충족 |
| 후속 | D-29 승인 완료, D-26·법률 확인·기술 E2E·MKT-010 대기 | 없음 | 남은 게이트 전 외부 연락 0 |

판정: QA-014는 총괄 PM·독립 reviewer 검수 `PASS`, D-29는 사용자 승인 완료다. QA-015도 총괄 PM·독립 reviewer `PASS`로 D-24 최신 보완안을 완성했다. BE-006·MKT-010은 D-24와 법률 확인·제품 E2E, OPS-010은 CHG-C 문서 기준선 정리가 선행되어 자동 시작하지 않는다.

## OPS-011 D-23~D-25 재검토 판정

- D-23: 사용자 승인 완료. 실제 활용신청·호출·저장·공개는 별도 카드다.
- D-24: QA-015 총괄 PM·독립 reviewer `PASS`, 사용자 승인 완료다. 실제 개인정보 처리는 별도 기술 E2E와 실행 승인 전 금지한다.
- D-25: 사용자 승인 완료. 라벨 실제 부착은 BE-006·FE-008 후다.
- 다음 순서: D-22 승인 → OPS-009 → FE-009. 홈 파일이 겹치므로 병렬 실행하지 않는다.

## OPS-009 → FE-009 → 온라인 미리보기 순차 게이트

| 비교 항목 | OPS-009 | FE-009 | 판정 |
| --- | --- | --- | --- |
| 수정 경로 | 빌드 제외, 9개 HTML, `data.js`, 홈 소비, 목록 0건 안내 | `index.html`, `styles/pages/home.css`, `scripts/pages/home.js` | `index.html`·홈 JS가 겹치므로 병렬 금지 |
| CHG-B | `provider.html` 파생 script 4개와 목록 0건 안내만 최소 carve-out | CHG-B 수정 금지 | 기존 CHG-B diff 보존 |
| API·DB·라우팅 | 변경 없음 | 변경 없음, 기존 검색 URL만 사용 | 공통 계약 변경 없음 |
| 데이터 | NAVER 파생 공개 로드·병합 0, 로컬 원본 보존 | 업체 데이터 렌더링 0, 검수 콘텐츠만 사용 | OPS-009 PASS가 선행 |
| 패키지·환경변수 | 변경 금지 | 변경 금지 | CHG-A 비접촉 |
| 배포 | 실행 금지 | 최종 배포 금지 | 두 작업 PASS 후 승인된 draft 미리보기만 허용 |

완료 판정: OPS-009 후 FE-009를 순차 실행했고, 고유 draft `6a614bf21e9fc5a87195f051`에서 8개 행사·검색 이동·콘솔 오류 0건을 확인했다. GitHub main, Netlify production, PR 병합은 하지 않았다. 전체 `pnpm test`의 단일 과거 계약 충돌은 QA-016으로 분리하며 CHG-A 소유권 확정 전 시작하지 않는다.

## FE-011 실행 충돌 판정

- FE-011은 FE-009의 홈 3개 파일을 이어서 수정하므로 FE-009 완료 후에만 실행한다.
- `compare.html`의 OPS-009 격리 diff는 보존하고 데이터 script를 다시 추가하지 않는다.
- CHG-A의 `package.json`, `pnpm-lock.yaml`, 브라우저 스모크 정본과 CHG-B의 업체 목록·상세 파일을 수정하지 않는다.
- 홈·계산기·체크리스트·비교는 작업 내부에서 같은 행사·검색·비교 저장 계약을 공유하므로 하나의 카드와 단일 쓰기 소유자로 순차 구현한다.
- 품질 에이전트는 구현 완료 후 읽기 전용으로 검수하며 제품 파일을 동시에 수정하지 않는다.
- 고유 Netlify draft는 로컬 검사 통과 뒤에만 만들며 production 별칭, GitHub main, PR은 변경하지 않는다.

완료 판정: FE-011은 2026-07-23 총괄 PM·독립 QA 검수 `PASS`로 `DONE` 처리했다. 390×844·768×1024·1440×1000 브라우저 검사, 배포 번들 검사, 비밀정보 검사를 통과했고 고유 draft `6a619622202cedff2ed28f92`를 생성했다. GitHub main, Netlify production, PR, DB·API·환경변수는 변경하지 않았다. QA-016의 승인된 하단 정보 나눔 링크와 과거 marketplace 검사 충돌은 CHG-A 소유권 확정 후 별도 처리한다.

## FE-012 실행 충돌 판정

- FE-012는 FE-011 화면 계약을 이어서 수정하므로 FE-011 완료 후 순차 실행한다.
- 새 행사 ID나 DB·API 계약을 만들지 않는다. `meeting`을 결혼 준비 대표 ID, `other`를 기타 가족행사 대표 ID로 재사용하고 `smallWedding`, `familyGathering`, `memorial`은 `scripts/core/search-context.js`를 포함한 읽기 경로에서 대표 ID로 호환한다.
- CHG-B와 겹칠 수 있는 `venues.html`은 행사 선택 옵션만 최소 수정한다. `scripts/pages/venues.js`, `provider.html`, `scripts/pages/provider.js`, `styles/components/filter.css`는 수정하지 않는다.
- CHG-A의 패키지·잠금 파일·브라우저 스모크 정본과 CHG-C의 문서·favicon은 수정하지 않는다.
- 체크리스트 저장은 대표 키에 기록하되 이전 키를 읽어 병합하고 삭제하지 않는다. 데이터 마이그레이션과 운영 DB 변경은 없다.
- 품질 에이전트는 제품 구현 완료 후 읽기 전용으로 검수한다. 고유 draft는 로컬 검사 통과 후에만 생성하며 production·GitHub main·PR은 변경하지 않는다.

완료 판정: FE-012는 2026-07-23 두 차례 범위 내 보완 후 총괄 PM·독립 QA `PASS`로 `DONE` 처리했다. 공개 분류 5개, 레거시 URL 4종 정규화, 체크리스트 4단계·12개 이상, 대표키 병합·레거시 키 보존·초기화 tombstone, 3개 뷰포트 가로 넘침·콘솔 오류 0을 확인했다. 고유 draft `6a61a2981e9fc538d795f061`만 생성했으며 GitHub main, Netlify production, PR, API·DB·RLS·환경변수·패키지는 변경하지 않았다. 8개 행사를 강제하는 과거 `sonpum-redesign.mjs`는 CHG-A 이후 QA-017에서 정합화한다.

## 오케스트레이션 의존성

- `.codex/config.toml`과 `.codex/agents/**`는 제품 작업의 공통 운영 계약이며 총괄 PM만 변경한다.
- custom agent 자동 로드는 프로젝트 신뢰와 새 세션의 설정 재로딩에 의존한다.
- 현재 생성 도구가 agent 이름 선택을 제공하지 않으면 역할 TOML의 내용을 생성 프롬프트에 포함하되 카드의 허용 범위를 바꾸지 않는다.
- 동일 작업 공간에서는 읽기 전용 작업만 병렬 실행한다. 쓰기 작업은 별도 Worktree/브랜치가 확인되기 전 병렬 실행하지 않는다.

## D-37 전국 업체정보 확보 준비 작업 충돌 검사

| 비교 항목 | BE-016 | OPS-025 | BIZ-009 | 판정 |
| --- | --- | --- | --- | --- |
| 수정 경로 | 데이터셋별 신규 evidence 3개 디렉터리, BE-016 보고서 | OPS-025 보고서 | BIZ-009 보고서 | 직접 파일 충돌 없음 |
| 공통 제품 파일 | 없음 | 없음 | 없음 | 충돌 없음 |
| API·DB·라우팅 | 실제 호출·DB·라우팅 변경 금지 | 변경 금지 | 변경 금지 | 공유 계약 변경 없음 |
| 개인정보 | 실제 업체값·연락처 금지 | 실제 업체·고객·증빙 금지 | 실제 견적·고객정보 금지 | 실데이터 접촉 없음 |
| 패키지·환경변수 | 변경 금지 | 변경 금지 | 변경 금지 | CHG-A 비접촉 |
| CHG-B·C | 변경 금지 | 변경 금지 | 변경 금지 | 기존 미할당 변경 보존 |
| 공유 정책 | BE-009 source registry | BIZ-007·OPS-008 intake/T5 | BIZ-003·D-24/D-25 견적·비교 | 서로 다른 계약을 읽고 수정하지 않음 |
| 후속 의존성 | dataset별 QA gate·실제 canary 승인 | 데이터 계약·제품 접수 구현 | 사용자 정책 결정·데이터 계약 | 세 준비 작업 완료 후 후속 구현은 순차 재검사 |

세 작업은 보고서·공식 문서 증거 준비에 한해 병렬 실행할 수 있다. 같은 작업 공간에서 실제 실행할 때는 PM 문서 갱신을 동시에 쓰지 않고 결과 회수 후 총괄 PM이 순차 반영한다. 실제 API 호출, 개인정보·견적 원본 처리, 제품 구현, DB·공개는 이번 병렬 허용에 포함되지 않는다.

## BE-016·OPS-025·BIZ-009 후속 준비 순서

```text
BE-016 DONE → OPS-026 Git 경계 설계 DONE → OPS-027 exact 로컬 구현 DONE
→ D-39 APPROVED → OPS-028 exact 별도 GitHub branch DONE

BIZ-009 + OPS-025 DONE
→ QA-032 개인정보·악용 사전 검수 DONE
→ BE-017 통합 데이터 계약 DONE
→ QA-033 현행 SQL 차이 감사 DONE
→ BE-018 합성 수용 테스트 명세 DONE
→ D-38 사용자 승인 APPROVED
→ OPS-023·QA-020 PASS → QA-003 1차 REVISION_REQUIRED
→ BE-014 보안 최소 차단 DONE
→ BE-015 등록·수정·응답 원자성 DONE → FE-019 clean client 연결 DONE
→ CHG-B 소유권 승인 → FE-020 목록·상세·수정 요청 연결
→ BE-020·FE-021 → QA-035 REVISION_REQUIRED
→ FE-022 + BE-021 → BE-022 → FE-023 → QA-036 REVISION_REQUIRED
→ BE-023 → FE-024 → QA-037 PASS → QA-038 PASS → BE-024 → FE-025 + FE-026 → QA-039 → BE-026 + QA-040 PASS → QA-003 최종 PASS
→ BE-019 migration/RPC/RLS DONE → QA-041 SQL 역할 E2E PASS → QA-042 실제 Auth/HTTP/MFA PASS → BE-027 review queue 구현 PASS → exact Git 보존 DONE → OPS-029 설치 문서 015·016 반영 PASS → 통합 후보 읽기 전용 조립 계획 → 승인된 통합·전체 회귀 → 운영 DB 별도 승인
```

## OPS-029 통합 전 의존성

- 현재 작업 체크아웃: migration `001`~`005`
- 검증된 통합 후보 `codex/be-027-v2-review-queue-rpc`: migration `001`~`016`
- 문서의 새 프로젝트 실행 목록 `003`~`016`: 후보 브랜치 대비 누락 0·초과 0
- `006`~`016` 통합 전 운영 적용 금지
- 통합 뒤에도 migration 적용, Edge/runtime·Storage 활성화, 실제 자료 접수, `main`, production은 각각 별도 승인

## OPS-030 통합 조립 판정

```text
BE-027 8e7eb81 (BE-019·OPS-024·migration 001~016 포함)
→ QA-041 최종 2 blob exact 추출
→ QA-042 tip b84d307만 적용
→ QA-044 tip 5f1e6d0만 적용
→ OPS-029 문서를 clean base 위에 재적용
→ FE-028·FE-029·QA-045 exact 보존 후보와 별도 대조
→ 전체 회귀
→ PR/main/운영 DB/production 각각 별도 승인
```

FE-028·FE-029·QA-045 결과는 OPS-031에서 exact 원격 브랜치로 보존했다.

OPS-031 완료: commit `b424156`이 기준 parent `1e7f654`보다 exact 16파일·1커밋 앞서며 GitHub·로컬 branch·현재 검수본 blob 16/16이 일치한다. 다음 단계는 BE-027과 이 snapshot의 파일·공유 계약 충돌을 읽기 전용으로 대조하는 것이다.

OPS-032 완료: BE-027 52개와 FE snapshot 16개의 직접 파일 교집합·3-way 충돌은 0이다. 계산기→업체 찾기, 비교함→문의, 헤더→업체 등록, 마이페이지→Auth/RLS 네 흐름은 의미상 연결되므로 실제 통합 뒤 브라우저·격리 Auth E2E가 필수다.

OPS-033 조립 결과: 원본 `.git` 쓰기 제한 때문에 새 Worktree 대신 독립 로컬 Git
저장소를 사용했다. BE-027→FE snapshot→QA 증거→OPS-029 순서가 충돌 없이
HEAD `cdd61dc`로 조립됐고 migration `001~016`, 제품 회귀·build·dist·390/1440
브라우저가 통과했다. 과거 8행사·푸터 검사 2건은 QA-046 local commit
`a66b510`에서 현행화해 직접 검사 26/26을 통과했다. QA-047은 실제 격리
GoTrue JWT·PostgREST·TOTP AAL2와 migration 016 review queue를 통과했고
cleanup 11종 0·runtime 4종 false를 확인했다.

OPS-034 완료: remote `codex/ops-034-integrated-preview`가 exact HEAD
`cdd0929`와 일치하고, 고유 noindex draft `6a6aba4d5ef57d8288accfea`에서
홈·업체 찾기·계산기·체크리스트·로그인 5화면과 중첩 JS/CSS 200을 확인했다. production
deploy `6a5f03a802e84a00087f1ece`와 main `b837ea9`는 전후 불변이다.

QA-048 완료: 최종 고유 draft의 공개 경로 8개를 390·768·1440px에서
읽기 전용으로 검수했다. 24/24 화면 조합에서 overflow·깨진 이미지·console
오류가 없고 공개 헤더·계산기·체크리스트·비교함 경계가 승인 계약과 일치했다.

FE-031 완료: OPS-034·QA-048 통합 후보를 기준으로 핵심 세부 화면 7개와
신규 공통 히어로 CSS 1개만 순차 수정했다. commit `6a227a5`와 고유 noindex
draft `6a6ad5c2311d65fe29d4076f`에서 6개 공개 화면×3개 뷰포트의 제목 규격,
공통 CSS 로드, overflow 0, 깨진 이미지 0을 확인했다. FE-030 접근성 공백은
별도 백로그로 유지했다. 당시 main·production은 D-30 전 변경하지 않았고,
2026-07-30 D-30 승인 뒤 최종 HEAD `942891b`로 반영했다.

게이트 결과: D-30 `main` 반영과 production 배포·재검수는 완료했다.
운영 DB 적용은 계속 독립 승인 전 금지한다.

## FE-032 의존성 결과

- FE-032는 OPS-034 통합 후보와 FE-031 공통 히어로를 선행으로 사용한다.
- 기존 URL·검색 쿼리·저장 키·5개 행사·Supabase 계약은 변경하지 않았다.
- 정적 준비백과 URL은 빌드 산출물 `articles/{slug}.html`이며 기존
  `article.html?slug=`는 호환 셸로 남긴다.
- canonical·OG·sitemap의 최종 기준 주소는 정식 도메인 구매 후 `SITE_URL`
  설정과 D-10 최종 승인이 필요하다.
- FE-032의 main 병합·production 배포는 구현 당시 D-30 후속 승인과 분리했고, 2026-07-30 승인 뒤 반영을 완료했다.

## FE-033 의존성 결과

- FE-033은 FE-032를 선행으로 사용하며 계산기 CSS·완료 이동 코드·전용 테스트만 수정했다.
- 행사 분류, 5단계 입력, 계산식, 저장 상태, 업체 검색 전달 계약은 변경하지 않았다.
- API, DB, 라우팅, 환경변수, 패키지·잠금 파일과의 공유 변경은 없다.
- D-30 승인 뒤 GitHub main과 Netlify production에 반영했고, 최종 HEAD `942891b`·deploy `6a6b08fdbf620b000895e2c1`에서 전역 noindex와 레거시 관리자 301을 포함해 재검수했다.

## FE-034 의존성 결과

- FE-034는 FE-033을 선행으로 사용하며 계산기 HTML·전용 CSS·클라이언트 로직·전용 테스트만 수정했다.
- 기존 5단계, 행사 분류, calculator-state, TaranSearchContext, 저장·공유·업체 검색·체크리스트 계약을 유지했다.
- 참석 인원은 기존 검색 인원 필터에 사용하고, 식사 인원과 직접 공간비는 계산 설명 및 저장 상태에만 추가했다.
- API, DB, 라우팅, 환경변수, 패키지·잠금 파일과의 공유 변경은 없다.
- D-30 승인 뒤 GitHub main과 Netlify production에 반영했고, 최종 HEAD `942891b`·deploy `6a6b08fdbf620b000895e2c1`에서 FE-034 계산기 흐름을 재검수했다.

FE-022·BE-021·BE-022·FE-023과 BE-023·FE-024는 별도 local branch와 격리 Supabase에서 PASS했다. QA-037은 큐 실패 격리를 1회 보완한 뒤 독립 reviewer PASS를 받았다. QA-038 후속 BE-024·FE-025·FE-026도 별도 worktree에서 완료했고 QA-039 실제 브라우저·역할·부분 실패·cleanup을 통과했다. BE-025는 두 차례 보완 뒤 stale JWT Storage·NULL 문의 우회·잠금 교착 위험으로 차단됐다. D-43의 BE-026은 Auth 독립 tombstone·JWT drain·server attribution·no-lock guard·cutover barrier를 구현하고 수정 1회 뒤 독립 reviewer PASS를 받았다. D-44 승인 뒤 QA-040이 migration 최초·재적용, stale JWT, NULL 문의, 두 세션 cutover·old-snapshot retry와 cleanup을 통과해 QA-003을 최종 PASS로 닫았다. BE-019는 `b969191`과 호환 수정 `97a5dfb`에서 기본 비활성 v2·2인 검수·HMAC 중복·9-target 삭제·계정 삭제 연계를 구현했다. QA-041 SQL 역할 E2E와 QA-042 실제 GoTrue/JWT/PostgREST/TOTP AAL2는 PASS했고 cleanup 0·runtime false다. QA-042 `b84d307`과 BE-027 `8e7eb81`의 exact 원격 별도 브랜치 보존도 완료했다. 실제 견적 업로드·원본·운영 DB·Storage·열람권 공개는 별도 운영 승인 전 금지한다. QA-034는 D-38과 별개로 운영 DB read-only 승인을 요구한다.

## BE-028 전체 업체 상세·API 보강 의존성

```text
MKT-013 전국 공공 후보 512곳(DONE)
+ MKT-014 공식 촬영·연락 후보(DONE)
+ MKT-016 촬영 상세 22곳(DONE)
→ BE-028 전체 후보·상세 561행 일대일 연결(PASS)
→ 공공데이터포털 로그인·승인 서비스키 연결(DONE)
→ 일반음식점 dataset canary 호출(DONE)
→ 동명이업체·지점·주소·영업상태 오매칭 검사(DONE)
→ 정확 일치 72곳 내부 워크북 보강·폐업 38곳 연락 제외(DONE)
→ 숙박·미용·제과 API별 활용신청·canary·동일 품질 검사(별도 후속)
→ D-49 Google·Kakao 비용·저장 허용 필드 승인(별도 후속)
→ 업체 직접 확인·공개 동의
→ 운영 DB·사이트 공개 별도 승인
```

- NAVER 지역검색·플레이스·블로그 결과의 별도 업체 DB화는 D-15·D-35와 약관 때문에 실행선에서 제외한다.
- Google Places는 결제 활성화와 콘텐츠 저장 제한을 먼저 해결해야 하며, 승인 전에는 API 호출·장소 콘텐츠 영구 저장을 하지 않는다.
- Kakao Maps는 앱 생성·REST 키·활성화·무료 쿼터 대상 여부가 필요하고, 2026-07-21 이후 유료 API 설정 조건을 확인해야 한다.
- 공공데이터 API는 기존 파일데이터와 동일 원천일 수 있으므로 새 업체 수로 중복 집계하지 않는다. 관리번호·정규화 주소·지점명을 대조해 상태 갱신 신호로만 사용한다.
- 외부 API에 없는 가격·수용 인원·주차·예약·취소·사진 권리는 업체 확인 전 `확인 필요`로 유지한다.

## BE-029~BE-030 NAVER API 제한 시험 의존성

```text
API HUB Application·환경변수 설정
→ BE-029 지역·블로그 비저장 canary(DONE)
→ 사용자 공식 활용예시·일 25,000회 한도 확인
→ BE-030 서울 돌잔치 20곳 제한 시험(DONE)
→ 분류 신뢰 보통 6곳 우선 직접 검수
→ D-26 업체 연락 승인
→ 운영 DB·사이트 공개 별도 승인
→ 전국·행사별 확대 여부 결정
```

BE-030 결과를 공공데이터·업체 직접 제출 정본과 자동 병합하지 않는다. 장소·행사 제공·가격·인원·주차·예약·취소·사진 권리는 직접 확인 전 `확인 필요`이며, 전국 확대는 20곳의 직접 검수 정확도와 API 사용량을 확인한 후 별도 카드로 진행한다.

사용자 D-51 결정으로 전수 사전 검수 의존성을 제거한다. `BE-030(DONE) → BE-031 공개 projection → FE-035 UI → QA-050 안전 게이트 → 운영 DB/외부 공개 최종 승인` 순서로만 진행한다. BE-031과 FE-035는 공유 데이터 계약과 라우팅이 겹치므로 병렬 실행하지 않는다. QA-050은 두 구현 완료 후 수행한다.

2026-08-13 BE-031·FE-035·QA-050과 OPS-036이 순차 완료됐다. 고유 noindex draft `6a7d58e2955d753e991f76b4`는 GitHub main·Netlify production·운영 DB·정식 색인과 분리돼 있으며, 사용자 시각 확인 후 수정 또는 별도 production 승인으로만 진행한다.

D-53 후속선은 `BE-032 → FE-036 → QA-051 → OPS-037`이다. BE-032가 공개 데이터 계약을 먼저 확정하고 FE-036이 소비한다. QA-051 통과 전 온라인 draft를 만들지 않으며, OPS-037도 고유 noindex draft만 만들고 production·main·운영 DB를 변경하지 않는다.

2026-08-14 D-53 후속선은 전부 완료됐다. OPS-037 고유 draft `6a7d7aae781e2cd718ec9fbc`는 exact 17필드·denylist·내부 상세·noindex·3 viewport를 통과했고 production deploy `6a6b08fdbf620b000895e2c1`, GitHub origin/main `942891b2a59178529cd9772255c21073c7ee5c52`, 운영 DB는 불변이다.
