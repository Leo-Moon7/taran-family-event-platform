import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, "..", "..");
const read = (relativePath) => readFile(path.join(repositoryRoot, relativePath), "utf8");

const paths = {
  denylist: "scripts/data/unverified-provider-denylist.js",
  projection: "scripts/data/unverified-provider-candidates.js",
  data: "data.js",
  status: "scripts/core/provider-status.js",
  venuesScript: "scripts/pages/venues.js",
  providerScript: "scripts/pages/provider.js",
  contactScript: "scripts/pages/contact.js",
  claimScript: "claim.js",
  venuesHtml: "venues.html",
  providerHtml: "provider.html",
  contactHtml: "contact.html",
  claimHtml: "claim.html",
  sitemap: "sitemap.xml"
};

const sources = Object.fromEntries(
  await Promise.all(Object.entries(paths).map(async ([key, relativePath]) => [key, await read(relativePath)]))
);
const failures = [];

function check(label, callback) {
  try {
    callback();
  } catch (error) {
    failures.push(`${label}: ${error.message}`);
  }
}

async function checkAsync(label, callback) {
  try {
    await callback();
  } catch (error) {
    failures.push(`${label}: ${error.message}`);
  }
}

function executeProjection({ denylistCode = sources.denylist, projectionCode = sources.projection } = {}) {
  const window = Object.create(null);
  const context = vm.createContext({ URLSearchParams, window });
  if (denylistCode) vm.runInContext(denylistCode, context, { filename: paths.denylist, timeout: 2_000 });
  vm.runInContext(projectionCode, context, { filename: paths.projection, timeout: 2_000 });
  return window;
}

function runBrowserScript(source, window, filename, globals = {}) {
  const context = vm.createContext({ URL, URLSearchParams, window, ...globals });
  vm.runInContext(source, context, { filename, timeout: 2_000 });
  return context;
}

const allowedFields = [
  "address",
  "candidateField",
  "compareEnabled",
  "district",
  "id",
  "inquiryEnabled",
  "name",
  "neighborhood",
  "observedAt",
  "observedTopics",
  "region",
  "reviewEnabled",
  "sourceCategory",
  "sourceType",
  "sourceUrl",
  "status",
  "unverifiedCandidate"
];
const requiredTextFields = [
  "id",
  "name",
  "candidateField",
  "region",
  "address",
  "district",
  "neighborhood",
  "sourceCategory",
  "sourceType",
  "sourceUrl",
  "observedAt",
  "status"
];
const allowedTopics = new Set([
  "답례품",
  "대여",
  "돌사진",
  "돌상",
  "돌스냅",
  "돌잔치",
  "메이크업",
  "백일상",
  "스튜디오",
  "출장",
  "케이크",
  "한복",
  "한정식",
  "호텔"
]);
const forbiddenFieldPattern = /^(?:blog|blogcontent|blogcount|blogresults|coordinates|email|latitude|longitude|photo|photos|phone|price|rating|recommendation|review|reviewcount|reviews|searchrank|telephone|verified)$/i;
const forbiddenValuePatterns = [
  [/(?:^|[^0-9])01[016789][ -]?\d{3,4}[ -]?\d{4}(?:[^0-9]|$)/, "mobile phone"],
  [/(?:^|[^0-9])02[ -]?\d{3,4}[ -]?\d{4}(?:[^0-9]|$)/, "Seoul phone"],
  [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i, "email"],
  [/\b(?:service_role|client[_-]?secret|authorization|bearer)\b/i, "credential marker"],
  [/X-Naver-Client-(?:Id|Secret)/i, "NAVER credential header"],
  [/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/, "JWT-like token"],
  [/blog\.naver\.com|tistory\.com/i, "blog link"],
  [/\b(?:가격|비용|평점|추천|후기)\b/, "forbidden public claim"]
];

function validateCandidate(candidate) {
  assert.deepEqual(Object.keys(candidate).sort(), allowedFields, `${candidate.id || "unknown"}: public schema must equal the exact 17-field allowlist`);
  assert.ok(Object.keys(candidate).every((key) => !forbiddenFieldPattern.test(key)), `${candidate.id || "unknown"}: forbidden public field detected`);
  for (const key of requiredTextFields) {
    assert.equal(typeof candidate[key], "string", `${candidate.id || "unknown"}: ${key} must be a string`);
    assert.ok(candidate[key].trim(), `${candidate.id || "unknown"}: ${key} must not be blank`);
  }
  assert.match(candidate.id, /^NVR-DOL-\d{3}$/, `${candidate.id}: candidate ID format mismatch`);
  assert.equal(candidate.region, "서울", `${candidate.id}: region must be 서울`);
  assert.match(candidate.address, /^서울특별시\s/u, `${candidate.id}: address must be in Seoul`);
  assert.ok(candidate.address.includes(candidate.district), `${candidate.id}: district must occur in the observed address`);
  assert.ok(Array.isArray(candidate.observedTopics) && candidate.observedTopics.length > 0, `${candidate.id}: observed topics must be a non-empty array`);
  for (const topic of candidate.observedTopics) assert.ok(allowedTopics.has(topic), `${candidate.id}: unapproved observed topic ${topic}`);
  assert.equal(candidate.sourceType, "NAVER 지역검색 API 관측", `${candidate.id}: source label mismatch`);
  assert.match(candidate.observedAt, /^\d{4}-\d{2}-\d{2}$/, `${candidate.id}: observation date format mismatch`);
  assert.equal(candidate.status, "정보 확인 전", `${candidate.id}: status label mismatch`);
  assert.equal(candidate.unverifiedCandidate, true, `${candidate.id}: candidate gate must be true`);
  assert.equal(candidate.inquiryEnabled, false, `${candidate.id}: inquiry must be disabled`);
  assert.equal(candidate.reviewEnabled, false, `${candidate.id}: reviews must be disabled`);
  assert.equal(candidate.compareEnabled, false, `${candidate.id}: comparison must be disabled`);

  const sourceUrl = new URL(candidate.sourceUrl);
  assert.equal(sourceUrl.protocol, "https:", `${candidate.id}: source URL must use HTTPS`);
  assert.equal(sourceUrl.hostname, "search.naver.com", `${candidate.id}: source URL host mismatch`);
  assert.equal(sourceUrl.pathname, "/search.naver", `${candidate.id}: source URL path mismatch`);
  assert.equal(sourceUrl.searchParams.get("where"), "place", `${candidate.id}: source URL must be a place search`);
  assert.ok(sourceUrl.searchParams.get("query")?.includes(candidate.name), `${candidate.id}: source query must include name`);
  assert.ok(sourceUrl.searchParams.get("query")?.includes(candidate.address), `${candidate.id}: source query must include address`);

  const serialized = JSON.stringify(candidate);
  for (const [pattern, label] of forbiddenValuePatterns) assert.doesNotMatch(serialized, pattern, `${candidate.id}: must not contain ${label}`);
}

const baselineWindow = executeProjection();
const candidates = baselineWindow.unverifiedProviderCandidates;

check("projection globals and immutability", () => {
  assert.deepEqual(Object.keys(baselineWindow), ["unverifiedProviderDenylist", "unverifiedProviderCandidates"]);
  assert.ok(Object.isFrozen(baselineWindow.unverifiedProviderDenylist), "denylist must be frozen");
  assert.ok(Object.isFrozen(candidates), "candidate array must be frozen");
  assert.equal(baselineWindow.unverifiedProviderDenylist.length, 0, "default denylist must be empty");
  assert.equal(candidates.length, 20, "baseline must expose exactly 20 candidates");
});

check("exact 17-field candidate schema", () => {
  const ids = new Set();
  const pairs = new Set();
  const fields = new Set();
  for (const candidate of candidates) {
    assert.ok(Object.isFrozen(candidate), `${candidate.id}: candidate must be frozen`);
    assert.ok(Object.isFrozen(candidate.observedTopics), `${candidate.id}: observed topics must be frozen`);
    validateCandidate(candidate);
    assert.ok(!ids.has(candidate.id), `${candidate.id}: duplicate ID`);
    ids.add(candidate.id);
    const pair = `${candidate.name.toLocaleLowerCase("ko-KR")}\u0000${candidate.address.toLocaleLowerCase("ko-KR")}`;
    assert.ok(!pairs.has(pair), `${candidate.id}: duplicate name and address`);
    pairs.add(pair);
    fields.add(candidate.candidateField);
  }
  assert.equal(ids.size, 20, "candidate IDs must be unique");
  assert.equal(fields.size, 5, "five approved candidate fields must remain");
});

check("schema mutation negatives", () => {
  const base = JSON.parse(JSON.stringify(candidates[0]));
  const mutations = [
    ["missing district", (item) => { delete item.district; }],
    ["extra price", (item) => { item.price = 1000; }],
    ["string candidate gate", (item) => { item.unverifiedCandidate = "true"; }],
    ["enabled inquiry", (item) => { item.inquiryEnabled = true; }],
    ["unknown topic", (item) => { item.observedTopics = ["추천"]; }],
    ["javascript source", (item) => { item.sourceUrl = "javascript:alert(1)"; }],
    ["non-Seoul region", (item) => { item.region = "경기"; }],
    ["blank source category", (item) => { item.sourceCategory = ""; }]
  ];
  for (const [label, mutate] of mutations) {
    const item = structuredClone(base);
    mutate(item);
    assert.throws(() => validateCandidate(item), undefined, `${label} mutation must be rejected`);
  }
});

check("denylist 20 to 19 to 20 and fail-closed drill", () => {
  const baselineSerialized = JSON.stringify(candidates);
  const hiddenId = candidates[0].id;
  const injected = `(function (global) { Object.defineProperty(global, "unverifiedProviderDenylist", { value: Object.freeze(["${hiddenId}"]), enumerable: true }); })(window);`;
  const hidden = executeProjection({ denylistCode: injected }).unverifiedProviderCandidates;
  assert.equal(hidden.length, 19, "one denied ID must reduce 20 to 19");
  assert.equal(hidden.some(({ id }) => id === hiddenId), false, "denied ID must disappear from list and detail lookup");
  assert.equal(JSON.stringify(executeProjection().unverifiedProviderCandidates), baselineSerialized, "clearing denylist must restore exactly 20 in the same order");
  assert.equal(executeProjection({ denylistCode: "" }).unverifiedProviderCandidates.length, 0, "missing denylist must hide all candidates");
  const unknown = `(function (global) { global.unverifiedProviderDenylist = Object.freeze(["NVR-DOL-999"]); })(window);`;
  assert.equal(executeProjection({ denylistCode: unknown }).unverifiedProviderCandidates.length, 0, "unknown denylist ID must hide all candidates");
  const malformed = `(function (global) { global.unverifiedProviderDenylist = Object.freeze([7]); })(window);`;
  assert.equal(executeProjection({ denylistCode: malformed }).unverifiedProviderCandidates.length, 0, "malformed denylist must hide all candidates");
});

function directoryCandidates(window) {
  runBrowserScript(sources.data, window, paths.data, {
    localStorage: Object.freeze({ getItem: () => null, removeItem: () => {}, setItem: () => {} })
  });
  return window.publicDirectoryData.filter((item) => item?.unverifiedCandidate === true);
}

check("directory projection obeys denylist", () => {
  assert.equal(directoryCandidates(executeProjection()).length, 20, "baseline directory must include 20 candidates");
  const hiddenId = candidates[0].id;
  const injected = `(function (global) { global.unverifiedProviderDenylist = Object.freeze(["${hiddenId}"]); })(window);`;
  const hiddenDirectory = directoryCandidates(executeProjection({ denylistCode: injected }));
  assert.equal(hiddenDirectory.length, 19, "directory must expose 19 after one denial");
  assert.equal(hiddenDirectory.find(({ id }) => id === hiddenId) || null, null, "denied detail lookup must return null");
  assert.equal(directoryCandidates(executeProjection()).length, 20, "directory must restore to 20");
});

check("provider status safety boundary", () => {
  const statusWindow = Object.create(null);
  runBrowserScript(sources.status, statusWindow, paths.status);
  for (const candidate of candidates) {
    const api = statusWindow.TaranProviderStatus;
    assert.equal(api.isProviderPublic(candidate), true, `${candidate.id}: explicit candidate must remain public`);
    assert.equal(api.shouldShowVolatileFacts(candidate), false, `${candidate.id}: volatile facts must be hidden`);
    assert.equal(api.canReceiveInquiry(candidate), false, `${candidate.id}: inquiry must remain disabled`);
    assert.deepEqual(
      { ...api.getProviderFacts(candidate) },
      { minGuests: 0, maxGuests: 0, guarantee: 0, adultMealMin: 0, adultMealMax: 0, rentalFee: 0, parking: 0 },
      `${candidate.id}: price, capacity, and parking facts must all be zero`
    );
  }
});

function staticRobots(html) {
  return html.match(/<meta\s+name=["']robots["'][^>]*content=["']([^"']+)["']/i)?.[1] || "";
}

check("static noindex and JS-off safe defaults", () => {
  for (const [key, label] of [
    ["venuesHtml", "candidate list"],
    ["providerHtml", "candidate detail"],
    ["contactHtml", "correction form"],
    ["claimHtml", "ownership form"]
  ]) {
    assert.match(staticRobots(sources[key]), /(?:^|,)\s*noindex\s*(?:,|$)/i, `${label}: static robots must include noindex`);
  }
  for (const id of ["summary", "pricing", "facilities", "reviews", "policy", "location"]) {
    assert.match(sources.providerHtml, new RegExp(`<section[^>]+id=["']${id}["'][^>]*hidden`, "i"), `#${id} must be hidden before JavaScript`);
  }
  for (const id of ["provider-inquiry-link", "provider-compare", "provider-save", "provider-phone", "provider-official", "provider-claim"]) {
    assert.match(sources.providerHtml, new RegExp(`id=["']${id}["'][^>]*hidden`, "i"), `#${id} must be hidden before JavaScript`);
  }
  assert.doesNotMatch(sources.sitemap, /provider\.html\?id=NVR-DOL-/i, "candidate IDs must not enter sitemap");
});

function assertDataLoadOrder(html, label) {
  const denylistIndex = html.indexOf("scripts/data/unverified-provider-denylist.js");
  const candidateIndex = html.indexOf("scripts/data/unverified-provider-candidates.js");
  const dataIndex = html.indexOf("data.js");
  assert.ok(denylistIndex >= 0, `${label}: denylist script is missing`);
  assert.ok(candidateIndex >= 0, `${label}: candidate projection script is missing`);
  assert.ok(dataIndex >= 0, `${label}: data.js is missing`);
  assert.ok(denylistIndex < candidateIndex, `${label}: denylist must load before candidate projection`);
  assert.ok(candidateIndex < dataIndex, `${label}: candidate projection must load before data.js`);
}

check("denylist precedes projection on list", () => assertDataLoadOrder(sources.venuesHtml, "candidate list"));
check("denylist precedes projection on detail", () => assertDataLoadOrder(sources.providerHtml, "candidate detail"));
check("denylist precedes projection on ownership", () => assertDataLoadOrder(sources.claimHtml, "ownership form"));

const candidateCardSource = sources.venuesScript.slice(
  sources.venuesScript.indexOf("function createUnverifiedCard"),
  sources.venuesScript.indexOf("function createCard")
);

check("candidate list renderer keeps observation labels close", () => {
  for (const required of [
    "정보 확인 전",
    "검색 관측 분류",
    "관측 지역",
    "관측일",
    "검색어에서 관측한 준비 주제 · 정보 확인 전",
    "입점·영업 중·돌잔치 제공·검증 완료를 의미하지 않습니다.",
    "손품해방에서 후보 정보 보기",
    "정보 수정 제안",
    "소유권 신청"
  ]) assert.ok(candidateCardSource.includes(required), `candidate list card must render ${required}`);
  assert.doesNotMatch(candidateCardSource, /sourceUrl|target\s*=|NAVER 검색 결과/i, "candidate list must not create an external source link");
  assert.doesNotMatch(candidateCardSource, /\b(?:price|telephone|rating|review|recommendation|compareEnabled)\b/i, "candidate card renderer must not read forbidden fact fields");
});

check("candidate-only list skips review API", () => {
  const reviewFunction = sources.venuesScript.slice(
    sources.venuesScript.indexOf("async function attachPublishedReviewStats"),
    sources.venuesScript.indexOf("async function init")
  );
  assert.ok(reviewFunction.indexOf("items.filter((item) => !isUnverifiedCandidate(item))") < reviewFunction.indexOf("window.TaranApi.select"), "candidate filtering must precede review API access");
  assert.ok(reviewFunction.indexOf("if (!reviewEligibleItems.length) return items") < reviewFunction.indexOf("window.TaranApi.select"), "candidate-only list must return before review API access");
});

check("candidate detail renderer keeps general sections hidden", () => {
  for (const id of [
    "summary",
    "pricing",
    "facilities",
    "reviews",
    "policy",
    "location",
    "provider-inquiry-link",
    "provider-compare",
    "provider-save",
    "provider-phone",
    "provider-official",
    "provider-actions",
    "provider-claim"
  ]) assert.ok(sources.providerScript.includes(`$("#${id}").hidden = true;`), `candidate detail must hide #${id}`);

  for (const required of [
    "현재 관측 정보",
    "검색 관측 분류",
    "관측 지역",
    "관련 준비 주제",
    "정보 확인 전",
    "아직 확인할 정보",
    "분야별 문의 체크리스트",
    "손품해방 문의 기능은 제공하지 않습니다."
  ]) assert.ok(sources.providerHtml.includes(required) || sources.providerScript.includes(required), `candidate detail must include ${required}`);

  const earlyReturn = sources.providerScript.indexOf("if (isUnverifiedCandidate) {\n      renderUnverifiedCandidate();\n      return;\n    }");
  assert.ok(earlyReturn > -1, "candidate detail must return immediately after dedicated renderer");
  assert.ok(earlyReturn < sources.providerScript.indexOf("await loadPublishedReviews();"), "candidate detail must return before review API loading");
  assert.ok(earlyReturn < sources.providerScript.indexOf("window.TaranAuth?.ready"), "candidate detail must return before Auth readiness wait");
  assert.doesNotMatch(sources.providerHtml, /provider-candidate-source|provider-source-link|보조 출처 확인|NAVER 검색 결과에서 보조 확인/i, "candidate detail must not include a source section or external source link");
  assert.doesNotMatch(sources.providerScript, /provider-candidate-source|provider-source-link|provider-candidate-facts/i, "candidate renderer must not initialize removed source UI");
});

check("five candidate checklists are questions, not claims", () => {
  for (const field of ["장소·음식", "촬영", "돌상·장식", "의상·미용", "답례·케이크"]) {
    assert.ok(sources.providerScript.includes(`"${field}": Object.freeze([`), `${field}: checklist is missing`);
  }
  const checklistSource = sources.providerScript.slice(
    sources.providerScript.indexOf("const candidateChecklists"),
    sources.providerScript.indexOf("function renderList")
  );
  assert.doesNotMatch(checklistSource, /(?:가능합니다|제공합니다|운영 중입니다|확인 완료)/, "checklists must not assert unverified service facts");
});

check("correction and ownership link contracts", () => {
  assert.match(sources.contactHtml, /id=["']contact-provider-id["'][^>]*readonly/i, "correction provider ID must be readonly");
  assert.match(sources.contactHtml, /id=["']contact-provider-name["'][^>]*readonly/i, "correction provider name must be readonly");
  for (const required of ["providerId", "providerName", "sourceType", "observedAt", "sourceUrl", "수정이 필요한 항목", "확인 가능한 공개 출처", "요청 내용"]) {
    assert.ok(sources.contactScript.includes(required), `correction prefill must include ${required}`);
  }
  assert.ok(sources.claimScript.includes("window.publicDirectoryData"), "ownership must resolve the candidate from the public projection");
  assert.ok(sources.claimScript.includes("if (!provider)"), "ownership must fail closed when candidate is hidden or missing");
});

function createFakeElement(id = "") {
  return {
    id,
    hidden: true,
    textContent: "",
    value: "",
    href: "",
    rel: "",
    content: "",
    className: "",
    children: [],
    classList: { add() {}, remove() {}, toggle() {} },
    append(...items) { this.children.push(...items); },
    replaceChildren(...items) { this.children = [...items]; },
    addEventListener() {},
    setAttribute(name, value) { this[name] = String(value); },
    querySelector() { return createFakeElement(); }
  };
}

await checkAsync("candidate detail dynamic API/Auth/general-renderer spy", async () => {
  const candidate = candidates[0];
  const elements = new Map();
  const element = (id) => {
    if (!elements.has(id)) elements.set(id, createFakeElement(id));
    return elements.get(id);
  };
  const robots = createFakeElement("robots");
  const description = createFakeElement("description");
  const hero = createFakeElement("hero");
  const footer = createFakeElement("footer");
  const body = createFakeElement("body");
  const document = {
    body,
    title: "",
    createElement: (tag) => createFakeElement(tag),
    querySelector(selector) {
      if (selector === 'meta[name="robots"]') return robots;
      if (selector === 'meta[name="description"]') return description;
      if (selector === ".provider-hero") return hero;
      if (selector === ".site-footer small") return footer;
      if (selector.startsWith("#")) return element(selector.slice(1));
      return createFakeElement(selector);
    },
    querySelectorAll() { return []; }
  };
  const calls = { api: 0, authReady: 0, authAccount: 0, facts: 0, volatile: 0, inquiry: 0, placeholder: 0, analytics: 0, errors: [] };
  const window = {
    publicDirectoryData: [candidate],
    TaranProviderStatus: {
      isProviderPublic: () => true,
      getProviderAddress: (item) => item.address,
      getProviderIndustry: (item) => item.candidateField,
      getProviderFacts: () => { calls.facts += 1; return {}; },
      shouldShowVolatileFacts: () => { calls.volatile += 1; return false; },
      canReceiveInquiry: () => { calls.inquiry += 1; return false; }
    },
    TaranCompareStore: { has: () => false, toggle: () => ({ ok: true }) },
    SonpumEventTypes: { labels: {} },
    SonpumProviderPlaceholder: { apply: () => { calls.placeholder += 1; } },
    TaranConfig: { isSupabaseConfigured: true, tables: { reviews: "reviews" } },
    TaranApi: {
      select: async () => { calls.api += 1; return []; },
      upsert: async () => { calls.api += 1; }
    },
    TaranStorage: { get: () => "[]", set() {} },
    TaranAnalytics: { track: async () => { calls.analytics += 1; } },
    TaranToast: { show() {} }
  };
  Object.defineProperty(window, "TaranAuth", {
    value: {
      get ready() { calls.authReady += 1; return Promise.resolve({ id: "unexpected" }); },
      getAccount() { calls.authAccount += 1; return { id: "unexpected" }; },
      loginUrl: () => "login.html"
    }
  });
  runBrowserScript(sources.providerScript, window, paths.providerScript, {
    document,
    location: { search: `?id=${candidate.id}`, protocol: "http:", href: `http://local/provider.html?id=${candidate.id}` },
    console: { error: (...args) => calls.errors.push(args.join(" ")), warn() {}, log() {} }
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(calls, { api: 0, authReady: 0, authAccount: 0, facts: 0, volatile: 0, inquiry: 0, placeholder: 0, analytics: 0, errors: [] });
  assert.equal(robots.content, "noindex,nofollow", "candidate runtime robots must stay noindex,nofollow");
  assert.equal(element("provider-status").textContent, "정보 확인 전");
  assert.equal(element("provider-candidate-overview").hidden, false);
});

check("projection source excludes BE-030 forbidden internals", () => {
  assert.doesNotMatch(sources.projection, /\b(?:Telephone|Longitude|Latitude|BlogSearch|BlogSourceLinks|BlogMentionKeywords)\b/, "projection source must not copy forbidden BE-030 field names");
  for (const [pattern, label] of forbiddenValuePatterns) assert.doesNotMatch(JSON.stringify(candidates), pattern, `projection must not contain ${label}`);
});

if (failures.length) {
  console.error(`FAIL QA-051 candidate insight public safety (${failures.length})`);
  failures.forEach((failure, index) => console.error(`${index + 1}. ${failure}`));
  process.exitCode = 1;
} else {
  console.log("PASS QA-051 candidate insight public safety");
  console.log("candidates=20 allowlistFields=17 candidateFields=5 mutationRejects=8 forbiddenFields=0 forbiddenValues=0");
  console.log("denylist=20>19>20 missing=0 unknown=0 malformed=0 deterministic=true");
  console.log("observationLabels=near-value generalRenderer=0 api=0 auth=0 inquiry=0 review=0 compare=0");
  console.log("staticNoindex=4 listExternalLinks=0 correction=contract ownership=contract jsOff=fail-closed");
}
