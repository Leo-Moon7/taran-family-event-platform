import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const dashboard = await readFile(
  new URL("../../scripts/pages/admin/dashboard.js", import.meta.url),
  "utf8"
);
const inquiries = await readFile(
  new URL("../../scripts/pages/admin/inquiries.js", import.meta.url),
  "utf8"
);
const clients = [
  ["dashboard", dashboard],
  ["inquiries", inquiries]
];

for (const [name, client] of clients) {
  for (const functionName of [
    "taran_list_admin_provider_operations",
    "taran_list_admin_provider_claims",
    "taran_list_admin_provider_registrations"
  ]) {
    assert.match(
      client,
      new RegExp(`rpc: "${functionName}"`),
      `${name} must map the private provider queue to ${functionName}.`
    );
  }

  assert.match(
    client,
    /Promise\.allSettled\(queues\.map/,
    `${name} must settle the three provider RPCs independently.`
  );
  assert.match(
    client,
    /const snapshot = \{ providers: null, claims: null, registrations: null \}/,
    `${name} must distinguish an unavailable queue from a real empty array.`
  );
  assert.match(
    client,
    /result\.status === "fulfilled" && Array\.isArray\(result\.value\)/,
    `${name} must accept only successful array RPC payloads as queue data.`
  );
  assert.match(
    client,
    /\.filter\(\(item\) => item\.status === "published"\)/,
    `${name} must preserve the published provider filter in the client.`
  );
  assert.match(client, /item\.has_owner/, `${name} must use the minimum has_owner snapshot field.`);
  assert.doesNotMatch(client, /owner_user_id/, `${name} must not depend on the private owner UUID.`);

  for (const resource of ["providers", "providerClaims", "providerRegistrations"]) {
    assert.doesNotMatch(
      client,
      new RegExp(`(?:TaranAdminData\\.list|safeList)\\(\\s*["']${resource}["']`),
      `${name} must not read ${resource} directly from a private base table.`
    );
  }

  for (const resource of ["inquiryRecipients", "notificationJobs"]) {
    assert.match(
      client,
      new RegExp(`safeList\\(\\s*["']${resource}["']`),
      `${name} must preserve the existing ${resource} direct read outside FE-026.`
    );
  }
}

assert.match(
  dashboard,
  /\["공개 업체", providersAvailable \? providers\.length : null\]/,
  "Dashboard provider metrics must render unavailable RPC data as an em dash instead of zero."
);
assert.match(
  dashboard,
  /const claimsCount = claimsAvailable \? claims\.length : null/,
  "Dashboard claim count must remain unavailable when its RPC fails."
);
assert.match(
  dashboard,
  /const registrationsCount = registrationsAvailable \? registrations\.length : null/,
  "Dashboard registration count must remain unavailable when its RPC fails."
);
assert.match(
  dashboard,
  /operationsExceptionParts\.every\(\(value\) => typeof value === "number"\)[\s\S]*: null/,
  "Dashboard aggregate exceptions must not present a partial RPC result as the real total."
);

assert.match(inquiries, /function buildLoadErrorRows/, "Inquiries must render queue-specific loading failures.");
for (const label of [
  "업체 소유권 목록 불러오기 실패",
  "신규 업체 등록 목록 불러오기 실패",
  "업체 운영 정보 불러오기 실패"
]) {
  assert.match(inquiries, new RegExp(label), `${label} must be visible in the exception table.`);
}
assert.match(inquiries, /actionLabel: "다시 시도"/, "Failed queues must offer an explicit retry action.");
assert.match(
  inquiries,
  /불러오기 실패 \$\{loadErrorCount\.toLocaleString\("ko-KR"\)\}개 목록/,
  "Load failures must be counted separately from real operational exceptions."
);
assert.match(
  inquiries,
  /rows = buildOnlineRows\(\{ \.\.\.operations, recipients, notificationJobs \}\)/,
  "Successful direct queues must remain available beside independently settled provider RPCs."
);
assert.match(inquiries, /row\.name \|\| row\.id/, "Provider display names must use the minimum name snapshot field.");
assert.doesNotMatch(inquiries, /row\.data\?\.name/, "Provider names must not depend on the old data payload.");

console.log("Admin operations read client contract passed.");
