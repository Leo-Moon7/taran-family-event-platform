# 백로그

아래는 실행 카드가 아니라 후보 목록이다. `TASK_SPECS.md` 형식의 전체 카드와 단일 소유 경로가 작성되기 전에는 시작하지 않는다.

| 후보 ID | 작업명 | 영역 | 상태 | READY 전 조건 | 현재 저장소의 대상 후보 |
| --- | --- | --- | --- | --- | --- |
| BE-037 | 보류 후보 3곳 최신 공식 근거 재확인 | 백엔드·데이터 | BACKLOG | 공식 도메인 정상화 또는 현재 서비스 직접 근거 | NVR-DOL-006 송림가·010 베이비돌스냅·011 꼬마돌상; 가격·사진·출장 추정 금지 |
| BE-032 | 후보 20곳 내부 정보 projection | 백엔드·데이터 | DONE | D-53 | 17필드 exact 계약·denylist·전용 검사 PASS |
| FE-036 | 후보 내부 정보 중심 목록·상세 UI | 디자인·프런트엔드 | DONE | BE-032 PASS | 내부 상세 20·목록 외부 링크 0·관측/미확인/체크리스트 |
| QA-051 | 후보 내부 정보 공개 안전 게이트 | 품질·보안 | DONE | BE-032·FE-036 PASS | Revision 1 exact17·hide drill·금지정보0·noindex PASS |
| OPS-037 | 후보 내부 정보 고유 온라인 draft | 총괄 PM·품질 | DONE | QA-051 PASS | draft `6a7d7aae781e2cd718ec9fbc`·production 불변 |
| FE-022 | 후기 접수 성공 상태 오표시 보정 | 디자인·프런트엔드 | DONE | QA-036 실제 브라우저 PASS | commit `d00c32f`·보고서 |
| BE-021 | 관리자 본인 역할 조회 최소권한 보정 | 백엔드·데이터 | DONE | QA-036 역할 PASS | commit `aff8bd5`·migration 009·보고서 |
| BE-022 | 공개 projection Security Advisor 오류 해소 | 백엔드·데이터 | DONE | Advisor 오류 2→0 | commit `ccede80`·migration 010·보고서 |
| FE-023 | 업체 등록 현재 동의 버전 payload 보정 | 디자인·프런트엔드 | DONE | QA-036 실제 등록 PASS | commit `ecc2183`·보고서 |
| QA-036 | 후기·역할·Storage·Advisor 최종 격리 재검증 | 품질·보안 | REVISION_REQUIRED | 관리자 업체 관리 큐 연결 보정 | 전용 보고서·QA-003 4차 판정 |
| BE-023 | 관리자 업체 관리 큐 최소권한 조회 RPC | 백엔드·데이터 | DONE | QA-037 PASS | commits `a07a877`·`a03dfb4`·보고서 |
| FE-024 | 관리자 업체 관리 큐 RPC client 연결 | 디자인·프런트엔드 | DONE | QA-037 PASS | commits `11724d9`·`9f6c60c`·보고서 |
| QA-037 | 관리자 업체 관리 최소권한 최종 독립 검수 | 품질·보안 | DONE | 1차 수정 후 PASS | 전용 검수 보고서 |
| QA-038 | 관리자 업체 업무 잔여 직접 접근 감사 | 품질·보안 | DONE | read-only audit PASS | P0 write·P1 false-zero 경계와 후속 카드 |
| BE-024 | 관리자 업체 운영 동작 최소권한 RPC | 백엔드·데이터 | DONE | 격리·reviewer PASS | `593773a`·migration 012·전용 테스트·보고서 |
| FE-025 | 관리자 업체 동작 RPC client 연결 | 디자인·프런트엔드 | DONE | QA-039 PASS | commits `85d947a`·`ed191c6`·보고서 |
| FE-026 | 관리자 현황·문의 운영 조회 RPC client 연결 | 디자인·프런트엔드 | DONE | QA-039 PASS | commit `749bf42`·보고서 |
| QA-039 | 관리자 업체 운영 동작 최종 격리 E2E | 품질·보안 | DONE | 역할·원자성·실패 표시·cleanup PASS | 전용 보고서 |
| BE-025 | Auth 최종 삭제 worker·완료 이력 | 백엔드·데이터 | BLOCKED_AFTER_REVISION_2 | 신규 BE-026 재설계 | `5d66de8`; P0 stale JWT·NULL 문의, P1 교착 |
| BE-026 | Auth 독립 탈퇴 tombstone·JWT drain·동시성 안전화 | 백엔드·데이터 | DONE | 독립 reviewer PASS | commits `fe02b45`·`09701bb`, 38/38 |
| QA-040 | Auth 최종 삭제 worker 격리 E2E | 품질·보안 | DONE | 총괄 PM PASS | stale JWT·NULL 문의·cutover·재시도·cleanup PASS |
| BE-020 | 자체 후기 제출 최소권한 RPC | 백엔드·데이터 | DONE | QA-035 역할 E2E | commit `d698488`, 13/13 PASS·운영 미적용 |
| FE-021 | 자체 후기 제출 RPC client 연결 | 디자인·프런트엔드 | REVISION_REQUIRED | QA-035 실제 브라우저 | commit `ae12db2`, FE-022 최소 보정 필요 |
| QA-035 | 격리 Auth·Storage·역할 브라우저 최종 E2E | 품질·보안 | REVISION_REQUIRED | migration 008 격리 적용 | 보고서 완료·합성 잔존 0 |
| OPS-028 | BE-016 신규 공식 근거 exact GitHub 별도 브랜치 보존 | 품질·운영 | DONE | D-39 승인 | commit `9cdfb6c`, 원격 branch, PR·main·배포 0 |
| OPS-029 | migration 015·016 설치 순서·운영 승인 게이트 문서 정합화 | 총괄 PM·품질 | DONE | BE-019·QA-042·BE-027 원격 보존 | 현재 checkout 001~005·통합 후보 001~016 구분, 문서 누락·오타 0 |
| OPS-030 | 검증 브랜치 통합 순서·충돌·회귀 게이트 읽기 전용 계획 | 총괄 PM·품질 | DONE | OPS-029 | BE-027 기준·QA exact tip·FE 보존 선행 조건 확정 |
| OPS-031 | FE-028·FE-029·QA-045 exact GitHub 별도 브랜치 보존 | 총괄 PM·품질 | DONE | QA-045 PASS·OPS-030 | commit `b424156`, 원격 exact 16파일·blob 16/16 |
| OPS-032 | BE-027 백엔드 후보와 FE snapshot 통합 충돌 읽기 전용 감사 | 총괄 PM·품질 | DONE | OPS-031 | 직접 교집합 0·3-way 충돌 0, 의미상 4흐름 통합 E2E |
| OPS-033 | 격리 통합 후보 조립·전체 회귀 | 총괄 PM·품질 | DONE | 총괄 PM PASS | local HEAD `cdd0929`, 제품 기준 `a66b510`·직접 검사 26/26·build/dist·브라우저·실제 격리 Auth PASS |
| QA-046 | 현행 5행사·공개 헤더 테스트 계약 정합화 | 품질·보안 | DONE | 총괄 PM PASS | local commit `a66b510`, 제품 diff 0 |
| QA-047 | 통합 후보 실제 격리 Auth·RLS·RPC 최종 재검증 | 품질·보안 | DONE | 총괄 PM PASS | 실제 JWT·AAL2·migration 016·cleanup 0 |
| FE-030 | 여러 줄 제목의 프로그램상 단어 공백·접근성 이름 보정 | 디자인·프런트엔드 | BACKLOG | 디자인 후속과 중복 범위 조정 | venues·provider-register 등 시각 정상/`textContent` 결합 공백 누락 |
| FE-031 | 핵심 세부 페이지 톤앤매너·폰트 규격 통합 | 디자인·프런트엔드 | DONE | 총괄 PM PASS | commit `6a227a5`, 고유 draft `6a6ad5c2311d65fe29d4076f` |
| FE-032 | 세부 페이지 이미지 톤·공통 구조·정적 준비백과/SEO | 디자인·프런트엔드 | DONE | 총괄 PM PASS | commit `ce3a409`; D-30 production 반영 완료, 정식 도메인 전환은 D-10 대기 |
| FE-033 | 계산기 결과 하단 배치·완료 후 자동 이동 | 디자인·프런트엔드 | DONE | 총괄 PM PASS | commit `41f90e8`; D-30 production 반영 완료 |
| FE-034 | 계산기 우측 세부 작업공간·실사용 계획 로직 | 디자인·프런트엔드 | DONE | 총괄 PM PASS | 제품 commit `15cf755`, production HEAD `942891b`, deploy `6a6b08fdbf620b000895e2c1` |
| OPS-035 | 업체 후보 수집·연락·방문 실무 양식 | 총괄 PM·마케팅·운영 | DONE | 워크북 검수 PASS | 업체후보·연락방문·상세·견적·질문·선택목록 8개 시트 |
| MKT-012 | 서울 공식 연락 가능 업체 후보 확장 | 마케팅·운영 | DONE | 공식 출처·연락 채널 검수 PASS | 장소·장식·촬영·미용 공식 후보 19곳 추가 |
| MKT-013 | 전국 4개 분야 공공데이터 후보 512곳 균형 확장 | 마케팅·운영 | DONE | 사용자 케이크 편중 피드백 반영·검수 PASS | 장소·음식·숙박·미용·메이크업·케이크 각 128곳 |
| BE-031 | 미검수 후보 20곳 안전 공개 projection | 백엔드·데이터 | DONE | 총괄 PM PASS | 후보 20곳·5분야, 공개 13필드 allowlist, 금지 필드·민감값·문의·후기·비교 활성 0 |
| FE-035 | 미검수 후보 목록·상세·수정 제안 UI | 디자인·프런트엔드 | DONE | 총괄 PM PASS | 후보 20곳 목록·상세·수정 제안·소유권, 금지 정보·기능 노출 0, build·dist PASS |
| QA-050 | 미검수 후보 20곳 공개 안전 게이트 | 품질·보안 | DONE | 총괄 PM PASS | 후보 20·금지 정보·민감값·문의·후기·비교 활성 0, 정정·소유권·noindex·390/768/1440 PASS |
| OPS-036 | 후보 20곳 격리 noindex 온라인 미리보기 | 총괄 PM·품질 | DONE | 총괄 PM PASS | 고유 draft `6a7d58e2955d753e991f76b4`, HTTP·3 viewport PASS, main·production·운영 DB 불변 |
| MKT-014 | 가족사진 스튜디오·가족행사 스냅 작가 공식 연락 후보 보강 | 마케팅·운영 | DONE | 공식 출처·연락 채널·워크북 검수 PASS | 신규 스튜디오 12·사진작가/스냅 8, 촬영 후보 총 22 |
| OPS-034 | 통합 후보 원격 별도 브랜치 보존·고유 온라인 draft | 총괄 PM·품질 | DONE | 총괄 PM PASS | remote `codex/ops-034-integrated-preview`=`cdd0929`, draft `6a6aba4d5ef57d8288accfea`, main·production·운영 DB 불변 |
| QA-048 | 최종 통합 draft 공개·비로그인 다중 뷰포트 회귀 | 품질·보안 | DONE | 총괄 PM PASS | 24/24 화면 조합·overflow 0·깨진 이미지 0·console 0·승인 계약 일치 |
| FE-020 | 공개 업체 safe view·수정 요청 UI 연결 | 디자인·프런트엔드 | DONE | D-41 승인 | commit `aa8d491`, safe view·수정 요청 PASS |
| BE-019 | 업체·견적 v2 additive migration·최소권한 RPC/RLS 구현 | 백엔드·데이터 | DONE | 격리 구현·호환 수정 완료 | `b969191` + `97a5dfb`, 독립 reviewer PASS, 운영 미적용 |
| QA-041 | 업체·견적 v2 실제 격리 Supabase SQL 역할 E2E | 품질·보안 | DONE | SQL + QA-042 실제 Auth PASS | cleanup 0·runtime false |
| QA-042 | 실제 GoTrue JWT·PostgREST·AAL2 MFA E2E | 품질·보안 | DONE | QA-041 후속 | commit `b84d307`, 실제 E2E·cleanup·원격 exact 2파일 PASS |
| BE-027 | 운영 review queue 최소권한 RPC 계약 | 백엔드·데이터 | DONE | QA-041 후속 | commit `8e7eb81`, 구현·검증·원격 exact 3파일 PASS |
| FE-027 | 조건 연계형 가족행사 비용 계산기 세분화 | 디자인·프런트엔드 | DONE | 사용자 직접 요청 | QA-043 Revision 1 PASS, 배포 0 |
| QA-043 | 조건 연계형 계산기 독립 기능·접근성 검수 | 품질·보안 | DONE | FE-027 | 식대 범위·대비 보완 뒤 PASS |
| QA-044 | 공통 JavaScript validate harness 오류 보고 안전화 | 품질·보안 | DONE | 원격 exact 3파일 보존 완료 | commit `5f1e6d0`, fail-closed 원인 보고·전용 5/5·build/dist PASS |
| QA-034 | 기존 민감 객체 metadata-only 운영 전 감사 | 품질·보안 | BLOCKED_READONLY_APPROVAL | D-38 승인·운영 DB read-only 별도 승인 | count-only 보고서·query |
| OPS-027 | BE-016 공식 근거 exact Git 경계 로컬 구현 | 품질·운영 | DONE | 총괄 PM PASS | `.gitignore`, 결과 보고서 |
| QA-033 | 현행 업체·견적 SQL 개인정보·스키마 차이 감사 | 품질·보안 | DONE | 총괄 PM PASS | 객체 25·P0 6·P1 10 |
| BE-018 | 업체·견적 통합 계약 합성 수용 테스트 명세 | 백엔드·데이터 | DONE | 총괄 PM PASS | 수용 52·레거시 6·실패 10 |
| OPS-026 | BE-016 신규 공식 증거 Git 추적 경계 설계 | 품질·운영 | DONE | 총괄 PM PASS | exact 6-file 경계·deny·검증 보고서 |
| QA-032 | 견적 기여·상세 열람 개인정보·악용 사전 검수 | 품질·보안 | DONE | 총괄 PM PASS | 위협 32개·fail-closed; 실제 구현 D-38 |
| BE-017 | 업체 직접등록·고객제안·견적 통합 데이터 계약 | 백엔드·데이터 | DONE | 총괄 PM PASS | 실제 DB·제품 구현 D-38·QA-003 |
| BE-016 | 미용·제과·장례식장 공식 원천 증거 패킷 | 백엔드·데이터 | DONE | 총괄 PM PASS | evidence 3개 디렉터리·전용 보고서, 세 원천 실행 차단 유지 |
| OPS-025 | 공공데이터 공백 8개 분야 직접 등록·제안 SOP | 마케팅·운영 | DONE | 총괄 PM PASS | 전용 운영 보고서 |
| BIZ-009 | 고객 견적 공유·열람 정책 | 사업·서비스 기획 | DONE | 총괄 PM PASS | 전용 정책 보고서 |
| FE-002 | 검색 공개 게이트 최소 수정 | 디자인·프런트엔드 | SUPERSEDED | ADR-016으로 기존 후기 게이트 전제 폐기 | FE-008의 검수 projection·신뢰 표시 범위로 재작성 |
| QA-003 | 스테이징 Auth/RLS/RPC/Storage E2E | 품질·보안 | DONE | QA-040 PASS | 역할·업체·문의·Storage·Auth 삭제 격리 최종 PASS |
| OPS-001 | 운영 공개 기준 정리 | 마케팅·운영 | APPROVAL_REQUIRED | D-06~D-07, 운영 인력 정보 | `docs/09_운영정책.md`, `ADMIN-OPERATING-GUIDE.md` |
| BE-001 | 업체 데이터 API 페이징 | 백엔드·데이터 | BACKLOG | 정적/운영 우선순위·API 계약 | `data.js`, `content-runtime.js`, `scripts/core/api.js`, 페이지 로더 |
| BE-002 | 승인 대상 변경 감지 자동화 | 백엔드·데이터 | BLOCKED | ADR-008·법무·robots·약관 | 격리된 `backend/**` 검토 후 재지정 |
| FE-003 | 게스트→회원 찜 상태 동기화 | 디자인·프런트엔드 | BACKLOG | 저장 키·병합 정책 | `scripts/pages/venues.js`, `scripts/pages/provider.js`, `scripts/core/auth.js` |
| QA-004 | 기준 문서 수치·정의 일관성 감사 | 품질·보안 | DONE | 없음 | 결과 파일 `ops/reports/QA-004-baseline-document-consistency.md` |
| MKT-002 | 기존 준비백과 콘텐츠 품질·통합 감사 | 마케팅·운영 | DONE | 없음 | 결과 파일 `ops/reports/MKT-002-content-quality-audit.md` |
| OPS-002 | 공개 사업·기능 약속 문구 감사 | 마케팅·운영 | DONE | 없음 | 결과 파일 `ops/reports/OPS-002-public-claims-audit.md` |
| MKT-005 | 준비백과 남은 draft 22개 주제별 편집 | 마케팅·운영 | BACKLOG | MKT-008, 주제별 공식 근거·검토일 기준 | `blog-data.js`의 draft를 소규모 묶음으로 편집; 한 번에 전체 공개 금지 |
| MKT-006 | 계약 글 중복 경로·대표 URL 통합 | 마케팅·운영 | BACKLOG | FE-032 정적 URL 완료, D-10 최종 대표 URL 정책 | 새 대표 후보는 `articles/contract-questions.html`; 기존 두 경로의 최종 301과 정식 도메인 canonical은 도메인 연결 때 확정 |
| OPS-005 | 공개 유료·3단계 기능 문구 정정 명세 | 마케팅·운영 | DONE | 없음 | `ops/reports/OPS-005-public-copy-spec.md` |
| FE-004 | 일반·개인정보 문의 접수 경로 최소 구현 | 디자인·프런트엔드 | DONE | 없음 | `contact.html`, `contact-success.html` |
| FE-005 | 미확정 유료·예약·결제 공개 문구 최소 수정 | 디자인·프런트엔드 | DONE | 없음 | `partners.html`, `claim.html`, `vendor-dashboard.html` |
| OPS-006 | GitHub main·Netlify 테스트 배포 | 총괄 PM | DONE | 없음 | 커밋 `b837ea9`, Netlify 반영 확인 |
| QA-006 | Netlify 공개 화면 다중 뷰포트 검수 | 품질·보안 | DONE | D-30 production PASS | `ops/reports/QA-006-netlify-public-smoke.md` |
| OPS-007 | vendor-dashboard 강제 리디렉션 핫픽스 | 디자인·프런트엔드/총괄 PM | DONE | 없음 | `netlify.toml`, draft `6a62c78790a1d9262eab53d3` |
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
| BE-006 | 공공데이터 source·field assertion·public projection 상세 계약 | 백엔드·데이터 | DONE | 2차 보완 후 독립 reviewer PASS | `ops/reports/BE-006-source-assertion-projection-contract.md` |
| FE-008 | 후보·검수 업체 분리와 신뢰·최근성 표시 | 디자인·프런트엔드 | BLOCKED | D-22, BIZ-003, BE-006, CHG-B 정리 | 홈·목록·상세·비교·문의 공통 계약; 파일 범위 추후 지정 |
| FE-009 | 베이지 C안 홈 안전 축소 구현 | 디자인·프런트엔드 | DONE | PM 브라우저 검수 PASS | 홈 3개 파일; 업체/후기/가격/참여 기능은 숨김, draft만 생성 |
| FE-011 | 승인된 최종 홈·준비 도구·비교 화면 구현 | 디자인·프런트엔드 | DONE | PM·독립 QA PASS | 12개 전용 파일, draft `6a619622202cedff2ed28f92`, production·GitHub 미반영 |
| QA-012 | NAVER 비의존 공개 번들·흐름 회귀 검증 | 품질·보안 | BLOCKED | OPS-009·FE-008 구현, CHG-A 테스트 정본 | 공개 NAVER URL/파생 파일 0, 빈/대체 상태, 역할·문의 회귀 |
| QA-016 | 승인된 정보 나눔 홈 링크와 marketplace 검사 정합화 | 품질·보안 | BLOCKED | CHG-A 테스트 정본 소유권 확정 | `scripts/tests/marketplace-flow.mjs`의 홈 예외를 명시하고 나머지 핵심 흐름 금지는 유지 |
| QA-017 | 5개 행사 분류·레거시 alias 자동검사 정합화 | 품질·보안 | BLOCKED | CHG-A 테스트 정본 소유권 확정 | `scripts/tests/sonpum-redesign.mjs`의 8개 분류 기대를 5개 대표 분류, smallWedding→meeting, familyGathering·memorial·home→other 회귀로 교체 |
| FE-010 | 공통 모바일 메뉴 상태명·홈 CTA 정합성 | 디자인·프런트엔드/품질 | BACKLOG | `scripts/components/header.js` 단일 소유권, 모바일 비교함 노출 정책 확인 | 열린 메뉴의 접근성 이름을 `메뉴 닫기`로 갱신하고 홈 하단 `비교함` 노출을 승인된 안전 CTA와 대조 |
| FE-015 | 체크리스트 결혼 준비 제목 중복 정리 | 디자인·프런트엔드 | BACKLOG | 디자인 변경 묶음과 분리된 단일 문구 수정 카드 작성 | `scripts/pages/checklist.js`의 `결혼 준비 준비 순서`를 자연스러운 제목으로 만들고 5종 제목 회귀 |
| FE-016 | 공통 업체 등록 메뉴 목적지 통일 | 디자인·프런트엔드 | BACKLOG | `/provider-join`과 `/provider-register`의 승인된 대표 역할 결정, 공통 헤더 단일 소유권 | 로그인·회원 화면을 포함한 `업체 등록` 메뉴의 목적지 통일 |
| QA-018 | 공개·비로그인 전체 기능 및 권한 경계 회귀 점검 | 품질·보안 | DONE | 없음 | `ops/reports/QA-018-full-functional-audit.md` |
| MKT-010 | 서울 돌잔치 업체 온보딩 제한 파일럿 | 마케팅·운영 | APPROVAL_REQUIRED | OPS-008, D-23~D-26·D-29, 제품 E2E | 실제 외부 연락·온보딩은 사용자 승인 후 별도 실행 |
| OPS-010 | NAVER 비의존 기준 문서 00~12 현행화 | 총괄 PM/문서 | BACKLOG | BIZ-003·QA-011·OPS-008 PM PASS | `docs/00_프로젝트현황.md`~`docs/12_통합실행계획.md`; 역사 보고서 보존 |
| BIZ-004 | 공개 신뢰 라벨·최근성 D-25 결정안 | 사업·서비스 기획 | DONE | PM·독립 reviewer PASS | `ops/reports/BIZ-004-trust-label-decision-packet.md` |
| QA-013 | 사업자·소유권·사진/후기 증빙 D-24 개인정보 결정안 | 품질·보안 | DONE | 역사 보고서; 최신 정본은 QA-015 PASS 보완안 | `ops/reports/QA-013-privacy-evidence-decision-packet.md` |
| MKT-011 | 서울 돌잔치 업체 제한 파일럿 D-26 승인안 | 마케팅·운영 | DONE | 2차 수정 후 PM·독립 reviewer PASS | `ops/reports/MKT-011-seoul-dol-provider-pilot-approval-packet.md` |
| QA-014 | 외부 영업 연락 데이터·수신거부 D-29 결정안 | 품질·보안 | DONE | 총괄 PM·독립 reviewer PASS | `ops/reports/QA-014-outreach-contact-suppression-decision-packet.md` |
| OPS-011 | D-23~D-25 추천안 사용자 결정 통합 검토 | 총괄 PM/운영 | DONE | 분야별 읽기 전용 검토 완료 | `ops/reports/PM-2026-07-22-d23-d25-user-review.md` |
| QA-015 | D-24 현행 안전조치 기준 정합성 보완 | 품질·보안 | DONE | 총괄 PM·독립 reviewer PASS, D-24 승인 완료 | `ops/reports/QA-015-d24-current-standard-alignment.md` |
| BIZ-005 | 운영자 선등록형 출시·수익 준비 모델 | 사업·서비스 기획/운영/품질 | DONE | D-32 승인, 1차 보완 후 독립 reviewer PASS | `ops/reports/BIZ-005-operator-seeded-launch-model.md` |
| OPS-012 | 도메인 구매 전 출시·연결 체크리스트 | 총괄 PM/마케팅·운영/품질 | DONE | 독립 reviewer PASS | `ops/DOMAIN_LAUNCH_CHECKLIST.md`, `ops/reports/OPS-012-pre-domain-launch-readiness.md` |
| OPS-014 | Netlify custom domain·DNS·HTTPS 연결 | 총괄 PM/운영 | APPROVAL_REQUIRED | 실제 도메인 구매, DNS 권한 | primary host, apex/www, 301, 자동 HTTPS |
| OPS-015 | 정식 production 색인 전환 | 총괄 PM/마케팅·프런트엔드 | APPROVAL_REQUIRED | D-10, OPS-014, D-30 | production 전역 noindex 제거, private noindex 유지 |
| FE-017 | 비공개·개인화 화면 경로별 noindex | 디자인·프런트엔드/마케팅 | BACKLOG | D-10, 정식 공개·비공개 URL 목록 | `login.html`, `account.html` 포함 private 화면에 개별 meta/header noindex 후 전역 production noindex 제거 |
| FE-018 | Supabase 이메일 비밀번호 찾기·재설정 | 디자인·프런트엔드/백엔드 | BLOCKED | D-31, Auth Site URL·redirect, 격리 계정 | 요청·이메일 링크·새 비밀번호·만료/오류·계정 열거 방지 E2E; 미구현 시 초기 출시 제외 결정 |
| QA-020 | Supabase Auth URL·역할별 격리 준비 | 품질·보안 | DONE | OPS-023 PASS | 역할 9개·Site URL·외부 알림 0, PM PASS |
| QA-021 | 공식 도메인 최종 출시 검수 | 품질·보안 | BLOCKED | OPS-014·OPS-015·QA-020·FE-017·FE-018 또는 출시 제외 결정 | HTTPS·canonical·OG·sitemap·권한·실제 Netlify 환경변수·배포 번들 비밀·다중 뷰포트 |
| BE-007 | BE-006 계약 기반 격리 로컬 seed 배치 입력·검수 도구 | 백엔드·데이터 | DONE | 2차 수정, synthetic unittest 14개, QA-019 PASS | `backend/public_data_seed/**`, `ops/reports/BE-007-local-seed-tool.md` |
| QA-019 | 공공데이터 배치 이용조건·중복·개인정보·권리 게이트 | 품질·보안 | DONE | 2차 수정 최종 재검수 PASS | `ops/reports/QA-019-seed-safety-gate.md` |
| OPS-013 | 서울 돌잔치 첫 20곳 운영 검수 배치 | 마케팅·운영/백엔드/품질 | REPLANNED | D-34 전국·다분야 방향 | BIZ-007·QA-022·BE-008로 대체 |
| BIZ-007 | 전국 관련 업체 범위·공개 게이트 | 사업·서비스 기획 | DONE | D-34 | 1차 보완 후 PM·독립 reviewer PASS |
| QA-022 | 전국 분야별 공식 원천·이용조건 | 품질·보안 | DONE | D-34 | PM 검수 PASS, 공식 후보 11종·권리/coverage 보류 분리 |
| BE-008 | 전국 다분야 후보 배치 설계 | 백엔드·데이터 | DONE | BE-007·QA-019·D-34 | 1차 보완 후 PM·독립 reviewer PASS |
| BE-009 | 전국 공식 원천 source registry 확장 계약 | 백엔드·데이터 | DONE | BIZ-007·QA-022·BE-008 | 1차 문구 수정 후 PM·독립 reviewer PASS, 실제 호출 0 |
| OPS-016 | 전국 후보 검수 용량·운영 순서 설계 | 마케팅·운영 | DONE | BIZ-007·BE-008 | PM·독립 reviewer PASS, 지역·분야 wave와 중단 기준 확정 |
| QA-023 | 신규 원천 schema·금지 필드 synthetic 게이트 | 품질·보안 | DONE | BE-009 DONE | 2차 보완 후 PM·독립 reviewer PASS, 합성 31·unittest 11·seed 14 통과 |
| QA-025 | 상가정보 `15012005` 제3자 권리 공식 확인 | 품질·보안 | APPROVAL_REQUIRED | 외부 문의 승인 | 저장·가공·공개 가능 필드의 공식 서면 판정 |
| QA-026 | 기존 NAVER 로컬 자료 metadata-only 삭제 대상 감사 | 품질·보안 | DONE | D-27 승인 완료 | PM·독립 reviewer PASS, 19개 파일·28,879행 삭제와 무결성 확인 |
| QA-027 | NAVER API 보조 활용 공식 서면 확인 | 품질·보안 | CANCELLED | ADR-018 | 사용자 결정으로 문의·보조 활용 경로 종료 |
| BE-013 | `15154916` 공식 terms·schema 증거 패킷 | 백엔드·데이터 | DONE | BE-009·QA-023·D-33 | 1차 보완 후 독립 reviewer PASS, blocker 9/9 잔존·실제 API/업체 레코드 0 |
| QA-031 | QA-023 빈 terms·공백 source family 경계 강화 | 품질·보안 | BACKLOG | QA-023 DONE | 비차단 hardening, 실제 실행 승인·공개 영향 없음 |
| OPS-018 | `backend/public_data_seed/**` Git 추적 경계 결정 | 총괄 PM/운영/보안 | DONE | R-08·QA-019·QA-023·BE-013 | 1차 보완 후 독립 reviewer PASS, exact 9-file 경계 |
| OPS-019 | 안전 도구·증거 exact allowlist 로컬 구현 | 총괄 PM/운영/보안 | DONE | OPS-018 DONE·CR-010 | PM 구현·독립 reviewer PASS, Git index·GitHub 0 |
| OPS-020 | OPS-018 `check-ignore -v` negation 설명 정정 | 총괄 PM/운영/보안 | BACKLOG | OPS-018·OPS-019 DONE | 비차단 문서 정리, 비-verbose exit code 또는 `!` 패턴 구분 |
| OPS-021 | 안전 도구·증거 별도 GitHub 브랜치 반영 | 총괄 PM/운영/보안 | DONE | D-36·OPS-019 DONE | commit `1e7f654`, 원격 별도 브랜치, 승인 10개만 반영; PR·main·배포 없음 |
| OPS-022 | 사업·수익·업체 데이터 실행 인수인계 통합 | 총괄 PM | DONE | 기존 전략·운영·데이터 보고서 | `ops/PROJECT_HANDOVER.md`에 최신 사실·승인·다음 실행 통합 |
| OPS-023 | D-31 격리 Supabase 환경 준비 | 총괄 PM/품질·보안 | DONE | D-31 승인 완료 | 무료 project·합성 manifest·schema 적용 완료 |
| BE-014 | D-31 권한·RPC·Storage 최소권한 보안 수정 | 백엔드·데이터 | DONE | QA-003 1차 재현 | commit `d144922`, 격리 적용·멱등·핵심 역할 E2E PASS, 운영 미적용 |
| BE-015 | 업체 승인·공개 projection·문의 원자성 연결 | 백엔드·데이터 | DONE | QA-003 1차·BE-014 PASS | commit `b16ecd8`, 등록·수정·응답 원자성·rollback·멱등 PASS |
| FE-019 | 업체 등록 심사·문의 동의 client 계약 연결 | 디자인·프런트엔드 | DONE | BE-015 DONE | commit `8096618`, CHG-A~C 비접촉·운영 미배포 |
| OPS-024 | 새 Supabase bootstrap 문서 정합화 | 총괄 PM/백엔드·데이터 | DONE | commit `e8510ca` | 001~014 순서·재실행·Edge/runtime 게이트 정합화 |
| BIZ-006 | 유효 문의·응답 기반 수익 실험 결정안 | 사업·서비스 기획 | BLOCKED | inquiry_ready·역할 E2E·실제 문의 표본 | 구독/광고/유효 리드 중 1개 제한 실험과 가격·환불·세금·계약 승인안 |
| QA-056 | GitHub marketplace 구계약 4건 현행화 | 품질·보안 | APPROVAL_REQUIRED | OPS-042 DONE·R-128 | 실패 로그를 현행 승인 UI와 대조해 테스트만 최소 수정하고 제품 회귀 없이 GitHub Actions PASS 확인 |

예약·결제·유료 노출·추천·대규모 수집은 문의·응답 실증 전 후보 상태를 유지한다.
