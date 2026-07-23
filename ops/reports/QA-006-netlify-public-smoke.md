# QA-006 — Netlify 공개 화면 다중 뷰포트 검수

- 검수일: 2026-07-21 (KST)
- 대상: `https://taran-family-event-test.netlify.app/`
- 대상 커밋: `b837ea969d21f6bf01e7a8ccd8eae6a0a7477a27`
- 판정: `BLOCKED`
- 차단 범위: `/vendor-dashboard.html` 리디렉션과 해당 레거시 화면의 콘솔 오류
- 개인정보 제출·운영 로그인·DB 쓰기: 수행하지 않음

## 1. 배포 확인

- 로컬 `main`, `origin/main`, 원격 `refs/heads/main`이 모두 `b837ea9 fix: align public promises and add contact form`을 가리킨다.
- 커밋에는 `claim.html`, `contact.html`, `contact-success.html`, `partners.html`, `vendor-dashboard.html`만 포함된다.
- 공개 DOM에서 새 문의 폼, 성공 화면, 정정된 파트너·소유권·업체 관리 문구가 확인됐다.
- 기존 CHG-A~C 파일은 커밋에 포함되지 않았다.

## 2. HTTP 상태

리디렉션을 자동 추적하지 않은 GET 결과다.

| 경로 | 상태 | 판정 |
| --- | ---: | --- |
| `/` | 200 | 정상 |
| `/contact.html` | 200 | 정상 |
| `/contact-success.html` | 200 | 정상 |
| `/partners.html` | 200 | 정상 |
| `/claim.html` | 200 | 정상 |
| `/vendor-dashboard.html` | 200 | 실패: 기대한 301 리디렉션이 적용되지 않음 |
| `/admin/providers.html` | 200 | 직접 접근 시 관리자 로그인 안내 표시 |

## 3. 다중 뷰포트 결과

각 화면에서 DOM 표시, 문서 폭과 뷰포트 폭, 핵심 제목을 확인했다.

| 경로 | 390×844 | 768×1024 | 1440×1000 | 가로 넘침 |
| --- | --- | --- | --- | --- |
| `/` | 표시 | 표시 | 표시 | 없음 |
| `/contact.html` | 표시 | 표시 | 표시 | 없음 |
| `/contact-success.html` | 표시 | 표시 | 표시 | 없음 |
| `/partners.html` | 표시 | 표시 | 표시 | 없음 |
| `/claim.html` | 표시 | 표시 | 표시 | 없음 |
| `/vendor-dashboard.html` | 레거시 화면 표시 | 레거시 화면 표시 | 레거시 화면 표시 | 없음 |

모바일 문의 화면과 PC 파트너 화면은 실제 브라우저 캡처로 글자 잘림, 겹침, 가로 스크롤이 없는지 추가 확인했다.

## 4. 문의 폼

세 뷰포트에서 동일한 정적 폼 계약을 확인했다.

- `form[name="contact"]`
- `method="POST"`
- `data-netlify="true"`
- `netlify-honeypot="bot-field"`
- 숨김 `form-name` 존재
- 성공 경로: `/contact-success.html`
- 필수 필드: `inquiryType`, `contactName`, `replyEmail`, `message`, `privacyConsent`
- 선택 필드: `relatedPageUrl`
- 제출 버튼 표시

실제 문의 제출은 QA-006 금지 범위이므로 수행하지 않았다. 따라서 Netlify 대시보드 수신과 알림 전달은 이번 결과로 증명하지 않는다.

## 5. 공개 문구와 호환 계약

- OPS-005 금지 문구 13종은 `partners`, `claim`, `vendor-dashboard`의 사용자 표시 영역에서 0건이었다.
- `claim-ad-interest`는 `claim.html`에서 존재하며 숨김 상태다.
- `vendor-plan-name`, `vendor-plan-copy`, `premium-interest`는 `vendor-dashboard.html`에서 존재하며 숨김 상태다.
- 문의 성공 화면의 홈·문의 복귀 링크, 파트너 화면의 입점 문의·소비자 화면 링크, 소유권 화면의 로그인·계정·업체 목록 링크가 표시된다.

## 6. 실패 항목

### 리디렉션

`netlify.toml`에는 `/vendor-dashboard.html` → `/admin/providers.html` 301 규칙이 있으나 공개 응답은 200이고 최종 URL도 `/vendor-dashboard.html`이다. 원본 파일이 배포 묶음에 함께 존재하며 규칙의 `force` 기본값이 `false`여서 정적 파일이 규칙을 가리는 shadowing이 원인이다.

Netlify 공식 문서도 기존 파일보다 리디렉션을 우선하려면 `netlify.toml` 규칙에 `force = true`가 필요하다고 설명한다: [Netlify Redirect options](https://docs.netlify.com/manage/routing/redirects/redirect-options/).

### 콘솔 오류

레거시 화면을 열 때 뷰포트마다 다음 오류가 재현됐다.

```text
TypeError: Cannot read properties of undefined (reading 'id')
at /vendor-dashboard.js?v=5:2:75
```

`/admin/providers.html`을 직접 열면 관리자 로그인 안내가 정상 표시된다. 따라서 대상 관리자 화면이 없는 문제가 아니라 리디렉션 우선순위 문제다.

## 7. 변경 요청과 재검수 조건

- 변경 요청: CR-004 / OPS-007
- 최소 수정 후보: `netlify.toml`의 `/vendor-dashboard.html` 규칙에 `force = true` 추가
- 수정 금지: 레거시 HTML·JS 삭제 또는 재작성, 다른 리디렉션·API·DB·환경변수 변경
- 재검수: 무추적 GET 301, `Location: /admin/providers.html`, 브라우저 최종 URL, 관리자 로그인 안내, 새 콘솔 오류 없음
- 재배포는 사용자 승인 후 수행한다.

## 8. 완료 조건 판정

| 완료 조건 | 결과 |
| --- | --- |
| 새 커밋 배포 | 충족 |
| 폼 표시 | 충족 |
| 금지 문구 0 | 충족 |
| 주요 링크 결과 기록 | 충족 |
| 리디렉션 결과 기록 | 충족, 기능은 실패 |
| 콘솔 오류 결과 기록 | 충족, 레거시 화면 오류 발견 |

QA 작업의 증거 수집은 완료됐지만 공개 승인 게이트는 통과하지 못했다. OPS-007 적용·재배포 후 QA-006을 재검수한다.

## 9. 독립 검토

기존 quality-security 리뷰 에이전트가 보고서와 보드·활성 작업·백로그·의존성·승인·위험·변경 요청·전달문을 읽기 전용으로 대조했다. 문서 판정은 `PASS`였고, 제품 게이트 상태 `QA-006 BLOCKED`와 `OPS-007 APPROVAL_REQUIRED`를 유지하는 것이 적절하다고 확인했다.
