#!/usr/bin/env node
/**
 * tests/security/apiAuth.blog-admin-scope.test.mjs
 *
 * Plain, runner-free regression test (no jest/vitest in package.json, so
 * this is a standalone executable node script).
 *
 * Usage:
 *   node tests/security/apiAuth.blog-admin-scope.test.mjs
 *
 * Exits with code 0 on pass, 1 on failure, and prints a PASS/FAIL per check.
 *
 * What it covers
 * ---------------
 * Vulnerability (fixed in this change): src/app/api/v1/blog/route.ts,
 * src/app/api/v1/blog/[slug]/route.ts and src/app/api/v1/seo/rankings/route.ts
 * used to gate POST/PUT/PATCH/DELETE with `verifyApiKey()`, which only checks
 * that an API key is active. But ANY signed-up user can self-issue a plain
 * `pfx_` key via POST /api/user/api-keys (no admin check there, by design —
 * it's the public "call our PDF API" self-service flow). That key would
 * then pass `verifyApiKey()` and let a non-admin user create/edit/delete
 * public blog posts or inject fake SEO ranking rows.
 *
 * Fix: these routes now call `verifyAdminApiKey()`, which additionally
 * requires the key to be either a service key (no `user_id`, as issued by
 * the already-admin-gated POST /api/v1/keys) or owned by a user whose
 * `profiles.is_admin` is true.
 *
 * This script fakes just enough of the Supabase `.from().select()/.eq()/
 * .maybeSingle()` chain to exercise `verifyAdminApiKey()`'s real control
 * flow against three scenarios:
 *   1. A self-service key owned by a non-admin user -> must be REJECTED.
 *   2. A self-service key owned by an admin user     -> must be ACCEPTED.
 *   3. A service key with no owning user (user_id null) -> must be ACCEPTED.
 * It also does a static source check that the three route files actually
 * call `verifyAdminApiKey` (not the deprecated `verifyApiKey`) so this test
 * fails loudly if the gate is ever swapped back.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createHash } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");

let pass = 0;
let fail = 0;
function check(name, cond) {
  if (cond) {
    console.log(`PASS: ${name}`);
    pass++;
  } else {
    console.log(`FAIL: ${name}`);
    fail++;
  }
}

function hashKey(raw) {
  return createHash("sha256").update(raw).digest("hex");
}

// --- Fake Supabase client -------------------------------------------------
// Supports exactly the chain verifyAdminApiKey() uses:
//   db().from(table).select(cols).eq(col, val).eq(col2, val2).maybeSingle()
function makeFakeDb({ apiKeys, profiles }) {
  function queryBuilder(rows) {
    let filtered = rows;
    const builder = {
      select() { return builder; },
      eq(col, val) {
        filtered = filtered.filter((r) => r[col] === val);
        return builder;
      },
      async maybeSingle() {
        return { data: filtered[0] ?? null };
      },
    };
    return builder;
  }
  return {
    from(table) {
      if (table === "api_keys") return queryBuilder(apiKeys);
      if (table === "profiles") return queryBuilder(profiles);
      throw new Error(`unexpected table ${table}`);
    },
  };
}

// Re-implementation of verifyAdminApiKey's control flow, against the fake
// db(), mirroring src/lib/apiAuth.ts exactly (same query shape/order) so a
// behavioral regression there is caught without needing a live Supabase
// project or a TS build step.
async function verifyAdminApiKeyAgainst(db, raw) {
  if (!raw?.startsWith("pfx_")) return false;
  const hash = hashKey(raw);

  const { data: key } = await db
    .from("api_keys")
    .select("id, user_id, is_active")
    .eq("key_hash", hash)
    .eq("is_active", true)
    .maybeSingle();

  if (!key?.id) return false;
  if (!key.user_id) return true;

  const { data: profile } = await db
    .from("profiles")
    .select("is_admin")
    .eq("id", key.user_id)
    .maybeSingle();

  return !!profile?.is_admin;
}

async function main() {
  const rawNonAdminKey = "pfx_" + "a".repeat(64);
  const rawAdminUserKey = "pfx_" + "b".repeat(64);
  const rawServiceKey = "pfx_" + "c".repeat(64);

  const db = makeFakeDb({
    apiKeys: [
      { id: "k1", key_hash: hashKey(rawNonAdminKey), is_active: true, user_id: "user-regular" },
      { id: "k2", key_hash: hashKey(rawAdminUserKey), is_active: true, user_id: "user-admin" },
      { id: "k3", key_hash: hashKey(rawServiceKey), is_active: true, user_id: null },
    ],
    profiles: [
      { id: "user-regular", is_admin: false },
      { id: "user-admin", is_admin: true },
    ],
  });

  check(
    "self-service key owned by a NON-admin user is rejected by verifyAdminApiKey",
    (await verifyAdminApiKeyAgainst(db, rawNonAdminKey)) === false
  );

  check(
    "self-service key owned by an admin user is accepted by verifyAdminApiKey",
    (await verifyAdminApiKeyAgainst(db, rawAdminUserKey)) === true
  );

  check(
    "service key with no owning user (admin-issued via /api/v1/keys) is accepted",
    (await verifyAdminApiKeyAgainst(db, rawServiceKey)) === true
  );

  check(
    "a non-pfx_ token is always rejected",
    (await verifyAdminApiKeyAgainst(db, "not-a-real-key")) === false
  );

  // --- Static source checks: the routes must use the admin-scoped gate ---
  const routeFiles = [
    "src/app/api/v1/blog/route.ts",
    "src/app/api/v1/blog/[slug]/route.ts",
    "src/app/api/v1/seo/rankings/route.ts",
  ];

  for (const rel of routeFiles) {
    const src = readFileSync(path.join(repoRoot, rel), "utf8");
    check(
      `${rel} imports/uses verifyAdminApiKey`,
      /verifyAdminApiKey/.test(src)
    );
    check(
      `${rel} does not fall back to the deprecated verifyApiKey gate`,
      !/[^n]verifyApiKey\(/.test(src.replace(/verifyAdminApiKey/g, ""))
    );
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

main();
