import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(
  new URL("../../migrations/011_admin_provider_workspace_rpc.sql", import.meta.url),
  "utf8"
);

assert.match(
  migration,
  /create or replace function public\.taran_list_admin_provider_workspace\(/i,
  "The administrator workspace must use one explicit RPC contract."
);
assert.match(
  migration,
  /security definer/i,
  "The role-checked function must read private source tables without browser grants."
);
assert.match(
  migration,
  /taran_has_role\(array\['owner','admin','operations'\]\)/i,
  "Only owner, admin, and operations roles may read the workspace."
);
assert.match(
  migration,
  /using errcode = '42501'/i,
  "Rejected roles must receive an authorization error."
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
  "Business registration numbers are not needed in the queue projection."
);

for (const queue of ["providers", "claims", "registrations"]) {
  assert.match(
    migration,
    new RegExp(`'${queue}', v_${queue}`),
    `The response must include the ${queue} queue.`
  );
}

console.log("Admin provider workspace RPC contract passed.");
