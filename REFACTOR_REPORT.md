# 1차 구조 리팩터링 보고서

## 완료한 작업

- 따란 브랜드 설정과 저장 키 마이그레이션 모듈 추가
- 홈페이지를 3개 조건 검색과 핵심 섹션 중심으로 전환
- 업체 목록의 중복 정렬 제거, URL·필터·뒤로가기 동기화
- 업체 상세의 실제 데이터 조건부 노출과 내부·외부 후기 분리
- CMS를 사전 정의 문구 슬롯과 안전한 URL만 허용하도록 변경
- 관리자 화면을 역할별 페이지와 공통 셸로 분리
- 로딩 스켈레톤을 `innerHTML` 없이 생성하도록 변경
- 불필요한 단일 관리자 스크립트와 설정 파일 삭제

## 생성한 주요 파일

- `scripts/core/brand.js`
- `scripts/components/admin-shell.js`
- `scripts/pages/admin/*.js`
- `admin/index.html`
- `BRAND_AUDIT.md`, `BACKEND_AUDIT.md`

## 삭제한 파일

- `admin.js`
- `admin-config.js`
- `scripts/pages/admin.js`

## 저장 키 마이그레이션

이전 `memoa-`, `nopoom-`, `sonpum-` 키 중 필요한 값만 대응하는 `taran-` 키로 복사합니다. 새 키가 이미 있으면 덮어쓰지 않으며 이후 저장은 새 키만 사용합니다.

## 공통 컴포넌트

- Header
- Button
- Form
- Card
- Badge
- Filter
- Modal
- Toast
- Loading/Empty/Error state
- Admin shell

## 숨긴 미완성 기능

실제 백엔드가 필요한 로그인, 온라인 수정, 파일 업로드, 실제 통계는 완료된 기능처럼 노출하지 않습니다. 관리자 화면은 연결 상태를 명확히 표시합니다.

## 남은 작업

- Supabase 프로젝트 값과 관리자 계정 연결
- RLS 정책 적용 및 실제 CRUD 통합 테스트
- 파일 업로드 Edge Function
- 아직 레거시 스타일을 쓰는 보조 페이지 순차 전환
- 실제 기기와 브라우저를 이용한 전 페이지 접근성 회귀 테스트

## 확인 결과

- 새 JavaScript 파일 문법 검사 완료
- 핵심 페이지에서 이전 브랜드 사용자 노출 없음
- 목록 정렬 하나로 통합 및 브라우저 뒤로가기 상태 복원
- 모바일 관리자 사이드바와 핵심 페이지 반응형 규칙 유지
