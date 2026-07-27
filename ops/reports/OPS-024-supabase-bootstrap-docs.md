# OPS-024 Supabase bootstrap 문서 정합화

- 판정: `PASS`
- 기준 통합 후보: `09701bb`
- 제품 코드·SQL·migration 수정: 0건
- 운영 DB·실제 계정·Edge·스케줄·main·production 변경: 0건

## 수정 결과

| 파일 | 반영 내용 |
| --- | --- |
| `README.md` | 새/기존 프로젝트 분리와 운영 승인 게이트 |
| `migrations/README.md` | 001~014 역할·실행 순서·013/014 특별 게이트 |
| `SUPABASE-SETUP-GUIDE.md` | admin-schema 1회, 누락 migration만 적용, 격리 E2E |
| `OPEN-READINESS-CHECKLIST.md` | 운영 적용 전 migration·worker·runtime 체크 |
| `BACKEND_AUDIT.md` | 격리 검증·운영 승인·비밀 경계 |

## 확정 순서

- 새 프로젝트: `admin-schema.sql` 1회 → `003`~`014`
- 기존 프로젝트: admin-schema 금지 → 적용 이력·백업 → 누락 첫 번호부터 순차 적용
- 계정 삭제: `013`→`014` DB 적용 → Edge 배포 → 실제 runtime 측정·기록 → 합성 E2E → 스케줄

## 남은 게이트

문서 commit은 운영 활성화 승인이 아니다. 통합 후보를 main에 병합하거나 운영 DB·Edge·스케줄·production에 적용하려면 별도 사용자 승인이 필요하다.
