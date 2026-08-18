import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, "..", "..");
const projectionPath = path.join(repositoryRoot, "scripts", "data", "customer-provider-profiles.js");
const source = fs.readFileSync(projectionPath, "utf8");

function loadProfiles() {
  const window = {};
  vm.runInNewContext(source, { window }, { filename: projectionPath });
  return window.customerProviderProfiles;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertDeepFrozen(value, trail = "root") {
  if (!value || typeof value !== "object") return;
  assert.equal(Object.isFrozen(value), true, `${trail} must be frozen`);
  Object.entries(value).forEach(([key, child]) => assertDeepFrozen(child, `${trail}.${key}`));
}

function isFrozenMutationError(error) {
  return error?.name === "TypeError" && /read only|not extensible|cannot add property/i.test(error.message);
}

const profiles = loadProfiles();
const expected = new Map([
  ["NVR-DOL-001", ["롯데호텔서울 도림", "서울특별시 중구 을지로 30 메인타워 37F"]],
  ["NVR-DOL-003", ["메리어트 파크카페", "서울특별시 영등포구 여의대로 8 3층"]],
  ["NVR-DOL-004", ["비스타 워커힐 서울 명월관", "서울특별시 광진구 워커힐로 177 워커힐 호텔앤리조트"]],
  ["NVR-DOL-005", ["서라벌한정식 서초 본점", "서울특별시 서초구 법원로3길 6-9"]],
  ["NVR-DOL-007", ["눈부신일상 강남점", "서울특별시 서초구 양재천로21길 33 치금빌딩"]],
  ["NVR-DOL-008", ["다온재 한옥스튜디오 돌사진 삼청동집", "서울특별시 종로구 북촌로11다길 23"]],
  ["NVR-DOL-009", ["돌사진 한옥스튜디오 이다한옥 북촌점", "서울특별시 종로구 북촌로15길 56"]]
]);
const expectedIntroductions = new Map([
  ["NVR-DOL-001", "도심 전망의 프라이빗 룸과 중식 코스가 있는 돌잔치·가족 모임 레스토랑입니다."],
  ["NVR-DOL-003", "여의도공원이 보이는 프라이빗 다이닝룸에서 아이 첫 생일 행사를 준비하는 레스토랑입니다."],
  ["NVR-DOL-004", "한옥 분위기의 프라이빗 룸과 한우 숯불구이를 중심으로 한 돌잔치·가족연회 레스토랑입니다."],
  ["NVR-DOL-005", "단독 룸과 한정식 식사를 중심으로 돌잔치·백일 행사를 준비할 수 있는 레스토랑입니다."],
  ["NVR-DOL-007", "백일·돌 촬영과 가족 촬영을 중심으로 하는 아기사진 스튜디오 강남점입니다."],
  ["NVR-DOL-008", "한옥 돌잔치와 돌사진·돌스냅을 함께 준비하는 한옥 스튜디오입니다."],
  ["NVR-DOL-009", "북촌 한옥에서 돌촬영을 전문으로 하며 한복과 헤어·메이크업을 함께 준비하는 스튜디오입니다."]
]);
const topLevelKeys = [
  "availability",
  "businessHours",
  "capabilities",
  "contact",
  "displayGate",
  "extraCosts",
  "fieldEvidence",
  "id",
  "image",
  "introduction",
  "location",
  "name",
  "policies",
  "products",
  "serviceAreas",
  "serviceCategories",
  "serviceMode",
  "services",
  "updatedAt"
].sort();
const productKeys = [
  "checkedAt",
  "conditions",
  "currency",
  "evidence",
  "includedItems",
  "name",
  "priceMax",
  "priceMin",
  "unit"
].sort();
const officialHosts = new Set([
  "restaurant.lottehotel.com",
  "www.marriott.com",
  "app.walkerhill.com",
  "www.walkerhill.com",
  "seorabol.kr",
  "www.ilsangst.com",
  "www.daonjae.com",
  "www.edahanok.com"
]);
const koreanBusinessPhonePattern = /^(?:0\d{1,2}-\d{3,4}-\d{4}|1\d{3}-\d{4})$/;

assert.ok(Array.isArray(profiles), "projection must be an array");
assert.equal(profiles.length, 7, "exactly seven profiles must be customer ready");
assert.equal(new Set(profiles.map(({ id }) => id)).size, 7, "profile IDs must be unique");
assert.deepEqual([...profiles.map(({ id }) => id)].sort(), [...expected.keys()].sort(), "only the seven audited IDs are allowed");
assertDeepFrozen(profiles);

for (const profile of profiles) {
  const identity = expected.get(profile.id);
  assert.ok(identity, `${profile.id}: unexpected profile`);
  assert.deepEqual(Object.keys(profile).sort(), topLevelKeys, `${profile.id}: exact top-level allowlist`);
  assert.equal(profile.name, identity[0], `${profile.id}: audited name must match`);
  assert.equal(profile.location.address, identity[1], `${profile.id}: audited address must match`);
  assert.equal(profile.introduction, expectedIntroductions.get(profile.id), `${profile.id}: approved customer introduction`);
  assert.doesNotMatch(profile.introduction, /안내하는/, `${profile.id}: repetitive wording must be removed`);
  assert.doesNotMatch(profile.introduction, /\d/, `${profile.id}: introduction must not add numeric facts`);
  assert.equal(profile.displayGate, "customer_ready", `${profile.id}: display gate`);
  assert.equal(profile.updatedAt, "2026-08-14", `${profile.id}: update date`);

  assert.ok(profile.serviceCategories.length >= 1, `${profile.id}: service category required`);
  assert.ok(profile.services.length >= 2, `${profile.id}: at least two services required`);
  assert.equal(profile.serviceMode, "visit", `${profile.id}: only fixed-location use is supported`);
  assert.deepEqual(plain(profile.serviceAreas), [], `${profile.id}: travel areas must remain empty`);

  assert.match(profile.contact.telephone.display, koreanBusinessPhonePattern, `${profile.id}: customer phone format`);
  assert.match(profile.contact.telephone.href, /^tel:\+?\d+$/, `${profile.id}: valid telephone href`);
  assert.ok(profile.contact.officialLinks.length >= 1, `${profile.id}: official channel required`);
  profile.contact.officialLinks.forEach((link) => {
    const url = new URL(link.url);
    assert.equal(url.protocol, "https:", `${profile.id}: official URL must use HTTPS`);
    assert.ok(officialHosts.has(url.hostname), `${profile.id}: official URL host ${url.hostname}`);
    assert.ok(link.label.length > 0 && link.kind.length > 0, `${profile.id}: official link metadata`);
  });

  assert.equal(profile.image.url, null, `${profile.id}: no provider image may be copied`);
  assert.equal(profile.image.rightsVerified, false, `${profile.id}: image rights must not be implied`);
  assert.equal(profile.image.alt, "", `${profile.id}: fallback is decorative until FE supplies a shared asset`);
  assert.ok(["돌잔치 장소·식사", "돌사진·스튜디오"].includes(profile.image.fallbackCategory), `${profile.id}: allowed fallback category`);

  assert.deepEqual(plain(profile.extraCosts), [], `${profile.id}: unverified extra costs must be empty`);
  assert.equal(profile.policies.cancellation, null, `${profile.id}: cancellation must be missing`);
  assert.equal(profile.policies.setup, null, `${profile.id}: setup must be missing`);
  assert.equal(profile.policies.travel, null, `${profile.id}: travel policy must be missing`);
  assert.equal(profile.availability.mode, "contact_required", `${profile.id}: availability must require direct confirmation`);
  assert.equal(profile.availability.checkedAt, null, `${profile.id}: no availability date may be invented`);
  assert.deepEqual(plain(profile.capabilities), { inquiry: false, compare: false, save: false, review: false }, `${profile.id}: product actions stay disabled`);

  const evidenceFields = new Set(profile.fieldEvidence.map(({ field }) => field));
  ["identity", "location", "services", "contact.telephone", "contact.officialLinks"].forEach((field) => {
    assert.ok(evidenceFields.has(field), `${profile.id}: evidence required for ${field}`);
  });
  profile.fieldEvidence.forEach((item) => {
    assert.equal(item.sourceClass, "official_website", `${profile.id}: evidence class`);
    assert.equal(item.checkedAt, "2026-08-14", `${profile.id}: evidence date`);
    const url = new URL(item.sourceUrl);
    assert.ok(officialHosts.has(url.hostname), `${profile.id}: evidence host ${url.hostname}`);
  });
}

assert.deepEqual(
  plain(profiles.filter(({ introduction }) => /가능|제공|전문/.test(introduction)).map(({ id }) => id)),
  ["NVR-DOL-009"],
  "strong wording is allowed only for the studio whose official evidence states its specialty"
);

[
  "167-0006",
  "16700-006",
  "1670-006",
  "1670-00060",
  "02-317-710",
  "02-3177101",
  "010-3786-594",
  "010-37865-942",
  "+82-2-317-7101"
].forEach((invalidPhone) => {
  assert.doesNotMatch(invalidPhone, koreanBusinessPhonePattern, `invalid phone must be rejected: ${invalidPhone}`);
});

const priceReady = profiles.filter(({ products }) => products.length > 0);
assert.deepEqual(plain(priceReady.map(({ id }) => id)), ["NVR-DOL-001", "NVR-DOL-004"], "numeric prices are allowed for exactly two audited providers");

for (const profile of priceReady) {
  assert.ok(profile.fieldEvidence.some(({ field }) => field === "products"), `${profile.id}: product evidence required`);
  for (const item of profile.products) {
    assert.deepEqual(Object.keys(item).sort(), productKeys, `${profile.id}/${item.name}: exact product allowlist`);
    assert.ok(item.name.length > 0, `${profile.id}: product name`);
    assert.ok(Number.isInteger(item.priceMin) && item.priceMin > 0, `${profile.id}/${item.name}: positive minimum`);
    assert.ok(Number.isInteger(item.priceMax) && item.priceMax >= item.priceMin, `${profile.id}/${item.name}: valid maximum`);
    assert.equal(item.currency, "KRW", `${profile.id}/${item.name}: currency`);
    assert.ok(item.unit.length > 0, `${profile.id}/${item.name}: unit`);
    assert.ok(item.conditions.length > 0, `${profile.id}/${item.name}: conditions`);
    assert.equal(item.checkedAt, "2026-08-14", `${profile.id}/${item.name}: checked date`);
    assert.equal(item.evidence.sourceClass, "official_website", `${profile.id}/${item.name}: source class`);
    assert.equal(item.evidence.checkedAt, item.checkedAt, `${profile.id}/${item.name}: evidence date`);
    assert.ok(officialHosts.has(new URL(item.evidence.sourceUrl).hostname), `${profile.id}/${item.name}: source host`);
  }
}

const profilesWithoutPrice = profiles.filter(({ products }) => products.length === 0);
assert.equal(profilesWithoutPrice.length, 5, "five profiles must keep prices missing");
assert.deepEqual(
  plain(profilesWithoutPrice.map(({ id }) => id)),
  ["NVR-DOL-003", "NVR-DOL-005", "NVR-DOL-007", "NVR-DOL-008", "NVR-DOL-009"],
  "only the two directly audited price profiles may expose numeric prices"
);

const categoryCounts = Object.fromEntries(
  ["돌잔치 장소·식사", "돌사진·스튜디오"].map((category) => [
    category,
    profiles.filter(({ serviceCategories }) => serviceCategories.includes(category)).length
  ])
);
assert.deepEqual(
  categoryCounts,
  { "돌잔치 장소·식사": 4, "돌사진·스튜디오": 3 },
  "the seven profiles must keep the approved 4/3 category split"
);
assert.equal(profiles.filter(({ image }) => image.url).length, 0, "provider images must remain empty");
assert.equal(profiles.filter(({ serviceAreas }) => serviceAreas.length).length, 0, "travel areas must remain empty");
assert.equal(
  profiles.filter(({ capabilities }) => Object.values(capabilities).some(Boolean)).length,
  0,
  "all unfinished product actions must remain disabled"
);
assert.doesNotMatch(source, /\b(?:priceRange|startingPrice|lowestPrice|travelRegions|availabilityDate|imageUrl)\b/, "flattened price, travel, availability, and copied image fields are forbidden");

const customerText = profiles.flatMap((profile) => [
  profile.name,
  profile.introduction,
  ...profile.serviceCategories,
  ...profile.services,
  ...profile.businessHours,
  ...profile.contact.officialLinks.flatMap(({ label }) => [label]),
  ...profile.products.flatMap((item) => [item.name, item.unit, ...item.conditions, ...item.includedItems])
]).join("\n");
assert.doesNotMatch(customerText, /후보|정보 확인 전|관측|NAVER API/, "customer display strings must not expose internal terminology");

const secondLoad = plain(loadProfiles());
assert.deepEqual(plain(profiles), secondLoad, "projection output must be deterministic");

assert.throws(() => {
  vm.runInNewContext(`"use strict"; profiles[0].name = "변경";`, { profiles });
}, isFrozenMutationError, "profile mutation must be rejected");
assert.throws(() => {
  vm.runInNewContext(`"use strict"; profiles.push({});`, { profiles });
}, isFrozenMutationError, "array mutation must be rejected");

console.log(
  `customer-provider-profiles PASS profiles=${profiles.length} venueDining=${categoryCounts["돌잔치 장소·식사"]} studio=${categoryCounts["돌사진·스튜디오"]} services=${profiles.filter((item) => item.services.length >= 2).length} contacts=${profiles.filter((item) => item.contact.telephone && item.contact.officialLinks.length).length} priceReady=${priceReady.length} priceInquiry=${profilesWithoutPrice.length} travel=${profiles.filter((item) => item.serviceAreas.length).length} copiedImages=${profiles.filter((item) => item.image.url).length}`
);
