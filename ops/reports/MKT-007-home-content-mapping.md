# MKT-007 홈 준비백과·커뮤니티 콘텐츠 매핑 감사

- 작업 ID: `MKT-007`
- 기준일: 2026-07-22
- 작업 유형: 읽기 전용 콘텐츠·운영 감사
- 수정 범위: 이 보고서 1개만 추가
- 제품 코드·콘텐츠 원문·데이터·라우팅·canonical·sitemap·CHG-A~C 변경: 없음

## 1. 판정

### 작업 판정

**MKT-007 감사 결과는 `PASS 권고`**다. 현재 저장소에서 다시 계산 가능한 방식으로 준비백과 28개와 커뮤니티 정적 미리보기 31개를 확인하고, 기존 렌더링 경로와 MKT-002 품질 판정을 대조했다.

### C안 5번 콘텐츠 준비 판정

**현재 원문 그대로 홈에 대표 노출할 수 있는 준비백과 글 0개, 운영 승인 사실을 확인해 홈에 노출할 수 있는 커뮤니티 글 0개로 `BLOCKED`**다.

- 준비백과 28개는 모두 동일한 6개 섹션·작성일·읽는 시간과 높은 반복 문장 비율을 가진다. MKT-002에서 원문 그대로 유지 가능한 글은 0개로 판정했다.
- 커뮤니티 소스 31개는 Supabase가 설정되지 않았을 때 쓰는 `loadPreview()` 데이터다. 각 항목에 고정 닉네임, 상대 시간, 댓글·저장·공감 수가 들어 있으므로 운영 사용자가 작성하고 검수한 글로 볼 근거가 없다.
- 실제 운영 Supabase의 `published` 게시글 제목·ID·검수 상태는 이 저장소에서 확인하지 못했다. 따라서 정적 미리보기 제목을 실제 커뮤니티 글 4개처럼 홈에 복사하면 안 된다.
- C안이 요구한 4개 카드는 가상 데이터로 채우지 않고, 아래 빈 상태 대체안을 사용해야 한다.

이 판정은 C안 자체를 거부하는 것이 아니다. `ops/reports/FE-006-homepage-redesign-beige-platform-c.md:49`의 카드 수를 현재 검증된 콘텐츠 수에 맞춰 0~4개로 처리하고, 콘텐츠가 없으면 빈 상태를 보이는 안전 게이트다.

## 2. 기준과 조사 범위

### 적용한 상위 기준

1. `AGENTS.md`: 기존 URL 보존, 승인 전 외부 게시·광고·법률 문서·가격·수수료 확정 금지
2. `docs/99_의사결정기록.md` ADR-014~015: 초기 정보 플랫폼과 승인된 C안, 실제 경로·출처 정책·권리 확인이 끝난 행동만 공개
3. `ops/TASK_SPECS.md:67`: 반복 템플릿·근거 없는 수치·법률 확정 표현을 대표 콘텐츠로 선정하지 않음
4. `ops/handoffs/MKT-007.md:13`: 가상 작성자·반응 수 제외, 데이터가 부족하면 빈 상태 제안
5. `ops/reports/FE-006-homepage-content-structure-v2.md:83`: 최신 또는 대표 글만 노출하고 가상의 조회수·반응 수를 만들지 않음
6. `docs/08_마케팅전략.md`: 사실·후기 의견·제안 분리, 가격·규정의 기준일·확인 방법, 외부 후기 원문 복제 금지

### 조사한 원천

| 구분 | 데이터 원천 | 렌더링·경로 원천 | 교차 감사 |
| --- | --- | --- | --- |
| 준비백과 | `blog-data.js` | `blog.js`, `articles.html`, `article.html`, `content-runtime.js` | `ops/reports/MKT-002-content-quality-audit.md` |
| 별도 가이드 | `article-contract-questions.html`, `guides.html` | 각 정적 HTML | MKT-002 중복·대표 URL 감사 |
| 커뮤니티 | `community-post-data.js`, `community-extra-data.js` | `community-list.js`, `community-post.js`, `community.html`, `community-post.html` | `ops/reports/MKT-001-seo-content-gap.md` |
| 온라인 분기 | `content-config.js`, `dist/content-config.js` | `scripts/core/config.js`, `content-runtime.js` | 저장소·배포 환경 분리 원칙 |

브라우저 운영 세션이나 운영 DB에는 접근하지 않았다. 로컬 소스와 현재 `dist`의 공개 설정값은 모두 비어 있었고, 비밀값·개인정보·운영 계정은 조회하지 않았다.

## 3. URL 계약

### 확인된 현재 경로

| 콘텐츠 | 목록 URL | 상세 URL 생성 규칙 | 근거 |
| --- | --- | --- | --- |
| 준비백과 | `articles.html` | `article.html?slug={slug}` | `blog.js:30-32` |
| 정보 나눔 | `community.html` | `community-post.html?id={id}` | `community-list.js:22-32`, `community-post.js:45-55` |

두 상세 대상 HTML 파일은 저장소에 존재한다. 준비백과 slug 28개와 커뮤니티 정적 ID 31개는 각각 중복이 없다.

### URL 해석 주의

- 위 URL은 **현재 렌더러가 생성하는 접근 경로**다. SEO 대표 URL·canonical·리디렉션을 새로 확정한 것이 아니다.
- `article.html?slug=contract-questions`와 `article-contract-questions.html`은 같은 제목을 가진다. 대표 경로는 D-10 전까지 고르지 않는다.
- `guides.html`과 그 앵커도 준비백과 대표 URL로 새로 확정하지 않는다.
- 이번 보고서는 기존 URL을 수정하거나 새 URL을 제안하지 않는다.

## 4. 준비백과 후보 매트릭스

### 4.1 즉시 노출 후보

| 판정 | 수 | 이유 |
| --- | ---: | --- |
| 원문 그대로 홈 대표 노출 가능 | **0** | 28개 전부 반복 템플릿이며 MKT-002의 `유지` 판정이 0개 |
| 편집 후 재심사 후보 | 17 | 고유 검색 의도는 있으나 근거·사례·도구·중복 보강 필요 |
| 통합 후 재심사 후보 | 10 | 다른 글·정적 페이지와 검색 의도 또는 산출물이 겹침 |
| 보류 | 1 | 제품·운영 결정과 독자 대상이 맞지 않음 |

재현 근거는 `ops/reports/MKT-002-content-quality-audit.md:21`, `:36`, `:86`이다. 28개 모두 6개 섹션·25개 본문 문단·작성일 `2026.07.07`·읽는 시간 `12분`이며, 글별 반복 문장 비율은 59.7~68.7%다.

### 4.2 편집 완료 후 홈 우선 재심사 후보

아래 항목은 **현재 홈에 사용할 승인 목록이 아니다**. MKT-005에서 반복 템플릿과 제목-본문 불일치를 해소한 뒤, C안 5번에 실제 제목·유형·현재 경로를 유지해 재심사하기 좋은 순서다.

| 우선 | 현재 제목 | 유형 | 현재 상세 URL | 근거 위치 | 현재 제외 사유 |
| ---: | --- | --- | --- | --- | --- |
| 1 | 주차 좋은 돌잔치 장소 답사 체크리스트 | 현장 답사 | `article.html?slug=parking-site-visit` | `blog-data.js:430-435`; MKT-002 `:237` | 전 글 공통 템플릿. `guides.html#parking`과 중복되고 실제 답사 기록 양식이 없음 |
| 2 | 초대장 문구와 참석 여부 받는 방법 | 초대장 | `article.html?slug=invitation-rsvp` | `blog-data.js:855-860`; MKT-002 `:241` | 전 글 공통 템플릿. 제목이 약속한 실제 문구 예시가 없음 |
| 3 | 행사 당일 가족 역할 분담표 만들기 | 당일 운영 | `article.html?slug=event-day-role-sharing` | `blog-data.js:2776-2781`; MKT-002 `:259` | 전 글 공통 템플릿. 제목이 약속한 역할표가 없고 본문은 돌잔치 중심 |
| 4 | 환갑·칠순 가족행사와 돌잔치 준비의 공통점 | 부모님 행사·기획 | `article.html?slug=parents-60-70-party` | `blog-data.js:1496-1501`; MKT-002 `:247` | 전 글 공통 템플릿. 팔순이 없고 돌잔치 비교가 부모님 행사 고유 의도를 약화 |
| 5 | 돌스냅 작가 고를 때 포트폴리오에서 봐야 할 것 | 스냅·업체 선택 | `article.html?slug=snap-portfolio` | `blog-data.js:536-541`; MKT-002 `:238` | 전 글 공통 템플릿. `guides.html#snap`과 중복되고 평가 예시가 없음 |

선정 이유는 가격·환불·법률 해석을 홈 제목으로 앞세우지 않으면서 C안의 `준비 순서`, `놓치기 쉬운 항목`, `업체에 확인할 질문`에 대응할 수 있기 때문이다. 그러나 현재 원문을 대표 카드로 노출하는 것은 금지한다.

### 4.3 우선 제외해야 할 준비백과 항목

| 제목 | 유형 | 현재 URL | 제외 사유 |
| --- | --- | --- | --- |
| 돌잔치 장소 계약 전 꼭 물어볼 12가지 | 장소 계약 | `article.html?slug=contract-questions` | 질문 배열은 4개인데 제목은 12가지. `article-contract-questions.html`과 제목·의도 중복, 대표 URL 미정 |
| 돌잔치 총예산 계산법: 식대부터 숨은 비용까지 | 예산 | `article.html?slug=budget-hidden-costs` | 계산 표·공식이 없고 200만 원·10% 표현의 근거가 없음 |
| 보증 인원 적게 잡는 법과 손해 보는 계약 피하기 | 장소 계약 | `article.html?slug=minimum-guarantee` | 계약 글들과 의도 중복, `수십만 원` 표현의 근거가 없음 |
| 답례품 수량 계산과 주문 시점 | 답례품 | `article.html?slug=return-gift-count` | 5~10%, D-40 수치의 근거가 없음 |
| 성장영상 준비 일정과 사진 고르는 법 | 성장영상 | `article.html?slug=growth-video` | D-30 일정과 저작권 확인 표현의 근거가 없음 |
| 업체 정보가 맞는지 검증하는 5단계 | 업체 검수 | `article.html?slug=vendor-verification` | 제목이 약속한 5단계가 없고 미결정 `api_collected`·공개 DB·권한 기능을 전제로 함 |
| 계약금 환불과 날짜 변경 기준 확인법 | 계약 | `article.html?slug=refund-date-change` | 계약·환불 관행을 일반화하고 공식 근거가 없으며 계약 질문 글과 중복 |
| 돌잔치 장소 계약 전 꼭 물어볼 12가지 | 정적 계약 가이드 | `article-contract-questions.html` | 쿼리 글과 중복. 예시 금액·계약 관행의 출처가 없고 D-10 전 대표 경로를 선택할 수 없음 |
| 돌잔치 준비 가이드 | 정적 가이드 허브 | `guides.html` | D-100·D-90·D-60·D-40 일정 근거가 없고 준비백과 글들과 중복, 대표 역할 미정 |

그 밖의 19개 `blog-data.js` 글도 반복 템플릿 때문에 즉시 노출하지 않는다. 전체 28개 글별 보강·통합·보류 이유는 MKT-002 9장 전수 인벤토리를 단일 기준으로 재사용하며 이 보고서에서 다른 판정을 만들지 않는다.

## 5. 커뮤니티 후보 매트릭스

### 5.1 데이터 층 판정

| 층 | 확인 수 | 홈 후보 수 | 판정 근거 |
| --- | ---: | ---: | --- |
| 운영 Supabase `status=published` | 저장소에서 확인 불가 | **0 확인 가능** | `community-list.js:47-55`가 온라인 공개 글을 조회하지만, 저장소의 공개 설정으로는 실행할 수 없음 |
| 정적 미리보기 | 31개 | **0** | `community-list.js:57-62`, `:106-109`에서 Supabase 미설정 시만 로드. 고정 작성자·상대 시간·반응 메타데이터 포함 |

MKT-001도 `community-post-data.js`와 `community-extra-data.js`의 제목 31개를 확인했지만, 운영 Supabase의 온라인 글과 공개·검수 상태를 확인하지 않았으므로 이를 운영 콘텐츠 전체로 간주하지 않았다(`ops/reports/MKT-001-seo-content-gap.md:231-235`).

### 5.2 C안 4개 슬롯에 들어갈 수 없는 정적 예시

다음은 기존 C안의 4개 카드 형태와 대조하기 위한 **제외 표본**이다. 제목과 URL은 실제 소스에 존재하지만 게시글·작성자·반응이 실제 사용자 활동이라는 근거가 없어 홈 후보가 아니다.

| 현재 제목 | 유형 | 현재 상세 URL | 근거 위치 | 제외 사유 |
| --- | --- | --- | --- | --- |
| 보증 인원 30명인데 실제 참석은 24명일 것 같아요. 계약해도 괜찮을까요? | 준비 질문 | `community-post.html?id=guarantee-30` | `community-post-data.js:3-8` | 고정 닉네임·`2분전`·댓글/저장 수가 들어 있는 preview 데이터. 실제 계약 사례로 오인 가능 |
| 25명 한정식 룸 기준으로 받은 견적, 이 정도면 평균인가요? | 견적 공유 | `community-post.html?id=quote-25-hanjeongsik` | `community-post-data.js:20-25` | 실제 견적·작성자·평균 모집단을 확인할 근거가 없고 고정 반응 수 포함 |
| 직계가족 18명 소규모로 하니 돌잡이 시간이 훨씬 여유로웠어요 | 행사 후기 | `community-post.html?id=small-family-review` | `community-post-data.js:36-41` | 실제 경험자 후기임을 확인할 근거가 없고 고정 작성자·반응 수 포함 |
| 업체 페이지에는 주차 3시간이라고 되어 있는데 안내 전화로는 2시간이라고 들었어요 | 업체 오류 | `community-post.html?id=parking-error` | `community-post-data.js:84-89` | 특정 업체 정보 오류를 암시하지만 실제 업체·통화·검수 기록이 없음 |

나머지 정적 27개도 같은 이유로 전부 제외한다. 제목 중복은 없지만, 중복이 없다는 사실은 진위·검수·권리의 근거가 아니다.

### 5.3 운영 글이 생겼을 때의 홈 필드 규칙 제안

다음 규칙은 **제안**이며 제품 코드를 변경하지 않았다.

1. `taran_community_posts`에서 `status=published`로 실제 반환된 글만 대상으로 한다.
2. 표시 필드는 `category`, `title`, `community-post.html?id={id}` 세 개로 제한한다.
3. 홈에서는 `author_name`, 작성자 아바타, 댓글 수, 저장 수, 공감 수, 상대 시간을 표시하지 않는다.
4. 실제 공개 글이 4개보다 적으면 있는 수만 표시하고 정적 preview로 채우거나 복제하지 않는다.
5. 실제 공개 글이 0개거나 조회가 실패하면 아래 빈 상태를 표시한다.
6. 운영 Supabase 접근이 제공되면 기존 후보 `SEO-OPS-001`에서 ID·제목·카테고리·`published` 상태만 읽기 전용 재확인한다.

## 6. C안 5번 문구·구성 대체안

### 권고안: 검수 전에는 카드 0개 + 두 개의 상태 패널

| 위치 | 문구 | 행동·URL | 사실/제안 |
| --- | --- | --- | --- |
| 섹션 눈썹말 | `준비백과 · 정보 나눔` | 없음 | 기존 정보 구조 유지 |
| 섹션 제목 | `편집·운영 검수를 마친 정보만 소개합니다` | 없음 | 제안 |
| 섹션 설명 | `준비백과는 내용과 근거를 다듬고 있습니다. 정보 나눔은 운영 확인을 마친 공개 글이 생기면 제목과 주제만 보여드립니다.` | 없음 | 제안 |
| 준비백과 상태 제목 | `대표 글을 다듬고 있어요` | 없음 | 현재 감사 결과에 맞는 사실 기반 문구 |
| 준비백과 상태 설명 | `반복되거나 근거가 부족한 글은 홈의 대표 글로 올리지 않습니다.` | 없음 | 운영 원칙 제안 |
| 준비백과 CTA | `준비백과 전체 보기` | `articles.html` | 기존 URL |
| 정보 나눔 빈 상태 제목 | `아직 홈에 소개할 공개 글이 없습니다` | 없음 | 확인 가능한 운영 후보 0에 대한 문구 |
| 정보 나눔 빈 상태 설명 | `작성과 운영 확인을 마친 글이 생기면 이곳에 표시합니다.` | 없음 | 제안 |
| 정보 나눔 CTA | `정보 나눔 보기` | `community.html` | 기존 URL |

### 편집·운영 데이터가 준비된 뒤의 카드 구성

- 준비백과: MKT-005 완료 후 재심사에서 통과한 글만 `유형 · 제목 · 현재 상세 URL`로 최대 4개 노출
- 정보 나눔: 운영 DB에서 실제 반환된 `published` 글만 `유형 · 제목 · 현재 상세 URL`로 최대 4개 노출
- 둘 중 한쪽이 비면 다른 쪽의 글을 복제해 수를 맞추지 않고 빈 상태를 유지
- `인기`, `추천`, `반응 좋은`, `많이 본`, 작성자, 댓글·저장·공감 수는 별도 집계·검수 기준 승인 전 사용하지 않음

이 대체안은 새 원고를 쓰거나 C안의 정보 작성 기능을 되살리지 않는다. 기존 `articles.html`과 `community.html`만 사용하고 고객 정보 입력은 C안 6번 영역에 남긴다.

## 7. 제외 기준

| 기준 | 적용 결과 |
| --- | --- |
| 반복 템플릿 | 준비백과 28개 전부 즉시 대표 노출 제외 |
| 제목-본문 불일치 | `contract-questions`, `invitation-rsvp`, `event-day-role-sharing` 등 편집 전 제외 |
| 중복 검색 의도·경로 | 계약 질문 두 경로, `guides.html`과 관련 글 묶음 제외 |
| 근거 없는 금액·비율·기간 | 예산, 보증 인원, 답례품, 성장영상, 계약·환불 관련 P0 글 제외 |
| 법률·계약 관행 확정 표현 | 공식 근거와 기준일이 없는 계약·환불 글 제외 |
| 미확정 제품·운영 상태 | `vendor-verification` 제외 |
| 가상 작성자·상대 시간·반응 수 | 정적 커뮤니티 31개 전부 제외 |
| 운영 공개 상태 미확인 | 실제 Supabase 글을 확인하기 전 커뮤니티 후보 0 |
| 대표 URL 미확정 | D-10 전 정적 계약 글·가이드 허브를 대표 경로로 선택하지 않음 |

## 8. 재현 명령과 결과

아래 명령은 PowerShell에서 읽기 전용으로 실행했다. 비밀값은 출력하지 않았다.

### 8.1 준비백과 전수 파싱

```powershell
$raw = Get-Content -LiteralPath 'blog-data.js' -Raw -Encoding utf8
$json = $raw -replace '^\s*window\.taran_BLOG_POSTS\s*=\s*','' -replace ';\s*$',''
$posts = $json | ConvertFrom-Json
[pscustomobject]@{
  Count = $posts.Count
  UniqueSlugs = @($posts.slug | Sort-Object -Unique).Count
  SectionCounts = @($posts | ForEach-Object { @($_.sections).Count } | Sort-Object -Unique) -join ','
  Dates = @($posts.date | Sort-Object -Unique) -join ','
  ReadTimes = @($posts.readTime | Sort-Object -Unique) -join ','
}
```

결과: `Count=28`, `UniqueSlugs=28`, `SectionCounts=6`, `Dates=2026.07.07`, `ReadTimes=12분`.

### 8.2 커뮤니티 정적 데이터 전수 집계

```powershell
$files = @('community-post-data.js','community-extra-data.js')
$ids = @(); $titles = @(); $authors = 0; $times = 0; $metas = 0
foreach ($file in $files) {
  $source = Get-Content -LiteralPath $file -Raw -Encoding utf8
  $ids += [regex]::Matches($source,'(?m)^\s+id:\s*"([^"]+)"') | ForEach-Object { $_.Groups[1].Value }
  $titles += [regex]::Matches($source,'(?m)^\s+title:\s*"([^"]+)"') | ForEach-Object { $_.Groups[1].Value }
  $authors += [regex]::Matches($source,'(?m)^\s+author:').Count
  $times += [regex]::Matches($source,'(?m)^\s+time:').Count
  $metas += [regex]::Matches($source,'(?m)^\s+meta:').Count
}
[pscustomobject]@{
  Count = $ids.Count
  UniqueIds = @($ids | Sort-Object -Unique).Count
  UniqueTitles = @($titles | Sort-Object -Unique).Count
  AuthorFields = $authors
  TimeFields = $times
  MetaFields = $metas
}
```

결과: `Count=31`, `UniqueIds=31`, `UniqueTitles=31`, `AuthorFields=31`, `TimeFields=31`, `MetaFields=31`.

### 8.3 경로·분기 확인

```powershell
rg -n -F 'article.html?slug=' blog.js
rg -n -F 'community-post.html?id=' community-list.js community-post.js
rg -n -F 'function loadOnline' community-list.js
rg -n -F 'function loadPreview' community-list.js
rg -n -F 'isSupabaseConfigured' community-list.js
Test-Path -LiteralPath 'article.html'
Test-Path -LiteralPath 'community-post.html'
```

결과: 준비백과 URL 생성은 `blog.js:31`, 커뮤니티 URL 생성은 `community-list.js:26`과 `community-post.js:51`; 상세 대상 파일 두 개 모두 존재. 온라인/preview 분기는 `community-list.js:47`, `:57`, `:107`에서 확인했다.

### 8.4 현재 소스·배포 산출물 동일성 확인

```powershell
$files = @('blog-data.js','community-post-data.js','community-extra-data.js')
foreach ($file in $files) {
  $distFile = Join-Path 'dist' $file
  [pscustomobject]@{
    File = $file
    DistExists = Test-Path -LiteralPath $distFile
    SameHash = (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash -eq
      (Get-FileHash -LiteralPath $distFile -Algorithm SHA256).Hash
  }
}

foreach ($file in @('content-config.js','dist/content-config.js')) {
  $source = Get-Content -LiteralPath $file -Raw -Encoding utf8
  [pscustomobject]@{
    File = $file
    SupabaseUrlEmpty = $source -match '"?supabaseUrl"?\s*:\s*""'
    SupabaseAnonKeyEmpty = $source -match '"?supabaseAnonKey"?\s*:\s*""'
  }
}
```

결과: 세 데이터 파일 모두 `dist`에 존재하며 소스와 SHA-256 해시가 같다. 현재 로컬 `content-config.js`와 `dist/content-config.js`의 Supabase URL·anon key는 모두 빈 값이다. 이 결과만으로 Netlify 배포 환경의 주입 상태나 운영 DB 내용을 단정하지 않는다.

### 8.5 검사 제약

- 현재 PowerShell 환경에서 `git` 실행 파일을 찾지 못해 `git status`·`git diff` 검사는 실행하지 못했다.
- 제품 코드·콘텐츠·데이터를 실행하거나 수정하지 않았다.
- 브라우저·운영 Supabase·외부 게시·광고·업체 연락은 수행하지 않았다.

## 9. 사실·제안·승인 분리

### 확정 사실

- 준비백과 28개와 정적 커뮤니티 31개가 현재 소스와 `dist`에 존재한다.
- 현재 렌더링 경로는 각각 `article.html?slug=...`, `community-post.html?id=...`다.
- 준비백과 28개 모두 반복 템플릿이며 MKT-002의 원문 유지 판정은 0개다.
- 정적 커뮤니티 데이터는 Supabase 미설정 때 `loadPreview()`로 사용되고 31개 모두 작성자·상대 시간·반응 메타데이터를 포함한다.
- 저장소에서 실제 운영 Supabase의 `published` 커뮤니티 행을 확인하지 못했다.

### 제안

- MKT-005 완료 전 C안 5번은 개별 준비백과 카드를 표시하지 않는다.
- 운영 DB의 실제 `published` 글을 확인하기 전 커뮤니티 4개 카드는 빈 상태로 둔다.
- 실제 글이 준비되어도 홈에는 유형·제목·URL만 표시하고 작성자·반응 수·상대 시간을 생략한다.
- 운영 접근이 제공되면 기존 `SEO-OPS-001`로 온라인 콘텐츠 인벤토리를 수행한다.

### 승인 필요

- 이 읽기 전용 보고서 작성에는 사용자 승인이 필요하지 않다.
- 제안한 빈 상태는 MKT-007 전달문이 요구한 안전 대체안이며 새 가격·수수료·법률·광고·제휴 결정을 포함하지 않는다.
- 대표 URL·canonical·리디렉션은 기존 D-10 승인 대상이며 이번 작업에서 결정하지 않았다.
- 실제 FE-006 구현·병합·배포는 PM 통합 검수와 기존 D-15~D-17 게이트를 따른다.

## 10. 공개·운영 영향과 신규 위험

### 공개·운영 영향

- 이번 작업의 직접 공개 영향은 없다. 보고서 외 파일을 변경하지 않았다.
- 빈 상태를 적용하면 가상 작성자·상대 시간·댓글·저장·공감 수가 홈의 실제 활동처럼 보이는 오인을 막는다.
- 준비백과 대표 카드를 보류하면 반복 템플릿·근거 없는 계약/가격 표현을 손품해방의 대표 정보로 보증하는 인상을 피한다.
- 카드 수는 당분간 줄지만, C안의 준비백과·정보 나눔 진입 URL은 유지한다.

### 신규 위험 후보 `R-MKT007-01`

**운영 모드에서 Supabase 설정이 비어 있으면 정적 preview 커뮤니티가 실제 게시글처럼 노출될 수 있다.**

- 근거: `content-config.js:2-5`는 `appEnv: production`이지만 공개 설정이 비어 있다. `community-list.js:106-109`는 production 여부가 아니라 Supabase 설정 여부만 보고 `loadPreview()`를 선택한다.
- 오인 요소: 31개 항목의 고정 닉네임, 계속 최근처럼 보이는 상대 시간, 댓글·저장·공감 수, 실제 견적·후기·업체 오류처럼 읽히는 제목.
- 영향: 초기 커뮤니티 활동량과 실제 경험·견적·신고가 존재하는 것처럼 오인될 수 있다.
- 추천 담당: `quality-security`가 재현 테스트를 만들고 `frontend-design`이 production 빈 상태 게이트를 최소 수정 카드로 구현.

기존 위험 R-16(준비백과 반복·중복), R-17(대표 URL·색인), R-23(근거 없는 수치·계약 관행)과 중복되는 내용은 새 위험으로 다시 만들지 않는다.

## 11. 변경 요청·후속 후보

### CHANGE_REQUEST `CR-MKT007-01`

- 요청: production에서 Supabase가 미설정이면 `community-post-data.js`·`community-extra-data.js`를 공개 목록·상세의 실제 게시글 fallback으로 사용하지 말고 빈 상태를 표시한다. preview가 필요하면 명시적 개발/미리보기 환경과 `예시` 라벨로 분리한다.
- 예상 소유: `community-list.js`, `community-post.js`, 필요 시 `community.html`의 초기 정적 행과 검증 테스트.
- 이번 작업의 처리: 제품 코드 수정 금지 때문에 요청만 기록하고 구현하지 않음.
- 승인: 가상 활동 오인을 제거하는 오류 수정 제안이며 가격·서비스 범위·외부 게시 승인은 필요하지 않으나, PM이 별도 FE/QA 카드와 파일 소유권을 지정해야 함.

### 기존 후보 재사용

| 기존 후보 | MKT-007 연결 |
| --- | --- |
| `MKT-005` | 28개 공통 템플릿 제거·글별 편집 후 준비백과 홈 후보 재심사 |
| `MKT-006` | 계약 콘텐츠 통합. 대표 URL은 D-10과 분리 |
| `SEO-OPS-001` | 승인된 스테이징/운영 접근 후 실제 `published` 글 읽기 전용 인벤토리 |
| `MKT-004` / D-10 | 대표 URL·색인·canonical 설계. 이번 현재 경로 매핑과 분리 |

새 후보를 중복 생성하지 않고 위 기존 후보를 다음 단계로 사용한다.

## 12. 완료 조건과 병합 권고

| 완료 조건 | 결과 | 근거 |
| --- | --- | --- |
| 준비백과 후보 매트릭스 | 충족 | 즉시 후보 0, 편집 후 우선 재심사 5개, 우선 제외 9개와 전체 MKT-002 판정 연결 |
| 커뮤니티 후보 매트릭스 | 충족 | 운영 확인 후보 0, 정적 preview 31개 전부 제외, C안 4개 표본 URL 기록 |
| 실제 현재 URL | 충족 | 목록 2개, 상세 URL 생성 규칙과 후보별 URL 기록 |
| 근거 파일·라인 | 충족 | 데이터·렌더러·기존 감사의 파일·라인 기록 |
| 중복·품질 제외 기준 | 충족 | 반복·제목 불일치·중복·수치·법률·미확정 기능·가상 활동 기준 기록 |
| C안 문구 대체안 | 충족 | 카드 0개 상태 패널과 준비백과·정보 나눔 문구·CTA 기록 |
| 재현 가능성 | 충족 | PowerShell 파싱·경로·분기·해시 명령과 결과 기록 |
| 범위 준수 | 충족 | 지정 보고서 1개만 추가, 외부 게시·제품·데이터·URL 변경 없음 |

### PM 권고

1. 이 보고서는 범위와 완료 조건을 충족하므로 PM 검수 후 병합을 권고한다.
2. FE-006 구현에서는 C안 5번을 **빈 상태 기본값**으로 만들고, 현재 정적 preview 제목·작성자·반응 수를 복사하지 않는다.
3. 준비백과 대표 카드는 MKT-005 편집·재심사 통과 후, 커뮤니티 카드는 실제 운영 `published` 행의 읽기 전용 확인 후 연결한다.
4. `CR-MKT007-01`을 QA/FE의 별도 최소 수정 카드로 만들기 전에는 이 보고서가 제품 코드 변경을 승인한 것으로 해석하지 않는다.

## 13. 총괄 PM 완료 보고

```text
작업 ID: MKT-007
결과: PASS 권고(읽기 전용 매핑 완료). C안 5번의 현재 운영 콘텐츠 준비 상태는 BLOCKED.
수정 파일: 없음
추가 파일: ops/reports/MKT-007-home-content-mapping.md
삭제 파일: 없음
실행 검사: PowerShell로 준비백과 28개 파싱, 커뮤니티 정적 31개 ID·제목·작성자·시간·메타 필드 집계, 렌더링 URL·온라인/preview 분기·상세 파일 존재·dist 해시 대조, MKT-002 교차 확인
검사 결과: 준비백과 즉시 후보 0; 편집 후 재심사 후보만 기록. 운영 확인 커뮤니티 후보 0; 정적 preview 31개 전부 제외. 현재 URL은 article.html?slug={slug}, community-post.html?id={id}.
완료 조건: 충족
사실·제안·승인 분리: 사실은 원천/렌더러/기존 감사에 한정. 빈 상태와 필드 규칙은 제안. 보고서 자체 승인 불필요; D-10·D-15~D-17과 구현/배포 승인은 기존 게이트 유지.
공개·운영 영향: 직접 영향 없음. 적용 시 가상 작성자·반응 수와 반복·근거 부족 글의 대표 노출 오인 방지.
신규 위험: R-MKT007-01 — production Supabase 미설정 시 정적 preview 커뮤니티가 실제 활동처럼 노출될 위험.
변경 요청: CR-MKT007-01 — production은 preview fallback 대신 빈 상태. QA/FE 별도 카드와 파일 소유권 필요.
승인 필요: 이번 감사 없음. 대표 URL·canonical은 D-10, 실제 FE-006 구현·병합·배포는 기존 승인 게이트.
병합 권고: PM 검수 후 보고서 병합 권고. FE-006은 빈 상태 기본값으로 진행하고 실제 콘텐츠 연결은 MKT-005·SEO-OPS-001 후 수행.
```
