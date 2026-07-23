# QA-010 NAVER 의존성 전수 감사·대체 분류

- 작업 ID: `QA-010`
- 감사일: 2026-07-22 (Asia/Seoul)
- 감사 결과: **PASS — 전수 목록·대체 분류 완료**
- 제품 상태: **APPROVAL_REQUIRED — 현재 NAVER 파생 공개·신규 수집 중지 유지**
- 수정 범위: 이 보고서 1개만 추가. 제품 코드·문서·데이터·DB·패키지·CHG-A~C는 수정하거나 실행하지 않았다.
- 핵심 전제: 현재 정적 공개 병합 4,960건은 **검증 완료 업체가 아니라 출처를 다시 확인해야 하는 후보 데이터**다. `published`, `verified`, `api_collected`라는 기존 필드명은 독립 검증 완료를 뜻하지 않는다.

## 1. 결론

저장소에는 NAVER 블로그 검색, 지역검색/플레이스 성격의 업체 기본 정보, NAVER 지도 이동에 대한 의존이 문서·수집기·로컬 DB·정적 데이터·공개 화면·빌드·운영 승인 계획에 걸쳐 남아 있다. 행동 가능한 의존 단위는 **48개**이며, 영역별로 기준·운영 문서 14개, 백엔드·수집 코드 13개, 데이터·산출물 10개, 공개·빌드 흐름 11개다.

현재 서비스의 업체 정보 기능 전체를 없앨 필요는 없다. 업체 기본 사실은 공공데이터포털 전환 데이터셋, 업체 직접 입력, 업체 공식 채널의 최소 사실 수동 확인으로 다시 만들고, 후기·가격·인원·경험 정보는 손품해방 자체 콘텐츠와 검수된 사용자 제보로 대체할 수 있다. NAVER 또는 다른 외부 API는 실제 이용조건·Application 목적·필드·보관기간·표시·상업 이용 범위를 서면 확인한 경우에만 **비저장 보조 검색**으로 분리해야 한다.

공공데이터 대체 시 `localdata.go.kr`를 새 직접 연동 대상으로 적지 않는다. PM이 제공한 최신 운영 주의에 따라 기존 LOCALDATA는 2026-01-14부터 `data.go.kr`로 전환되고 2026-04-15 폐쇄 예정으로 안내된 체계이므로, **공공데이터포털의 전환 데이터셋**을 찾아 데이터별 이용허락·상업 이용·변경·출처표시·갱신주기를 확인하는 작업으로 분류한다.

## 2. 감사 범위와 재현 기준

### 포함

- `docs/**`, `ops/**`, 완료 보고서와 전달문
- Git 무시 로컬 영역을 포함한 `backend/**`, `backend/data/**`, SQLite `backend/data/sonpum.db`
- 루트 `review-*.js`, `data.js`, 공개 HTML·페이지 JavaScript, 관리자 소비 경로
- `scripts/build/prepare-dist.mjs`와 현재 `dist/**` 복제본
- 직접 문자열뿐 아니라 `review_sources`, `external_reference`, `externalReviews`, `sourceCount`, `api_collected`, `reviewCoverageData` 같은 간접 계약

### 제외

- API·크롤러·수집기 실행, 키·운영 환경 조회, 운영 DB 접근
- 데이터 삭제·재가공, 빌드 실행, 제품·문서 수정, 법률 자문 확정
- `admin-schema.sql:889`와 `contribute.html:153`의 `네이버페이` 리워드: 블로그·플레이스·지역검색 의존이 아닌 별도 보상 상품이므로 이번 48개에 포함하지 않았다.
- `ops/ACTIVE_WORK.md`, `ops/PROJECT_BOARD.md`, `ops/BACKLOG.md`, `ops/TASK_SPECS.md`의 QA-010/BIZ-002/BE-005/MKT-009와 해당 handoff: NAVER 비의존 전환을 위한 배정·상태 기록이며 제품 의존 항목이 아니므로 48개에 중복 산입하지 않았다.

### 환경 한계

- Windows PowerShell 로컬 작업 공간에서 읽기 전용으로 검사했다.
- 현재 PATH에서 `git` 실행 파일을 찾지 못해 독립 `git status/diff`는 실행하지 못했다. 쓰기는 이 보고서 추가에만 사용했다.
- 빌드는 `dist`를 삭제·재생성하므로 카드의 단일 파일 쓰기 범위를 침범한다. 따라서 실행하지 않고 빌드 스크립트·현재 산출물 SHA-256을 대조했다.

## 3. 현재 데이터 기준선

| 대상 | 재현 결과 | 해석 |
| --- | ---: | --- |
| `backend/data/sonpum.db`의 `review_sources` | 28,879건 | 전부 `platform='naver_blog'`, `status='pending'`, NAVER 블로그 URL과 요약 보유 |
| `review-candidates.js` | 9,991건 | 초기 블로그 검색 공개 후보 인덱스. DB보다 18,888건 적어 최신 원천 전체를 대표하지 않음 |
| `review-coverage.js` | 28,879건 | DB 전량에서 만든 지역별 후기 집계. 직접 NAVER 문자열이 없어도 전부 NAVER 파생 |
| `review-venue-candidates.js` | 460건 / evidence 2,056개 | 모두 reviewing 후보, NAVER 원문 파생 |
| `review-provider-candidates.js` | 30건 published / 링크 132개 | 블로그 파생 비장소 업체 |
| `review-lifecycle-candidates.js` | 42건 published / 링크 196개 | 블로그 파생 생애주기 업체 |
| `review-lifecycle-verified.js` | 42건 중 published 39 / 링크 196개 | NAVER 지역검색 점수로 `verified` 등을 부여한 후보 |
| `review-local-api-partners.js` | 5,031건 중 published 4,891, hidden 140 / 링크 151개 | NAVER 지역검색 파생 후보. 5,031건 모두 `api_collected` |
| 실제 정적 공개 병합 | 4,960건 | 30 + 39 + 4,891. **검증 업체 수가 아니라 후보 수** |
| 6개 후기/업체 산출물의 원문 링크 | 12,722회 / 고유 10,323개 | 고유 링크 전부 NAVER. pending·hidden도 정적 파일로 다운로드 가능 |
| 지역검색 후보의 공식 링크 | 3,726건 중 NAVER 계열 977건 | 공식 홈페이지와 NAVER 블로그/플레이스 성격 링크가 혼재 |

`review-candidates.js` 9,991건과 SQLite 28,879건의 차이는 초기 돌잔치 수집 후 생애주기 수집이 DB에 추가됐지만 공개 인덱스가 재생성되지 않은 상태와 일치한다. 공개 파일 수만 보면 저장 범위를 18,888건 과소평가하게 된다.

## 4. 대체 분류 기준

| 분류 | 적용 기준 | 이번 기본 조치 |
| --- | --- | --- |
| 삭제 | NAVER 결과 원문·파생 수치·전용 실행/표시처럼 대체 후 가치가 없는 항목 | 승인 후 공개 번들에서 먼저 격리, 원본·DB 삭제는 lineage 보존 후 별도 승인 |
| 공공데이터 대체 | 업체명·업종·영업장 주소·영업 상태 등 공공 데이터로 확보 가능한 최소 사실 | `data.go.kr` 전환 데이터셋별 이용조건 확인 후 출처·확인일과 적재 |
| 업체 직접 입력 대체 | 가격·수용인원·서비스·문의 수신·공식 URL처럼 업체가 가장 정확히 제공할 항목 | 권한 승인, 제공자·갱신일, 중요 필드 재검수 |
| 사용자 제보 대체 | 실제 경험·견적·오류 제안·후기 | 로그인, 조건·시점, 개인정보 비공개, 관리자 검수, 이의·삭제 |
| 자체 콘텐츠 대체 | 준비 가이드·업종 설명·지역/행사 탐색·편집 추천 | 출처 있는 편집 콘텐츠와 내부 이용 데이터만 사용 |
| 외부 API 이용조건 확인 후 보조 | 외부 검색이 꼭 필요하지만 결과를 자체 DB로 만들지 않는 경우 | 계약 확인 후 비저장·비변조·출처 표시·자체 카드와 분리 |
| 사용자 결정 필요 | 공개 범위·삭제·NAVER 링크 유지·공통 정책처럼 사업/운영 승인이 필요한 항목 | 코드보다 결정 기록 선행 |

주분류 합계는 삭제 15, 공공데이터 대체 15, 업체 직접 입력 대체 2, 사용자 제보 대체 5, 자체 콘텐츠 대체 5, 외부 API 이용조건 확인 후 보조 1, 사용자 결정 필요 5로 총 48개다.

## 5. 기준·운영 문서 의존성 — 14개

| ID | 실제 경로·라인 | 현재 의존과 영향 | 주분류 | 중단/대체 판단 |
| --- | --- | --- | --- | --- |
| M-01 | `docs/99_의사결정기록.md:121-131` | ADR-014가 공식 NAVER 검색 API 메타데이터를 초기 정보 플랫폼의 수집 원칙으로 확정 | 사용자 결정 필요 | 최신 NAVER 비의존 방향과 충돌. ADR 폐기가 아니라 새 결정으로 수집 원천을 공공데이터·업체·사용자·자체 확인으로 교체 |
| M-02 | `docs/99_의사결정기록.md:142-156` | 공개 번들의 4,960/9,991건과 NAVER 격리·외부 후기 영역을 미결정으로 유지 | 사용자 결정 필요 | 4,960건은 후보라고 명시하고 D-15·D-18을 승인/변경한 뒤 후속 문서 정리 |
| M-03 | `docs/12_통합실행계획.md:8-18` | 초기 흐름이 외부 후기 발견→구조화에 출발점을 둠 | 공공데이터 대체 | `공공 후보/업체 등록/사용자 제보→독립 확인→출처별 공개`로 시작점 교체 |
| M-04 | `docs/10_개발로드맵.md:14-24,62-65` | 개발 전 게이트와 P0 기준이 NAVER 수집기·외부 후기 분리에 묶임 | 공공데이터 대체 | 일반 provenance/이용조건/검수 게이트로 바꾸고 NAVER 전용 감사를 역사 근거로만 연결 |
| M-05 | `docs/11_크롤링및데이터관리.md:3-19` | 현재 판정·수집 원칙이 NAVER 검색 메타데이터 보관을 전제 | 공공데이터 대체 | 업체 직접 제공·공공데이터 우선 원칙은 유지하고 포털/블로그 자동 수집·보관을 제거 |
| M-06 | `docs/11_크롤링및데이터관리.md:107-119` | 기존 공식 API 경로의 제목·요약·URL 저장과 원문 연결을 초기 허용 범위로 둠 | 외부 API 이용조건 확인 후 보조 | 계약 확인 전 중지. 향후 허용돼도 비저장 보조 결과로 자체 업체 데이터와 분리 |
| M-07 | `docs/05_업체데이터구조.md:100-118` | 4,960/4,891 수치, `external_reference`, `sourceCount` 의미가 NAVER 결과에 결합 | 공공데이터 대체 | 출처 계층은 유지하되 `public_dataset/provider_supplied/community_contribution/operator_verified`로 구체화하고 NAVER 링크 수 공개 삭제 |
| M-08 | `docs/01_사업정의.md:11-17`, `docs/04_사용자흐름.md:5-14` | 초기 가치와 사용자 흐름이 외부 후기 원문 링크 탐색을 중심 행동으로 둠 | 자체 콘텐츠 대체 | 공공 기본 사실·준비 가이드·업체 입력·이용자 제보 탐색으로 가치 제안 교체 |
| M-09 | `docs/03_서비스기능명세.md:25-28` | U-14 `외부 후기 원문 기반 업체 탐색`을 P0로 지정 | 사용자 결정 필요 | P0 삭제/강등 여부 결정. 추천은 자체 콘텐츠와 정보 제안 기능을 P0로 올리고 외부 검색은 조건부 보조로 분리 |
| M-10 | `docs/06_관리자페이지기획.md:83-93` | 첫 운영 큐가 검색 API 외부 후기 후보 | 사용자 제보 대체 | 공공데이터 신규/변경, 업체 권한·입력, 사용자 제보, 분쟁 큐로 교체 |
| M-11 | `docs/08_마케팅전략.md:46-53` | 콘텐츠 품질 규칙이 외부 원문 링크 수 활용을 허용 | 자체 콘텐츠 대체 | 링크 수·인기 신호 삭제. 검수된 자체 가이드와 실제 손품해방 제보/후기만 측정 |
| M-12 | `docs/09_운영정책.md:83-89` | 공식 검색 API 제목·요약·URL을 후보 탐지·원문 연결에 사용 | 사용자 제보 대체 | 이용자 제보와 업체 제공 증빙 처리로 교체. 외부 API는 M-06 조건을 충족한 보조만 허용 |
| M-13 | `docs/00_프로젝트현황.md:32,77,173`, `docs/02_현재사이트분석.md:100-127` | NAVER 지도, 4,960 공개 배열, 외부 후기 122, `api_collected` 4,891을 현행 기능/품질 통계로 사용 | 삭제 | 역사 수치로 이동하고 대체 데이터 기준선이 생긴 뒤 현행 통계에서 제거 |
| M-14 | `ops/APPROVALS.md:10,13,38`, `ops/CHANGE_REQUESTS.md:36-47`, `ops/RELEASE_CHECKLIST.md:33`, `ops/reports/FE-006-homepage-content-structure-v2.md:42,62,99,112`, `ops/reports/QA-008-home-action-route-readiness.md:39` | D-15/D-18/D-21, OPS-009와 C안 업체·후기 섹션이 외부 후기 유지/격리를 결정 대기 | 사용자 결정 필요 | D-18 즉시 격리 범위에 누락 파일을 보완하고 C안의 후기 섹션을 공공 기본 정보·업체 업데이트·이용자 제보로 교체 승인 |

## 6. 백엔드·수집 코드 의존성 — 13개

| ID | 실제 경로·라인 | 현재 의존과 영향 | 주분류 | 중단/대체 판단 |
| --- | --- | --- | --- | --- |
| B-01 | `backend/collect_naver_blog_evidence.py:29,70-76,121-143,185-235,270-281`; `backend/collect_naver_lifecycle_reviews.py:29,94-100,147-170,210-260,304-307` | NAVER 블로그 결과를 정규화해 SQLite에 영구 저장 | 삭제 | 신규 실행 즉시 중지. 원본 삭제는 승인 후 lineage와 파생물 철회 대조를 거쳐 수행 |
| B-02 | `backend/collect_naver_local_partners.py:28-30,217-254,269-302,318-341` | NAVER 지역검색 결과로 업체 후보를 만들고 `--publish`로 즉시 공개 가능 | 공공데이터 대체 | 공공데이터포털 전환 데이터셋+업체 직접 입력 import로 교체. `--publish`형 자동 공개 금지 |
| B-03 | `backend/verify_lifecycle_candidates_naver_local.py:20-23,121-159,162-203` | NAVER 지역검색 점수 78 이상을 `verified/기본 정보 확인`으로 변환 | 공공데이터 대체 | NAVER 점수로 검증 완료 부여 중지. 공공 원천+업체 공식 채널 또는 업체 권한 확인으로 재검수 |
| B-04 | `backend/enrich_local_api_partners_from_naver_blog.py:26-29,207-257,268-290` | 블로그 제목·요약에서 가격·인원·행사 태그와 후기 수 파생 | 삭제 | 파생 필드와 실행 경로 삭제 대상. 가격·인원은 업체 직접 입력, 실제 견적은 사용자 제보로 분리 |
| B-05 | `backend/build_review_venue_candidates.py:207-298`; `backend/export_review_venue_candidates.py:9-20` | pending 블로그 제목·요약을 장소명·반복 언급·신뢰도·evidence로 변환하고 루트 JS로 export | 자체 콘텐츠 대체 | 외부 반복 언급 기반 장소 생성 삭제. 지역/행사 탐색은 편집 콘텐츠와 검수된 공공 기본 정보로 구성 |
| B-06 | `backend/build_review_provider_candidates.py:143-215,218-235`; `backend/build_lifecycle_partner_candidates.py:119-178` | status 필터 없이 블로그 DB를 읽어 published 업체·태그·`sourceCount` 생성 | 공공데이터 대체 | 현재 builder 삭제/격리. 공공 기본 사실 import와 업체 제공 필드 조합으로 별도 builder 설계 |
| B-07 | `backend/publish_local_api_partners.py:68-126,130-166`; `backend/auto_review_local_api_partners.py:141-205,209-243`; `backend/expand_local_api_event_tags.py:69-116` | 주소·검색어·후기 휴리스틱으로 공개 여부와 행사 태그를 자동 확정 | 삭제 | 4,891건을 검증 업체처럼 만드는 경로 중지. 공공 레코드도 자동 공개하지 않고 관리자 큐로 전송 |
| B-08 | `backend/export_public_review_index.py:12-45`; `backend/export_review_coverage.py:14-47`; `backend/export_review_venue_candidates.py:9-20` | pending 결과와 28,879건 집계를 공개 정적 JS로 export | 삭제 | 공개 export 삭제. 내부 통계가 필요하면 인증된 관리자 지표로만 재설계 |
| B-09 | `backend/export_local_api_review_queue.py:20,34-39,158-160` | NAVER 지역 후보 5,031건의 검수 CSV·요약 생성 | 공공데이터 대체 | 도구 구조는 공공데이터·업체 등록 dedupe/검수 큐로 재사용 가능하나 현 입력과 산출물은 격리 |
| B-10 | `backend/start-naver-blog-collection.ps1:6-29`; `backend/start-naver-lifecycle-collection.ps1:8-35`; `backend/start-naver-lifecycle-verification.ps1:2-19`; `backend/start-naver-local-partner-collection.ps1:9-43`; `backend/start-naver-local-review-enrichment.ps1:18-55` | NAVER 키를 받아 수집·검증·보강을 바로 실행 | 삭제 | 실행 금지/아카이브. 특히 enrichment는 secret을 프로세스 인자(`:29-33`)로 넘겨 프로세스 목록 노출 위험이 있음 |
| B-11 | `backend/NAVER-BLOG-COLLECTION-GUIDE.md:1-87`; `backend/test_blog_collector.py:3-24` | NAVER API 가입·전국 호출 절차와 NAVER URL 전용 테스트를 정본처럼 제공 | 삭제 | 수집 가이드·전용 테스트 삭제/역사 보관. 공공데이터·업체 등록 검수 가이드로 별도 작성 |
| B-12 | `backend/schema.sql:151-183` | `review_sources.platform`이 `naver_blog`로 고정되고 evidence type에 `blog_hint`가 내장 | 공공데이터 대체 | 스키마를 출처 중립적으로 설계하되 DB 변경은 별도 승인. `public_dataset/provider_submission/community_report/operator_check`와 lineage·보관기간 필요 |
| B-13 | `backend/README.md:3-16`, `backend/CRAWLING-TO-HOSTING-NEXT-STEPS.md:7-20,30-68` | 로컬 MVP의 crawler 검수 API와 CSV 후보→발행 계약이 간접적으로 NAVER 파이프라인을 수용 | 업체 직접 입력 대체 | 서버·검수 골격은 유지 가능. 입력 정본을 업체 등록 CSV/폼과 허용된 공공데이터로 제한하고 자동 발행 금지 |

## 7. 데이터·산출물 의존성 — 10개

| ID | 실제 경로·라인 | 현재 의존과 영향 | 주분류 | 중단/대체 판단 |
| --- | --- | --- | --- | --- |
| D-01 | `backend/data/sonpum.db` + `backend/schema.sql:151-183` | 28,879건 전부 NAVER 블로그 pending 원천. summary·검색어·지역·URL 장기 보관 | 삭제 | 운영/제품 입력에서 즉시 제외. 실제 삭제는 사용자 승인, 백업·lineage·파생물 제거 검증 후 수행 |
| D-02 | `review-candidates.js:1` | NAVER 블로그 9,991개 제목·URL을 공개 정적 파일로 보관 | 삭제 | 공개 번들 즉시 격리, 이후 승인된 삭제 대상 |
| D-03 | `review-coverage.js:1-204` | SQLite 28,879건의 지역별 `sourceCount`와 정책 문구 | 자체 콘텐츠 대체 | 공개 파일 삭제. 향후 지역 콘텐츠 수는 검수된 자체 콘텐츠/실제 제보 건수로 별도 정의 |
| D-04 | `review-venue-candidates.js:1` | 460개 장소 후보, NAVER evidence 2,056개와 반복 언급/신뢰 점수 | 삭제 | 정적 공개·후기 기반 후보 모두 격리 |
| D-05 | `review-provider-candidates.js:1` | published 30개·NAVER 링크 132개 | 공공데이터 대체 | 독립 출처로 다시 만든 레코드만 새 ID/출처로 도입. 현재 파일은 격리 |
| D-06 | `review-lifecycle-candidates.js:1` | published 42개·NAVER 링크 196개 | 공공데이터 대체 | 업체 기본 사실과 행사 태그를 공공/업체 출처로 재확인 |
| D-07 | `review-lifecycle-verified.js:1` | 42개 중 39개를 NAVER 지역검색으로 published/verified 처리, NAVER 계열 공식 링크 14개 | 공공데이터 대체 | 현재 39개도 검증 완료로 보지 않고 후보 큐로 복귀. 홈 노출 중지 |
| D-08 | `review-local-api-partners.js:1` | 지역검색 후보 5,031, published 4,891, hidden 140, NAVER 계열 공식 링크 977 | 공공데이터 대체 | 현재 4,891건은 전부 후보. 공공데이터포털 전환 데이터셋/업체 입력으로 필드별 독립 재확인 |
| D-09 | `backend/data/naver_blog_collection_summary.json:1-38`; `naver_lifecycle_collection_summary.json:1-24`; `naver_local_partner_collection_report.json:1-15`; `lifecycle_verification_report.json:1-793`; `local_api_partner_publication_report.json:1-89`; `local_api_auto_review_report.json:1-23`; `local_api_blog_enrichment_report.json:1-257`; `local_api_event_expansion_report.json:1-18`; `local_api_partner_review_queue_all.csv:1-5032`; `local_api_partner_review_queue_top300.csv:1-301`; `local_api_partner_review_summary.json:1-101`; `review_venue_candidates.json:1-25144` | NAVER 수집·검증·파생·검수 이력과 개인 블로그 URL/제목을 로컬에 중복 보관 | 삭제 | 실행 입력에서 제외하고 접근 제한. 삭제는 D-01과 같은 승인·lineage 절차로 묶음 처리 |
| D-10 | `dist/review-candidates.js:1`; `dist/review-coverage.js:1-204`; `dist/review-venue-candidates.js:1`; `dist/review-provider-candidates.js:1`; `dist/review-lifecycle-candidates.js:1`; `dist/review-lifecycle-verified.js:1`; `dist/review-local-api-partners.js:1`; `dist/data.js:388-471` | 루트 원본과 SHA-256이 동일한 공개 배포 복제본 | 삭제 | 빌드 산출물 직접 수정 금지. 승인된 OPS-009에서 소스 참조와 빌드 포함 규칙을 고친 뒤 재생성·캐시 검증 |

## 8. 공개 화면·빌드 의존성 — 11개

| ID | 실제 경로·라인 | 현재 의존과 영향 | 주분류 | 중단/대체 판단 |
| --- | --- | --- | --- | --- |
| P-01 | `scripts/build/prepare-dist.mjs:7-29,55-72` | 루트 `.js`를 이름 구분 없이 복사해 NAVER 원천·pending·hidden까지 배포 | 삭제 | OPS-009 최소 변경 범위에 7개 파생 파일과 참조 제거를 포함. 빌드 회귀에서 부재를 검증 |
| P-02 | `index.html:142`; `venues.html:79`; `provider.html:49`; `compare.html:36`; `inquiry.html:53`; `claim.html:99`; `admin/index.html:26-30`; `admin/providers.html:56-60`; `venue.html:180-184` | 9개 HTML이 NAVER 파생 배열을 직접 로드. `dist`도 같은 참조를 보유 | 삭제 | script 태그 제거와 각 화면의 명시적 빈/대체 상태가 한 작업으로 검증돼야 함 |
| P-03 | `data.js:388-471` | `externalReviews`와 `sourceStatus`로 NAVER 후보를 확인된 디렉터리에 병합하고 `후기 기반 등록/공개 후기 기반`으로 변환 | 공공데이터 대체 | NAVER 원천 병합 제거. 출처가 독립 확인된 공공/업체 레코드만 병합 |
| P-04 | `scripts/pages/home.js:32-34,55-79`; `index.html:142` | 홈 카드 정본이 `reviewLifecycleVerifiedData`이고 NAVER 지역검색 점수를 상태 배지·확인일로 표시 | 공공데이터 대체 | 현재 39개 홈 노출 중지. 공공 기본 사실 또는 업체 제공 검수 레코드로 교체 |
| P-05 | `scripts/pages/venues.js:64-75,323-329,432-433` | 외부 NAVER 링크 수를 후기 수에 더하고 4,960 후보의 공개 게이트로 사용 | 사용자 제보 대체 | 외부 링크 수 제거. 공개 자격은 출처·필수 사실·검수 상태, 후기 수는 검수된 손품해방 사용자 후기만 사용 |
| P-06 | `provider.html:32-40,49`; `scripts/pages/provider.js:72-124` | 업체 상세가 NAVER 제목·작성일·URL을 `외부 후기`와 개수로 공개 | 사용자 제보 대체 | 외부 탭 제거 또는 실제 이용자 제보/후기 탭으로 교체. 빈 상태는 솔직하게 유지 |
| P-07 | `venue.html:141-181`; `venue.js:134-160,228-238` | NAVER 블로그를 명시하고 `후기 기반 공개/등록`, 최근 후기일, 외부 근거를 표시 | 자체 콘텐츠 대체 | 전용 후보 상세 흐름 제거. 지역·행사 안내는 자체 편집 콘텐츠로 대체 |
| P-08 | `scripts/pages/compare.js:26`; `scripts/pages/inquiry.js:8`; `claim.js:5-6,51-111`; `scripts/pages/admin/dashboard.js:121`; `scripts/pages/admin/providers.js:123` | 비교·문의·소유권 요청·관리자 통계가 4,960 후보 ID/상태를 실제 업체처럼 소비 | 업체 직접 입력 대체 | 독립 확인 또는 권한 승인된 업체만 흐름에 진입. 기존 후보 ID는 자동 승계하지 않음 |
| P-09 | `content-runtime.js:60-77`; `scripts/pages/admin/common.js:15-16`; `scripts/tests/sonpum-redesign.mjs:55-58` | 런타임/관리자가 `externalReviews/sourceCount`를 정규 필드·후기 수로 취급하고 테스트가 외부 후기 연결을 필수화 | 사용자 제보 대체 | 출처 계층과 내부 후기/제보 수를 분리하고 테스트를 NAVER 비의존 회귀로 교체 |
| P-10 | `app.js:1-40`; `venues.js:123-182,623-632`; `review-coverage.js:1-204` | 현재 HTML에서는 참조되지 않는 레거시 코드지만 28,879 후기 수·지역 수를 표시하는 로직과 데이터가 빌드에 복사됨 | 삭제 | 미사용 정본 여부를 PM이 확인한 뒤 공개 번들에서 제외. 과거 코드라고 공개 가능 파일로 둘 이유는 없음 |
| P-11 | `provider.html:43`; `scripts/pages/provider.js:191-196`; `docs/02_현재사이트분석.md:100` | `지도에서 보기`가 모든 업체를 `map.naver.com` 검색으로 보냄 | 사용자 결정 필요 | NAVER 비의존을 데이터 원천에만 한정할지 외부 지도 링크까지 포함할지 결정. 엄격한 비의존이면 주소 복사/업체 공식 URL/중립 지도 선택으로 교체 |

## 9. 과거 보고서와 통제 문서의 처리

다음 파일은 NAVER 의존을 승인하는 현재 계획이 아니라, 당시 상태·법적 한계·수치·격리 필요성을 증명하는 역사/통제 자료다. 제품 수정 후보로 세지 않았고 삭제하지 않는다.

- `ops/reports/QA-007-external-review-compliance.md:1-295`: 수집→저장→가공→공개의 이전 준수 감사
- `ops/reports/QA-009-naver-information-legal-review.md:1-268`: 독립 사실과 NAVER 결과 대량 저장을 구분한 최신 법적·운영 감사
- `ops/reports/QA-002-data-quality-baseline.md:160-255`, `ops/reports/QA-004-baseline-document-consistency.md:50-95`: 4,960/4,891/122 수치와 정의의 역사 기준선
- `ops/reports/PM-2026-07-22-content-community-naver-review.md:27-49`, `ops/reports/PM-2026-07-22-c-readiness-review.md:35`: PM 판정과 남은 승인
- `ops/handoffs/QA-007.md`, `ops/handoffs/QA-009.md`, `ops/handoffs/OPS-009.md`, `ops/TASK_SPECS.md`: 배정·통제 기록. 완료 작업의 근거로 보존
- `ops/ACTIVE_WORK.md:7-10`, `ops/PROJECT_BOARD.md:43-46,67`, `ops/BACKLOG.md:31-38`, `ops/handoffs/BIZ-002.md`, `ops/handoffs/BE-005.md`, `ops/handoffs/MKT-009.md`, `ops/handoffs/QA-010.md`: 현재 전환 작업의 상태·전달 기록이며 별도 제품 의존으로 세지 않음

향후 문서 정리에서는 위 자료를 고치기보다 상단에 역사 기록 상태와 최신 결정 링크를 추가하는 별도 PM 문서 작업이 안전하다.

## 10. 즉시 중단 대상과 실행 순서

### P0 — 지금 유지할 중단

1. `backend/start-naver-*.ps1` 5개와 연결 Python 수집·검증·보강 실행 금지
2. NAVER 결과의 신규 수집, `review_sources` 추가, 후보 재가공, `sourceCount`/추천/가격·인원 추출 금지
3. 현재 4,960건을 검증 업체, 운영 확인, 추천, 인기, 전체 후기 수로 표현하거나 공개 확대 금지
4. D-18 승인 전 제품 코드를 건드리지 않되, 기존 테스트 배포의 파생 정적 파일이 남아 있음을 운영 위험으로 유지

### 승인 후 권장 순서

1. **사용자 결정:** D-15·D-18과 P-11 지도 링크 범위를 확정한다.
2. **공개 격리:** OPS-009 범위를 6개가 아니라 `review-coverage.js`를 포함한 7개 파생 파일로 보완하고, 9개 HTML 참조·홈·상세·목록 빈 상태를 함께 검증한다.
3. **대체 데이터 계약:** 공공데이터포털 전환 데이터셋, 업체 직접 입력, 이용자 제보, 운영 확인의 필드별 출처·확인일·보관·삭제·중복 계약을 확정한다.
4. **독립 재확인:** 4,960건을 일괄 승계하지 않고 후보 큐에서 업체명·업종·지역·공식 URL부터 새 출처로 다시 확인한다.
5. **제품 교체:** 홈→목록→상세→비교→문의→claim→관리자의 공통 ID/상태를 검수된 새 레코드로 연결한다.
6. **원본 삭제:** 법률·계약·운영 승인, 백업, source→파생 lineage, 캐시·배포본 제거 검증 후 로컬 NAVER 원본과 보고 산출물 삭제 여부를 별도로 결정한다.

## 11. 신규 결함·범위 밖 후보

| ID | 심각도 | 재현 근거와 영향 | 추천 담당 |
| --- | --- | --- | --- |
| QA010-01 | **CRITICAL** | CR-005는 파생 파일 6개만 열거하지만 `review-coverage.js:1-204`도 NAVER DB 28,879건에서 생성되고 `prepare-dist.mjs:67-72`로 공개 복사된다. OPS-009 범위 누락 | PM→BE/통합, 이후 QA |
| QA010-02 | **CRITICAL** | SQLite `review_sources` 28,879건과 `review-candidates.js` 9,991건 사이에 18,888건 차이. 정적 파일만 격리해도 로컬 저장·lineage·삭제 범위가 끝나지 않음 | BE/데이터+OPS |
| QA010-03 | **CRITICAL** | `scripts/pages/home.js:32-34`가 NAVER 지역검색 기반 `reviewLifecycleVerifiedData`를 홈 업체 정본으로 사용하고 `:55-79`가 상태 배지·확인일로 신뢰 표시 | FE/BE, D-18 후 별도 카드 |
| QA010-04 | **HIGH** | `scripts/pages/venues.js:64-75,325`가 NAVER 외부 링크 수를 공개 게이트에 포함. 4,960 후보 중 122건 노출 정책과 결합 | BIZ/FE/QA, D-01~D-03 |
| QA010-05 | **HIGH** | `start-naver-local-review-enrichment.ps1:29-33`이 NAVER Client Secret을 하위 프로세스 명령행 인자로 전달해 로컬 프로세스 목록·진단 로그 노출 가능 | BE/보안. 실행 금지 유지 |
| QA010-06 | **HIGH** | `verify_lifecycle_candidates_naver_local.py:121-159`의 휴리스틱 점수가 `verified/기본 정보 확인`을 만들고 공개 홈·디렉터리가 이를 신뢰 상태로 소비 | BE/BIZ/OPS |
| QA010-07 | **HIGH** | 공개 정적 6개 원천에 NAVER 링크가 12,722회, 고유 10,323개 있고 pending/hidden도 다운로드 가능. 개인 블로그 활동 URL·제목의 최소수집/삭제 대응 위험 | PM→OPS/BE/QA |
| QA010-08 | **MEDIUM** | `scripts/pages/provider.js:195`가 NAVER 지도에 고정돼 데이터 원천을 제거해도 외부 서비스 의존이 남음 | BIZ/FE, 사용자 결정 |
| QA010-09 | **MEDIUM** | `sonpum-redesign.mjs:58`이 외부 후기 연결 존재를 성공 조건으로 강제해 NAVER 비의존 교체 시 오래된 계약을 회귀 기준으로 유지할 수 있음 | QA/FE, CHG-A 정리 후 별도 테스트 카드 |

위 항목은 제품·데이터를 직접 고치지 않았으며 PM이 기존 R-27~R-32, CR-005와 중복을 확인한 뒤 카드화해야 한다.

## 12. 보안·개인정보 영향

- 정적 산출물 6개에는 NAVER 블로그 고유 URL 10,323개와 제목·날짜가 중복 노출된다. 제목/URL은 작성자 활동이나 계정 식별 단서를 포함할 수 있다.
- 지역검색 후보에는 영업장 주소·업종·링크가 대량 공개된다. 개인사업자·자택 기반 업체의 주소/연락처는 법인 정보와 같게 취급하면 안 된다.
- 관련 소스에서 실제 NAVER 키 값으로 보이는 하드코딩 패턴은 0건이었다. 다만 B-10/QA010-05의 명령행 secret 전달은 별도 위험이다.
- 원천 삭제 요청이 들어오면 링크만 지우는 것으로 끝나지 않는다. `review_sources`→후보→행사 태그/가격·인원 단서→정적 파일→`dist`/캐시까지 함께 철회할 lineage가 필요하다.
- 공공데이터도 개인정보·제3자 권리·공공누리 유형·출처표시를 데이터셋별로 확인해야 하며, `공공데이터`라는 이유만으로 무제한 공개하지 않는다.

## 13. 재현 명령

모두 읽기 전용으로 실행했다. API·키·크롤러·DB 쓰기·빌드는 실행하지 않았다.

```powershell
# 직접 NAVER 명칭 전수 검색
rg -l -i --hidden --no-ignore -g '!node_modules/**' -g '!.git/**' -g '!.netlify/**' `
  -g '!*.png' -g '!*.webp' -g '!*.ico' -g '!*.db' `
  -e 'naver|네이버|naverapihub|blog\.naver\.com|place\.naver\.com|map\.naver\.com' .

# 간접 데이터 계약과 공개 참조
rg -n --hidden --no-ignore -g '!node_modules/**' -g '!.git/**' -g '!.netlify/**' `
  -e 'external_reference|sourceCount|externalReviews|review_sources|blog_hint|api_collected|reviewCoverageData|reviewLocalApiPartnerData' .

# 공개 HTML script 참조
rg -n -g '!dist/**' -e 'review-provider-candidates|review-lifecycle-candidates|review-lifecycle-verified|review-local-api-partners|review-venue-candidates' .

# 소스와 현재 dist 복제본 해시 대조
Get-FileHash -Algorithm SHA256 review-candidates.js,review-coverage.js,review-venue-candidates.js,review-provider-candidates.js,review-lifecycle-candidates.js,review-lifecycle-verified.js,review-local-api-partners.js
Get-FileHash -Algorithm SHA256 dist/review-candidates.js,dist/review-coverage.js,dist/review-venue-candidates.js,dist/review-provider-candidates.js,dist/review-lifecycle-candidates.js,dist/review-lifecycle-verified.js,dist/review-local-api-partners.js
```

SQLite는 Python 표준 `sqlite3`의 읽기 전용 URI `file:.../backend/data/sonpum.db?mode=ro`로 다음만 집계했다.

```sql
select platform, status, count(*)
from review_sources
group by platform, status;
-- naver_blog | pending | 28879
```

정적 JS는 선두 `window.* =`와 후미 `;`만 제거해 `ConvertFrom-Json`으로 파싱하고 파일별 총건수·published/hidden·`externalReviews` URL을 전수 집계했다.

## 14. 완료 조건 대조

| 카드 완료 조건 | 결과 |
| --- | --- |
| 실제 경로·라인 | 충족. 문서·코드·데이터·공개·빌드 48개 단위 기록 |
| 기능 영향 | 충족. 수집→저장→파생→병합→홈/목록/상세/비교/문의/claim/관리자→dist 추적 |
| 7개 대체 분류 | 충족. 주분류 합계와 항목별 대체 기록 |
| 중단 우선순위 | 충족. 신규 수집·가공·공개 확대 P0와 승인 후 순서 기록 |
| 중복/역사 자료 구분 | 충족. 완료 보고서는 현재 계획에서 분리해 보존 |
| 데이터 로더·빌드 교차 대조 | 충족. SQLite·정적 JSON 파싱·source/dist SHA-256 대조 |
| 4,960건 후보 전제 | 충족. 검증 완료 업체로 해석하지 않음 |
| 범위 준수 | 충족. 지정 보고서 외 수정 없음, 제품·데이터·DB·CHG-A~C 비접촉 |

## 15. 총괄 PM 전달 형식

```text
작업 ID: QA-010
결과: PASS(전수 감사 완료), 제품 공개/삭제/전략 확정은 APPROVAL_REQUIRED
수정·추가·삭제 파일: 추가 1개 — ops/reports/QA-010-naver-dependency-inventory.md; 그 외 수정·삭제 없음
환경: Windows PowerShell, 2026-07-22, Git CLI PATH 미탑재, API/키/운영 DB 미접근
실행 테스트·명령: rg 직접/간접 전수 검색, SQLite read-only 집계, 정적 JS 전수 파싱, source/dist SHA-256 대조
통과·실패: 감사 완료 조건 PASS; 현재 공개 준수/비의존 상태 FAIL, D-15·D-18·P-11 승인 필요
재현 근거: 행동 가능 의존 48개; SQLite NAVER pending 28,879; 정적 후기 9,991; 공개 후보 4,960; 고유 공개 NAVER 링크 10,323
완료 조건: 실제 경로·라인·기능 영향·대체 분류·중단 순서·중복 구분 충족
보안·개인정보 영향: pending/hidden과 개인 블로그 URL·제목 공개, 개인사업자 정보 혼입 가능, enrichment secret 명령행 전달 위험. 하드코딩 키 패턴은 0건
신규 결함: QA010-01~09. 특히 CR-005의 review-coverage.js 누락과 DB/정적 인덱스 18,888건 불일치
병합 권고: 이 보고서 1개는 병합 권고. 제품/데이터 변경·배포는 사용자 승인과 별도 카드 전까지 금지
```

### 병합 권고

- 이 보고서 1개: **병합 권고**. 런타임에 영향이 없는 읽기 전용 감사 산출물이다.
- 현재 NAVER 파생 공개·신규 수집·재가공: **중지 유지**.
- OPS-009: D-18 승인 후 시작하되 `review-coverage.js`, 홈 직접 참조, 9개 HTML 참조와 명시적 대체 상태를 범위에 추가 검토해야 한다.
- 공공데이터·업체 입력·사용자 제보 기반 전환: **진행 권고**. 단 데이터 계약 설계와 실제 DB/제품 구현은 BE-005·BIZ-002·MKT-009 결과와 사용자 승인을 반영한 별도 작업으로 분리한다.
