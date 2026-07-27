const PUBLIC_CODES = new Set([
  "manual_review_required",
  "retry_exhausted",
  "auth_delete_failed",
  "completion_pending",
  "token_drain"
]);

function publicCode(value, fallback) {
  return PUBLIC_CODES.has(value) ? value : fallback;
}

function finalizationResult(result) {
  if (result?.status === "blocked") {
    return {
      status: "blocked",
      code: publicCode(result.code, "manual_review_required")
    };
  }
  const status = result?.status === "already_completed" ? "already_completed" : "completed";
  return { status };
}

export async function runAccountDeletionWorker(dependencies) {
  const claimed = await dependencies.claim();

  if (!claimed) return { status: "idle" };

  if (claimed.action === "blocked") {
    return {
      status: "blocked",
      code: publicCode(claimed.code, "manual_review_required")
    };
  }

  if (claimed.action === "wait") {
    return {
      status: "waiting",
      code: publicCode(claimed.code, "token_drain")
    };
  }

  if (claimed.action === "finalize") {
    if (typeof claimed.claim_token !== "string") {
      throw new Error("invalid_claim_contract");
    }
    const finalized = await dependencies.finalize(claimed.claim_token);
    return finalizationResult(finalized);
  }

  if (claimed.action === "mark_auth_deleted") {
    if (typeof claimed.claim_token !== "string") {
      throw new Error("invalid_claim_contract");
    }
    await dependencies.markAuthDeleted(claimed.claim_token);
    return { status: "waiting", code: "token_drain" };
  }

  if (
    claimed.action !== "delete"
    || typeof claimed.claim_token !== "string"
    || typeof claimed.user_id !== "string"
  ) {
    throw new Error("invalid_claim_contract");
  }

  try {
    await dependencies.deleteAuthUser(claimed.user_id);
  } catch (_error) {
    const failed = await dependencies.fail(claimed.claim_token, "auth_delete_failed");
    if (failed?.status === "mark_required") {
      await dependencies.markAuthDeleted(claimed.claim_token);
      return { status: "waiting", code: "token_drain" };
    }
    return {
      status: failed?.status === "retry_exhausted" ? "retry_exhausted" : "retry_scheduled",
      code: publicCode(failed?.status, "auth_delete_failed")
    };
  }

  try {
    await dependencies.markAuthDeleted(claimed.claim_token);
    return { status: "waiting", code: "token_drain" };
  } catch (_error) {
    // The Auth-independent tombstone survives. The next invocation recognizes
    // that Auth is absent and returns mark_auth_deleted without deleting Auth
    // a second time.
    return { status: "incomplete", code: "completion_pending" };
  }
}
