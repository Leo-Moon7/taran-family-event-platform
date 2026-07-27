import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const client = await readFile(
  new URL("../../scripts/pages/admin/providers.js", import.meta.url),
  "utf8"
);

for (const functionName of [
  "taran_list_admin_providers",
  "taran_list_admin_provider_claims",
  "taran_list_admin_provider_registrations"
]) {
  assert.match(
    client,
    new RegExp(`rpc: "${functionName}"`),
    `${functionName} must be called independently.`
  );
}
assert.doesNotMatch(
  client,
  /taran_list_admin_provider_workspace/,
  "The combined draft RPC must not remain in the client."
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
  /Promise\.allSettled\(queues\.map/,
  "The three private queue requests must settle independently."
);
assert.match(
  client,
  /results\.forEach\([\s\S]*result\.status === "fulfilled"[\s\S]*next\[queue\.key\] = \[\]/,
  "A failed queue must clear only its own result while fulfilled queues remain available."
);
assert.match(
  client,
  /Promise\.allSettled\(\[load\(\), loadReviews\(\), loadClaims\(\), loadRegistrations\(\)\]\)/,
  "A failure in one queue must not prevent the other queues from rendering."
);
assert.match(client, /console\.error\(`\$\{queue\.key\} 관리 목록을 불러오지 못했습니다\.`/, "Queue errors must identify the failed queue.");

console.log("Admin provider workspace client contract passed.");
