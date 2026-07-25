import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const inquiryFlow = await readFile(
  new URL("../core/inquiry-flow.js", import.meta.url),
  "utf8"
);
const adminProviders = await readFile(
  new URL("../pages/admin/providers.js", import.meta.url),
  "utf8"
);

assert.match(
  inquiryFlow,
  /consent_version:[\s\S]{0,160}"inquiry-contact-v1"/,
  "Inquiry payload must carry the versioned consent only from the checked UI state."
);

assert.match(
  adminProviders,
  /TaranApi\.rpc\("taran_review_provider_registration"/,
  "Registration moderation must use the atomic review RPC."
);

const moderationStart = adminProviders.indexOf("async function moderateRegistration");
const moderationEnd = adminProviders.indexOf("async function loadRegistrations", moderationStart);
const moderationBody = adminProviders.slice(moderationStart, moderationEnd);

assert.doesNotMatch(
  moderationBody,
  /TaranAdminData\.(?:upsert|update)\(/,
  "Registration moderation must not split provider publication and request status into REST writes."
);

console.log("Provider review client contract passed.");
