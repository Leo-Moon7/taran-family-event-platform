# 프로젝트 보드

- 기준일: 2026-08-18
- 동시 진행 한도: 3
- 실제 활성 제품 코드 작업: 없음. BE-036·FE-042는 QA-055 신규 P0/P1 0으로 `DONE`
- 실제 활성 검수 작업: 없음 (`IDLE`)
- 운영 시험: QA-005 읽기 전용 오케스트레이션 검증 완료
- 완료 검수: QA-002, MKT-001, QA-004, MKT-002, OPS-002, QA-005, OPS-005, FE-004, FE-005, OPS-006, QA-007, QA-008, MKT-007, QA-009, MKT-008, FE-007, QA-010, BIZ-002, BE-005, MKT-009, BIZ-003, QA-011, OPS-008, BIZ-004, QA-013, MKT-011, QA-014, OPS-011, QA-015, OPS-009, FE-009, FE-011, FE-012, FE-014, QA-018, BIZ-007, QA-022, BE-008, BE-009, OPS-016, QA-023, QA-026, BE-013, OPS-018, OPS-019, OPS-021, OPS-022, BE-016, OPS-025, BIZ-009, OPS-026, QA-032, BE-017, OPS-027, QA-033, BE-018, OPS-023, QA-020, BE-014, OPS-028, FE-020, BE-020, BE-024, FE-025, FE-026, QA-039, QA-040, QA-003, BE-019, QA-041, QA-042, BE-027, FE-027, QA-043, FE-028, FE-029, QA-045, QA-044, OPS-029, OPS-030, OPS-031, OPS-032, QA-046, QA-047, OPS-033, OPS-034, QA-048, FE-031, FE-032, FE-033, FE-034, OPS-035, MKT-012, MKT-013, MKT-014, MKT-015, MKT-016, BE-028, BE-029, BE-030, BIZ-010, BE-033, FE-038, BE-034, FE-039, QA-052, OPS-038, FE-040, QA-053, OPS-039
- 현재 활성 작업: 없음
- 업체 연락 준비 워크북: 후보 561곳과 상세 561행을 일대일 연결했다. 일반음식점 후보 128곳의 API 대조 결과 정확 일치 72곳(영업 후보 34·폐업 38), 수동 검토 10곳, 미일치 46곳이며 폐업은 연락 대상에서 제외했다. 공공데이터에 없는 가격·수용인원·주차·예약 조건은 추정하지 않고 확인 필요로 유지했다. 실제 업체 연락·운영 DB·사이트 공개는 실행하지 않음
- 전국 업체정보 확보 방향: 공공데이터·NAVER API 후보 발견 + 공식 채널 재확인 + 업체 직접 등록 + 고객 수정 제안·실제 견적의 혼합 경로를 사용한다. 고객 화면에는 공식 근거 기준을 통과한 7곳만 표시하고, 기준 미달 후보는 수를 채우기 위해 공개하지 않는다. 전국 확대는 동일 기준을 통과한 업체부터 순차 진행한다.
- 신규 준비 카드: BE-016, OPS-025, BIZ-009, OPS-026, QA-032, BE-017 총괄 PM `PASS`로 `DONE`
- 다음 준비 작업: 사용자 OPS-039 화면 확인 후 피드백 반영 또는 GitHub 분리 브랜치 보존 카드를 작성한다.
- 다음 순서: 사용자가 OPS-039 고유 draft에서 목록·분야 탭·가격 표현·상세 5곳을 확인한다. 오류는 별도 수정 카드로 처리하고 GitHub main·Netlify production·운영 DB·정식 색인은 계속 별도 승인한다.
- D-31 실제 감사: 후기·역할·Storage·공개 projection·업체 등록·관리자 업체 조회·저장·공개·소유권·현황·부분 실패·Auth 최종 삭제를 격리 환경에서 모두 PASS했다. BE-026 commit `09701bb`와 QA-040 실제 E2E를 통과했고 운영 적용은 별도 승인 전 금지한다.
- 승인 완료: D-01~D-04, D-09, D-12, D-14~D-15, D-17~D-20, D-22~D-25, D-27, D-29, D-31, D-33~D-39, D-41, D-46, 온라인 미리보기, GitHub 분리 브랜치 반영; D-06·D-07 임시 폼 범위 부분 승인
- 승인 대기: D-26 업체 외부 연락, D-28 단순 외부 지도 링크, D-49 Google·Kakao 비용·저장 범위, D-51의 실제 운영 DB 적재·제품 구현·외부 공개, QA-034 운영 DB read-only, 정식 도메인·색인 전환, 숙박·미용·제과 공공 API 추가 활용신청
- 디자인 승인 완료: D-14 베이지 플랫폼형 C안; D-19·D-20 콘텐츠 방향 승인. 전체 홈 구현은 D-22·BIZ-003·BE-006/FE-008 선행
- 전체 카드: `ops/TASK_SPECS.md`
- 최신 온라인 확인 주소: `https://taran-family-event-test.netlify.app` (D-30 production, 전역 `noindex, nofollow`, deploy `6a6b08fdbf620b000895e2c1`, commit `942891b`)
- 최신 고객형 업체 검수 주소: `https://6a839ca595c8db1c752d5efd--taran-family-event-test.netlify.app/venues.html` (OPS-041 고유 noindex draft, 7곳·production 불변)
- 이번 통합 검수: `ops/reports/PM-2026-07-24-nationwide-naver-review.md`
- 독립 재검수: BIZ-004 PASS, QA-013 1차 수정 후 PASS, MKT-011 2차 수정 후 PASS, QA-014 PASS; QA-014 제품·개인정보·외부 실행 없음

| ID | 작업명 | 영역 | 상태 | 우선순위 | 실행 여부 |
| --- | --- | --- | --- | --- | --- |
| OPS-042 | 고객형 업체 7곳 검수본 GitHub 별도 브랜치 보존 | 총괄 PM·품질 | DONE | P0 | branch `agent/customer-provider-seven-preview`, draft PR #1, main·production·DB 불변 |
| OPS-041 | 고객형 업체 7곳 고유 noindex 온라인 미리보기 | 총괄 PM·품질 | DONE | P0 | draft `6a839ca595c8db1c752d5efd`·production/main/DB 불변 PASS |
| BE-036 | 공식 근거 확인 업체 2곳 고객 공개 profile 추가 | 백엔드·데이터 | DONE | P0 | 005·007만, 숫자 가격·사진·출장 추정 금지 PASS |
| FE-042 | 고객형 업체 목록 7곳 확장 표시 정합화 | 디자인·프런트엔드 | DONE | P0 | 7=4+3 정적·런타임 수량 PASS |
| QA-055 | 고객형 업체 7곳 확장 독립 검수 | 품질·보안 | DONE | P0 | P0/P1 0, 환경 제한은 개별 95 JS로 대체 |
| OPS-040 | 업체 목록·상세 최종 마감 noindex 온라인 미리보기 | 총괄 PM·품질 | DONE | P0 | draft `6a7eab527c24701b7813cc2c`·QA 제한 보완·production 불변 |
| BE-035 | 고객형 업체 소개 문구 사실 강도 정리 | 백엔드·데이터 | DONE | P0 | introduction 5개만 수정 |
| FE-041 | 업체 상세 앵커·가격 표현·연락처·공개 헤더 마감 | 디자인·프런트엔드 | DONE | P0 | Revision 1·Auth 기능 불변 |
| QA-054 | 업체 고객 문구·앵커·연락처·공개 헤더 독립 검수 | 품질·보안 | DONE | P0 | OPS-040 온라인 draft에서 제한 보완 PASS |
| OPS-039 | 고객형 업체 목록·상세 간결화 고유 온라인 미리보기 | 총괄 PM·품질 | DONE | P0 | draft `6a7e9aa4d562b716f46e06ab`·production 불변 PASS |
| FE-040 | 고객형 업체 목록 분야 분리·상세 중복 제거 | 디자인·프런트엔드 | DONE | P0 | 실제 5=3+2, 목록·상세 정리 PASS |
| QA-053 | 고객형 업체 목록·상세 간결화 독립 검수 | 품질·보안 | DONE | P0 | 자동·390/768/1440·5상세 PASS |
| OPS-038 | 첫 5곳 고객형 업체 화면 고유 noindex 온라인 미리보기 | 총괄 PM·품질 | DONE | P0 | draft `6a7e7c53cd87f23aa554498f`·HTTP·3 viewport·production 불변 PASS |
| QA-052 | 첫 5곳 고객형 공개 안전·접근성 검수 | 품질·보안 | DONE | P0 | 5곳·가격2·전화/공식채널5·내부용어/추정0·자동/브라우저 PASS |
| FE-039 | 첫 5곳 고객형 업체 목록·상세 구현 | 디자인·프런트엔드 | DONE | P0 | 고객형 검색·카드·상세·문의 질문 복사 PASS |
| BE-034 | 첫 5곳 고객 공개 projection | 백엔드·데이터 | DONE | P0 | customer_ready5·가격2·출장/복제이미지0 PASS |
| BIZ-010 | 고객형 업체 정보 최소 공개 기준 | 사업·서비스 기획 | DONE | P0 | 최대 5곳·최소 공개 필드·결측 기준 PASS |
| BE-033 | 첫 5곳 고객 정보 보강 가능성 감사 | 백엔드·데이터 | DONE | P0 | 공식 근거 5곳·가격 2·출장 0 PASS |
| FE-038 | 고객형 업체 목록·상세 재구성 설계 | 디자인·프런트엔드 | DONE | P0 | 고객형 DOM·필드 의존성·반응형 PASS |
| FE-037 | 후보 상세 보조 출처 영역 삭제 | 총괄 PM·디자인/프런트엔드 | DONE | P0 | 섹션·NAVER 버튼 0, 내부 정보·noindex·3 viewport PASS |
| BE-032 | 후보 20곳 내부 정보 projection | 백엔드·데이터 | DONE | P0 | 17필드 exact 계약·20→19→20 hide drill·금지 정보 0 PASS |
| FE-036 | 후보 내부 정보 중심 목록·상세 UI | 디자인·프런트엔드 | DONE | P0 | 내부 상세 20·목록 외부 링크 0·관측/미확인/체크리스트·3 viewport PASS |
| QA-051 | 후보 내부 정보 공개 안전 게이트 | 품질·보안 | DONE | P0 | Revision 1 exact17·hide drill·금지정보0·noindex·build/dist PASS |
| OPS-037 | 후보 내부 정보 고유 온라인 draft | 총괄 PM·품질 | DONE | P0 | draft `6a7d7aae781e2cd718ec9fbc`, HTTP·3 viewport PASS, production 불변 |
| BE-030 | NAVER API HUB 서울 돌잔치 업체 20곳 제한 시험 | 백엔드·데이터 | DONE | P0 | 20곳·5분야·낮은 신뢰 0·중복/오류/키 노출 0, 운영 DB·사이트 미반영 |
| BE-029 | NAVER API HUB 지역·블로그 비저장 canary | 백엔드·데이터 | DONE | P0 | 각 1회 HTTP 200·5개 응답, 결과 콘텐츠·키·결과 파일 저장 0 |
| BE-028 | 전국 업체 후보 561곳 전체 상세행·외부 API 보강 | 백엔드·데이터 | DONE | P0 | 상세 561행 PASS, 일반음식점 128곳 API 대조·정확 일치 72·폐업 제외 38·키 노출 0 |
| MKT-016 | 검색 보조 촬영업체 22곳 공식 상세정보 보강 | 마케팅·운영 | DONE | P0 | 공식 출처 22행·검색 결과 파생 0·후보 561곳 보존 PASS |
| MKT-015 | 스튜디오·사진작가 문의 체크리스트와 상담 스크립트 | 마케팅·운영 | DONE | P0 | 9개 시트·질문 32개·후보 561곳 보존 PASS, 실제 연락 0 |
| FE-022 | 후기 접수 성공 상태 오표시 보정 | 디자인·프런트엔드 | DONE | P0 | commit `d00c32f`, 실제 성공·중복 UI PASS |
| BE-021 | 관리자 본인 역할 조회 최소권한 보정 | 백엔드·데이터 | DONE | P0 | commit `aff8bd5`, 본인 1행·타인/쓰기 거부 PASS |
| BE-022 | 공개 projection Security Advisor 오류 해소 | 백엔드·데이터 | DONE | P0 | commit `ccede80`, Advisor 오류 2→0·7/7 PASS |
| FE-023 | 업체 등록 현재 동의 버전 payload 보정 | 디자인·프런트엔드 | DONE | P0 | commit `ecc2183`, 실제 파일 업로드·등록 pending PASS |
| QA-036 | 후기·역할·Storage·Advisor 최종 격리 재검증 | 품질·보안 | REVISION_REQUIRED | P0 | 핵심 검증 PASS, 관리자 업체 관리 큐 직접 base 조회 결함 발견 |
| BE-023 | 관리자 업체 관리 큐 최소권한 조회 RPC | 백엔드·데이터 | DONE | P0 | `a07a877`·`a03dfb4`, 세 독립 RPC·역할 E2E PASS |
| FE-024 | 관리자 업체 관리 큐 RPC client 연결 | 디자인·프런트엔드 | DONE | P0 | `11724d9`·`9f6c60c`, 독립 큐·브라우저 PASS |
| QA-037 | 관리자 업체 관리 최소권한 최종 독립 검수 | 품질·보안 | DONE | P0 | 1차 수정 후 reviewer PASS |
| QA-038 | 관리자 업체 업무 잔여 직접 접근 감사 | 품질·보안 | DONE | P0 | direct write P0·빈 수치 오표시 P1 경계 확정 |
| BE-024 | 관리자 업체 운영 동작 최소권한 RPC | 백엔드·데이터 | DONE | P0 | `593773a`, 최초·재적용·역할·원자성 E2E·reviewer PASS |
| FE-025 | 관리자 업체 동작 RPC client 연결 | 디자인·프런트엔드 | DONE | P0 | `85d947a`·`ed191c6`, 수정 1회 뒤 실제 등록·공개·수정 PASS |
| FE-026 | 관리자 현황·문의 운영 조회 RPC client 연결 | 디자인·프런트엔드 | DONE | P0 | `749bf42`, 실제 수치·부분 실패 표시 PASS |
| QA-039 | 관리자 업체 운영 동작 최종 격리 E2E | 품질·보안 | DONE | P0 | 역할·원자성·세 화면·권한 복구·cleanup·독립 reviewer PASS |
| BE-025 | Auth 최종 삭제 worker·완료 이력 | 백엔드·데이터 | BLOCKED_AFTER_REVISION_2 | P0 | `5d66de8`; stale JWT Storage·NULL 문의 우회·잠금 교착 위험으로 독립 reviewer 차단 |
| BE-026 | Auth 독립 탈퇴 tombstone·JWT drain·동시성 안전화 | 백엔드·데이터 | DONE | P0 | commit `fe02b45`·수정 1회 `09701bb`; 38/38·독립 reviewer PASS |
| QA-040 | Auth 최종 삭제 worker 격리 E2E | 품질·보안 | DONE | P0 | migration·stale JWT·NULL 문의·두 세션·cleanup PASS; 운영 미활성 |
| BE-020 | 자체 후기 제출 최소권한 RPC | 백엔드·데이터 | DONE | P0 | QA-035 역할 E2E 13/13 PASS, 운영 미적용 |
| FE-021 | 자체 후기 제출 RPC client 연결 | 디자인·프런트엔드 | REVISION_REQUIRED | P0 | direct table 접근 0, 성공 뒤 실패 오표시 FE-022 필요 |
| QA-035 | 격리 Auth·Storage·역할 브라우저 최종 E2E | 품질·보안 | REVISION_REQUIRED | P0 | 보고서 완료, 합성 데이터 정리 0; 후속 4개 식별 |
| FE-020 | 공개 업체 safe view·수정 요청 UI 연결 | 디자인·프런트엔드 | DONE | P0 | commit `aa8d491`, CHG-B 보존·운영 미배포 |
| FE-019 | 업체 등록 심사·문의 동의 client 계약 연결 | 디자인·프런트엔드 | DONE | P0 | commit `8096618`, CHG-A~C 비접촉·운영 미배포 |
| BE-015 | 업체 등록·수정 요청·관리자 검수 원자성 백엔드 | 백엔드·데이터 | DONE | P0 | commit `b16ecd8`, 격리 원자성·멱등 E2E PASS |
| OPS-028 | BE-016 신규 공식 근거 exact GitHub 별도 브랜치 보존 | 품질·운영 | DONE | P0 | commit `9cdfb6c`, 원격 branch, PR·main·배포 0 |
| BE-019 | 업체·견적 v2 additive migration·최소권한 RPC/RLS 구현 | 백엔드·데이터 | DONE | P0 | `b969191` + 호환 수정 `97a5dfb`; 정적·PGlite·독립 reviewer PASS, 운영 미적용 |
| QA-041 | 업체·견적 v2 실제 격리 Supabase SQL 역할 E2E | 품질·보안 | DONE | P0 | SQL 역할 PASS·cleanup 0 + QA-042 실제 Auth/JWT/MFA PASS |
| QA-042 | 실제 GoTrue JWT·PostgREST·AAL2 MFA E2E | 품질·보안 | DONE | P0 | commit `b84d307`, 실제 JWT·TOTP AAL2·cleanup PASS, 원격 별도 브랜치 |
| BE-027 | 운영 review queue 최소권한 RPC 계약 | 백엔드·데이터 | DONE | P1 | commit `8e7eb81`, exact 3파일·정적/PGlite/회귀 PASS, 원격 별도 브랜치 |
| FE-027 | 조건 연계형 가족행사 비용 계산기 세분화 | 디자인·프런트엔드 | DONE | P1 | Revision 1 식대 범위·코랄 4.5:1 보완, QA-043 PASS, 배포 0 |
| QA-043 | 조건 연계형 계산기 독립 기능·접근성 검수 | 품질·보안 | DONE | P1 | Revision 1 재검수 PASS |
| FE-028 | 행사 세부 유형·예상 인원·공간별 식비 계산기 고도화 | 디자인·프런트엔드 | DONE | P1 | 5개 세부 행사·예상 인원·다섯 공간 식비, QA-045 PASS |
| FE-029 | 공개 헤더 도구 분리·로그인 전용 비교함 동선 | 디자인·프런트엔드 | DONE | P1 | 공개 비교함 제거·도구 분리·마이페이지 진입, QA-045 PASS |
| QA-045 | 계산기 상세화·로그인 비교함 동선 통합 검수 | 품질·보안 | DONE | P1 | 전용 검사·build/dist·Auth 3상태 PASS |
| QA-044 | 공통 JavaScript validate harness 오류 보고 안전화 | 품질·보안 | DONE | P2 | commit `5f1e6d0`, exact 3파일·전용 5/5·build·dist PASS, 원격 별도 브랜치 |
| OPS-029 | migration 015·016 설치 순서·운영 승인 게이트 문서 정합화 | 총괄 PM·품질 | DONE | P1 | 현재 checkout 001~005·통합 후보 001~016 구분, 누락·오타 0 |
| OPS-030 | 검증 브랜치 통합 순서·충돌·회귀 게이트 읽기 전용 계획 | 총괄 PM·품질 | DONE | P1 | BE-027 기준, QA tip exact, 실제 통합 FE 보존 대기 |
| OPS-031 | FE-028·FE-029·QA-045 exact GitHub 별도 브랜치 보존 | 총괄 PM·품질 | DONE | P0 | commit b424156, 원격·로컬 blob 16/16, main·배포 0 |
| OPS-032 | BE-027 백엔드 후보와 FE snapshot 통합 충돌 읽기 전용 감사 | 총괄 PM·품질 | DONE | P0 | 직접 파일 교집합 0·3-way 충돌 0, 통합 E2E 필요 |
| OPS-033 | 격리 통합 후보 조립·전체 회귀 | 총괄 PM·품질 | DONE | P0 | local HEAD cdd0929·제품 기준 a66b510·직접 검사 26/26·실제 Auth·cleanup PASS |
| OPS-034 | 통합 후보 원격 별도 브랜치 보존·고유 온라인 draft | 총괄 PM·품질 | DONE | P0 | remote cdd0929 일치·deploy 6a6aba4d5ef57d8288accfea·핵심 화면·JS/CSS 200·noindex |
| QA-048 | 최종 통합 draft 공개·비로그인 다중 뷰포트 회귀 | 품질·보안 | DONE | P0 | 24/24 화면 조합·overflow 0·깨진 이미지 0·console 0·계약 일치 |
| FE-031 | 핵심 세부 페이지 톤앤매너·폰트 규격 통합 | 디자인·프런트엔드 | DONE | P0 | 7개 화면·공통 CSS, 온라인 18/18 규격·overflow·이미지 PASS |
| FE-032 | 세부 페이지 이미지 톤·공통 구조·정적 준비백과/SEO | 디자인·프런트엔드 | DONE | P0 | commit `ce3a409`, draft `6a6ade53311d652a67d406fa`, 3뷰포트·접근성·정적 글·noindex PASS |
| FE-033 | 계산기 결과 하단 배치·완료 후 자동 이동 | 디자인·프런트엔드 | DONE | P0 | commit `41f90e8`, draft `6a6ae305b9f8279eabcca42e`, PC·모바일 실제 흐름·noindex PASS |
| FE-034 | 계산기 우측 세부 작업공간·실사용 계획 로직 | 디자인·프런트엔드 | DONE | P0 | 제품 commit `15cf755`, production HEAD `942891b`, PC·모바일·오류 입력·결과 이동·noindex PASS |
| QA-046 | 현행 5행사·공개 헤더 테스트 계약 정합화 | 품질·보안 | DONE | P0 | local commit a66b510, 제품 diff 0 |
| QA-047 | 통합 후보 실제 격리 Auth·RLS·RPC 최종 재검증 | 품질·보안 | DONE | P0 | 실제 JWT·AAL2·migration 016·cleanup 0 PASS |
| QA-034 | 기존 민감 객체 metadata-only 운영 전 감사 | 품질·보안 | BLOCKED_READONLY_APPROVAL | P0 | 운영 DB read-only 별도 승인 |
| OPS-027 | BE-016 공식 근거 exact Git 경계 로컬 구현 | 품질·운영 | DONE | P0 | PM PASS, stage·원격 0 |
| QA-033 | 현행 업체·견적 SQL 개인정보·스키마 차이 감사 | 품질·보안 | DONE | P0 | PM PASS, P0 6개·P1 10개 |
| BE-018 | 업체·견적 통합 계약 합성 수용 테스트 명세 | 백엔드·데이터 | DONE | P0 | PM PASS, 수용 52개·회귀 6개 |
| OPS-026 | BE-016 신규 공식 증거 Git 추적 경계 설계 | 품질·운영 | DONE | P0 | PM PASS, exact 6개 설계·검증 |
| QA-032 | 견적 기여·상세 열람 개인정보·악용 사전 검수 | 품질·보안 | DONE | P0 | PM PASS, 위협 32개; 제품 구현 D-38 |
| BE-017 | 업체 직접등록·고객제안·견적 통합 데이터 계약 | 백엔드·데이터 | DONE | P0 | PM PASS, 실제 DB·제품 구현 D-38·QA-003 |
| BE-016 | 미용·제과·장례식장 공식 원천 증거 패킷 | 백엔드·데이터 | DONE | P0 | PM PASS, 세 원천 `BLOCKED_REGISTRY`, API·실제 레코드 0 |
| OPS-025 | 공공데이터 공백 8개 분야 직접 등록·제안 SOP | 마케팅·운영 | DONE | P0 | PM PASS, 실제 업체 접수·연락 0 |
| BIZ-009 | 고객 견적 공유·열람 정책 | 사업·서비스 기획 | DONE | P0 | PM PASS, 견적 원본·제품·과금 0 |
| BIZ-005 | 운영자 선등록형 출시·수익 준비 모델 확정 | 사업·서비스 기획/운영/품질 | DONE | P0 | 후속 작업 중복 1차 보완 후 독립 reviewer PASS |
| FE-010 | 모바일 메뉴 열림·닫힘 접근성 상태명 | 디자인·프런트엔드 | DONE | P1 | 독립 QA PASS |
| FE-015 | 결혼 준비 체크리스트 제목 중복 정리 | 디자인·프런트엔드 | DONE | P1 | 5종 제목·독립 QA PASS |
| FE-016 | 로그인 화면 업체 등록 메뉴 목적지 통일 | 디자인·프런트엔드 | DONE | P1 | 대표 링크·독립 QA PASS |
| OPS-012 | 도메인 구매 전 출시·연결 준비 | 총괄 PM/운영/품질 | DONE | P0 | 1차 보완 후 독립 reviewer PASS |
| OPS-007 | vendor-dashboard 강제 리디렉션 핫픽스 | 디자인·프런트엔드/총괄 PM | DONE | P0 | draft `6a62c78790a1d9262eab53d3`, PM·독립 QA PASS, production 미배포 |
| QA-018 | 공개·비로그인 전체 기능 및 권한 경계 회귀 점검 | 품질·보안 | DONE | P0 | 1차 사실관계 보완 후 독립 reviewer PASS, draft는 OPS-007 전 REVISION_REQUIRED |
| FE-014 | 공개 전 핵심 흐름·신뢰·홈 시각 안정화 | 디자인·프런트엔드 | DONE | P0 | 1차 보완 후 PM·독립 QA PASS, draft `6a62af9bb40288afb67fd7eb`, main·production 미반영 |
| FE-013 | 최신 생성 시안 기반 통합 UI 구현 | 디자인·프런트엔드 | DONE | P0 | 총괄 PM 기능·다중 뷰포트 검수 PASS, 고유 draft `6a61c5a4b798d9ff47b5144e`, 사용자 시각 확인 대기 |
| QA-002 | 정적 업체 데이터 품질 기준선 재현 | 품질·보안 | DONE | P0 | 검수 통과 |
| MKT-001 | SEO·콘텐츠 공백 기준선 작성 | 마케팅·운영 | DONE | P1 | 검수 통과 |
| QA-005 | 서브에이전트 오케스트레이션 읽기 전용 시험 | 품질·보안 | DONE | P0 | 검수 통과 |
| QA-004 | 기준 문서 수치·정의 일관성 감사 | 품질·보안 | DONE | P0 | 1차 보완 후 검수 통과 |
| MKT-002 | 기존 준비백과 콘텐츠 품질·통합 감사 | 마케팅·운영 | DONE | P1 | 검수 통과 |
| OPS-002 | 공개 사업·기능 약속 문구 감사 | 마케팅·운영 | DONE | P0 | 검수 통과 |
| OPS-005 | 공개 유료·3단계 기능 문구 정정 명세 | 마케팅·운영 | DONE | P0 | 2차 보완 후 검수 통과 |
| FE-004 | 일반·개인정보 문의 접수 경로 최소 구현 | 디자인·프런트엔드 | DONE | P0 | 검수 통과 |
| FE-005 | 미확정 유료·예약·결제 공개 문구 최소 수정 | 디자인·프런트엔드 | DONE | P0 | 검수 통과 |
| OPS-006 | GitHub main·Netlify 테스트 배포 | 총괄 PM | DONE | P0 | 커밋 `b837ea9`, 공개 반영 확인 |
| QA-006 | Netlify 공개 화면 다중 뷰포트 검수 | 품질·보안 | DONE | P0 | D-30 production `6a6b08fdbf620b000895e2c1`; 핵심 10경로·레거시 301·계산기 PC/모바일·전역 noindex PASS |
| FE-006 | 행동 중심 정보·공동 편집 홈페이지 개편 | 디자인·프런트엔드 | SUPERSEDED | P0 | 초기 안전 구현은 FE-009로 재구성 |
| FE-002 | 검색 공개 게이트 정책 일치 | 디자인·프런트엔드 | SUPERSEDED | P0 | FE-008 검수 projection·신뢰 표시로 재작성 |
| QA-003 | 스테이징 역할·문의 E2E | 품질·보안 | DONE | P0 | QA-040까지 격리 최종 PASS; 운영 적용은 별도 승인 |
| OPS-001 | 운영 주체·개인정보·문의 기준 확정 | 마케팅·운영 | APPROVAL_REQUIRED | P0 | 금지 |
| BE-001 | 업체 데이터 API 페이징 전환 | 백엔드·데이터 | BACKLOG | P1 | 금지 |
| BE-002 | 승인 대상 변경 감지 자동화 | 백엔드·데이터 | BLOCKED | P2 | 금지 |
| BIZ-001 | 초기 정보 플랫폼 공개 정책 명세 | 사업·서비스 기획 | SUPERSEDED | P0 | ADR-016·BIZ-002로 대체 |
| QA-007 | 외부 후기 수집·공개 준수 기준선 감사 | 품질·보안 | DONE | P0 | 감사 PASS, 제품 공개 게이트 BLOCKED |
| QA-008 | 홈페이지 행동 경로 준비 상태 감사 | 품질·디자인 | DONE | P0 | 감사 PASS, 13개 행동 중 준비 6개 |
| MKT-007 | 홈 준비백과·커뮤니티 콘텐츠 매핑 감사 | 마케팅·운영 | DONE | P0 | 감사 PASS, 검수 완료 홈 콘텐츠 0개 |
| BE-004 | 공동 편집·출처 계층 데이터 계약 설계 | 백엔드·데이터 | SUPERSEDED | P0 | BE-005로 통합, 상세 구현 계약은 BE-006 |
| OPS-008 | 업체 소유권·직접 입력·관리자 검수 SOP | 마케팅·운영 | DONE | P0 | PM·독립 reviewer 검수 통과 |
| FE-007 | 운영팀 시작 질문 기반 커뮤니티 초기 화면 | 디자인·프런트엔드 | DONE | P0 | PM 검수 통과, 배포는 별도 승인 |
| OPS-009 | NAVER 파생 공개 경로 가역적 격리 | 백엔드·통합 | DONE | P0 | 구현·PM 로컬 검수 PASS, 원본 해시 불변, 최종 배포 금지 |
| QA-009 | NAVER 업체·후기 정보 이용 기준 상세 재검토 | 품질·보안 | DONE | P0 | 역사 감사 PASS, ADR-016·QA-010으로 비의존 결정 |
| MKT-008 | 준비백과 공개 품질 개선·노출 통제 | 마케팅·운영 | DONE | P0 | 공개 글 6개·초안 22개, PM 검수 통과 |
| QA-010 | NAVER 의존성 전수 감사·대체 분류 | 품질·보안 | DONE | P0 | PM 검수 PASS, 48개 의존 단위 |
| BIZ-002 | NAVER 비의존 초기 사업·서비스 전략 | 사업·서비스 기획 | DONE | P0 | PM 검수 PASS, ADR-016 반영 |
| BE-005 | 공공데이터·업체 검증·자동 갱신 구조 | 백엔드·데이터 | DONE | P0 | PM 검수 PASS, 제품·DB 변경 없음 |
| MKT-009 | 서울 돌잔치 업체 확보·콘텐츠 운영 전략 | 마케팅·운영 | DONE | P0 | PM 검수 PASS, 외부 연락 없음 |
| BIZ-003 | 서울 돌잔치 비교 필드·행사 분류·신뢰 라벨 | 사업·서비스 기획 | DONE | P0 | PM·독립 reviewer 검수 통과 |
| QA-011 | 공공데이터 원천·이용허락 후보 레지스트리 | 품질·보안 | DONE | P0 | PM·독립 reviewer 검수 통과, API 호출 없음 |
| BE-006 | source/assertion/public projection 상세 계약 | 백엔드·데이터 | DONE | P0 | 2차 보완 후 독립 reviewer PASS |
| BE-007 | 격리 로컬 업체 후보 seed 배치 검수 도구 | 백엔드·데이터 | DONE | P0 | 2차 수정·unittest 14개·QA-019 PASS |
| QA-019 | seed 배치 이용조건·중복·개인정보·권리 안전 게이트 | 품질·보안 | DONE | P0 | adversarial·coordinated 변조 재검수 PASS |
| OPS-013 | 서울 돌잔치 첫 20곳 비공개 검수 배치 | 마케팅·운영/백엔드/품질 | REPLANNED | P0 | 활용신청 완료 후 D-34 전국·다분야 방향으로 대체 |
| BIZ-007 | 전국 관련 업체 범위·공개 게이트 | 사업·서비스 기획 | DONE | P0 | 1차 보완 후 PM·독립 reviewer PASS |
| QA-022 | 전국 분야별 공식 원천·이용조건 레지스트리 | 품질·보안 | DONE | P0 | PM 검수 PASS, 공식 후보 11종·권리 보류 원천 분리 |
| BE-008 | 전국 다분야 후보 수집·중복·검수 배치 설계 | 백엔드·데이터 | DONE | P0 | 1차 보완 후 PM·독립 reviewer PASS |
| BE-009 | 전국 공식 원천 source registry 확장 계약 | 백엔드·데이터 | DONE | P0 | 1차 문구 수정 후 PM·독립 reviewer PASS, 11종 모두 실행 전 차단 |
| OPS-016 | 전국 후보 검수 용량·운영 순서 설계 | 마케팅·운영 | DONE | P0 | PM·독립 reviewer PASS, 업체 연락·공개 없음 |
| QA-023 | 신규 원천 schema·금지 필드 synthetic 게이트 | 품질·보안 | DONE | P0 | 2차 보완 후 PM·독립 reviewer PASS, 실제 원천·API·DB 비접촉 |
| QA-026 | 기존 NAVER 로컬 자료 metadata-only 삭제 대상 감사 | 품질·보안 | DONE | P0 | PM·독립 reviewer PASS, D-27 삭제·무결성 검사 완료 |
| BE-013 | `15154916` 첫 공식 원천 terms·schema 증거 패킷 | 백엔드·데이터 | DONE | P0 | 1차 보완 후 PM·독립 reviewer PASS, blocker 9/9 잔존·실제 API/업체 레코드 0 |
| OPS-018 | 공공데이터 안전 도구·증거 Git 추적 경계 결정 | 총괄 PM/운영/보안 | DONE | P0 | 1차 보완 후 독립 reviewer PASS, exact 9-file 경계·비밀 검사 확정 |
| OPS-019 | 공공데이터 안전 도구·증거 로컬 Git 경계 구현 | 총괄 PM/운영/보안 | DONE | P0 | PM 구현·독립 reviewer PASS, exact 9개·deny 10개·회귀 통과, GitHub 미반영 |
| OPS-021 | 안전 도구·증거 별도 GitHub 브랜치 반영 | 총괄 PM/운영/보안 | DONE | P0 | `agent/ops-019-public-seed-exact-allowlist`, commit `1e7f654`, 승인 10개만 push, PR·main·배포 0 |
| OPS-022 | 사업·수익·업체 데이터 실행 인수인계 통합 | 총괄 PM | DONE | P0 | 기존 PROJECT_HANDOVER에 최신 전략·상태·다음 실행 통합, 제품·외부 변경 없음 |
| OPS-023 | D-31 격리 Supabase 환경 준비 | 총괄 PM/품질·보안 | DONE | P0 | 무료 격리 project·합성 manifest 완료 |
| QA-020 | Supabase Auth URL·역할 격리 준비 | 품질·보안 | DONE | P0 | 역할 9개·외부 알림 0, PM PASS |
| BE-014 | D-31 권한·RPC·Storage 최소권한 보안 수정 | 백엔드·데이터 | DONE | P0 | commit `d144922`, 격리 적용·멱등·역할 E2E PASS, 운영 미적용 |
| BE-015 | 업체 승인·공개 projection·문의 원자성 연결 | 백엔드·데이터 | DONE | P0 | commit `b16ecd8`, provider 등록·수정·응답 원자성 PASS |
| OPS-024 | 새 Supabase bootstrap 문서 정합화 | 총괄 PM/백엔드·데이터 | DONE | P1 | commit `e8510ca`; 001~014·admin-schema·Edge/runtime 게이트 정합화 |
| QA-027 | NAVER 공식 서면 이용범위 확인 | 품질·보안 | CANCELLED | P0 | 사용자 결정으로 문의·보조 활용 경로 종료 |
| FE-008 | 후보·검수 업체 분리와 신뢰·최근성 표시 | 디자인·프런트엔드 | BLOCKED | P0 | D-22·BE-006·CHG-B 선행 |
| FE-009 | 베이지 C안 홈 안전 축소 구현 | 디자인·프런트엔드 | DONE | P0 | 홈 3개 파일 구현·PM·독립 reviewer PASS, draft 미리보기 생성, 최종 배포 금지 |
| FE-011 | 승인된 최종 홈·준비 도구·비교 화면 구현 | 디자인·프런트엔드 | DONE | P0 | PM·독립 QA PASS, 고유 draft 생성, 최종 배포·GitHub 반영 금지 |
| FE-012 | 행사 분류 5종 통합과 실용형 체크리스트 개편 | 디자인·프런트엔드 | DONE | P0 | REVISION 2 후 PM·독립 QA PASS, 고유 draft·GitHub 분리 브랜치 생성 |
| QA-012 | NAVER 비의존 공개 번들·흐름 회귀 | 품질·보안 | BLOCKED | P0 | OPS-009·FE-008 후 |
| QA-016 | 승인된 정보 나눔 홈 링크와 테스트 계약 정합화 | 품질·보안 | BLOCKED | P1 | CHG-A 테스트 정본 소유권 확정 후 실행 |
| FE-010 | 공통 모바일 메뉴 상태명·홈 CTA 정합성 | 디자인·프런트엔드/품질 | BACKLOG | P1 | 공통 header 단일 소유권과 비교함 노출 정책 확인 후 카드화 |
| MKT-010 | 서울 돌잔치 업체 온보딩 제한 파일럿 | 마케팅·운영 | APPROVAL_REQUIRED | P1 | D-29 승인 완료; D-23~D-26·법률 확인·제품 E2E 후 |
| OPS-010 | NAVER 비의존 기준 문서 00~12 현행화 | 총괄 PM/문서 | BACKLOG | P0 | BIZ-003·QA-011·OPS-008 후 |
| BIZ-004 | 공개 신뢰 라벨·최근성 D-25 결정안 | 사업·서비스 기획 | DONE | P0 | PM·독립 reviewer 검수 통과 |
| QA-013 | 사업자·소유권·사진/후기 증빙 D-24 개인정보 결정안 | 품질·보안 | DONE | P0 | 역사 보고서; 최신 정본은 QA-015 PASS 보완안 |
| MKT-011 | 서울 돌잔치 업체 제한 파일럿 D-26 승인안 | 마케팅·운영 | DONE | P1 | 2차 수정 후 검수 통과, 외부 연락 없음 |
| QA-014 | 외부 영업 연락 데이터·수신거부 D-29 결정안 | 품질·보안 | DONE | P0 | 총괄 PM·독립 reviewer PASS, D-29 승인 완료·법률/기술 게이트 대기 |
| OPS-011 | D-23~D-25 추천안 사용자 결정 통합 검토 | 총괄 PM/전문 검토 | DONE | P0 | 독립 reviewer PASS; D-23·D-25 PASS, D-24 REVISION_REQUIRED |
| QA-015 | D-24 현행 안전조치 기준 정합성 보완 | 품질·보안 | DONE | P0 | 총괄 PM·독립 reviewer PASS, D-24 승인 완료 |

## 보드 판정

- OPS-005는 보고서만 작성하며 FE-004와 경로가 겹치지 않는다. FE-005는 OPS-005 완료 후 순차 실행한다.
- FE-004·FE-005는 API·DB·환경변수·패키지·공통 CSS/JS를 변경하지 않는다.
- CHG-A·B와 승인 작업의 수정 경로는 겹치지 않는다. CHG-C 중 운영 문서는 사용자 인수인계 요청에 따라 PM 기준선으로 별도 커밋하되 favicon은 제외한다.
- GitHub 설정에서 저장소의 `Private` 전환을 확인했다. 운영 문서는 이번 제품 커밋에서 계속 분리했으며 별도 비밀·개인정보 검사 후 기준선 커밋 여부를 결정한다.
- OPS-006은 승인된 5개 제품 파일만 `b837ea9`로 배포해 완료했다.
- QA-006 1차 검수에서는 `/vendor-dashboard.html`의 정적 200과 레거시 JavaScript 오류로 차단됐지만, D-30 production에서 강제 301을 복원·재검수해 최종 `DONE`이다.
- FE-006은 제품을 수정하지 않고 C안 시안·명세를 작성했다. 초기 구현은 FE-009로 재구성했으며 D-22/OPS-009 완료 뒤 업체 데이터 기능을 숨긴 안전 범위만 시작한다.
- 기존 작업 트리 변경은 작업 ID가 배정되지 않았으므로 활성 작업이 아니라 `ACTIVE_WORK.md`의 검토 대기 변경이다.
- QA-005에서 제품 파일을 수정하지 않고 서브에이전트 생성·결과 회수·독립 검수 경로를 확인했다.
- MKT-002는 28개 글 전수·반복·계약 콘텐츠 중복·내부 링크 집계가 독립 재현돼 검수 통과했다.
- OPS-002는 공개 주장 32개를 재현 가능한 근거로 분류했으며, 제품 변경은 승인 항목으로 분리했다.
- QA-004는 1차 보완에서 위치별 대체 문구를 완성해 검수 통과했다.
- QA-007은 보고서 범위와 완료 조건을 통과했다. 제품 판정은 별개로 `BLOCKED`: 현 공개 번들에서 파생 업체 4,960건, pending 후기 9,991건, hidden 업체 140건을 재현했다.
- QA-008은 C안 13개 행동을 준비 6·부분 3·차단 3·부재 1로 재현해 감사 `DONE`; 차단 행동을 홈에 약속하지 않는다.
- MKT-007은 준비백과 28개와 커뮤니티 preview 31개를 전수 검사해 즉시 홈 노출 후보를 각각 0개로 판정했다. 운영 홈은 검수 콘텐츠 또는 빈 상태만 사용한다.
- QA-009은 업체 기본 사실의 독립 확인과 NAVER 결과 대량 저장·가공을 구분했다. 이후 ADR-016으로 NAVER를 사업 데이터 원천에서 제외했고 QA-010이 전체 의존 경로를 확정했다.
- MKT-008은 준비백과 6개를 출처·검토일이 있는 공개 글로 보강하고 나머지 22개를 draft로 숨겼다. FE-007은 가상 회원 31건을 제거하고 실제 글 우선·운영팀 시작 질문 6건으로 전환했다.
- QA-010·BIZ-002·BE-005·MKT-009는 각각 의존성, 사업, 데이터, 업체 확보 운영을 전용 보고서로 완성했고 PM 검수 PASS다. 제품·DB·외부 연락·배포 변경은 없었다.
- BIZ-003·QA-011·OPS-008은 각 전용 보고서만 작성했고 PM과 독립 reviewer가 모두 PASS했다. QA-011의 D-24/D-25 참조 오기 1건은 같은 작업의 1차 보완으로 수정했다. 제품·DB·API·수집·외부 연락·배포 변경은 없었다.
- BIZ-004·QA-013·MKT-011은 D-25·D-24·D-26 승인안을 작성했다. QA-013의 사업자번호 보유 모순과 MKT-011의 외부 연락 데이터 선행조건을 범위 내에서 수정해 모두 PASS했다. 제품·개인정보·DB·API·외부 연락·비용·배포 변경은 없었다.
- OPS-009는 공개 번들에서 NAVER 파생 7개 파일과 관련 소비 경로를 가역적으로 격리했고 로컬 원본 7개 해시를 보존했다. FE-009는 이어서 홈 전용 3개 파일만 수정해 베이지 C안, 즉시 검색, 8개 행사, 준비 도구와 검수 콘텐츠를 구현했다.
- FE-009 draft `6a614bf21e9fc5a87195f051`는 production 별칭을 바꾸지 않는 온라인 초안이다. PC·태블릿·모바일과 검색 이동, 콘솔 오류 0건을 확인했다. `pnpm test`의 유일한 실패는 승인된 홈 `정보 나눔` 링크를 금지하는 과거 검사이므로 QA-016으로 분리했고 제품 화면을 되돌리지 않는다.
- 독립 reviewer도 FE-009와 OPS-009를 `PASS`로 판정했다. 공통 모바일 메뉴의 접근성 이름이 열린 뒤에도 `메뉴 열기`로 남고 기존 `비교함`이 계속 보이는 문제는 FE-009 범위 밖이므로 FE-010 후보로만 등록했다.
