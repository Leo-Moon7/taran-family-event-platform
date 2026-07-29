# QA-044 공통 JavaScript validate harness 오류 보고 안전화

## 작업 결과

- 작업 ID: `QA-044`
- 최종 판정: `PASS`
- 제품·API·DB·migration·package/lock·환경변수 변경: `0`
- Git stage·commit·push·배포: `0`

현재 sandbox에서 JavaScript 문법 검사용 child `spawnSync`가 `EPERM`으로
실패할 때 `stderr`가 `undefined`여서 발생하던 `TypeError`를 제거했다. 실행
실패는 PASS로 바꾸지 않고 대상 파일과 `error code`를 포함한 한 건의
fail-closed 오류로 보고한다. 그 뒤 기존 HTML·CSS·보안·운영 파일 검사는
계속 실행한다.

## 수정·추가·삭제 파일

- 수정: `scripts/tests/validate.mjs`
- 추가: `scripts/tests/validate-harness-error-reporting.mjs`
- 추가: `ops/reports/QA-044-validate-harness-error-reporting.md`
- 삭제: 없음

QA-042·BE-027·FE-027 exact 파일과 제품 HTML·JS·CSS, package/lock, DB·API,
migration, 환경변수는 수정하거나 되돌리지 않았다.

## 환경

- Windows PowerShell
- 번들 Node `v24.14.0`
- Node 경로:
  `C:\Users\mch45\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`
- 제약: 부모 PowerShell의 직접 Node 실행은 가능하지만 Node 내부 child
  `spawnSync(process.execPath, ...)`는 `EPERM`
- build의 Supabase 설정: 미설정. 온라인 전용 기능 숨김 경고 뒤 로컬
  `dist/` 생성

## 구현 계약

- `undefined`, `null`, 문자열, `Buffer` 출력을 안전한 문자열로 정규화한다.
- `result.error`가 있으면 `JavaScript 문법 검사 실행 실패`, 대상 파일,
  `error code`와 이용 가능한 오류 상세를 기록한다.
- spawn 실행 실패는 `ok: false`, `spawnFailed: true`이며 첫 실패 뒤
  JavaScript child 루프만 중단해 동일 환경 오류의 대량 출력을 막는다.
- 정상 `status === 0`은 기존처럼 통과한다.
- 정상 실행된 syntax check의 비정상 status는 기존
  `JavaScript 문법 오류: <파일>` 계약과 stderr 우선 출력을 유지한다.
- stderr가 없으면 stdout을 사용하고 둘 다 없으면 exit code·signal을
  포함해 fail-closed 처리한다.
- import 시 전체 validator가 실행되지 않게 direct execution을 구분해
  합성 테스트가 실제 판정 함수를 직접 검증한다.

## 실행 테스트·통과·실패

| 검사 | 결과 | 재현 근거 |
| --- | --- | --- |
| 수정 전 실제 `validate.mjs` | 기존 FAIL | `validate.mjs:41`에서 `result.stderr.trim()`이 `TypeError` |
| 두 QA JavaScript `node --check` | PASS | 문법 오류 0 |
| `node scripts/tests/validate-harness-error-reporting.mjs` | PASS | 정상, syntax fail, EPERM, ENOENT, stderr 없음 `5/5` |
| 수정 후 실제 `node scripts/tests/validate.mjs` | EXPECTED FAIL-CLOSED | exit `1`, `account.js`, `error code: EPERM`, `TypeError` 0 |
| 저장소 JavaScript 직접 `node --check` | PASS | validator 제외 규칙 기준 `78/78`, 실패 0 |
| `node scripts/build/prepare-dist.mjs` | PASS | Supabase 미설정 경고 뒤 `dist/` 생성 |
| `node scripts/tests/validate-dist.mjs` | PASS | HTML 40개, 로컬 참조·공개 제외 목록 |
| dist QA harness 제외 | PASS | `dist/scripts/tests`와 두 validator 파일 모두 없음 |
| exact 파일 `git diff --check` | PASS | 공백 오류 0 |

수정 후 실제 validator의 출력은 다음 의미를 갖는다.

```text
검사 실패 1건
1. JavaScript 문법 검사 실행 실패: account.js [error code: EPERM]
spawnSync ...\node.exe EPERM
```

오류가 이 한 건뿐이므로 spawn 실패 뒤 실행된 기존 HTML 중복 ID·스크립트·로컬
참조, 레거시 CSS, CSS 변수, SQL 보안 정책, 상세 이동 경로, 필수 운영 파일
검사에서 추가 결함은 발견되지 않았다.

## 완료 조건

| 조건 | 판정 |
| --- | --- |
| stderr `undefined`에서 TypeError 0 | PASS |
| EPERM·ENOENT를 fail-closed 처리 | PASS |
| 실행 실패 대상 파일·error code 보고 | PASS |
| 정상 syntax check 계약 불변 | PASS |
| 기존 HTML·CSS·보안 검사 유지 | PASS |
| 허용 exact 3파일 외 작업 변경 0 | PASS |

## 보안·개인정보 영향

- 실행 실패를 성공으로 오인하지 않아 정적 검사 우회 위험을 줄였다.
- stdout·stderr·error message만 출력하며 환경변수·비밀키·개인정보를 새로
  수집하거나 기록하지 않는다.
- 운영 DB·실제 계정·실제 업체·고객 데이터·외부 네트워크를 사용하지 않았다.
- 배포 bundle에는 QA harness가 포함되지 않는다.

## 신규 결함·잔여 오류

- 신규 제품 결함: 없음.
- 잔여 환경 제한: 현재 sandbox는 Node child 실행을 계속 `EPERM`으로
  차단하므로 표준 `validate.mjs` 전체 JavaScript child 문법 검사는 exit `1`이
  정상이다. 각 JavaScript 78개는 부모 PowerShell에서 직접 실행해 모두
  통과했다.
- Supabase 미설정 build 경고는 기존 로컬 계약이며 QA-044 결함이 아니다.

## 병합 권고

`PASS`. 독립 검수 뒤 위 exact 3파일만 후속 Git 보존 대상으로 포함할 수 있다.
현재 작업에서는 stage·commit·push·main 병합·production 배포를 수행하지
않았다.
