# QA-007 외부 후기 수집·공개 준수 기준선 감사

- 작업 ID: `QA-007`
- 감사일: 2026-07-22 (Asia/Seoul)
- 판정: **REVISION_REQUIRED**
- 외부 정책 확정 게이트: **APPROVAL_REQUIRED**
- 감사 결과: 공식 NAVER API HUB 호출 규격과 원문 비수집 원칙은 코드에서 확인했지만, 검색 결과를 장기 저장·가공해 업체 카드와 지역·행사·가격/인원 단서로 혼합하고 정적 공개하는 현재 흐름은 현행 공식 공개 약관의 저장·가공 제한과 검색 결과 독립 표시 조건을 충족한다고 볼 수 없다. 특히 NAVER 지역정보를 별도 데이터베이스로 관리하는 것을 금지 예시로 든 공식 약관과 달리, 현재 정적 산출물은 지역검색 후보 5,031건 중 4,891건을 공개 디렉터리에 합친다.
- 법률적 한계: 이 보고서는 법률 자문이 아니다. NAVER API HUB 콘솔에서 실제 동의한 계약문, Application 등록 목적·승인 범위, 별도 제휴 또는 서면 허락은 저장소와 공식 공개 페이지에서 확인할 수 없었다. 따라서 공개 재개·유지 결정은 해당 자료와 네이버 확인 또는 법무 검토 후 별도 승인해야 한다.
- 수정 범위: 이 보고서 1개만 추가했다. 제품 코드, `backend/data`, DB, 환경변수, 패키지, CHG-A~C, 크롤러·원천 데이터는 수정하거나 실행하지 않았다.

## 1. 범위와 환경

### 포함

- 네이버 블로그 검색 API 수집 필드 → 로컬 SQLite 스키마 → 후보 가공 → 루트 정적 JavaScript → 공개 목록·상세 화면의 흐름
- 네이버 지역검색 API 산출물과 블로그 검색 메타데이터의 결합 흐름
- 제목·검색 요약·작성일·원문 URL, 파생 업체명·지역·행사·가격/인원 단서·후기 수의 저장·가공·공개 여부
- 원문·이미지·작성자·개인정보·비밀값, 검색 결과 표시, 삭제·중지 조건
- D-15 외부 후기 영역 명칭·정렬·집계 결정에 미치는 영향

### 제외

- 크롤러·API·키 실행, 실제 NAVER 응답 재수집
- `backend/data` 또는 운영 DB 변경·실행, 환경변수 조회
- 법률 적합성의 최종 확정, NAVER API HUB 콘솔의 비공개 계약문·Application 심사 내역 확인
- 제품·정적 데이터·문서·패키지 수정

### 환경

- 저장소: 로컬 Windows/PowerShell 작업 공간
- 기준일: 2026-07-22
- 외부 확인: 네이버 및 NAVER Cloud Platform 공식 출처만 사용
- Git CLI: 현재 PowerShell PATH에서 `git` 명령을 찾을 수 없어 본 작업의 독립 Git diff는 실행하지 못했다. 작업 중 쓰기 도구는 이 보고서 추가에만 사용했다.

## 2. 현행 공식 출처

확인일은 모두 2026-07-22다.

| 공식 출처 | 확인 내용 | 감사 적용 |
| --- | --- | --- |
| [NAVER API 서비스 이용약관](https://developers.naver.com/products/terms/) | 일반조건 7.3은 허용 범위를 넘는 API 취득 정보의 복제·저장(캐시 포함)·가공·배포·제3자 제공을 금지하고, 예시로 NAVER 지역정보를 별도 DB로 관리·이용하는 행위를 든다. 8.1~8.2는 결과 데이터 권리가 네이버 또는 원저작자 등 제3자에게 있고 제한된 사용권만 부여된다고 설명한다. 검색 API 특약 2.1은 검색 결과를 독립적으로 노출하고 다른 내용을 삽입·왜곡하거나 오인시키지 말며 URL 등 제공 내용을 임의 수정하지 말라고 정한다. | 장기 저장, 업체 디렉터리 혼합, 파생 태그·수치, URL canonicalization, 지역검색 별도 배열 공개의 기준 |
| [블로그 검색 결과 조회](https://api.ncloud-docs.com/docs/naver-api-hub-search-blog) | 현행 `GET /search/v1/blog`, `query/display/start/sort/format`, 응답의 `title`, `link`, `description`, `bloggername`, `bloggerlink`, `postdate` 필드를 정의한다. | 수집기가 공식 엔드포인트·필드만 사용하는지 확인 |
| [NAVER API HUB 개요](https://guide.ncloud-docs.com/docs/apihub-overview) | NAVER가 사업·API 제공 주체이고 NCP는 이용 신청·과금 등을 중개 운영한다. NAVER 검색 API 제공, 월 호출 한도·RPS 및 이용량 관리 안내가 있다. | API HUB가 단순 제3자 데이터 소스가 아니라 NAVER 제공 검색 결과임을 확인 |
| [NAVER API HUB 이관 가이드](https://guide.ncloud-docs.com/docs/apihub-migration) | API HUB 신규 Application·인증 정보, `naverapihub.apigw.ntruss.com`, `X-NCP-APIGW-API-KEY-ID`, `X-NCP-APIGW-API-KEY`로의 전환을 안내하고 서비스 신청 시 별도 이용약관 확인·동의를 요구한다. | 코드의 새 엔드포인트·헤더 적합성과 콘솔 계약문 미확인 한계 |
| [Search API 이관 공지](https://developers.naver.com/notice/article/32530) | API HUB 2026-06-25 출시, 2026-07-31 신규 신청 전환, 2027-06-30 기존 개발자센터 Search API 지원 종료 일정을 공지한다. | 코드가 이관 후 경로를 사용한다는 현행성 확인 |

### 공식 정책 해석 한계

1. 공개된 NAVER Developers 약관은 현재 공식 페이지에 게시돼 있으나 부칙 표시는 2020-03-05 시행이다.
2. API HUB 이관 가이드는 콘솔에서 별도 이용약관에 동의하도록 하지만 그 실제 계약문과 손품해방 Application의 등록 목적·별도 허락은 확인할 수 없다.
3. 따라서 이 감사는 공개 공식 약관보다 넓은 저장·가공·재배포 권한이 있다고 추정하지 않는다. 별도 계약이 존재한다면 PM이 계약문·적용 Application·허용 필드·보관기간·표시 방식을 확인해 재판정해야 한다.

## 3. 수집 → 저장 → 가공 → 공개 흐름

| 단계 | 파일·라인 | 관찰 결과 | 판정 |
| --- | --- | --- | --- |
| 블로그 검색 호출 | `backend/collect_naver_blog_evidence.py:29,94-107`, `backend/collect_naver_lifecycle_reviews.py:128-137` | 현행 API HUB `/search/v1/blog`와 이관 헤더를 사용한다. 기본 요청은 공식 파라미터 범위 안이다. | 호출 규격 **PASS**. 단 실제 Application 승인·계약 범위는 미확인 |
| 필드 최소화 | `backend/collect_naver_blog_evidence.py:121-143`, `backend/collect_naver_lifecycle_reviews.py:147-170` | `title`, 최대 500자 `description`, `link`, `postdate`를 정규화하고 작성자명·작성자 URL은 빈 값으로 버린다. 블로그 본문·이미지를 여는 코드는 없다. | 원문·이미지 비수집 **PASS** |
| URL 변형 | `backend/collect_naver_blog_evidence.py:70-76`, `backend/collect_naver_lifecycle_reviews.py:94-100` | 모바일 호스트를 `blog.naver.com`으로 바꾸고 query·fragment를 제거한다. | 검색 API 특약의 “URL 등 제공 내용 임의 수정 금지”와 충돌 가능. **보류** |
| 장기 저장 | `backend/schema.sql:151-170`, `backend/collect_naver_blog_evidence.py:185-235` | 제목·요약·URL·작성일·검색어·지역·광고성 플래그·관련성 점수를 `review_sources`에 보관한다. 보관기간·만료·원문 삭제 tombstone이 없다. | **보류/승인 필요** |
| 검수 대기 공개 인덱스 | `backend/export_public_review_index.py:18-43` | `status='pending'` 행을 골라 제목·URL·작성일·지역·광고성 여부를 `review-candidates.js`로 쓴다. | 내부 검수 대기와 공개 파일 경계가 반대다. **금지** |
| 장소 후보 파생 | `backend/build_review_venue_candidates.py:207-296` | pending 제목·요약에서 업체명·지역·업종·주제·반복 언급·신뢰 점수를 생성한다. 결과는 `status='reviewing'`이지만 `backend/export_review_venue_candidates.py:14-20`이 루트 JS로 내보낸다. | 검색 결과의 가공·혼합 공개. **금지** |
| 비장소 업체 후보 파생 | `backend/build_review_provider_candidates.py:143-215` | 제목·요약에서 수동 업체명과 지역·태그·최신일·후기 수를 만들고 곧바로 `publicationStatus='published'`, `sourceStatus='상품 정보 확인'`으로 둔다. 쿼리에 `review_sources.status` 조건이 없다. | rejected/linked 포함 가능, 자동 공개. **금지** |
| 생애주기 업체 후보 파생 | `backend/build_lifecycle_partner_candidates.py:119-163` | 제목·요약에서 업체 카드·행사 태그·지역·상세 팩트·원문 수를 만들고 `published`로 둔다. 역시 `review_sources.status` 조건이 없다. | 자동 공개·상태 경계 누락. **금지** |
| 지역검색 후보 수집 | `backend/collect_naver_local_partners.py:220-254,269-290` | NAVER 지역검색의 이름·업종·주소·링크를 별도 업체 배열로 만든다. 기본은 hidden이지만 `--publish` 옵션은 즉시 공개한다(`:302,324-329`). | 공식 약관의 지역정보 별도 DB 금지 예시와 직접 충돌. **금지** |
| 지역검색 자동 공개 | `backend/publish_local_api_partners.py:68-79,102-126`, `backend/auto_review_local_api_partners.py:141-205` | 주소·키워드 휴리스틱으로 업체를 공개하고 API 수집 상태를 `기본 정보 등록`으로 바꾼다. 이후 자동 검수는 후기 제목에서도 가격·인원·행사 단서를 파생한다. | 운영 검증·약관 승인 없는 자동 공개. **금지** |
| 블로그로 지역검색 업체 보강 | `backend/enrich_local_api_partners_from_naver_blog.py:207-257` | 검색 결과 제목·요약에서 가격·인원·행사 단서를 추출하고 외부 후기·sourceCount를 결합해 `후기 기반 등록`으로 바꾼다. | 검색 결과 왜곡·파생 사실화 위험. **금지** |
| 공개 디렉터리 병합 | `data.js:388-420,459-471` | 후기 기반 후보와 지역검색 후보를 `publicDirectoryData`에 합치며 `상품 정보 확인`을 `후기 기반 등록`으로, 후기 수를 `N개 원문 연결`, 등록 기준을 `공개 후기 기반`으로 바꾼다. | 검색 결과 독립 표시가 아니라 업체 사실·상품 맥락과 혼합. **금지** |
| 공개 상세 표시 | `provider.html:36-40,49`, `scripts/pages/provider.js:72-124` | 외부 제목·작성일·원문 링크와 개수를 업체 상세의 “이용 후기” 탭에 표시한다. NAVER 검색 API 결과라는 출처·표시 기준·검색 쿼리·수집일은 보이지 않는다. | 독립 표시·출처·오인 방지 미충족. **금지** |
| 배포 포함 | `scripts/build/prepare-dist.mjs:7-24,55-72` | 제외 2개를 빼고 루트 `.js` 전부를 `dist`로 복사한다. 현재 `dist`에 6개 후기/업체 산출물이 모두 존재한다. | 단순 내부 큐가 아니라 배포 파일. **FAIL** |

## 4. 정적 산출물 재현 결과

### 입력 해시

| 파일 | 바이트 | SHA-256 |
| --- | ---: | --- |
| `review-candidates.js` | 2,646,021 | `29f496b8475b584f8b1b8f147dec0edb14d5b7963b18afca86c8b640ac8791d4` |
| `review-venue-candidates.js` | 579,701 | `dc53bd260df8ea7df0ac5223e4dc4769bf1f3bc91a4df87f99a22ae1e47c3efc` |
| `review-provider-candidates.js` | 62,714 | `35dcd7ee03b632a9837ee38fe4de3efb1140cd360173f024d748f2ac7e3a2d85` |
| `review-lifecycle-candidates.js` | 95,743 | `1c979b05b121885dfc96f8853105a53ebe84317ce81a2bfc8dd1e051e9772b9a` |
| `review-lifecycle-verified.js` | 189,293 | `b133a71de2a911e35494481345cdc5021dcff97170c887dee90b58e3ec5ed1d4` |
| `review-local-api-partners.js` | 12,018,430 | `d8fb75f62c27daf81710a8214876610a4939119dd40d1144d17a3a03d1af08bd` |
| `data.js` | 35,899 | `76305d8e33b4a3b245384c4b1a40d612dac319601db38f328028066b287ca914` |

### 표본·전수 정적 검사

| 산출물 | 전수 결과 | 공개 영향 |
| --- | --- | --- |
| `review-candidates.js` | 9,991건 모두 `reviewing`, NAVER 블로그 URL 9,991개, 고유 URL 9,991개, 광고·협찬 표시 단어 플래그 85건 | 화면 참조는 찾지 못했지만 루트 JS이고 빌드가 모든 루트 JS를 복사해 `dist`에 2.65MB 파일로 존재 |
| `review-venue-candidates.js` | reviewing 장소 후보 460건, 원문 evidence 2,056개(고유 URL 1,684), 반복 언급 합계 3,457, 광고성 단어 언급 합계 24 | `venue.html:181`이 파일을 로드하고 `venue.js:136-160,217,234-238`이 외부 원문·반복 언급·후기 기반 공개 상태를 표시 |
| `review-provider-candidates.js` | 30건 전부 `published`, 외부 원문 132개(고유 127개) | `data.js`가 30건 전부 공개 디렉터리에 병합 |
| `review-lifecycle-candidates.js` | 42건 전부 `published`, 외부 원문 196개 | 공개 페이지는 verified 배열이 존재하면 후보 배열 대신 verified 배열을 사용 |
| `review-lifecycle-verified.js` | 42건 중 39건 `published`, 외부 원문 196개 | 39건이 공개 디렉터리에 병합 |
| `review-local-api-partners.js` | 5,031건, `published` 4,891·hidden 140, 도로명주소 4,946, 외부 원문 151, 후기 행사 단서 300, 후기 인원 단서 1 | 4,891건이 공개 디렉터리에 병합. hidden 140건도 같은 12MB 공개 JS에 포함 |
| 실제 공개 병합 | 후기 후보 30 + verified 생애주기 39 + 지역 API 4,891 = 4,960 | `venues.html`, `provider.html`, `compare.html`, `inquiry.html`, `claim.html`에서 원천 JS와 `data.js`를 로드 |

추가 일관성 결함: 지역 API 정적 배열에서 현재 `publicationStatus='published'`이지만 이전 `officialVerification.publicDecision`이 `published`가 아닌 레코드가 149건이고, hidden이지만 이전 결정이 `published`인 레코드가 35건이다. 후속 `autoReview.status`는 전자 4,891건을 approved, 후자 140건을 held로 다시 분류했으나 과거 결정 필드를 보존해 서로 충돌한다. 여러 자동 스크립트가 같은 파일을 순차 덮어써 단일 검수 결정·이력으로 사용할 수 없다.

## 5. 허용·보류·금지 매트릭스

| 행위 | 현재 기준 | 판정 | 조건·이유 |
| --- | --- | --- | --- |
| 등록·승인된 API HUB Application으로 공식 블로그 검색 endpoint 호출 | 코드 규격 | **조건부 허용** | 실제 Application 등록 목적·계약·호출량·비용 승인과 키 보호가 확인돼야 한다. 이번 감사에서는 호출하지 않음 |
| 블로그 본문·이미지·댓글·작성자 프로필을 열지 않고 API 응답만 사용 | 수집기 | **허용** | 현재 두 수집기는 본문·이미지를 요청하지 않고 작성자 필드를 버림 |
| 검색 결과를 처리 중 메모리에서 일시 정규화·중복 제거 | 내부 처리 | **보류** | API 계약이 허용하는 서비스 목적과 최소 처리 범위를 문서화해야 함 |
| 제목·요약·URL·날짜·검색어·지역을 SQLite에 기한 없이 보관 | `review_sources` | **보류/APPROVAL_REQUIRED** | 보관기간·삭제 근거·별도 계약이 없고 공개 약관의 저장 제한이 적용될 수 있음 |
| pending 검색 결과를 정적 공개 JS로 내보내기 | `review-candidates.js` | **금지** | 내부 검수 대기와 공개 경계 위반, 장기 복제·배포 |
| 검색 결과 제목·요약에서 업체명·지역·행사·업종·추천 주제를 추출 | 후보 builders | **금지** | 검색 결과 가공 후 다른 업체 정보와 혼합하며 오인 가능 |
| 검색 결과에서 가격·인원 단서를 추출해 업체 상세 팩트로 표시 | enrichment/auto review | **금지** | 조건·시점·광고성·작성자 맥락이 사라지고 API 결과가 파생 사실로 변함 |
| 원문 링크 개수를 업체 신뢰·인기도·추천·공개 자격·정렬에 사용 | `sourceCount`, 기존 후기 게이트 | **금지** | 검색 API 모집단·중복·기간·편향을 전체 후기 수처럼 오인, R-31 및 D-15 미결정 |
| NAVER 검색 결과를 업체 상세의 다른 정보·CTA와 섞어 표시 | 공개 상세 | **금지** | 검색 API 특약의 독립 표시·왜곡/오인 금지 조건과 불일치 |
| NAVER 제공 URL의 호스트·query를 canonicalize하여 저장·표시 | collector | **보류** | 공식 특약은 URL을 포함한 제공 내용 임의 수정 금지. 네이버 서면 확인 필요 |
| NAVER 지역검색 결과를 별도 업체 DB/정적 배열로 관리·공개 | 지역 API 파이프라인 | **금지** | 공식 약관이 명시한 금지 예시에 해당 |
| 일반 웹페이지 본문·이미지·스크린샷 재게시 | 현재 미구현 | **금지** | 저작권·초상·개인정보 및 프로젝트 ADR-014 위반 |
| 작성자명·블로그명·프로필·연락처 수집·공개 | 현재 수집기에서 제외 | **금지** | 업체 사실 확인에 필요하지 않고 개인정보·인격권 위험 증가 |
| 운영자가 권리·계약을 별도로 확인한 외부 URL을 수동 링크로 제공 | 향후 대안 | **보류** | API 결과 재배포가 아닌 수동 출처 링크인지, 표시·삭제·보관 정책과 권리자 요청 절차가 승인돼야 함 |

## 6. 원문·이미지·개인정보·비밀 영향

### 확인된 보호 조치

- 블로그 수집기는 API 검색 결과만 요청하며 블로그 본문·이미지를 내려받지 않는다.
- `bloggername`, `bloggerlink`를 저장하지 않고 `author_name`, `author_url`을 빈 값으로 둔다.
- 공개 후기 카드에는 API 요약문을 그대로 표시하지 않고 제목·작성일·원문 링크만 표시한다.
- 관련 정적 산출물에서 `NAVER_API_HUB_CLIENT_ID`, `NAVER_API_HUB_CLIENT_SECRET`, API HUB 헤더 뒤 실제 값 형태의 비밀 패턴은 0건이었다.
- 제목의 단순 이메일·전화번호 정규식 표본은 0건이었다.

### 남은 영향

- 제목과 블로그 URL 자체가 작성자 활동·계정 식별 정보를 포함할 수 있다. 전화·이메일 정규식 0건은 개인정보 부재를 의미하지 않는다.
- 9,991개의 pending 제목·URL과 5,031개의 지역검색 업체 레코드가 루트·`dist` 공개 파일에 포함돼 최소수집·비공개 큐 원칙을 충족하지 못한다.
- API 요약문은 직접 공개되지 않더라도 업체명·지역·행사 태그·가격/인원 단서·후기 수를 만드는 입력으로 사용되므로 삭제 시 파생 결과까지 역추적해야 한다.
- 지역 API의 주소·업종·공식 링크는 사업체 정보일 수 있으나 개인사업자·자택 기반 업체 여부를 자동으로 구분하지 않는다. 현재 정적 배열의 전화 필드는 0건이지만 향후 응답 필드가 채워질 경우 개인 연락처가 공개 JS에 실릴 수 있다.
- 제품 이용약관 `terms.html:69-71`의 “작성자와 게시 플랫폼 책임” 문구는 손품해방의 API 계약·재배포·가공 책임을 없애지 않는다.

## 7. 검색 결과 표시 판정

공식 검색 API 특약은 결과를 독립적으로 표시하고 앞·뒤·중간에 다른 내용을 삽입하거나 왜곡·오인시키지 않으며 URL 등 제공 내용을 임의 수정하지 말라고 정한다. 현재 공개 방식은 다음 이유로 미충족이다.

1. 결과가 독립 검색 결과 영역이 아니라 손품해방 업체 카드의 이름·업종·지역·태그·확인일·상담 CTA와 결합된다.
2. 화면 표시는 `외부 후기`, `후기 기반 등록`, `공개 후기 기반`, `N개 원문 연결`, `N건 반복 언급`이며 “NAVER 검색 API 결과”와 검색 쿼리·수집 시점·검색 모집단을 표시하지 않는다.
3. 제목·요약의 반복 출현을 업체 존재·지역·행사 유형·신뢰도·공개 상태로 변환한다.
4. 모바일 URL·query를 제거해 API 제공 URL을 변형한다.
5. `provider.js`는 내부 손품해방 후기와 외부 원문을 탭으로 나누지만, 이 시각 구분만으로 API 결과 독립 표시·저장·가공 제한을 충족하지 않는다.

## 8. 삭제·중지 조건

### 현재 구현 상태

- `docs/09_운영정책.md:89`와 `docs/11_크롤링및데이터관리.md:93-105,111-114`에는 원문 삭제·비공개·권리자 요청, 약관 변경, 보관·삭제·중지 스위치 원칙이 적혀 있다.
- 관련 수집·export·공개 코드에는 URL 404/410·비공개 확인, 권리자 요청 tombstone, 보관기간 만료, 파생 필드 역추적, 정적 산출물 제거·재배포, 약관 버전 gate가 없다.
- `contact.html:79-108`에는 일반·정보 오류·업체 입점·개인정보 권리 요청만 있고 외부 원문/저작권/권리자 삭제 유형과 대상 source ID가 없다.
- 수집기는 기존 `status!='pending'` 결정을 덮어쓰지 않지만, 후보 builder 일부는 status 조건 없이 모든 `review_sources`를 다시 읽는다. 삭제·거절 결정이 파생 공개물에서 보장되지 않는다.

### 즉시 중지·재검토 기준

다음 중 하나라도 발생하면 신규 수집뿐 아니라 관련 외부 후기 공개·파생 집계도 중지해야 한다.

1. NAVER 약관·API HUB 계약·표시 가이드 변경 또는 별도 허락 부재 확인
2. API 키 정지·Application 목적 불일치·제휴 종료
3. 원문 404/410, 비공개·삭제, 권리자·작성자·업체의 삭제/이의 요청
4. 개인정보·아동 정보·민감정보·명예훼손·광고성 오분류·업체 오연결 발견
5. 검색 결과 URL·제목·날짜 변경, 업체 폐업·이전·동명이인 확인
6. 원문 수·반복 언급·가격·인원·행사 태그가 순위·추천·공식 사실로 쓰이는 변경

재개 조건은 source ID별 원문·파생 필드 lineage, 삭제 tombstone, 정적 산출물 제거와 배포 확인, 승인된 보관기간, 권리 요청 SLA, 약관 버전·Application 승인 기록, 표본 회귀 테스트를 모두 갖추는 것이다.

## 9. D-15 영향

D-15의 외부 후기 영역 명칭·정렬·집계는 이 상태에서 승인하면 안 된다.

| D-15 항목 | 현재 위험 | QA-007 권고 |
| --- | --- | --- |
| 명칭 | `외부 후기`, `후기 기반 등록`, `공개 후기 기반`이 검색 API 후보를 검수·사실 확인된 후기 집합처럼 보이게 함 | 별도 허락 전 공개 영역 자체를 보류. 허용될 경우 `NAVER 블로그 검색 API 결과` 등 실제 출처와 “손품해방 검증 아님”을 독립 표시 |
| 정렬 | 관련성 점수·반복 언급·원문 수가 인기·추천으로 오인될 수 있음 | 평점·인기·추천·랭킹·상위 노출에 사용 금지. 승인된 독립 결과 표시가 없다면 정렬도 없음 |
| 집계 | `sourceCount`, `N개 원문`, `반복 언급`은 API 쿼리·기간·중복·광고 편향의 표본일 뿐 전체 후기 수가 아님 | 공개 수치 금지. 내부 운영용도 모집단·쿼리·기간·중복·광고 필터를 함께 기록 |
| 업체 사실 | 제목·요약에서 지역·업종·행사·가격·인원을 파생 | 공식 사이트·업체 제공·운영 확인·이용자 제보와 분리하고 자동 사실화 금지 |
| 삭제 | 원문 삭제 후 링크만 없애도 파생 태그·수치가 남음 | source→파생 필드 lineage와 일괄 철회가 D-15 승인 전 필수 |

D-15의 승인 입력은 최소한 다음을 포함해야 한다.

- NAVER API HUB 실제 계약문과 Application 목적·별도 제휴/허락 증거
- 허용 필드, 저장 위치, 보관기간, 공개 표시, URL 변형 여부에 대한 네이버 확인
- 외부 후기/업체 제공/이용자 제보/운영 확인의 데이터·시각 분리
- 원문 삭제·권리자 이의·업체 오연결·광고성·개인정보의 처리 SLA
- 검색 API 결과를 공개하지 않는 대안: 운영자 수동 조사 후보로만 사용하고 공식/업체/이용자 출처로 별도 재확인

## 10. 실행 명령과 재현 근거

실행한 명령은 모두 읽기 전용이다. 크롤러·API·키·DB를 실행하지 않았다.

```powershell
# 수집·가공·공개 라인 추적
rg -n -i --glob '*.py' --glob '*.js' --glob '*.html' "naver|blog|review_sources|externalReviews|sourceCount|publicationStatus|공개 후기 기반|원문 연결" backend scripts .

# 공개 페이지의 정적 로드 순서
rg -n "review-provider-candidates|review-lifecycle-candidates|review-lifecycle-verified|review-local-api-partners|data.js" venues.html provider.html compare.html inquiry.html claim.html admin/index.html admin/providers.html

# 삭제·중지 구현 대조
rg -n -i "삭제|비공개|권리자|remove|delete|takedown|404|410|보관기간|중지" backend docs/09_운영정책.md docs/11_크롤링및데이터관리.md scripts

# 입력 무결성
Get-FileHash -Algorithm SHA256 -LiteralPath review-candidates.js,review-venue-candidates.js,review-provider-candidates.js,review-lifecycle-candidates.js,review-lifecycle-verified.js,review-local-api-partners.js,data.js
```

정적 JS 집계 핵심 명령:

```powershell
function Read-JsJson([string]$Path) {
  $raw = Get-Content -LiteralPath $Path -Raw -Encoding UTF8
  $json = $raw -replace '^[^=]+?=\s*','' -replace ';\s*$',''
  return ($json | ConvertFrom-Json)
}

$reviews = @(Read-JsJson 'review-candidates.js')
[pscustomobject]@{
  records = $reviews.Count
  naverUrls = @($reviews | Where-Object { $_.url -match '^https://blog\.naver\.com/' }).Count
  disclosureFlagged = @($reviews | Where-Object { $_.hasDisclosureFlag }).Count
  reviewing = @($reviews | Where-Object { $_.status -eq 'reviewing' }).Count
}

$local = @(Read-JsJson 'review-local-api-partners.js')
$external = @($local | ForEach-Object { if ($_.externalReviews) { $_.externalReviews } })
[pscustomobject]@{
  records = $local.Count
  published = @($local | Where-Object { $_.publicationStatus -eq 'published' }).Count
  hidden = @($local | Where-Object { $_.publicationStatus -ne 'published' }).Count
  roadAddress = @($local | Where-Object { $_.officialVerification.roadAddress }).Count
  externalReviews = $external.Count
  eventClueItems = @($local | Where-Object { $_.detailFacts.'후기 행사 단서' }).Count
  publishedWithNonPublishDecision = @($local | Where-Object {
    $_.publicationStatus -eq 'published' -and $_.officialVerification.publicDecision -ne 'published'
  }).Count
}
```

좁은 개인정보·비밀 패턴 검사는 관련 정적 산출물에 한정해 수행했다. 결과는 API 키 패턴 0, 제목 이메일 0, 제목 전화번호 0이다. 이는 전체 개인정보 영향 평가를 대체하지 않는다.

## 11. 통과·실패와 신규 결함

| ID | 심각도 | 결과 | 재현·영향 | 추천 담당 |
| --- | --- | --- | --- | --- |
| QA007-01 | **CRITICAL** | FAIL | NAVER 지역검색 5,031건을 별도 정적 배열로 보관하고 4,891건을 공개 디렉터리에 병합. 공식 약관의 명시적 금지 예시와 충돌 | 총괄 PM → 법무/운영 확인 후 BE·FE 별도 카드 |
| QA007-02 | **CRITICAL** | FAIL | 검수 대기 검색 결과를 업체명·지역·행사·업종·가격/인원·후기 수로 가공해 업체 정보와 혼합 공개 | BIZ/OPS 정책 승인 후 BE 데이터 계약·FE 표시 수정 |
| QA007-03 | **HIGH** | FAIL | `review-candidates.js` 9,991 pending 결과와 hidden 업체 140건이 빌드 배포 파일에 포함 | BE/FE/배포 소유자, 별도 제거·회귀 카드 |
| QA007-04 | **HIGH** | FAIL | builder 일부가 `review_sources.status`를 필터하지 않아 rejected/linked도 다시 후보화 가능 | BE |
| QA007-05 | **HIGH** | FAIL | 원문 삭제·비공개·권리자 요청·보관 만료·파생 철회·재배포 절차가 코드에 없음 | OPS+BE+QA |
| QA007-06 | **HIGH** | FAIL | 공개 표시가 NAVER 검색 결과로 독립되지 않고 `외부 후기/후기 기반 등록`으로 업체 사실·CTA와 혼합 | BIZ/OPS+FE |
| QA007-07 | **MEDIUM** | FAIL | URL host/query canonicalization이 검색 API 특약의 URL 변조 금지와 충돌 가능 | 네이버 확인 후 BE |
| QA007-08 | **MEDIUM** | FAIL | 지역 API 공개 결정 필드가 상충: published 중 이전 비공개 결정 149, hidden 중 이전 공개 결정 35 | BE/OPS |
| QA007-09 | **MEDIUM** | FAIL | 문의 폼에 외부 원문/저작권/권리자 삭제 유형·source ID·SLA가 없음 | OPS/FE, D-15 후 별도 카드 |
| QA007-10 | LOW | PASS | 공식 API HUB 엔드포인트·이관 헤더 사용, 블로그 본문·이미지·작성자 필드 비수집, 공개 산출물 비밀 패턴 0 | 유지 회귀 |

기존 `ops/RISKS.md` R-27~R-31과 겹치는 항목은 위 재현 근거로 구체화했으며 제품을 직접 수정하지 않았다. 새 백로그 후보는 QA007-03~09를 기존 위험의 구현 항목으로 묶어 PM이 중복 검토 후 카드화하는 것이 적절하다.

## 12. 완료 조건

| 카드 완료 조건 | 결과 |
| --- | --- |
| 파일·라인 근거 | 충족. 수집·저장·가공·공개·배포 흐름 기록 |
| 현행 공식 URL 근거 | 충족. 네이버/NCP 공식 출처 5개, 확인일 기록 |
| 재현 명령 | 충족. `rg`, PowerShell 정적 파싱, SHA-256 기록 |
| 허용/보류/금지 매트릭스 | 충족 |
| 원문·이미지·개인정보·검색 표시·삭제/중지 구분 | 충족 |
| D-15 영향 | 충족. 명칭·정렬·집계 승인 보류 및 필수 입력 제시 |
| 크롤러/API/키/DB 비실행 | 충족 |
| 지정 보고서 외 파일 비수정 | 충족 |
| 제품 준수 기준선 | **미충족. REVISION_REQUIRED** |
| 최종 법률·계약 확정 | **미충족. APPROVAL_REQUIRED** |

## 13. 변경 요청·승인 필요·병합 권고

### 변경 요청

이 감사 카드에서는 수정하지 않는다. 총괄 PM이 다음을 별도 카드와 소유자로 분리해야 한다.

1. 공개 배포에서 pending/hidden 검색·업체 산출물을 제외하고 기존 공개 URL의 접근·캐시·배포본을 검증한다.
2. NAVER 지역검색 별도 DB/정적 공개와 블로그 검색 파생 업체 카드를 중지하거나, 별도 계약이 있다면 허용 필드·표시·보관·삭제에 맞게 데이터 계약을 재설계한다.
3. source→업체→파생 필드 lineage, tombstone, 보관기간, 권리 요청 큐, 정적 재배포 검증을 구현한다.
4. D-15 및 BIZ-001에서 외부 검색 결과를 업체·이용자 제보·업체 제공·운영 확인과 분리하고 순위·평점·후기 수 사용 금지를 확정한다.

### 승인 필요

- NAVER API HUB 콘솔 계약문, Application 등록 목적, 별도 제휴/서면 허락의 확인
- 네이버 또는 법무의 장기 저장·가공·업체 혼합·지역정보 DB·원문 URL 변형·삭제 기준 확인
- D-15의 명칭·정렬·집계와 공개 재개 여부
- 기존 배포 데이터의 제거·캐시 무효화·재배포는 운영 배포 승인이 필요한 별도 작업

### 병합 권고

- 이 보고서 1개: **병합 권고**. 읽기 전용 감사 산출물이며 런타임 영향이 없다.
- 현재 외부 후기·NAVER 지역 API 기반 공개 흐름: **병합·공개 확대 금지 / 기존 공개는 우선 중지 검토**.
- QA-007 자체 완료: PM 독립 검수에서 범위·수치·공식 출처를 재현해 `PASS`할 때만 `DONE` 처리한다.
