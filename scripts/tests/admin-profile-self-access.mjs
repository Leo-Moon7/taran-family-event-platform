import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(
  new URL("../../migrations/009_admin_profile_self_access.sql", import.meta.url),
  "utf8"
);

assert.match(
  migration,
  /alter table public\.taran_admin_profiles enable row level security/i,
  "The admin profile table must keep RLS enabled."
);
assert.match(
  migration,
  /grant select on public\.taran_admin_profiles to authenticated/i,
  "Signed-in users need the table-level SELECT privilege before RLS can evaluate the self policy."
);
assert.match(
  migration,
  /revoke insert, update, delete on public\.taran_admin_profiles from authenticated/i,
  "Client-side writes to admin profiles must remain forbidden."
);
assert.match(
  migration,
  /using \(user_id = auth\.uid\(\)\)/i,
  "The read policy must restrict rows to the signed-in user's own profile."
);
assert.doesNotMatch(
  migration,
  /for all|grant (?:all|insert|update|delete)[^;]*to authenticated/i,
  "The migration must not add broad or write access."
);
assert.match(
  migration,
  /drop policy if exists "admins can read admin profiles"/i,
  "The legacy broad administrator read policy must be removed."
);

console.log("Admin profile self-access migration contract passed.");
