import assert from "node:assert/strict";
import test from "node:test";

function createTombstoneModel({
  maxJwtTtl = null,
  maxInflightWrite = null,
  buffer = null
} = {}) {
  let now = 0;
  let authExists = true;
  let request = null;
  let tombstone = null;
  let completedJobs = 0;
  let authDeleteCalls = 0;
  let privateContact = "raw";
  let evidenceObjects = 0;

  const configured = Number.isInteger(maxJwtTtl)
    && Number.isInteger(maxInflightWrite)
    && Number.isInteger(buffer)
    && buffer > maxInflightWrite;

  return {
    advance(seconds) {
      now += seconds;
    },
    requestDeletion() {
      if (!configured) throw new Error("runtime_config_disabled");
      request = { status: "pending", claim: null };
      tombstone = {
        state: "requested",
        preflightAfter: now + maxInflightWrite + buffer,
        authDeletedAt: null,
        releaseAfter: null
      };
      privateContact = "redacted";
    },
    staleWriteContact(value, { beganBeforeRequest = false } = {}) {
      if (tombstone && !beganBeforeRequest) throw new Error("deletion_active");
      privateContact = value;
    },
    staleInsertLegacyInquiry(userId) {
      if (userId === null) throw new Error("legacy_direct_insert_denied");
      if (tombstone) throw new Error("deletion_active");
    },
    staleUpload() {
      if (tombstone) throw new Error("deletion_active");
      evidenceObjects += 1;
    },
    claim() {
      if (!tombstone) return null;
      if (tombstone.state === "requested" && now < tombstone.preflightAfter) {
        return { action: "wait" };
      }
      if (tombstone.state === "requested") {
        privateContact = "redacted";
        if (evidenceObjects > 0) {
          tombstone.state = "manual_review_required";
          request.status = "cancelled";
          return { action: "blocked" };
        }
        tombstone.state = "auth_deleting";
        request.status = "processing";
        request.claim = "opaque";
        return { action: "delete" };
      }
      if (tombstone.state === "auth_deleting" && !authExists) {
        return { action: "mark_auth_deleted" };
      }
      if (tombstone.state === "token_drain" && now < tombstone.releaseAfter) {
        return { action: "wait" };
      }
      if (tombstone.state === "token_drain" && now >= tombstone.releaseAfter) {
        tombstone.state = "finalizing";
        return { action: "finalize" };
      }
      return { action: "wait" };
    },
    deleteAuth() {
      if (!tombstone || tombstone.state !== "auth_deleting") {
        throw new Error("invalid_state");
      }
      authDeleteCalls += 1;
      authExists = false;
    },
    markAuthDeleted() {
      if (authExists) throw new Error("auth_delete_not_confirmed");
      if (tombstone.state === "token_drain") return;
      tombstone.authDeletedAt = now;
      tombstone.releaseAfter = now + maxJwtTtl + buffer;
      tombstone.state = "token_drain";
    },
    finalize() {
      if (!tombstone || tombstone.state !== "finalizing") {
        throw new Error("not_finalizing");
      }
      if (now < tombstone.releaseAfter) throw new Error("jwt_drain_incomplete");
      if (authExists) throw new Error("auth_still_exists");
      privateContact = "redacted";
      if (evidenceObjects > 0) throw new Error("manual_review_required");
      completedJobs += 1;
      request = null;
      tombstone = null;
    },
    snapshot() {
      return {
        now,
        authExists,
        request,
        tombstone,
        completedJobs,
        authDeleteCalls,
        privateContact,
        evidenceObjects
      };
    }
  };
}

test("request fails closed when the actual JWT runtime values are unset", () => {
  const model = createTombstoneModel();
  assert.throws(() => model.requestDeletion(), /runtime_config_disabled/);
  assert.equal(model.snapshot().tombstone, null);
});

test("request fails closed when the buffer does not exceed the verified write bound", () => {
  const model = createTombstoneModel({
    maxJwtTtl: 3600,
    maxInflightWrite: 60,
    buffer: 60
  });
  assert.throws(() => model.requestDeletion(), /runtime_config_disabled/);
  assert.equal(model.snapshot().tombstone, null);
});

test("a write with an old snapshot is removed by delayed preflight", () => {
  const model = createTombstoneModel({
    maxJwtTtl: 3600,
    maxInflightWrite: 30,
    buffer: 300
  });
  model.requestDeletion();
  model.staleWriteContact("late old-snapshot value", { beganBeforeRequest: true });

  assert.deepEqual(model.claim(), { action: "wait" });
  model.advance(330);
  assert.deepEqual(model.claim(), { action: "delete" });
  assert.equal(model.snapshot().privateContact, "redacted");
});

test("tombstone blocks stale DB, nullable inquiry, and Storage writes", () => {
  const model = createTombstoneModel({
    maxJwtTtl: 3600,
    maxInflightWrite: 30,
    buffer: 300
  });
  model.requestDeletion();

  assert.throws(() => model.staleWriteContact("new raw"), /deletion_active/);
  assert.throws(() => model.staleInsertLegacyInquiry(null), /legacy_direct_insert_denied/);
  assert.throws(() => model.staleUpload(), /deletion_active/);
  assert.equal(model.snapshot().evidenceObjects, 0);
});

test("release horizon starts at confirmed Auth deletion, not request time", () => {
  const model = createTombstoneModel({
    maxJwtTtl: 3600,
    maxInflightWrite: 30,
    buffer: 300
  });
  model.requestDeletion();
  model.advance(330);
  assert.deepEqual(model.claim(), { action: "delete" });
  model.advance(120);
  model.deleteAuth();
  model.markAuthDeleted();

  const { authDeletedAt, releaseAfter } = model.snapshot().tombstone;
  assert.equal(releaseAfter, authDeletedAt + 3900);
  model.advance(3899);
  assert.deepEqual(model.claim(), { action: "wait" });
  assert.throws(() => model.staleUpload(), /deletion_active/);
});

test("Auth deletion gap recovers through mark without a second delete", () => {
  const model = createTombstoneModel({
    maxJwtTtl: 60,
    maxInflightWrite: 10,
    buffer: 30
  });
  model.requestDeletion();
  model.advance(40);
  assert.deepEqual(model.claim(), { action: "delete" });
  model.deleteAuth();

  assert.deepEqual(model.claim(), { action: "mark_auth_deleted" });
  model.markAuthDeleted();
  assert.equal(model.snapshot().authDeleteCalls, 1);
});

test("finalization removes the identifying tombstone only after drain", () => {
  const model = createTombstoneModel({
    maxJwtTtl: 60,
    maxInflightWrite: 10,
    buffer: 30
  });
  model.requestDeletion();
  model.advance(40);
  assert.deepEqual(model.claim(), { action: "delete" });
  model.deleteAuth();
  model.markAuthDeleted();
  model.advance(89);

  assert.deepEqual(model.claim(), { action: "wait" });
  assert.ok(model.snapshot().tombstone);

  model.advance(1);
  assert.deepEqual(model.claim(), { action: "finalize" });
  model.finalize();

  const state = model.snapshot();
  assert.equal(state.authExists, false);
  assert.equal(state.request, null);
  assert.equal(state.tombstone, null);
  assert.equal(state.completedJobs, 1);
  assert.equal(state.authDeleteCalls, 1);
});

test("two workers cannot claim the same state transition twice", async () => {
  const model = createTombstoneModel({
    maxJwtTtl: 60,
    maxInflightWrite: 10,
    buffer: 30
  });
  model.requestDeletion();
  model.advance(40);

  const claims = await Promise.all([
    Promise.resolve().then(() => model.claim()),
    Promise.resolve().then(() => model.claim())
  ]);

  assert.equal(claims.filter((claim) => claim.action === "delete").length, 1);
  assert.equal(claims.filter((claim) => claim.action === "wait").length, 1);
});
