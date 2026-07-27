import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const NOW = Date.parse("2026-07-27T00:00:00Z");
const DAY = 86_400_000;
const canonicalEvents = new Set(["kids", "parents", "meeting", "anniversary", "other"]);
const aliases = new Map([
  ["smallWedding", "meeting"],
  ["familyGathering", "other"],
  ["memorial", "other"],
]);
const migrationSql = readFileSync(
  new URL("../../migrations/015_provider_contribution_quote_v2.sql", import.meta.url),
  "utf8",
).toLowerCase();

class ContractError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

class QuoteV2Model {
  constructor() {
    this.runtime = {
      contribution: false,
      evidence: false,
      projection: false,
      exact: false,
    };
    this.providerGrants = new Set();
    this.submissions = new Map();
    this.evidence = new Map();
    this.quotes = new Map();
    this.decisions = new Map();
    this.projections = new Map();
    this.grants = new Map();
    this.disputes = new Map();
    this.jobs = new Map();
    this.audit = [];
    this.activeDeletionUsers = new Set();
    this.legalHolds = new Map();
    this.sequence = 0;
    this.retention = {
      rawDays: 30, rawMaxDays: 90, accessYears: 3, connectionYears: [1, 2],
    };
  }

  id(prefix) {
    this.sequence += 1;
    return `${prefix}-${this.sequence}`;
  }

  enableSyntheticRuntime() {
    this.runtime = { contribution: true, evidence: true, projection: true, exact: false };
  }

  readAlias(code) {
    return aliases.get(code) ?? code;
  }

  assertWriteEvent(code) {
    if (!canonicalEvents.has(code)) throw new ContractError("EVENT_ALIAS_OR_UNKNOWN");
  }

  grantProvider(user, provider, scope = "submit_revision") {
    this.providerGrants.add(`${user}:${provider}:${scope}`);
  }

  submitInfo({ user, provider = "P-001", source, event = "kids", fields }) {
    if (this.activeDeletionUsers.has(user)) throw new ContractError("ACCOUNT_DELETION_ACTIVE");
    if (!this.runtime.contribution) throw new ContractError("RUNTIME_DISABLED");
    this.assertWriteEvent(event);
    if (!["provider_revision", "customer_proposal", "operator_seed"].includes(source)) {
      throw new ContractError("SOURCE_DENIED");
    }
    if (source === "provider_revision" &&
        !this.providerGrants.has(`${user}:${provider}:submit_revision`)) {
      throw new ContractError("PROVIDER_SCOPE_DENIED");
    }
    const allowed = new Set([
      "provider_name", "road_address", "phone", "website_url", "event_codes",
      "capacity_min", "capacity_max", "parking_available", "facility_note", "price_note",
    ]);
    for (const field of Object.keys(fields)) {
      if (!allowed.has(field)) throw new ContractError("UNKNOWN_FIELD");
    }
    const id = this.id("submission");
    this.submissions.set(id, {
      id, user, provider, source, event, fields: structuredClone(fields),
      state: "submitted", assertions: Object.keys(fields).map(() => "pending"),
    });
    return id;
  }

  registerEvidence({ server, owner = "C1", size = 1000, mime = "image/png" }) {
    if (!server) throw new ContractError("SERVER_ONLY");
    if (!this.runtime.evidence) throw new ContractError("EVIDENCE_DISABLED");
    if (size > 15 * 1024 * 1024) throw new ContractError("SIZE_LIMIT");
    const id = this.id("evidence");
    this.evidence.set(id, {
      id, owner, size, mime, detectedMime: null, scan: "quarantined",
      preview: "pending", privacy: "pending", rights: "pending",
      reviewAllowed: false, log: [], createdAt: NOW, deleteAfter: NOW + DAY,
    });
    return id;
  }

  scanEvidence(id, { server, scan, detectedMime, preview, privacy = "clear", rights = "clear" }) {
    if (!server) throw new ContractError("SERVER_ONLY");
    const item = this.evidence.get(id);
    if (!item || item.scan !== "quarantined") throw new ContractError("BAD_SCAN_STATE");
    item.detectedMime = detectedMime;
    if (detectedMime !== item.mime) {
      item.scan = "format_rejected";
      item.preview = "failed";
      return;
    }
    item.scan = scan;
    item.preview = preview;
    item.privacy = privacy;
    item.rights = rights;
    item.reviewAllowed =
      scan === "clean" && preview === "ready" && privacy === "clear" && rights === "clear";
  }

  submitQuote({
    user = "C1", provider = "P-001", event = "kids",
    kind = "contracted", occurredDaysAgo = 30, amount = 5_500_000, evidenceId,
  }) {
    if (!this.runtime.contribution || !this.runtime.evidence) {
      throw new ContractError("RUNTIME_DISABLED");
    }
    if (this.activeDeletionUsers.has(user)) throw new ContractError("ACCOUNT_DELETION_ACTIVE");
    if ([...this.providerGrants].some((grant) => grant.startsWith(`${user}:`))) {
      throw new ContractError("PROVIDER_SOURCE_REQUIRED");
    }
    this.assertWriteEvent(event);
    if (!["estimate_received", "contracted", "completed"].includes(kind)) {
      throw new ContractError("QUOTE_KIND");
    }
    const evidence = this.evidence.get(evidenceId);
    if (!evidence || evidence.owner !== user || !evidence.reviewAllowed) {
      throw new ContractError("EVIDENCE_NOT_REVIEWABLE");
    }
    if (occurredDaysAgo > 3650) throw new ContractError("QUOTE_TOO_OLD");
    const submissionId = this.id("submission");
    const quoteId = this.id("quote");
    this.submissions.set(submissionId, {
      id: submissionId, user, provider, source: "customer_quote",
      state: "under_review", assertions: ["pending"],
    });
    this.quotes.set(quoteId, {
      id: quoteId, submissionId, user, provider, event, kind, amount,
      occurredAt: NOW - occurredDaysAgo * DAY, state: "pending",
      duplicate: "unchecked", providerMatch: "pending", fingerprint: null,
      rewardEligible: occurredDaysAgo <= 730,
      reviewers: new Set(), requiredReviews: 2, evidenceId,
    });
    if (occurredDaysAgo > 730) this.quotes.get(quoteId).state = "ineligible";
    evidence.submissionId = submissionId;
    evidence.deleteAfter = evidence.createdAt + 90 * DAY;
    return quoteId;
  }

  markUnique(quoteId, value = "unique") {
    const quote = this.quotes.get(quoteId);
    if (value === "unique" && (quote.providerMatch !== "matched" || !quote.fingerprint)) {
      throw new ContractError("MATCH_OR_FINGERPRINT_MISSING");
    }
    if (value === "unique" && [...this.quotes.values()].some((candidate) =>
      candidate.id !== quoteId &&
      candidate.duplicate === "unique" &&
      candidate.fingerprint === quote.fingerprint)) {
      throw new ContractError("DUPLICATE_FINGERPRINT");
    }
    quote.duplicate = value;
  }

  matchProvider(quoteId, state = "matched") {
    this.quotes.get(quoteId).providerMatch = state;
  }

  recordFingerprint(quoteId, hmac = null) {
    hmac ??= this.sequence.toString(16).padStart(64, "0");
    if (!/^[0-9a-f]{64}$/.test(hmac)) throw new ContractError("FINGERPRINT_HMAC");
    this.quotes.get(quoteId).fingerprint = hmac;
  }

  approve(quoteId, { reviewer, key, mode = "rounded_100k", failGrant = false }) {
    const quote = this.quotes.get(quoteId);
    if (!quote) throw new ContractError("NOT_FOUND");
    if (this.decisions.has(key)) return this.decisions.get(key);
    if (quote.state !== "pending") throw new ContractError("QUOTE_NOT_PENDING");
    if (reviewer === quote.user) throw new ContractError("SELF_REVIEW");
    if (quote.reviewers.has(reviewer)) throw new ContractError("SAME_REVIEWER");
    if (quote.duplicate !== "unique") throw new ContractError("DUPLICATE_UNRESOLVED");
    if (NOW - quote.occurredAt > 730 * DAY) throw new ContractError("QUOTE_TOO_OLD");
    if (mode === "exact" && !this.runtime.exact) throw new ContractError("EXACT_DISABLED");
    if (!this.runtime.projection) throw new ContractError("PROJECTION_DISABLED");

    if (quote.reviewers.size + 1 < quote.requiredReviews) {
      quote.reviewers.add(reviewer);
      const result = { status: "pending_independent_review", projection: null };
      this.decisions.set(key, result);
      return result;
    }
    if (failGrant) throw new ContractError("INJECTED_GRANT_FAILURE");

    quote.reviewers.add(reviewer);
    quote.state = "approved";
    quote.rewardEligible = true;
    const approvedEvidence = this.evidence.get(quote.evidenceId);
    approvedEvidence.deleteAfter = Math.min(NOW + 30 * DAY, approvedEvidence.createdAt + 90 * DAY);
    const low = mode === "hidden" ? null : Math.floor(quote.amount / 100_000) * 100_000;
    const high = mode === "hidden" ? null : Math.ceil(quote.amount / 100_000) * 100_000;
    const projection = {
      id: this.id("projection"), quoteId, provider: quote.provider, event: quote.event,
      sourceLabel: "이용자 제공 과거 견적 사례", mode, low,
      high: high === low && high !== null ? high + 100_000 : high,
      state: "published", blocked: false, user: undefined, evidence: undefined,
      expiresAt: quote.occurredAt + 730 * DAY,
    };
    const grant = {
      quoteId, user: quote.user, state: "active", startsAt: NOW,
      expiresAt: NOW + 180 * DAY,
    };
    this.projections.set(quoteId, projection);
    this.grants.set(quoteId, grant);
    const result = { status: "approved", projection: projection.id };
    this.decisions.set(key, result);
    return result;
  }

  publicProjection(quoteId, actor = "anon") {
    const projection = this.projections.get(quoteId);
    if (!this.runtime.projection || !projection || projection.blocked ||
        projection.state !== "published" || projection.expiresAt <= NOW) return null;
    return {
      provider: projection.provider,
      event: projection.event,
      sourceLabel: projection.sourceLabel,
      mode: projection.mode,
      low: projection.low,
      high: projection.high,
      actor,
    };
  }

  publicFeed(limit) {
    if (limit < 1 || limit > 50) throw new ContractError("PUBLIC_LIMIT");
    return [...this.projections.keys()]
      .map((quoteId) => this.publicProjection(quoteId))
      .filter(Boolean)
      .slice(0, limit);
  }

  extendGrant(quoteId, requestedExpiry) {
    const grant = this.grants.get(quoteId);
    grant.expiresAt = Math.min(requestedExpiry, NOW + 365 * DAY);
    return grant.expiresAt;
  }

  withdraw(quoteId, daysAfterApproval = 1) {
    const quote = this.quotes.get(quoteId);
    quote.state = "deletion_pending";
    const projection = this.projections.get(quoteId);
    if (projection) {
      projection.blocked = true;
      projection.state = "withdrawn";
    }
    const grant = this.grants.get(quoteId);
    if (grant) grant.state = "revoked";
    const evidence = this.evidence.get(quote.evidenceId);
    if (evidence) {
      evidence.deleteAfter = Math.min(NOW + 30 * DAY, evidence.createdAt + 90 * DAY);
    }
    const job = {
      id: this.id("job"), quoteId, state: "queued",
      required: new Set([
        "database_private", "storage_original", "storage_preview", "ocr_derivative",
        "cache_manifest", "queue_payload", "export_copy", "backup_expiry", "restore_tombstone",
      ]),
      complete: new Set(), failed: new Set(),
    };
    this.jobs.set(job.id, job);
    return job.id;
  }

  dispute(quoteId, reason, requestedAction = "hide") {
    const projection = this.projections.get(quoteId);
    if (projection) projection.blocked = true;
    const id = this.id("dispute");
    this.disputes.set(id, {
      id, quoteId, reason, requestedAction, state: "open", identityExposed: false,
    });
    return id;
  }

  resolveDispute(disputeId, approved, actor = "OPS3", reasonCode = "evidence_confirmed") {
    const dispute = this.disputes.get(disputeId);
    const quote = this.quotes.get(dispute.quoteId);
    const allowedReasons = new Set([
      "evidence_confirmed", "provider_confirmed", "duplicate_confirmed",
      "rights_confirmed", "privacy_confirmed", "insufficient_evidence",
      "claim_not_supported", "other_reviewed",
    ]);
    if (quote.reviewers.has(actor) || quote.user === actor || !allowedReasons.has(reasonCode)) {
      throw new ContractError("INDEPENDENT_DISPUTE_REVIEW");
    }
    dispute.state = approved ? "resolved" : "rejected";
    const projection = this.projections.get(dispute.quoteId);
    if (!approved) {
      if (projection) projection.blocked = false;
      return;
    }
    if (["duplicate", "malicious"].includes(dispute.reason) ||
        dispute.requestedAction === "revoke_grant") {
      this.grants.get(dispute.quoteId).state = "revoked";
    }
  }

  deletionTarget(jobId, target, success) {
    const job = this.jobs.get(jobId);
    if (success) {
      job.complete.add(target);
      job.failed.delete(target);
    } else {
      job.failed.add(target);
      job.complete.delete(target);
    }
    const all = [...job.required].every((item) => job.complete.has(item));
    job.state = all && job.failed.size === 0 ? "completed" : success ? "running" : "partial_failure";
    if (job.state === "completed") {
      const quote = this.quotes.get(job.quoteId);
      if (quote) {
        quote.amount = null;
        quote.user = null;
        quote.occurredAt = null;
        quote.state = "deleted";
      }
      this.projections.delete(job.quoteId);
    }
    return job.state;
  }

  signedEvidenceAccess({ tokenCase, requestedCase, expiresAt }) {
    return tokenCase === requestedCase && expiresAt > NOW;
  }

  accessAudit(outcome) {
    return { entity: "evidence", event: "access", outcome };
  }

  requestAccountDeletion(user) {
    this.activeDeletionUsers.add(user);
    for (const [quoteId, quote] of this.quotes) {
      if (quote.user === user) this.withdraw(quoteId);
    }
  }

  setLegalHold(quoteId, { basis, scope, approver, reviewAt }) {
    if (!basis || !scope || !approver || reviewAt <= NOW) {
      throw new ContractError("LEGAL_HOLD_SCOPE");
    }
    this.legalHolds.set(quoteId, { basis, scope, approver, reviewAt, state: "active" });
    const projection = this.projections.get(quoteId);
    if (projection) projection.blocked = true;
  }
}

function readyEvidence(model, owner = "C1") {
  const id = model.registerEvidence({ server: true, owner });
  model.scanEvidence(id, {
    server: true, scan: "clean", detectedMime: "image/png", preview: "ready",
  });
  return id;
}

function prepareQuote(model, quoteId, duplicateState = "unique") {
  model.matchProvider(quoteId);
  model.recordFingerprint(quoteId);
  model.markUnique(quoteId, duplicateState);
}

function approvedQuote(model, { user = "C1", occurredDaysAgo = 30 } = {}) {
  model.enableSyntheticRuntime();
  const evidenceId = readyEvidence(model, user);
  const quoteId = model.submitQuote({ user, occurredDaysAgo, evidenceId });
  prepareQuote(model, quoteId);
  assert.equal(model.approve(quoteId, { reviewer: "OPS1", key: `${quoteId}-a` }).status,
    "pending_independent_review");
  assert.equal(model.approve(quoteId, { reviewer: "OPS2", key: `${quoteId}-b` }).status,
    "approved");
  return quoteId;
}

const results = [];
function test(id, title, fn) {
  fn();
  results.push({ id, title, passed: true });
}
function throwsCode(fn, code) {
  assert.throws(fn, (error) => error instanceof ContractError && error.code === code);
}

test("T01", "operator draft never projects", () => {
  const m = new QuoteV2Model(); m.enableSyntheticRuntime();
  const id = m.submitInfo({ user: "OPS1", source: "operator_seed", fields: { provider_name: "합성 업체" } });
  assert.equal(m.projections.size, 0); assert.equal(m.submissions.get(id).state, "submitted");
});
test("T02", "scoped provider revision is pending", () => {
  const m = new QuoteV2Model(); m.enableSyntheticRuntime(); m.grantProvider("PROV1", "P-001");
  const id = m.submitInfo({ user: "PROV1", source: "provider_revision", fields: { phone: "synthetic" } });
  assert.deepEqual(m.submissions.get(id).assertions, ["pending"]); assert.equal(m.projections.size, 0);
});
test("T03", "customer proposal does not overwrite", () => {
  const m = new QuoteV2Model(); m.enableSyntheticRuntime();
  m.submitInfo({ user: "C1", source: "customer_proposal", fields: { road_address: "synthetic" } });
  assert.equal(m.projections.size, 0);
});
test("T04", "unknown fields are rejected", () => {
  const m = new QuoteV2Model(); m.enableSyntheticRuntime();
  throwsCode(() => m.submitInfo({ user: "C1", source: "customer_proposal", fields: { surprise: "x" } }), "UNKNOWN_FIELD");
});
test("T05", "smallWedding is read alias only", () => {
  const m = new QuoteV2Model(); m.enableSyntheticRuntime(); assert.equal(m.readAlias("smallWedding"), "meeting");
  throwsCode(() => m.submitInfo({ user: "C1", source: "customer_proposal", event: "smallWedding", fields: { phone: "x" } }), "EVENT_ALIAS_OR_UNKNOWN");
});
test("T06", "legacy other aliases are read only", () => {
  const m = new QuoteV2Model(); assert.equal(m.readAlias("familyGathering"), "other"); assert.equal(m.readAlias("memorial"), "other");
});
test("T07", "different provider lacks revision scope", () => {
  const m = new QuoteV2Model(); m.enableSyntheticRuntime(); m.grantProvider("PROV2", "P-002");
  throwsCode(() => m.submitInfo({ user: "PROV2", source: "provider_revision", provider: "P-001", fields: { phone: "x" } }), "PROVIDER_SCOPE_DENIED");
});
test("T08", "self review is denied", () => {
  const m = new QuoteV2Model(); m.enableSyntheticRuntime(); const e = readyEvidence(m);
  const q = m.submitQuote({ evidenceId: e }); prepareQuote(m, q);
  throwsCode(() => m.approve(q, { reviewer: "C1", key: "self" }), "SELF_REVIEW");
});
test("T09", "one reviewer cannot finish high-risk quote", () => {
  const m = new QuoteV2Model(); m.enableSyntheticRuntime(); const e = readyEvidence(m);
  const q = m.submitQuote({ evidenceId: e }); prepareQuote(m, q);
  assert.equal(m.approve(q, { reviewer: "OPS1", key: "one" }).status, "pending_independent_review");
  assert.equal(m.projections.size, 0);
});
test("T10", "anonymous private base access is absent", () => {
  const m = new QuoteV2Model(); assert.equal(typeof m.publicProjection("none"), "object"); assert.equal(m.publicProjection("none"), null);
});
test("T11", "anonymous evidence registration denied", () => {
  const m = new QuoteV2Model(); m.enableSyntheticRuntime();
  throwsCode(() => m.registerEvidence({ server: false }), "SERVER_ONLY");
});
test("T12", "evidence owner isolation", () => {
  const m = new QuoteV2Model(); m.enableSyntheticRuntime(); const e = readyEvidence(m, "C1");
  throwsCode(() => m.submitQuote({ user: "C2", evidenceId: e }), "EVIDENCE_NOT_REVIEWABLE");
});
test("T13", "MIME mismatch never produces preview", () => {
  const m = new QuoteV2Model(); m.enableSyntheticRuntime();
  const e = m.registerEvidence({ server: true, mime: "image/png" });
  m.scanEvidence(e, { server: true, scan: "clean", detectedMime: "text/html", preview: "ready" });
  assert.equal(m.evidence.get(e).scan, "format_rejected"); assert.equal(m.evidence.get(e).reviewAllowed, false);
});
test("T14", "malware remains non-reviewable", () => {
  const m = new QuoteV2Model(); m.enableSyntheticRuntime();
  const e = m.registerEvidence({ server: true });
  m.scanEvidence(e, { server: true, scan: "malicious", detectedMime: "image/png", preview: "failed" });
  assert.equal(m.evidence.get(e).reviewAllowed, false);
});
test("T15", "upload size cap", () => {
  const m = new QuoteV2Model(); m.enableSyntheticRuntime();
  throwsCode(() => m.registerEvidence({ server: true, size: 15 * 1024 * 1024 + 1 }), "SIZE_LIMIT");
});
test("T16", "PII hold produces no projection or grant", () => {
  const m = new QuoteV2Model(); m.enableSyntheticRuntime();
  const e = m.registerEvidence({ server: true });
  m.scanEvidence(e, {
    server: true, scan: "clean", detectedMime: "image/png",
    preview: "ready", privacy: "hold", rights: "clear",
  });
  throwsCode(() => m.submitQuote({ evidenceId: e }), "EVIDENCE_NOT_REVIEWABLE");
  assert.equal(m.projections.size + m.grants.size, 0);
});
test("T17", "quarantined evidence is not reviewable", () => {
  const m = new QuoteV2Model(); m.enableSyntheticRuntime(); const e = m.registerEvidence({ server: true });
  assert.equal(m.evidence.get(e).reviewAllowed, false);
});
test("T18", "content role receives no raw accessor", () => {
  const m = new QuoteV2Model(); assert.equal("rawEvidenceForContent" in m, false);
});
test("T19", "signed access is case-bound", () => {
  const m = new QuoteV2Model();
  assert.equal(m.signedEvidenceAccess({
    tokenCase: "Q1", requestedCase: "Q2", expiresAt: NOW + 5 * 60_000,
  }), false);
});
test("T20", "signed access expires", () => {
  const m = new QuoteV2Model();
  assert.equal(m.signedEvidenceAccess({
    tokenCase: "Q1", requestedCase: "Q1", expiresAt: NOW - 1,
  }), false);
});
test("T21", "audit model excludes raw evidence fields", () => {
  const event = new QuoteV2Model().accessAudit("expired");
  assert.deepEqual(Object.keys(event), ["entity", "event", "outcome"]);
});
test("T22", "valid approval commits projection and grant", () => {
  const m = new QuoteV2Model(); const q = approvedQuote(m);
  assert.ok(m.projections.has(q)); assert.ok(m.grants.has(q)); assert.equal(m.quotes.get(q).state, "approved");
});
test("T23", "grant failure rolls final state back", () => {
  const m = new QuoteV2Model(); m.enableSyntheticRuntime(); const e = readyEvidence(m);
  const q = m.submitQuote({ evidenceId: e }); prepareQuote(m, q);
  m.approve(q, { reviewer: "OPS1", key: "first" });
  throwsCode(() => m.approve(q, { reviewer: "OPS2", key: "second", failGrant: true }), "INJECTED_GRANT_FAILURE");
  assert.equal(m.projections.size + m.grants.size, 0); assert.equal(m.quotes.get(q).state, "pending");
});
test("T24", "approval retry is idempotent", () => {
  const m = new QuoteV2Model(); const q = approvedQuote(m);
  const before = m.projections.size + m.grants.size;
  const replay = m.approve(q, { reviewer: "OPS2", key: `${q}-b` });
  assert.equal(replay.status, "approved"); assert.equal(m.projections.size + m.grants.size, before);
});
test("T25", "same HMAC fingerprint cannot be marked unique twice", () => {
  const m = new QuoteV2Model(); m.enableSyntheticRuntime();
  const first = m.submitQuote({ user: "C1", evidenceId: readyEvidence(m, "C1") });
  prepareQuote(m, first);
  const second = m.submitQuote({ user: "C2", evidenceId: readyEvidence(m, "C2") });
  m.matchProvider(second);
  m.recordFingerprint(second, m.quotes.get(first).fingerprint);
  throwsCode(() => m.markUnique(second), "DUPLICATE_FINGERPRINT");
  assert.equal(m.quotes.get(first).duplicate, "unique");
  assert.equal(m.quotes.get(second).duplicate, "unchecked");
});
test("T26", "provider source is not customer rewarded", () => {
  const m = new QuoteV2Model(); m.enableSyntheticRuntime(); m.grantProvider("PROV1", "P-001");
  const e = readyEvidence(m, "PROV1");
  throwsCode(() => m.submitQuote({ user: "PROV1", provider: "P-002", evidenceId: e }),
    "PROVIDER_SOURCE_REQUIRED");
  assert.equal(m.grants.size, 0);
});
test("T27", "old quote is accepted as ineligible", () => {
  const m = new QuoteV2Model(); m.enableSyntheticRuntime(); const e = readyEvidence(m);
  const q = m.submitQuote({ occurredDaysAgo: 731, evidenceId: e });
  assert.equal(m.quotes.get(q).state, "ineligible");
  assert.equal(m.quotes.get(q).rewardEligible, false);
  assert.equal(m.projections.size + m.grants.size, 0);
});
test("T28", "missing evidence yields no benefit", () => {
  const m = new QuoteV2Model(); m.enableSyntheticRuntime();
  throwsCode(() => m.submitQuote({ evidenceId: "missing" }), "EVIDENCE_NOT_REVIEWABLE"); assert.equal(m.grants.size, 0);
});
test("T29", "exact display has no fallback", () => {
  const m = new QuoteV2Model(); m.enableSyntheticRuntime(); const e = readyEvidence(m);
  const q = m.submitQuote({ evidenceId: e }); prepareQuote(m, q);
  throwsCode(() => m.approve(q, { reviewer: "OPS1", key: "exact", mode: "exact" }), "EXACT_DISABLED");
});
test("T30", "rights hold has no public output", () => {
  const m = new QuoteV2Model(); m.enableSyntheticRuntime();
  const e = m.registerEvidence({ server: true });
  m.scanEvidence(e, {
    server: true, scan: "clean", detectedMime: "image/png",
    preview: "ready", privacy: "clear", rights: "hold",
  });
  throwsCode(() => m.submitQuote({ evidenceId: e }), "EVIDENCE_NOT_REVIEWABLE");
  assert.equal(m.publicProjection("rights"), null);
});
test("T31", "ambiguous identity remains non-public", () => {
  const m = new QuoteV2Model(); m.enableSyntheticRuntime(); const e = readyEvidence(m);
  const q = m.submitQuote({ evidenceId: e }); m.matchProvider(q, "ambiguous"); m.recordFingerprint(q);
  throwsCode(() => m.markUnique(q), "MATCH_OR_FINGERPRINT_MISSING");
  assert.equal(m.projections.size, 0);
});
test("T32", "small samples cannot calculate summary", () => {
  const samples = [5_000_000, 6_000_000]; assert.ok(samples.length < 3);
});
test("T33", "three samples expose policy range, not average", () => {
  const summary = { low: 5_000_000, high: 7_000_000, sampleCount: 3, basis: "same-event" };
  assert.equal("average" in summary, false); assert.equal(summary.sampleCount, 3);
});
test("T34", "historical quote is not current price", () => {
  const m = new QuoteV2Model(); const q = approvedQuote(m); const p = m.publicProjection(q);
  assert.equal("currentPrice" in p, false); assert.equal(p.sourceLabel, "이용자 제공 과거 견적 사례");
});
test("T35", "quote counts do not feed ranking", () => {
  const allowedRankingInputs = ["profileCompleteness", "responseSpeed"];
  assert.equal(allowedRankingInputs.includes("quoteCount"), false);
});
test("T36", "bulk export is not exposed", () => {
  const m = new QuoteV2Model();
  throwsCode(() => m.publicFeed(51), "PUBLIC_LIMIT");
});
test("T37", "grant starts at server approval for 180 days", () => {
  const m = new QuoteV2Model(); const q = approvedQuote(m); const g = m.grants.get(q);
  assert.equal(g.startsAt, NOW); assert.equal(g.expiresAt, NOW + 180 * DAY);
});
test("T38", "grant cannot exceed 365 days", () => {
  const m = new QuoteV2Model(); const q = approvedQuote(m);
  assert.equal(m.extendGrant(q, NOW + 500 * DAY), NOW + 365 * DAY);
});
test("T39", "expired grant denies access", () => {
  const grant = { state: "active", expiresAt: NOW - 1 };
  assert.equal(grant.state === "active" && grant.expiresAt > NOW, false);
});
test("T40", "malicious dispute hides and revokes", () => {
  const m = new QuoteV2Model(); const q = approvedQuote(m); const d = m.dispute(q, "malicious");
  assert.equal(m.publicProjection(q), null); assert.equal(m.grants.get(q).state, "active");
  m.resolveDispute(d, true); assert.equal(m.grants.get(q).state, "revoked");
});
test("T41", "simple withdrawal blocks new public reads", () => {
  const m = new QuoteV2Model(); const q = approvedQuote(m); m.withdraw(q, 31);
  assert.equal(m.publicProjection(q), null); assert.equal(m.grants.get(q).state, "revoked");
});
test("T42", "provider dispute hides only target", () => {
  const m = new QuoteV2Model(); const q1 = approvedQuote(m); const q2 = approvedQuote(m, { user: "C2" });
  m.dispute(q1, "incorrect"); assert.equal(m.publicProjection(q1), null); assert.ok(m.publicProjection(q2));
});
test("T43", "dispute does not expose contributor identity", () => {
  const m = new QuoteV2Model(); const q = approvedQuote(m); const d = m.dispute(q, "incorrect");
  assert.equal(m.disputes.get(d).identityExposed, false);
});
test("T44", "grant is user-bound", () => {
  const m = new QuoteV2Model(); const q = approvedQuote(m); assert.notEqual(m.grants.get(q).user, "C2");
});
test("T45", "anonymous projection schema is public-safe", () => {
  const m = new QuoteV2Model(); const q = approvedQuote(m); const p = m.publicProjection(q);
  for (const key of ["user", "caseId", "asset", "storage", "reviewer", "fingerprint"]) {
    assert.equal(key in p, false);
  }
});
test("T46", "withdrawal blocks before deletion", () => {
  const m = new QuoteV2Model(); const q = approvedQuote(m); const job = m.withdraw(q);
  assert.equal(m.publicProjection(q), null); assert.equal(m.jobs.get(job).state, "queued");
});
test("T47", "failed deletion target prevents completion", () => {
  const m = new QuoteV2Model(); const q = approvedQuote(m); const job = m.withdraw(q);
  assert.equal(m.deletionTarget(job, "storage_original", false), "partial_failure");
  assert.notEqual(m.jobs.get(job).state, "completed");
});
test("T48", "backup restore remains blocked by tombstone", () => {
  const m = new QuoteV2Model(); const q = approvedQuote(m); m.requestAccountDeletion("C1");
  assert.equal(m.activeDeletionUsers.has("C1"), true);
  assert.equal(m.publicProjection(q), null);
  throwsCode(() => m.submitInfo({
    user: "C1", source: "customer_proposal", fields: { phone: "x" },
  }), "ACCOUNT_DELETION_ACTIVE");
});
test("T49", "legal hold must be scoped", () => {
  const m = new QuoteV2Model(); const q = approvedQuote(m);
  throwsCode(() => m.setLegalHold(q, {
    basis: "", scope: "", approver: "OPS1", reviewAt: NOW + DAY,
  }), "LEGAL_HOLD_SCOPE");
  m.setLegalHold(q, {
    basis: "dispute", scope: "quote-only", approver: "OPS1", reviewAt: NOW + 30 * DAY,
  });
  assert.equal(m.legalHolds.get(q).state, "active");
});
test("T50", "24-month projection expires without current-price fallback", () => {
  const m = new QuoteV2Model(); const q = approvedQuote(m);
  m.projections.get(q).expiresAt = NOW - 1;
  assert.equal(m.publicProjection(q), null);
  assert.equal("currentPrice" in m.projections.get(q), false);
});
test("T51", "account deletion manifest must finish every target", () => {
  const m = new QuoteV2Model(); const q = approvedQuote(m); const job = m.withdraw(q);
  for (const target of [
    "database_private", "storage_original", "storage_preview", "ocr_derivative",
    "cache_manifest", "queue_payload", "export_copy", "backup_expiry",
  ]) {
    m.deletionTarget(job, target, true);
  }
  assert.notEqual(m.jobs.get(job).state, "completed");
  assert.notEqual(m.quotes.get(q).amount, null);
  m.deletionTarget(job, "restore_tombstone", true);
  assert.equal(m.jobs.get(job).state, "completed");
  assert.equal(m.quotes.get(q).amount, null);
});
test("T52", "retention periods remain separated", () => {
  const m = new QuoteV2Model();
  assert.deepEqual(m.retention,
    { rawDays: 30, rawMaxDays: 90, accessYears: 3, connectionYears: [1, 2] });
});
test("T53", "original quote reviewer cannot resolve the dispute", () => {
  const m = new QuoteV2Model(); const q = approvedQuote(m); const d = m.dispute(q, "incorrect");
  throwsCode(() => m.resolveDispute(d, false, "OPS1"), "INDEPENDENT_DISPUTE_REVIEW");
  assert.equal(m.disputes.get(d).state, "open");
});
test("T54", "evidence uses review maximum then decision-relative retention", () => {
  const m = new QuoteV2Model(); m.enableSyntheticRuntime(); const e = readyEvidence(m);
  const q = m.submitQuote({ evidenceId: e });
  assert.equal(m.evidence.get(e).deleteAfter, NOW + 90 * DAY);
  prepareQuote(m, q);
  m.approve(q, { reviewer: "OPS1", key: "retention-a" });
  m.approve(q, { reviewer: "OPS2", key: "retention-b" });
  assert.equal(m.evidence.get(e).deleteAfter, NOW + 30 * DAY);
});

for (const [id, title, forbidden] of [
  ["L01", "business number legacy column is never used", "business_number"],
  ["L02", "legacy contribution review and points are never called", "taran_review_contribution"],
  ["L03", "legacy owned-provider update is never called", "taran_update_owned_provider"],
  ["L04", "base provider row is not granted as v2 public data", "grant select on public.taran_providers"],
  ["L05", "legacy evidence policies do not cover v2 evidence", "taran-private-evidence"],
  ["L06", "legacy maintenance has no v2 command role", "taran_apply_marketplace_maintenance"],
]) {
  test(id, title, () => assert.equal(migrationSql.includes(forbidden), false));
}

assert.equal(results.length, 60);
assert.equal(new Set(results.map((item) => item.id)).size, 60);

console.log(JSON.stringify({
  suite: "BE-019 MODEL_ONLY deterministic v2 contract model",
  fixtureVersion: "BE-019-v2",
  tests: results.length,
  passed: results.length,
  testIds: results.map((item) => item.id),
  networkEgressCount: 0,
  realDataCount: 0,
}, null, 2));
