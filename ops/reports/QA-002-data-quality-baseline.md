# QA-002 정적 업체 데이터 품질 기준선

- 작업 ID: `QA-002`
- 집계일: 2026-07-21 (Asia/Seoul)
- 작업 결과: 현재 정적 원천 파일을 실제 공개 화면의 로드 순서로 읽어 `window.publicDirectoryData` 4,960건을 재현했다. 제품 코드·원천 데이터·API·DB·라우팅·디자인 파일은 변경하지 않았다.
- 범위 제한: 이 보고서는 저장소의 정적 데이터만 다룬다. `content-runtime.js`의 온라인 override와 운영 Supabase의 수량·품질·연결 상태는 확인하지 않았다.
- 공개 자격: 이 보고서는 현재 코드가 만든 배열과 목록 후기 게이트를 관찰한 것이며, `published`, `verified`, `api_collected`의 정책상 공개 자격을 새로 결정하지 않는다.

## 1. 사전 범위·충돌 검사

- 수정 예정 및 실제 수정 파일: `ops/reports/QA-002-data-quality-baseline.md` 신규 1개
- `ops/PROJECT_BOARD.md`, `ops/ACTIVE_WORK.md`, `ops/FILE_OWNERSHIP.md`, `ops/DEPENDENCIES.md`를 대조했다.
- 활성 작업은 없고, 병행 가능한 `MKT-001`의 결과 파일은 `ops/reports/MKT-001-seo-content-gap.md`로 분리돼 있다.
- CHG-A(`package.json`, 잠금 파일, 브라우저 검사), CHG-B(업체 화면), CHG-C(기존 미추적 문서·favicon)와 수정 경로가 겹치지 않는다.
- 시작 전 `git status --short`에서 CHG-A~C에 해당하는 기존 변경을 확인했다. 해당 변경은 수정·되돌림·병합하지 않았다.
- 대상 보고서는 시작 전에 존재하지 않았다.

## 2. 입력과 재현 조건

실제 공개 목록·상세 화면의 정적 스크립트 순서와 같이 다음 파일을 차례로 격리 실행했다. `review-lifecycle-candidates.js`도 입력으로 로드되지만, `data.js`가 존재하는 `reviewLifecycleVerifiedData`를 우선하므로 병합 결과에는 직접 들어가지 않는다.

| 순서 | 파일 | 바이트 | SHA-256 |
| ---: | --- | ---: | --- |
| 1 | `review-provider-candidates.js` | 62,714 | `35dcd7ee03b632a9837ee38fe4de3efb1140cd360173f024d748f2ac7e3a2d85` |
| 2 | `review-lifecycle-candidates.js` | 95,743 | `1c979b05b121885dfc96f8853105a53ebe84317ce81a2bfc8dd1e051e9772b9a` |
| 3 | `review-lifecycle-verified.js` | 189,293 | `b133a71de2a911e35494481345cdc5021dcff97170c887dee90b58e3ec5ed1d4` |
| 4 | `review-local-api-partners.js` | 12,018,430 | `d8fb75f62c27daf81710a8214876610a4939119dd40d1144d17a3a03d1af08bd` |
| 5 | `data.js` | 35,899 | `76305d8e33b4a3b245384c4b1a40d612dac319601db38f328028066b287ca914` |

Node.js는 Codex 번들 런타임의 `C:\Users\mch45\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`를 사용했다. 브라우저 전역은 `window`와 읽기 전용 집계에 필요한 빈 `localStorage` 스텁만 제공했다.

### 재현 명령

저장소 루트의 PowerShell에서 아래 명령을 실행하면 원천 크기, 병합 합계, 원천별 부분합, ID 중복, 지역·행사·출처·확인 상태, 필수 필드, 후기 및 이미지 상태를 다시 계산할 수 있다. 저장소 파일은 만들거나 변경하지 않는다.

```powershell
$nodeExe = 'C:\Users\mch45\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
$code = @'
const fs=require('fs'),vm=require('vm'),crypto=require('crypto');
const files=['review-provider-candidates.js','review-lifecycle-candidates.js','review-lifecycle-verified.js','review-local-api-partners.js','data.js'];
const s={window:{},localStorage:{getItem:()=>null,removeItem:()=>{}},console};
vm.createContext(s);
for(const f of files) vm.runInContext(fs.readFileSync(f,'utf8'),s,{filename:f});
const w=s.window,r=w.publicDirectoryData,t=v=>typeof v==='string'&&v.trim();
const count=a=>Object.fromEntries([...a.reduce((m,v)=>m.set(String(v??'(없음)'),1+(m.get(String(v??'(없음)'))||0)),new Map())].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'ko')));
const addr=x=>x.address||x.roadAddress||x.officialVerification?.roadAddress||x.officialVerification?.address||Object.entries(x.detailFacts||{}).find(([k,v])=>/주소/.test(k)&&t(v))?.[1]||'';
const source=x=>x.officialLink||x.officialVerification?.link||x.sourceUrl||x.source_url||'';
const collected=x=>x.collectedAt||x.collected_at||x.officialVerification?.checkedAt||'';
const ids=count(r.map(x=>x.id)),images=[...new Set(r.map(x=>x.image).filter(t))];
console.log(JSON.stringify({
  inputs:{provider:w.reviewProviderCandidateData.length,lifecycleCandidate:w.reviewLifecycleCandidateData.length,lifecycleVerified:w.reviewLifecycleVerifiedData.length,localApi:w.reviewLocalApiPartnerData.length},
  files:files.map(f=>({file:f,bytes:fs.statSync(f).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')})),
  total:r.length,uniqueIds:Object.keys(ids).length,duplicateIdGroups:Object.entries(ids).filter(([,n])=>n>1),
  region:count(r.map(x=>x.region)),category:count(r.map(x=>x.category)),
  eventTags:count(r.flatMap(x=>x.eventTags||['(없음)'])),publicationStatus:count(r.map(x=>x.publicationStatus)),
  sourceStatus:count(r.map(x=>x.sourceStatus)),officialStatus:count(r.map(x=>x.officialVerification?.status)),
  fields:{name:r.filter(x=>t(x.name)).length,category:r.filter(x=>t(x.category)).length,regionOrAddress:r.filter(x=>t(x.region)||t(x.area)||t(addr(x))).length,address:r.filter(x=>t(addr(x))).length,officialSource:r.filter(x=>t(source(x))).length,collectedAt:r.filter(x=>t(collected(x))).length,verifiedAt:r.filter(x=>t(x.verifiedAt)).length,positivePrice:r.filter(x=>Number(x.price||x.startingPrice||x.basePrice)>0).length,telephone:r.filter(x=>t(x.telephone)||t(x.phone)||t(x.officialVerification?.telephone)).length},
  reviews:{providers:r.filter(x=>(x.externalReviews||[]).length).length,links:r.reduce((n,x)=>n+(x.externalReviews||[]).length,0)},
  images:{paths:r.filter(x=>t(x.image)).length,verifiedTrue:r.filter(x=>x.imageVerified===true).length,verifiedMissing:r.filter(x=>!Object.hasOwn(x,'imageVerified')).length,unique:images.length,missingFiles:images.filter(x=>!fs.existsSync(x))}
},null,2));
'@
& $nodeExe -e $code
```

입력 해시는 별도로 다음처럼 교차 확인했다.

```powershell
Get-FileHash -Algorithm SHA256 review-provider-candidates.js, review-lifecycle-candidates.js, review-lifecycle-verified.js, review-local-api-partners.js, data.js
```

## 3. 집계 정의

| 항목 | 정의 |
| --- | --- |
| 공개 정적 병합 결과 | 위 5개 파일을 순서대로 실행한 뒤의 `window.publicDirectoryData`. 운영 override 제외 |
| 원천 부분합 | 결과 ID가 각 원천 배열 ID 집합에 속하는지로 분류 |
| ID 중복 | 문자열화한 `id`가 병합 결과에 2회 이상 존재하는 그룹 |
| 지역 | `region`의 원문 값을 변경·정규화하지 않고 집계 |
| 행사 태그 | `eventTags`의 각 값별 보유 업체 수. 한 업체가 여러 태그에 포함되므로 태그 배정 합계는 전체 업체 수보다 클 수 있음 |
| 런타임 필수 필드 | 현재 `isProviderPublic()`의 핵심과 같은 `name` + (`region`/`area`/중첩 주소 중 하나) + `category` |
| 정책 필수 식별 | `docs/05_업체데이터구조.md` 기준 업체명 + 업종 + 지역/주소 + 공식 출처 + 수집일. 공식 출처는 `officialLink`, `officialVerification.link`, `sourceUrl`, `source_url`; 수집일은 `collectedAt`, `collected_at`, `officialVerification.checkedAt` 순으로 판정 |
| 주소 있음 | 최상위 `address`/`roadAddress`, `officialVerification.roadAddress`/`address`, 또는 `detailFacts`의 키에 `주소`가 포함된 값 중 하나 |
| 후기 근거 | `externalReviews`가 1건 이상인 업체. 후기 원문 링크 수는 배열 길이 합계 |
| 목록 후기 게이트 | `scripts/pages/venues.js`의 `hasPublishedReviewOrRating()`과 같은 내부 후기 수·내부 평점·외부 후기 수 조건 |
| 이미지 경로 확인 | `image` 문자열이 있고 그 상대 경로 파일이 저장소에 존재하는지 확인 |
| 이미지 검증 | `imageVerified === true`만 검증됨으로 집계. 파일 존재는 권리·출처·내용 검증으로 간주하지 않음 |

## 4. 전체·부분 합계와 중복 교차검산

### 원천 배열과 병합 결과

| 원천 | 원본 | 병합 포함 | 제외 | 제외 근거 |
| --- | ---: | ---: | ---: | --- |
| `review-provider-candidates.js` | 30 | 30 | 0 | 없음 |
| `review-lifecycle-candidates.js` | 42 | 0 | 42 | `reviewLifecycleVerifiedData`가 존재해 `data.js`의 `verified || candidate`에서 verified 배열을 사용 |
| `review-lifecycle-verified.js` | 42 | 39 | 3 | `sourceStatus=비공개 대기`, `publicationStatus=hidden`, `officialVerification.status=unmatched` |
| `review-local-api-partners.js` | 5,031 | 4,891 | 140 | `sourceStatus=자동 검수 보류`, `publicationStatus=hidden`, `autoReview.status=held` |
| **실제 병합 결과** |  | **4,960** |  | **30 + 39 + 4,891 = 4,960** |

- 병합 결과 레코드: 4,960
- 고유 ID: 4,960
- 중복 ID 그룹: 0
- 중복으로 추가된 레코드: 0
- `publicationStatus`: `published` 4,960

`review-lifecycle-candidates.js`는 대체 입력이므로 원본 수를 전체 후보 합계에 다시 더하지 않았다. 이를 더하면 실제 런타임 배열과 일치하지 않는 이중 집계가 된다.

### 지역

표준 17개 시·도 값 4,929건과 비표준 지역명 31건의 합은 4,960건이다.

| 지역 원문 값 | 건수 | 지역 원문 값 | 건수 |
| --- | ---: | --- | ---: |
| 서울특별시 | 999 | 경기도 | 848 |
| 부산광역시 | 479 | 대구광역시 | 369 |
| 인천광역시 | 360 | 경상남도 | 220 |
| 대전광역시 | 201 | 광주광역시 | 196 |
| 경상북도 | 185 | 충청남도 | 185 |
| 울산광역시 | 175 | 강원특별자치도 | 164 |
| 전라남도 | 164 | 전북특별자치도 | 127 |
| 충청북도 | 121 | 제주특별자치도 | 85 |
| 세종특별자치시 | 51 | **표준 지역 소계** | **4,929** |
| 비표준 지역명 | 31 | **전체** | **4,960** |

비표준 31건은 `대전` 4, `평택` 3, `용인`·`울산`·`원주`·`전국`·`제주`·`청주`·`춘천` 각 2, `김포`·`김해`·`남양주`·`대구`·`부천`·`세종`·`수원`·`창원`·`천안`·`화성` 각 1이다. 값을 정규화하거나 수정하지 않았다.

### 업종과 행사 태그

업종 부분합은 전체와 일치한다.

| `category` | 건수 |
| --- | ---: |
| 공간 대여 | 4,138 |
| 돌상/케이터링 | 563 |
| 스냅·영상 | 241 |
| 스냅/영상 | 7 |
| 의상/뷰티 | 7 |
| 답례품/초대장 | 3 |
| 스타일링 | 1 |
| **합계** | **4,960** |

행사 태그는 다중 선택이며 태그 없는 업체는 0건이다.

| `eventTags` | 보유 업체 수 |
| --- | ---: |
| `kids` | 4,490 |
| `wedding` | 3,818 |
| `parents` | 3,481 |
| `home` | 3,156 |
| **태그 배정 합계** | **14,945** |

현재 정적 데이터의 행사 태그 값은 위 4개 레거시 값뿐이다. 최신 8개 행사 분류와의 매핑 또는 재분류는 이번 작업 범위가 아니다.

## 5. 출처·확인 상태

| 항목 | 값 | 건수 |
| --- | --- | ---: |
| 병합 원천 | 지역 API | 4,891 |
| 병합 원천 | 검증 라이프사이클 | 39 |
| 병합 원천 | 후기 기반 후보 | 30 |
| `sourceStatus` | 기본 정보 등록 | 4,930 |
| `sourceStatus` | 후기 기반 등록 (`data.js` 변환 후) | 30 |
| `officialVerification.status` | `api_collected` | 4,891 |
| `officialVerification.status` | `verified` | 39 |
| `officialVerification.status` | 필드 없음 | 30 |
| `officialVerification.autoReview.status` | `approved` | 4,891 |
| `officialVerification.autoReview.status` | 필드 없음 | 69 |

`api_collected` 4,891건은 상태값 관찰치일 뿐, 검증 완료 또는 공개 자격으로 해석하지 않았다. 운영 Supabase 상태와도 연결하지 않았다.

## 6. 필수 필드와 데이터 품질

| 검사 | 충족 | 결측 | 비율 |
| --- | ---: | ---: | ---: |
| 업체명 | 4,960 | 0 | 100% |
| 업종(`category`) | 4,960 | 0 | 100% |
| 지역 또는 주소 | 4,960 | 0 | 100% |
| 이미지 경로 | 4,960 | 0 | 100% |
| 현재 런타임 필수 필드 모두 충족 | 4,960 | 0 | 100% |
| 중첩 주소 있음 | 4,930 | 30 | 99.4% |
| 수집일 있음 | 4,930 | 30 | 99.4% |
| 최종 확인일(`verifiedAt`) 있음 | 4,960 | 0 | 100% |
| 공식 출처 있음 | 3,646 | 1,314 | 73.5% |
| 문서상 정책 필수 식별 모두 충족 | 3,646 | 1,314 | 73.5% |
| 양수 가격 | 0 | 4,960 | 0% |
| 전화 | 0 | 4,960 | 0% |

중첩 주소 4,930건 중 `officialVerification.roadAddress`가 있는 레코드는 4,850건이다. 나머지는 `detailFacts["도로명 주소"]` 또는 다른 주소 필드로만 확인된다. 주소를 최상위 표준 필드로 승격하거나 정확성을 검증하지 않았다.

### 후기 근거와 목록 재현

| 검사 | 건수 |
| --- | ---: |
| 외부 후기 근거 보유 업체 | 122 |
| 외부 후기 근거 미보유 업체 | 4,838 |
| 외부 후기 원문 링크 합계 | 459 |
| 정적 내부 후기/평점 보유 업체 | 0 |
| 현재 목록 후기 게이트 통과 | 122 |

따라서 정적 배열 4,960건 중 `scripts/pages/venues.js`의 후기·평점 필수 조건을 통과하는 레코드는 122건이다. 이는 현재 동작의 재현이며 공개 정책의 타당성 판정은 아니다.

### 이미지 확인 상태

| 검사 | 결과 |
| --- | ---: |
| `image` 경로 있음 | 4,960 |
| 고유 이미지 경로 | 6 |
| 저장소에 실제 존재하는 고유 경로 | 6 |
| 누락된 이미지 파일 경로 | 0 |
| `imageVerified=true` | 0 |
| `imageVerified=false` | 0 |
| `imageVerified` 필드 없음 | 4,960 |

이미지 파일이 존재한다는 사실과 이미지 출처·권리·내용 검증은 별개다. 현 정적 레코드만으로 검증 완료 이미지는 0건이다.

## 7. 결정적 표본 대조

표본은 병합에 실제 포함된 각 원천에서 ID 문자열 오름차순 첫 4건씩, 총 12건을 선택했다. 같은 입력과 정렬 규칙으로 다시 선택할 수 있다. `주소/공식/수집`은 위 집계 정의의 충족 여부이고, 이미지 검증은 12건 모두 필드 없음이다.

| 원천 | ID | 업체명 | 지역 | 행사 태그 | 공식 상태 | 주소/공식/수집 | 외부 후기 |
| --- | --- | --- | --- | --- | --- | --- | ---: |
| 후기 후보 | `review-provider-0cbd4512533e` | 달콤한생일 | 대전 | wedding, kids, parents, home | 필드 없음 | N / N / N | 5 |
| 후기 후보 | `review-provider-13c96735121a` | 파티더타임 | 김해 | wedding, kids, parents, home | 필드 없음 | N / N / N | 5 |
| 후기 후보 | `review-provider-157b459a6869` | 다린스토리 | 남양주 | wedding, kids, parents, home | 필드 없음 | N / N / N | 5 |
| 후기 후보 | `review-provider-26364512bc82` | 호텔수건 | 제주 | wedding, kids, parents, home | 필드 없음 | N / N / N | 3 |
| 검증 라이프사이클 | `review-lifecycle-0612206c919b` | 파티하리 | 대전광역시 | kids, parents | verified | Y / Y / Y | 5 |
| 검증 라이프사이클 | `review-lifecycle-12e98d07db93` | 수담한정식 | 서울특별시 | wedding, parents | verified | Y / Y / Y | 4 |
| 검증 라이프사이클 | `review-lifecycle-148f0ffd6a89` | 트리웨딩 | 충청북도 | wedding | verified | Y / Y / Y | 5 |
| 검증 라이프사이클 | `review-lifecycle-179e0f16943f` | 러비네 | 인천광역시 | kids, parents, home | verified | Y / Y / Y | 5 |
| 지역 API | `review-local-api-000d3499a655` | 뷰튜디오 | 울산광역시 | wedding, kids, parents, home | api_collected | Y / Y / Y | 0 |
| 지역 API | `review-local-api-001f67f7f1cf` | 안양 파티룸 써니데이 | 경기도 | wedding, kids, parents, home | api_collected | Y / Y / Y | 0 |
| 지역 API | `review-local-api-0023b6beede5` | 꿀잼키즈룸 센텀반여점 | 부산광역시 | kids, home | api_collected | Y / Y / Y | 0 |
| 지역 API | `review-local-api-00379bf1d532` | 파티풍 | 광주광역시 | kids, parents, home | api_collected | Y / Y / Y | 0 |

12건 모두 `publicationStatus=published`이며, 표의 값은 원천과 병합 결과를 직접 대조했다.

## 8. 기존 문서 수치 대조

| 기존 주장 | 재집계 | 판정·차이 원인 |
| --- | ---: | --- |
| `publicDirectoryData` 4,960건 | 4,960 | 일치 |
| 고유 ID 4,960건, 중복 0건 | 고유 4,960, 중복 0 | 일치 |
| 원천 부분합 30 + 39 + 4,891 | 30 + 39 + 4,891 | 일치 |
| 외부 후기 근거 122건 | 122 | 일치 |
| `api_collected` 4,891건 | 4,891 | 일치 |
| 공식 링크 3,646건 | 3,646 | 일치 |
| 이미지 경로 4,960, `imageVerified=true` 0 | 4,960 / 0 | 일치 |
| 서울 1,000건, 후기·verified 각 7건 | 서울 999건, 후기·verified 각 6건 | 기존 수치는 `review-lifecycle-verified.js`의 서울 원본 7건 중 병합에서 제외되는 `남산뜰` 1건(`hidden`, `unmatched`, `비공개 대기`)을 포함했다. 공개 병합 배열 기준은 999/6이 맞다. `kids` 889건과 `돌잔치·백일` 120건은 기존 문서와 일치 |
| `officialVerification.roadAddress` 또는 `detailFacts` 주소 4,850건 | 넓은 정의 4,930건; `officialVerification.roadAddress`만 4,850건 | 기존 4,850은 `officialVerification.roadAddress` 단독 집계와 일치한다. 문서 문구의 `또는 detailFacts`까지 적용하면 4,930건이므로 정의가 수치와 불일치 |

## 9. 데이터 품질 문제와 영향 범위

1. 정책 필수 식별 필드를 모두 충족하는 레코드는 3,646건(73.5%)이다. 공식 출처가 없는 1,314건은 정책상 검수·공개 판단 전에 보강 기준이 필요하다.
2. 주소와 수집일이 없는 30건은 후기 기반 후보 원천에 집중돼 있다. 외부 후기 링크는 있으나 공식 출처와 동일하게 취급할 수 없다.
3. `api_collected` 4,891건은 전체의 98.6%지만, 수집 상태를 검증 완료로 볼 근거는 이 작업에 없다.
4. 양수 가격과 전화는 각각 0건이다. 결측을 임의 값으로 채우지 않았으며, 조건 검색·문의 전환 품질에 영향을 줄 수 있다.
5. 4,960건 모두 이미지 경로가 있으나 `imageVerified` 필드가 없다. 6개 공통 대체 이미지 파일의 존재만 확인됐고 출처·권리 검증은 확인되지 않았다.
6. 31건은 표준 17개 시·도 값이 아닌 도시명·`전국`을 `region`에 사용한다. 지역 필터 정규화 시 누락 또는 이중 분류 가능성이 있다.
7. 업종에 `스냅·영상`과 `스냅/영상`, `돌상/케이터링`과 `스타일링`처럼 표현 차이가 있다. 업종 필터·통계에서 별도 값으로 계산될 수 있다.
8. 행사 태그는 `wedding`, `kids`, `parents`, `home` 4개에만 집중돼 있어 최신 8개 행사 분류와 직접 대응하지 않는다.
9. 목록 후기 게이트는 4,960건 중 122건만 통과시킨다. 데이터 품질과 공개 정책을 분리하지 않으면 “후기 없음”을 “공개 불가”로 오인할 수 있다.

영향 범위는 정적 업체 목록·상세·비교·문의에서 사용하는 데이터 품질과 향후 D-01~D-03, FE-002, BE-001의 판단 근거다. 제품 동작이나 운영 데이터에는 이번 작업으로 인한 변경이 없다.

## 10. 재현 가능한 문제

- 동일 해시 입력에서 원천 부분합은 항상 `30 + 39 + 4,891 = 4,960`, ID 중복은 0으로 재현된다.
- `scripts/pages/venues.js`의 현재 후기 게이트 정의를 적용하면 122건만 통과한다.
- 서울 공개 병합 결과는 999건이다. 원본의 hidden 서울 레코드 `review-lifecycle-7a0532a107c4`(남산뜰)를 잘못 포함하면 1,000건이 된다.
- 주소를 `officialVerification.roadAddress`만으로 세면 4,850건, `detailFacts["도로명 주소"]` 등 문서에 적힌 보조 주소까지 포함하면 4,930건이 된다.
- 6개 고유 이미지 경로는 모두 파일이 존재하지만 4,960건 전부 `imageVerified` 필드가 없다.

## 11. 범위 밖에서 발견한 문제와 신규 작업 후보

아래 항목은 이번 작업에서 수정하지 않았다.

| 후보 | 재현 근거 | 영향 | 추천 담당 영역 |
| --- | --- | --- | --- |
| 기존 문서의 서울·주소 기준선 정정 | 공개 병합 999/6과 hidden 남산뜰 1건; 주소 정의별 4,850/4,930 차이 | 후속 의사결정의 기준 수치 오해 | 총괄 PM/문서 소유자 |
| 지역·업종 택소노미 정규화 설계 | 비표준 지역 31건, 업종 표기 분기 | 검색·필터·통계 누락/분산 | 백엔드·데이터, FE 검토 |
| 공식 출처·수집일 보강 큐 | 정책 필수 식별 충족 3,646/4,960 | 검수 근거와 신뢰도 부족 | 백엔드·데이터/운영 |
| `api_collected` 의미와 공개 자격 결정(D-02) | 4,891건이 해당 상태 | 수집과 사실 확인의 혼동 | 총괄 PM/사업·서비스/운영 |
| 후기 게이트와 공개 정책 분리(D-01, FE-002) | 목록 통과 122/4,960 | 공개 데이터와 실노출 간 큰 차이 | 총괄 PM 결정 후 디자인·프런트엔드 |
| 이미지 provenance·권리 검증 상태 모델 | 경로 4,960, 검증 필드 0 | 공개 이미지 권리·신뢰 확인 불가 | 백엔드·데이터/운영·법무 |
| 가격·전화 등 조건부 필드 보강 정책(D-03) | 양수 가격 0, 전화 0 | 필터·비교·문의 품질 저하 | 총괄 PM 결정 후 백엔드·데이터/운영 |
| 8개 행사 유형 매핑 | 실제 태그 값 4종만 존재 | 행사별 검색·콘텐츠 분류 불일치 | 사업·서비스 기획/백엔드·데이터 |

## 12. 완료 조건과 검증 결과

| 완료 조건/검증 | 결과 |
| --- | --- |
| 같은 입력으로 재계산 가능한 명령·정의·합계 | 충족. 입력 순서·해시·명령·정의를 기록 |
| 부분합과 전체합 교차검산 | 충족. 원천 30 + 39 + 4,891 = 4,960; 표준/비표준 지역 4,929 + 31 = 4,960; 업종 합계 4,960 |
| ID 중복 검사 | 충족. 고유 ID 4,960, 중복 그룹 0 |
| 결정적 표본 최소 10건 | 충족. 원천별 ID 오름차순 4건씩 총 12건 대조 |
| 기존 문서 수치 차이 설명 | 충족. 서울 hidden 1건 포함 오류와 주소 집계 정의 차이를 설명 |
| 정적 데이터와 운영 미확인 분리 | 충족. 운영 Supabase 미접근·미확인으로 명시 |
| 저장소 의존성·테스트·산출물 미추가 | 충족. 읽기 전용 one-off 명령만 실행 |
| 제품 코드·원천 데이터 미변경 | 충족 |

## 13. 총괄 PM 검토 사항과 병합 권고

- 총괄 PM 검토 필요: 기존 기준 문서의 서울 1,000/7 수치와 주소 4,850 설명을 별도 문서 작업으로 정정할지 결정해야 한다.
- 총괄 PM 결정 필요: D-01(후기와 공개 자격 분리), D-02(`api_collected` 의미), D-03(결측값 처리)는 이 보고서가 결정하지 않았다.
- 남은 문제: 운영 Supabase 데이터의 수량·중복·품질·정적 데이터 우선순위는 접근하지 않아 미확인이다.
- 추가 변경 요청: 없음. 위 신규 작업 후보는 별도 작업 ID와 소유자 지정 후 진행해야 한다.
- 다른 기능에 미칠 수 있는 영향: 보고서 신규 추가뿐이므로 런타임 영향 없음.
- 병합 권장 여부: **권장**. QA-002 전용 보고서 1개만 포함하고 CHG-A~C 및 제품 파일과 분리해 총괄 PM 검토 후 병합할 수 있다.
