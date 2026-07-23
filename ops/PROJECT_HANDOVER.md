# 프로젝트 인수인계 기준

- 기준일: 2026-07-21
- 사용자 제공 원문을 현재 로컬 저장소와 대조해 사실, 사용자 확인, 재검증 필요를 분리한다.
- 비밀번호, Supabase 비밀키, Netlify 토큰, 개인 관리자 이메일은 이 문서에 기록하지 않는다.

## 저장소와 배포

| 항목 | 상태 | 근거·제한 |
| --- | --- | --- |
| GitHub 원격 | 확인 | `origin=https://github.com/Leo-Moon7/taran-family-event-platform.git` |
| 기준 브랜치 | 확인 | 로컬 `main`, `origin/main`, 원격 main이 `b837ea9`로 일치 |
| 저장소 공개 상태 | 확인 | 2026-07-21 GitHub 설정에서 비공개 저장소 전용 안내 표시 확인 |
| Netlify 테스트 주소 | 확인 | `https://taran-family-event-test.netlify.app/`; 새 문의 폼·문구 반영 |
| Netlify 빌드 | 로컬 확인 | `netlify.toml`: `node scripts/build/prepare-dist.mjs`, publish `dist` |
| GitHub→Netlify 자동 배포 | 확인 | `b837ea9` push 후 승인 5개 파일의 공개 DOM 반영 확인 |
| 공개 묶음 제외 | 로컬 확인 | 빌드가 루트 공개 파일과 `admin/assets/styles/scripts`만 복사하며 `docs`, `ops`, SQL, 테스트는 제외 |

## Supabase와 관리자

- 사용자는 Supabase 프로젝트·API·이메일 로그인·관리자 계정·Netlify의 `SUPABASE_URL`, `SUPABASE_ANON_KEY` 등록과 001~005 마이그레이션 실행 완료를 확인했다.
- 프런트엔드는 anon 키만 사용하며 `service_role` 키를 저장소·브라우저·Netlify 공개 파일에 두지 않는다.
- 관리자 이메일과 비밀번호는 저장소 문서에 기록하지 않는다.
- 사용자 확인 내용은 운영 E2E의 대체가 아니다. QA-003에서 owner/admin/operations/content/provider 및 일반 회원 흐름을 스테이징에서 재검증한다.

## 로컬 전용 자료

- `backend/**`에는 수집 스크립트, SQLite 원본 DB, CSV·JSON 검수 자료가 있으며 `.gitignore`로 제외된다.
- `.env`, `.netlify`, `dist`, `node_modules`도 Git에서 제외된다.
- `backend/data`는 다른 PC 복제에 포함되지 않으므로 별도 암호화 백업이 필요하다.

## 현재 대조에서 발견한 차이

- 사용자 인수인계에는 운영 문서가 GitHub를 통해 이어진다고 되어 있으나, 확인 시점 `main`은 `docs/**`, `ops/**`, `AGENTS.md`, `.codex/**`를 아직 추적하지 않는다.
- 저장소는 `Private`로 전환됐지만 운영 기준선은 이번 제품 커밋에 포함하지 않았다. 비밀·개인정보 검사 후 별도 커밋 여부를 결정한다.
- `package.json`, `pnpm-lock.yaml`, 일부 업체 화면과 브라우저 스모크 파일은 기존 CHG-A·B 변경이므로 이번 승인 작업에 섞지 않는다.
- `/vendor-dashboard.html`은 정적 파일 shadowing으로 301이 적용되지 않아 OPS-007과 QA-006 재검수가 필요하다.

## 다음 PC에서 복원되지 않는 것

- `backend/data` 원본 DB
- 로컬 `.env`와 Netlify 로그인 상태
- Supabase 비밀번호와 비밀키
- Codex 로컬 대화와 브라우저 로그인 상태

## 온라인 확인 기준

- 테스트 배포는 위 Netlify 주소에서 모바일 390×844, 태블릿 768×1024, PC 1440×1000으로 확인한다.
- 공개 폼에는 실제 비밀값이나 운영 개인정보를 테스트 입력하지 않는다.
- 운영 배포와 실제 외부 연락, 운영 DB 변경은 별도 승인 없이는 수행하지 않는다.
