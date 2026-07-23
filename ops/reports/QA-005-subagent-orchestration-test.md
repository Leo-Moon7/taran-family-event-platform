# QA-005 서브에이전트 오케스트레이션 읽기 전용 시험

- 시험일: 2026-07-21
- 작업 ID: QA-005
- 최종 판정: PASS
- 제품 코드 변경: 없음

## 시험 목적

제품 후속 작업을 시작하기 전에 프로젝트 custom agent 설정, 총괄 PM A~G 실행 루프, 서브에이전트 생성·업무 전달·결과 회수·독립 검수 경로가 작동하는지 읽기 전용으로 확인한다.

## 수행 절차

1. `.codex/config.toml`과 `.codex/agents/*.toml` 6개를 Python `tomllib`으로 파싱했다.
2. 모든 전문 에이전트에 `name`, `description`, `developer_instructions`가 있는지 검사했다.
3. 설정에서 확정 경로로 사용한 문서·코드·폴더가 실제 저장소에 존재하는지 대조했다.
4. `/root/orchestration_probe` 서브에이전트를 reviewer 역할로 생성했다.
5. 저장소 쓰기, 빌드, 브랜치·Worktree·커밋·PR을 금지하고 설정·운영 문서만 검수하도록 배정했다.
6. 구조화된 `PASS` 결과를 회수한 뒤 루트 PM이 Git 상태와 완료 보고서 해시를 다시 확인했다.

## 결과

| 검증 항목 | 결과 | 근거 |
| --- | --- | --- |
| TOML 문법·필수 필드 | PASS | 프로젝트 설정 1개와 전문 에이전트 6개 모두 파싱 성공 |
| 전문 역할 구성 | PASS | 역할, 담당, 기준 문서, 허용·금지 영역, 범위 밖 처리, 보고, 승인, 충돌 규칙 포함 |
| 실제 경로 | PASS | 설정이 확정 경로로 참조한 문서·코드·폴더가 모두 존재 |
| 동시성 통제 | PASS | `max_threads = 4`, `max_depth = 1`; 루트 1개와 전문 작업 최대 3개 정책 일치 |
| PM 실행 루프 | PASS | A~G, 판정 5종, `PASS`만 `DONE`, 수정 최대 2회, 중단 조건 포함 |
| 결과 회수 | PASS | `/root/orchestration_probe`가 생성되어 읽기 전용 검수 결과 반환 |
| 완료 산출물 보호 | PASS | QA-002·MKT-001 SHA-256 기준값 유지 |
| 기존 제품 변경 보호 | PASS | 시험 전후 추적 제품 변경 목록은 기존 CHG-A·B의 6개 파일로 동일 |

완료 보고서 SHA-256:

- QA-002: `619DA9A0E71FCED57427B568D651AAAF2678D554BAA1B48E87809CEF934DE1B6`
- MKT-001: `3B0C4B9958670C94CFE88007B70A0359D563AB008F8BCB9AA0BB89A581D2DF06`

시험 전후 유지된 기존 추적 제품 변경:

- `package.json`
- `pnpm-lock.yaml`
- `provider.html`
- `scripts/pages/provider.js`
- `scripts/pages/venues.js`
- `styles/components/filter.css`

## 제한과 대체

- 현재 대화의 직접 생성 인터페이스에는 custom agent 이름 선택 인자가 노출되지 않아 TOML 자동 선택 자체는 이 세션에서 증명하지 못했다.
- WindowsApps 안의 Codex 실행 파일은 현재 셸에서 직접 실행 권한이 없어 CLI 기능 목록 검사는 수행하지 못했다.
- 서브에이전트 생성·메시지·대기·회수 기능은 실제 시험으로 확인했다.
- 새 루트 대화에서 custom agent 자동 로드·선택을 확인한다. 선택이 노출되지 않으면 해당 TOML의 역할 지시를 일반 서브에이전트 요청에 포함하는 대체 방식을 사용한다.
- Git 검사는 앱 번들 Git 실행 파일의 절대 경로로 완료했다.

## 최종 판정

설정 문법, 실제 경로, 범위 통제, 생성·회수·검수 루프가 모두 통과했다. custom agent 자동 선택 UI는 새 세션 확인 항목으로 남지만 역할 프롬프트 대체가 마련되어 있어 총괄 PM 운영을 시작할 수 있다.
