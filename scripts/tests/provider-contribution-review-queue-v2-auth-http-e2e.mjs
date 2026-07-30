import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

const ACTORS = Object.freeze({
  customer: Object.freeze({
    id: "04200000-0000-4000-8000-000000000001",
    email: "qa-042-customer@example.invalid",
  }),
  provider: Object.freeze({
    id: "04200000-0000-4000-8000-000000000002",
    email: "qa-042-provider@example.invalid",
  }),
  content: Object.freeze({
    id: "04200000-0000-4000-8000-000000000003",
    email: "qa-042-content@example.invalid",
  }),
  operations: Object.freeze({
    id: "04200000-0000-4000-8000-000000000004",
    email: "qa-042-operations@example.invalid",
  }),
});

const RPC_NAME = "taran_list_review_queue_v2";
const MFA_FRIENDLY_NAME = "qa-047-review-queue";
const APPROVED_FIELDS = Object.freeze([
  "review_case_id",
  "source_kind",
  "canonical_event_code",
  "risk_level",
  "review_state",
  "created_at",
]);

function decodeBase64Url(value) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(`${normalized}${padding}`, "base64");
}

function assertRuntimeScope(projectUrl, anonKey, expectedProjectRef) {
  const parsed = new URL(projectUrl);
  assert.equal(parsed.protocol, "https:");
  assert.equal(parsed.hostname, `${expectedProjectRef}.supabase.co`);
  const parts = String(anonKey).split(".");
  assert.equal(parts.length, 3, "legacy anon key must be a signed JWT");
  const claims = JSON.parse(decodeBase64Url(parts[1]).toString("utf8"));
  assert.equal(claims.role, "anon");
  if (claims.ref) assert.equal(claims.ref, expectedProjectRef);
}

function decodeBase32(value) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const normalized = String(value)
    .replaceAll("=", "")
    .replace(/\s+/g, "")
    .toUpperCase();
  let bits = "";
  for (const character of normalized) {
    const index = alphabet.indexOf(character);
    assert.notEqual(index, -1, "invalid TOTP base32 secret");
    bits += index.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let offset = 0; offset + 8 <= bits.length; offset += 8) {
    bytes.push(Number.parseInt(bits.slice(offset, offset + 8), 2));
  }
  return Buffer.from(bytes);
}

function currentTotp(secret, timeMs = Date.now()) {
  const counter = Math.floor(timeMs / 30_000);
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", decodeBase32(secret)).update(message).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary = (
    ((digest[offset] & 0x7f) << 24)
    | (digest[offset + 1] << 16)
    | (digest[offset + 2] << 8)
    | digest[offset + 3]
  );
  return String(binary % 1_000_000).padStart(6, "0");
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }
  return {
    ok: response.ok,
    status: response.status,
    body,
    code: typeof body?.code === "string" ? body.code : null,
  };
}

function authHeaders(anonKey, accessToken = anonKey) {
  return {
    apikey: anonKey,
    authorization: `Bearer ${accessToken}`,
    "content-type": "application/json",
  };
}

async function signIn(projectUrl, anonKey, actor) {
  const response = await requestJson(
    `${projectUrl}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: authHeaders(anonKey),
      body: JSON.stringify({
        email: actor.email,
        password: actor.password,
      }),
    },
  );
  assert.equal(response.status, 200, "GoTrue password login failed");
  assert.equal(typeof response.body?.access_token, "string");
  return response.body.access_token;
}

async function listQueue(projectUrl, anonKey, accessToken, pageSize = 20) {
  return requestJson(`${projectUrl}/rest/v1/rpc/${RPC_NAME}`, {
    method: "POST",
    headers: authHeaders(anonKey, accessToken),
    body: JSON.stringify({
      p_review_state: "open",
      p_page_size: pageSize,
      p_before_created_at: null,
      p_before_review_case_id: null,
    }),
  });
}

async function logout(projectUrl, anonKey, accessToken) {
  const response = await requestJson(
    `${projectUrl}/auth/v1/logout?scope=global`,
    {
      method: "POST",
      headers: authHeaders(anonKey, accessToken),
    },
  );
  return response.status === 200 || response.status === 204;
}

async function runReviewQueueAuthHttpE2E({
  projectUrl,
  anonKey,
  expectedProjectRef,
  credentials,
}) {
  assertRuntimeScope(projectUrl, anonKey, expectedProjectRef);
  for (const [name, actor] of Object.entries(ACTORS)) {
    assert.equal(credentials[name]?.id, actor.id);
    assert.equal(credentials[name]?.email, actor.email);
    assert.equal(typeof credentials[name]?.password, "string");
  }

  const results = [];
  const sessions = {};
  let factorId = null;
  let operationsAal2Token = null;
  let factorUnenrolled = false;
  let scenarioError = null;
  const logoutResults = [];

  try {
    const anon = await listQueue(projectUrl, anonKey, anonKey);
    assert.ok([401, 403].includes(anon.status));
    results.push({ role: "anon", status: anon.status, outcome: "denied" });

    for (const name of ["customer", "provider", "content", "operations"]) {
      sessions[name] = await signIn(projectUrl, anonKey, credentials[name]);
    }

    for (const name of ["customer", "provider", "content", "operations"]) {
      const response = await listQueue(projectUrl, anonKey, sessions[name]);
      assert.equal(response.status, 403);
      assert.equal(response.code, "42501");
      results.push({
        role: name === "operations" ? "operations_aal1" : name,
        status: response.status,
        outcome: "denied",
      });
    }

    const enroll = await requestJson(`${projectUrl}/auth/v1/factors`, {
      method: "POST",
      headers: authHeaders(anonKey, sessions.operations),
      body: JSON.stringify({
        factor_type: "totp",
        friendly_name: MFA_FRIENDLY_NAME,
      }),
    });
    assert.equal(enroll.status, 200);
    factorId = enroll.body?.id;
    const secret = enroll.body?.totp?.secret;

    const challenge = await requestJson(
      `${projectUrl}/auth/v1/factors/${encodeURIComponent(factorId)}/challenge`,
      {
        method: "POST",
        headers: authHeaders(anonKey, sessions.operations),
        body: "{}",
      },
    );
    assert.equal(challenge.status, 200);

    const verify = await requestJson(
      `${projectUrl}/auth/v1/factors/${encodeURIComponent(factorId)}/verify`,
      {
        method: "POST",
        headers: authHeaders(anonKey, sessions.operations),
        body: JSON.stringify({
          challenge_id: challenge.body.id,
          code: currentTotp(secret),
        }),
      },
    );
    assert.equal(verify.status, 200);
    operationsAal2Token = verify.body?.access_token;

    const allowed = await listQueue(
      projectUrl,
      anonKey,
      operationsAal2Token,
      50,
    );
    assert.equal(allowed.status, 200);
    assert.ok(Array.isArray(allowed.body));
    if (allowed.body.length) {
      assert.deepEqual(Object.keys(allowed.body[0]), APPROVED_FIELDS);
    }
    results.push({
      role: "operations_aal2",
      status: allowed.status,
      outcome: "allowed",
      rows: allowed.body.length,
      fields: APPROVED_FIELDS.length,
    });

    const oversized = await listQueue(
      projectUrl,
      anonKey,
      operationsAal2Token,
      51,
    );
    assert.equal(oversized.status, 400);
    assert.equal(oversized.code, "22023");
    results.push({
      role: "operations_aal2_page_51",
      status: oversized.status,
      outcome: "denied",
    });
  } catch (error) {
    scenarioError = error;
  } finally {
    if (factorId) {
      const response = await requestJson(
        `${projectUrl}/auth/v1/factors/${encodeURIComponent(factorId)}`,
        {
          method: "DELETE",
          headers: authHeaders(
            anonKey,
            operationsAal2Token ?? sessions.operations,
          ),
        },
      );
      factorUnenrolled = response.status === 200 || response.status === 204;
    }
    for (const session of Object.values(sessions)) {
      logoutResults.push(await logout(projectUrl, anonKey, session));
    }
  }

  if (scenarioError) throw scenarioError;
  assert.equal(factorUnenrolled, true);
  assert.equal(logoutResults.length, 4);
  assert.ok(logoutResults.every(Boolean));

  return {
    suite: "QA-047 review queue real GoTrue / PostgREST / TOTP AAL2",
    passed: results.length,
    results,
    cleanup: {
      factorUnenrolled,
      globalLogoutCount: logoutResults.filter(Boolean).length,
    },
    secretOutputCount: 0,
    realDataCount: 0,
    productionDatabaseChanges: 0,
  };
}

function contractCheck() {
  assert.equal(APPROVED_FIELDS.length, 6);
  assert.equal(RPC_NAME, "taran_list_review_queue_v2");
  assert.equal(MFA_FRIENDLY_NAME.startsWith("qa-047-"), true);
  return {
    suite: "QA-047 review queue auth HTTP harness contract",
    passed: 3,
    secretOutputCount: 0,
    networkEgressCount: 0,
  };
}

export {
  APPROVED_FIELDS,
  contractCheck,
  MFA_FRIENDLY_NAME,
  runReviewQueueAuthHttpE2E,
};

const cliProcess = globalThis.process;
if (Array.isArray(cliProcess?.argv)) {
  const mode = cliProcess.argv[2] ?? "contract";
  if (mode !== "contract") {
    console.error("Usage: node provider-contribution-review-queue-v2-auth-http-e2e.mjs [contract]");
    console.error("Actual HTTP mode is import-only so credentials remain in memory.");
    cliProcess.exitCode = 2;
  } else {
    cliProcess.stdout.write(`${JSON.stringify(contractCheck(), null, 2)}\n`);
  }
}
