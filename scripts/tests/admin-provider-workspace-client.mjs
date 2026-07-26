import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const client = await readFile(
  new URL("../../scripts/pages/admin/providers.js", import.meta.url),
  "utf8"
);

assert.match(
  client,
  /TaranApi\.rpc\("taran_list_admin_provider_workspace"/,
  "The administrator screen must load its private queues through the dedicated RPC."
);

for (const resource of ["providers", "providerClaims", "providerRegistrations"]) {
  assert.doesNotMatch(
    client,
    new RegExp(`TaranAdminData\\.list\\("${resource}"`),
    `${resource} must not be read directly from a private base table.`
  );
}

assert.match(
  client,
  /workspace = \{[\s\S]*providers:[\s\S]*claims:[\s\S]*registrations:/,
  "The RPC response must be normalized into the three independent queues."
);
assert.match(
  client,
  /Promise\.allSettled\(\[load\(\), loadReviews\(\), loadClaims\(\), loadRegistrations\(\)\]\)/,
  "A failure in one queue must not prevent the other queues from rendering."
);
assert.match(
  client,
  /catch \(error\) \{ console\.error\("업체 관리 작업공간을 불러오지 못했습니다\.", error\); \}/,
  "Workspace read failures must remain visible to operators without aborting initialization."
);

console.log("Admin provider workspace client contract passed.");
