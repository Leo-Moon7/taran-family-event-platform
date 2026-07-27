import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const migrationPath = resolve(root, "migrations/015_provider_contribution_quote_v2.sql");
const sql = readFileSync(migrationPath, "utf8");
const normalized = sql.toLowerCase();

const checks = [];
function check(name, fn) {
  fn();
  checks.push(name);
}

function has(pattern, message = String(pattern)) {
  assert.match(normalized, pattern, message);
}

function lacks(pattern, message = String(pattern)) {
  assert.doesNotMatch(normalized, pattern, message);
}

check("additive migration contains only v2 CREATE TABLE targets", () => {
  const created = [...normalized.matchAll(/create table if not exists public\.([a-z0-9_]+)/g)]
    .map((match) => match[1]);
  assert.equal(created.length, 22);
  assert.ok(created.every((name) => name.endsWith("_v2")));
  lacks(/\b(drop|truncate)\s+table\b/);
  const literalAlterTargets = [
    ...normalized.matchAll(/\balter\s+table\s+public\.([a-z0-9_]+)/g),
  ].map((match) => match[1]);
  assert.ok(literalAlterTargets.every((name) => name.endsWith("_v2")));
});

check("legacy vulnerable objects are untouched", () => {
  for (const forbidden of [
    "taran_provider_claims",
    "taran_contributions",
    "taran_review_contribution",
    "taran_update_owned_provider",
    "taran_apply_marketplace_maintenance",
    "business_number",
  ]) {
    assert.equal(normalized.includes(forbidden), false, `${forbidden} must stay untouched`);
  }
});

check("runtime starts fail-closed", () => {
  has(/contribution_enabled boolean not null default false/);
  has(/evidence_upload_enabled boolean not null default false/);
  has(/public_projection_enabled boolean not null default false/);
  has(/allow_exact_amount boolean not null default false/);
  has(/quote contribution is disabled/);
  has(/information contribution is disabled/);
});

check("canonical event taxonomy rejects write aliases", () => {
  has(/event_code in \('kids','parents','meeting','anniversary','other'\)/);
  lacks(/\bsmallwedding\b|\bfamilygathering\b|\bmemorial\b/);
});

check("source, submission, assertion, evidence, review and projection layers exist", () => {
  for (const table of [
    "taran_provider_identities_v2",
    "taran_provider_service_capabilities_v2",
    "taran_submission_cases_v2",
    "taran_submission_fields_v2",
    "taran_field_assertions_v2",
    "taran_evidence_assets_v2",
    "taran_review_cases_v2",
    "taran_review_decisions_v2",
    "taran_quote_cases_v2",
    "taran_quote_prices_v2",
    "taran_quote_line_items_v2",
    "taran_quote_public_projections_v2",
    "taran_quote_access_grants_v2",
    "taran_dispute_cases_v2",
    "taran_legal_holds_v2",
    "taran_deletion_jobs_v2",
    "taran_audit_events_v2",
  ]) {
    assert.ok(normalized.includes(`create table if not exists public.${table}`), table);
  }
});

check("unknown fields are dictionary-gated", () => {
  has(/taran_submission_field_dictionary_v2/);
  has(/unknown or disallowed field/);
  has(/p_source_kind = any\(dictionary\.allowed_sources\)/);
  has(/jsonb_typeof\(p_fields\) <> 'object'/);
});

check("browser roles have no private base-table DML", () => {
  has(/revoke all on table public\.%i from public, anon, authenticated/);
  const browserGrants = [...normalized.matchAll(
    /grant\s+([^;]+?)\s+on\s+(?:table\s+)?public\.([a-z0-9_]+_v2)\s+to\s+([^;]+);/g,
  )];
  assert.deepEqual(browserGrants, []);
});

check("public projection is runtime, state and expiry gated", () => {
  has(/public reads current quote projections v2/);
  has(/publication_state = 'published'/);
  has(/blocked = false/);
  has(/public_until > now\(\)/);
  has(/taran_quote_public_enabled_v2\(\)/);
  has(/taran_list_quote_public_v2/);
});

check("public projection excludes private linkage and evidence columns", () => {
  const start = normalized.indexOf("returns table (\n  projection_id uuid");
  const end = normalized.indexOf("language plpgsql", start);
  const projection = normalized.slice(start, end);
  for (const forbidden of [
    "quote_case_id",
    "contributor_user_id",
    "owner_user_id",
    "submitted_by",
    "object_key",
    "sha256_hex",
    "reviewer_id",
    "exact_amount",
  ]) {
    assert.equal(projection.includes(forbidden), false, forbidden);
  }
  has(/이용자 제공 과거 견적 사례/);
  has(/grant execute on function public\.taran_list_quote_public_v2\(text,text,integer\) to anon, authenticated/);
});

check("no Storage bucket or policy is activated", () => {
  lacks(/storage\.objects|insert into storage\.buckets|create policy[^;]+storage/);
  has(/migration intentionally creates no storage bucket/);
});

check("evidence is server-only, quarantined and preview-gated", () => {
  has(/evidence metadata registration is server-only/);
  has(/scan_state text not null default 'quarantined'/);
  has(/privacy_state text not null default 'pending'/);
  has(/rights_state text not null default 'pending'/);
  has(/p_privacy_state = 'clear'/);
  has(/p_rights_state = 'clear'/);
  has(/content_hmac_hex text not null/);
  lacks(/\bsha256_hex\b/);
  has(/byte_size <= 15728640/);
  has(/delete_after <= created_at \+ interval '90 days'/);
  has(/temporary_upload_24h/);
  has(/delete_after\s*\)\s*values\s*\([\s\S]*now\(\) \+ interval '24 hours'/);
  has(/delete_after = created_at \+ interval '90 days'/);
  assert.ok((
    normalized.match(/delete_after = least\(now\(\) \+ interval '30 days', created_at \+ interval '90 days'\)/g)
    ?? []
  ).length >= 3);
});

check("provider revisions require scoped active grants", () => {
  has(/scope = 'submit_revision'/);
  has(/grant_row\.state = 'active'/);
  has(/grant_row\.expires_at > now\(\)/);
  has(/active provider revision access is required/);
});

check("account deletion tombstone blocks v2 writes and completion", () => {
  has(/taran_guard_account_deletion_v2_user_write/);
  has(/taran_account_deletion_is_active\(v_old_user\)/);
  has(/taran_queue_account_deletion_v2/);
  has(/taran_require_account_deletion_v2_complete/);
  has(/v2 deletion targets must complete before account deletion/);
  has(/evidence_asset_id, account_deletion_request_id/);
});

check("append-only history permits only account-deletion FK unlink", () => {
  has(/taran_reject_v2_history_mutation\('reviewer_id'\)/);
  has(/taran_reject_v2_history_mutation\('actor_user_id'\)/);
  has(/\(v_new - v_subject_column\) = \(v_old - v_subject_column\)/);
  has(/taran_account_deletion_is_active\(v_old_user\)/);
});

check("provider identity matching and versioned HMAC precede uniqueness", () => {
  has(/provider_match_state text not null default 'pending'/);
  has(/fingerprint_hmac text/);
  has(/taran_record_quote_fingerprint_v2/);
  has(/taran_mark_quote_provider_match_v2/);
  has(/matched provider and versioned fingerprint are required before uniqueness/);
  has(/taran_quote_cases_v2_unique_fingerprint_idx/);
  has(/on public\.taran_quote_cases_v2\(fingerprint_key_version, fingerprint_hmac\)/);
  has(/where duplicate_state = 'unique'/);
  has(/active provider accounts must use the provider-source path and cannot receive customer quote rewards/);
});

check("operations mutations require AAL2", () => {
  has(/create or replace function public\.taran_is_aal2_v2/);
  has(/auth\.jwt\(\)->>'aal'/);
  assert.ok((normalized.match(/not public\.taran_is_aal2_v2\(\)/g) ?? []).length >= 8);
});

check("quote approval locks review, submission, quote and price", () => {
  const approvalStart = normalized.indexOf("create or replace function public.taran_decide_quote_v2");
  const approvalEnd = normalized.indexOf("create or replace function public.taran_get_submission_status_v2");
  const approval = normalized.slice(approvalStart, approvalEnd);
  assert.ok((approval.match(/for update/g) ?? []).length >= 5);
  assert.match(approval, /self-review is prohibited/);
  assert.match(approval, /only a quote marked unique may be approved/);
  assert.match(approval, /approved quotes require reviewable evidence/);
  assert.match(approval, /pending_independent_review/);
  assert.match(approval, /v_approved_review_count < v_review\.required_review_count/);
});

check("approval atomically creates decision, projection, grant, outbox and audit", () => {
  const approvalStart = normalized.indexOf("create or replace function public.taran_decide_quote_v2");
  const approvalEnd = normalized.indexOf("create or replace function public.taran_get_submission_status_v2");
  const approval = normalized.slice(approvalStart, approvalEnd);
  for (const target of [
    "insert into public.taran_review_decisions_v2",
    "insert into public.taran_quote_public_projections_v2",
    "insert into public.taran_quote_access_grants_v2",
    "insert into public.taran_quote_outbox_v2",
    "insert into public.taran_audit_events_v2",
  ]) {
    assert.ok(approval.includes(target), target);
  }
  assert.match(approval, /idempotent_replay/);
});

check("exact display is separately gated and source is not current price", () => {
  has(/p_display_mode = 'exact' and not v_config\.allow_exact_amount/);
  has(/never current price, average, rank/);
  lacks(/average_amount|popularity_score|ranking_score/);
});

check("access grants have server-time bounds", () => {
  has(/expires_at <= starts_at \+ interval '365 days'/);
  has(/now\(\) \+ interval '180 days'/);
  has(/access_grant_180d_365d_max/);
});

check("withdrawal and dispute block public access first", () => {
  const withdrawal = normalized.slice(
    normalized.indexOf("create or replace function public.taran_withdraw_submission_v2"),
    normalized.indexOf("create or replace function public.taran_open_quote_dispute_v2"),
  );
  assert.match(withdrawal, /publication_state = 'withdrawn', blocked = true/);
  assert.match(withdrawal, /insert into public\.taran_deletion_jobs_v2/);
  const dispute = normalized.slice(
    normalized.indexOf("create or replace function public.taran_open_quote_dispute_v2"),
    normalized.indexOf("create or replace function public.taran_resolve_quote_dispute_v2"),
  );
  assert.match(dispute, /set blocked = true/);
  assert.doesNotMatch(dispute, /taran_quote_access_grants_v2|taran_deletion_jobs_v2/);
  const resolution = normalized.slice(
    normalized.indexOf("create or replace function public.taran_resolve_quote_dispute_v2"),
    normalized.indexOf("create or replace function public.taran_set_quote_legal_hold_v2"),
  );
  assert.match(resolution, /taran_quote_access_grants_v2/);
  assert.match(resolution, /taran_deletion_jobs_v2/);
  assert.match(resolution, /dispute resolution requires an independent operations reviewer/);
  assert.match(resolution, /decision_row\.reviewer_id = auth\.uid\(\)/);
  assert.match(resolution, /p_resolution_reason not in/);
  assert.match(resolution, /'claim_not_supported','other_reviewed'/);
});

check("deletion cannot complete with failed targets", () => {
  for (const target of [
    "database_private",
    "storage_original",
    "storage_preview",
    "ocr_derivative",
    "cache_manifest",
    "queue_payload",
    "export_copy",
    "backup_expiry",
    "restore_tombstone",
  ]) {
    assert.ok(normalized.includes(`'${target}'`), target);
  }
  has(/required_targets <@ v_job\.completed_targets/);
  has(/cardinality\(v_job\.failed_targets\) = 0/);
  has(/when v_complete then 'completed'/);
  has(/when p_succeeded then 'running' else 'partial_failure'/);
  has(/delete from public\.taran_quote_prices_v2/);
  has(/delete from public\.taran_evidence_assets_v2/);
  has(/delete from public\.taran_submission_fields_v2/);
  has(/delete from public\.taran_quote_cases_v2/);
});

check("history tables are append-only", () => {
  has(/taran_review_decisions_v2_append_only/);
  has(/taran_audit_events_v2_append_only/);
  has(/before update or delete/);
});

check("security-definer functions pin search_path and private row security", () => {
  const securityDefiners = normalized.match(/security definer/g) ?? [];
  const pinned = normalized.match(/set search_path = public, pg_catalog/g) ?? [];
  const rlsOff = normalized.match(/set row_security = off/g) ?? [];
  assert.ok(securityDefiners.length >= 11);
  assert.ok(pinned.length >= securityDefiners.length);
  assert.ok(rlsOff.length >= 11);
});

check("server-only functions are not granted to browser roles", () => {
  for (const signature of [
    "taran_register_evidence_metadata_v2(uuid,text,text,text,bigint,text)",
    "taran_record_evidence_scan_v2(uuid,text,text,text,text,text)",
    "taran_record_deletion_target_v2(uuid,text,boolean,text)",
  ]) {
    assert.ok(normalized.includes(`revoke all on function public.${signature} from public, anon, authenticated`));
    assert.equal(normalized.includes(`grant execute on function public.${signature} to authenticated`), false);
    assert.ok(normalized.includes(`grant execute on function public.${signature} to service_role`));
  }
});

check("retention policies are explicit and separated", () => {
  for (const code of [
    "temporary_upload_24h",
    "raw_evidence_30d_90d_max",
    "information_submission_180d",
    "quote_case_private_24m",
    "public_quote_24m",
    "access_grant_180d_365d_max",
    "access_history_3y",
    "deletion_proof_1y",
    "backup_30d",
  ]) {
    assert.ok(normalized.includes(`'${code}'`), code);
  }
  has(/retention\.subject_kind = 'information_submission'/);
});

check("old quotes are accepted as ineligible without benefit", () => {
  has(/p_occurred_on < current_date - interval '10 years'/);
  has(/v_reward_eligible := p_occurred_on >= current_date - interval '24 months'/);
  has(/case when v_reward_eligible then 'pending' else 'ineligible' end/);
  has(/case when v_reward_eligible then 'pending_review' else 'ineligible_no_reward' end/);
});

check("legal holds are scoped and stop deletion", () => {
  has(/create table if not exists public\.taran_legal_holds_v2/);
  has(/basis_code text not null/);
  has(/scope_note text not null/);
  has(/review_at timestamptz not null/);
  has(/legal_hold_active/);
});

console.log(JSON.stringify({
  suite: "BE-019 migration contract",
  migration: "015_provider_contribution_quote_v2.sql",
  checks: checks.length,
  passed: checks.length,
  networkEgressCount: 0,
  realDataCount: 0,
}, null, 2));
