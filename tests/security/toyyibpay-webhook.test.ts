/**
 * Security regression test for src/app/api/webhooks/toyyibpay/route.ts
 *
 * Vulnerability (fixed): the webhook granted "pro" plan based purely on the
 * client/browser-posted `status` field. Because the bill code is NOT secret
 * (it is embedded in the redirect URL shown to the paying user's browser),
 * an attacker could call /api/subscribe/toyyibpay to obtain their own real
 * (unpaid) bill code, then POST directly to this webhook with
 * status=1 & billcode=<their own code> & order_id=<their own user id> to
 * self-upgrade to "pro" without ever paying.
 *
 * The fix adds `isBillActuallyPaid()`, which re-queries ToyyibPay's own
 * getBillTransactions API server-side and only trusts THAT result, never
 * the client-posted `status` field.
 *
 * This test has no project test runner configured (package.json has no
 * jest/vitest/mocha). Run it manually with tsx:
 *
 *   npx tsx tests/security/toyyibpay-webhook.test.ts
 *
 * It mocks global.fetch to simulate both ToyyibPay responses and asserts
 * isBillActuallyPaid() behaves correctly, proving spoofed `status=1` claims
 * are rejected unless ToyyibPay's API itself confirms payment.
 */

import { isBillActuallyPaid } from "@/app/api/webhooks/toyyibpay/route";

process.env.TOYYIBPAY_SECRET_KEY = "test-secret";
process.env.TOYYIBPAY_BASE_URL = "https://toyyibpay.test";

let passed = 0;
let failed = 0;

function assert(cond: boolean, msg: string) {
  if (cond) {
    passed++;
    console.log(`  PASS: ${msg}`);
  } else {
    failed++;
    console.error(`  FAIL: ${msg}`);
  }
}

async function run() {
  console.log("Test 1: ToyyibPay API reports the bill as UNPAID -> must NOT be trusted");
  (global as any).fetch = async () => ({
    text: async () => JSON.stringify([{ billpaymentStatus: "2" }]), // pending, not paid
  });
  const resultUnpaid = await isBillActuallyPaid("FAKE_BILL_CODE");
  assert(resultUnpaid === false, "isBillActuallyPaid() returns false when ToyyibPay says not paid");

  console.log("\nTest 2: ToyyibPay API reports the bill as genuinely PAID -> should be trusted");
  (global as any).fetch = async () => ({
    text: async () => JSON.stringify([{ billpaymentStatus: "1" }]),
  });
  const resultPaid = await isBillActuallyPaid("REAL_PAID_BILL_CODE");
  assert(resultPaid === true, "isBillActuallyPaid() returns true when ToyyibPay confirms payment");

  console.log("\nTest 3: ToyyibPay API returns no transactions (e.g. bogus/unknown bill code) -> must NOT be trusted");
  (global as any).fetch = async () => ({
    text: async () => JSON.stringify([]),
  });
  const resultEmpty = await isBillActuallyPaid("UNKNOWN_BILL_CODE");
  assert(resultEmpty === false, "isBillActuallyPaid() returns false when no transaction record exists");

  console.log("\nTest 4: ToyyibPay API call fails/network error -> must fail closed (not paid)");
  (global as any).fetch = async () => {
    throw new Error("network down");
  };
  const resultError = await isBillActuallyPaid("ANY_BILL_CODE");
  assert(resultError === false, "isBillActuallyPaid() fails closed on network/API error");

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run();
