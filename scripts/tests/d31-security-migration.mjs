import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(
  new URL("../../migrations/006_d31_security_baseline.sql", import.meta.url),
  "utf8"
);

const requiredFragments = [
  "set row_security = off",
  "Marketplace maintenance requires an operations role.",
  "revoke all on function public.taran_recalculate_provider_response_metrics(text)",
  "revoke all on function public.taran_update_owned_provider(text, jsonb)",
  "Contact details and the current privacy consent are required.",
  "Contact details and the current inquiry consent are required.",
  "owner_user_id is not null",
  'drop policy if exists "operations can delete evidence"',
  "public.taran_public_providers",
  "public.taran_public_reviews"
];

for (const fragment of requiredFragments) {
  assert.ok(migration.includes(fragment), `Missing security contract: ${fragment}`);
}

assert.doesNotMatch(
  migration,
  /grant execute on function public\.taran_recalculate_provider_response_metrics\(text\)\s+to\s+(?:public|anon|authenticated)/i,
  "Response metric recalculation must not be client-executable."
);

assert.doesNotMatch(
  migration,
  /grant execute on function public\.taran_update_owned_provider\(text,\s*jsonb\)\s+to\s+authenticated/i,
  "Legacy direct-public provider update RPC must stay disabled."
);

assert.match(
  migration,
  /role in \('owner', 'admin', 'operations'\)/,
  "General administrator helper must exclude the content role."
);

console.log("D-31 security migration contract passed.");
