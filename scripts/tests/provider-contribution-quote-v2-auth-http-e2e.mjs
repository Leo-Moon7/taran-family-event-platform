import assert from "node:assert/strict";
import { createHmac, randomBytes } from "node:crypto";

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

const ACTOR_LIST = Object.freeze(Object.values(ACTORS));
const ACTOR_UUID_SQL = ACTOR_LIST.map(({ id }) => `'${id}'::uuid`).join(",\n    ");
const PROVIDER_ID = "qa-042-provider-main";
const POLICY_VERSION = "qa-042-policy-v1";
const TERMS_VERSION = "qa-042-terms-v1";
const MFA_FRIENDLY_NAME = "qa-042-ephemeral";
const DUMMY_EVIDENCE_ID = "04200000-0000-4000-8000-000000000099";

const qaActorCte = String.raw`
qa_actors(id) as (
  values
    ${ACTOR_LIST.map(({ id }) => `('${id}'::uuid)`).join(",\n    ")}
)`;

const preflightSql = String.raw`
with
${qaActorCte},
qa_counts as (
  select
    (select count(*) from auth.users
      where id in (select id from qa_actors)
         or email like 'qa-042-%@example.invalid') as auth_users,
    (select count(*) from auth.identities
      where user_id in (select id from qa_actors)) as auth_identities,
    (select count(*) from auth.mfa_factors
      where user_id in (select id from qa_actors)
         or friendly_name = '${MFA_FRIENDLY_NAME}') as mfa_factors,
    (select count(*) from auth.sessions
      where user_id in (select id from qa_actors)) as auth_sessions,
    (select count(*) from auth.refresh_tokens
      where user_id::text in (select id::text from qa_actors)) as refresh_tokens,
    (select count(*) from public.taran_admin_profiles
      where user_id in (select id from qa_actors)
         or email like 'qa-042-%@example.invalid') as admin_profiles,
    (select count(*) from public.taran_providers
      where id like 'qa-042-%') as providers,
    (select count(*) from public.taran_submission_cases_v2
      where policy_version like 'qa-042-%'
         or provider_id like 'qa-042-%'
         or submitted_by in (select id from qa_actors)) as submissions,
    (select count(*) from public.taran_provider_access_grants_v2
      where provider_id like 'qa-042-%'
         or user_id in (select id from qa_actors)
         or issued_by in (select id from qa_actors)) as provider_grants,
    (select count(*) from public.taran_audit_events_v2
      where actor_user_id in (select id from qa_actors)) as audit_events,
    (select count(*) from storage.objects
      where bucket_id like 'qa-042-%'
         or name like 'qa-042/%') as storage_objects
),
qa_result as (
  select
    qa_counts.*,
    (
      auth_users + auth_identities + mfa_factors + auth_sessions
      + refresh_tokens + admin_profiles + providers + submissions
      + provider_grants + audit_events + storage_objects
    ) = 0 as namespace_zero,
    not runtime.contribution_enabled as contribution_false,
    not runtime.evidence_upload_enabled as evidence_false,
    not runtime.public_projection_enabled as projection_false,
    not runtime.allow_exact_amount as exact_false
  from qa_counts
  cross join public.taran_quote_runtime_config_v2 runtime
  where runtime.config_key = 'provider_contribution_quote_v2'
)
select
  case
    when namespace_zero
      and contribution_false and evidence_false and projection_false and exact_false
    then 'QA-042_PREFLIGHT_PASS'
    else 'QA-042_PREFLIGHT_FAIL'
  end as result,
  *
from qa_result;
`.trim();

function quoteSql(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function createEphemeralCredentials() {
  return Object.fromEntries(
    Object.entries(ACTORS).map(([name, actor]) => [
      name,
      Object.freeze({
        ...actor,
        password: `Qa42-${randomBytes(24).toString("base64url")}!`,
      }),
    ]),
  );
}

function validateCredentials(credentials) {
  assert.equal(typeof credentials, "object", "credentials must be provided in memory");
  for (const [name, actor] of Object.entries(ACTORS)) {
    assert.equal(credentials[name]?.id, actor.id, `${name} id mismatch`);
    assert.equal(credentials[name]?.email, actor.email, `${name} email mismatch`);
    assert.match(credentials[name]?.password ?? "", /^Qa42-[A-Za-z0-9_-]{32}!$/);
  }
}

function buildSetupSql(credentials) {
  validateCredentials(credentials);

  const userRows = Object.entries(ACTORS).map(([name, actor]) => String.raw`
    (
      '00000000-0000-0000-0000-000000000000'::uuid,
      '${actor.id}'::uuid,
      'authenticated',
      'authenticated',
      '${actor.email}',
      crypt(${quoteSql(credentials[name].password)}, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    )`).join(",\n");

  const identityRows = ACTOR_LIST.map((actor) => String.raw`
    (
      '${actor.id}'::uuid,
      '${actor.email}',
      '${actor.id}'::uuid,
      jsonb_build_object('sub','${actor.id}','email','${actor.email}','email_verified',true),
      'email',
      now(),
      now(),
      now()
    )`).join(",\n");

  return String.raw`
begin;

do $qa042_precondition$
begin
  if exists (
    select 1 from auth.users
    where id in (${ACTOR_UUID_SQL})
       or email like 'qa-042-%@example.invalid'
  ) or exists (
    select 1 from public.taran_submission_cases_v2
    where policy_version like 'qa-042-%'
       or provider_id like 'qa-042-%'
  ) then
    raise exception 'QA-042 namespace is not empty.' using errcode = '55000';
  end if;

  if exists (
    select 1
    from public.taran_quote_runtime_config_v2
    where config_key = 'provider_contribution_quote_v2'
      and (
        contribution_enabled or evidence_upload_enabled
        or public_projection_enabled or allow_exact_amount
      )
  ) then
    raise exception 'QA-042 runtime preflight is not fail-closed.' using errcode = '55000';
  end if;
end
$qa042_precondition$;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
values
${userRows};

insert into auth.identities (
  id, provider_id, user_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
)
values
${identityRows};

insert into public.taran_admin_profiles (user_id,email,role)
values
  ('${ACTORS.content.id}'::uuid,'${ACTORS.content.email}','content'),
  ('${ACTORS.operations.id}'::uuid,'${ACTORS.operations.email}','operations');

insert into public.taran_providers (id,data,status)
values (
  '${PROVIDER_ID}',
  '{"name":"QA-042 synthetic provider","source":"qa-042"}'::jsonb,
  'draft'
);

insert into public.taran_provider_access_grants_v2 (
  provider_id, user_id, scope, state, starts_at, expires_at, issued_by, issued_at
)
values (
  '${PROVIDER_ID}',
  '${ACTORS.provider.id}'::uuid,
  'submit_revision',
  'active',
  now(),
  now() + interval '30 days',
  '${ACTORS.operations.id}'::uuid,
  now()
);

update public.taran_quote_runtime_config_v2
set contribution_enabled = true,
    evidence_upload_enabled = true,
    public_projection_enabled = false,
    allow_exact_amount = false,
    privacy_policy_version = '${POLICY_VERSION}',
    terms_version = '${TERMS_VERSION}',
    quote_link_retention_policy_code = 'quote_case_private_24m',
    scanner_provider = 'qa-042-no-storage',
    safe_preview_pipeline = 'qa-042-no-storage',
    approved_at = null,
    approved_by = null,
    updated_at = now()
where config_key = 'provider_contribution_quote_v2';

commit;

select
  'QA-042_SETUP_PASS' as result,
  (select count(*) from auth.users
    where id in (${ACTOR_UUID_SQL})) as auth_users,
  (select count(*) from auth.identities
    where user_id in (${ACTOR_UUID_SQL})) as auth_identities,
  (select count(*) from public.taran_provider_access_grants_v2
    where provider_id = '${PROVIDER_ID}') as provider_grants,
  contribution_enabled,
  evidence_upload_enabled,
  not public_projection_enabled as projection_false,
  not allow_exact_amount as exact_false
from public.taran_quote_runtime_config_v2
where config_key = 'provider_contribution_quote_v2';
`.trim();
}

const scenarioAuditSql = String.raw`
with
${qaActorCte},
qa_counts as (
  select
    (select count(*) from public.taran_submission_cases_v2
      where source_kind = 'customer_proposal'
        and provider_id = '${PROVIDER_ID}'
        and submitted_by = '${ACTORS.customer.id}'::uuid
        and policy_version = '${POLICY_VERSION}') as customer_proposals,
    (select count(*) from public.taran_quote_cases_v2 quote_case
      join public.taran_submission_cases_v2 submission
        on submission.id = quote_case.submission_case_id
      where submission.policy_version = '${POLICY_VERSION}') as quote_rows,
    (select count(*) from public.taran_provider_access_grants_v2
      where provider_id = '${PROVIDER_ID}'
        and state = 'active') as provider_grants,
    (select count(*) from public.taran_provider_access_grants_v2
      where provider_id = '${PROVIDER_ID}'
        and user_id = '${ACTORS.customer.id}'::uuid
        and issued_by = '${ACTORS.operations.id}'::uuid
        and scope = 'submit_revision'
        and state = 'active') as aal2_customer_grants,
    (select count(*) from auth.mfa_factors
      where user_id in (select id from qa_actors)
         or friendly_name = '${MFA_FRIENDLY_NAME}') as mfa_factors,
    (select count(*) from auth.sessions
      where user_id in (select id from qa_actors)) as auth_sessions,
    (select count(*) from auth.refresh_tokens
      where user_id::text in (select id::text from qa_actors)) as refresh_tokens,
    (select count(*) from storage.objects
      where bucket_id like 'qa-042-%'
         or name like 'qa-042/%') as storage_objects
)
select
  case
    when customer_proposals = 1
      and quote_rows = 0
      and provider_grants = 2
      and aal2_customer_grants = 1
      and mfa_factors = 0
      and auth_sessions = 0
      and refresh_tokens = 0
      and storage_objects = 0
      and runtime.contribution_enabled
      and runtime.evidence_upload_enabled
      and not runtime.public_projection_enabled
      and not runtime.allow_exact_amount
    then 'QA-042_HTTP_AUDIT_PASS'
    else 'QA-042_HTTP_AUDIT_FAIL'
  end as result,
  qa_counts.*,
  runtime.contribution_enabled,
  runtime.evidence_upload_enabled,
  not runtime.public_projection_enabled as projection_false,
  not runtime.allow_exact_amount as exact_false
from qa_counts
cross join public.taran_quote_runtime_config_v2 runtime
where runtime.config_key = 'provider_contribution_quote_v2';
`.trim();

const cleanupSql = String.raw`
begin;
set local session_replication_role = replica;

delete from public.taran_audit_events_v2
where actor_user_id in (${ACTOR_UUID_SQL});

delete from public.taran_review_decisions_v2
where review_case_id in (
  select review_case.id
  from public.taran_review_cases_v2 review_case
  join public.taran_submission_cases_v2 submission
    on submission.id = review_case.submission_case_id
  where submission.policy_version like 'qa-042-%'
     or submission.provider_id like 'qa-042-%'
     or submission.submitted_by in (${ACTOR_UUID_SQL})
);

delete from public.taran_submission_fields_v2
where submission_case_id in (
  select id from public.taran_submission_cases_v2
  where policy_version like 'qa-042-%'
     or provider_id like 'qa-042-%'
     or submitted_by in (${ACTOR_UUID_SQL})
);

delete from public.taran_review_cases_v2
where submission_case_id in (
  select id from public.taran_submission_cases_v2
  where policy_version like 'qa-042-%'
     or provider_id like 'qa-042-%'
     or submitted_by in (${ACTOR_UUID_SQL})
);

delete from public.taran_submission_cases_v2
where policy_version like 'qa-042-%'
   or provider_id like 'qa-042-%'
   or submitted_by in (${ACTOR_UUID_SQL});

delete from public.taran_provider_access_grants_v2
where provider_id like 'qa-042-%'
   or user_id in (${ACTOR_UUID_SQL})
   or issued_by in (${ACTOR_UUID_SQL});

delete from public.taran_admin_profiles
where user_id in (${ACTOR_UUID_SQL})
   or email like 'qa-042-%@example.invalid';

delete from public.taran_providers
where id like 'qa-042-%';

set local session_replication_role = origin;

delete from auth.mfa_challenges
where factor_id in (
  select id from auth.mfa_factors
  where user_id in (${ACTOR_UUID_SQL})
     or friendly_name = '${MFA_FRIENDLY_NAME}'
);
delete from auth.mfa_amr_claims
where session_id in (
  select id from auth.sessions where user_id in (${ACTOR_UUID_SQL})
);
delete from auth.mfa_factors
where user_id in (${ACTOR_UUID_SQL})
   or friendly_name = '${MFA_FRIENDLY_NAME}';
delete from auth.refresh_tokens
where user_id::text in (
  select id::text from (values
    ${ACTOR_LIST.map(({ id }) => `('${id}'::uuid)`).join(",\n    ")}
  ) actor(id)
);
delete from auth.sessions
where user_id in (${ACTOR_UUID_SQL});
delete from auth.identities
where user_id in (${ACTOR_UUID_SQL});
delete from auth.users
where id in (${ACTOR_UUID_SQL})
   or email like 'qa-042-%@example.invalid';

update public.taran_quote_runtime_config_v2
set contribution_enabled = false,
    evidence_upload_enabled = false,
    public_projection_enabled = false,
    allow_exact_amount = false,
    privacy_policy_version = null,
    terms_version = null,
    quote_link_retention_policy_code = null,
    scanner_provider = null,
    safe_preview_pipeline = null,
    approved_at = null,
    approved_by = null,
    updated_at = now()
where config_key = 'provider_contribution_quote_v2';

commit;

${preflightSql}
`.trim();

function decodeBase64Url(value) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(`${normalized}${padding}`, "base64");
}

function decodeJwtPayload(token) {
  const parts = String(token).split(".");
  assert.equal(parts.length, 3, "signed JWT must contain three segments");
  return JSON.parse(decodeBase64Url(parts[1]).toString("utf8"));
}

function decodeBase32(value) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const normalized = String(value).replaceAll("=", "").replace(/\s+/g, "").toUpperCase();
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

function safeApiCode(body) {
  if (!body || typeof body !== "object") return null;
  return typeof body.code === "string" && body.code.length <= 64 ? body.code : null;
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
    code: safeApiCode(body),
  };
}

function authHeaders(anonKey, accessToken = anonKey) {
  return {
    apikey: anonKey,
    authorization: `Bearer ${accessToken}`,
    "content-type": "application/json",
  };
}

function recordExpectedDeny(results, name, response, statuses = [401, 403]) {
  assert.ok(statuses.includes(response.status), `${name}: expected deny HTTP status`);
  assert.equal(response.ok, false, `${name}: request unexpectedly succeeded`);
  results.push({ name, status: response.status, outcome: "denied", code: response.code });
}

function recordExpectedSuccess(results, name, response, status = 200) {
  assert.equal(response.status, status, `${name}: unexpected HTTP status`);
  assert.equal(response.ok, true, `${name}: request failed`);
  results.push({ name, status: response.status, outcome: "allowed" });
}

async function signIn(projectUrl, anonKey, actor) {
  const response = await requestJson(
    `${projectUrl}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: authHeaders(anonKey),
      body: JSON.stringify({ email: actor.email, password: actor.password }),
    },
  );
  assert.equal(response.status, 200, "GoTrue password login failed");
  assert.equal(typeof response.body?.access_token, "string", "GoTrue access token missing");
  const claims = decodeJwtPayload(response.body.access_token);
  assert.equal(claims.sub, actor.id, "GoTrue token subject mismatch");
  assert.equal(claims.role, "authenticated", "GoTrue token role mismatch");
  return {
    accessToken: response.body.access_token,
    refreshToken: response.body.refresh_token,
    claims,
  };
}

async function rpc(projectUrl, anonKey, accessToken, functionName, body) {
  return requestJson(`${projectUrl}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    headers: authHeaders(anonKey, accessToken),
    body: JSON.stringify(body),
  });
}

async function globalLogout(projectUrl, anonKey, accessToken) {
  if (!accessToken) return false;
  const response = await requestJson(`${projectUrl}/auth/v1/logout?scope=global`, {
    method: "POST",
    headers: authHeaders(anonKey, accessToken),
  });
  return response.status === 200 || response.status === 204;
}

function assertRuntimeScope(projectUrl, anonKey, expectedProjectRef) {
  const parsed = new URL(projectUrl);
  assert.equal(parsed.protocol, "https:", "Supabase project URL must use HTTPS");
  assert.equal(parsed.hostname, `${expectedProjectRef}.supabase.co`, "unexpected Supabase project");
  const anonClaims = decodeJwtPayload(anonKey);
  assert.equal(anonClaims.role, "anon", "legacy public key must carry the anon role");
  if (anonClaims.ref) {
    assert.equal(anonClaims.ref, expectedProjectRef, "public key project mismatch");
  }
}

async function runAuthHttpE2E({
  projectUrl,
  anonKey,
  expectedProjectRef,
  credentials,
}) {
  validateCredentials(credentials);
  assertRuntimeScope(projectUrl, anonKey, expectedProjectRef);

  const results = [];
  const sessions = {};
  let factorId = null;
  let operationsAal2Token = null;
  let factorUnenrolled = false;
  const logoutResults = [];
  let scenarioError = null;

  try {
    const anonBase = await requestJson(
      `${projectUrl}/rest/v1/taran_submission_cases_v2?select=id&limit=1`,
      { method: "GET", headers: authHeaders(anonKey) },
    );
    recordExpectedDeny(results, "anon private base table", anonBase);

    const anonPublicRpc = await rpc(
      projectUrl,
      anonKey,
      anonKey,
      "taran_list_quote_public_v2",
      { p_provider_id: null, p_event_code: null, p_limit: 20 },
    );
    recordExpectedSuccess(results, "anon public quote RPC", anonPublicRpc);
    assert.deepEqual(anonPublicRpc.body, [], "anon public RPC must be empty while projection is disabled");

    for (const [name, actor] of Object.entries(credentials)) {
      sessions[name] = await signIn(projectUrl, anonKey, actor);
      assert.equal(sessions[name].claims.aal, "aal1", `${name} must start at AAL1`);
    }
    results.push({ name: "GoTrue password JWTs", status: 200, outcome: "allowed", count: 4 });

    const customerBase = await requestJson(
      `${projectUrl}/rest/v1/taran_submission_cases_v2?select=id&limit=1`,
      {
        method: "GET",
        headers: authHeaders(anonKey, sessions.customer.accessToken),
      },
    );
    recordExpectedDeny(results, "customer private base table", customerBase);

    const customerProposal = await rpc(
      projectUrl,
      anonKey,
      sessions.customer.accessToken,
      "taran_submit_information_v2",
      {
        p_source_kind: "customer_proposal",
        p_provider_id: PROVIDER_ID,
        p_event_code: "kids",
        p_fields: { provider_name: "QA-042 synthetic provider proposal" },
        p_policy_version: POLICY_VERSION,
        p_retention_policy_code: "information_submission_180d",
      },
    );
    recordExpectedSuccess(results, "customer proposal RPC", customerProposal);
    assert.match(customerProposal.body ?? "", /^[0-9a-f-]{36}$/i);

    const contentMutation = await rpc(
      projectUrl,
      anonKey,
      sessions.content.accessToken,
      "taran_issue_provider_access_v2",
      {
        p_provider_id: PROVIDER_ID,
        p_user_id: ACTORS.customer.id,
        p_scope: "submit_revision",
        p_expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      },
    );
    recordExpectedDeny(results, "content operations mutation", contentMutation, [403]);
    assert.equal(contentMutation.code, "42501");

    const providerRewardQuote = await rpc(
      projectUrl,
      anonKey,
      sessions.provider.accessToken,
      "taran_submit_quote_v2",
      {
        p_provider_id: PROVIDER_ID,
        p_event_code: "kids",
        p_quote_kind: "estimate_received",
        p_occurred_on: new Date(Date.now() - 86_400_000).toISOString().slice(0, 10),
        p_exact_amount: 1_200_000,
        p_tax_included: true,
        p_evidence_asset_id: DUMMY_EVIDENCE_ID,
        p_policy_version: POLICY_VERSION,
      },
    );
    recordExpectedDeny(results, "provider account customer reward quote", providerRewardQuote, [403]);
    assert.equal(providerRewardQuote.code, "42501");

    const operationsAal1Mutation = await rpc(
      projectUrl,
      anonKey,
      sessions.operations.accessToken,
      "taran_issue_provider_access_v2",
      {
        p_provider_id: PROVIDER_ID,
        p_user_id: ACTORS.customer.id,
        p_scope: "submit_revision",
        p_expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      },
    );
    recordExpectedDeny(results, "operations AAL1 mutation", operationsAal1Mutation, [403]);
    assert.equal(operationsAal1Mutation.code, "42501");

    const enroll = await requestJson(`${projectUrl}/auth/v1/factors`, {
      method: "POST",
      headers: authHeaders(anonKey, sessions.operations.accessToken),
      body: JSON.stringify({
        factor_type: "totp",
        friendly_name: MFA_FRIENDLY_NAME,
      }),
    });
    assert.equal(enroll.status, 200, "TOTP enrollment failed");
    factorId = enroll.body?.id;
    const totpSecret = enroll.body?.totp?.secret;
    assert.match(factorId ?? "", /^[0-9a-f-]{36}$/i, "TOTP factor id missing");
    assert.match(totpSecret ?? "", /^[A-Z2-7]+=*$/i, "TOTP secret missing");

    const challenge = await requestJson(
      `${projectUrl}/auth/v1/factors/${encodeURIComponent(factorId)}/challenge`,
      {
        method: "POST",
        headers: authHeaders(anonKey, sessions.operations.accessToken),
        body: "{}",
      },
    );
    assert.equal(challenge.status, 200, "TOTP challenge failed");
    assert.match(challenge.body?.id ?? "", /^[0-9a-f-]{36}$/i, "TOTP challenge id missing");

    const verify = await requestJson(
      `${projectUrl}/auth/v1/factors/${encodeURIComponent(factorId)}/verify`,
      {
        method: "POST",
        headers: authHeaders(anonKey, sessions.operations.accessToken),
        body: JSON.stringify({
          challenge_id: challenge.body.id,
          code: currentTotp(totpSecret),
        }),
      },
    );
    assert.equal(verify.status, 200, "TOTP verification failed");
    operationsAal2Token = verify.body?.access_token;
    assert.equal(typeof operationsAal2Token, "string", "AAL2 access token missing");
    const aal2Claims = decodeJwtPayload(operationsAal2Token);
    assert.equal(aal2Claims.sub, ACTORS.operations.id, "AAL2 token subject mismatch");
    assert.equal(aal2Claims.aal, "aal2", "verified TOTP token is not AAL2");
    results.push({ name: "actual TOTP MFA AAL2", status: 200, outcome: "allowed" });

    const operationsAal2Mutation = await rpc(
      projectUrl,
      anonKey,
      operationsAal2Token,
      "taran_issue_provider_access_v2",
      {
        p_provider_id: PROVIDER_ID,
        p_user_id: ACTORS.customer.id,
        p_scope: "submit_revision",
        p_expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      },
    );
    recordExpectedSuccess(results, "operations AAL2 mutation", operationsAal2Mutation);
    assert.match(operationsAal2Mutation.body ?? "", /^[0-9a-f-]{36}$/i);
  } catch (error) {
    scenarioError = error;
  } finally {
    if (factorId) {
      const unenroll = await requestJson(
        `${projectUrl}/auth/v1/factors/${encodeURIComponent(factorId)}`,
        {
          method: "DELETE",
          headers: authHeaders(
            anonKey,
            operationsAal2Token ?? sessions.operations?.accessToken,
          ),
        },
      );
      factorUnenrolled = unenroll.status === 200 || unenroll.status === 204;
    }

    for (const [name, session] of Object.entries(sessions)) {
      logoutResults.push({
        name,
        loggedOut: await globalLogout(
          projectUrl,
          anonKey,
          name === "operations" && operationsAal2Token
            ? operationsAal2Token
            : session.accessToken,
        ),
      });
    }
  }

  if (scenarioError) throw scenarioError;
  assert.equal(factorUnenrolled, true, "TOTP factor unenroll failed");
  assert.equal(logoutResults.length, 4, "not all temporary sessions were processed");
  assert.equal(logoutResults.every(({ loggedOut }) => loggedOut), true, "global logout failed");

  return {
    suite: "QA-042 real GoTrue JWT / PostgREST / TOTP AAL2",
    passed: results.length,
    results,
    cleanup: {
      factorUnenrolled,
      globalLogoutCount: logoutResults.filter(({ loggedOut }) => loggedOut).length,
    },
    secretOutputCount: 0,
    externalEmailSmsCount: 0,
    storageObjectCount: 0,
  };
}

function contractCheck() {
  const credentials = createEphemeralCredentials();
  validateCredentials(credentials);
  const setup = buildSetupSql(credentials);

  assert.ok(preflightSql.includes("QA-042_PREFLIGHT_PASS"));
  assert.ok(setup.includes("QA-042_SETUP_PASS"));
  assert.ok(scenarioAuditSql.includes("QA-042_HTTP_AUDIT_PASS"));
  assert.ok(cleanupSql.includes("auth.mfa_factors"));
  assert.ok(cleanupSql.includes("auth.sessions"));
  assert.ok(cleanupSql.includes("auth.refresh_tokens"));
  assert.ok(cleanupSql.includes("storage.objects"));
  assert.ok(!preflightSql.includes(credentials.customer.password));
  assert.ok(!cleanupSql.includes(credentials.operations.password));

  return {
    suite: "QA-042 harness contract",
    passed: 10,
    actorCount: ACTOR_LIST.length,
    secretOutputCount: 0,
    networkEgressCount: 0,
  };
}

export {
  ACTORS,
  MFA_FRIENDLY_NAME,
  POLICY_VERSION,
  PROVIDER_ID,
  buildSetupSql,
  cleanupSql,
  contractCheck,
  createEphemeralCredentials,
  preflightSql,
  runAuthHttpE2E,
  scenarioAuditSql,
};

const cliProcess = globalThis.process;
if (Array.isArray(cliProcess?.argv)) {
  const mode = cliProcess.argv[2] ?? "contract";
  const safeModes = {
    contract: () => JSON.stringify(contractCheck(), null, 2),
    preflight: () => preflightSql,
    audit: () => scenarioAuditSql,
    cleanup: () => cleanupSql,
  };

  if (!(mode in safeModes)) {
    console.error(
      "Usage: node provider-contribution-quote-v2-auth-http-e2e.mjs "
      + "[contract|preflight|audit|cleanup]",
    );
    console.error("Setup and HTTP modes are import-only so credentials remain in memory.");
    cliProcess.exitCode = 2;
  } else {
    cliProcess.stdout.write(`${safeModes[mode]()}\n`);
  }
}
