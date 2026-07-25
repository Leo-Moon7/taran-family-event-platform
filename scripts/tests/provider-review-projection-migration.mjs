import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(
  new URL("../../migrations/007_provider_review_projection_flow.sql", import.meta.url),
  "utf8"
);

for (const fragment of [
  "taran_provider_change_requests",
  "taran_provider_review_events",
  "taran_submit_provider_change_request",
  "taran_review_provider_change_request",
  "taran_review_provider_registration",
  "taran_submit_inquiry_response",
  "for update",
  "Provider review requires an operations role.",
  "Provider registration review requires an operations role.",
  "Only the provider owner can submit this change."
]) {
  assert.ok(migration.includes(fragment), `Missing provider review contract: ${fragment}`);
}

assert.match(
  migration,
  /where status = 'pending'/,
  "Only one pending provider change should be allowed."
);

assert.doesNotMatch(
  migration,
  /grant execute on function public\.taran_review_provider_(?:change_request|registration)[\s\S]{0,120}\bto\s+(?:public|anon)\b/i,
  "Review RPCs must never be public or anonymous."
);

assert.doesNotMatch(
  migration,
  /owner_email|consent_version['"]?\s*,\s*v_provider_data/i,
  "Owner contact and consent must not be copied into public provider data."
);

console.log("Provider review/projection migration contract passed.");
