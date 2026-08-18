# FE-043 업체 정보 수정 제안 고객형 문구 정리

- 작업 ID: `FE-043`
- 판정: `PASS_CANDIDATE`
- 실행일: 2026-08-18

## 변경

- `contact.html`: `정보 확인 전 후보`를 `업체 정보 수정 제안`으로 교체했다.
- `scripts/pages/contact.js`: 후보·NAVER 관측 중심 자동 문구를 업체 정보·정보 업데이트·정확한 정보·공개 출처 중심으로 교체했다.
- `scripts/tests/contact-correction-copy.mjs`: 내부 용어 0, 업체 ID·이름·관련 페이지·메시지 prefill을 검사한다.

providerId·providerName readonly 필드, relatedPageUrl, inquiryType, 연락처·동의·message 제출 필드는 변경하지 않았다. 실제 제출·DB write는 실행하지 않았다.

## 검증

- contact correction 전용 검사: PASS
- validate: PASS, JavaScript 121·HTML 40
- build: PASS
- test:dist: PASS, HTML 40
- git diff check: PASS

## 남은 단계

별도 GitHub branch와 Netlify deploy preview에서 고객형 업체 수정 제안 query를 확인한 뒤 총괄 PM이 PASS 여부를 확정한다. main·production 반영은 별도 사용자 승인 전 실행하지 않는다.
