# 활성 작업

2026-08-18 OPS-042는 GitHub 인증과 비공개 저장소 push 권한을 재확인하고, 검수본을 `agent/customer-provider-seven-preview` 별도 브랜치와 draft PR로 보존하는 격리 조립을 진행 중이다. `main`·Netlify production·운영 DB는 변경하지 않는다.

| 작업 ID | 담당 | 수정 범위 | 충돌 가능성 | 상태 |
| --- | --- | --- | --- | --- |
| OPS-042 | 총괄 PM·품질 | exact snapshot·별도 branch·draft PR | 없음 | IN_PROGRESS |

2026-08-18 BE-036·FE-042·QA-055·OPS-041은 총괄 PM `PASS`·`DONE`이다. 공식 근거를 확인한 서라벌한정식 서초 본점과 눈부신일상 강남점 2곳을 추가해 고객형 profile 7곳·장소/식사 4·스냅/영상 3·가격 2·업체 문의 5 계약을 통과했다. 고유 noindex draft `6a839ca595c8db1c752d5efd`의 HTTP·3 viewport·신규 상세 2곳도 통과했다. 현재 활성 작업은 없으며 GitHub main·Netlify production·운영 DB는 변경하지 않았다.

| 작업 ID | 담당 | 수정 범위 | 충돌 가능성 | 상태 |
| --- | --- | --- | --- | --- |
| BE-036 | 백엔드·데이터 | customer-provider profile·profile test·보고서 | FE-042와 파일 비중복, UI 계약 의존 | DONE |
| FE-042 | 디자인·프런트엔드 | venues 정적·런타임 수량·보고서 | BE-036과 파일 비중복, 수량 계약 의존 | DONE |
| QA-055 | 품질·보안 | QA test·보고서 | BE-036·FE-042 완료 후 순차 | DONE |
| OPS-041 | 총괄 PM·품질 | dist·고유 draft·보고서 | production/main/DB 불변 | DONE |

## 현재 상태

2026-08-14 BE-035·FE-041·QA-054·OPS-040은 총괄 PM `PASS`·`DONE`이다. 고유 noindex draft `6a7eab527c24701b7813cc2c`에서 직접 login/account/compare 경로와 최신 console을 보완 검수했고 production·main·운영 DB는 불변이다.

2026-08-14 FE-040·QA-053·OPS-039는 총괄 PM `PASS`·`DONE`이다. 실제 5곳을 장소/식사 3·스냅/영상 2로 나누고, 목록 3/2/1열·CTA 통일·성인 1인 가격 단위와 상세 중복 0·질문 6개·이미지/지도 0을 확인했다. 새 고유 noindex draft `6a7e9aa4d562b716f46e06ab`에서 HTTP·필터·상세 5곳을 재검수했다. 현재 활성 작업은 없으며 GitHub main·Netlify production·운영 DB 변경은 0건이다.

2026-08-14 FE-040 구현과 총괄 PM 자동 검사는 `PASS_CANDIDATE`다. 실제 데이터 기준 전체 5·장소/식사 3·스냅/영상 2 분야 탭, 3/2/1열 텍스트 카드, 성인 1인 가격 단위, 상세 중복 제거, 6개 예약 질문, 빈 지도 제거와 공식 채널 정리를 완료했다. 현재 QA-053이 제품 수정 없이 390/768/1440 독립 검수를 진행한다. GitHub main·Netlify production·운영 DB 변경은 0건이다.

2026-08-14 BIZ-010·BE-033·FE-038·BE-034·FE-039·QA-052·OPS-038은 총괄 PM `PASS`·`DONE`. 고객형 목록·상세는 공식 근거가 있는 5곳만 표시하며 서비스·공식 전화·공식 채널 5곳, 숫자 가격 2곳, 출장·예약 추정 0, 내부 운영 용어 0 조건을 통과했다. 고유 noindex draft `6a7e7c53cd87f23aa554498f`의 HTTP·필터·상세 5곳·390/768/1440 검수도 통과했다. 현재 활성 작업은 없으며 운영 DB·외부 연락·GitHub main·Netlify production은 변경하지 않았다.

2026-08-14 FE-037을 총괄 PM `PASS`·`DONE` 처리했다. 사용자 브라우저 피드백에 따라 후보 상세 하단의 `보조 출처 확인` 섹션 전체를 제거했고, 새 고유 noindex draft `6a7e6a66f6a1ddf11ea6f66d`에서 390/768/1440px 삭제·내부 정보 유지·가로 넘침 0을 확인했다. 현재 실행 중인 작업은 없으며 운영 DB·GitHub main·Netlify production 변경은 0건이다.

2026-08-14 D-53 실행선 BE-032·FE-036·QA-051·OPS-037을 모두 총괄 PM `PASS`·`DONE` 처리했다. 고유 noindex draft `6a7d7aae781e2cd718ec9fbc`에서 후보 20곳의 내부 상세·관측 업종·지역·관련 준비 주제·분야별 확인 체크리스트를 검수했다. 목록 외부 링크 0, 390/768/1440 overflow·console 오류 0이며 운영 DB·GitHub main·Netlify production 변경은 0건이다. 현재 실행 중인 작업은 없고 다음 단계는 사용자 온라인 시각 확인이다.

2026-08-13 OPS-036을 총괄 PM `PASS`·`DONE` 처리했다. 고유 noindex Netlify draft `6a7d58e2955d753e991f76b4`에서 후보 20곳·수정 제안·소유권·HTTP·390/768/1440 회귀를 통과했다. 현재 실행 중인 작업은 없으며 실제 폼 제출·로그인·운영 DB·GitHub main·Netlify production 변경은 0건이다. 다음 단계는 사용자 온라인 시각 확인이다.

2026-08-13 사용자는 전수 수기 검수 대신 서울 돌잔치 업체 후보 20곳을 `정보 확인 전`으로 먼저 보여주고, 공개 후 수정 제안·업체 소유권 신청·관리자 정정으로 보완하는 D-51 방향을 승인했다. 이 결정은 운영 기준만 변경한 것이며 현재 실행 중인 제품 코드·운영 DB·배포 작업은 없다. 다음 후보는 BE-031 → FE-035 → QA-050 순서이며 실제 공개는 QA 통과 후 별도 실행 승인 대상이다.

FE-031 핵심 세부 페이지 톤앤매너·폰트 규격 통합은 OPS-033 격리 후보의
지정 HTML 7개와 신규 공통 CSS 1개만 수정했다. 자동 검사와 온라인
390/768/1440px 검수를 통과해 `DONE`이다. 원격 branch
`codex/fe-031-subpage-visual-system`=`6a227a5`, 고유 noindex draft는
`6a6ad5c2311d65fe29d4076f`다. 현재 실행 중인 제품 작업은 없으며
main·production·운영 DB는 변경하지 않았다.

OPS-033 로컬 격리 통합 후보는 제품·빌드·브라우저 회귀와 QA-047 실제 격리
Supabase Auth/RLS/RPC 재검증을 모두 통과해 `DONE`이다. 현재 실행 중인 제품
코드 작업은 없다. 최종 로컬 통합 HEAD는 QA-047 재현 하네스·보고서를 포함한
`cdd0929`이며 제품 기준은 `a66b510`으로 불변이다. D-46 승인 범위의 OPS-034도
완료했다. exact 통합 HEAD를 원격 `codex/ops-034-integrated-preview` 브랜치에
보존했고 고유 Netlify draft를 생성했다. QA-048은 이 최종 draft의
공개·비로그인 다중 뷰포트 회귀 24건을 읽기 전용으로 검수해 `PASS`했다.
현재 활성 작업은 없으며 PR·main·운영 DB·production은 변경하지 않았다.

2026-07-30 QA-047은 정확한 `Sonpum QA Isolated`에서 migration 016을 적용하고
실제 GoTrue JWT·PostgREST·TOTP AAL2를 재실행했다. 기존 Auth/RLS/RPC 10건과
review queue 7건이 통과했다. 종료 Auth·identity·factor·session·refresh·합성
행·Storage 11종은 모두 0, runtime 4종은 모두 false다. 제품·운영 DB·실제
자료·외부 발송 영향은 0건이다.

2026-07-30 OPS-033은 원본 `.git` 쓰기 제한 때문에 Worktree 대신 독립 로컬
Git 저장소를 사용했다. BE-027→FE snapshot→QA-041·042·044→OPS-029 순서로
충돌 없이 조립해 HEAD `cdd61dc`와 migration `001~016`을 확보했다. JavaScript
108개 구문, build·dist, 390/1440 브라우저와 계산기→검색, 헤더→등록, 로그인
전용 비교함 경계가 통과했다. 실패 2건은 QA-046 local commit `a66b510`에서
현행화해 직접 검사 26/26이 통과했다. 실제 격리 Auth 재실행은 QA-047로
분리했다.

2026-07-30 OPS-029는 문서 전용으로 완료했다. 현재 체크아웃 `001~005`와
검증된 통합 후보 `001~016`을 구분하고, `015·016`의 순서·기본 비활성·
AAL2·개인정보·Storage·운영 승인 게이트를 반영했다. migration SQL·제품·
DB·환경변수·package/lock·main·배포 변경은 0이다.

2026-07-30 사용자 PowerShell에서 `ops/preserve-validated-github.ps1` 실행을
완료했다. BE-019 기준 `97a5dfb`, BE-027 `8e7eb81`, QA-042 `b84d307`,
QA-044 `5f1e6d0`가 각각 원격 별도 브랜치에 존재한다. GitHub connector로
지정 파일 12/12의 blob SHA가 로컬 원본과 일치하고, BE-027은 기준보다 exact
3파일 1커밋, QA-042는 exact 2파일 1커밋, QA-044는 exact 3파일 1커밋만
앞선 것을 확인했다. `main`에는 migration 015·016과 QA-044 신규 검사가 없고
기존 validate blob도 불변이다. PR·main 병합·운영 DB·Netlify 배포 변경은
0건이며 현재 활성 실행 작업은 없다.

2026-07-29 QA-044는 로컬 validate harness의 `stderr` 부재·child spawn 실패
처리를 보완하고 총괄 PM 재검수에서 `PASS`했다. 정상·문법 오류·EPERM·ENOENT·
출력 없음 5종 전용 검사를 통과했고, 실제 sandbox에서는 `account.js`와
`EPERM`을 TypeError 없이 fail-closed로 보고한다. 제품·DB·패키지·Git
stage/commit·배포 변경은 0건이며 현재 활성 작업은 없다.

2026-07-29 FE-028과 FE-029를 서로 겹치지 않는 범위로 구현했고 QA-045 통합
검수에서 `PASS`했다. 계산기는 5개 대분류의 세부 행사·예상 인원 1~500명·다섯
공간의 1인 식비를 결과와 저장에 반영한다. 공개 헤더와 모바일에서 비교함을
제거하고 계산기·체크리스트를 각각 노출했으며, 비교함은 로그인 마이페이지에서
진입한다. API·DB·migration·package/lock·운영 배포·GitHub 변경은 0건이다.

2026-07-29 QA-041의 SQL 역할 E2E에 이어 QA-042가 실제 `Sonpum QA Isolated`에서 GoTrue 서명 JWT·PostgREST HTTP·TOTP AAL2를 통과했다. 익명·customer private base, content·provider 위장, operations AAL1은 차단되고 customer proposal과 operations AAL2만 허용됐다. 종료 Auth·identity·factor·session·refresh·합성 행·Storage 11종은 0, runtime 4종 false다. QA-041과 QA-042는 `DONE`이며 QA-042 재현 하네스·보고서는 commit `b84d307`로 원격 별도 브랜치에 보존했다.

2026-07-29 FE-027은 기존 5단계 안에 공간별 조건 질문을 추가하고 식대·이용 방식을 계산·내역·저장 상태에 연결했다. QA-043 1차에서 식대 label/실제 범위와 코랄/흰색 대비 두 건을 발견했고 Revision 1에서 `3.5만~5만`, `12만~18만`, `#da3c2d` 4.5013:1로 보완했다. 전용 검사·build·dist·390/1440 검수 PASS, 배포·Git 반영 0이다.

2026-07-27 BE-019는 별도 worktree의 commit `b969191`에서 migration 015와 전용 검사·보고서만 추가했고, QA-041 호환 결함을 `97a5dfb`에서 보완했다. 정적 계약 28/28, 명시적 `MODEL_ONLY` 상태 모델 60/60, PGlite와 독립 reviewer가 `PASS`했다. 기존 migration 001~014·제품·패키지 diff는 0이며 운영 DB·실제 견적·Storage·main·배포에는 적용하지 않았다.

2026-07-27 QA-040은 D-44 범위에서 오래된 합성 탈퇴 요청 1건만 취소한 뒤 migration 013→014 최초·재적용, stale JWT DB·Storage·Auth metadata, NULL 문의, 두 세션 cutover, 실패 재시도, JWT drain, 비식별 완료 이력과 cleanup을 통과했다. 전용 합성 Auth·요청·tombstone·job·checklist·Storage·임시 역할·함수는 모두 0건이고 기존 D-31 Auth 9명은 불변이다. QA-003도 최종 `PASS/DONE`으로 갱신했다. 이어서 OPS-024가 별도 branch commit `e8510ca`에서 Supabase 001~014 설치 순서와 admin-schema·Edge/runtime 게이트를 문서화해 `DONE`이다. 운영 DB·실제 계정·GitHub `main`·Netlify production에는 반영하지 않았다.

BE-009, OPS-016, QA-026, QA-023, BE-013은 독립 검수 `PASS`로 완료됐다. D-27에 따라 NAVER 전용 파일 19개와 혼합 로컬 DB의 NAVER 블로그 원문 28,879행을 삭제했고, 다른 DB 테이블·제품 코드·운영 DB는 변경하지 않았다.

OPS-022는 기존 `PROJECT_HANDOVER.md`에 사업 방향·수익화 정책·업체 데이터 수집 구조·현재 Git/배포 상태·승인 대기·다음 실행 순서를 통합해 `DONE` 처리했다. 제품 코드·DB·외부 상태 변경은 없었고, 당시 활성 작업은 없었다.

D-31은 2026-07-25 사용자 승인으로 확정됐다. 별도 무료 프로젝트 `Sonpum QA Isolated`를 만들고 합성 역할 9개·업체·문의·증빙 metadata를 준비해 OPS-023과 QA-020을 `PASS`로 완료했다. 운영 Supabase·실제 데이터·비용·외부 알림·배포 영향은 0건이다.

D-37로 전국 업체정보 혼합 확보 방향을 확정했다. `ops/reports/PM-2026-07-25-nationwide-provider-acquisition-plan.md`에 15개 분야를 공공데이터 후보 경로 7개와 직접 등록·고객 제안 경로 8개로 나눴다. BE-016·OPS-025·BIZ-009는 총괄 PM 검수 `PASS`로 `DONE`이다. 공식 원천 3종은 문서 증거와 field 완전 분류를 마쳤지만 모두 `BLOCKED_REGISTRY`이며, 8개 공백 분야 SOP와 견적 기여·180일 상세 열람 정책안만 확정했다. 실제 API 호출·다운로드·업체 연락·견적 원본 처리·DB·공개·배포는 0건이다.

OPS-026·QA-032·BE-017은 총괄 PM 검수 `PASS`로 `DONE`이다. 신규 공식 근거 6개의 exact Git 경계, 견적 기여 정책의 32개 개인정보·악용 위협, 직접 등록·고객 제안·견적의 분리 데이터 계약을 확정했다. 현행 `taran_provider_claims.business_number`, generic `taran_contributions/file_paths`, 포인트 승인 RPC는 새 흐름에 사용하지 않는다. 실제 제품·DB·견적·개인정보·외부 상태 변경은 0건이다.

OPS-027·QA-033·BE-018은 총괄 PM 검수 `PASS`로 `DONE`이다. 신규 근거 6개 exact 로컬 노출, 현행 SQL P0 6개·P1 10개 차이, 합성 수용 테스트 52개·레거시 회귀 6개를 확정했다. Git index·원격·제품·DB·실제 개인정보·외부 상태 변경은 0건이다.

D-39 승인에 따라 OPS-028 exact 7개를 commit `9cdfb6c`로 `codex/ops-028-be016-evidence`에 push했다. PR·main·배포는 0건이다. D-38도 승인됐지만 실제 견적·원본·운영 DB·외부 공개는 QA-003 PASS와 별도 운영 승인 전 금지한다.

QA-003 1차에서 일반 회원 maintenance, anon 응답지표 변경, 문의 RLS 무한 재귀, content 증빙 열람, 동의 없는 접수, 탈퇴 잔존을 재현했다. BE-014가 additive migration과 정적 테스트를 local branch commit `d144922`로 구현했고, 격리 프로젝트 최초·멱등 적용과 핵심 역할 재검증을 통과했다. 운영 DB·main·배포에는 적용하지 않았다.

BE-015는 업체 수정 요청·등록 승인·업체 응답을 원자적 RPC로 구현하고 격리 역할·rollback·멱등 E2E를 통과했다. FE-019는 CHG-A~C를 건드리지 않는 두 client 파일에서 관리자 등록 심사와 문의 동의 payload를 새 계약에 연결했다. 각각 local commit `b16ecd8`, `8096618`이며 원격 push·main·운영 적용·배포는 0건이다.

FE-020은 D-41 승인 범위의 CHG-B를 보존하고 공개 safe view·후기 0건 업체·업체 수정 요청 UI를 commit `aa8d491`로 완료했다. QA-003 수정 2차에서 목록·상세·수정 요청은 통과했지만 후기 form의 base table 직접 쓰기가 BE-014 최소권한과 충돌해 `REVISION_REQUIRED_AFTER_FIX_2`다.

BE-020 migration 008은 격리 Supabase에 최초·멱등 적용했고 후기 역할 E2E 13/13을 통과해 `DONE`이다. FE-021 결합본은 고객 로그인·공개 업체 목록·상세와 등록 4단계를 통과했으나, 후기 접수 성공 뒤 화면이 실패를 표시해 `REVISION_REQUIRED`다. operations 관리자 화면은 본인 역할 조회 권한이 없어 중단됐고 공개 provider/review view는 Security Advisor 오류 2건이 남았다.

QA-035는 전용 보고서와 QA-003 3차 판정을 작성해 `REVISION_REQUIRED`로 종료했다. 이번 실행의 합성 후기·역할 행·Storage object·신규 Auth 사용자는 모두 0으로 정리했다. 현재 실제 실행 중인 코드 작업은 없다. 다음 독립 작업은 FE-022와 BE-021이며 아직 자동 시작하지 않았다. QA-036은 Chrome 확장 로컬 파일 URL 접근 허용과 세 보정 완료를 기다린다.

| 작업 | 담당 영역 | 수정 허용 파일 | 공유 계약 | 상태 |
| --- | --- | --- | --- | --- |
| OPS-040 | 총괄 PM·품질 | dist·고유 draft·보고서 | QA 제한 항목 보완, production/main/DB 불변 | IN_PROGRESS |
| BE-035 | 백엔드·데이터 | 고객 profile·전용 검사·보고서 | 소개만 변경, 서비스·가격·근거 불변 | DONE |
| FE-041 | 디자인·프런트엔드 | 목록·상세·공통 헤더 8파일·보고서 | Revision 1 포함, Auth 기능 보존 | DONE |
| QA-054 | 품질·보안 | 헤더 검사 현행화·신규 검사·보고서 | 직접 route·console/network는 OPS-040 연계 | PASS_WITH_LIMITATION |
| OPS-039 | 총괄 PM·품질 | dist·고유 draft·보고서 | noindex, production/main/DB 불변 | DONE |
| FE-040 | 디자인·프런트엔드 | 고객형 목록·상세 6파일·보고서 | 실제 5곳 분류·가격·지도 승인 경계 유지 | DONE |
| QA-053 | 품질·보안 | 전용 검사·보고서 | FE-040 후 제품 수정 없이 독립 검수 | DONE |
| BIZ-010 | 사업·서비스 기획 | 전용 정책 보고서 | 고객 선택 최소 필드·5곳 승격 기준 | DONE |
| BE-033 | 백엔드·데이터 | 전용 데이터 감사 보고서 | 공식 근거만, 추정·연락·DB 0 | DONE |
| FE-038 | 디자인·프런트엔드 | 전용 UX 명세 보고서 | 데이터 있는 필드만 활성화 | DONE |
| BE-034 | 백엔드·데이터 | 고객 공개 projection·전용 검사·보고서 | 공식 근거 5곳만 customer_ready | DONE |
| FE-039 | 디자인·프런트엔드 | 목록·상세 HTML/JS/CSS 6개·보고서 | BE-034 고객 필드만 조건부 렌더링 | DONE |
| QA-052 | 품질·보안 | 고객형 전용 검사·보고서 | 제품 수정 없이 독립 검수 | DONE |
| OPS-038 | 총괄 PM·품질 | 고유 noindex draft·보고서 | QA-052 PASS 후 실행, production 불변 | DONE |
| FE-037 | 총괄 PM·디자인/프런트엔드 | 후보 상세·전용 CSS·안전 검사·격리 draft | 보조 출처 UI만 제거, 내부 정보·noindex 유지 | DONE |
| QA-003 | 품질·보안 | 격리 Supabase·전용 보고서 | 합성 데이터·외부 알림 0 | DONE |
| BE-032 | 백엔드·데이터 | 후보 공개 projection·전용 검사·보고서 | 관측/분석값과 검증 사실 분리 | DONE |
| FE-036 | 디자인·프런트엔드 | 후보 목록·상세·전용 CSS·보고서 | BE-032 완료 후 시작 | DONE |
| QA-051 | 품질·보안 | 전용 안전 회귀·보고서 | BE-032·FE-036 완료 후 시작 | DONE |
| OPS-037 | 총괄 PM·품질 | 고유 noindex draft·보고서 | QA-051 PASS 후 실행 | DONE |
| BE-020 | 백엔드·데이터 | migration 008·전용 테스트 | 후기 pending 최소권한·운영 미적용 | DONE |
| FE-021 | 디자인·프런트엔드 | provider.js·admin/providers.js·전용 테스트 | base table 직접 접근 0·운영 미배포 | REVISION_REQUIRED |
| QA-035 | 품질·보안 | 격리 브라우저·전용 보고서 | 실제 데이터·외부 알림 0 | REVISION_REQUIRED |
| FE-022 | 디자인·프런트엔드 | provider.js·전용 테스트·보고서 | 기존 후기 RPC 불변 | DONE |
| BE-021 | 백엔드·데이터 | migration 009·전용 테스트·보고서 | 본인 admin profile 최소권한 | DONE |
| BE-022 | 백엔드·데이터 | migration 010·전용 테스트·보고서 | 공개 projection 최소권한 | DONE |
| FE-023 | 디자인·프런트엔드 | provider-register.js·전용 테스트·보고서 | 등록 동의 버전 불변 | DONE |
| QA-036 | 품질·보안 | 격리 브라우저·전용 보고서 | 합성 파일·외부 알림 0 | REVISION_REQUIRED |
| BE-023 | 백엔드·데이터 | migration 011·전용 테스트·보고서 | operations 전용 독립 관리자 큐 | DONE |
| FE-024 | 디자인·프런트엔드 | admin/providers.js·전용 테스트·보고서 | BE-023 독립 RPC 3개 | DONE |
| QA-037 | 품질·보안 | 읽기 전용 독립 검수 | BE-023·FE-024 범위·최소권한 | DONE |
| QA-038 | 품질·보안 | 읽기 전용 감사 | 관리자 잔여 direct read/write | DONE |
| BE-024 | 백엔드·데이터 | migration 012·전용 테스트·보고서 | 관리자 저장·상태·원자적 소유권 검토·최소 현황 RPC | DONE |
| FE-025 | 디자인·프런트엔드 | providers.js·전용 테스트·보고서 | BE-024 동작 RPC | DONE |
| FE-026 | 디자인·프런트엔드 | dashboard.js·inquiries.js·전용 테스트·보고서 | BE-023·BE-024 조회 RPC | DONE |
| QA-039 | 품질·보안 | 격리 Supabase·브라우저·전용 보고서 | BE-024·FE-025·FE-026 결합본 | DONE |
| BE-025 | 백엔드·데이터 | 신규 worker·migration·전용 테스트 | Auth 관리자 API·완료 이력 | BLOCKED_AFTER_REVISION_2 |
| BE-026 | 백엔드·데이터 | migration 014·worker·전용 테스트·보고서 | Auth 독립 tombstone·JWT drain·no-lock guard | DONE |
| QA-040 | 품질·보안 | 격리 Supabase·신규 합성 Auth·전용 보고서 | BE-025+BE-026 결합본 | DONE |
| OPS-024 | 총괄 PM/백엔드·데이터 | 설치 문서 5개·전달문·보고서 | 001~014·운영 활성화 게이트 | DONE |
| BE-019 | 백엔드·데이터 | migration 015·전용 정적/상태모델 테스트·보고서 | `b969191` + `97a5dfb`, 운영 DB·실제 데이터·UI 0 | DONE |
| QA-041 | 품질·보안 | 격리 Supabase SQL 역할 E2E·보고서 | SQL 역할 PASS + QA-042 실제 Auth E2E PASS | DONE |
| QA-042 | 품질·보안 | 실제 GoTrue JWT·PostgREST HTTP·AAL2 MFA | commit `b84d307`, 실제 E2E·cleanup·원격 exact 2파일 PASS | DONE |
| BE-027 | 백엔드·데이터 | migration 016 review queue 최소권한 RPC·전용 검사·보고서 | commit `8e7eb81`, PGlite·회귀·원격 exact 3파일 PASS | DONE |
| FE-027 | 디자인·프런트엔드 | 계산기 HTML·전용 JS/CSS·테스트·보고서 | Revision 1 식대 범위·4.5:1 대비 보완, QA-043 PASS | DONE |
| QA-043 | 품질·보안 | FE-027 읽기 전용 조건 분기·접근성 검수·보고서 | Revision 1 재검수 PASS | DONE |
| FE-028 | 디자인·프런트엔드 | 계산기 exact 5개 파일 | 세부 행사·예상 인원·공간별 식비, 기존 검색 계약 유지 | DONE |
| FE-029 | 디자인·프런트엔드 | 공통 헤더·마이페이지·비교함 접근·전용 테스트 | 공개 비교함 제거, 로그인 마이페이지 전용 접근 | DONE |
| QA-045 | 품질·보안 | 읽기 전용 통합 검수 보고서 | 전용 검사·build/dist·390/1440·Auth 3상태 PASS | DONE |
| QA-044 | 품질·보안 | validate harness·전용 테스트·보고서 | 전용 5/5·build·dist PASS, spawn 실패 fail-closed 보고 | DONE |
| OPS-029 | 총괄 PM·품질 | migration 015·016 설치 순서와 운영 승인 게이트 문서 | 현재 checkout 001~005·통합 후보 001~016 구분, SQL·DB·제품 변경 0 | DONE |
| OPS-030 | 총괄 PM·품질 | 검증 브랜치 SHA·파일·선후관계 읽기 전용 대조 | BE-027 기준·QA tip exact 계획, Git·제품·DB 변경 0 | DONE |
| OPS-031 | 총괄 PM·품질 | FE-028·FE-029·QA-045 exact 16파일 GitHub 보존 | commit b424156, 원격·로컬 blob 16/16 | DONE |
| OPS-032 | 총괄 PM·품질 | BE-027 × FE snapshot 파일·계약 충돌 읽기 전용 감사 | 직접 교집합 0·3-way 충돌 0, 의미상 4흐름 회귀 필요 | DONE |
| OPS-033 | 총괄 PM·품질 | BE-027·FE snapshot·QA·OPS-029 로컬 격리 통합·전체 회귀 | local HEAD cdd0929·제품 기준 a66b510, 직접 검사 26/26·build·브라우저·실제 Auth PASS | DONE |
| OPS-034 | 총괄 PM·품질 | exact 통합 후보 원격 별도 브랜치·고유 noindex draft | branch `codex/ops-034-integrated-preview`=`cdd0929`, deploy `6a6aba4d5ef57d8288accfea`, 핵심 5화면·중첩 JS/CSS 200·noindex | DONE |
| QA-048 | 품질·보안 | 최종 통합 noindex draft 공개·비로그인 다중 뷰포트 회귀 | 24/24 화면 조합 PASS·overflow 0·깨진 이미지 0·console 0·제품/DB 쓰기 0 | DONE |
| QA-046 | 품질·보안 | 현행 5행사·공개 헤더 테스트 계약 정합화 | local commit a66b510, 제품 diff 0 | DONE |
| QA-047 | 품질·보안 | 통합 후보 실제 격리 Auth·RLS·RPC 최종 재검증 | 실제 JWT·AAL2·migration 016·cleanup 0 | DONE |
| QA-034 | 품질·보안 | 선행 후 count-only 지정 | 원문·변경·download 0 | BLOCKED_READONLY_APPROVAL |

OPS-018은 1차 보완 후 독립 reviewer `PASS`, OPS-019는 총괄 PM 단일 소유 구현과 독립 reviewer `PASS`로 완료됐다. `.gitignore`는 검수 완료된 도구·합성 fixture·공식 증거 9개만 열고 DB·원본·workspace·temp·cache·미검수 파일은 계속 차단한다.

D-36 승인과 GitHub 인증 뒤 OPS-021을 완료했다. exact 허용 9개·deny 10개·고신뢰 비밀 0·hash 9/9, 합성 fixture 31/31·unittest 11/11·14/14를 재확인하고 `.gitignore` 포함 승인 10개만 commit `1e7f654`로 `agent/ops-019-public-seed-exact-allowlist` 브랜치에 push했다. PR·main 병합·Netlify 배포는 0건이며 관련 없는 dirty 변경은 stage하지 않았다.

BE-013은 공식 Swagger·포털 정책의 정규화 증거와 SHA-256을 남기고 39개 physical field를 18개 비공개 관측 후보와 21개 금지·범위 밖 field로 분류했다. 그러나 `T,S,F,K,P,Q,G,A,R` 9개 실행 blocker가 모두 남아 `15154916`은 `BLOCKED_REGISTRY`다. 실제 API·서비스 키·업체 레코드·DB·제품 접촉은 0건이다.

QA-023은 허용된 신규 파일 4개만 작성했고 2차 보완 후 합성 31개, QA unittest 11개, 기존 seed 회귀 14개와 독립 adversarial 검수를 통과했다. 실제 전국 수집은 데이터셋별 공식 계약과 실행 승인을 모두 거친 뒤 별도 카드에서만 시작한다.

사용자 결정 ADR-018에 따라 NAVER 문의·보조 활용 경로는 종료했다. 지역검색·블로그·플레이스·Maps를 후보 발견·중복 점검·AI 분석·검수 순위·공개 업체 정보에 사용하지 않는다. D-27 삭제와 사후 무결성 검사를 완료했으며, 잔존 수집 코드는 실행 금지 상태로 유지한다. 공공데이터·업체 직접 등록·고객 제안 후 독립 확인·관리자 검수 경로만 진행한다.

BE-007은 2차 수정 뒤 synthetic unittest 14개를 통과했고 QA-019 최종 `PASS`를 받아 `DONE`이다. QA-019도 실제 데이터·네트워크·DB 0건으로 완료됐다.

BE-006은 승인 registry, field assertion, 공개 projection, 최근성·보유, 7개 출력과 24개 기계 fixture를 확정했다. 2차 보완 후 독립 reviewer `PASS`를 받아 `DONE`이다.

OPS-012는 도메인 구매 전 완료 항목과 구매 직후 Netlify·DNS·HTTPS·Supabase Auth·SEO·검수·롤백 순서를 정리했다. 비공개 경로별 noindex와 비밀번호 재설정 누락을 출시 차단 항목으로 분리하고 독립 reviewer `PASS`를 받아 `DONE`이다.

BIZ-005는 운영자 선등록형 검증 디렉터리, 업체 소유권 수정, 고객 정보 제안, 관리자 재검수, 출시 첫날 가치와 수익 준비 경계를 확정했다. 기존 BE-006과 신규 BE-007 범위 중복을 1차 수정한 뒤 독립 reviewer `PASS`를 받아 `DONE`이다.

FE-010, FE-015, FE-016은 각각 모바일 메뉴 접근성 상태명, 결혼 준비 제목 중복, 로그인 업체 등록 링크를 최소 수정했다. 정적 검사 82 JS·40 HTML, build, dist 40 HTML, 5종 제목·링크·상태 재현과 독립 QA를 통과해 `DONE`이다. 전체 `pnpm test`의 QA-016·QA-017 실패는 승인된 현행 제품과 과거 CHG-A 검사 기대의 기존 충돌이다.

세 변경을 포함한 최신 고유 Netlify draft는 `https://6a62e4d16c76099df908d741--taran-family-event-test.netlify.app`이다. 홈 제목·기본 서울/돌잔치 선택·준비 도구, `결혼 준비 순서`, 로그인 화면의 `/provider-register` 링크와 가로 넘침 0을 확인했다. production 별칭과 GitHub main은 변경하지 않았다.

OPS-007은 `netlify.toml`의 해당 redirect 블록에 `force = true` 한 줄만 추가했다. draft `6a62c78790a1d9262eab53d3`에서 무추적 301과 `/admin/providers.html` Location, 브라우저 최종 관리자 로그인 안내, 390·768·1440px 가로 넘침 0, 레거시 script 미로드·콘솔 오류 0을 총괄 PM과 독립 QA가 확인했다.

QA-018은 정적 검사 82 JS·40 HTML, build·dist 40 HTML, 390·768·1440px 핵심 화면 검수에서 공개·비로그인 기능 대부분을 통과시켰다. 실제 Auth·RLS·RPC·Storage·문의·업체 신청은 격리 스테이징과 역할 계정 없이 실행하지 않았다. 기존 OPS-007/R-25, FE-010/R-49, QA-016/R-48, QA-017/R-51을 재현했고 신규 경미 후보 FE-015·FE-016을 등록했다.

FE-014에서는 밝은 가족 돌잔치 실사 이미지와 분리된 검색 카드로 홈 상단을 교체하고, 공개 업체 0건 동안 비용 계산기·체크리스트를 우선 행동으로 제공했다. 업체 등록 현재 단계 검증·한국어 인라인 오류, 계산 완료 상태, 준비백과 6개 초기 표시와 메타 간격, 기능 화면 축소 히어로, 업체 찾기 빈 상태, 테스트 호스트 noindex를 검증했다. 정적 검사 82 JS·40 HTML, 배포 번들 40 HTML, 390·768·1440px 주요 화면 검수와 독립 QA를 통과했다.

QA-015, OPS-009, FE-009, FE-011, FE-012는 총괄 PM·독립 reviewer 검수 `PASS`로 완료됐다. 검수 완료 변경은 GitHub `agent/approved-marketplace-checklist-update` 분리 브랜치에 반영했지만 GitHub main과 Netlify production에는 반영하지 않았다. FE-013은 사용자가 가장 최근 생성 이미지를 기준으로 구현하도록 승인한 범위를 완료했고 총괄 PM 기능·다중 뷰포트 검수를 통과했다. 고유 Netlify draft만 생성했으며 GitHub와 production은 변경하지 않았다.

QA-010, BIZ-002, BE-005, MKT-009는 전용 보고서만 작성했고 총괄 PM 검수에서 모두 `PASS`를 받아 `DONE` 처리했다. NAVER 비의존 전략은 ADR-016에 기록했고, 당시 `legacy_source_hold`로 재정의한 4,960건 관련 파일·원문은 이후 D-27·QA-026 절차로 삭제를 완료했다.

FE-013은 짙은 녹색·웜 아이보리·코랄 주요 행동, 실사 이미지, 사진 위 동일 계열 오버레이, 둥근 패널과 모바일 전용 배치를 공통 디자인으로 적용했다. 기존 URL·검색 쿼리·저장 키·최대 3곳 비교·공개 행사 분류 5종은 유지했다. 390·768·1440px 화면에서 가로 넘침과 콘솔 오류가 없고 정적 검증·빌드·배포 번들 검사를 통과했다. 고유 draft `6a61c5a4b798d9ff47b5144e`는 `X-Robots-Tag: noindex`이며 production 별칭을 바꾸지 않는다.

FE-012는 상견례·스몰웨딩을 `결혼 준비(meeting)`, 가족모임·추모 가족행사를 `기타 가족행사(other)`로 통합했다. 새 DB 값이나 라우트를 만들지 않고 기존 `smallWedding`, `familyGathering`, `memorial`, `home` 링크와 체크리스트 저장 키를 읽기 호환한다. 두 차례 보완 뒤 독립 QA를 통과했고 고유 draft `6a61a2981e9fc538d795f061`를 생성했다. CHG-A~C, 업체 목록·상세 코드, 패키지·잠금 파일은 수정하지 않았다.

FE-009는 C안 안전 축소 구현 카드와 D-22·D-24, OPS-009 선행 조건을 충족해 홈 3개 파일만 순차 수정했다. draft 주소는 사용자 시각 확인용이며 최종 배포가 아니다.

FE-011은 12개 전용 화면 파일만 수정했고 CHG-A~C와 공통 헤더·토큰·패키지·라우팅·DB를 수정하지 않았다. 고유 draft `6a619622202cedff2ed28f92`는 사용자 시각 확인용이며 최종 배포가 아니다.

D-29 정책과 D-22·D-24는 승인됐지만 실제 개인정보 처리·업체 연락·최종 배포는 법률 확인·기술 E2E와 별도 승인 전 시작하지 않는다. OPS-009는 API·DB·라우팅·환경변수·패키지와 로컬 원본을 변경하지 않는다.

준비백과·커뮤니티와 FE-009 변경은 GitHub main 또는 Netlify production에 배포하지 않았다. 별도 draft에서만 NAVER 파생 공개 파일 0건과 새 홈을 확인했으며, 기존 production 전환은 QA-012와 사용자 최종 승인 전 완료로 보지 않는다.

당시 QA-006의 고유 draft 재검수는 통과했지만 production 별칭이 미배포라 `BLOCKED`를 유지했다. 2026-07-30 D-30 production 재검수 PASS로 현재는 `DONE`이다. QA-016은 승인된 홈 정보 나눔 링크와 과거 테스트의 충돌을 다루지만 CHG-A 테스트 정본 소유권이 정해질 때까지 시작하지 않는다. MKT-010은 D-26·법률 확인·제품 E2E, BE-006·FE-008은 상세 계약과 CHG-B 정리가 선행이다.

## 2026-07-30 FE-033 진행

| 작업 | 담당 영역 | 수정 허용 파일 | 공유 계약 | 상태 |
| --- | --- | --- | --- | --- |
| FE-033 | 디자인·프런트엔드 | calculator.css·calculator.js·전용 테스트 | 계산식·저장·검색 계약 불변 | DONE |

FE-033은 별도 clean 후보 저장소에서 구현·자동 검사·PC 및 모바일 브라우저 검수를 통과했다.
결과 영역은 전체 입력 흐름 아래에 배치되며 `결과 확인하기` 선택 후 결과 시작점으로 이동하고
키보드 초점도 결과에 유지된다. commit `41f90e8`, 고유 noindex draft
`6a6ae305b9f8279eabcca42e`이며 GitHub main, Netlify production, 운영 DB는 변경하지 않았다.

## 2026-07-30 FE-034 진행

| 작업 | 담당 영역 | 수정 허용 파일 | 공유 계약 | 상태 |
| --- | --- | --- | --- | --- |
| FE-034 | 디자인·프런트엔드 | calculator.html·calculator.css·calculator.js·전용 테스트 | 5단계·저장·검색·체크리스트 계약 불변 | DONE |

FE-034는 별도 clean 후보 저장소에서 구현·자동 검사·PC·모바일 실사용 흐름 검수를 통과했다.
PC의 행사 세부·인원 바로가기·공간 세부 조건은 오른쪽 작업공간에 배치했고,
참석·식사 인원 분리, 직접 공간비, 비용 영향과 계약 확인 질문을 결과에 연결했다.
commit `15cf755`, 고유 noindex draft `6a6aea33214bb52650f7896c`이며
이후 D-30 승인으로 GitHub main·Netlify production 반영까지 완료했다.

## 2026-07-30 D-30 배포 완료

| 작업 | 담당 영역 | 변경 범위 | 상태 |
| --- | --- | --- | --- |
| D-30 | 총괄 PM·품질 | GitHub main·Netlify production·배포 안전 설정 | DONE |

제품 기준 commit `15cf755`를 GitHub main에 fast-forward 반영했다. production 최종 검수에서
테스트 호스트 전역 noindex 누락과 D-13의 `/vendor-dashboard.html` 강제 301 누락을 발견해
기존 승인 정책 범위 안에서만 보완했다. 최종 main HEAD는 `942891b`, Netlify deploy는
`6a6b08fdbf620b000895e2c1`이다. 계산기 전체 흐름·PC/모바일·핵심 10경로·301·noindex가
PASS했으며 운영 DB·실제 계정·Storage·Edge·외부 게시·업체 연락은 변경하지 않았다.

## 2026-07-30 FE-032 완료

FE-032는 별도 clean 후보 저장소에서 구현·검수 후 `PASS/DONE` 처리했다.
원격 branch `codex/fe-032-page-polish-seo`, commit `ce3a409`, 고유 noindex
draft `6a6ade53311d652a67d406fa`를 만들었다. GitHub main, Netlify production,
운영 DB, 실제 데이터는 변경하지 않았다. 현재 실행 중인 코드 작업은 없다.

## 검토 대기 중인 기존 미할당 변경

아래 변경은 별도 작업 ID와 수정 범위를 부여받기 전에 존재했다. 활성 개발 작업으로 간주하지 않으며, 계속 진행·분리·폐기 여부를 총괄 PM이 검토해야 한다.

| 구분 | 변경 파일 | 추정 영역 | 충돌 가능성 | 판정 |
| --- | --- | --- | --- | --- |
| CHG-A 브라우저 검사 기반 | `package.json`, `pnpm-lock.yaml`, `_verify/browser-smoke.cjs`, 미추적 `scripts/tests/browser-smoke.cjs` | 품질·보안/공통 설정 | 모든 패키지 변경, CI, 두 스모크 파일의 정본 충돌 | 계속 진행 전 검토 필요 |
| CHG-B 업체 화면 조정 | `provider.html`, `scripts/pages/provider.js`, `scripts/pages/venues.js`, `styles/components/filter.css` | 디자인·프런트엔드 | FE-002의 `scripts/pages/venues.js`, 대체 이미지 안내 정책, 접근성 기준 | 계속 진행 전 검토 필요 |
| CHG-C 미추적 기준 자료 | `docs/**`, `favicon.ico` | 총괄 PM/디자인 | 향후 문서 기준선·브랜드 자산과 충돌 가능 | 출처·완료 상태 검토 필요 |

## 통제

- CHG-A~C를 새 작업이 수정하거나 되돌리지 않는다.
- FE-002는 CHG-B가 정리되기 전 시작하지 않는다.
- 패키지·잠금 파일을 요구하는 신규 작업은 CHG-A가 정리되기 전 시작하지 않는다.
- OPS-007은 D-13 승인 범위에서 완료됐고, 2026-07-30 D-30 production 적용·재검수까지 통과했다.
- FE-006은 FE-009로 대체됐다. FE-009는 D-22/OPS-009 완료 전 시작하지 않고 업체·후기·가격·참여 기능을 노출하지 않는다.
- FE-007은 지정된 커뮤니티 5개 파일만 수정하고 가짜 회원·가짜 반응 수를 만들지 않는다. 구현과 배포를 분리한다.
- OPS-009은 D-22 승인 완료. QA-010의 7개 파생 파일·9개 HTML·관련 소비 경로를 단일 통합 작업으로 확정하고, 로컬 원본·수집기·DB는 삭제하거나 수정하지 않는다.
- MKT-008은 준비백과 파일 2개와 전용 보고서만 수정하고 미검수 글을 공개 상태로 두지 않는다.
- QA-009은 읽기 전용 법률·약관 검토이며 법률 자문을 확정하거나 제품을 수정하지 않는다.

## 2026-07-31 OPS-035 진행

| 작업 | 담당 영역 | 수정 허용 파일 | 공유 계약 | 상태 |
| --- | --- | --- | --- | --- |
| OPS-035 | 총괄 PM·마케팅·운영 | `ops/TASK_SPECS.md`, `ops/ACTIVE_WORK.md`, `ops/APPROVALS.md`, 이번 대화 전용 `outputs/` 산출물 | 공공데이터 출처·확인일 기록, 네이버 결과 별도 DB화 금지, 업체 직접 확인 전 사실 확정 금지 | DONE |

제품 코드·운영 DB·기존 업체 원본은 수정하지 않는다. 신규 외부 API 수집, 업체 연락·방문, 공개와 유료 계약도 이 작업에서 실행하지 않는다.

OPS-035는 업체후보·연락방문기록·업체상세·견적기록·카테고리출처·전화방문질문·선택목록을 포함한 엑셀 워크북을 작성했다. 기존 서울시 공공데이터 후보 10곳은 모두 `공공데이터 후보 / 행사 적합성 확인 필요 / 공개 금지` 상태로 유지했다. 제품 코드·운영 DB·외부 API·업체 연락·배포는 변경하지 않았다.

## 2026-07-31 MKT-012 진행

| 작업 | 담당 영역 | 수정 허용 파일 | 공유 계약 | 상태 |
| --- | --- | --- | --- | --- |
| MKT-012 | 총괄 PM·마케팅·운영 | 운영 카드와 이번 대화 전용 업체정보 워크북 | NAVER는 수동 발견 보조만 사용하고 공식 채널에서 재확인된 대표 연락처만 기록 | DONE |

제품 코드·운영 DB·backend/data·API·환경변수·배포는 수정하지 않는다. 실제 업체 연락이나 문의 제출도 실행하지 않는다.

MKT-012는 NAVER 수동 검색을 업체 발견 보조로 사용하고 공식 홈페이지·공식 호텔 안내에서 대표 연락 채널을 독립 확인했다. 신규 후보 19곳을 추가해 전체 후보는 29곳이 됐으며, 공식 연락 가능 후보의 분류는 장소·음식 14곳, 돌상·장식 2곳, 촬영 2곳, 미용·메이크업 1곳이다. 공식 출처·전화·연락 채널·확인일 누락 0, 후보 ID 중복 0, 수식 오류 0을 확인했고 업체 직접 확인·공개 동의 전까지 모두 `공개 금지`로 유지했다.

## 2026-07-31 MKT-013 진행

| 작업 | 담당 영역 | 수정 허용 파일 | 공유 계약 | 상태 |
| --- | --- | --- | --- | --- |
| MKT-013 | 총괄 PM·마케팅·운영 | 운영 카드와 이번 대화 전용 업체정보 워크북·공식 파일데이터 파생 후보 | 공공데이터는 비공개 연락 전 후보만, NAVER 결과 대량 저장 금지, 업체 직접 확인 전 사실 확정 금지 | DONE |

공공데이터포털 전환 기간에는 로그인·키 관리 대신 공식 파일데이터 다운로드를 사용한다. 신규 후보는 행정상 `영업/정상`인 장소·음식, 숙박, 미용·메이크업, 제과점 후보로 구성하되 가족행사 적합성·대표 연락처·가격은 직접 확인하기 전 확정하지 않는다. 제품 코드·운영 DB·업체 연락·외부 공개·배포는 변경하지 않는다.

MKT-013은 사용자 피드백에 따라 케이크 편중을 해소했다. 전국 공식 파일데이터에서 장소·음식, 숙박, 미용·메이크업, 케이크 후보를 각 128곳씩 총 512곳으로 균형 구성했다. 전체 후보 541곳, 공공데이터 후보 522곳, 공식 채널 확인 후보 19곳이며 후보 ID 중복 0·수식 오류 0·의도하지 않은 공개 가능 0을 확인했다. 신규 512곳의 가족행사 적합성·대표 연락처·가격은 모두 직접 확인 전 상태로 유지했다.

## 2026-08-03 MKT-014 진행

| 작업 | 담당 영역 | 수정 허용 파일 | 공유 계약 | 상태 |
| --- | --- | --- | --- | --- |
| MKT-014 | 총괄 PM·마케팅·운영 | 운영 카드와 이번 대화 전용 업체정보 워크북 | 공식 채널에서 독립 확인된 업체명·연락 경로만 기록하고 가격·후기·사진은 저장하지 않음 | DONE |

MKT-014는 가족사진·베이비·돌 촬영 스튜디오 12곳과 돌잔치·가족행사 스냅 작가 8곳을 추가했다. 기존 촬영 후보를 포함한 공식 촬영 후보는 스튜디오 14곳·사진작가/스냅 8곳, 총 22곳이다. 전체 워크북은 후보 561곳, 공식 연락 후보 39곳이며 연락 채널 누락 0·후보 ID 중복 0·수식 오류 0·의도하지 않은 공개 가능 0을 확인했다. 실제 업체 연락·견적 요청·DB·사이트 공개·배포는 실행하지 않았다.

## 2026-08-10 MKT-015 진행

| 작업 | 담당 영역 | 수정 허용 파일 | 공유 계약 | 상태 |
| --- | --- | --- | --- | --- |
| MKT-015 | 총괄 PM·마케팅·운영 | 운영 카드와 이번 대화 전용 업체정보 워크북 | 가상 인물은 상담 예시로만 쓰며 실제 문의에서는 베타 운영자·비예약 목적을 공개하고 답변과 공개 동의를 분리 | DONE |

MKT-015는 기존 워크북에 `문의스크립트` 시트를 추가했다. 공통 시작·마무리, 가족사진 스튜디오 14개, 사진작가·스냅 15개, 통화 후 확인 메시지 3개로 구성했으며 가격·부가세·추가금·예약·취소·납품·백업·저작권·초상권·공개 범위를 포함한다. 전체 9개 시트와 후보 561곳·촬영 후보 22곳을 보존했고 질문 32개·필수 문구 누락 0·중복 0·수식 오류 0·공개 오표시 0을 확인했다. 실제 업체 연락·예약·공개·DB·배포는 실행하지 않았다.

## 2026-08-11 MKT-016 진행

| 작업 | 담당 영역 | 수정 허용 파일 | 공유 계약 | 상태 |
| --- | --- | --- | --- | --- |
| MKT-016 | 총괄 PM·마케팅·운영 | 운영 카드와 이번 대화 전용 업체정보 워크북 | 검색은 공식 채널 발견에만 사용하고 검색 결과·지도·리뷰·평점·사진은 저장하지 않음 | DONE |

API 키가 없는 현재 환경에서는 네이버·카카오·구글 API 호출을 실행하지 않았다. 검색으로 촬영 후보의 공식 홈페이지를 찾은 뒤 공식 페이지 또는 공공기관 공식 소개에서 확인된 공개 사실만 출처 URL·확인일과 함께 워크북에 기록했다. 스튜디오 14곳·사진작가/스냅 8곳의 서비스 범위·공간/촬영 방식·공개 결과물·예약/취소/납품·공식 문의·미확인 항목을 보강했다. 상세 22행의 출처·확인일·문의 채널·메모 누락 0, 검색 결과 파생 출처 0, 기존 후보 561곳·촬영 후보 22곳·공개 금지 상태 보존, 중복 0·수식 오류 0을 확인했다. 기존 워크북이 Excel에서 열려 있어 강제 덮어쓰지 않고 `_검색보강` 파일로 별도 저장했다. 실제 업체 연락·예약·운영 DB·사이트 공개·배포는 실행하지 않았다.

## 2026-08-12 BE-028 완료

| 작업 | 담당 영역 | 수정 허용 파일 | 공유 계약 | 상태 |
| --- | --- | --- | --- | --- |
| BE-028 | 총괄 PM·백엔드·데이터 | 운영 카드와 이번 대화 전용 업체정보 워크북 | API·공식 원천에 없는 값을 추정하지 않고 출처·확인일·미확인 상태를 필드별로 분리 | DONE |

후보 561곳 모두를 `업체상세` 561행에 연결했다. 공공데이터 후보 522곳은 업체명·주소·지역·행정 영업상태·원천 분류·공식 데이터 URL·확인일을 옮기고 가격·수용인원·주차·행사 가능·예약·취소는 `확인 필요`로 유지했다. 공식 연락 후보 39곳과 기존 촬영 상세 22곳도 보존했다. 후보-상세 ID 누락·추가·중복 0, 출처·문의 상태·메모 누락 0, 공공 후보 가격 임의 입력 0, 검색 결과 URL 0, 수식 오류 0을 확인했다.

공공데이터포털 로그인과 승인된 일반음식점 API를 확인하고 장소·음식 후보 128곳을 대조했다. 이름·주소 정확 일치 72곳 중 영업 후보 34곳, 폐업 38곳을 확인했다. 영업 후보 중 공식 전화번호가 있는 26곳만 연락 후보에 반영하고 폐업 전화번호는 연락 열에서 제외했다. 수동 검토 10곳과 미일치 46곳은 자동 병합하지 않았다. API 오류·후보/상세 ID 불일치·중복·검색 결과 URL·수식 오류·서비스키 노출은 모두 0이었다. Google/Kakao는 D-49 승인 전 보류하고 NAVER 지역정보 DB화는 제외한다. 제품 코드·운영 DB·사이트·GitHub·배포 변경은 없다.

## 2026-08-12 BE-029 진행

| 작업 | 담당 영역 | 수정 허용 파일 | 공유 계약 | 상태 |
| --- | --- | --- | --- | --- |
| BE-029 | 총괄 PM·백엔드·데이터 | 운영 카드·비저장 canary 보고서 | 지역·블로그 응답 원문과 검색 결과 콘텐츠는 저장하지 않고 상태·건수·필드 구조만 기록 | DONE |

NAVER API HUB Client ID·Secret이 Windows 환경변수에 설정된 것을 값 비출력 방식으로 확인했다. 지역 검색 1회와 블로그 검색 1회만 실행하며 대량 수집·업체 후보 병합·워크북·DB·제품 반영은 하지 않는다.

지역 검색 `/search/v1/local`과 블로그 검색 `/search/v1/blog`을 `서울 돌잔치`로 각각 1회 호출했다. 두 호출 모두 HTTP 200, 응답 항목 5개였다. 지역 항목 필드는 업체명·링크·분류·설명·전화·주소·도로명주소·좌표, 블로그 항목 필드는 제목·링크·요약·블로거명·블로그 링크·게시일 구조임을 확인했다. 실제 값은 출력·파일 저장하지 않았고 제품·워크북·DB·GitHub·배포 변경도 없다.

## 2026-08-12 BE-030 진행

| 작업 | 담당 영역 | 수정 허용 파일 | 공유 계약 | 상태 |
| --- | --- | --- | --- | --- |
| BE-030 | 총괄 PM·백엔드·데이터 | 운영 카드·전용 결과 JSON/XLSX/보고서 | 지역 결과는 후보 사실, 블로그 결과는 언급 주제·원문 링크 보조 신호로 분리 | DONE |

공식 활용예시에 지역 검색과 블로그 후기·이미지를 결합하는 여행·맛집 앱 사례가 있음을 사용자 제공 화면에서 확인했다. 서울 돌잔치 관련 업체 20곳만 분야별로 균형 있게 시험하며 블로그 본문·이미지·작성자 프로필·가격·평점·추천 순위는 만들지 않는다.

지역 검색 결과의 최초 분야 혼입을 검수해 업종·업체명 기반 관련성 점수와 분야별 쿼리를 보완했다. 최종 후보는 장소·음식 6, 촬영 4, 돌상·장식 4, 의상·미용 3, 답례·케이크 3이며 분류 신뢰도 높음 14·보통 6·낮음 0이다. 19곳은 블로그 검색 결과가 있었고 1곳은 반환 결과가 없었다. BE-029 canary 2회와 세 번의 수집·분류 개선 90회를 합쳐 이번 세션 92회, 일 한도 25,000회의 0.368%, 오류 0이다. 중복·비서울·필수 누락·검수 연결 불일치·수식 오류·키 노출은 모두 0이다. 운영 DB·사이트·업체 연락·외부 게시는 실행하지 않았다.
