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
  venuesHtml: "venues.html",
  providerHtml: "provider.html",
  venuesScript: "scripts/pages/venues.js",
  providerScript: "scripts/pages/provider.js",
  providerCss: "styles/pages/provider.css",
  headerScript: "scripts/components/header.js",
  headerCss: "styles/components/header.css"
};
const sources = Object.fromEntries(
  await Promise.all(Object.entries(paths).map(async ([key, relativePath]) => [key, await read(relativePath)]))
);
const failures = [];

function check(label, callback) {
  try { callback(); } catch (error) { failures.push(`${label}: ${error.message}`); }
}

function between(source, start, end) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  assert.ok(startIndex >= 0, `missing marker ${start}`);
  assert.ok(endIndex > startIndex, `missing marker ${end}`);
  return source.slice(startIndex, endIndex);
}

function loadProfiles() {
  const window = Object.create(null);
  vm.runInContext(sources.profiles, vm.createContext({ window }), { filename: paths.profiles, timeout: 2_000 });
  return window.customerProviderProfiles;
}

function navigationItems(constantName) {
  const block = sources.headerScript.match(new RegExp(`const ${constantName} = Object\\.freeze\\(\\[([\\s\\S]*?)\\]\\);`))?.[1] || "";
  return [...block.matchAll(/\{\s*href:\s*"([^"]+)",\s*label:\s*"([^"]+)"/g)].map(([, href, label]) => ({ href, label }));
}

const profiles = loadProfiles();
const placeProfiles = profiles.filter((profile) => profile.serviceCategories.includes("돌잔치 장소·식사"));
const photoProfiles = profiles.filter((profile) => profile.serviceCategories.includes("돌사진·스튜디오"));
const priceProfiles = profiles.filter((profile) => profile.products.length > 0);
const inquiryProfiles = profiles.filter((profile) => profile.products.length === 0);
const expectedIds = [
  "NVR-DOL-001",
  "NVR-DOL-003",
  "NVR-DOL-004",
  "NVR-DOL-005",
  "NVR-DOL-007",
  "NVR-DOL-008",
  "NVR-DOL-009",
  "OFF-DOL-001"
];
const nextProviderContracts = new Map([
  ["NVR-DOL-005", {
    name: "서라벌한정식 서초 본점",
    address: "서울특별시 서초구 법원로3길 6-9",
    telephone: "02-599-5288",
    href: "tel:+8225995288",
    host: "seorabol.kr"
  }],
  ["NVR-DOL-007", {
    name: "눈부신일상 강남점",
    address: "서울특별시 서초구 양재천로21길 33 치금빌딩",
    telephone: "02-555-5909",
    href: "tel:+8225555909",
    host: "www.ilsangst.com"
  }],
  ["OFF-DOL-001", {
    name: "오크우드 프리미어 코엑스 센터",
    address: "서울특별시 강남구 테헤란로87길 46",
    telephone: "02-3466-7205",
    href: "tel:+82234667205",
    host: "www.homehmc.com"
  }]
]);
const cardRenderer = between(sources.venuesScript, "function createCard", "function syncCategoryTabs");
const customerRenderer = between(sources.providerScript, "function renderCustomerProfile", "function internalReviews");
const productRenderer = between(sources.providerScript, "function renderCustomerProducts", "function renderCustomerProfile");
const copyFunction = between(sources.providerScript, "async function copyQuestions", '$("#provider-copy-questions")?.addEventListener');
const customerMarkup = between(sources.providerHtml, '<div id="provider-customer-sections"', '<div id="provider-legacy-sections">');

check("eight provider projection and categories", () => {
  assert.equal(profiles.length, 8, "customer-ready profiles must be exactly eight");
  assert.equal(Array.from(profiles, ({ id }) => id).join("|"), expectedIds.join("|"), "the original seven and approved official addition must remain in order");
  assert.equal(placeProfiles.length, 5, "place/meal profiles must be exactly five");
  assert.equal(photoProfiles.length, 3, "snap/video profiles must be exactly three");
  assert.equal(priceProfiles.length, 3, "numeric price profiles must be exactly three");
  assert.equal(inquiryProfiles.length, 5, "contact-required price profiles must be exactly five");
  assert.equal(profiles.filter(({ image }) => image.url).length, 0, "copied or hotlinked images must remain zero");
  assert.equal(profiles.filter(({ serviceAreas }) => serviceAreas.length).length, 0, "travel areas must remain zero");
  assert.equal(profiles.filter(({ capabilities }) => Object.values(capabilities).some(Boolean)).length, 0, "unfinished product capabilities must remain disabled");
});

check("new provider identity, contacts, evidence, and official hosts", () => {
  for (const [id, expected] of nextProviderContracts) {
    const profile = profiles.find((item) => item.id === id);
    assert.ok(profile, `${id}: approved profile missing`);
    assert.equal(profile.name, expected.name, `${id}: official name`);
    assert.equal(profile.location.address, expected.address, `${id}: official address`);
    assert.equal(profile.contact.telephone.display, expected.telephone, `${id}: public phone`);
    assert.equal(profile.contact.telephone.href, expected.href, `${id}: phone link`);
    if (id !== "OFF-DOL-001") assert.equal(profile.products.length, 0, `${id}: unverified branch price must stay hidden`);
    for (const field of ["identity", "location", "services", "contact.telephone", "contact.officialLinks"]) {
      assert.ok(profile.fieldEvidence.some((item) => item.field === field), `${id}: missing evidence for ${field}`);
    }
    assert.ok(profile.contact.officialLinks.length >= 1, `${id}: official detail links required`);
    for (const link of profile.contact.officialLinks) {
      assert.equal(new URL(link.url).hostname, expected.host, `${id}: official link host`);
    }
    for (const evidence of profile.fieldEvidence) {
      assert.equal(evidence.sourceClass, "official_website", `${id}: evidence must be official website`);
      assert.equal(new URL(evidence.sourceUrl).hostname, expected.host, `${id}: evidence host`);
    }
  }
});

check("static and runtime eight-provider directory contract", () => {
  assert.match(sources.venuesHtml, /id="directory-heading-count">서울 돌잔치 업체 8곳</u, "static heading count must be eight");
  assert.match(sources.venuesHtml, /data-category-tab="all">전체 <span>8<\/span>/u, "static total tab count must be eight");
  assert.match(sources.venuesHtml, /data-category-tab="돌잔치 장소·식사">장소·식사 <span>5<\/span>/u, "static place tab count must be five");
  assert.match(sources.venuesHtml, /data-category-tab="돌사진·스튜디오">스냅·영상 <span>3<\/span>/u, "static photo tab count must be three");
  assert.match(sources.venuesHtml, /id="directory-price-info"[\s\S]*?<option value="all">전체<\/option>[\s\S]*?<option value="published">가격 정보 있음<\/option>[\s\S]*?<option value="contact">업체 문의 필요<\/option>/u, "price filter options must match the customer contract");
  assert.match(sources.venuesScript, /const count = value === "all" \? profiles\.length : profiles\.filter/u, "category tab counts must derive from profiles at runtime");
  assert.match(sources.venuesScript, /controls\.summary\.textContent = state\.filtered\.length[\s\S]*?서울 돌잔치 업체 \$\{state\.filtered\.length/u, "result count must derive from filtered profiles");
  assert.match(sources.venuesScript, /controls\.priceInfo\.value === "published" && profile\.products\.length > 0/u, "published-price filter contract missing");
  assert.match(sources.venuesScript, /controls\.priceInfo\.value === "contact" && profile\.products\.length === 0/u, "contact-required filter contract missing");
});

check("natural evidence-bounded introductions", () => {
  assert.equal(profiles.filter((profile) => /안내하는/u.test(profile.introduction)).length, 0, "repetitive 안내하는 wording must be removed");
  assert.equal(profiles.filter((profile) => /가능|제공/u.test(profile.introduction)).length, 0, "unverified capability wording must not be introduced");
  assert.equal(profiles.filter((profile) => /\d/u.test(profile.introduction)).length, 0, "introductions must not invent numeric claims");
});

check("short list tags and price wording", () => {
  assert.match(cardRenderer, /profile\.services\.slice\(0, 3\)/u, "list cards must limit service tags to three");
  for (const [source, shortLabel] of [
    ["돌잔치 가족 모임", "돌잔치"],
    ["아이 첫 생일 행사", "돌잔치"],
    ["돌잔치 가족연회", "돌잔치"],
    ["행사 스타일링과 메뉴", "행사 스타일링"],
    ["한옥 돌잔치", "한옥 돌잔치"],
    ["헤어·메이크업 연계", "헤어·메이크업 연계"]
  ]) assert.ok(sources.venuesScript.includes(`"${source}": "${shortLabel}"`), `missing short list label for ${source}`);
  assert.match(cardRenderer, /성인 1인 코스 \$\{formatWon\(product\.priceMin\)\}부터/u, "numeric card price must identify the adult-per-person unit");
  assert.match(cardRenderer, /돌잔치 패키지 \$\{formatWon\(product\.priceMin\)\}부터/u, "package card price must identify the package total");
  assert.match(cardRenderer, /돌잔치 전체 비용 별도 문의/u, "numeric card must separate total event cost");
  assert.match(cardRenderer, /돌잔치 비용 및 상품 구성은 업체 문의/u, "non-price card must show contact-required wording");
  assert.match(cardRenderer, /detailLink\.textContent = "상세 정보 보기";/u, "all cards must use the shared detail CTA");
});

check("dynamic detail title and anchored sections", () => {
  assert.match(customerRenderer, /document\.title = `\$\{customerProfile\.name\} \| 손품해방`;/u, "detail title must use the actual provider name");
  for (const id of ["provider-products", "provider-before-use", "provider-contact"]) {
    assert.ok(customerRenderer.includes(`"#${id}"`), `anchor link missing #${id}`);
    assert.ok(customerMarkup.includes(`id="${id}"`), `anchor target missing #${id}`);
  }
  assert.match(sources.providerCss, /#provider-products,[\s\S]*?#provider-before-use,[\s\S]*?#provider-contact\s*\{\s*scroll-margin-top:\s*150px;/u, "all three targets must reserve the approved 150px anchor offset");
});

check("reference menu price and contact layout", () => {
  assert.match(productRenderer, /"참고 메뉴 가격"/u, "menu-price details must label prices as reference menu prices");
  assert.match(productRenderer, /"돌잔치 패키지 가격"/u, "package-price details must use a package title");
  assert.match(productRenderer, /아래 금액은 성인 1인 코스 가격입니다/u, "price unit warning missing");
  assert.match(productRenderer, /아래 금액은 공식 돌잔치 패키지 총액입니다/u, "package total warning missing");
  assert.match(productRenderer, /돌잔치 행사 구성, 룸 이용 조건 및 추가 비용은 업체에 별도로 문의/u, "event-total distinction missing");
  assert.match(productRenderer, /title\.textContent = "가격 안내";/u, "contact-required details need a price guidance title");
  assert.match(customerRenderer, /addFact\(contactFacts, "주소"/u);
  assert.match(customerRenderer, /addFact\(contactFacts, "전화"/u);
  assert.match(customerRenderer, /addFact\(contactFacts, "정보 업데이트"/u);
  assert.match(sources.providerCss, /\.provider-page--customer \.provider-customer-facts\s*\{[^}]*grid-template-columns:\s*repeat\(3,/su, "desktop contact facts must be three columns");
  assert.match(sources.providerCss, /@media \(max-width: 40rem\)[\s\S]*?\.provider-page--customer \.provider-hero__facts,[\s\S]*?\.provider-page--customer \.provider-customer-facts\s*\{\s*grid-template-columns:\s*1fr;/u, "mobile contact facts must collapse to one column");
});

check("clipboard feedback and accessibility", () => {
  assert.match(copyFunction, /await navigator\.clipboard\.writeText\(message\);/u, "clipboard write must complete before success feedback");
  assert.match(copyFunction, /button\.textContent = "복사되었습니다";/u, "copy button needs immediate success text");
  assert.match(copyFunction, /window\.setTimeout\(\(\) => \{\s*button\.textContent = "문의 내용 복사하기";\s*\}, 2000\);/u, "copy button must restore after 2 seconds");
  assert.match(copyFunction, /복사하지 못했습니다/u, "clipboard failure feedback missing");
  assert.match(customerMarkup, /id="provider-copy-status"[^>]*role="status"[^>]*aria-live="polite"/u, "copy status must be announced as a polite live region");
});

check("footer spacing and public navigation", () => {
  assert.match(sources.providerCss, /\.provider-page--customer \.site-footer\s*\{[^}]*margin-top:\s*clamp\(3rem, 7vw, 5rem\);/su, "detail footer needs an explicit content gap");
  assert.match(sources.providerCss, /\.provider-page--customer \.site-footer nav\s*\{[^}]*gap:\s*var\(--space-4\);/su, "footer policy links need a visible gap");
  assert.equal(navigationItems("PUBLIC_NAV_ITEMS").length, 5, "desktop public navigation must expose five items");
  assert.equal(navigationItems("MOBILE_NAV_ITEMS").length, 4, "mobile public navigation must expose four items");
  assert.doesNotMatch(sources.headerScript, /login\.html|account\.html|data-auth-link|mobileAuthLink/u, "public header script must not render account entry");
  assert.match(sources.headerCss, /\.site-header \[data-auth-link\],[\s\S]*?\{\s*display:\s*none !important;/u, "stale static account entry must fail closed");
  assert.match(sources.headerCss, /\.site-header \.site-nav a\[href="compare\.html"\][^{]*\{\s*display:\s*none !important;/u, "stale static compare entry must fail closed");
});

check("customer-safe boundaries", () => {
  assert.match(sources.venuesHtml, /content="noindex,nofollow"/u);
  assert.match(sources.providerHtml, /content="noindex,nofollow"/u);
  assert.doesNotMatch(`${sources.venuesHtml}\n${cardRenderer}\n${customerMarkup}\n${customerRenderer}`, /후보|정보 확인 전|관측|NAVER API|보조 출처/u, "customer UI must not expose internal collection terms");
  assert.doesNotMatch(customerMarkup, /provider-map|지도에서 보기|<iframe/u, "customer detail must not show an empty or undecided map");
  for (const profile of profiles) {
    assert.match(profile.contact.telephone.href, /^tel:\+?[0-9-]+$/u, `${profile.id}: invalid telephone href`);
    assert.ok(profile.contact.officialLinks.length > 0, `${profile.id}: official link required`);
    for (const link of profile.contact.officialLinks) assert.match(link.url, /^https:\/\//u, `${profile.id}: official link must use HTTPS`);
  }
});

if (failures.length) {
  console.error(`FAIL QA-059 official provider expansion/copy/anchor (${failures.length})`);
  failures.forEach((failure, index) => console.error(`${index + 1}. ${failure}`));
  process.exitCode = 1;
} else {
  console.log("PASS QA-059 official provider expansion/copy/anchor");
  console.log("profiles=8 categories=8/5/3 price=3 inquiry=5 images=0 travel=0 capabilities=0");
  console.log("contacts=3/1 clipboard=immediate+2s footerGap=true desktopNav=5 mobileNav=4 publicLogin=0");
}
