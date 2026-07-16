# 백엔드 연결 감사

## 단일 운영 구조

- 인증: Supabase Auth
- 데이터베이스: Supabase PostgreSQL
- 파일: 비공개 Supabase Storage
- 권한: RLS + `taran_admin_profiles`
- 호스팅: Netlify

공개 페이지와 관리자는 동일한 Supabase REST·Auth·Storage 구조를 사용합니다. `/api` 호환 호출은 `scripts/core/auth.js` 내부에서 동일한 Supabase 데이터로 변환하며 별도 서버와 혼합하지 않습니다.

## 연결된 기능

- 회원가입·로그인·로그아웃·계정 삭제 요청
- 관심 업체, 계산기, 체크리스트 계정 저장
- 견적 문의
- 내부 후기 등록과 공개 검수
- 견적·사진 공유, 포인트, 리워드 교환
- 업체 담당자 권한 요청, 비공개 서류 검수, 승인 업체 전용 수정 RPC
- 커뮤니티 글·댓글과 글 공개 검수
- 업체·준비백과·배너·회원·통계 관리자 CRUD

## 보안 확인

- service role key와 DB 비밀번호는 저장소·브라우저 코드에 없습니다.
- 사용자 입력은 `textContent` 또는 구조화된 필드로 출력합니다.
- 비공개 파일은 공개 URL을 만들지 않고 권한 확인 후 서명 URL을 발급합니다.
- 파일 MIME, 용량, 저장 경로, RLS를 제한합니다.
- 관리자 쓰기는 역할별 RLS를 통과해야 합니다.

## 운영 전 외부 확인

`admin-schema.sql` 실행, 첫 owner 계정 등록, Netlify의 `SUPABASE_URL`·`SUPABASE_ANON_KEY` 설정이 필요합니다. 이는 소스 코드에 비밀값을 넣지 않기 위한 정상적인 배포 절차입니다.
