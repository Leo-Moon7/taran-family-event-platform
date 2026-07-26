import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(
  new URL("../../migrations/010_public_projection_security.sql", import.meta.url),
  "utf8"
);

for (const resource of ["providers", "reviews"]) {
  assert.match(
    migration,
    new RegExp(`create table if not exists public\\.taran_public_${resource}`, "i"),
    `${resource} must use an RLS-protected projection table.`
  );
  assert.match(
    migration,
    new RegExp(`alter table public\\.taran_public_${resource} enable row level security`, "i"),
    `${resource} projection must enable RLS.`
  );
  assert.match(
    migration,
    new RegExp(`grant select on public\\.taran_public_${resource} to anon, authenticated`, "i"),
    `${resource} projection must remain publicly readable.`
  );
}

assert.doesNotMatch(
  migration,
  /create(?: or replace)? view public\.taran_public_(?:providers|reviews)/i,
  "Owner-privileged public views must not be recreated."
);
assert.doesNotMatch(
  migration,
  /security definer/i,
  "Projection maintenance does not need SECURITY DEFINER privileges."
);
assert.match(
  migration,
  /revoke all on public\.taran_providers from anon, authenticated/i,
  "The private provider source must stay unreachable."
);
assert.match(
  migration,
  /revoke all on public\.taran_reviews from anon, authenticated/i,
  "The private review source must stay unreachable."
);
assert.match(
  migration,
  /after insert or update or delete on public\.taran_providers/i,
  "Provider projection changes must follow source changes atomically."
);
assert.match(
  migration,
  /after insert or update or delete on public\.taran_reviews/i,
  "Review projection changes must follow source changes atomically."
);

for (const forbiddenKey of [
  "owner_email", "owner_name", "business_number", "document_path",
  "contact_email", "requested_by", "owner_user_id", "updated_by"
]) {
  assert.doesNotMatch(
    migration.slice(0, migration.indexOf("do $$")),
    new RegExp(`'${forbiddenKey}'`, "i"),
    `${forbiddenKey} must not enter the public provider payload allowlist.`
  );
}

console.log("RLS public projection migration contract passed.");
