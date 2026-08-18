import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, "..", "..");
const projectionPath = path.join(repositoryRoot, "scripts", "data", "unverified-provider-candidates.js");
const denylistPath = path.join(repositoryRoot, "scripts", "data", "unverified-provider-denylist.js");
const sourcePath = path.join(repositoryRoot, "outputs", "019f8241-b823-7982-94f7-ba1a171e591a", "naver_seoul_dol_trial_20_20260812.json");
const [projectionSource, denylistSource, be030Source] = await Promise.all([
  readFile(projectionPath, "utf8"),
  readFile(denylistPath, "utf8"),
  readFile(sourcePath, "utf8")
]);
const be030 = JSON.parse(be030Source);

function executeProjection({ denylistCode = denylistSource } = {}) {
  const window = Object.create(null);
  const context = vm.createContext({ URLSearchParams, window });
  if (denylistCode) vm.runInContext(denylistCode, context, { filename: denylistPath, timeout: 1_000 });
  vm.runInContext(projectionSource, context, { filename: projectionPath, timeout: 1_000 });
  return window;
}

const window = executeProjection();
assert.deepEqual(
  Object.keys(window),
  ["unverifiedProviderDenylist", "unverifiedProviderCandidates"],
  "data scripts must create only their documented browser globals"
);
assert.ok(Array.isArray(window.unverifiedProviderDenylist), "denylist must expose an array");
assert.ok(Object.isFrozen(window.unverifiedProviderDenylist), "denylist must be immutable");
assert.equal(window.unverifiedProviderDenylist.length, 0, "default denylist must preserve all approved candidates");

const candidates = window.unverifiedProviderCandidates;
assert.ok(Array.isArray(candidates), "projection must expose an array");
assert.ok(Object.isFrozen(candidates), "projection array must be immutable");
assert.equal(candidates.length, 20, "projection must contain exactly the approved 20 candidates");
assert.equal(be030.candidates.length, 20, "BE-030 source must contain exactly 20 candidates");

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
const forbiddenFields = new Set([
  "blog",
  "blogcontent",
  "blogcount",
  "blogresults",
  "coordinates",
  "email",
  "latitude",
  "longitude",
  "photo",
  "photos",
  "phone",
  "price",
  "rating",
  "recommendation",
  "review",
  "reviewcount",
  "reviews",
  "searchrank",
  "telephone",
  "verified"
]);
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
const ids = new Set();
const nameAddressPairs = new Set();
const fieldCounts = new Map();
const sourceById = new Map(be030.candidates.map((candidate) => [candidate.CandidateId, candidate]));

function districtFrom(address) {
  return address.match(/^서울특별시\s+(\S+구)\s/)?.[1] || "";
}

function neighborhoodFrom(address) {
  return address.match(/^서울특별시\s+\S+구\s+(\S+)\s/)?.[1] || "";
}

function topicsFrom(query) {
  return String(query).split(/\s+/).filter((token) => allowedTopics.has(token));
}

for (const candidate of candidates) {
  assert.ok(Object.isFrozen(candidate), `${candidate.id || "unknown"}: candidate must be immutable`);
  assert.deepEqual(Object.keys(candidate).sort(), allowedFields, `${candidate.id || "unknown"}: public schema must equal the allowlist`);

  for (const key of Object.keys(candidate)) {
    assert.ok(!forbiddenFields.has(key.toLowerCase()), `${candidate.id}: forbidden field ${key}`);
  }

  for (const key of requiredTextFields) {
    assert.equal(typeof candidate[key], "string", `${candidate.id || "unknown"}: ${key} must be a string`);
    assert.ok(candidate[key].trim(), `${candidate.id || "unknown"}: ${key} must not be blank`);
  }

  assert.match(candidate.id, /^NVR-DOL-\d{3}$/, `${candidate.id}: candidate ID format mismatch`);
  assert.ok(!ids.has(candidate.id), `${candidate.id}: duplicate candidate ID`);
  ids.add(candidate.id);

  const pairKey = `${candidate.name.trim().toLocaleLowerCase("ko-KR")}\u0000${candidate.address.trim().toLocaleLowerCase("ko-KR")}`;
  assert.ok(!nameAddressPairs.has(pairKey), `${candidate.id}: duplicate name and address`);
  nameAddressPairs.add(pairKey);

  const source = sourceById.get(candidate.id);
  assert.ok(source, `${candidate.id}: must exist in BE-030`);
  assert.equal(candidate.name, source.Name, `${candidate.id}: name must match BE-030`);
  assert.equal(candidate.candidateField, source.Field, `${candidate.id}: candidate field must match BE-030`);
  assert.equal(candidate.address, source.RoadAddress, `${candidate.id}: road address must match BE-030`);
  assert.equal(candidate.district, districtFrom(source.RoadAddress), `${candidate.id}: district must be parsed from the observed road address`);
  assert.equal(candidate.neighborhood, neighborhoodFrom(source.Address), `${candidate.id}: neighborhood must be parsed from the observed jibun address`);
  assert.equal(candidate.sourceCategory, source.Category, `${candidate.id}: source category must match the NAVER observation`);
  assert.deepEqual(Array.from(candidate.observedTopics), topicsFrom(source.LocalSearchQuery), `${candidate.id}: topics must be allowlisted tokens from the observed search query`);
  assert.ok(Object.isFrozen(candidate.observedTopics), `${candidate.id}: observed topics must be immutable`);
  assert.ok(candidate.observedTopics.length > 0, `${candidate.id}: observed topics must not be empty`);
  for (const topic of candidate.observedTopics) {
    assert.ok(allowedTopics.has(topic), `${candidate.id}: unapproved observed topic ${topic}`);
  }

  assert.equal(candidate.region, "서울", `${candidate.id}: region must be 서울`);
  assert.match(candidate.address, /^서울특별시\s/, `${candidate.id}: address must be in Seoul`);
  assert.equal(candidate.sourceType, "NAVER 지역검색 API 관측", `${candidate.id}: source type mismatch`);
  assert.equal(candidate.observedAt, source.ObservedAt, `${candidate.id}: observation date must match BE-030`);
  assert.equal(candidate.status, "정보 확인 전", `${candidate.id}: status mismatch`);
  assert.equal(candidate.unverifiedCandidate, true, `${candidate.id}: unverified candidate gate must be enabled`);
  assert.equal(candidate.inquiryEnabled, false, `${candidate.id}: inquiry must be disabled`);
  assert.equal(candidate.reviewEnabled, false, `${candidate.id}: reviews must be disabled`);
  assert.equal(candidate.compareEnabled, false, `${candidate.id}: comparison must be disabled`);

  const sourceUrl = new URL(candidate.sourceUrl);
  assert.equal(sourceUrl.protocol, "https:", `${candidate.id}: source URL must use HTTPS`);
  assert.equal(sourceUrl.hostname, "search.naver.com", `${candidate.id}: source URL must stay on NAVER search`);
  assert.equal(sourceUrl.pathname, "/search.naver", `${candidate.id}: source URL path mismatch`);
  assert.equal(sourceUrl.searchParams.get("where"), "place", `${candidate.id}: source URL must request place search`);
  const query = sourceUrl.searchParams.get("query") || "";
  assert.ok(query.includes(candidate.name), `${candidate.id}: source URL query must include the candidate name`);
  assert.ok(query.includes(candidate.address), `${candidate.id}: source URL query must include the allowed address`);

  fieldCounts.set(candidate.candidateField, (fieldCounts.get(candidate.candidateField) || 0) + 1);
}

assert.deepEqual(
  Object.fromEntries([...fieldCounts.entries()].sort(([left], [right]) => left.localeCompare(right, "ko-KR"))),
  {
    "답례·케이크": 3,
    "돌상·장식": 4,
    "의상·미용": 3,
    "장소·음식": 6,
    "촬영": 4
  },
  "the BE-030 five-field distribution must be preserved"
);
assert.deepEqual([...ids].sort(), [...sourceById.keys()].sort(), "projection IDs must exactly equal the BE-030 IDs");

const serializedProjection = JSON.stringify(candidates);
const forbiddenValuePatterns = [
  [/(?:^|[^0-9])01[016789][ -]?\d{3,4}[ -]?\d{4}(?:[^0-9]|$)/, "mobile phone number"],
  [/(?:^|[^0-9])02[ -]?\d{3,4}[ -]?\d{4}(?:[^0-9]|$)/, "Seoul phone number"],
  [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i, "email address"],
  [/\b(?:service_role|client[_-]?secret|authorization|bearer)\b/i, "secret or credential marker"],
  [/X-Naver-Client-(?:Id|Secret)/i, "NAVER credential header"],
  [/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/, "JWT-like token"],
  [/blog\.naver\.com|tistory\.com/i, "blog link"],
  [/\b(?:가격|비용|평점|추천|후기)\b/, "forbidden public claim"]
];

for (const [pattern, label] of forbiddenValuePatterns) {
  assert.doesNotMatch(serializedProjection, pattern, `projection must not contain a ${label}`);
}
assert.doesNotMatch(projectionSource, /\b(?:Telephone|Longitude|Latitude|BlogSearch|BlogSourceLinks|BlogMentionKeywords)\b/, "source must not copy BE-030 internal field names");

const hiddenId = candidates[0].id;
const injectedDenylist = `(function (global) { Object.defineProperty(global, "unverifiedProviderDenylist", { value: Object.freeze(["${hiddenId}"]), enumerable: true }); })(window);`;
const hiddenWindow = executeProjection({ denylistCode: injectedDenylist });
assert.equal(hiddenWindow.unverifiedProviderCandidates.length, 19, "one denied candidate must reduce the public projection from 20 to 19");
assert.equal(hiddenWindow.unverifiedProviderCandidates.some((candidate) => candidate.id === hiddenId), false, "denied candidate must not remain in the list projection");
assert.equal(hiddenWindow.unverifiedProviderCandidates.find((candidate) => candidate.id === hiddenId) || null, null, "denied candidate detail lookup must fail closed");

const recoveredWindow = executeProjection();
assert.equal(recoveredWindow.unverifiedProviderCandidates.length, 20, "clearing the denylist must restore 19 to 20 deterministically");
assert.equal(JSON.stringify(recoveredWindow.unverifiedProviderCandidates), serializedProjection, "restored projection must exactly equal the baseline");
assert.equal(JSON.stringify(executeProjection().unverifiedProviderCandidates), serializedProjection, "same inputs must produce the same ordered projection");

assert.equal(executeProjection({ denylistCode: "" }).unverifiedProviderCandidates.length, 0, "missing denylist must fail closed");
const unknownIdDenylist = `(function (global) { global.unverifiedProviderDenylist = Object.freeze(["NVR-DOL-999"]); })(window);`;
assert.equal(executeProjection({ denylistCode: unknownIdDenylist }).unverifiedProviderCandidates.length, 0, "unknown denylist IDs must fail closed");
const malformedDenylist = `(function (global) { global.unverifiedProviderDenylist = Object.freeze([7]); })(window);`;
assert.equal(executeProjection({ denylistCode: malformedDenylist }).unverifiedProviderCandidates.length, 0, "malformed denylist entries must fail closed");

console.log("PASS BE-032 unverified provider insights projection");
console.log("baseline=20 hidden=19 restored=20 fields=5 districts=10 neighborhoods=18 sourceCategories=20");
console.log("forbiddenFields=0 forbiddenValues=0 sensitiveValues=0 deterministic=true denylistFailClosed=true");
