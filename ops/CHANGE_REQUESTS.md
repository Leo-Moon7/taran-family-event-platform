# 공통 변경 요청

## CR-001 — 기존 브라우저 검사 변경 정리

- 요청 출처: CHG-A 미할당 변경
- 대상: `package.json`, `pnpm-lock.yaml`, `_verify/browser-smoke.cjs`, `scripts/tests/browser-smoke.cjs`
- 상태: REVIEW
- 필요 결정: 두 스모크 파일 중 정본, CI 포함 여부, 깨끗한 설치 재현
- 통제: 검토 완료 전 다른 작업이 패키지·잠금 파일을 수정하지 않는다.

## CR-002 — 검색 공개 정책 변경

- 요청 작업: FE-002
- 대상 후보: `scripts/pages/venues.js`, 관련 전용 테스트
- 상태: IMPLEMENTED_IN_DRAFT
- 선행: D-01~D-03, QA-002, CHG-B 정리
- 제외: API 페이징, 디자인 전면 개편, 크롤러, 예약·결제

## CR-003 — 공식 도메인·SEO 설정

- 대상 후보: `sitemap.xml`, 공개 HTML 메타데이터, 구조화 데이터
- 상태: APPROVAL_REQUIRED
- 선행: D-06

## CR-004 — vendor-dashboard 강제 리디렉션

- 요청 출처: QA-006 공개 다중 뷰포트 검수
- 대상: `netlify.toml`의 `/vendor-dashboard.html` 301 블록
- 상태: APPROVAL_REQUIRED
- 원인: 동일 경로의 정적 파일이 존재하고 `force` 기본값이 `false`여서 redirect shadowing 발생
- 최소 변경: 해당 블록에만 `force = true` 추가
- 선행: D-13
- 검증: 무추적 HTTP 301·Location, 브라우저 최종 URL, 관리자 로그인 안내, 신규 콘솔 오류 없음
- 통제: `_redirects`, 레거시 HTML·JS, 관리자 코드, 다른 라우팅은 수정하지 않는다.
- QA-018 재현: 현재 고유 draft에서 비로그인 레거시 화면·권한 확인 안내가 200으로 표시되고 `vendor-dashboard.js`의 `undefined.id` 오류가 발생한다. 편집 폼은 hidden이며 무단 편집·운영 데이터 노출은 확인되지 않았다.
- OPS-007 결과: draft `6a62c78790a1d9262eab53d3`에서 301과 `Location: /admin/providers.html`, 관리자 로그인 안내, 3개 뷰포트 가로 넘침 0, 레거시 script·콘솔 오류 0을 확인했다. production 적용은 D-30 대기다.

## CR-005 — NAVER 검색 파생 데이터 공개 번들 격리

- 요청 출처: QA-007, QA-009, QA-010, ADR-016
- 대상 후보: `scripts/build/prepare-dist.mjs`, NAVER 파생 배열을 직접 읽는 9개 HTML, 홈·목록·상세·비교·문의·소유권·관리자 소비 경로
- 상태: DONE
- 선행: D-22 승인 완료, 수정된 작업 카드와 파일 단일 소유권 확정 완료
- 필수 격리 대상: `review-candidates.js`, `review-coverage.js`, `review-venue-candidates.js`, `review-provider-candidates.js`, `review-lifecycle-candidates.js`, `review-lifecycle-verified.js`, `review-local-api-partners.js`의 공개 배포본과 참조
- 구현 전 분리: 빌드 제외만으로 끝내지 않고 `index.html`, `venues.html`, `provider.html`, `compare.html`, `inquiry.html`, `claim.html`, `admin/index.html`, `admin/providers.html`, `venue.html`의 참조와 관련 페이지 로더가 NAVER 후보를 실제 업체로 소비하지 않도록 범위를 확정한다. 이 경로는 공통 계약이므로 단일 통합 작업으로 순차 실행한다.
- 제외: 로컬 원본·`backend/data`·수집기·DB 삭제, 독립 출처 없는 값의 재가공·승계, 공공데이터 수집, CHG-A~C, 디자인 전면 개편
- 검증: source와 `dist`에서 7개 파생 파일·script 참조·공개 NAVER URL 0, 홈/목록/상세/비교/문의/claim/관리자가 오류 없이 정직한 빈/준비 상태, 기존 검수된 준비백과·커뮤니티 회귀 없음, 공개 비밀·개인정보 검사
- 통제: 이는 공개 격리이며 로컬 원본 삭제·재수집·대체 데이터 수집·배포 승인을 뜻하지 않는다. 로컬 원본은 D-27, 재배포는 D-22 승인 범위에서 별도 검수한다.
- 완료 결과: source HTML 파생 참조 30→0, dist 파생 7개와 레거시 소비기 2개 9→0, 공개 후보 4,960→0, 원본·DB 해시 불변. PM 로컬 검수 PASS, 최종 배포 금지.

## CR-006 — 운영팀 시작 질문 기반 커뮤니티 초기 화면

- 요청 출처: MKT-007
- 대상: `community.html`, `community-list.js`, `community-post.js`
- 상태: DONE
- 선행: MKT-007 DONE, D-19 완료
- 최소 변경: 기존 preview를 가짜 회원 활동이 아닌 `운영팀 시작 질문`으로 줄이고, 실제 published 글이 있으면 우선 표시하며, 실제 글이 없을 때 시작 질문을 제공한다.
- 제외: 가짜 회원·상대 시각·댓글·저장·공감 수 생성, DB·RLS·API·라우팅·패키지 변경
- 검증: 실제 글 우선, 0건/미구성 시작 질문, 운영팀 표시, 가상 반응 수 0, 기존 글쓰기 인증·검수 대기 흐름, 빌드·배포 검사
- 완료 결과: 실제 published 글 우선, 운영팀 시작 질문 6건, 가짜 회원·상대 시각·반응 수 0. PM 로컬 검수와 3개 뷰포트 테스트 통과. 배포는 별도 승인 대기.

## CR-007 — C안 차단 행동의 실제 기능 계약

- 요청 출처: QA-008
- 대상: BIZ-003 비교·신뢰 정책 + QA-011 원천 레지스트리 + OPS-008 운영 절차 → BE-006 데이터 계약 → 별도 FE/QA 구현 카드
- 상태: REPLANNED
- 선행: ADR-016, BIZ-003·QA-011·OPS-008 PM PASS 완료. 남은 게이트는 D-22~D-25와 BE-006
- 포함: 업체별 정보 수정 제안, 공개 가능한 변경 이력, 업체 권한 요청 상태, 신규 입점 인증 복귀·상태, 내 준비 현황 범위
- 통제: FE-006 홈 파일에서 저장·검수·상태 기능을 임시로 흉내 내거나 죽은 버튼을 만들지 않으며 NAVER 후보를 실제 업체 카드로 사용하지 않는다.
- 현재 결과: 비교·신뢰 정책, 공공 원천 레지스트리, 업체 등록·소유권·검수 SOP는 `ops/reports/PM-2026-07-22-prep-policy-review.md`에서 통합 PASS. 제품 구현은 아직 시작하지 않는다.

첫 실행 QA-002와 MKT-001은 공통 변경 요청이 없다.

## CR-008 — 전국 다분야 업체 후보 수집·공개 구조

- 요청 출처: 사용자 D-34
- 상태: SPEC_READY
- 목적: 서울 돌잔치 20곳 제한을 전국 가족행사 관련 업체 후보 확보로 확대
- 선행: BIZ-007·QA-022·BE-008 DONE. 다음 BE-009·OPS-016, 이후 QA-023
- 변경 가능 후보: source registry, 로컬 수집 workspace, 후속 staging schema/API, 관리자 검수, 공개 projection
- 현재 금지: 실제 대량 다운로드·운영 DB import·전면 공개·업체 연락·가격·평점·후기·사진 생성
- 통제: 데이터셋·지역·분야별 단일 소유 카드와 QA 검수 없이 공통 DB·API·라우팅을 변경하지 않는다.

## CR-009 — NAVER API·기존 수집자료 보조 분석 재검토

- 요청 출처: 사용자 2026-07-24 최신 요청
- 상태: CLOSED_NOT_ADOPTED
- 기존 기준: D-15는 NAVER 블로그·플레이스·지역검색을 사업 데이터 원천으로 사용하지 않음
- 최종 결정: 사용자가 NAVER 문의를 하지 않기로 결정해 후보 발견·관련성·중복·검수 우선순위·AI 분석을 포함한 보조 활용 경로를 채택하지 않음
- 금지 유지: 블로그 본문·사진·후기수·평점·가격·추천·행사 가능 확정·공개 assertion 자동 승계
- 후속: QA-027·BIZ-008·BE-011·QA-030 실행 취소. 공공데이터·업체 직접 등록·고객 제안·관리자 검수만 진행
- 기존 자료: D-27 전 격리 보존. metadata-only 감사가 필요하면 별도 승인하며 재사용·공개 목적으로 열람하지 않음

## CR-010 — 공공데이터 안전 도구·증거 exact Git allowlist

- 요청 출처: R-67, OPS-018 독립 reviewer `PASS`
- 상태: DONE_LOCAL
- 단일 소유 작업: OPS-019
- 공통 변경 대상: `.gitignore`
- 목적: 검수 완료된 `backend/public_data_seed` 도구·합성 fixture·공식 정규화 증거 9개만 향후 Git 추적 후보로 열고 나머지 `backend/**`는 계속 차단
- 허용: OPS-018 exact 9-file negation과 단계별 재차단 규칙
- 금지: `backend/data/**`, workspace, temp, cache, DB, 원본, 비밀, 미검수 신규 파일, backend 내용 수정, git add·commit·push
- 검증: allow 9 not ignored, deny 10 ignored, non-ignored untracked exact 9, 일반 파일·비-reparse·1 MiB 이상·고신뢰 비밀 형식 0, QA-023·seed 회귀
- 완료 결과: allow 9/9, deny 10/10, exact non-ignored untracked 9, 비밀·대용량·reparse 0, QA-023 31/31·11/11과 seed 14/14 통과, 독립 reviewer PASS
- 외부 반영: 로컬 구현·독립 검수까지만 완료. Git index와 GitHub 반영은 D-36 승인 전 금지

## CR-011 — 고객 견적 기여·열람 v2 데이터 경계

- 요청 출처: BIZ-009, QA-032, BE-017, QA-033, BE-018
- 상태: IMPLEMENTED_E2E_PASS_GIT_PRESERVATION_PENDING
- 목적: 고객 견적 원본, 구조화 견적, 공개 projection, 상세 열람권, 업체 이의, 삭제를 분리
- P0 기존 충돌: 평문 `taran_provider_claims.business_number`, generic `taran_contributions.data/file_paths`, 포인트 승인 RPC, 공개 provider base table, 직접 provider update, 기존 evidence role/delete
- 구현 원칙: additive v2, 기존 객체 재사용 금지, 승인+projection+grant 원자성, case JIT·MFA·safe preview·30/90일·tombstone
- 선행: D-38 승인 완료, OPS-023·QA-020·QA-003 PASS, BE-019 `b969191` + `97a5dfb`, QA-041 SQL 역할 및 QA-042 실제 Auth/JWT/PostgREST/TOTP AAL2 PASS
- 금지: 운영 DB, 실제 견적·개인정보, 기존 행 migration·삭제, 제품 공개, 외부 전송
- 후속: QA-042 하네스·BE-027 exact Git 보존 → 설치 문서 015·016 반영 → 개인정보/법률·scanner/preview 확인 → FE/관리자 UI 단일 소유 → 별도 운영 승인

## CR-012 — BE-016 신규 공식 근거 exact GitHub 보존

- 요청 출처: OPS-026·OPS-027, R-83
- 상태: DONE
- 대상: `.gitignore`와 신규 evidence exact 6개
- 허용: 별도 안전 작업 공간, exact 7-file commit, `codex/ops-028-be016-evidence` push
- 금지: 다른 dirty 변경, 운영 문서, 제품, DB, 원본, PR, main, 배포
- 검증: staged/commit exact set, UTF-8 JSON 3/3, SHA 3/3, 비밀·실제 API·업체 레코드 0, deny 유지
- 완료: `codex/ops-028-be016-evidence`, commit `9cdfb6c`, 원격 push. PR·main·배포 0

## CR-013 — QA-003 공개 projection·검수 workflow 수정 2차

- 요청 출처: QA-003 1차 실제 재현, BE-014 PASS, R-72~R-81
- 상태: REVISION_REQUIRED_AFTER_QA035
- 단일 소유 작업: BE-015
- 목적: DB 승인 업체와 브라우저 목록·상세·문의의 단절을 해소하고, 업체 수정 요청·관리자 검수·동의 payload·원자적 실패 표시를 격리 환경에서 완성
- 허용: additive migration/RPC, 업체 수정 요청·관리자 검수 전용 파일, 공개 safe view adapter, inquiry consent payload, 합성 E2E
- 금지: 운영 DB, 실제 업체·고객·견적·증빙, CHG-A~C, GitHub main, production, 기존 migration 수정
- 선행: BE-014 DONE, QA-003 `REVISION_REQUIRED_AFTER_FIX_1`
- 현재 결과: FE-020 목록·상세·수정 요청과 BE-020 후기 역할 계약은 PASS. QA-035에서 후기 성공 오표시, 관리자 profile 조회 실패, 공개 view Advisor 오류 2건, Storage 실제 API 미완료와 Auth 삭제 worker 부재를 확인했다.
- 후속: FE-022 + BE-021 → BE-022 → QA-036 → QA-003 최종 판정

## CR-014 — QA-035 후기·관리자 역할·공개 projection 보정

- 요청 출처: QA-035 실제 격리 브라우저·Security Advisor
- 상태: DONE_WITH_FOLLOWUP
- 목적: 성공한 후기의 실패 오표시, 관리자 본인 역할 조회 실패, 공개 view 실행 권한 오류를 각각 최소 범위에서 제거
- 병렬 허용: FE-022와 BE-021은 파일·API·DB 계약이 겹치지 않아 별도 worktree에서 병렬 가능
- 순차 조건: BE-022는 BE-021 뒤 실행, QA-036은 FE-022·BE-021·BE-022와 Chrome 파일 권한 설정 뒤 실행
- 금지: base table 전체 SELECT, 역할 승격 UI, 기존 migration 수정, 운영 DB, 실제 계정·증빙, main, production
- 검증: 후기 성공/중복 UI, operations/content 본인 역할 1행·customer/타인 0, Advisor 오류 2→0, Storage 실제 API, 종료 잔존 0
- 완료: FE-022·BE-021·BE-022·FE-023 `PASS`. QA-036에서 후기·역할·Storage·Advisor·업체 등록과 종료 잔존 0을 확인했다.

## CR-015 — 관리자 업체 관리 큐 최소권한 연결

- 요청 출처: QA-036 실제 operations 브라우저 재현, R-93
- 상태: DONE_WITH_FOLLOWUP
- 목적: base table 직접 SELECT를 다시 열지 않고 operations 관리자에게 업체·소유권·등록 검수 큐의 최소 열만 제공
- 순차 작업: BE-023 → FE-024 → QA-037
- 허용: 신규 additive RPC migration, 역할별 전용 테스트, `scripts/pages/admin/providers.js` 최소 연결, 전용 보고서
- 금지: base table anon/auth SELECT, content/customer 권한 확대, 승인 정책 변경, 운영 DB, 실제 자료, main, production
- 검증: owner/admin/operations allow, content/customer/anon deny, 금지 열 0, 큐별 실패 격리, 브라우저 실제 화면, 종료 합성 잔존 0
- 완료: BE-023·FE-024 1차 구현 뒤 QA-037이 큐 단일 실패 도메인을 지적했다. 세 독립 RPC·세 독립 client 요청으로 1회 보완해 reviewer `PASS`를 받았다.
- 후속: providers.js 직접 write와 dashboard.js·inquiries.js 잔여 direct read는 QA-038에서 별도 감사한다.

## CR-016 — 관리자 업체 운영 동작·현황 최소권한 연결

- 요청 출처: QA-038 읽기 전용 감사, R-94~R-96
- 상태: DONE
- 목적: operations 화면의 업체 저장·상태 변경·소유권 승인과 현황 지표를 base table browser 권한 없이 실제 작동하게 한다.
- 순차 작업: BE-024 → FE-025 + FE-026 → QA-039
- 허용: 신규 additive migration 012, 역할별 전용 테스트, 세 지정 관리자 client 파일의 direct access 최소 교체, 전용 보고서
- 금지: base table anon/auth grant, 업체 ID 변경·삭제, 정책·지표 정의 확대, 운영 DB, 실제 자료, main, production
- 검증: owner/admin/operations allow, content/customer/anon deny, 원자적 claim rollback, 금지 열 0, 실제 0건과 오류 구분, 브라우저 실제 동작, 종료 합성 잔존 0
- 완료: BE-024 `593773a`, FE-025 `85d947a`·`ed191c6`, FE-026 `749bf42`를 결합해 QA-039 `PASS`. 신규 등록 오류는 범위 내 수정 1회 후 등록·공개·수정 PASS, claim 원자성·부분 실패 표시·역할 거부·cleanup PASS

## CR-017 — Auth 삭제 tombstone·JWT drain·동시성 재설계

- 요청 출처: BE-025 독립 reviewer 최종 판정, R-75·R-97·R-98
- 상태: DONE_IN_ISOLATION
- 승인: D-43
- 단일 소유 작업: BE-026
- 목적: Auth 삭제 뒤 만료 전 JWT의 DB·Storage 쓰기, `taran_inquiries.user_id=NULL` 우회, row/advisory lock 교착을 제거한다.
- 허용: 신규 migration 014, 기존 BE-025 Edge Function·전용 테스트의 최소 수정, 신규 tombstone 테스트·전용 보고서
- 금지: migrations/001~013 수정, 제품 UI, 패키지·잠금 파일, 운영 DB·실제 계정·실제 Storage, main, production, 스케줄 활성화
- 계약: Auth FK 독립 단기 tombstone, 서버 강제 사용자 귀속, no-lock tombstone guard, `auth_deleted_at + 실제 최대 JWT TTL + buffer` 이전 최종 제거 금지, 비식별 완료 이력
- 검증: 정적·상태 모델, 독립 reviewer, migration 최초·재적용, stale JWT·NULL 문의·Storage·2세션 교착·다른 사용자 불변·cleanup
- 구현 결과: BE-026 commits `fe02b45`·`09701bb`, 수정 1회, 전용 테스트 38/38·독립 reviewer `PASS`
- 검수 결과: QA-040이 migration 최초·재적용, stale JWT DB·Storage·Auth metadata, NULL 문의, 두 세션 cutover·old-snapshot 재시도, mark gap·JWT drain·비식별 이력·cleanup을 `PASS`
- 선후관계: QA-003 최종 `PASS`; 운영 DB·Edge·스케줄·main·production은 별도 승인 대기
