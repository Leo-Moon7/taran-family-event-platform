import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const client = await readFile(
  new URL("../pages/admin/providers.js", import.meta.url),
  "utf8"
);
const adminCommon = await readFile(
  new URL("../pages/admin/common.js", import.meta.url),
  "utf8"
);

function functionBody(name, nextName) {
  const start = client.indexOf(`function ${name}`);
  const end = nextName ? client.indexOf(`function ${nextName}`, start) : client.length;
  assert.notEqual(start, -1, `${name} must exist.`);
  assert.notEqual(end, -1, `${name} must have a stable boundary.`);
  return client.slice(start, end);
}

const saveBody = functionBody("save", "edit");
assert.match(
  saveBody,
  /TaranApi\.rpc\("taran_save_admin_provider",\s*\{[\s\S]*?p_provider_id: id,[\s\S]*?p_data: data,[\s\S]*?p_status: values\.status \|\| "draft",[\s\S]*?p_original_id: originalId \|\| null/,
  "Provider save must pass the complete BE-024 RPC contract."
);
assert.match(
  saveBody,
  /const id = originalId \|\| safeId\(values\.id\)/,
  "An existing provider save must keep the exact original ID."
);
assert.match(
  saveBody,
  /throw new Error\("업체 정보를 저장하지 못했습니다\. 잠시 후 다시 시도해 주세요\."\)/,
  "Save failures must remain visible in Korean while the editor stays open."
);
assert.match(
  saveBody,
  /await refreshWorkspace\(\);\s*await load\(\);/,
  "A successful save must refresh the queues and provider list."
);

const editBody = functionBody("edit", "renderPagination");
assert.match(
  editBody,
  /field\.name === "id" \? \{ \.\.\.field, readOnly: Boolean\(item\) \} : field/,
  "Only an existing provider editor must render the ID as read-only."
);
assert.match(
  editBody,
  /onSubmit: values => save\(values, item\?\.id\)/,
  "The editor must pass the unchanged original ID to save."
);

const toggleBody = functionBody("toggle", "render");
assert.match(
  toggleBody,
  /const status = item\.publicationStatus === "published" \? "archived" : "published"/,
  "The status button must hide a published provider and publish every non-public provider."
);
assert.match(
  toggleBody,
  /TaranApi\.rpc\("taran_set_admin_provider_status",\s*\{\s*p_provider_id: item\.id,\s*p_status: status\s*\}\)/,
  "Provider status changes must use the BE-024 status RPC."
);
assert.match(
  toggleBody,
  /await refreshWorkspace\(\);\s*await load\(\);/,
  "A successful status change must refresh the queues and provider list."
);
assert.match(
  toggleBody,
  /alert\("업체 공개 상태를 변경하지 못했습니다\. 잠시 후 다시 시도해 주세요\."\);\s*button\.disabled = false/,
  "A failed status change must show Korean feedback and allow retry."
);

const claimBody = functionBody("moderateClaim", "loadClaims");
assert.match(
  claimBody,
  /TaranApi\.rpc\("taran_review_admin_provider_claim",\s*\{\s*p_claim_id: item\.id,\s*p_status: status\s*\}\)/,
  "Claim approval and rejection must use one atomic BE-024 RPC."
);
assert.match(
  claimBody,
  /await refreshWorkspace\(\);\s*await Promise\.all\(\[loadClaims\(\), load\(\)\]\);/,
  "A successful claim review must refresh its queue and the provider list."
);
assert.match(
  claimBody,
  /alert\("업체 수정 권한 요청을 처리하지 못했습니다\. 잠시 후 다시 시도해 주세요\."\);\s*button\.disabled = false/,
  "A failed claim review must show Korean feedback and allow retry."
);

for (const resource of ["providers", "providerClaims"]) {
  assert.doesNotMatch(
    client,
    new RegExp(`TaranAdminData\\.(?:upsert|update|remove)\\(\\"${resource}\\"`),
    `${resource} must not be written through a private base table.`
  );
}
assert.doesNotMatch(
  client,
  /TaranAdminData\.(?:upsert|update|remove)\(/,
  "The provider page must not retain any private base-table write."
);
assert.doesNotMatch(
  client,
  /originalId\s*&&\s*originalId\s*!==\s*id|TaranAdminData\.remove\("providers"/,
  "Provider ID rename and remove behavior must be deleted."
);

for (const unchangedRpc of ["taran_moderate_review", "taran_review_provider_registration"]) {
  assert.match(client, new RegExp(`TaranApi\\.rpc\\(\\"${unchangedRpc}\\"`), `${unchangedRpc} must remain unchanged.`);
}
assert.match(
  client,
  /Promise\.allSettled\(queues\.map/,
  "The three workspace queues must continue loading independently."
);
assert.match(
  adminCommon,
  /catch \(caught\) \{[\s\S]*error\.textContent = caught\?\.message[\s\S]*finally \{\s*save\.disabled = false;/,
  "The shared editor must show the Korean save error and enable retry."
);

console.log("Admin provider action client contract passed.");
