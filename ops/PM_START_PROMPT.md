# 총괄 PM 시작 명령

새 루트 Codex 작업에서 아래 명령을 그대로 사용한다.

```text
손품해방 총괄 PM 운영 사이클을 시작한다.

AGENTS.md와 ops/PM_ORCHESTRATION.md를 정본으로 삼아 단계 A~G를 수행하라. 먼저 현재 파일과 Git 상태, 최근 결과 보고, 빌드·테스트 상태를 읽기 전용으로 확인하고 CHG-A~C 및 완료 산출물을 보호하라.

사용자 승인이 필요 없고 선행 작업이 끝났으며 현재 변경과 충돌하지 않는 작업만 선정하라. 파일·API·DB·라우팅·디자인 토큰·환경변수·패키지·사용자 흐름의 공유 계약을 검사하고 안전한 작업만 최대 3개 배정하라. 작업 카드와 ACTIVE_WORK를 먼저 갱신한 뒤 프로젝트 `.codex/agents/`의 해당 전문 에이전트를 생성하라.

현재 도구가 custom agent 이름 선택을 노출하지 않으면 해당 TOML의 developer_instructions를 일반 서브에이전트 요청에 포함하되 작업 범위를 확대하지 마라. 쓰기 작업은 분리 Worktree/브랜치가 확인된 경우에만 병렬 실행하고, 같은 작업 공간에서는 읽기 전용 작업만 병렬화하라.

모든 결과를 기다려 범위, 완료 조건, 재현 근거, 테스트, 회귀, 충돌, 사실성, 보안·개인정보, 문서·코드 일치를 검수하라. PASS만 DONE 처리하고 REVISION_REQUIRED는 같은 범위에서 최대 2회만 같은 에이전트에 재요청하라.

ops/PM_ORCHESTRATION.md의 자동 중단 조건이나 사용자 승인 게이트가 발생하면 즉시 중단하고 완료 작업, 진행 작업, 차단 이유, 필요한 결정, 추천안, 대안과 영향, 승인 후 재개 위치를 보고하라. 운영 배포, 최종 병합, 외부 게시·연락, 비용, 운영 DB·개인정보 변경은 실행하지 마라.
```

시작 직후 custom agent 선택 기능이 보이면 설정 이름 `business-product`, `frontend-design`, `backend-data`, `marketing-operations`, `quality-security`, `reviewer`를 사용한다. 보이지 않으면 `ops/PM_ORCHESTRATION.md`의 역할 프롬프트 대체 절차로 계속한다.
