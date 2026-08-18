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
  venuesCss: "styles/pages/venues.css",
  providerCss: "styles/pages/provider.css",
  headerCss: "styles/components/header.css",
  sitemap: "sitemap.xml"
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

function robots(html) {
  return html.match(/<meta\s+name=["']robots["'][^>]*content=["']([^"']+)["']/i)?.[1] || "";
}

const profiles = loadProfiles();
const placeProfiles = profiles.filter((profile) => profile.serviceCategories.includes("돌잔치 장소·식사"));
const photoProfiles = profiles.filter((profile) => profile.serviceCategories.includes("돌사진·스튜디오"));
const priceProfiles = profiles.filter((profile) => profile.products.length > 0);
const cardRenderer = between(sources.venuesScript, "function createCard", "function syncCategoryTabs");
const customerRenderer = between(sources.providerScript, "function renderCustomerProducts", "function internalReviews");
const customerMarkup = between(sources.providerHtml, '<div id="provider-customer-sections"', '<div id="provider-legacy-sections">');

check("actual five-provider category counts", () => {
  assert.equal(profiles.length, 5, "total tab count must be 5");
  assert.equal(placeProfiles.length, 3, "place/meal tab count must be 3");
  assert.equal(photoProfiles.length, 2, "snap/video tab count must be 2");
  assert.equal(profiles.filter((profile) => profile.serviceCategories.some((value) => /의상|미용/u.test(value))).length, 0, "an apparel/beauty provider must not be invented");
  assert.equal(priceProfiles.length, 2, "only two profiles may expose numeric prices");
});

check("category tabs and filter synchronization", () => {
  for (const expected of [
    /data-category-tab=["']all["'][^>]*>전체\s*<span>5<\/span>/u,
    /data-category-tab=["']돌잔치 장소·식사["'][^>]*>장소·식사\s*<span>3<\/span>/u,
    /data-category-tab=["']돌사진·스튜디오["'][^>]*>스냅·영상\s*<span>2<\/span>/u
  ]) assert.match(sources.venuesHtml, expected);
  assert.doesNotMatch(sources.venuesHtml, /의상·미용/u, "unsupported category tab must not be rendered");
  assert.match(sources.venuesScript, /controls\.service\.value = tab\.dataset\.categoryTab;\s*applyFilters\(\);/u, "tab selection must update the service filter");
  assert.match(sources.venuesScript, /syncCategoryTabs\(\);/u, "filter render must update tab selection");
  for (const key of ["ArrowLeft", "ArrowRight", "Home", "End"]) assert.ok(sources.venuesScript.includes(`"${key}"`), `tab keyboard support missing ${key}`);
  assert.match(sources.venuesHtml, /role=["']tablist["']/u);
  assert.match(sources.venuesHtml, /role=["']tabpanel["']/u);
});

check("text-only cards and unified CTA", () => {
  assert.doesNotMatch(cardRenderer, /createElement\(["']img["']\)|directory-card__visual|fallbackImage|image\.src/u, "customer cards must not render images");
  assert.match(cardRenderer, /detailLink\.textContent = "상세 정보 보기";/u, "all card CTAs must use 상세 정보 보기");
  assert.doesNotMatch(cardRenderer, /상품과 가격 보기|업체 상세 보기/u, "FE-039 conditional CTAs are superseded");
  assert.match(cardRenderer, /성인 1인 \$\{formatWon\(product\.priceMin\)\}부터/u, "numeric card price must state the adult-per-person unit");
  assert.match(cardRenderer, /행사 전체 예상 비용은 업체에 별도 문의/u, "numeric card price must separate the event total");
  assert.match(cardRenderer, /행사 전체 예상 비용은 업체 문의/u, "missing price must remain contact-required");
  assert.doesNotMatch(cardRenderer, /claim\.html|정보 수정 제안|소유권|target\s*=\s*["']_blank["']/u, "list cards must not expose operator or external CTAs");
});

check("responsive grid and accessible controls", () => {
  assert.match(sources.venuesCss, /\.directory--customer-ready \.directory-results\s*\{[^}]*grid-template-columns:\s*repeat\(3,/su, "desktop list must be three columns");
  assert.match(sources.venuesCss, /@media \(max-width: 64rem\)[\s\S]*?\.directory--customer-ready \.directory-results\s*\{\s*grid-template-columns:\s*repeat\(2,/u, "tablet list must be two columns");
  assert.match(sources.venuesCss, /@media \(max-width: 40rem\)[\s\S]*?\.directory--customer-ready \.directory-results\s*\{\s*grid-template-columns:\s*1fr/u, "mobile list must be one column");
  assert.match(sources.venuesCss, /\.directory--customer-ready \.directory-category-tabs button\s*\{[^}]*min-height:\s*(?:4[4-9]|[5-9]\d)px/su, "tabs must have a 44px target");
  assert.match(sources.venuesCss, /\.directory--customer-ready \.directory-card__detail\s*\{[^}]*min-height:\s*(?:4[4-9]|[5-9]\d)px/su, "card CTA must have a 44px target");
  assert.match(sources.venuesHtml, /for=["']directory-query["']>업체명 또는 지역 검색<\/label>/u);
  assert.match(sources.venuesHtml, /for=["']directory-service["']>업체 분야<\/label>/u);
  assert.match(sources.venuesHtml, /for=["']directory-price-info["']>가격 공개 여부<\/label>/u);
});

check("shared sticky header contract", () => {
  for (const [html, label] of [[sources.venuesHtml, "list"], [sources.providerHtml, "detail"]]) {
    assert.match(html, /<body[^>]*>[\s\S]*?<header class=["']site-header["'][^>]*data-site-header/u, `${label}: header must precede main content`);
    assert.match(html, /styles\/components\/header\.css/u, `${label}: shared header stylesheet required`);
    assert.match(html, /scripts\/components\/header\.js/u, `${label}: shared header script required`);
  }
  assert.match(sources.headerCss, /\.site-header\s*\{[^}]*position:\s*sticky;[^}]*top:\s*0;/su, "shared header must be sticky at the top");
});

check("detail image-free and duplicate-free customer branch", () => {
  assert.match(sources.providerHtml, /<img id=["']provider-image["'][^>]*hidden/u, "legacy image element must fail closed");
  assert.doesNotMatch(sources.providerHtml, /<img id=["']provider-image["'][^>]*src=/u, "customer HTML must not preload an image");
  assert.match(customerRenderer, /image\.removeAttribute\(["']src["']\);\s*image\.hidden = true;/u, "customer renderer must remove any image source");
  assert.match(customerRenderer, /provider-image-empty["']\)\.hidden = false/u, "neutral no-photo state must be visible");
  assert.doesNotMatch(customerMarkup, /id=["']provider-info["']|id=["']provider-customer-info["']/u, "duplicated customer info section must be removed");
  assert.doesNotMatch(customerRenderer, /provider-customer-info/u, "customer renderer must not repopulate the removed info section");
  assert.match(sources.providerCss, /\.provider-product-list\s*\{[^}]*grid-template-columns:\s*repeat\(3,/su, "desktop products must use three columns");
});

check("adult-per-person price and total-cost warning", () => {
  assert.match(customerMarkup, /아래 금액은 성인 1인 코스 가격입니다/u);
  assert.match(customerMarkup, /행사 전체 예상 비용은 업체에 별도 문의/u);
  for (const profile of priceProfiles) {
    for (const product of profile.products) {
      assert.equal(product.unit, "성인 1인 코스", `${profile.id}/${product.name}: unit must be adult per person`);
      assert.ok(product.conditions.length > 0, `${profile.id}/${product.name}: price conditions required`);
      assert.match(product.checkedAt, /^\d{4}-\d{2}-\d{2}$/, `${profile.id}/${product.name}: checked date required`);
    }
  }
});

check("six visible questions and clipboard feedback", () => {
  const questionFunction = between(sources.providerScript, "function customerQuestions", "function renderCustomerProducts");
  const questionLiterals = [...questionFunction.matchAll(/^\s*"[^"]+"[,]?$/gmu)];
  assert.equal(questionLiterals.length, 12, "two categories must each define six questions");
  assert.doesNotMatch(customerMarkup, /<details|<summary/u, "questions must be visible without expanding a disclosure");
  assert.match(customerMarkup, /<ul id=["']provider-contact-questions["']/u);
  assert.match(sources.providerScript, /questions\.forEach/u);
  const copyFunction = between(sources.providerScript, "async function copyQuestions", '$("#provider-copy-questions")');
  assert.match(copyFunction, /navigator\.clipboard\?\.writeText/u);
  assert.match(copyFunction, /문의 내용이 복사되었습니다/u);
  assert.match(copyFunction, /복사하지 못했습니다/u);
  assert.match(customerMarkup, /id=["']provider-copy-status["'][^>]*role=["']status["'][^>]*aria-live=["']polite["']/u);
  assert.match(sources.providerCss, /\.provider-contact-checklist \.button\s*\{[^}]*min-height:\s*(?:4[4-9]|[5-9]\d)px/su, "copy target must be at least 44px");
});

check("location, official links, and no empty map", () => {
  assert.doesNotMatch(customerMarkup, /provider-map|지도에서 보기|<iframe/u, "customer detail must not expose an undecided map");
  assert.doesNotMatch(customerRenderer, /provider-map|map\.naver|<iframe/u, "customer renderer must not create a map");
  assert.match(customerMarkup, /위치·전화·공식 홈페이지/u);
  assert.match(customerRenderer, /official\.textContent = "공식 홈페이지에서 확인";/u);
  for (const label of ["공식 포트폴리오", "공식 상품 안내", "공식 문의 안내", "공식 홈페이지에서 확인"]) assert.ok(customerRenderer.includes(`"${label}"`), `missing official link label ${label}`);
  assert.match(customerRenderer, /link\.target = "_blank";\s*link\.rel = "noopener noreferrer";/u, "external official links must protect opener");
  assert.match(sources.providerCss, /\.provider-page--customer \.provider-customer-facts\s*\{[^}]*grid-template-columns:\s*1fr/su, "contact facts must use one column without an empty cell");
});

check("banner contrast hooks and customer-safe boundaries", () => {
  assert.match(sources.venuesHtml, /directory-tools__primary[^>]*>예산 계산하기<\/a>/u);
  assert.match(sources.venuesHtml, /directory-tools__secondary[^>]*>체크리스트 보기<\/a>/u);
  assert.match(sources.venuesCss, /\.directory--customer-ready \.directory-tools__primary\s*\{[^}]*color:\s*#fff;[^}]*background:\s*#f4513d;/su);
  assert.match(sources.venuesCss, /\.directory--customer-ready \.directory-tools__secondary\s*\{[^}]*color:\s*#123f32;[^}]*background:\s*#fff;/su);
  assert.match(robots(sources.venuesHtml), /noindex/i);
  assert.match(robots(sources.providerHtml), /noindex/i);
  const renderFunction = between(sources.providerScript, "async function render()", "render().catch");
  assert.match(renderFunction, /if \(isCustomerReady\) \{\s*renderCustomerProfile\(\);\s*return;\s*\}/u, "customer branch must return before legacy API/Auth flow");
  assert.doesNotMatch(customerRenderer, /TaranApi|TaranAuth|loadPublishedReviews|renderReviews|store\.toggle|saved-providers/u);
  for (const id of ["provider-inquiry-link", "provider-compare", "provider-save"]) assert.ok(customerRenderer.includes(`$("#${id}").hidden = true;`), `#${id} must remain hidden`);
  assert.doesNotMatch(`${sources.venuesHtml}\n${sources.venuesScript}\n${customerMarkup}\n${customerRenderer}`, /후보|정보 확인 전|관측|NAVER API|보조 출처/u, "customer screen must not expose internal terms");
  assert.doesNotMatch(sources.sitemap, /provider\.html\?id=NVR-DOL-/i);
});

if (failures.length) {
  console.error(`FAIL QA-053 customer provider layout refinement (${failures.length})`);
  failures.forEach((failure, index) => console.error(`${index + 1}. ${failure}`));
  process.exitCode = 1;
} else {
  console.log("PASS QA-053 customer provider layout refinement");
  console.log("profiles=5 categories=5/3/2 inventedApparel=0 listImages=0 detailImages=0 cardCTA=uniform");
  console.log("priceReady=2 unit=adult-per-person detailDuplicate=0 questions=6+6 map=0 officialLabels=4");
  console.log("grid=3/2/1 stickyHeader=true noindex=2 apiAuthCustomerBranch=0 forbiddenActions=0");
}
