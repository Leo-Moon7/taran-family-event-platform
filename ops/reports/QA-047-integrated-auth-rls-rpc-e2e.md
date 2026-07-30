# QA-047 통합 후보 실제 Auth·RLS·RPC 최종 재검증

- 기준일: 2026-07-30
- 판정: `PASS`
- 대상: `Sonpum QA Isolated` / Taran / Free / Healthy / nano
- 통합 후보 기준: `a66b51061d5840d15e303b3119ccb387fd16e537`

## 실제 결과

`migration 016`을 격리 프로젝트에 적용한 뒤 실제 GoTrue JWT와 PostgREST를
사용했다. SQL 역할 모의만으로 판정하지 않았다.

| 시나리오 | 결과 |
| --- | --- |
| 익명 private base | `401`, 차단 |
| 익명 public quote RPC | `200`, 허용 |
| customer private base | `403`, 차단 |
| customer proposal | `200`, 허용 |
| content 운영 변경 위장 | `403`, 차단 |
| provider 고객 견적 위장 | `403`, 차단 |
| operations AAL1 변경 | `403`, 차단 |
| 실제 TOTP AAL2 변경 | `200`, 허용 |
| review queue 익명 | `401`, 차단 |
| review queue customer/provider/content/operations AAL1 | `403 / 42501`, 차단 |
| review queue operations AAL2 | `200`, 1행·승인 필드 6개 |
| review queue page size 51 | `400 / 22023`, 차단 |

## cleanup

최종 count-only 감사에서 Auth user, identity, MFA factor, session, refresh token,
admin profile, provider, submission, provider grant, audit event, Storage object가
모두 `0`이었다. runtime의 contribution, evidence upload, public projection,
exact amount 4종도 모두 `false`였다.

공개 anon 키와 임시 credential은 메모리에서만 사용했고 비밀 출력·파일 저장은
0건이다. `service_role`은 열거나 사용하지 않았다. 실제 사용자·업체·견적·증빙,
운영 Supabase, 외부 이메일·문자, Storage 실파일 영향은 0건이다.

## 로컬 회귀

- QA-042 Auth HTTP 하네스 계약: `10/10 PASS`
- BE-019 정적 계약: `28/28 PASS`
- BE-019 모델: `60/60 PASS`
- BE-027 정적 계약: `11/11 PASS`
- QA-047 review queue Auth HTTP 하네스 계약: `3/3 PASS`
- JavaScript 구문: `108/108 PASS`
- marketplace, redesign, build, dist: `PASS`

표준 validate의 child-process 실행은 sandbox `EPERM`을 fail-closed로 보고했고,
같은 108개 파일을 부모 PowerShell에서 `node --check`로 직접 실행해 실패 0을
확인했다.

## 변경 범위

- 추가: `scripts/tests/provider-contribution-review-queue-v2-auth-http-e2e.mjs`
- 추가: `ops/reports/QA-047-integrated-auth-rls-rpc-e2e.md`
- 격리 DB: additive migration 016 적용
- 제품 파일·운영 DB·원격 Git·PR·main·Netlify: 변경 0

QA-047 완료 조건을 충족하므로 `DONE` 처리할 수 있다. 다음 게이트는 D-46 승인
후 exact 통합 후보의 원격 별도 브랜치 보존과 production 별칭을 바꾸지 않는
고유 draft 생성이다.
