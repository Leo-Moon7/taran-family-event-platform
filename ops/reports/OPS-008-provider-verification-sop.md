# OPS-008 업체 소유권·직접 입력·관리자 검수·이의 처리 SOP

- 작업 ID: `OPS-008`
- 기준일: `2026-07-22` (Asia/Seoul)
- 결과: **내부 SOP 설계 완료 / 실제 개인정보 수집·외부 연락·운영 적용은 APPROVAL_REQUIRED**
- 적용 범위: 업체 신규 등록, 기존 페이지 소유권 신청, 사업자 상태와 담당자 관계 확인, access grant, 업체 직접 입력, 사진 권리, 관리자 검수, 공개·문의 분리, 반려·보완·회수·이의·rollback
- 변경 범위: 이 보고서 1개 신규 작성
- 비실행: 업체·이용자 연락, 외부 게시·광고·비용, 사업자 API 호출, 제품·DB·API·RLS·Storage·라우팅·환경변수·패키지·법률 문서 변경

## 1. 결론

업체 등록이나 소유권 승인은 한 번의 `승인`으로 공개와 문의를 동시에 여는 절차가 아니다. 운영자는 다음 상태축을 각각 판정한다.

```text
registration 접수·수락
  ≠ business status 확인
  ≠ ownership claim 승인
  ≠ access grant 활성
  ≠ field/media review 승인
  ≠ publication 승인
  ≠ inquiry 활성
```

신규 등록은 새 업체 실체와 지점의 존재부터 확인하는 흐름이고, 기존 페이지 소유권 신청은 이미 존재하는 `provider_id`와 요청자의 관계를 확인하는 흐름이다. 두 흐름 모두 사업자 상태와 담당자 관계를 별도로 확인하며, 승인된 access grant는 해당 업체와 허용 scope의 변경 **제출** 권한만 준다. 업체는 자신의 제출을 승인하거나 공개 상태·문의 상태를 바꿀 수 없다.

초기 운영에서는 업체가 제출한 모든 필드를 관리자 검수 후 공개한다. 사업자 상태가 `active`여도 담당자 관계, 행사 가능, 가격·시설, 사진 권리, publication, 문의 수신은 계속 미확인일 수 있다. 사진은 파일 존재와 공개 이용권을 분리하며 철회·만료·인물 동의 문제가 생기면 공개 파생본을 우선 차단한다.

이 문서는 운영자가 같은 입력에 같은 결정을 내릴 수 있도록 한 **내부 절차안**이다. 실제 사업자번호·관계 서류·사진/후기 증빙을 받기 전 D-24, 외부 업체 연락과 파일럿 전 D-26, 실제 SLA·운영시간·법률 문구·개인정보 보유기간은 각각 사용자 승인이 필요하다.

## 2. 사실·제안·승인 항목 분리

### 2.1 확정 사실·방향

- 전국 가족행사 범위를 유지하며 첫 운영 검증은 서울 돌잔치에 집중한다(`ADR-001`, `ADR-016`).
- NAVER 블로그·플레이스·지역검색은 사업 데이터 원천으로 사용하지 않는다. 기존 4,960건은 `legacy_source_hold` 후보이며 공개 업체·검증 업체·연락 대상·SEO 수치가 아니다.
- 공공데이터는 후보 발견과 일부 이름·업종·주소·영업 상태 신호에만 사용한다. 행사 가능, 가격, 인원, 주차, 시설, 사진 권리, 담당자 관계, 문의 의사를 단독으로 확정하지 않는다.
- 업체 담당자는 관계 확인 후 자사 정보를 제출할 수 있지만 초기에는 전부 관리자 검수 후 `업체 제공 정보`와 확인일을 표시한다(`ADR-016`, D-17).
- 1차 전환 종점은 비교·견적 문의·업체 응답이다. 예약·결제·에스크로·정산과 `예약 확인 후기`는 현재 제공 범위가 아니다(`ADR-011`).
- 소유권과 기본 정보 수정은 무료이며 유료 상품 구매와 연결하지 않는다.

### 2.2 이 보고서의 제안

- 13개 관리자 큐, 공통 case 상태, 역할 분리, 사유 코드, 내부 우선순위·처리 목표, 이중 검토, 이의·rollback 절차
- 신규 등록과 기존 페이지 소유권의 단계별 체크리스트
- 필드·사진 검수 체크리스트와 22개 운영 시나리오
- 실제 보유기간을 확정하지 않는 개인정보 최소수집·격리·열람·파기 통제안

### 2.3 `APPROVAL_REQUIRED`

- D-24: 사업자번호, 담당자 관계 서류, 업무 연락처, 사진·후기 증빙의 수집 목적·필수항목·보유기간·접근 역할·암호화·파기·이의 처리
- D-25: 공개 신뢰 라벨 최종 문구와 필드별 재확인 주기
- D-26: 업체 이메일·전화·문자·메신저·방문 등 외부 연락, 서울 돌잔치 파일럿, 대상·문안·횟수·운영 용량
- 실제 운영시간과 SLA, 외부 고지·알림 문구, 법률 문서, 개인정보 책임자·사업자 표시
- 사업자 상태 API 실제 호출, 운영 DB·Storage 적용, 배포·최종 병합
- 비용·인센티브·광고·제휴, 가격·리드 과금·수수료

## 3. 운영 불변 규칙

1. `candidate_id`, canonical `provider_id`, 신청 case를 같은 것으로 취급하지 않는다.
2. 신규 등록 수락은 draft provider/후보와 pending assertion을 만들 수 있을 뿐 자동 공개·소유권·문의 활성화를 뜻하지 않는다.
3. `business=active`는 제출 번호의 상태 근거일 뿐 담당자 재직·대리권·페이지 소유권·필드 정확성의 증거가 아니다.
4. `ownership=approved`와 `grant=active`를 분리한다. 소유권 판정 후에도 업체·사용자·scope·만료가 명시된 grant가 있어야 변경을 제출할 수 있다.
5. grant 보유자는 자기 업체의 허용된 scope에만 revision을 제출한다. 자기 제출의 승인, publication, merge, closed, inquiry 상태 변경은 금지한다.
6. 원천 observation·업체 제출·이용자 제보가 현재 공개 값을 직접 덮어쓰지 않는다. 승인된 assertion만 공개 projection 후보가 된다.
7. 초기에는 저위험 필드를 포함한 모든 업체 revision을 사전 검수한다. 가격·취소·사업자 식별·소유권·문의·주소 이전은 이후에도 항상 재검수한다.
8. 공공 업종이나 업체 체크박스만으로 행사 capability를 확정하지 않는다. 행사별 조건과 관리자 검수 상태를 둔다.
9. 결측은 `unknown/not_provided/not_applicable/확인된 0`으로 구분하고 0·무료·불가·가능으로 추정하지 않는다.
10. 사진은 asset별 권리 근거, 이용 범위, 인물·미성년자 동의, 기간, 철회 상태를 확인한다. 권리 미확인은 placeholder를 쓴다.
11. 자동 수집 누락, API 실패, 연락 실패 한 번을 폐업으로 확정하지 않는다. 다만 authoritative adverse signal은 문의를 임시 보류하고 긴급 검수할 수 있다.
12. 승인·반려·보완·회수·병합·폐업·철회·rollback마다 전후값, 근거, 사유, 정책 버전, 결정자, 시각을 남긴다. 삭제보다 상태·alias·history 보존을 우선한다.
13. 제출자와 최종 승인자를 분리한다. 민감 증빙 열람자와 grant 승인자는 가능한 한 분리하고, 이해관계자는 회피한다.
14. 공개 projection 외 후보, 사업자번호, 관계 서류, 담당자 개인정보, 관리자 메모, 증빙, 중복 점수는 익명 공개·분석 이벤트·오류 로그에 넣지 않는다.
15. 법률·개인정보·권리·가격·외부 연락 판단이 승인 범위를 넘으면 운영자가 추정하지 않고 `APPROVAL_REQUIRED`로 에스컬레이션한다.

## 4. 역할과 권한 분리

역할명은 운영 책임을 설명한다. 실제 계정·RLS 매핑은 후속 BE-006·QA-003에서 검증하며 이 문서가 운영 권한을 부여하지 않는다.

| 역할 | 할 수 있는 일 | 할 수 없는 일 | 민감정보 원칙 |
| --- | --- | --- | --- |
| 일반 회원·신고자 | 본인 오류 제안·후기·이의 제출, 본인 case 상태 확인 | 업체 정보 직접 수정, 증빙 검수, 공개 결정 | 본인 제출만 최소 열람; 다른 사람·업체 비공개 증빙 거부 |
| 소유권 요청자 | 기존 페이지 claim 또는 신규 등록 제출, 본인 보완·철회 | 승인 전 업체 revision, 자기 claim 승인 | 원문 사업자번호·관계 서류의 반복 노출 최소화 |
| 업체 grant 보유자(`provider`) | grant가 허용한 업체·scope의 revision, 사진, 문의 opt-in 제안 | 관리자 메뉴, 자기 제출 승인, publication/merge/closed 변경 | 자기 업체 업무 정보와 본인 제출만 |
| 접수·운영 담당(`operations`) | 큐 분류, 비민감 기본 정보 대조, 보완 요청, 운영 case 처리 | 자기 제출 최종 승인, 법률 해석, 정책 밖 예외 승인 | 업무상 필요한 case만; 목록 마스킹, 원문 증빙 다운로드 금지 |
| 업체 검수자(`operations/admin`) | 사업자 결과 해석, 관계·소유권·필드·publication·문의 gate 검수 | 정책·보유기간 임의 확정 | claim 단위 최소 열람, 열람 목적·시각 기록 |
| 권리·콘텐츠 검수자(`content`, 허용 scope) | 사진 권리·후기 내용·광고/개인정보 검수 | 사업자번호·소유권 관계 서류 검수, 업체 grant 승인 | 미디어·후기 case에 필요한 자산만 signed access |
| 승인권자·사고 책임자(`admin`) | 고위험 승인, grant 회수, 임시 숨김, 분쟁 재심, rollback 승인 | owner 고유 보안·배포 설정 변경 | 고위험 열람과 결정 모두 감사 |
| 최고관리자(`owner`) | 관리자 권한, 중대 보안/개인정보 사고, 예외·최종 rollback 통제 | 근거 없는 운영 판정, 감사 기록 삭제 | break-glass 사용 사유와 사후 검토 필수 |
| 자동화·시스템 | 형식 검사, 중복 점수, 만료·실패·adverse signal 큐 생성, 승인 규칙에 따른 임시 안전조치 | 소유권·행사 가능·병합·폐업·최초 publication 최종 판정 | 비밀값·원문 증빙을 클라이언트·로그에 출력 금지 |
| PM·품질/보안 | 정책 충돌, 승인 게이트, RLS·감사·회귀 검수 | 운영 계정으로 실제 처리를 대신 수행 | 검증용 최소 표본과 비식별 결과 사용 |

### 4.1 결정 분리 원칙

- 신청자와 제출자: 사실·근거를 제출하고 보완·철회할 수 있다.
- 1차 검수자: 증빙 완전성·정합성을 확인하고 승인/반려안을 만든다.
- 승인권자: 고위험 결정의 적용을 승인한다.
- 이의 검수자: 원결정자가 아닌 `admin`이 재심한다. 인력이 한 명뿐이면 자동 승인하지 않고 PM에 운영 한계로 보고한다.
- 초기 첫 10개 T4/T5는 MKT-009 제안대로 별도 승인권자가 100% 재검토한다. 이는 파일럿 제안이며 D-26과 인력 승인 뒤 적용한다.

## 5. 공통 case 계약

### 5.1 모든 큐의 필수 입력·기록

| 구분 | 필수 기록 |
| --- | --- |
| 식별 | `case_id`, `case_type`, 대상 `candidate/provider/assertion/asset/review/grant` ID, 관련 case ID |
| 제출 | 제출자 유형·계정 ID, 제출 시각, 요청 범위, 제출 이유, 동의/정책 버전 |
| 증빙 | 증빙 ID·종류·출처·기준일·해시/버전, 공개 가능 여부, 개인정보 등급, 만료일. 원문은 공개 audit에 복사하지 않음 |
| 비교 | `before_snapshot`, `proposed_snapshot`, 충돌 값, 영향받는 공개 필드·URL·문의 상태 |
| 결정 | `decision`, 표준 `reason_code`, 필요한 최소 자유서술, 결정 범위, 조건부 조치 |
| 책임 | 배정자, 1차 검수자, 승인권자, 회피/재배정 사유, 결정 시각 |
| 정책 | `policy_version`, 승인 ID, 적용된 체크리스트 버전 |
| 결과 | `decided_snapshot`, 상태축별 영향, projection 적용 버전 또는 적용 보류 사유 |
| 회수 | `reversal_of_case_id`, 이의 case, rollback/복구 결과, 알림 상태 |

감사 기록은 append-only로 추가하고 기존 결정을 수정·삭제하지 않는다. 오탈자 정정도 새 audit entry로 원기록과 연결하며, snapshot에는 원문 사업자번호·증빙·개인 연락처를 복제하지 않는다.

### 5.2 운영 case 상태

아래는 SOP의 공통 처리 상태이며 제품 DB 상태를 확정하는 스키마가 아니다.

```text
received -> triaged -> in_review
                    -> supplement_requested -> resubmitted -> in_review
                    -> approval_pending -> approved -> applied -> closed
                    -> rejected -> closed
received/... -> withdrawn
approved/applied -> disputed -> upheld / corrected / revoked / rolled_back
```

- `supplement_requested`: 부족한 항목, 허용 형식, 제출 기한이 아니라 **보완 필요 상태**를 알린다. 실제 처리기한은 SLA 승인 전 확정하지 않는다. 기존 공개값과 권한은 자동 변경하지 않는다.
- `approved`: 해당 case 범위의 판단이 끝났다는 뜻이다. 다른 상태축의 승인을 포함하지 않는다.
- `applied`: 승인 결과가 목표 상태/projection에 반영됐음을 별도 확인한 상태다. 적용 실패를 승인 성공으로 표시하지 않는다.
- `withdrawn`: 요청자가 철회했거나 더 진행하지 않는 상태다. 이미 공개된 값·grant·사진은 별도 회수 case가 필요할 수 있다.
- `disputed`: 원결정은 감사 이력으로 보존하고 고위험이면 임시 안전조치를 한 뒤 재심한다.

## 6. 서로 분리할 상태축

| 상태축 | 제안 상태 | 승인 효과 | 승인하지 않는 것 |
| --- | --- | --- | --- |
| registration | `submitted / screening / supplement_requested / accepted / rejected / withdrawn` | 신규 후보·draft identity와 pending assertion 처리 가능 | ownership, grant, publication, inquiry |
| business | `unsubmitted / check_pending / active / suspended / closed / invalid / unknown / api_error` | 제출 번호의 상태·진위 결과 기록 | 담당자 관계, 정보 정확성, 공개 |
| ownership claim | `submitted / business_check_pending / relationship_review_pending / approved / rejected / expired / disputed / revoked / withdrawn` | 요청자와 업체의 관계 판정 | 실제 수정 scope와 접근 활성, publication, inquiry |
| access grant | `proposed / active / suspended / expired / revoked` + `provider_id/user_id/role/scope` | 해당 업체·scope의 revision 제출 권한 | 자기 승인, 공개 상태, 다른 업체 접근 |
| field assertion/revision | `proposed / pending / approved / rejected / disputed / superseded / expired / revoked / withdrawn / rolled_back` | 승인 범위의 공개 projection 후보 | provider 전체 검증, publication 자동 승인 |
| event capability | `unknown / candidate / provider_asserted / evidence_confirmed / operator_confirmed / rejected / expired` | 관리자 검수된 `provider_asserted` 이상만 행사 필터 후보 | 가격·문의·사업자 확인 |
| media rights | `private_pending / approved / expired / revoked / disputed / rejected` | 승인 scope·기간 안에서 공개 파생본 사용 가능 | 마케팅 재사용, 다른 asset·인물 동의 |
| publication | `draft / pending_review / published / needs_update / suspended / closed / merged / archived` | 승인 projection의 공개 lifecycle | ownership·문의 활성·공식 인증 |
| inquiry | `off / eligible / enabled / paused / stale / disabled` | 선택 업체 문의의 전달 후보 | 전달 성공, 응답 보장, 예약 가능 |

### 6.1 핵심 gate

- 신규 등록 `accepted`: 중복·지점·기본 identity를 처리할 수 있다는 뜻이며 provider는 `draft/pending_review`에 머문다.
- ownership `approved`: 관계 판정 후 scope가 명시된 access grant를 별도 생성·승인해야 한다.
- field `approved`: 해당 값만 승인한다. 다른 필드와 provider 전체 `last_verified_at`을 함께 갱신하지 않는다.
- publication `published`: stable ID, 강한 중복 해소, 기본 식별 assertion, 승인된 독립 출처, adverse 신호 없음, 행사 capability, 유효 확인일, 권리 안전, publication reviewer·사유·정책 버전이 필요하다. 최종 공개 기준은 D-25와 후속 제품 결정 대상이다.
- inquiry `enabled`: published, 최근의 `business=active`, active grant, 명시적 opt-in, 승인 업무 연락 경로와 responder, 최근 핵심 정보, RLS·생성·열람·응답·알림·실패 E2E를 모두 요구한다.

## 7. 신규 등록과 기존 페이지 소유권 절차

### 7.1 신규 등록

| 단계 | 담당 | 입력·증빙 | 결정·출력 | 중단·에스컬레이션 |
| --- | --- | --- | --- | --- |
| 1. 접수 | 요청자, 시스템 | 계정, 업체/지점명, 주소/활동지역, 유형, 공식 업무 채널, 요청자 관계. D-24 승인 전 민감 증빙 수집 금지 | registration `submitted`; 접수 ID | 개인정보 고지·동의·접근 정책 미승인 시 민감 입력 활성화 금지 |
| 2. 형식·범위 | operations | 필수 비민감 값, 서울/행사 코호트 여부, 금지 표현·PII | `screening` 또는 `supplement_requested/out_of_scope` | 민감정보가 자유서술에 들어오면 격리·마스킹·사고 절차 |
| 3. canonical/지점 | operations + reviewer | 이름·도로명 주소·공식 채널·독립 source ID, 중복 점수 | 새 candidate, 기존 provider 연결, 지점 분리, 중복 case | 강한 충돌은 자동 merge·신규 공개 금지 |
| 4. 사업자 상태 | 제한 operations/admin | 자발 제출 번호와 승인된 비공개 입력, 상태/진위 결과 | business 상태만 갱신 | D-24·API 승인 전 호출/저장 금지; 오류는 `unknown/api_error` |
| 5. 담당자 관계 | 업체 검수자 | 업무 연락 확인, 승인된 최소 관계 근거 | ownership 판정안 | active 사업자라도 관계 불충분 시 보완/반려 |
| 6. registration 수락 | 업체 검수자 | 1~5단계 결과, 중복·행사 후보·정책 버전 | `accepted`; draft identity와 pending assertion 처리 | published/claimed/inquiry 동시 생성 금지 |
| 7. grant | admin 또는 승인된 검수자 | provider·user·role·scope·만료/재확인 | access grant `active` | scope 불명·공용계정·회피 실패 시 승인 금지 |
| 8. 업체 입력 | grant 보유자 | 표준 필드, 기준일·조건·출처, 사진 권리, 문의 opt-in 제안 | field/media revision `pending` | 제출 즉시 공개 금지 |
| 9. 검수·공개 | 큐별 reviewer | 필드·행사·사진·publication 체크리스트 | assertion 승인/반려, publication 별도 판정 | 미해결 중복·adverse·권리·PII가 있으면 공개 금지 |
| 10. 문의 | operations/admin + QA | opt-in, responder, 업무 채널, 최근성, E2E 결과 | inquiry `enabled/paused` 별도 판정 | E2E·연락 경로 미확인이면 `eligible` 이하 유지 |

### 7.2 기존 페이지 소유권 신청

| 단계 | 담당 | 입력·증빙 | 결정·출력 | 중단·에스컬레이션 |
| --- | --- | --- | --- | --- |
| 1. 대상 선택 | 요청자 | 정확한 provider/지점, 요청자 관계, 업무 연락 | claim `submitted` | 다른 지점 선택 가능성이 있으면 관계 검수 전 주소 충돌 큐 |
| 2. 현재 위험 확인 | system/operations | publication, 기존 grant, 분쟁·폐업·merge, 최근 claim | `business_check_pending` 또는 분쟁/중복 큐 | 기존 owner가 있어도 자동 반려하지 않고 다중 역할·대행 관계 검토 |
| 3. 사업자 확인 | 제한 reviewer | 자발 제출 번호와 승인된 확인 결과 | business 상태 | active 결과만으로 claim 승인 금지 |
| 4. 관계 확인 | 업체 검수자 | 업체·지점 일치, 요청자 재직/대리 범위, 업무 채널 | `relationship_review_pending -> approved/rejected/supplement` | 대표자 개인 정보 과수집 금지; 충돌 시 admin 재심 |
| 5. grant 결정 | admin/승인권자 | user/provider/role/scope/만료, 기존 grant 영향 | grant active/suspended/revoked | 소유권 승인과 access 활성 이력을 각각 기록 |
| 6. 첫 변경 | grant 보유자 | 기존값 대비 revision과 근거 | field `pending` | 기존 공개값 즉시 덮어쓰기 금지 |
| 7. publication·문의 | 큐별 reviewer | 승인 assertion, publication gate, opt-in/E2E | 각 상태축 별도 판정 | grant 승인만으로 inquiry 활성 금지 |

### 7.3 승인 후 업체 변경

1. grant scope와 상태를 요청마다 검사한다.
2. 업체가 `before -> proposed` diff, 기준일, 조건, 근거를 제출한다.
3. revision과 field assertion을 `pending`으로 만들고 기존 승인 projection은 유지한다.
4. 검수자는 결측·단위·조건·출처·최근성·과장·PII·연관 필드 영향을 확인한다.
5. 승인된 필드만 projection 후보로 적용하고 `supersedes_assertion_id`를 남긴다.
6. 반려는 사유 코드와 보완 가능 여부를 남기며 다른 승인 필드를 취소하지 않는다.
7. 가격·취소·주소·사업자·ownership·문의 변경은 언제나 재검수한다.

## 8. 관리자 13개 큐

큐 번호와 범위는 BE-005의 관리자 검수 정본을 따른다. 한 case가 여러 위험을 가지면 원본 case를 복제하지 않고 관련 case ID로 연결하며, 각 큐의 결정자가 자기 상태축만 변경한다.

| 큐 | 입력·필수 증빙 | 1차 담당 / 결정권자 | 허용 결정과 상태 영향 | 필수 사유·에스컬레이션 |
| --- | --- | --- | --- | --- |
| Q1 source/rights | dataset ID·제공기관·허락 snapshot·허용 필드·출처 문구·제3자 권리·기준일 | QA/operations 접수 / 사용자·승인된 권리 책임자 | `review/approved/blocked/expired`; 신규 수집·영향 assertion 보류 | `rights_terms_unapproved`, `third_party_rights_unknown`; 법률 해석은 APPROVAL_REQUIRED |
| Q2 신규 후보·범위 | source record 또는 자발 등록, 이름·업종·주소·기준일·후보 이유 | operations / operations·admin | `quarantined/normalized/event_review_pending/rejected/out_of_scope` | `candidate_out_of_scope`, `identity_insufficient`; 자동 공개 금지 |
| Q3 canonical match·중복·지점 | 정규화 이름·주소·전화/도메인·source key·강/약 신호·기존 alias | operations / admin | link, separate branch, merge 제안·승인 | `duplicate_or_branch_unresolved`; 행 삭제 금지, 고위험 merge는 이중 검토 |
| Q4 주소 변경·휴폐업·원천 삭제 | current/proposed 주소, authoritative/supporting 신호, 관찰일·원천 연결 | operations / admin | address proposal 승인/반려, inquiry pause, `needs_update/suspended/closed` 판정 | `address_conflict`, `authoritative_adverse_signal`, `source_unavailable_only`; 폐업·재개업 수동 확정 |
| Q5 행사 capability | 행사 유형, 공간/서비스, 인원·제공 조건, 업체 주장·공식 근거 | operations / provider reviewer | `candidate/provider_asserted/operator_confirmed/rejected/expired` | `event_fit_unsubstantiated`; 공공 업종만으로 승인 금지 |
| Q6 신규 registration | 계정, 업체/지점, 주소, 유형, 공식 채널, 관계, 중복·사업자 결과 | operations / provider reviewer | `supplement/accepted/rejected/withdrawn` | `identity_or_business_mismatch`, `duplicate_or_branch_unresolved`; accepted와 공개·문의 분리 |
| Q7 사업자·ownership·grant | 비공개 제출 번호 결과, 담당자 관계 최소 근거, 업무 연락, 요청 scope, 기존 grant | 제한 operations / admin | business 결과, claim approve/reject/dispute/revoke, grant activate/suspend/revoke | `relationship_insufficient`, `business_check_unknown`, `grant_scope_mismatch`; content 접근 금지 |
| Q8 업체 field revision | before/proposed, field별 출처·기준일·단위·조건·유효기간 | operations / provider reviewer | assertion approve/reject/supplement/dispute/supersede/rollback | `scope_or_date_missing`, `price_conditions_incomplete`, `misleading_claim`, `stale_or_conflicting` |
| Q9 고객 정보 제안·견적 | 대상 필드, 경험/견적 시점, 행사·인원·조건, 근거 설명, 선택 증빙 | operations / provider reviewer | approve as `이용자 제보`, supplement/reject/withdraw | `unsupported_user_report`, `personal_information_exposed`, `duplicate_submission`; 업체 공식 현재값 자동 변경 금지 |
| Q10 사진 권리·동의 | asset ID, 제출자 권한, rights basis, 사용 scope, 기간, attribution, 인물/미성년자 release | content/rights reviewer / admin(고위험) | private 유지, 공개 scope 승인, expire/revoke/dispute | `photo_rights_unknown`, `person_release_missing`, `consent_scope_mismatch`; 철회 시 공개 파생본 우선 차단 |
| Q11 자체 후기 내용·이용 증빙 | 로그인 계정, 행사 시점·조건·관계, 광고 여부, content, 승인된 비공개 증빙 | content / content·admin | content publish/hide/remove, experience `self_reported/evidence_checked`; dispute | `experience_unsubstantiated`, `advertising_undisclosed`, `defamation_or_abuse`, `personal_information_exposed`; 현재 `reservation_confirmed` 금지 |
| Q12 stale·refresh·parser/API 실패 | assertion `next_check_at`, source run, 오류·retry, schema/terms hash, 영향 목록 | system/operations / operations·admin | recheck, price hide, inquiry pause, source stop, dead-letter resolve | `stale_or_conflicting`, `source_schema_changed`, `api_error`; 실패를 변경 없음·폐업으로 해석 금지 |
| Q13 신고·분쟁·철회·rollback | 신고 유형, 원결정·전후값, 양측 소명, 권리/PII 위험, 영향 projection | operations 접수 / 원결정자 아닌 admin·owner | temporary hide/pause, uphold/correct/revoke/restore/rollback | `security_or_privacy_incident`, `incorrect_approval`, `requester_withdrawn`; 고위험 즉시 안전조치·PM/QA 에스컬레이션 |

### 8.1 큐 공통 화면·운영 요구

- 목록에는 ID, 위험 등급, 현재 상태, 배정자, 최고 체류, 다음 조치만 표시하고 사업자번호·개인 연락처·증빙 원문은 마스킹한다.
- 상세에는 before/proposed/decided diff, 필드별 출처·날짜, 관련 case, 감사 기록을 표시한다.
- 상태·위험은 색상만으로 구분하지 않고 텍스트와 아이콘/라벨을 함께 쓴다.
- 일괄 승인·병합·공개·회수 전 대상 수와 영향을 미리 보여주고, 초기에는 자동 승인·대량 공개를 사용하지 않는다.
- 정상 case를 운영자가 임의 대리 제출하지 않는다. 실패·미응답·분쟁·안전 예외에만 개입한다.

## 9. 결정 절차

### 9.1 승인

1. 담당 권한, 회피 여부, 정책 버전을 확인한다.
2. 대상 identity와 지점, 요청 scope를 확인한다.
3. 필수 증빙의 출처·기준일·무결성·개인정보 등급·유효기간을 확인한다.
4. before/proposed diff와 연관 상태축 영향을 본다.
5. 승인 범위를 field/asset/provider/grant 단위로 최소화한다.
6. 긍정 `reason_code`, 근거 ID, 결정자·시각을 남긴다.
7. 적용 후 projection·권한·문의 상태가 승인 범위와 일치하는지 확인해 `applied`로 닫는다.

### 9.2 반려와 보완

- 보완 가능: 빠진 항목과 허용되는 근거 유형을 특정해 `supplement_requested`로 돌린다. 과도한 서류를 요구하지 않는다.
- 반려: 정체성 불일치, 관계 불충분, 권리 미확인, 허위·과장, 범위 외 등 현재 근거로 승인할 수 없을 때 사용한다.
- 반려 사유는 신청자에게 필요한 범위로만 안내하고 내부 fraud 신호·다른 사람 개인정보·보안 통제를 노출하지 않는다.
- 반려·보완 중 기존 공개값, 다른 grant, 다른 승인 field를 자동 삭제하지 않는다.

### 9.3 재제출

- 새 case를 중복 생성하지 않고 원 case에 새 evidence version과 resubmission 시각을 연결한다.
- 바뀐 부분만 다시 검수하되 만료·정체성·정책 변경이 있으면 관련 gate를 재검사한다.
- 원결정과 원증빙은 덮어쓰지 않는다.

### 9.4 오승인 회수와 grant 회수

- 신호: 잘못된 지점 연결, 퇴사·대행 종료, 계정 침해, 분쟁, 정책 위반, 과도한 scope, 잘못 승인한 증빙.
- 즉시 안전조치: 해당 grant `suspended`, 고위험 revision·inquiry 임시 보류. 관련 없는 업체·필드는 유지한다.
- admin이 원 claim, 관계 근거, 활동 로그, 영향 revision을 재검토한다.
- `revoked` 결정에는 사유·적용 시각·영향 범위·복구 조건을 기록한다. 이전 변경 이력은 보존한다.
- 계정/권한 침해 또는 개인정보 노출은 owner·QA/보안에 에스컬레이션한다.

### 9.5 이의와 재심

1. 신고자·업체·이용자는 대상 결정, 이의 사유, 새 근거를 제출한다.
2. 접수자는 P0~P3 위험을 분류하고 필요 최소 범위만 임시 숨김/문의 pause한다.
3. 원결정자가 아닌 admin이 양측 자료와 정책 버전을 검토한다.
4. `upheld / corrected / revoked / restored / rollback` 중 하나를 선택하고 표준 사유를 남긴다.
5. 외부 통지는 승인된 채널·문안이 있을 때만 수행한다. 이 SOP 작성 과정에서는 연락하지 않는다.

### 9.6 rollback

- rollback은 행 삭제가 아니라 마지막 승인 projection 또는 grant 상태로 되돌리는 새 결정이다.
- 원 case, 오류 범위, 영향을 받은 화면·문의·사진, 임시 조치, 복구 snapshot, 검증 결과를 기록한다.
- rollback 뒤 관련 case를 자동 재승인하지 않는다. 필요한 상태축을 각각 재검수한다.
- 개인정보나 권리 침해가 있으면 화면 복구보다 공개 차단을 우선하고 사고 절차를 병행한다.

## 10. 업체 표준 필드 검수

| 필드군 | 제출 필수 문맥 | 승인 기준 | 반려·보완 예 |
| --- | --- | --- | --- |
| identity·지점 | 법적/표시명, 지점명, 공식 채널, source, 기준일 | canonical·지점 충돌 해소, 과장 없는 표시명 | 다른 지점, 출처 불명, 상호 불일치 |
| 주소·활동지역 | 도로명 주소 또는 정확한 서비스 지역, 적용 시작일 | current/proposed/history 분리, 이전 여부 확인 | 주소 충돌, 개인 자택 공개 위험 |
| 업체·서비스 유형 | 표준 업종, 실제 제공 범위 | 업체 주장과 운영 분류를 분리 | 공공 업종만으로 행사 가능 확정 |
| 행사 capability | 행사 유형, 공간/서비스, 인원·제공 조건, 근거 | 관리자 검수된 `provider_asserted` 이상 | 단순 체크박스, 조건·지점 불명 |
| 공식 연락 | 대표 전화·업무 이메일·공식 URL, 용도 | 공개/문의 scope와 담당 responder 확인 | 개인 연락처 공개, 추정 이메일 |
| 가격·인원 | 최소/최대/보증, 금액 단위, 세금, 포함/제외, 기준일·유효기간 | 숫자·통화·조건이 함께 있고 결측 추정 없음 | 금액만 제출, `최저가`·실시간 주장, 기준일 없음 |
| 주차·시설 | 대수·무료시간·지원조건, 접근성, 단독 공간, 외부 반입 | 수치/yes-no의 적용 조건과 확인일 | 모름을 0/불가로 입력, 지점 불명 |
| 정책 | 취소·변경·우천·최소인원 적용 조건과 기준일 | 원문/업체 설명 범위와 날짜 표시 | 법률 보장처럼 재작성, 적용 범위 없음 |
| 사진 | asset별 권리·scope·기간·인물 동의 | 11절 gate 전부 통과 | 홈페이지/SNS에서 발견만 함, 마케팅 scope 없음 |
| 문의 | opt-in, responder, 업무 채널·수신 조건 | grant·business·publication·최근성·E2E 모두 통과 | 단순 등록을 수신 동의로 간주 |

승인된 업체 입력은 `업체 제공 정보`이며 손품해방의 포괄적 사실 보증이 아니다. 필드별 `submitted_at`, `verified_at`, `valid_until`, `next_check_at`을 구분하고 행의 `updated_at`을 확인일로 대체하지 않는다.

## 11. 사진 권리·동의·철회·만료

### 11.1 asset별 필수 체크리스트

1. provider·asset ID와 제출자 계정이 일치하는가.
2. 제출자가 저작권자이거나 손품해방 이용을 허락할 권한이 있는가.
3. 권리 근거가 `owned/licensed/provider_consent/user_consent/public_domain` 중 증빙 가능한 값인가. `unknown`은 공개 금지다.
4. scope가 업체 상세, 검색 썸네일, 콘텐츠, 외부 광고 각각 명시됐는가. 한 scope 승인을 다른 scope로 확대하지 않는다.
5. 크롭·리사이즈 등 편집 허용과 출처표시 요구가 기록됐는가.
6. 유효 시작·만료·철회 경로가 있는가.
7. 식별 가능한 인물과 미성년자가 있는지, 필요한 공개 동의가 있는지 확인했는가.
8. 비공개 원본·동의 증빙과 공개 derivative 경로가 분리됐는가.
9. reviewer, 결정일, 정책 버전, 공개 derivative 해시/버전이 기록됐는가.

### 11.2 상태별 조치

| 사건 | 즉시 조치 | 재검토·기록 |
| --- | --- | --- |
| 권리 근거 없음 | private 유지, placeholder | `photo_rights_unknown`, 보완 가능한 근거만 안내 |
| scope 불일치 | 해당 scope 공개 금지 | 허용 scope와 거부 scope를 각각 기록 |
| 인물/미성년자 동의 불명 | 공개 파생본 금지 | release 최소 증빙과 권한자 재검토 |
| 동의 철회 | 공개 derivative 우선 차단, 캐시·노출 영향 case 생성 | 철회 시각·요청자 권한·차단 결과·보유/파기 결정을 D-24에 따라 기록 |
| 만료 도래 | 만료 전 Q12, 만료 시 공개 중지 | 갱신 동의 없이 자동 연장 금지 |
| 분쟁 | 관련 asset 임시 숨김, Q13 연결 | 원검수자 외 admin 재심, 복구/삭제/유지 결정 |

업체 홈페이지·SNS에 공개된 사진이라는 사실만으로 복사·재게시 권리가 생긴 것으로 보지 않는다. 프로필 사진은 필수가 아니며, 권리 미확인 사진 대신 placeholder를 쓰는 것이 등록 반려보다 우선이다. 실제 동의서 문구와 증빙 보유기간은 이 SOP가 확정하지 않는다.

## 12. 개인정보 최소화와 접근 통제

### 12.1 D-24 전 통제

- D-24 승인 전 사업자번호 원문, 관계 서류, 신분증, 후기/사진 증빙의 새 수집·보관·외부 전송을 시작하지 않는다.
- 설계·테스트는 가짜 값과 비식별 case로 수행한다. 운영 자료를 로컬 파일·스프레드시트·개인 이메일·채팅으로 복사하지 않는다.
- 우발적으로 들어온 민감정보는 공개/분석/일반 큐에서 격리하고 최소 권한 담당자에게 사고성 case로 넘긴다. 원문을 사유 메모에 재기록하지 않는다.
- 보유기간 숫자를 임의로 넣지 않는다. 승인된 `retention_policy_id/delete_due_at/legal_hold` 계약이 생기기 전 자동 파기·무기한 보유 어느 쪽도 약속하지 않는다.

### 12.2 목적별 최소 후보 항목

다음은 D-24 검토용 **수집 후보**이며 승인된 수집 목록이 아니다.

| 목적 | 최소 후보 | 공개·분석 금지 | 접근 후보 |
| --- | --- | --- | --- |
| 신규 등록·정체성 | 업체/지점명, 주소/활동지역, 업종, 공식 업무 채널 | 요청자 개인 연락처, 내부 중복 점수 | operations |
| 사업자 상태 | 제출 번호의 암호화 원문 참조, 검색용 keyed hash, 조회 결과·시각 | 원문 번호, 대표자 입력, API 응답 원문 | 제한 operations/admin |
| 담당자 관계 | 계정 ID, 관계 유형, 업무 연락, 최소 관계 증빙 ID | 재직 서류 원문, 개인 전화·주소 | 제한 provider reviewer |
| grant | user/provider/role/scope/부여·만료·회수 | 내부 보안 신호 | provider 본인 상태, operations/admin 상세 |
| 사진 | asset, 권리 근거·scope·기간·철회, release 비공개 참조 | 원본 증빙, 인물 개인정보 | rights reviewer/admin |
| 후기·견적 | 행사 시점·조건·광고 여부, 증빙 비공개 참조 | 영수증·계약서·연락처·계좌 | content/operations 중 허용 case |

### 12.3 접근 매트릭스

| 데이터 | anon | 일반 회원/요청자 | provider grant | content | operations | admin/owner |
| --- | --- | --- | --- | --- | --- | --- |
| 승인 public projection | 읽기 | 읽기 | 읽기 | 읽기 | 관리 | 관리 |
| 후보/source/raw | 거부 | 거부 | 거부 | 거부 | 승인 목적만 | 승인 목적만 |
| ownership case 상태 | 거부 | 본인 상태·최소 결과 | 본인 상태·최소 결과 | 거부 | 검수 | 검수·재심 |
| 사업자번호·관계 서류 | 거부 | 원문 재노출 최소화 | 원문 재노출 최소화 | 거부 | 제한 검수자만 | 제한 검수·사고 |
| provider revision | 거부 | 거부 | grant 업체 본인 제출 | 거부 | 검수 | 승인·rollback |
| 사진·후기 증빙 | 거부 | 본인 제출 상태 | 자기 업체 asset 상태 | 허용 case signed access | 허용 case | 재심·사고 |
| 감사 로그 | 거부 | 본인 결과 요약 | 자기 업체 결과 요약 | 담당 case | 담당 case | 전체 운영 감사 |

추가 통제:

- 증빙은 짧은 만료 signed access, 열람자·목적·시각 감사, 다운로드 제한을 전제로 한다.
- 목록·알림·오류 메시지는 마스킹하고 비밀값·원문 번호·연락처를 넣지 않는다.
- 분석 metadata에는 문의 본문, 연락처, 사업자번호, 관계/후기/사진 증빙을 넣지 않는다.
- CSV/JSON export, 일괄 다운로드, 운영 외 공유는 기본 거부한다. 필요 시 목적·대상·마스킹·만료·승인 case를 별도로 만든다.
- `content` 역할은 사업자·소유권 자료를 열람하지 않는다. provider는 다른 업체나 다른 요청자의 자료를 열람하지 않는다.

## 13. 내부 SLA 제안과 에스컬레이션

아래는 `docs/09_운영정책.md`의 제안을 운영 큐에 매핑한 **승인 전 내부 목표**다. 운영시간·인력·휴일·알림 채널이 확정되지 않았으므로 외부 약속, 계약, 성과 지표로 사용하지 않는다.

| 우선순위 | 예 | 제안 1차 목표 | 즉시 조치·에스컬레이션 |
| --- | --- | --- | --- |
| P0 안전 | 개인정보/증빙 공개, 무권한 편집, 계정 침해, 권리 철회 후 계속 노출, 선택 외 문의 전달 | 발견 즉시 임시 차단·사고 접수; 같은 운영 교대 내 owner/admin 확인 제안 | public asset/grant/inquiry 최소 범위 차단, QA/보안·PM, 필요 시 법률/개인정보 책임자 |
| P1 높은 운영 위험 | authoritative 휴폐업 신호, 잘못된 ownership/grant, 주소·지점 충돌이 있는 공개, 사진 권리 분쟁 | 1영업일 안 1차 판정 제안 | inquiry pause/needs_update/asset hide, admin 이중 검토 |
| P1 전달 실패 | 문의 전송 실패·성공 오표시 | 시스템 감지 당일 1차 처리 제안 | 추가 전송 중지, 이용자 상태 정정 후보, 제품 E2E/QA 에스컬레이션 |
| P2 표준 검수 | registration, claim, field, 사진, 후기, 일반 오류·이의 | 2영업일 안 접수 확인·1차 판정 제안 | 증빙 부족은 보완; 큐 용량 초과 시 신규 외부 연락/모집 중단 |
| P3 낮은 위험 | 비공개 후보 분류, 만료 예정 재확인, 비긴급 메타데이터 정리 | 승인된 주간 용량 안 처리 제안 | 높은 위험 큐를 침범하면 배치 축소·PM 보고 |

시계 규칙 제안:

- `received_at`부터 접수 시간은 측정하되, 완전한 증빙 전과 제3자 응답 대기 시간을 별도 구간으로 기록한다. 통계를 좋게 보이게 하려고 case를 닫았다 다시 열지 않는다.
- P0/P1은 증빙 완전성보다 임시 안전조치를 먼저 할 수 있다. 최종 폐업·소유권·법률 판단은 별도다.
- 큐 잔량이 향후 5영업일 관측 처리 용량을 넘거나 P0/P1 미해결이 있으면 신규 업체 연락·후기 모집·대량 publication을 중단한다.
- 실제 처리시간 수치, 운영시간, 휴일, 사용자 알림 문구는 D-26 및 별도 사용자 승인 뒤 확정한다.

## 14. 표준 사유 코드

자유서술만으로 결정하지 않는다. 하나 이상의 사유 코드를 선택하고 자유서술에는 필요한 차이만 기록한다.

| 구분 | 사유 코드 | 사용 조건 |
| --- | --- | --- |
| 승인 | `identity_matched`, `business_result_recorded`, `relationship_confirmed`, `grant_scope_approved`, `field_evidence_sufficient`, `event_fit_supported`, `media_rights_confirmed`, `publication_gate_passed`, `inquiry_gate_passed` | 승인 범위와 근거 ID가 명확할 때만 |
| 출처·후보 | `rights_terms_unapproved`, `third_party_rights_unknown`, `candidate_out_of_scope`, `identity_insufficient`, `source_unavailable_only` | 출처 허락·범위·정체성 문제 |
| 중복·주소·폐업 | `duplicate_or_branch_unresolved`, `address_conflict`, `authoritative_adverse_signal`, `supporting_signal_only` | 자동 merge/폐업 금지와 임시 조치 구분 |
| 사업자·관계·권한 | `identity_or_business_mismatch`, `business_check_unknown`, `relationship_insufficient`, `grant_scope_mismatch`, `grant_holder_departed`, `account_security_risk` | business/ownership/grant를 분리해 처리 |
| 필드·행사 | `event_fit_unsubstantiated`, `scope_or_date_missing`, `price_conditions_incomplete`, `misleading_claim`, `stale_or_conflicting`, `evidence_unreadable` | 필드 단위 보완·반려 |
| 사진·후기·제보 | `photo_rights_unknown`, `consent_scope_mismatch`, `person_release_missing`, `personal_information_exposed`, `unsupported_user_report`, `experience_unsubstantiated`, `advertising_undisclosed`, `defamation_or_abuse`, `duplicate_submission` | 공개 차단과 보완/반려를 구분 |
| 문의·시스템 | `inquiry_route_unverified`, `delivery_failed`, `source_schema_changed`, `api_error`, `refresh_overdue` | 실패를 성공·폐업으로 바꾸지 않음 |
| 회수·분쟁 | `requester_withdrawn`, `incorrect_approval`, `new_evidence`, `policy_changed`, `security_or_privacy_incident`, `rights_revoked`, `decision_upheld` | reversal 원 case와 조치 범위 필수 |
| 승인 대기 | `policy_approval_required`, `external_action_approval_required`, `technical_change_request_required` | 운영자가 임의 판단하지 않고 PM에 반환 |

## 15. 운영 시나리오 검사

| # | 시나리오 | 기대 결정·상태 | 필수 기록·에스컬레이션 |
| ---: | --- | --- | --- |
| 1 | grant 없는 회원이 업체 수정 요청을 직접 적용하려 함 | 공개 변경 거부, 필요하면 Q13 보안 case. ownership 신청 경로와 분리 | user/provider/scope, 거부 시각, `grant_scope_mismatch`; 반복/우회는 QA/보안 |
| 2 | 사업자 상태는 `active`지만 요청자의 재직·대리 관계가 확인되지 않음 | business만 active, ownership `relationship_review_pending/supplement/rejected`, grant 없음 | 사업자 결과와 관계 판정을 별도 audit, `relationship_insufficient` |
| 3 | 신규 등록 업체가 기존 provider와 같은 상호·주소를 제출 | registration 보류, Q3 match case; 자동 새 공개·merge 금지 | 양쪽 ID·강한 신호·지점 질문·`duplicate_or_branch_unresolved` |
| 4 | 같은 브랜드지만 주소와 공식 연락이 다른 지점 | 별도 provider 후보로 분리 가능, 본점 claim을 지점에 확장 금지 | 지점별 주소·업무 채널·grant scope |
| 5 | 사업자 API timeout/한도 초과 | business `unknown/api_error`, 자동 반려·폐업 금지, 재시도/수동 큐 | 요청·응답 시각, 오류 코드, retry, `api_error` |
| 6 | 사업자 결과 `closed` 또는 연결된 authoritative 폐업 신호 | inquiry 즉시 pause 후보, Q4 긴급 검수; 공개 폐업은 운영 확인 후 | source 연결·기준일·영향 문의, `authoritative_adverse_signal` |
| 7 | 공공 source run에서 레코드가 한 번 사라짐 | `source_unavailable` 신호만, 기존 provider 자동 폐업·삭제 금지 | run/anomaly, 직전 observation, `source_unavailable_only` |
| 8 | 기존 주소와 업체 제출 새 주소가 충돌 | location proposal, 위치 필터/문의 보수적 pause 가능, 이전/새 지점 수동 판정 | before/proposed 주소·유효일·`address_conflict` |
| 9 | 음식점 공공 업종만으로 돌잔치 가능이라 제출됨 | capability `candidate` 유지, 행사 조건 보완; 필터 공개 확정 금지 | 업종 source와 행사 근거 분리, `event_fit_unsubstantiated` |
| 10 | 업체가 가격 180만원만 입력 | field `supplement_requested`; 인원·세금·포함/제외·기준일·유효기간 전 공개 금지 | 가격 diff, 빠진 조건, `price_conditions_incomplete` |
| 11 | 필드 반려 후 근거를 보완해 재제출 | 원 case에 새 evidence version 연결, 변경 부분 재검수; 원 반려 보존 | resubmission 시각·새 근거·원 reason·최종 decision |
| 12 | grant 보유 업체가 자기 revision을 승인하거나 public/inquiry 상태를 바꾸려 함 | 권한 거부, revision은 pending 유지; 반복은 grant suspend 검토 | 시도 scope·RLS 기대값·`grant_scope_mismatch`, QA-003 연결 |
| 13 | 사진 파일은 있으나 공개 동의 scope가 없음 | private 유지, placeholder, Q10 보완 | asset·rights basis·누락 scope·`photo_rights_unknown` |
| 14 | 공개 사진의 권리자가 동의를 철회 | 공개 derivative 우선 차단, media `revoked`, Q13 연결; 다른 업체 필드 유지 | 요청자 권한·철회 시각·노출/캐시 영향·`rights_revoked` |
| 15 | 사진 동의 만료 또는 인물·미성년자 release 불명 | 만료 시 공개 중지; release 불명은 승인 금지 | expiry/release ref, `person_release_missing` |
| 16 | 담당자 퇴사·대행 종료가 확인됨 | 해당 grant suspend/revoke, ownership 재검토; 과거 audit 보존 | 종료 근거·영향 scope·revision·`grant_holder_departed` |
| 17 | 가격 확인 121일 경과, 다른 기본 필드는 유효 | 가격 숨김과 Q12; 기본 페이지는 다른 gate 충족 시 유지 | field별 날짜·projection 영향·`refresh_overdue`; 실제 주기는 D-25 |
| 18 | 핵심 정보 180일 초과 | inquiry `stale/paused`, publication `needs_update` 검수; 자동 폐업 금지 | 핵심 필드 목록·마지막 확인·연락/재확인 case |
| 19 | 고객 오류 제안이 업체 최신 주장과 충돌 | 기존값 즉시 덮지 않고 양 assertion을 Q9/Q13 재검토 | 양측 근거·시점·조건·`stale_or_conflicting` |
| 20 | 로그인 회원이 후기 작성했으나 예약 증빙 없음 | content 검수 후 최대 `self_reported/이용자 후기`; `예약 확인 후기` 금지 | 행사 시점·조건·광고·moderation, `experience_unsubstantiated` 필요 시 보완 |
| 21 | 업체가 승인 결정에 이의 제기하고 새 공식 근거 제출 | 원결정자 외 admin 재심, 임시 조치 최소화, uphold/correct/rollback | 원 case·새 근거·정책 버전·`new_evidence/decision_upheld` |
| 22 | inquiry opt-in은 있으나 전달·열람·알림 E2E 실패 | inquiry `eligible/paused` 유지, enabled 금지 | E2E 단계·실패 상태·`inquiry_route_unverified/delivery_failed`, QA-003/BE 후속 |

22개 시나리오는 카드가 지정한 무권한 편집, active 사업자/담당자 미확인, 사진 철회, 주소 충돌, 폐업 신호, 반려 후 재제출, 권한 회수, 이의·rollback을 모두 포함한다.

## 16. 운영자 체크리스트

### 접수 전

- [ ] 이 case가 신규 registration인지 기존 ownership claim인지 구분했다.
- [ ] target provider/지점과 제출자의 관계를 혼합하지 않았다.
- [ ] D-24 승인 범위 안의 항목만 수집했고 자유서술·첨부의 PII를 검사했다.
- [ ] 관련 중복·폐업·분쟁·기존 grant case를 검색했다.

### 결정 전

- [ ] 나에게 이 큐와 개인정보 등급을 처리할 권한이 있다.
- [ ] 제출자와 승인자가 분리됐고 이해관계 회피를 확인했다.
- [ ] before/proposed diff, source, 기준일, 유효기간, 증빙 scope를 확인했다.
- [ ] business·ownership·grant·field·publication·inquiry 상태를 각각 판정했다.
- [ ] 결측을 0·무료·불가·가능으로 추정하지 않았다.
- [ ] 사진·후기·견적에 권리·인물·광고·PII 문제가 없다.

### 결정 후

- [ ] 표준 reason code, 필요한 최소 자유서술, policy version, reviewer, 시각을 남겼다.
- [ ] 승인된 범위만 적용했고 다른 필드·업체·권한에 영향이 없는지 확인했다.
- [ ] 적용 실패를 승인 성공으로 표시하지 않았다.
- [ ] 알림은 승인된 채널·문안 범위에서만 큐에 넣었다.
- [ ] 이의·철회·rollback 경로와 관련 case를 연결했다.

## 17. 승인 게이트와 후속 변경 요청

### 17.1 운영 시작 게이트

| 게이트 | 충족 전 금지 | 승인·검증 주체 |
| --- | --- | --- |
| D-23 원천 채택 | 공공데이터 활용신청·수집·원천 기반 공개 | 사용자, QA/BE 결과 |
| D-24 개인정보·증빙 | 사업자번호·관계 서류·사진/후기 증빙 수집·보유 | 사용자, 개인정보/법률 책임자, QA/BE/OPS |
| D-25 라벨·주기 | 신뢰 라벨 최종 문구, 자동 만료·숨김·재확인 수치 확정 | 사용자, BIZ/OPS/BE/FE |
| D-26 외부 연락·파일럿 | 업체 연락, 후속 연락, 온보딩, 서울 90일 시계 시작 | 사용자, PM/MKT/OPS |
| 역할 E2E | 실제 claim 승인, grant, revision, publication, inquiry 운영 | QA-003, BE/FE 후속 카드 |
| 운영 인력·SLA | 외부 처리시간 약속, 대량 접수·연락 | 사용자/PM/운영 책임자 |
| 배포·최종 병합 | 공개 기능·DB·알림·Storage 운영 적용 | 사용자/PM |

### 17.2 `CHANGE_REQUEST`

이 SOP를 실제 구현하려면 공통 계약을 바꾸므로 OPS-008에서 직접 수정하지 않고 PM이 순차 카드와 단일 파일 소유권을 정해야 한다.

1. BE-006: registration/business/ownership/access/field/media/audit/public projection의 기존 001~005 additive 매핑
2. 후속 DB/RLS/RPC/Storage: 민감 증빙 격리, grant scope·회수, immutable audit, 공개 derivative 분리
3. 관리자 UI: 13개 큐, diff, reason, 이중 검토, 보완·이의·rollback, 마스킹·열람 감사
4. 공개 FE-008: 제공 주체·필드 검수·최근성·확인 필요 표시와 publication/inquiry 분리
5. QA-003/QA-012: 익명·회원·provider·content·operations·admin 역할, 무권한 우회, signed URL, 공개 bundle, 상태 전이 E2E
6. MKT-010: D-26 승인 배치만 대상으로 외부 연락·온보딩·수신거부·용량 중단 실행

위 항목은 기존 BACKLOG의 BE-006·FE-008·QA-003·QA-012·MKT-010과 중복되므로 신규 카드 ID를 제안하지 않는다. BIZ-003·QA-011·OPS-008 PM PASS 뒤 OPS-010이 기준 문서를 현행화한다.

## 18. 검증과 완료 조건 대조

| 완료 조건 | 반영 위치 | 판정 |
| --- | --- | --- |
| 신규 등록/기존 소유권 분리 | 7.1, 7.2 | 충족 |
| 사업자·담당자·grant 분리 | 3, 6, 7 | 충족 |
| 업체 표준 입력·검수·반려·보완·회수 | 7.3, 9, 10 | 충족 |
| 사진 동의·철회·만료 | 11 | 충족 |
| 관리자 13개 큐 | 8 | 충족 |
| 역할·입력·증빙·결정·상태·사유·기록·에스컬레이션 | 4~9, 13~14 | 충족 |
| 개인정보 최소화·역할별 접근 | 12 | 설계 충족, 실제 수집은 D-24 대기 |
| 10개 이상 운영 시나리오 | 15의 22개 | 충족 |
| SLA 제안과 승인 게이트 | 13, 17 | 충족, 공개 약속 아님 |
| 이의·rollback | 9.5~9.6, Q13 | 충족 |

정적 재현 명령:

```powershell
rg -n "^\| Q([1-9]|1[0-3]) " ops/reports/OPS-008-provider-verification-sop.md
rg -n "^\| (1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20|21|22) \|" ops/reports/OPS-008-provider-verification-sop.md
rg -n "registration|business|ownership|access grant|field assertion|publication|inquiry" ops/reports/OPS-008-provider-verification-sop.md
rg -n "APPROVAL_REQUIRED|D-24|D-25|D-26|CHANGE_REQUEST|외부 약속" ops/reports/OPS-008-provider-verification-sop.md
rg -n "사업자번호|관계 서류|signed access|분석 metadata|보유기간" ops/reports/OPS-008-provider-verification-sop.md
```

## 19. 총괄 PM 완료 보고

```text
작업 ID: OPS-008
결과: 업체 신규 등록과 기존 페이지 소유권을 분리하고 business·ownership·access grant·field/media review·publication·inquiry를 독립 판정하는 내부 SOP 설계 완료
수정·추가·삭제 파일: ops/reports/OPS-008-provider-verification-sop.md 신규 1개 / 수정·삭제 없음
운영 큐와 역할: BE-005 정본의 13개 큐, provider/operations/content/admin/owner/QA 역할과 제출·검수·승인·재심 분리
검증한 시나리오: 무권한 편집, active 사업자/담당자 미확인, 중복·지점, API 오류, 주소·폐업, 행사 capability, 가격 보완, 반려 재제출, 사진 철회·만료, grant 회수, stale, 후기, 이의·rollback, 문의 E2E 실패 등 22개
개인정보·권리 통제: D-24 전 민감 증빙 수집 금지, 목적별 최소 후보, 마스킹·제한 역할·signed access·열람 감사·공개 projection 분리, asset별 scope·철회·만료
실행 검사: 13개 큐 번호 연속성·22개 시나리오 번호 연속성·상태축/사유/감사/승인 키워드·Markdown code fence 균형 정적 검사 통과
완료 조건 충족 여부: 문서 설계 기준 충족. 실제 개인정보 수집·운영 적용·SLA는 승인 및 후속 구현/E2E 대기
재현 근거: 18절 PowerShell rg 명령과 완료 조건 대조표; ADR-016·BIZ-002·BE-005·MKT-009·docs/06·09 계약 교차 대조
공개·운영 영향: 제품·데이터·외부 상태 변화 없음. 후속 BE-006·FE-008·QA-003/012·MKT-010·OPS-010의 운영 입력 계약만 제공
남은 문제: D-24~D-26, 실제 운영 역할/시간/SLA, 개인정보·권리 법률 문구, 사업자 API·RLS·Storage·알림 E2E 미확정
범위 위반 여부: 없음. 보고서 1개 외 파일, 제품·DB·API·법률 문서·환경변수·패키지·CHG-A~C와 외부 상태를 변경하지 않음
신규 위험·백로그 후보: 신규 ID 없음. 기존 R-39~R-41, BE-006·FE-008·QA-003/012·MKT-010·OPS-010으로 흡수 권고
변경 요청: 실제 구현은 17.2의 공통 DB/RLS/RPC/Storage/관리자 UI/공개 UI 계약을 PM이 별도 CHANGE_REQUEST와 단일 소유 카드로 순차 배정
사용자 승인 필요: D-24·D-25·D-26, 실제 SLA·법률/개인정보 문구, 사업자 API·운영 DB/Storage, 외부 연락·게시·비용·배포·최종 병합
병합 권고: 보고서만 PM 독립 검수 후 병합 권고. PASS 전 DONE 처리 금지, 운영 실행은 승인·E2E 전 금지
```
