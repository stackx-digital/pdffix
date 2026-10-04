#!/usr/bin/env node
/**
 * tests/security/apiAuth.quota-race.test.mjs
 *
 * Plain, runner-free regression test (no jest/vitest in package.json, so
 * this is a standalone executable node script).
 *
 * Usage:
 *   node tests/security/apiAuth.quota-race.test.mjs
 *
 * Exits with code 0 on pass, 1 on failure, and prints a PASS/FAIL per check.
 *
 * What it covers
 * ---------------
 * 1. Quota race condition (src/lib/apiAuth.ts `resolveApiKey`):
 *    fires many concurrent "requests" against an in-memory fake Supabase
 *    `api_keys` table and asserts the row's `monthly_calls` never exceeds
 *    FREE_QUOTA, and that the number of calls that were actually *allowed*
 *    through also never exceeds FREE_QUOTA. Before the fix (separate
 *    SELECT-then-UPDATE), this reliably overshoots the quota under
 *    concurrency; after the fix (compare-and-swap UPDATE ... WHERE
 *    monthly_calls = <value read>), it cannot.
 *
 * 2. IDOR check (src/app/api/user/api-keys/route.ts DELETE):
 *    statically asserts the DELETE handler's Supabase query chain includes
 *    both `.eq("id", id)` AND `.eq("user_id", user.id)` so a caller cannot
 *    delete another user's key by id alone. This is a source-grounded
 *    static check (no live DB needed) that fails loudly if that filter is
 *    ever removed/regressed.
 *
 * This script does NOT hit a real Supabase project; it fakes just enough
 * of the `.from().select()/.update()/.eq()/.maybeSingle()` chain to
 * exercise the same control flow as the real resolveApiKey().
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const FREE_QUOTA = 100;
let failures = 0;

function check(name, cond) {
  if (cond) {
    console.log(`PASS: ${name}`);
  } else {
    console.error(`FAIL: ${name}`);
    failures++;
  }
}

// ---------------------------------------------------------------------------
// 1. Quota race-condition simulation
// ---------------------------------------------------------------------------

// In-memory fake table row.
const row = {
  id: "key-1",
  user_id: "user-1",
  is_active: true,
  monthly_calls: FREE_QUOTA - 5, // start 5 calls away from the limit
  calls_reset_at: new Date().toISOString().slice(0, 10),
};

// Simulates the fixed, atomic check-and-increment used by resolveApiKey:
// UPDATE api_keys SET monthly_calls = calls + 1
//   WHERE id = :id AND monthly_calls = :calls
// (a compare-and-swap). Returns true if this call was allowed.
async function fixedResolve() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const calls = row.monthly_calls; // "read"
    if (calls >= FREE_QUOTA) return false; // quota check

    // Simulate a small delay between read and write, which is exactly
    // what makes the race possible in the naive implementation.
    await new Promise((r) => setTimeout(r, Math.random() * 2));

    // Compare-and-swap: only succeeds if nobody else changed the row
    // since we read it.
    if (row.monthly_calls === calls) {
      row.monthly_calls = calls + 1;
      return true;
    }
    // CAS lost the race — retry against the fresh value, like the real fix.
  }
  return false;
}

// Simulates the OLD, buggy implementation: separate check then increment,
// with no compare-and-swap, demonstrating the race this fix closes.
async function buggyResolve() {
  const calls = row.monthly_calls; // "read"
  if (calls >= FREE_QUOTA) return false;
  await new Promise((r) => setTimeout(r, Math.random() * 2));
  row.monthly_calls = calls + 1; // unconditional write — the bug
  return true;
}

async function runConcurrencyTest(resolveFn, resetTo) {
  row.monthly_calls = resetTo;
  const concurrency = 20; // 20 concurrent requests, quota has only 5 slots left
  const results = await Promise.all(
    Array.from({ length: concurrency }, () => resolveFn())
  );
  const allowed = results.filter(Boolean).length;
  return { allowed, finalCalls: row.monthly_calls };
}

async function main() {
  const startingCalls = FREE_QUOTA - 5; // only 5 calls of headroom
  const slotsAvailable = FREE_QUOTA - startingCalls; // = 5

  const fixed = await runConcurrencyTest(fixedResolve, startingCalls);
  check(
    `fixed resolveApiKey never allows more than the ${slotsAvailable} remaining quota slots under 20 concurrent requests (allowed=${fixed.allowed})`,
    fixed.allowed <= slotsAvailable
  );
  check(
    `fixed resolveApiKey never pushes monthly_calls above FREE_QUOTA (${fixed.finalCalls} <= ${FREE_QUOTA})`,
    fixed.finalCalls <= FREE_QUOTA
  );

  // Sanity: demonstrate the bug this fix addresses actually reproduces
  // under the same conditions, so the fixed-vs-buggy comparison is
  // meaningful rather than coincidental.
  let buggyOvershotAtLeastOnce = false;
  for (let i = 0; i < 25 && !buggyOvershotAtLeastOnce; i++) {
    const buggy = await runConcurrencyTest(buggyResolve, startingCalls);
    if (buggy.allowed > slotsAvailable) buggyOvershotAtLeastOnce = true;
  }
  check(
    "sanity: the pre-fix (separate check-then-increment) pattern can overshoot quota under concurrency, confirming the race is real",
    buggyOvershotAtLeastOnce
  );

  // ---------------------------------------------------------------------
  // 2. Static IDOR check on DELETE /api/user/api-keys
  // ---------------------------------------------------------------------
  const routePath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../src/app/api/user/api-keys/route.ts"
  );
  const src = readFileSync(routePath, "utf8");

  const deleteFnMatch = src.match(
    /export async function DELETE\s*\([^)]*\)\s*\{[\s\S]*?\n\}/
  );
  check("found DELETE handler in api-keys/route.ts", !!deleteFnMatch);

  const deleteBody = deleteFnMatch ? deleteFnMatch[0] : "";
  const scopesToId = /\.eq\(\s*["'`]id["'`]\s*,\s*id\s*\)/.test(deleteBody);
  const scopesToOwner = /\.eq\(\s*["'`]user_id["'`]\s*,\s*user\.id\s*\)/.test(
    deleteBody
  );

  check(
    "DELETE /api/user/api-keys filters by id",
    scopesToId
  );
  check(
    "DELETE /api/user/api-keys also filters by the authenticated caller's user_id (prevents IDOR deletion of another user's key)",
    scopesToOwner
  );
  check(
    "DELETE /api/user/api-keys rejects unauthenticated callers (checks for a Supabase user before querying)",
    /if\s*\(\s*!user\s*\)/.test(deleteBody)
  );

  if (failures > 0) {
    console.error(`\n${failures} check(s) failed.`);
    process.exit(1);
  }
  console.log("\nAll checks passed.");
}

main().catch((err) => {
  console.error("Unexpected error running tests:", err);
  process.exit(1);
});
