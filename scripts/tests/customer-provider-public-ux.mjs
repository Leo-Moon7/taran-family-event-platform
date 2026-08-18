import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, "..", "..");
const read = (relativePath) => readFile(path.join(repositoryRoot, relativePath), "utf8");

const paths = {
  profiles: "scripts/data/customer-provider-profiles.js",
  profilesTest: "scripts/tests/customer-provider-profiles.mjs",
  venuesHtml: "venues.html",
  providerHtml: "provider.html",
  venuesScript: "scripts/pages/venues.js",
  providerScript: "scripts/pages/provider.js",
  venuesCss: "styles/pages/venues.css",
  providerCss: "styles/pages/provider.css",
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

function executeProfiles() {
  const window = Object.create(null);
  vm.runInContext(sources.profiles, vm.createContext({ window }), {
    filename: paths.profiles,
    timeout: 2_000
  });
  return window.customerProviderProfiles;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function staticRobots(html) {
  return html.match(/<meta\s+name=["']robots["'][^>]*content=["']([^"']+)["']/i)?.[1] || "";
}

function sourceBetween(source, start, end) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  assert.ok(startIndex >= 0, `missing source marker ${start}`);
  assert.ok(endIndex > startIndex, `missing source marker ${end}`);
  return source.slice(startIndex, endIndex);
}

const profiles = executeProfiles();
const forbiddenCustomerTerms = /후보|정보 확인 전|관측|NAVER API|보조 출처/u;
const validTelHref = /^tel:\+?\d{8,15}$/;

check("customer projection gate", () => {
  assert.equal(profiles.length, 5, "customer list must contain exactly five profiles");
  assert.equal(new Set(profiles.map(({ id }) => id)).size, 5, "customer profile IDs must be unique");
  assert.ok(profiles.every(({ displayGate }) => displayGate === "customer_ready"), "all profiles must pass customer_ready gate");
  assert.equal(profiles.filter(({ products }) => products.length > 0).length, 2, "numeric product prices are allowed for exactly two providers");
  assert.equal(profiles.filter(({ products }) => products.length === 0).length, 3, "three providers must retain price-as-contact state");
});

check("customer fields and missing-value safety", () => {
  for (const profile of profiles) {
    assert.ok(profile.name && profile.introduction, `${profile.id}: customer identity and introduction required`);
    assert.ok(profile.serviceCategories.length > 0 && profile.services.length >= 2, `${profile.id}: verified service information required`);
    assert.ok(profile.location?.district && profile.location?.address, `${profile.id}: verified location required`);
    assert.equal(profile.serviceMode, "visit", `${profile.id}: fixed-location contract`);
    assert.deepEqual(plain(profile.serviceAreas), [], `${profile.id}: travel areas must not be inferred`);
    assert.deepEqual(plain(profile.policies), { cancellation: null, setup: null, travel: null }, `${profile.id}: unverified policies must stay missing`);
    assert.equal(profile.availability.mode, "contact_required", `${profile.id}: availability must require direct confirmation`);
    assert.equal(profile.availability.checkedAt, null, `${profile.id}: no availability date may be invented`);
    assert.deepEqual(plain(profile.capabilities), { inquiry: false, compare: false, save: false, review: false }, `${profile.id}: general actions must remain disabled`);
    assert.equal(profile.image.url, null, `${profile.id}: provider image must not be copied`);
    assert.equal(profile.image.rightsVerified, false, `${profile.id}: image rights must not be implied`);
  }
});

check("telephone and official links", () => {
  for (const profile of profiles) {
    assert.match(profile.contact.telephone.href, validTelHref, `${profile.id}: invalid tel href`);
    assert.ok(profile.contact.officialLinks.length > 0, `${profile.id}: at least one official link required`);
    for (const link of profile.contact.officialLinks) {
      const parsed = new URL(link.url);
      assert.equal(parsed.protocol, "https:", `${profile.id}: official link must use HTTPS`);
      assert.match(link.label, /공식|안내|사진|상품|문의/u, `${profile.id}: official link must use a customer label`);
    }
  }
});

check("price conditions, unit, evidence, and checked date", () => {
  const priceReady = profiles.filter(({ products }) => products.length > 0);
  assert.deepEqual(plain(priceReady.map(({ id }) => id)), ["NVR-DOL-001", "NVR-DOL-004"]);
  for (const profile of priceReady) {
    for (const product of profile.products) {
      assert.ok(Number.isInteger(product.priceMin) && product.priceMin > 0, `${profile.id}/${product.name}: positive minimum required`);
      assert.ok(Number.isInteger(product.priceMax) && product.priceMax >= product.priceMin, `${profile.id}/${product.name}: valid maximum required`);
      assert.equal(product.currency, "KRW", `${profile.id}/${product.name}: KRW required`);
      assert.ok(product.unit, `${profile.id}/${product.name}: unit required`);
      assert.ok(product.conditions.length > 0, `${profile.id}/${product.name}: conditions required`);
      assert.match(product.checkedAt, /^\d{4}-\d{2}-\d{2}$/, `${profile.id}/${product.name}: checked date required`);
      assert.equal(product.evidence.checkedAt, product.checkedAt, `${profile.id}/${product.name}: evidence date mismatch`);
      assert.equal(new URL(product.evidence.sourceUrl).protocol, "https:", `${profile.id}/${product.name}: HTTPS evidence required`);
    }
  }
});

check("customer-facing terminology and count", () => {
  const customerProfileText = profiles.flatMap((profile) => [
    profile.name,
    profile.introduction,
    ...profile.serviceCategories,
    ...profile.services,
    ...profile.businessHours,
    ...profile.contact.officialLinks.map(({ label }) => label),
    ...profile.products.flatMap((product) => [product.name, product.unit, ...product.conditions, ...product.includedItems])
  ]).join("\n");
  const customerListSources = `${sources.venuesHtml}\n${sources.venuesScript}\n${sources.venuesCss}`;
  const customerDetailRenderer = sourceBetween(sources.providerScript, "function renderCustomerProducts", "function internalReviews");
  const customerDetailMarkup = sourceBetween(sources.providerHtml, '<div id="provider-customer-sections"', '<div id="provider-legacy-sections">');
  assert.doesNotMatch(customerProfileText, forbiddenCustomerTerms, "projection customer strings expose internal terminology");
  assert.doesNotMatch(customerListSources, forbiddenCustomerTerms, "list exposes internal terminology");
  assert.doesNotMatch(`${customerDetailRenderer}\n${customerDetailMarkup}`, forbiddenCustomerTerms, "customer detail exposes internal terminology");
  assert.doesNotMatch(`${sources.venuesHtml}\n${sources.venuesScript}`, /20곳/u, "customer list must not show the old 20-provider count");
  assert.match(sources.venuesHtml, /서울 돌잔치 업체 5곳/u, "JS-off heading must show the gated count");
});

check("customer list actions and filters", () => {
  assert.match(sources.venuesHtml, /원하는 돌잔치 업체 찾기/u);
  assert.match(sources.venuesHtml, /업체명 또는 지역 검색/u);
  assert.match(sources.venuesHtml, /필요한 서비스/u);
  assert.match(sources.venuesHtml, /<label[^>]+for=["']directory-district["'][^>]*>지역<\/label>/u);
  assert.match(sources.venuesHtml, />업체 찾기<\/button>/u);
  assert.match(sources.venuesHtml, />초기화<\/button>/u);
  assert.doesNotMatch(sources.venuesHtml, /예약 가능일|출장 가능 지역/u, "unsupported filters must stay hidden");
  assert.doesNotMatch(sources.venuesScript, /claim\.html|정보 수정 제안|소유권 신청/u, "list renderer must not expose operator actions");
  assert.match(sources.venuesScript, /profile\.products\.length \? "상품과 가격 보기" : "업체 상세 보기"/u);
  assert.doesNotMatch(sources.venuesScript, /target\s*=\s*["']_blank["']|officialLinks/u, "card CTA must remain internal");
});

check("noindex and JS-off safe defaults", () => {
  assert.match(staticRobots(sources.venuesHtml), /(?:^|,)\s*noindex\s*(?:,|$)/i, "list must be noindex");
  assert.match(staticRobots(sources.providerHtml), /(?:^|,)\s*noindex\s*(?:,|$)/i, "detail must be noindex");
  assert.match(sources.providerHtml, /id=["']provider-customer-sections["'][^>]*hidden/i, "customer detail must stay hidden before projection render");
  assert.match(sources.providerHtml, /id=["']provider-inquiry-link["'][^>]*hidden/i);
  assert.match(sources.providerHtml, /id=["']provider-compare["'][^>]*hidden/i);
  assert.match(sources.providerHtml, /id=["']provider-save["'][^>]*hidden/i);
  assert.doesNotMatch(sources.sitemap, /provider\.html\?id=NVR-DOL-/i, "customer preview IDs must not enter sitemap before SEO approval");
});

check("customer renderer early return and general-action isolation", () => {
  const renderFunction = sourceBetween(sources.providerScript, "async function render()", "render().catch");
  assert.match(renderFunction, /if \(isCustomerReady\) \{\s*renderCustomerProfile\(\);\s*return;\s*\}/u, "customer profile must return before legacy renderer");
  const customerRenderer = sourceBetween(sources.providerScript, "function renderCustomerProfile", "function internalReviews");
  for (const id of ["provider-inquiry-link", "provider-compare", "provider-save"]) {
    assert.ok(customerRenderer.includes(`$("#${id}").hidden = true;`), `customer renderer must hide #${id}`);
  }
  assert.doesNotMatch(customerRenderer, /TaranApi|TaranAuth|loadPublishedReviews|renderReviews|store\.toggle|saved-providers/u, "customer renderer must not enter API/Auth/review/compare/save paths");
});

check("clipboard success and failure feedback contract", () => {
  const copyFunction = sourceBetween(sources.providerScript, "async function copyQuestions", '$("#provider-copy-questions")');
  assert.match(copyFunction, /navigator\.clipboard\?\.writeText/u, "clipboard API guard required");
  assert.match(copyFunction, /문의 내용이 복사되었습니다/u, "clipboard success feedback required");
  assert.match(copyFunction, /복사하지 못했습니다/u, "clipboard failure feedback required");
  assert.match(sources.providerHtml, /id=["']provider-copy-status["'][^>]*role=["']status["'][^>]*aria-live=["']polite["']/u, "clipboard status must be announced");
});

check("44px interaction and responsive overflow safeguards", () => {
  assert.match(sources.venuesCss, /\.directory--customer-ready \.filter-chip\s*\{[^}]*min-height:\s*44px/su, "filter chip must have at least 44px height");
  assert.match(sources.venuesCss, /\.directory--customer-ready \.directory-card__detail\s*\{[^}]*min-height:\s*(?:4[4-9]|[5-9]\d)px/su, "card CTA must have at least 44px height");
  assert.match(sources.providerCss, /\.provider-contact-checklist__body \.button\s*\{[^}]*min-height:\s*44px/su, "copy CTA must have at least 44px height");
  assert.match(sources.providerCss, /\.provider-official-links \.button\s*\{[^}]*min-height:\s*44px/su, "official channel CTA must have at least 44px height");
  assert.match(sources.providerCss, /overflow-wrap:\s*anywhere/u, "detail must protect long text from horizontal overflow");
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

await checkAsync("customer detail dynamic API/Auth/general-action spy", async () => {
  const profile = profiles[0];
  const elements = new Map();
  const element = (id) => {
    if (!elements.has(id)) elements.set(id, createFakeElement(id));
    return elements.get(id);
  };
  const robots = createFakeElement("robots");
  const description = createFakeElement("description");
  const document = {
    body: createFakeElement("body"),
    title: "",
    createElement: (tag) => createFakeElement(tag),
    querySelector(selector) {
      if (selector === 'meta[name="robots"]') return robots;
      if (selector === 'meta[name="description"]') return description;
      if (selector.startsWith("#")) return element(selector.slice(1));
      return createFakeElement(selector);
    },
    querySelectorAll() { return []; }
  };
  const calls = { api: 0, auth: 0, compare: 0, save: 0, review: 0, errors: [] };
  const window = {
    customerProviderProfiles: profiles,
    publicDirectoryData: [],
    TaranProviderStatus: {},
    TaranCompareStore: { has: () => false, toggle: () => { calls.compare += 1; return { ok: true }; } },
    SonpumEventTypes: { labels: {} },
    SonpumProviderPlaceholder: {},
    TaranConfig: { isSupabaseConfigured: true, tables: { reviews: "reviews" } },
    TaranApi: {
      select: async () => { calls.api += 1; return []; },
      upsert: async () => { calls.api += 1; calls.review += 1; }
    },
    TaranStorage: { get: () => "[]", set: () => { calls.save += 1; } },
    TaranToast: { show() {} }
  };
  Object.defineProperty(window, "TaranAuth", {
    value: {
      get ready() { calls.auth += 1; return Promise.resolve({ id: "unexpected" }); },
      getAccount() { calls.auth += 1; return { id: "unexpected" }; },
      loginUrl: () => "login.html"
    }
  });
  const context = vm.createContext({
    URL,
    URLSearchParams,
    window,
    document,
    location: { search: `?id=${profile.id}`, protocol: "http:", href: `http://local/provider.html?id=${profile.id}` },
    navigator: { clipboard: { writeText: async () => {} } },
    FormData: class {},
    console: { error: (...args) => calls.errors.push(args.join(" ")), warn() {}, log() {} }
  });
  vm.runInContext(sources.providerScript, context, { filename: paths.providerScript, timeout: 2_000 });
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(calls, { api: 0, auth: 0, compare: 0, save: 0, review: 0, errors: [] });
  assert.equal(robots.content, "noindex,nofollow", "runtime robots must remain noindex,nofollow");
  assert.equal(element("provider-customer-sections").hidden, false, "customer sections must render");
  assert.equal(element("provider-legacy-sections").hidden, true, "legacy sections must remain hidden");
  assert.equal(element("provider-inquiry-link").hidden, true, "inquiry must remain hidden");
  assert.equal(element("provider-compare").hidden, true, "comparison must remain hidden");
  assert.equal(element("provider-save").hidden, true, "save must remain hidden");
});

if (failures.length) {
  console.error(`FAIL QA-052 customer provider public UX (${failures.length})`);
  failures.forEach((failure, index) => console.error(`${index + 1}. ${failure}`));
  process.exitCode = 1;
} else {
  console.log("PASS QA-052 customer provider public UX");
  console.log("profiles=5 internalTerms=0 oldCount=0 listOperatorActions=0 priceReady=2 priceContact=3");
  console.log("tel=5 httpsOfficial=5 copiedImages=0 travel=0 availability=contact_required");
  console.log("runtimeApi=0 runtimeAuth=0 inquiry=0 compare=0 save=0 review=0 noindex=2 clipboard=success+failure");
}
