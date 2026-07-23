# OPS-006 GitHub main·Netlify 테스트 배포 결과

- 작업 ID: OPS-006
- 판정: DONE
- 제품 구현: FE-004·FE-005 PASS
- 외부 배포: 2026-07-21 사용자 실행 완료

## 최종 배포 증거

- 커밋: `b837ea969d21f6bf01e7a8ccd8eae6a0a7477a27`
- 제목: `fix: align public promises and add contact form`
- 로컬 `main`, `origin/main`, 원격 `refs/heads/main` 일치
- 커밋 파일: `claim.html`, `contact.html`, `contact-success.html`, `partners.html`, `vendor-dashboard.html`
- Netlify에서 새 문의 폼·성공 화면·정정 문구 표시 확인
- 기존 CHG-A~C와 운영 문서는 커밋에 포함되지 않음

## 완료된 검증

- JavaScript 문법: 82개, 실패 0
- 마켓플레이스 검사: PASS
- 손품해방 리디자인 검사: PASS
- 배포 묶음 생성: PASS
- 배포 산출물 검사: HTML 40개, 공개 제외·로컬 참조 PASS
- 로컬 브라우저: 390×844, 768×1024, 1440×1000에서 문의 폼 가로 넘침 없음
- 공개 문구 검사: 금지 가격·수수료·Premium 혜택 0건
- 호환 ID: 4개 hidden 보존

`pnpm test` 통합 래퍼는 현재 샌드박스에서 `validate.mjs`의 자식 Node 생성이 차단되어 테스트 코드가 `stderr`를 읽는 과정에서 중단됐다. 제품 오류가 아니라 실행 환경 제한이며, 동일 JavaScript 문법 검사를 PowerShell에서 82개 파일에 분해 실행하고 나머지 테스트를 직접 실행해 모두 통과했다.

## 해소된 차단 원인

1. 이전 실행 환경의 `.git/index.lock` 제한은 사용자 실행 스크립트로 우회하지 않고 정상 Git 실행해 해소했다.
2. 브라우저 파일 업로드는 사용하지 않았고 승인된 파일만 Git에서 선택 커밋했다.
3. GitHub CLI는 설치되어 있지 않다.

## 보안 확인

- 2026-07-21 GitHub 설정에서 비공개 저장소 전용 안내가 표시돼 `Private` 전환을 확인했다.
- `docs/**`, `ops/**`, `.codex/**`, `AGENTS.md` 운영 기준선은 이번 제품 커밋에 포함하지 않았다.
- 운영 기준선은 별도 비밀·개인정보 검사와 독립 커밋 검토 후에만 원격 반영한다.

## 사용자 실행 파일

`ops/deploy-approved-test-site.ps1`은 다음 작업만 수행한다.

1. main·origin 확인
2. 기존 스테이징 없음 확인
3. `pnpm test`, `pnpm build`, `pnpm test:dist`
4. 승인 제품 파일 5개만 스테이징
5. 정확한 파일 목록 검증
6. 커밋 후 origin/main push

실행 명령:

```powershell
powershell -ExecutionPolicy Bypass -File .\ops\deploy-approved-test-site.ps1
```

## 후속 QA

QA-006에서 홈·문의·성공·파트너·소유권 화면은 배포와 반응형 검수를 통과했다. 다만 `/vendor-dashboard.html`의 301 규칙이 정적 파일 shadowing으로 적용되지 않고 레거시 JavaScript 오류가 발생해 공개 검수는 `BLOCKED`다. 상세 결과는 `ops/reports/QA-006-netlify-public-smoke.md`와 CR-004를 따른다.
