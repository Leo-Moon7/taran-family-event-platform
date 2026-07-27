import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(
  new URL("../../migrations/011_admin_provider_workspace_rpc.sql", import.meta.url),
  "utf8"
);

const queueFunctions = [
  "taran_list_admin_providers",
  "taran_list_admin_provider_claims",
  "taran_list_admin_provider_registrations"
];

for (const functionName of queueFunctions) {
  assert.match(
    migration,
    new RegExp(`create or replace function public\\.${functionName}\\(`, "i"),
    `${functionName} must have an independent RPC contract.`
  );
  assert.match(
    migration,
    new RegExp(`grant execute on function public\\.${functionName}\\(integer\\)[\\s\\S]*?to authenticated`, "i"),
    `${functionName} must be executable only after authentication.`
  );
}

assert.equal(
  (migration.match(/security definer/gi) || []).length,
  3,
  "Each queue must read through its own role-checked SECURITY DEFINER function."
);
assert.equal(
  (migration.match(/taran_has_role\(array\['owner','admin','operations'\]\)/gi) || []).length,
  3,
  "Every queue must independently restrict access to owner, admin, and operations."
);
assert.equal(
  (migration.match(/using errcode = '42501'/gi) || []).length,
  3,
  "Every rejected queue request must receive an authorization error."
);

for (const table of ["taran_providers", "taran_provider_claims", "taran_provider_registrations"]) {
  assert.match(
    migration,
    new RegExp(`revoke all on public\\.${table} from anon, authenticated`, "i"),
    `${table} must remain inaccessible to browser roles.`
  );
}

assert.doesNotMatch(
  migration,
  /grant\s+(?:all|select|insert|update|delete)[^;]*on\s+public\.taran_(?:providers|provider_claims|provider_registrations)[^;]*to\s+(?:anon|authenticated)/i,
  "The migration must not reopen private source-table privileges."
);
assert.doesNotMatch(
  migration.slice(0, migration.indexOf("revoke all on function")),
  /'business_number'|->\s*'business_number'|->>\s*'business_number'/i,
  "Business registration numbers are not needed in any queue projection."
);
assert.match(
  migration,
  /drop function if exists public\.taran_list_admin_provider_workspace\(integer, integer\)/i,
  "The combined draft RPC must be removed when the revision is reapplied."
);

console.log("Independent admin provider queue RPC contracts passed.");
