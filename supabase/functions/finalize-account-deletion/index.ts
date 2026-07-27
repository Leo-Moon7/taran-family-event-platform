import { createClient } from "npm:@supabase/supabase-js@2.110.8";
import { runAccountDeletionWorker } from "./worker.mjs";

const encoder = new TextEncoder();

async function secureEqual(left: string, right: string): Promise<boolean> {
  const [leftDigest, rightDigest] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right))
  ]);
  const leftBytes = new Uint8Array(leftDigest);
  const rightBytes = new Uint8Array(rightDigest);
  let difference = 0;
  for (let index = 0; index < leftBytes.length; index += 1) {
    difference |= leftBytes[index] ^ rightBytes[index];
  }
  return difference === 0;
}

function response(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method !== "POST") {
    return response({ status: "rejected", code: "method_not_allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceRoleKey) {
    return response({ status: "unavailable", code: "worker_not_configured" }, 503);
  }

  const authorization = request.headers.get("authorization") ?? "";
  const bearer = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  if (!bearer || !(await secureEqual(bearer, serviceRoleKey))) {
    return response({ status: "rejected", code: "service_role_required" }, 401);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const rpc = async (name: string, parameters = {}) => {
    const { data, error } = await admin.rpc(name, parameters);
    if (error) throw new Error("worker_rpc_failed");
    return data;
  };

  try {
    const result = await runAccountDeletionWorker({
      claim: () => rpc("taran_claim_account_deletion_job"),
      complete: (claimToken: string) => rpc("taran_complete_account_deletion_job", {
        p_claim_token: claimToken
      }),
      fail: (claimToken: string, errorCode: string) => rpc("taran_fail_account_deletion_job", {
        p_claim_token: claimToken,
        p_error_code: errorCode
      }),
      deleteAuthUser: async (userId: string) => {
        const { error } = await admin.auth.admin.deleteUser(userId, false);
        // A previous invocation can delete Auth successfully and fail before
        // recording completion. Treat Auth 404 as a recoverable success; the
        // completion RPC still verifies that the request FK is null.
        if (error && error.status !== 404) throw new Error("auth_delete_failed");
      }
    });
    return response(result);
  } catch (_error) {
    return response({ status: "error", code: "worker_internal_error" }, 500);
  }
});
