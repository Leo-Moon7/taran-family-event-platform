const PUBLIC_CODES = new Set([
  "manual_review_required",
  "retry_exhausted",
  "auth_delete_failed",
  "completion_pending"
]);

function publicCode(value, fallback) {
  return PUBLIC_CODES.has(value) ? value : fallback;
}

function completionResult(result) {
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

  if (claimed.action === "complete_only") {
    const completed = await dependencies.complete(claimed.claim_token);
    return completionResult(completed);
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
    if (failed?.status === "complete_required") {
      const completed = await dependencies.complete(claimed.claim_token);
      return completionResult(completed);
    }
    return {
      status: failed?.status === "retry_exhausted" ? "retry_exhausted" : "retry_scheduled",
      code: publicCode(failed?.status, "auth_delete_failed")
    };
  }

  try {
    const completed = await dependencies.complete(claimed.claim_token);
    return completionResult(completed);
  } catch (_error) {
    // The request row remains with a null user_id and the next invocation uses
    // the migration's complete_only recovery path. No identifier is returned.
    return { status: "incomplete", code: "completion_pending" };
  }
}
