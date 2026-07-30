# 릴리스 체크리스트

## 2026-07-30 격리 검증 현황

- [x] 별도 무료 Supabase 격리 프로젝트 구성, 합성 계정·합성 업체만 사용
- [x] `BE-014` 권한·RPC·문의 RLS·증빙·동의·탈퇴 보정 최초/반복 적용과 핵심 역할 E2E
- [x] `BE-015` 업체 등록·수정 요청·관리자 심사·문의 응답 원자성 및 실패 rollback E2E
- [x] `FE-019` 등록 심사 RPC와 문의 동의 payload 정적 계약 검증
- [x] `D-41` 승인 후 `FE-020` 공개 safe view·업체 수정 요청 UI 연결
- [x] `BE-020` 후기 제출·검수 최소권한 RPC와 `FE-021` client 정적·build·dist 검증
- [x] migration 008 격리 최초·멱등 적용과 후기 역할 E2E 13/13
- [x] QA-035 고객 로그인·공개 업체 목록·상세·등록 4단계와 종료 cleanup 0
- [x] FE-022 후기 성공·중복 상태 보정과 실제 브라우저 확인
- [x] BE-021 관리자 본인 역할 조회 최소권한 보정
- [x] BE-022 공개 provider/review projection Advisor 오류 2→0
- [x] Chrome 파일 접근 허용 뒤 QA-036 실제 Storage upload·signed URL·역할별 delete 재검증
- [x] FE-023 업체 등록 동의 버전 payload와 실제 pending 등록 확인
- [x] BE-023·FE-024 관리자 업체 관리 세 독립 큐 최소권한 연결과 QA-037 reviewer PASS
- [x] QA-038 관리자 잔여 direct read/write 감사와 최소 후속 경계 확정
- [x] BE-024·FE-025·FE-026 최소권한 보정과 QA-039 결합 E2E PASS
- [x] Auth 최종 삭제 worker·완료 이력과 QA-003 최종 PASS
- [x] `BE-019` migration 015 v2 저장 기반과 기본 비활성 계약 검수
- [x] `QA-041` migration 015 PGlite 권한·불변조건 검증
- [x] `QA-042` migration 015 실제 Auth·HTTP 역할 경계와 종료 정리 검증
- [x] `BE-027` migration 016 운영 검토 큐 RPC의 AAL2·역할·6개 필드·최대 50건 계약 검수
- [x] `QA-044` 검증 하니스 오류 보고 보정과 독립 회귀 검증
- [x] 검증 산출물을 GitHub 원격 분리 브랜치에 보존
- [x] FE-028·FE-029·QA-045 최신 계산기·헤더 결과를 commit `b424156` 원격 exact 16파일로 보존
- [ ] 위 격리 결과의 운영 DB 적용 승인과 별도 migration 계획

현재 `BE-014` 이후 보정과 FE·BE 보안 작업, migration `015`·`016`은 별도 브랜치와 격리 Supabase에서만 검증했다. 검증 커밋은 GitHub 원격 분리 브랜치에 보존했지만 `main`, 운영 Supabase, Netlify production에는 아직 반영하지 않는다.

## 사업·범위

- [ ] 승인된 MVP와 공개 기준에 일치
- [ ] 불필요한 신규 기능·리팩터링 없음
- [ ] 사용자 승인 항목 완료
- [x] 운영자 선등록 데이터 계약 BE-006 독립 검수 PASS
- [x] 격리 로컬 후보 seed 도구 BE-007 unittest 14개·QA-019 안전 게이트 PASS
- [ ] D-33 승인 후 서울 돌잔치 첫 20곳 비공개 검수 OPS-013 완료
- [ ] 운영 DB·공개 반영 전 별도 migration·staging·역할 E2E·공개 승인

## 변경 통제

- [ ] 작업 ID·담당·허용 경로 일치
- [ ] 다른 활성 작업과 파일/API/스키마/흐름 충돌 없음
- [ ] 공통 변경 요청 승인
- [ ] 기존 사용자 변경 보존

## 자동 검증

- [ ] `pnpm test` — 2026-07-23 FE-009 기준 1건 실패: 승인된 홈 `정보 나눔` 링크와 과거 검사 충돌, QA-016 대기
- [x] `pnpm build` — 2026-07-23 통과, Supabase 미설정 경고 확인
- [x] `pnpm test:dist` — 2026-07-23 통과
- [x] FE-009 브라우저 검수 — 2026-07-23 통과, 390/768/1440px 가로 넘침 0·모바일 메뉴·검색 이동·콘솔 오류 0
- [ ] 깨끗한 설치/CI 재현

## 운영·보안

- [ ] 운영/스테이징 마이그레이션 `001`~`016` 적용 이력과 백업 확인
- [ ] 익명·회원·업체·콘텐츠·운영·관리자 허용/거부 E2E
- [ ] 비공개 Storage·서명 URL·탈퇴·삭제·감사 로그 검증
- [ ] migration 015 런타임 플래그 4개 `false`, v2 Storage·업로드 URL·서명 URL 없음 확인
- [ ] migration 016 검토 큐의 운영 역할+AAL2·6개 필드·1~50건·직접 기본 표 권한 없음 확인
- [ ] v2 실제 업체 자료 접수·증빙 업로드·정확한 금액 저장·공개 반영의 별도 승인
- [ ] 실제 사업자·개인정보·문의 창구 확정
- [ ] 공식 도메인·canonical·sitemap·robots 확인
- [ ] 알림 발송 성공/실패를 UI가 정확히 표시
- [ ] 데이터 백업·복구와 건수 대조
- [ ] NAVER 파생 7개 정적 파일, 9개 HTML 참조, 공개 NAVER URL과 홈·목록·상세·비교·문의·claim·관리자 병합이 source/dist/캐시에 없음(D-22·OPS-009·QA-012)
- [ ] 4,960건이 공개 업체·입점·검증·SEO·서울 파일럿 수치에 포함되지 않음
- [ ] 공개 업체 필드에 정보 제공 주체·출처·관리자 검수·최근 확인일/확인 필요가 표시됨
- [ ] 공공데이터는 D-23에서 승인된 dataset·필드·이용허락·출처 문구만 사용
- [ ] 사업자번호·소유권·후기/사진 증빙은 D-24의 목적·보유·접근·파기 기준과 RLS를 통과
- [ ] 사업자 확인, 업체 제출, 관리자 검수, 최근성이 하나의 `검증 완료` 배지로 합쳐지지 않음
- [ ] 예약·결제·에스크로·정산·예약 확인 후기와 미확정 Premium·가격·수수료를 제공 기능처럼 표시하지 않음
- [ ] 운영 커뮤니티 미구성·조회 실패 시 가상 활동 대신 빈 상태(FE-007)
- [ ] C안 CTA가 QA-008의 준비 상태와 일치하고 차단·부재 기능을 약속하지 않음

## 배포 게이트

최종 병합과 운영 배포는 사용자 승인 전 수행하지 않는다.

## 공식 도메인 전환

- [x] 도메인 구매 전 적용 순서·rollback 문서 작성: `ops/DOMAIN_LAUNCH_CHECKLIST.md`
- [ ] 실제 도메인과 primary host(apex 또는 www) 결정
- [ ] Netlify custom domain·DNS·HTTPS
- [ ] Supabase Auth Site URL·production redirect
- [ ] production만 전역 noindex 제거
- [ ] `login.html`, `account.html`을 포함한 관리자·회원·작성 화면의 경로별 noindex 적용 후 전역 production noindex 제거
- [ ] 비밀번호 찾기·재설정 FE-018 통과 또는 초기 출시 제외 결정
- [ ] canonical·OG·sitemap·robots 정식 host 적용
- [ ] apex/www 301·HTTPS·로그인·공유·색인 최종 QA
- [ ] HSTS preload는 초기 전환에서 사용하지 않음

## FE-009 온라인 초안

- [x] production 별칭을 바꾸지 않는 Netlify draft 생성: deploy `6a614bf21e9fc5a87195f051`
- [x] draft에서 홈 제목·8개 행사·로그인 링크·검색 이동·NAVER 공개 문구 부재·콘솔 오류 0 확인
- [ ] 사용자의 시각 확인
- [ ] QA-016·QA-012 등 남은 테스트 게이트 정리
- [ ] 최종 배포 사용자 승인
