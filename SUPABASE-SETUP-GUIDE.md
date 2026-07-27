# 손품해방 온라인 저장 연결 가이드

개발 지식이 없어도 순서대로 확인할 수 있는 안내입니다. 다만 운영 DB 적용은 별도 승인 뒤 진행합니다. `service_role` 키는 어떤 경우에도 사이트 파일·GitHub·채팅에 넣지 않습니다.

## 1. Supabase 프로젝트 만들기

1. Supabase에서 새 프로젝트를 만듭니다.
2. `SQL Editor > New query`를 엽니다.
3. 저장소의 `admin-schema.sql` 전체를 붙여넣고 `Run`을 누릅니다.
4. 오류 없이 완료되는지 확인합니다. `admin-schema.sql`은 새 빈 프로젝트에서 한 번만 실행하며 재실행하지 않습니다.
5. `migrations/README.md`의 새 프로젝트 절차에 따라 `003`부터 현재 저장소의 마지막 번호까지 한 파일씩 실행합니다.

기존 프로젝트라면 `admin-schema.sql`을 실행하지 않습니다. 적용 이력과 백업을 확인한 뒤 `migrations/README.md`에 따라 누락된 첫 번호부터 실행합니다.

`013`·`014`를 적용하는 것만으로 실제 계정 자동 삭제가 켜지지 않습니다. Edge Function 배포, 대상 프로젝트의 실제 TTL·쓰기 상한 측정, runtime config, 합성 E2E와 스케줄은 각각 별도 단계입니다. 격리 QA 값을 운영에 복사하지 않습니다.

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

## 5. 격리 환경 최초 동작 확인

실제 고객·업체·증빙 대신 명백한 합성 계정과 파일만 사용하고 종료 후 전부 정리합니다.

1. `/login.html`에서 합성 회원 로그인
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
12. 계정 삭제는 runtime이 활성화된 격리 환경에서만 stale JWT·Storage·재시도·완료 이력·잔존 0을 확인

## 6. 알림 처리 범위

`004_provider_automation.sql`은 웹 알림 작업을 `taran_notification_jobs`에 안전하게 예약합니다. 파트너가 업체 관리 화면에 접속하면 도착 알림과 예약 시간이 지난 리마인드를 확인 처리합니다.

이메일 발송은 공개용 `anon` 키만으로 실행하면 안 됩니다. 이메일을 연결할 때는 Supabase Edge Function 또는 별도 서버에서만 발송 서비스 비밀키를 사용하고, 성공·실패 결과를 `taran_notification_jobs`에 기록합니다. 이메일 발송 서버가 연결되기 전에는 사용자 화면에 이메일 알림이 작동한다고 표시하지 않습니다.

## 7. 운영 보안 원칙

- 관리자 권한은 필요한 사람에게만 부여합니다.
- 견적서·사진은 비공개 Storage에 저장되며 공개 URL을 만들지 않습니다.
- 고객 연락처는 견적 처리 목적 외에 사용하지 않습니다.
- 탈퇴 요청은 승인된 server-only worker만 처리합니다. runtime config·Edge Function·스케줄이 검증되지 않았다면 자동 삭제가 작동한다고 공개하지 않습니다.
- SQL, 정책 또는 키를 바꾼 뒤에는 로그인·저장·공개 읽기를 다시 시험합니다.
- 운영 DB migration, 실제 고객 탈퇴, Edge 배포·스케줄, main 병합과 production 배포는 별도 사용자 승인 전 실행하지 않습니다.
