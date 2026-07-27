import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDirectory, "../..");
const migration = await readFile(path.join(root, "migrations/013_account_deletion_worker.sql"), "utf8");
const edgeIndex = await readFile(path.join(root, "supabase/functions/finalize-account-deletion/index.ts"), "utf8");
const worker = await readFile(path.join(root, "supabase/functions/finalize-account-deletion/worker.mjs"), "utf8");

test("migration has a service-role-only, skip-locked, three-attempt queue", () => {
  assert.match(migration, /for update skip locked/gi);
  assert.match(migration, /attempt_count between 0 and 3/i);
  assert.match(migration, /v_request\.attempt_count >= 3/i);
  assert.match(migration, /coalesce\(auth\.role\(\), ''\) <> 'service_role'/i);
  assert.match(migration, /revoke all on function public\.taran_claim_account_deletion_job\(\)[\s\S]*from public, anon, authenticated/i);
  assert.match(migration, /grant execute on function public\.taran_claim_account_deletion_job\(\)[\s\S]*to service_role/i);
});

test("migration preserves only intended redacted history and blocks unsafe dependencies", () => {
  for (const relation of [
    "taran_account_deletion_requests",
    "taran_reviews",
    "taran_contributions",
    "taran_point_ledger",
    "taran_reward_redemptions",
    "taran_community_posts",
    "taran_community_comments",
    "taran_inquiry_groups",
    "taran_inquiry_responses",
    "taran_provider_change_requests"
  ]) {
    assert.match(migration, new RegExp(`public\\.${relation.replaceAll("_", "_")}`, "i"));
  }
  assert.match(migration, /on delete set null/i);
  assert.match(migration, /from public\.taran_admin_profiles/i);
  assert.match(migration, /provider\.owner_user_id = v_request\.user_id/i);
  assert.match(migration, /from public\.taran_provider_claims/i);
  assert.match(migration, /from public\.taran_provider_registrations/i);
  assert.match(migration, /bucket_id = 'taran-private-evidence'/i);
  assert.match(migration, /manual_review_required/i);
});

test("completion history has no user identifier or free-text payload columns", () => {
  const table = migration.match(/create table if not exists public\.taran_account_deletion_jobs \(([\s\S]*?)\n\);/i)?.[1];
  assert.ok(table, "job table contract must exist");
  assert.doesNotMatch(table, /\b(user_id|email|phone|payload|error_message|request_id)\b/i);
  assert.match(table, /purge_after timestamptz/i);
  assert.match(migration, /purge_after = now\(\) \+ interval '1 year'/i);
  assert.match(migration, /delete from public\.taran_account_deletion_requests/i);
});

test("migration is rerunnable and does not add a scheduler or storage mutation", () => {
  assert.match(migration, /create table if not exists public\.taran_account_deletion_jobs/i);
  assert.match(migration, /add column if not exists attempt_count/i);
  assert.match(migration, /create unique index if not exists taran_account_deletion_claim_token_idx/i);
  assert.match(migration, /create or replace function public\.taran_claim_account_deletion_job/i);
  assert.doesNotMatch(migration, /\b(cron\.schedule|pg_cron|delete\s+from\s+storage\.objects|update\s+storage\.objects)\b/i);
});

test("Edge Function rejects ordinary clients and masks every public response", () => {
  assert.match(edgeIndex, /request\.method !== "POST"/);
  assert.match(edgeIndex, /secureEqual\(bearer, serviceRoleKey\)/);
  assert.match(edgeIndex, /service_role_required/);
  assert.match(edgeIndex, /cache-control": "no-store"/);
  assert.match(edgeIndex, /error\.status !== 404/);
  assert.doesNotMatch(edgeIndex, /console\.(log|info|warn|error)/);
  assert.doesNotMatch(worker, /console\.(log|info|warn|error)/);
  assert.doesNotMatch(worker, /return\s+claimed/);
});

test("source contains no concrete secret, email, or identity value", () => {
  const source = `${migration}\n${edgeIndex}\n${worker}`;
  assert.doesNotMatch(source, /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/);
  assert.doesNotMatch(source, /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  assert.doesNotMatch(source, /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
});
