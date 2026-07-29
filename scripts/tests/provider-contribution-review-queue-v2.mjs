import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migrationUrl = new URL(
  "../../migrations/016_provider_contribution_review_queue_v2.sql",
  import.meta.url
);
const priorMigrationUrl = new URL(
  "../../migrations/015_provider_contribution_quote_v2.sql",
  import.meta.url
);
const migration = await readFile(migrationUrl, "utf8");
const priorMigration = await readFile(priorMigrationUrl, "utf8");
const normalized = migration.toLowerCase();
const checks = [];

function check(name, fn) {
  fn();
  checks.push(name);
}

function functionBlock(name) {
  const start = normalized.indexOf(`create or replace function public.${name}(`);
  assert.notEqual(start, -1, `${name} must exist.`);
  const end = normalized.indexOf("\n$$;", start);
  assert.notEqual(end, -1, `${name} must have a complete body.`);
  return normalized.slice(start, end + 4);
}

const rpcName = "taran_list_review_queue_v2";
const signature = "text, integer, timestamptz, uuid";
const rpc = functionBlock(rpcName);

check("016 is additive and contains one scoped RPC", () => {
  assert.equal(
    (normalized.match(/create or replace function public\./g) ?? []).length,
    1
  );
  assert.doesNotMatch(
    normalized,
    /\b(?:create|alter|drop|truncate)\s+table\b|\bcreate\s+(?:unique\s+)?index\b/
  );
  assert.match(normalized, /run after 015_provider_contribution_quote_v2\.sql/);
});

check("RPC is SECURITY DEFINER with pinned resolution and RLS bypass", () => {
  assert.match(rpc, /security definer/);
  assert.match(rpc, /set search_path = public, pg_catalog/);
  assert.match(rpc, /set row_security = off/);
});

check("body fails closed for identity, role, AAL and deletion", () => {
  assert.match(rpc, /auth\.uid\(\) is null/);
  assert.match(rpc, /not public\.taran_is_admin\(\)/);
  assert.match(rpc, /not public\.taran_is_aal2_v2\(\)/);
  assert.match(rpc, /public\.taran_account_deletion_self_is_active\(\)/);
  assert.match(rpc, /using errcode = '42501'/);
});

check("state filter is mandatory and closed over existing review states", () => {
  assert.match(rpc, /p_review_state is null/);
  assert.match(
    rpc,
    /p_review_state not in \('open','assigned','approved','rejected','cancelled'\)/
  );
  assert.match(rpc, /where review_case\.state = p_review_state/);
});

check("page size rejects null and values outside 1 through 50", () => {
  assert.match(
    rpc,
    /p_page_size is null or p_page_size < 1 or p_page_size > 50/
  );
  assert.doesNotMatch(rpc, /least\s*\(\s*50|greatest\s*\(\s*1/);
});

check("cursor is paired, stable and deterministic", () => {
  assert.match(
    rpc,
    /\(p_before_created_at is null\) <> \(p_before_review_case_id is null\)/
  );
  assert.match(rpc, /review_case\.created_at < p_before_created_at/);
  assert.match(
    rpc,
    /review_case\.created_at = p_before_created_at[\s\S]*review_case\.id < p_before_review_case_id/
  );
  assert.match(
    rpc,
    /order by review_case\.created_at desc, review_case\.id desc/
  );
  assert.match(rpc, /limit p_page_size/);
  assert.doesNotMatch(rpc, /\boffset\b/);
});

check("return projection has exactly six approved columns", () => {
  const returnMatch = rpc.match(/returns table\s*\(([\s\S]*?)\)\s*language plpgsql/);
  assert.ok(returnMatch, "RETURNS TABLE declaration must be present.");
  const columns = [...returnMatch[1].matchAll(
    /^\s*([a-z_]+)\s+(?:uuid|text|timestamptz)\s*,?\s*$/gm
  )].map((match) => match[1]);
  assert.deepEqual(columns, [
    "review_case_id",
    "source_kind",
    "canonical_event_code",
    "risk_level",
    "review_state",
    "created_at",
  ]);
  assert.match(
    rpc,
    /submission\.event_code as canonical_event_code/
  );
});

check("private identifiers and values never enter the projection", () => {
  const projectionStart = rpc.indexOf("return query");
  const projection = rpc.slice(projectionStart);
  for (const forbidden of [
    "submitted_by",
    "contributor_user_id",
    "owner_user_id",
    "assigned_reviewer",
    "reviewer_id",
    "object_key",
    "evidence_asset",
    "exact_amount",
    "fingerprint_hmac",
    "provider_id",
    "email",
  ]) {
    assert.equal(
      projection.includes(forbidden),
      false,
      `${forbidden} must not enter the queue SELECT.`
    );
  }
  assert.doesNotMatch(
    projection,
    /taran_(?:evidence_assets|quote_prices|quote_cases|provider_identities|review_decisions)_v2/
  );
});

check("authenticated may invoke but anonymous and PUBLIC may not", () => {
  const escapedSignature = signature.replaceAll(" ", "\\s*");
  assert.match(
    normalized,
    new RegExp(
      `revoke all on function public\\.${rpcName}\\(\\s*${escapedSignature}\\s*\\)` +
      `[\\s\\S]*?from public, anon, authenticated`
    )
  );
  assert.match(
    normalized,
    new RegExp(
      `grant execute on function public\\.${rpcName}\\(\\s*${escapedSignature}\\s*\\)` +
      `[\\s\\S]*?to authenticated`
    )
  );
  assert.doesNotMatch(
    normalized,
    new RegExp(
      `grant execute on function public\\.${rpcName}\\([\\s\\S]*?\\)\\s+to\\s+(?:anon|public)`
    )
  );
});

check("private base-table browser grants remain zero", () => {
  assert.doesNotMatch(
    normalized,
    /\bgrant\s+(?:all|select|insert|update|delete)[^;]*\bon\s+(?:table\s+)?public\./
  );
  assert.match(
    priorMigration.toLowerCase(),
    /revoke all on table public\.%i from public, anon, authenticated/
  );
  const priorBrowserBaseGrants = [...priorMigration.toLowerCase().matchAll(
    /grant\s+([^;]+?)\s+on\s+(?:table\s+)?public\.([a-z0-9_]+_v2)\s+to\s+(?:anon|authenticated)/g
  )];
  assert.deepEqual(priorBrowserBaseGrants, []);
});

check("existing assignment and decision contracts are not replaced", () => {
  for (const priorFunction of [
    "taran_assign_review_case_v2",
    "taran_decide_information_v2",
    "taran_decide_quote_v2",
  ]) {
    assert.doesNotMatch(
      normalized,
      new RegExp(`create or replace function public\\.${priorFunction}\\(`)
    );
    assert.match(
      priorMigration.toLowerCase(),
      new RegExp(`create or replace function public\\.${priorFunction}\\(`)
    );
  }
});

async function loadPGlite() {
  if (process.env.BE027_PGLITE_MODULE) {
    return await import(process.env.BE027_PGLITE_MODULE);
  }
  try {
    return await import("@electric-sql/pglite");
  } catch (error) {
    if (
      error?.code === "ERR_MODULE_NOT_FOUND" &&
      String(error?.message ?? "").includes("@electric-sql/pglite")
    ) {
      return null;
    }
    throw error;
  }
}

async function expectSqlState(promise, sqlState, label) {
  await assert.rejects(
    promise,
    (error) => {
      assert.equal(error?.code, sqlState, `${label} must use SQLSTATE ${sqlState}.`);
      return true;
    },
    label
  );
}

const pgliteModule = await loadPGlite();
let pgliteResult = {
  available: false,
  skipped: true,
  reason: "@electric-sql/pglite is not installed in this worktree",
  checks: 0,
};

if (pgliteModule) {
  const { PGlite } = pgliteModule;
  const db = new PGlite();
  let behaviorChecks = 0;
  const ids = {
    owner: "00000000-0000-4000-8000-000000000001",
    admin: "00000000-0000-4000-8000-000000000002",
    operations: "00000000-0000-4000-8000-000000000003",
    content: "00000000-0000-4000-8000-000000000004",
    provider: "00000000-0000-4000-8000-000000000005",
    customer: "00000000-0000-4000-8000-000000000006",
    deletingOperations: "00000000-0000-4000-8000-000000000007",
  };

  const setIdentity = async (userId, aal = "aal2") => {
    await db.query(
      `select
         set_config('request.jwt.claim.sub', $1, false),
         set_config('request.jwt.claims', $2, false)`,
      [userId ?? "", JSON.stringify(userId ? { sub: userId, aal } : { aal })]
    );
  };

  const listQueue = (
    state = "open",
    pageSize = 20,
    beforeCreatedAt = null,
    beforeReviewCaseId = null
  ) => db.query(
    `select *
     from public.taran_list_review_queue_v2($1, $2, $3, $4)`,
    [state, pageSize, beforeCreatedAt, beforeReviewCaseId]
  );

  try {
    await db.exec(`
      create schema auth;
      create role anon nologin;
      create role authenticated nologin;

      create or replace function auth.uid()
      returns uuid
      language sql
      stable
      as $auth$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
      $auth$;

      create or replace function auth.jwt()
      returns jsonb
      language sql
      stable
      as $auth$
        select coalesce(
          nullif(current_setting('request.jwt.claims', true), '')::jsonb,
          '{}'::jsonb
        );
      $auth$;

      create table public.taran_admin_profiles (
        user_id uuid primary key,
        role text not null
      );

      create table public.taran_account_deletion_tombstones (
        user_id uuid primary key
      );

      create table public.taran_submission_cases_v2 (
        id uuid primary key,
        source_kind text not null,
        event_code text
      );

      create table public.taran_review_cases_v2 (
        id uuid primary key,
        submission_case_id uuid not null unique
          references public.taran_submission_cases_v2(id),
        state text not null,
        risk_level text not null,
        created_at timestamptz not null
      );

      create or replace function public.taran_is_admin()
      returns boolean
      language sql
      stable
      security definer
      set search_path = public, pg_catalog
      set row_security = off
      as $helper$
        select exists (
          select 1
          from public.taran_admin_profiles profile
          where profile.user_id = auth.uid()
            and profile.role in ('owner','admin','operations')
        );
      $helper$;

      create or replace function public.taran_is_aal2_v2()
      returns boolean
      language sql
      stable
      security definer
      set search_path = public, auth, pg_catalog
      set row_security = off
      as $helper$
        select coalesce(auth.jwt()->>'aal', '') = 'aal2';
      $helper$;

      create or replace function public.taran_account_deletion_self_is_active()
      returns boolean
      language sql
      volatile
      security definer
      set search_path = public, pg_catalog
      set row_security = off
      as $helper$
        select auth.uid() is not null and exists (
          select 1
          from public.taran_account_deletion_tombstones tombstone
          where tombstone.user_id = auth.uid()
        );
      $helper$;
    `);

    await db.exec(migration);
    await db.exec(migration);
    behaviorChecks += 1;

    await db.query(
      `insert into public.taran_admin_profiles (user_id, role)
       values
         ($1, 'owner'),
         ($2, 'admin'),
         ($3, 'operations'),
         ($4, 'content'),
         ($5, 'provider'),
         ($6, 'operations')`,
      [
        ids.owner,
        ids.admin,
        ids.operations,
        ids.content,
        ids.provider,
        ids.deletingOperations,
      ]
    );
    await db.query(
      `insert into public.taran_account_deletion_tombstones (user_id)
       values ($1)`,
      [ids.deletingOperations]
    );
    await db.exec(`
      insert into public.taran_submission_cases_v2 (id, source_kind, event_code)
      values
        ('10000000-0000-4000-8000-000000000001', 'customer_quote', 'kids'),
        ('10000000-0000-4000-8000-000000000002', 'provider_revision', 'meeting'),
        ('10000000-0000-4000-8000-000000000003', 'operator_seed', null),
        ('10000000-0000-4000-8000-000000000004', 'customer_proposal', 'other');

      insert into public.taran_review_cases_v2
        (id, submission_case_id, state, risk_level, created_at)
      values
        (
          '20000000-0000-4000-8000-000000000002',
          '10000000-0000-4000-8000-000000000001',
          'open',
          'high',
          '2026-07-28T03:00:00Z'
        ),
        (
          '20000000-0000-4000-8000-000000000001',
          '10000000-0000-4000-8000-000000000002',
          'open',
          'standard',
          '2026-07-28T03:00:00Z'
        ),
        (
          '20000000-0000-4000-8000-000000000003',
          '10000000-0000-4000-8000-000000000003',
          'open',
          'standard',
          '2026-07-27T03:00:00Z'
        ),
        (
          '20000000-0000-4000-8000-000000000004',
          '10000000-0000-4000-8000-000000000004',
          'assigned',
          'high',
          '2026-07-29T03:00:00Z'
        );
    `);

    const acl = await db.query(`
      select
        has_function_privilege(
          'anon',
          'public.taran_list_review_queue_v2(text,integer,timestamp with time zone,uuid)',
          'EXECUTE'
        ) as anon_execute,
        has_function_privilege(
          'authenticated',
          'public.taran_list_review_queue_v2(text,integer,timestamp with time zone,uuid)',
          'EXECUTE'
        ) as authenticated_execute
    `);
    assert.deepEqual(acl.rows, [{
      anon_execute: false,
      authenticated_execute: true,
    }]);
    behaviorChecks += 1;

    await setIdentity(null);
    await expectSqlState(listQueue(), "42501", "anonymous access");
    await setIdentity(ids.customer);
    await expectSqlState(listQueue(), "42501", "customer access");
    await setIdentity(ids.provider);
    await expectSqlState(listQueue(), "42501", "provider access");
    await setIdentity(ids.content);
    await expectSqlState(listQueue(), "42501", "content access");
    await setIdentity(ids.operations, "aal1");
    await expectSqlState(listQueue(), "42501", "AAL1 operations access");
    await setIdentity(ids.deletingOperations);
    await expectSqlState(listQueue(), "42501", "deleting operations access");
    behaviorChecks += 6;

    for (const allowedUser of [ids.owner, ids.admin, ids.operations]) {
      await setIdentity(allowedUser);
      const result = await listQueue("open", 1);
      assert.equal(result.rows.length, 1);
    }
    behaviorChecks += 3;

    await setIdentity(ids.operations);
    await expectSqlState(listQueue("pending", 20), "22023", "invalid state");
    await expectSqlState(listQueue(null, 20), "22023", "null state");
    await expectSqlState(listQueue("open", 0), "22023", "zero page size");
    await expectSqlState(listQueue("open", 51), "22023", "oversized page");
    await expectSqlState(
      listQueue("open", 20, "2026-07-28T03:00:00Z", null),
      "22023",
      "partial cursor"
    );
    behaviorChecks += 5;

    const firstPage = await listQueue("open", 2);
    assert.deepEqual(
      firstPage.rows.map((row) => row.review_case_id),
      [
        "20000000-0000-4000-8000-000000000002",
        "20000000-0000-4000-8000-000000000001",
      ]
    );
    assert.deepEqual(Object.keys(firstPage.rows[0]), [
      "review_case_id",
      "source_kind",
      "canonical_event_code",
      "risk_level",
      "review_state",
      "created_at",
    ]);
    const cursor = firstPage.rows.at(-1);
    const secondPage = await listQueue(
      "open",
      2,
      cursor.created_at,
      cursor.review_case_id
    );
    assert.deepEqual(
      secondPage.rows.map((row) => row.review_case_id),
      ["20000000-0000-4000-8000-000000000003"]
    );
    assert.equal(
      new Set([...firstPage.rows, ...secondPage.rows].map(
        (row) => row.review_case_id
      )).size,
      3
    );
    behaviorChecks += 3;

    const assigned = await listQueue("assigned", 50);
    assert.deepEqual(
      assigned.rows.map((row) => row.review_case_id),
      ["20000000-0000-4000-8000-000000000004"]
    );
    behaviorChecks += 1;

    pgliteResult = {
      available: true,
      skipped: false,
      firstApply: "PASS",
      reapply: "PASS",
      checks: behaviorChecks,
    };
  } finally {
    await db.close();
  }
}

console.log(JSON.stringify({
  suite: "BE-027 provider contribution review queue v2",
  migration: "016_provider_contribution_review_queue_v2.sql",
  staticChecks: checks.length,
  pglite: pgliteResult,
  networkEgressCount: 0,
  productionDatabaseChanges: 0,
  realDataCount: 0,
}, null, 2));
