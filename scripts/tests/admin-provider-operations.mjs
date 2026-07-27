import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(
  new URL("../../migrations/012_admin_provider_operations.sql", import.meta.url),
  "utf8"
);

function functionBlock(name) {
  const start = migration.search(new RegExp(`create or replace function public\\.${name}\\(`, "i"));
  assert.notEqual(start, -1, `${name} must exist.`);
  const end = migration.indexOf("\n$$;", start);
  assert.notEqual(end, -1, `${name} must have a complete SQL body.`);
  return migration.slice(start, end + 4);
}

const functions = [
  {
    name: "taran_save_admin_provider",
    signature: "text, jsonb, text, text"
  },
  {
    name: "taran_set_admin_provider_status",
    signature: "text, text"
  },
  {
    name: "taran_review_admin_provider_claim",
    signature: "uuid, text"
  },
  {
    name: "taran_list_admin_provider_operations",
    signature: "integer"
  }
];

for (const { name, signature } of functions) {
  const block = functionBlock(name);
  assert.match(block, /security definer/i, `${name} must cross RLS only through SECURITY DEFINER.`);
  assert.match(
    block,
    /set search_path = public, pg_catalog/i,
    `${name} must pin its search path.`
  );
  assert.match(
    block,
    /taran_has_role\(array\['owner','admin','operations'\]\)/i,
    `${name} must independently enforce the operations role set.`
  );
  assert.match(block, /using errcode = '42501'/i, `${name} must return an authorization error.`);
  assert.match(
    migration,
    new RegExp(`revoke all on function public\\.${name}\\(${signature.replaceAll(" ", "\\s*")}\\)[\\s\\S]*?from public, anon, authenticated`, "i"),
    `${name} must revoke default, anonymous, and stale authenticated execution first.`
  );
  assert.match(
    migration,
    new RegExp(`grant execute on function public\\.${name}\\(${signature.replaceAll(" ", "\\s*")}\\)[\\s\\S]*?to authenticated`, "i"),
    `${name} must be callable only after authentication and internal role checking.`
  );
}

assert.equal(
  (migration.match(/create or replace function public\./gi) || []).length,
  4,
  "The migration must add only the four scoped provider operations functions."
);
assert.equal(
  (migration.match(/security definer/gi) || []).length,
  4,
  "Every provider operations function must use the same role-checked boundary."
);

const save = functionBlock("taran_save_admin_provider");
assert.match(
  save,
  /p_original_id is null[\s\S]*?if found then[\s\S]*?using errcode = '23505'/i,
  "A create call must reject an existing provider ID instead of overwriting it."
);
assert.match(
  save,
  /if p_original_id <> p_provider_id then[\s\S]*?existing provider ID cannot be changed/i,
  "An edit call must reject provider ID changes."
);
assert.match(
  save,
  /where provider\.id = p_original_id\s+for update/i,
  "An edit call must lock the exact immutable provider row."
);
assert.doesNotMatch(save, /\bdelete\s+from\b|\bon conflict\b/i, "Save must neither delete nor upsert providers.");
assert.match(
  save,
  /v_allowed_keys constant text\[\][\s\S]*?jsonb_object_keys\(p_data\)[\s\S]*?Unsupported provider fields/i,
  "Save must reject keys outside its explicit payload allowlist."
);
for (const requiredField of ["name", "category", "region"]) {
  assert.match(
    save,
    new RegExp(`jsonb_typeof\\(p_data->'${requiredField}'\\)`, "i"),
    `${requiredField} must be type-checked.`
  );
}
for (const forbiddenPayloadKey of [
  "owner_user_id", "updated_by", "business_number", "document_path",
  "manager_name", "work_email", "user_id"
]) {
  assert.doesNotMatch(
    save,
    new RegExp(`'${forbiddenPayloadKey}'`, "i"),
    `${forbiddenPayloadKey} must not enter the provider save allowlist.`
  );
}
assert.match(
  save,
  /p_status not in \('draft', 'published', 'archived'\)/i,
  "Save must accept only existing provider publication states."
);
assert.match(
  save,
  /v_minimum_guests > v_maximum_guests[\s\S]*?using errcode = '22023'/i,
  "Save must reject inverted guest ranges."
);
assert.match(
  save,
  /v_minimum_guests > 5000[\s\S]*?v_maximum_guests > 5000/i,
  "Save must bound both guest counts."
);

const status = functionBlock("taran_set_admin_provider_status");
assert.match(
  status,
  /p_status not in \('draft', 'published', 'archived'\)/i,
  "Status changes must accept only existing provider publication states."
);
assert.doesNotMatch(status, /owner_user_id\s*=/i, "Status changes must not alter provider ownership.");

const claim = functionBlock("taran_review_admin_provider_claim");
assert.match(
  claim,
  /p_status not in \('approved', 'rejected'\)/i,
  "Claim review must accept only terminal claim decisions."
);
assert.match(
  claim,
  /from public\.taran_provider_claims claim[\s\S]*?where claim\.id = p_claim_id[\s\S]*?for update/i,
  "Claim review must lock the pending claim."
);
assert.match(
  claim,
  /v_claim\.status <> 'pending'/i,
  "Only a pending claim may be reviewed."
);
assert.match(
  claim,
  /from public\.taran_providers provider[\s\S]*?where provider\.id = v_claim\.provider_id[\s\S]*?for update/i,
  "Claim review must lock the target provider in the same function."
);
assert.match(
  claim,
  /owner_user_id is not null[\s\S]*?owner_user_id <> v_claim\.user_id[\s\S]*?different owner[\s\S]*?errcode = '23505'/i,
  "Approval must fail before any claim transition when another owner exists."
);
assert.ok(
  claim.indexOf("update public.taran_providers") < claim.indexOf("update public.taran_provider_claims"),
  "Owner assignment and the claim transition must remain in one ordered RPC transaction."
);
assert.doesNotMatch(
  claim,
  /exception\s+when/i,
  "Claim review must not swallow an error that PostgreSQL needs to roll back atomically."
);

const snapshot = functionBlock("taran_list_admin_provider_operations");
const outputMatch = snapshot.match(/jsonb_agg\(jsonb_build_object\(([\s\S]*?)\) order by provider\.updated_at/i);
assert.ok(outputMatch, "Snapshot must build a bounded JSON projection.");
const outputKeys = [...outputMatch[1].matchAll(/^\s*'([a-z_]+)'\s*,/gm)].map((match) => match[1]);
assert.deepEqual(
  outputKeys,
  [
    "id", "name", "status", "has_owner", "profile_completeness",
    "updated_at", "last_verified_at", "inquiry_enabled", "response_rate"
  ],
  "Snapshot output must stay at the dashboard/inquiries minimum."
);
for (const forbiddenOutputKey of [
  "owner_user_id", "business_number", "document_path", "contact_email",
  "work_email", "phone", "manager_name", "user_id", "updated_by", "data"
]) {
  assert.ok(
    !outputKeys.includes(forbiddenOutputKey),
    `${forbiddenOutputKey} must not be projected by the provider operations snapshot.`
  );
}
assert.match(snapshot, /'has_owner', provider\.owner_user_id is not null/i, "Ownership must be reduced to a boolean.");
assert.match(
  snapshot,
  /limit least\(10000, greatest\(1, coalesce\(p_limit, 5000\)\)\)/i,
  "Snapshot size must be bounded."
);

for (const table of ["taran_providers", "taran_provider_claims", "taran_provider_registrations"]) {
  assert.match(
    migration,
    new RegExp(`revoke all on public\\.${table} from anon, authenticated`, "i"),
    `${table} must remain unavailable to browser roles.`
  );
}
assert.doesNotMatch(
  migration,
  /grant\s+(?:all|select|insert|update|delete)[^;]*on\s+public\.taran_(?:providers|provider_claims|provider_registrations)[^;]*to\s+(?:anon|authenticated)/i,
  "The migration must not reopen private base-table privileges."
);
assert.doesNotMatch(
  migration,
  /\b(?:create|alter|drop)\s+table\b/i,
  "BE-024 must not expand or destructively change the existing schema."
);
for (const priorContract of [
  "taran_public_provider_payload",
  "taran_list_admin_providers",
  "taran_list_admin_provider_claims",
  "taran_list_admin_provider_registrations",
  "taran_review_provider_registration",
  "taran_moderate_review"
]) {
  assert.doesNotMatch(
    migration,
    new RegExp(`create or replace function public\\.${priorContract}\\(`, "i"),
    `${priorContract} belongs to an earlier migration and must remain unchanged.`
  );
}

console.log("Admin provider operations migration contracts passed.");
