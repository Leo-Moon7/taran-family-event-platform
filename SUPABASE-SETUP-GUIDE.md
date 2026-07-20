# 따란 온라인 저장 연결 가이드

개발 지식이 없어도 아래 순서대로 한 번만 설정하면 됩니다. `service_role` 키는 어떤 경우에도 사이트 파일·GitHub·채팅에 넣지 않습니다.

## 1. Supabase 프로젝트 만들기

1. Supabase에서 새 프로젝트를 만듭니다.
2. `SQL Editor > New query`를 엽니다.
3. 저장소의 `admin-schema.sql` 전체를 붙여넣고 `Run`을 누릅니다.
4. 오류 없이 완료되는지 확인합니다. 같은 SQL을 다시 실행해도 기존 표를 지우지 않도록 작성되어 있습니다.

기존 프로젝트에 이전 스키마를 이미 실행했다면 아래 파일을 번호 순서대로 실행합니다. 각 마이그레이션은 기존 업체·회원·콘텐츠 데이터를 삭제하지 않고 필요한 열과 정책을 추가합니다.

1. `migrations/002_security_hardening.sql`
2. `migrations/003_marketplace_comparison_flow.sql`
3. `migrations/004_provider_automation.sql`

`004_provider_automation.sql`은 업체 정보 완성도, 문의 즉시 웹 알림, 12시간 리마인드, 24시간 만료, 응답률·평균 응답 시간, 오래된 정보의 문의 수신 제한을 추가합니다. 실행 후 `migrations/README.md`의 확인 항목을 순서대로 점검합니다.

## 2. 로그인 주소 설정

`Authentication > URL Configuration`에서 다음을 설정합니다.

- Site URL: 실제 Netlify 주소
- Redirect URLs: `https://내주소.netlify.app/**`

`Authentication > Providers > Email`은 활성화하고, 초기 운영 중에는 이메일 확인을 켜는 것을 권장합니다.

## 3. 첫 관리자 만들기

1. 공개 사이트 회원가입에서 본인 관리자 이메일로 가입합니다.
2. Supabase `SQL Editor`에서 아래 SQL의 이메일만 바꿔 실행합니다.

```sql
insert into public.taran_admin_profiles (user_id, email, role)
select id, email, 'owner'
from auth.users
where email = '내관리자이메일@example.com'
on conflict (user_id) do update set role = 'owner', email = excluded.email;
```

관리자 역할은 `owner`, `admin`, `operations`, `content` 중 하나입니다. 업체 담당자는 `provider` 역할을 사용하지만 관리자 화면이 아닌 `/partner.html`에서 자신에게 승인된 업체만 관리합니다.

- `owner`: 전체 설정과 관리자 권한
- `admin`: 전체 운영
- `operations`: 견적·업체·회원 관리
- `content`: 준비백과·배너·커뮤니티 관리
- `provider`: 자신의 업체 정보만 관리

## 4. Netlify에 공개 설정값 넣기

Supabase `Project Settings > API`에서 다음 두 값만 확인합니다.

- Project URL
- anon public key

Netlify `Site configuration > Environment variables`에 다음 이름으로 등록합니다.

```text
SUPABASE_URL=Project URL
SUPABASE_ANON_KEY=anon public key
```

다시 배포하면 `scripts/build/write-config.mjs`가 공개용 설정 파일을 자동 생성합니다. `service_role` 키는 넣지 않습니다.

## 5. 최초 동작 확인

1. `/login.html`에서 회원 로그인
2. `/admin/`에서 관리자 화면 진입
3. 테스트 업체를 `검수 중`으로 등록 후 `공개` 전환
4. 공개 목록과 상세 화면에서 업체 확인
5. 업체 상세에서 테스트 견적 문의 접수
6. 관리자 `견적 관리`에서 접수 확인
7. 테스트 후기 등록 후 `업체 관리 > 공개 대기 후기`에서 공개
8. `정보 공유`에서 자료를 제출하고 관리자 승인 후 포인트 반영 확인
9. 업체 관리 화면에서 프로필 완성도와 빠진 정보 확인
10. 테스트 문의를 열어 `신규 문의 → 열람` 상태 변경 확인
11. 관리자 `운영 예외`에서 전송 실패·미응답·오래된 정보만 표시되는지 확인

## 6. 알림 처리 범위

`004_provider_automation.sql`은 웹 알림 작업을 `taran_notification_jobs`에 안전하게 예약합니다. 파트너가 업체 관리 화면에 접속하면 도착 알림과 예약 시간이 지난 리마인드를 확인 처리합니다.

이메일 발송은 공개용 `anon` 키만으로 실행하면 안 됩니다. 이메일을 연결할 때는 Supabase Edge Function 또는 별도 서버에서만 발송 서비스 비밀키를 사용하고, 성공·실패 결과를 `taran_notification_jobs`에 기록합니다. 이메일 발송 서버가 연결되기 전에는 사용자 화면에 이메일 알림이 작동한다고 표시하지 않습니다.

## 7. 운영 보안 원칙

- 관리자 권한은 필요한 사람에게만 부여합니다.
- 견적서·사진은 비공개 Storage에 저장되며 공개 URL을 만들지 않습니다.
- 고객 연락처는 견적 처리 목적 외에 사용하지 않습니다.
- 탈퇴 요청은 관리자 DB에서 확인하고, 법정 보관 의무가 없는 Auth 사용자와 자료를 삭제합니다.
- SQL, 정책 또는 키를 바꾼 뒤에는 로그인·저장·공개 읽기를 다시 시험합니다.
