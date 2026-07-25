import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const sql = await readFile(
  new URL("../../migrations/008_review_submission_flow.sql", import.meta.url),
  "utf8"
);

assert.match(sql, /create or replace function public\.taran_submit_review\(/i, "Review submission RPC is required.");
assert.match(sql, /v_user uuid := auth\.uid\(\)/i, "The server must derive the review owner from Auth.");
assert.match(sql, /provider\.status = 'published'/i, "Only published providers may receive reviews.");
assert.match(sql, /p_rating < 1 or p_rating > 5/i, "Rating must be validated on the server.");
assert.match(sql, /char_length\(v_content\) < 10[\s\S]*char_length\(v_content\) > 3000/i, "Review length must be validated on the server.");
assert.match(sql, /'pending'\s*\)\s*returning id into v_id/is, "Submitted reviews must be forced to pending.");
assert.match(sql, /A pending review already exists/i, "Duplicate pending reviews must be rejected.");

assert.match(sql, /create or replace function public\.taran_list_pending_reviews\(/i, "Operations need a narrow pending-review queue.");
assert.match(sql, /create or replace function public\.taran_moderate_review\(/i, "Operations need an atomic moderation RPC.");
assert.match(sql, /taran_has_role\(array\['owner','admin','operations'\]\)/i, "Moderation must require an operations role.");
assert.match(sql, /v_status not in \('published', 'hidden'\)/i, "Moderation status must be allowlisted.");
assert.match(sql, /review\.status = 'pending'/i, "Only pending reviews may be moderated.");

assert.match(sql, /revoke all on public\.taran_reviews from anon, authenticated/i, "The base review table must stay closed.");
assert.doesNotMatch(sql, /grant\s+(?:select|insert|update|delete|all)[^;]*taran_reviews[^;]*authenticated/i, "The migration must not reopen the base table.");
assert.match(sql, /grant execute on function public\.taran_submit_review[\s\S]*to authenticated/i, "Only the narrow submission RPC is exposed.");
assert.match(sql, /revoke all on function public\.taran_submit_review[\s\S]*from public, anon/i, "Anonymous submission must remain revoked.");

console.log("Review submission and moderation migration contract passed.");
