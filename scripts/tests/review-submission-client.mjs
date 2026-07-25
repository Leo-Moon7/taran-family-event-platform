import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [providerPage, adminProviders] = await Promise.all([
  readFile(new URL("../pages/provider.js", import.meta.url), "utf8"),
  readFile(new URL("../pages/admin/providers.js", import.meta.url), "utf8")
]);

const reviewSubmitStart = providerPage.indexOf('$("#review-form").addEventListener("submit"');
const reviewSubmitEnd = providerPage.indexOf('$("#provider-change-form")', reviewSubmitStart);
const reviewSubmitBody = providerPage.slice(reviewSubmitStart, reviewSubmitEnd);

assert.match(reviewSubmitBody, /TaranApi\.rpc\("taran_submit_review"/, "Review form must use the narrow submission RPC.");
assert.doesNotMatch(reviewSubmitBody, /TaranApi\.(?:upsert|update|remove)\(/, "Review form must not write the base table directly.");
assert.doesNotMatch(reviewSubmitBody, /user_id|status:\s*"pending"/, "The client must not choose review ownership or publication state.");
assert.match(reviewSubmitBody, /p_provider_id:\s*id/, "Provider id must be sent to the RPC.");
assert.match(reviewSubmitBody, /p_rating:\s*payload\.rating/, "Rating must be sent to the RPC.");
assert.match(reviewSubmitBody, /p_author_name:\s*payload\.author_name/, "Display name must be sent to the RPC.");
assert.match(reviewSubmitBody, /p_content:\s*payload\.content/, "Review content must be sent to the RPC.");

const moderationStart = adminProviders.indexOf("async function moderateReview");
const moderationEnd = adminProviders.indexOf("async function moderateClaim", moderationStart);
const moderationBody = adminProviders.slice(moderationStart, moderationEnd);

assert.match(moderationBody, /TaranApi\.rpc\("taran_moderate_review"/, "Review moderation must use the atomic RPC.");
assert.match(moderationBody, /TaranApi\.rpc\("taran_list_pending_reviews"/, "Review queue must use the operations-only RPC.");
assert.doesNotMatch(
  moderationBody,
  /TaranAdminData\.(?:list|upsert|update|remove)\("reviews"/,
  "Admin review workflow must not read or write the base table directly."
);

console.log("Review submission and moderation client contract passed.");
