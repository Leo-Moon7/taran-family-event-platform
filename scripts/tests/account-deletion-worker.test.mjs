import assert from "node:assert/strict";
import test from "node:test";

import { runAccountDeletionWorker } from "../../supabase/functions/finalize-account-deletion/worker.mjs";

const PRIVATE_VALUE = "private-user-reference";
const CLAIM_TOKEN = "opaque-claim-token";

function assertPublicResult(result) {
  const serialized = JSON.stringify(result);
  assert.doesNotMatch(serialized, /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
  assert.doesNotMatch(serialized, /@/);
}

test("returns an identifier-free idle result when the queue is empty", async () => {
  const result = await runAccountDeletionWorker({
    claim: async () => null
  });

  assert.deepEqual(result, { status: "idle" });
  assertPublicResult(result);
});

test("does not call Auth for a fail-closed manual-review account", async () => {
  let deleteCalls = 0;
  const result = await runAccountDeletionWorker({
    claim: async () => ({ action: "blocked", code: "manual_review_required" }),
    deleteAuthUser: async () => { deleteCalls += 1; }
  });

  assert.deepEqual(result, { status: "blocked", code: "manual_review_required" });
  assert.equal(deleteCalls, 0);
  assertPublicResult(result);
});

test("deletes Auth once and records completion without returning identifiers", async () => {
  const calls = [];
  const result = await runAccountDeletionWorker({
    claim: async () => ({ action: "delete", claim_token: CLAIM_TOKEN, user_id: PRIVATE_VALUE }),
    deleteAuthUser: async (userId) => { calls.push(["delete", userId]); },
    complete: async (claimToken) => {
      calls.push(["complete", claimToken]);
      return { status: "completed" };
    }
  });

  assert.deepEqual(calls, [
    ["delete", PRIVATE_VALUE],
    ["complete", CLAIM_TOKEN]
  ]);
  assert.deepEqual(result, { status: "completed" });
  assertPublicResult(result);
});

test("two concurrent invocations have one Auth effect when the claim is single-use", async () => {
  let available = true;
  let deleteCalls = 0;
  const dependencies = {
    claim: async () => {
      if (!available) return null;
      available = false;
      return { action: "delete", claim_token: CLAIM_TOKEN, user_id: PRIVATE_VALUE };
    },
    deleteAuthUser: async () => { deleteCalls += 1; },
    complete: async () => ({ status: "completed" })
  };

  const results = await Promise.all([
    runAccountDeletionWorker(dependencies),
    runAccountDeletionWorker(dependencies)
  ]);

  assert.equal(deleteCalls, 1);
  assert.deepEqual(results.map((result) => result.status).sort(), ["completed", "idle"]);
  results.forEach(assertPublicResult);
});

test("schedules a bounded retry after a masked Auth failure", async () => {
  let failedWith;
  const result = await runAccountDeletionWorker({
    claim: async () => ({ action: "delete", claim_token: CLAIM_TOKEN, user_id: PRIVATE_VALUE }),
    deleteAuthUser: async () => { throw new Error("private upstream detail"); },
    fail: async (claimToken, errorCode) => {
      failedWith = [claimToken, errorCode];
      return { status: "retry_scheduled" };
    }
  });

  assert.deepEqual(failedWith, [CLAIM_TOKEN, "auth_delete_failed"]);
  assert.deepEqual(result, { status: "retry_scheduled", code: "auth_delete_failed" });
  assertPublicResult(result);
});

test("reports retry exhaustion without exposing the claim", async () => {
  const result = await runAccountDeletionWorker({
    claim: async () => ({ action: "delete", claim_token: CLAIM_TOKEN, user_id: PRIVATE_VALUE }),
    deleteAuthUser: async () => { throw new Error("private upstream detail"); },
    fail: async () => ({ status: "retry_exhausted" })
  });

  assert.deepEqual(result, { status: "retry_exhausted", code: "retry_exhausted" });
  assertPublicResult(result);
});

test("recovers completion if Auth disappeared before the failure was recorded", async () => {
  const calls = [];
  const result = await runAccountDeletionWorker({
    claim: async () => ({ action: "delete", claim_token: CLAIM_TOKEN, user_id: PRIVATE_VALUE }),
    deleteAuthUser: async () => { throw new Error("not found"); },
    fail: async () => ({ status: "complete_required" }),
    complete: async (claimToken) => {
      calls.push(claimToken);
      return { status: "completed" };
    }
  });

  assert.deepEqual(calls, [CLAIM_TOKEN]);
  assert.deepEqual(result, { status: "completed" });
  assertPublicResult(result);
});

test("a completion write gap is recoverable without another Auth deletion", async () => {
  const first = await runAccountDeletionWorker({
    claim: async () => ({ action: "delete", claim_token: CLAIM_TOKEN, user_id: PRIVATE_VALUE }),
    deleteAuthUser: async () => {},
    complete: async () => { throw new Error("temporary database failure"); }
  });
  const second = await runAccountDeletionWorker({
    claim: async () => ({ action: "complete_only", claim_token: CLAIM_TOKEN }),
    complete: async () => ({ status: "completed" }),
    deleteAuthUser: async () => { assert.fail("Auth must not be called during completion recovery"); }
  });

  assert.deepEqual(first, { status: "incomplete", code: "completion_pending" });
  assert.deepEqual(second, { status: "completed" });
  assertPublicResult(first);
  assertPublicResult(second);
});

test("rejects an invalid private claim contract", async () => {
  await assert.rejects(
    runAccountDeletionWorker({ claim: async () => ({ action: "delete" }) }),
    /invalid_claim_contract/
  );
});

function createDeletionGateModel() {
  let lock = Promise.resolve();
  let active = false;
  const record = { contact: "raw", evidence: false };

  async function transaction(operation) {
    const previous = lock;
    let release;
    lock = new Promise((resolve) => { release = resolve; });
    await previous;
    try {
      return await operation();
    } finally {
      release();
    }
  }

  return {
    record,
    request: () => transaction(async () => {
      active = true;
      record.contact = "redacted";
    }),
    writeContact: (value) => transaction(async () => {
      if (active) throw new Error("deletion_active");
      record.contact = value;
    }),
    writeEvidence: () => transaction(async () => {
      if (active) throw new Error("deletion_active");
      record.evidence = true;
    }),
    claim: () => transaction(async () => {
      if (!active || record.contact !== "redacted" || record.evidence) {
        return { action: "blocked" };
      }
      return { action: "delete" };
    })
  };
}

test("a write that starts before the request is redacted after serialization", async () => {
  const gate = createDeletionGateModel();
  const write = gate.writeContact("concurrent raw value");
  const request = gate.request();
  await Promise.all([write, request]);

  assert.equal(gate.record.contact, "redacted");
  assert.deepEqual(await gate.claim(), { action: "delete" });
});

test("writes and evidence that start after the request are rejected", async () => {
  const gate = createDeletionGateModel();
  await gate.request();

  await assert.rejects(gate.writeContact("new raw value"), /deletion_active/);
  await assert.rejects(gate.writeEvidence(), /deletion_active/);
  assert.equal(gate.record.contact, "redacted");
  assert.equal(gate.record.evidence, false);
  assert.deepEqual(await gate.claim(), { action: "delete" });
});
