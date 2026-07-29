# QA-042 실제 GoTrue JWT·PostgREST·AAL2 MFA E2E

## 작업 결과

- 작업 ID: `QA-042`
- 실행 판정: `PASS`
- 산출물 보존 상태: `BLOCKED_GIT_PERMISSION`
- 대상: 정확한 `Sonpum QA Isolated` / Taran 조직 / Free / Healthy / nano
- 운영 프로젝트·운영 DB·실제 사용자·실제 업체·실제 견적 영향: `0`

## 범위

실제 GoTrue 로그인으로 발급된 서명 JWT와 PostgREST HTTP를 사용해 익명,
고객, content, provider, operations AAL1, operations AAL2의 허용·차단 경계를
검증했다. SQL Editor의 `set local role` 모의만으로 PASS 처리하지 않았다.

비밀 `service_role`은 열거나 사용하지 않았고 공개 anon 키는 메모리에서만
사용한 뒤 clipboard를 비웠다. 이메일·문자 발송과 Storage object 생성은 0건이다.

## 실행 결과

| 시나리오 | 결과 |
| --- | --- |
| anon private base 접근 | `401 / 42501`, PASS |
| anon public quote RPC | `200`, PASS |
| customer private base 접근 | `403 / 42501`, PASS |
| customer proposal RPC | `200`, PASS |
| content operations mutation | `403 / 42501`, PASS |
| provider grant 계정의 customer reward 위장 | `403 / 42501`, PASS |
| operations AAL1 mutation | `403 / 42501`, PASS |
| 실제 TOTP 등록·challenge·verify | AAL2 획득 `200`, PASS |
| operations AAL2 mutation | `200`, PASS |
| TOTP factor 해제 | `true`, PASS |
| 4개 임시 계정 global logout | `4/4`, PASS |

HTTP audit 결과는 customer proposal `1`, quote `0`, grant `2`, AAL2 grant `1`로
시나리오와 일치했다. factor, session, refresh token, Storage object는 audit 시점에
모두 `0`이었다.

## 사전·사후 정리

시작 preflight는 `QA-042_PREFLIGHT_PASS`였다. Auth user, identity, MFA factor,
session, refresh token, admin profile, provider, submission, provider grant,
audit event, Storage object의 QA-042 namespace가 모두 `0`이고 runtime 4종이
모두 `false`였다.

cleanup 뒤 감사와 별도 final preflight에서도 같은 11종이 모두 `0`,
`namespace_zero=true`, runtime 4종 `false`를 확인했다. 따라서 임시 계정,
MFA factor, 세션, 합성 행, 공개 활성 상태는 남지 않았다.

## 로컬 회귀

- QA-042 Auth HTTP contract: `10/10 PASS`
- BE-019 static contract: `28/28 PASS`
- BE-019 model: `60/60 PASS`
- D-31 및 public projection 회귀: `PASS`
- account deletion 회귀: `13/13`, `15/15`, `10/10 PASS`
- `node --test` 합본 실행은 현재 sandbox의 child-process `EPERM`으로 실행되지
  않았지만 각 테스트 파일 직접 실행은 PASS했다.

## 산출물·권한 한계

격리 worktree의 기존 하네스:

- `scripts/tests/provider-contribution-quote-v2-auth-http-e2e.mjs`
- SHA-256: `747EB410C5E8D3B9C4A489867EF43AA1A3DD25B007E76B4A18236CD24E863E83`

현재 Codex writable root에 해당 worktree가 포함되지 않아 보고서 추가와 Git
index 쓰기가 거부됐다. 카드 밖 제품 파일이나 main에 우회 기록하지 않았으며,
본 총괄 PM 보고서에 실행 증거를 먼저 보존했다. 쓰기 가능한 환경에서 하네스와
보고서를 exact 범위로 커밋하기 전 운영 적용·main 병합은 금지한다.

## 판정

실제 인증·권한·MFA 완료 조건과 cleanup 조건은 충족해 실행 결과는 `PASS`다.
다만 exact QA 산출물의 브랜치 보존이 남아 작업 보드 상태는
`BLOCKED_GIT_PERMISSION`으로 유지한다.
