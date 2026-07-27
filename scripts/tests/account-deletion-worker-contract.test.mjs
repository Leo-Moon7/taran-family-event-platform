import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDirectory, "../..");
const migration013 = await readFile(
  path.join(root, "migrations/013_account_deletion_worker.sql"),
  "utf8"
);
const migration014 = await readFile(
  path.join(root, "migrations/014_account_deletion_tombstone.sql"),
  "utf8"
);
const edgeIndex = await readFile(
  path.join(root, "supabase/functions/finalize-account-deletion/index.ts"),
  "utf8"
);
const worker = await readFile(
  path.join(root, "supabase/functions/finalize-account-deletion/worker.mjs"),
  "utf8"
);
const marketplaceMigration = await readFile(
  path.join(root, "migrations/003_marketplace_comparison_flow.sql"),
  "utf8"
);

test("014 cutover holds the request table until a persistent invariant commits", () => {
  const beginPosition = migration014.indexOf("begin;");
  const lockPosition = migration014.indexOf(
    "lock table public.taran_account_deletion_requests in access exclusive mode"
  );
  const triggerPosition = migration014.indexOf(
    "create trigger taran_require_account_deletion_tombstone"
  );
  const commitPosition = migration014.lastIndexOf("commit;");

  assert.ok(beginPosition >= 0);
  assert.ok(beginPosition < lockPosition);
  assert.ok(lockPosition < triggerPosition);
  assert.ok(triggerPosition < commitPosition);
  assert.match(
    migration014,
    /before insert or update on public\.taran_account_deletion_requests[\s\S]*taran_require_account_deletion_tombstone/i
  );
});

test("every application audits active and claimed requests against tombstones", () => {
  assert.doesNotMatch(
    migration014,
    /to_regclass\('public\.taran_account_deletion_tombstones'\) is null[\s\S]*request\.status/i
  );
  assert.match(migration014, /request\.status in \('pending', 'processing'\)/i);
  assert.match(migration014, /request\.claim_token is not null/i);
  assert.match(
    migration014,
    /tombstone\.request_id = request\.id[\s\S]*request\.user_id is null or tombstone\.user_id = request\.user_id/i
  );
  assert.match(
    migration014,
    /Every active account deletion request must have a matching tombstone before migration 014 can commit/i
  );
});

test("new request RPC pre-creates one exact tombstone before request insert", () => {
  const requestRpc = migration014.match(
    /create or replace function public\.taran_request_account_deletion\(\)([\s\S]*?)create or replace function public\.taran_claim_account_deletion_job/i
  )?.[1];
  assert.ok(requestRpc, "request RPC must exist");
  assert.match(requestRpc, /v_id := gen_random_uuid\(\)/i);
  const tombstonePosition = requestRpc.indexOf(
    "insert into public.taran_account_deletion_tombstones"
  );
  const requestPosition = requestRpc.indexOf(
    "insert into public.taran_account_deletion_requests (id, user_id, status)"
  );
  assert.ok(tombstonePosition >= 0 && tombstonePosition < requestPosition);
  assert.match(
    requestRpc,
    /insert into public\.taran_account_deletion_requests \(id, user_id, status\)[\s\S]*values \(v_id, v_user, 'pending'\)/i
  );
});

test("runtime configuration is disabled without guessing JWT values", () => {
  const configTable = migration014.match(
    /create table if not exists public\.taran_account_deletion_runtime_config \(([\s\S]*?)\n\);/i
  )?.[1];
  assert.ok(configTable, "runtime config table must exist");
  assert.match(configTable, /enabled boolean not null default false/i);
  assert.match(configTable, /max_jwt_ttl_seconds integer/i);
  assert.match(configTable, /max_inflight_write_seconds integer/i);
  assert.match(configTable, /buffer_seconds integer/i);
  assert.match(configTable, /verified_at timestamptz/i);
  assert.match(configTable, /buffer_seconds > max_inflight_write_seconds/i);
  assert.doesNotMatch(configTable, /max_jwt_ttl_seconds integer\s+not null\s+default/i);
  assert.match(migration014, /Account deletion runtime configuration is not enabled/i);
  assert.match(
    migration014,
    /preflight_after[\s\S]*v_max_inflight_write_seconds \+ v_buffer_seconds/i
  );
});

test("tombstone is independent from Auth and request foreign keys", () => {
  const table = migration014.match(
    /create table if not exists public\.taran_account_deletion_tombstones \(([\s\S]*?)\n\);/i
  )?.[1];
  assert.ok(table, "tombstone table must exist");
  assert.match(table, /user_id uuid primary key/i);
  assert.match(table, /request_id uuid not null unique/i);
  assert.doesNotMatch(table, /\breferences\b/i);
  assert.match(table, /auth_deleted_at timestamptz/i);
  assert.match(table, /release_after timestamptz/i);
  assert.match(
    migration014,
    /taran_account_deletion_is_active[\s\S]*from public\.taran_account_deletion_tombstones/i
  );
  assert.doesNotMatch(
    migration014.match(
      /create or replace function public\.taran_account_deletion_is_active[\s\S]*?\$\$;/i
    )?.[0] ?? "",
    /taran_account_deletion_requests/
  );
});

test("014 replaces every deletion advisory guard with no-lock checks", () => {
  assert.doesNotMatch(migration014, /pg_advisory_xact_lock/i);
  assert.doesNotMatch(migration014, /perform\s+public\.taran_account_deletion_lock_user\s*\(/i);
  assert.match(migration014, /drop trigger if exists taran_lock_account_deletion_auth_delete on auth\.users/i);
  assert.match(migration014, /drop function if exists public\.taran_account_deletion_lock_user\(uuid\)/i);
  assert.match(
    migration014,
    /create or replace function public\.taran_guard_account_deletion_user_write\(\)[\s\S]*taran_account_deletion_is_active/i
  );
  assert.match(
    migration014,
    /create or replace function public\.taran_guard_account_deletion_evidence_write\(\)[\s\S]*taran_account_deletion_is_active/i
  );
  assert.match(
    migration014,
    /create or replace function public\.taran_guard_account_deletion_auth_metadata\(\)[\s\S]*taran_account_deletion_is_active/i
  );
  assert.match(migration013, /create trigger taran_guard_account_deletion_writes before insert or update or delete/i);
  assert.match(migration013, /create trigger taran_guard_account_deletion_evidence_writes/i);
  assert.match(migration013, /create trigger taran_guard_account_deletion_auth_metadata_writes/i);
});

test("legacy inquiry null-subject insertion is removed and server RPC forces auth uid", () => {
  assert.match(
    migration014,
    /drop policy if exists "users can create inquiries" on public\.taran_inquiries/i
  );
  assert.doesNotMatch(migration014, /user_id is null or user_id = auth\.uid\(\)/i);
  assert.match(
    migration013,
    /create or replace function public\.taran_request_account_deletion\(\)/i
  );
  assert.match(
    marketplaceMigration,
    /create or replace function public\.taran_create_inquiry_group[\s\S]*insert into public\.taran_inquiry_groups[\s\S]*auth\.uid\(\)/i
  );
});

test("direct customer mutation and evidence policies include the tombstone", () => {
  for (const policy of [
    "users can create reviews",
    "users can update own pending reviews",
    "users can create contributions",
    "users can manage own member state",
    "users can manage own saved providers",
    "users can create provider claims",
    "users can update own pending provider claims",
    "users can create community posts",
    "users can create community comments",
    "users manage own comparisons",
    "users manage own checklists",
    "providers manage own inquiry responses",
    "users can upload own evidence",
    "operations can delete evidence"
  ]) {
    assert.match(
      migration014,
      new RegExp(
        `create policy "${policy}"[\\s\\S]*?not public\\.taran_account_deletion_self_is_active\\(\\)`,
        "i"
      )
    );
  }
});

test("RLS uses an executable self-only helper without exposing a UUID oracle", () => {
  const helper = migration014.match(
    /create or replace function public\.taran_account_deletion_self_is_active\(\)([\s\S]*?)\$\$;/i
  )?.[0];
  assert.ok(helper, "self-only RLS helper must exist");
  assert.doesNotMatch(helper, /\([^)]*uuid[^)]*\)/i);
  assert.match(helper, /taran_account_deletion_is_active\(auth\.uid\(\)\)/i);
  assert.match(
    migration014,
    /revoke all on function public\.taran_account_deletion_is_active\(uuid\)[\s\S]*from public, anon, authenticated/i
  );
  assert.match(
    migration014,
    /grant execute on function public\.taran_account_deletion_self_is_active\(\)[\s\S]*to authenticated/i
  );
  assert.doesNotMatch(
    migration014.match(/drop policy if exists "users can create reviews"[\s\S]*?create or replace function public\.taran_account_deletion_cleanup_user/i)?.[0] ?? "",
    /taran_account_deletion_is_active\(auth\.uid\(\)\)/i
  );
  for (const policy of [
    "users can create reviews",
    "users can update own pending reviews",
    "users can create contributions",
    "users can manage own member state",
    "users can manage own saved providers",
    "users can create provider claims",
    "users can update own pending provider claims",
    "users can create community posts",
    "users can create community comments",
    "users manage own comparisons",
    "users manage own checklists",
    "providers manage own inquiry responses",
    "users can upload own evidence",
    "operations can delete evidence"
  ]) {
    assert.match(
      migration014,
      new RegExp(
        `create policy "${policy}"[\\s\\S]*?not public\\.taran_account_deletion_self_is_active\\(\\)`,
        "i"
      )
    );
  }
});

test("state contract separates Auth deletion, JWT drain, and finalization", () => {
  for (const state of [
    "requested",
    "auth_deleting",
    "token_drain",
    "finalizing",
    "manual_review_required",
    "retry_wait",
    "blocked"
  ]) {
    assert.match(migration014, new RegExp(`'${state}'`, "i"));
  }
  assert.match(
    migration014,
    /release_after = v_deleted_at \+ pg_catalog\.make_interval\([\s\S]*v_max_jwt_ttl_seconds \+ v_buffer_seconds/i
  );
  assert.match(
    migration014,
    /v_tombstone\.release_after > now\(\)[\s\S]*stale JWT drain period is not complete/i
  );
  assert.match(
    migration014,
    /delete from public\.taran_account_deletion_tombstones[\s\S]*release_after <= now\(\)/i
  );
});

test("claim remains single-use and service-role-only without a lock-order cycle", () => {
  const claim = migration014.match(
    /create or replace function public\.taran_claim_account_deletion_job\(\)([\s\S]*?)create or replace function public\.taran_mark_account_deletion_auth_deleted/i
  )?.[1];
  assert.ok(claim, "claim RPC must exist");
  assert.match(claim, /for update skip locked/gi);
  assert.match(claim, /coalesce\(auth\.role\(\), ''\) <> 'service_role'/i);
  assert.match(claim, /taran_account_deletion_requires_manual_review/i);
  assert.doesNotMatch(claim, /pg_advisory_xact_lock|taran_account_deletion_lock_user\s*\(/i);
  assert.match(
    migration014,
    /grant execute on function public\.taran_claim_account_deletion_job\(\)[\s\S]*to service_role/i
  );
});

test("completion history remains non-identifying", () => {
  const table = migration013.match(
    /create table if not exists public\.taran_account_deletion_jobs \(([\s\S]*?)\n\);/i
  )?.[1];
  assert.ok(table, "job table contract must exist");
  assert.doesNotMatch(table, /\b(user_id|email|phone|payload|error_message|request_id)\b/i);
  assert.match(migration014, /outcome_code = 'auth_deleted'/i);
  assert.match(migration014, /purge_after = now\(\) \+ interval '1 year'/i);
});

test("legacy immediate completion is disabled during rollout", () => {
  assert.match(
    migration014,
    /create or replace function public\.taran_complete_account_deletion_job[\s\S]*Legacy account deletion completion is disabled/i
  );
  assert.match(
    migration014,
    /revoke all on function public\.taran_complete_account_deletion_job\(uuid\)[\s\S]*service_role/i
  );
});

test("Edge Function uses mark then finalize and masks public responses", () => {
  assert.match(edgeIndex, /request\.method !== "POST"/);
  assert.match(edgeIndex, /secureEqual\(bearer, serviceRoleKey\)/);
  assert.match(edgeIndex, /taran_mark_account_deletion_auth_deleted/);
  assert.match(edgeIndex, /taran_finalize_account_deletion_job/);
  assert.doesNotMatch(edgeIndex, /taran_complete_account_deletion_job/);
  assert.match(worker, /claimed\.action === "wait"/);
  assert.match(worker, /claimed\.action === "mark_auth_deleted"/);
  assert.match(worker, /claimed\.action === "finalize"/);
  assert.doesNotMatch(edgeIndex, /console\.(log|info|warn|error)/);
  assert.doesNotMatch(worker, /console\.(log|info|warn|error)/);
  assert.doesNotMatch(worker, /return\s+claimed/);
});

test("014 adds no scheduler, storage deletion, concrete secret, or identity", () => {
  const source = `${migration014}\n${edgeIndex}\n${worker}`;
  assert.doesNotMatch(source, /\b(cron\.schedule|pg_cron|delete\s+from\s+storage\.objects|update\s+storage\.objects)\b/i);
  assert.doesNotMatch(source, /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/);
  assert.doesNotMatch(source, /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  assert.doesNotMatch(source, /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
});
