import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [providerHtml, providerPage, venuesPage] = await Promise.all([
  readFile(new URL("../../provider.html", import.meta.url), "utf8"),
  readFile(new URL("../pages/provider.js", import.meta.url), "utf8"),
  readFile(new URL("../pages/venues.js", import.meta.url), "utf8")
]);

for (const [name, source] of [["provider", providerPage], ["venues", venuesPage]]) {
  assert.match(source, /TaranApi\.select\("taran_public_providers"/, `${name} must read the safe public provider view.`);
  assert.match(source, /PUBLIC_PROVIDER_SELECT/, `${name} must use an explicit public projection.`);
  assert.doesNotMatch(
    source.slice(source.indexOf("const PUBLIC_PROVIDER_SELECT"), source.indexOf("].join", source.indexOf("const PUBLIC_PROVIDER_SELECT"))),
    /owner_user_id|updated_by|requested_by|business_number|contact_email/i,
    `${name} projection must not request internal ownership or contact identifiers.`
  );
}

assert.match(venuesPage, /TaranApi\.select\("taran_public_reviews"/, "Directory review stats must read the public review view.");
assert.match(providerPage, /TaranApi\.select\("taran_public_reviews"/, "Provider reviews must read the public review view.");
assert.doesNotMatch(
  venuesPage,
  /state\.items\.filter\(\(item\) => hasPublishedReviewOrRating/,
  "Approved providers must not disappear merely because they have no reviews yet."
);

assert.match(providerHtml, /id="provider-change"/, "Provider detail must contain the owner change-request section.");
assert.match(providerHtml, /id="provider-change-pending"/, "Provider detail must show a pending review state.");
assert.match(providerPage, /TaranApi\.rpc\("taran_submit_provider_change_request"/, "Changes must use the owner-only pending RPC.");
assert.match(providerPage, /consent_version:\s*"provider-change-v1"/, "Change submissions must carry the versioned consent.");
assert.match(providerPage, /TaranApi\.rpc\("taran_withdraw_provider_change_request"/, "Owners must be able to withdraw their pending request.");
assert.match(
  providerPage,
  /providerSource !== "database"/,
  "Change requests must not be offered for static or failed-fallback provider records."
);

assert.doesNotMatch(providerHtml, /review-provider-candidates|review-lifecycle-candidates|review-lifecycle-verified|review-local-api-partners/, "Removed NAVER-derived public scripts must stay removed.");
assert.doesNotMatch(venuesPage, /업체 사진 준비 중/, "Approved CHG-B image-note removal must be preserved.");
assert.doesNotMatch(providerPage, /업체 사진 준비 중/, "Approved CHG-B detail image-note removal must be preserved.");

console.log("Public provider adapter and pending change-request contract passed.");
