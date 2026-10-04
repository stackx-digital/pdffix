import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const TOYYIBPAY_BASE = process.env.TOYYIBPAY_BASE_URL ?? "https://toyyibpay.com";
const SECRET_KEY = process.env.TOYYIBPAY_SECRET_KEY ?? "";

// The webhook body (status, billcode, refno, amount, ...) is posted by the
// caller's browser/server with no signature, and the bill code itself is not
// secret (it is visible in the redirect URL the user's browser is sent to).
// So a POST straight to this endpoint with status=1 and a bill code the
// attacker already knows (their own, never paid) would otherwise be enough
// to self-upgrade to "pro". To prevent that we re-fetch the bill's real
// payment status from ToyyibPay's server-side API and only trust that.
export async function isBillActuallyPaid(billCode: string): Promise<boolean> {
  const secretKey = process.env.TOYYIBPAY_SECRET_KEY ?? SECRET_KEY;
  const base = process.env.TOYYIBPAY_BASE_URL ?? TOYYIBPAY_BASE;
  if (!billCode || !secretKey) return false;
  try {
    const res = await fetch(`${base}/index.php/api/getBillTransactions`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ billCode, billpaymentStatus: "1" }).toString(),
    });
    const text = await res.text();
    let json: any;
    try { json = JSON.parse(text); } catch { return false; }
    if (!Array.isArray(json) || json.length === 0) return false;
    // Any returned transaction with billpaymentStatus "1" means it was paid.
    return json.some((tx: any) => tx?.billpaymentStatus === "1" || tx?.billStatus === "1");
  } catch (e) {
    console.error("ToyyibPay getBillTransactions error:", e);
    return false;
  }
}

// ToyyibPay sends POST callback after payment
// Params: refno, status, reason, billcode, order_id (=user_id), amount
export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const status = body.get("status")?.toString();
    const userId = body.get("order_id")?.toString();
    const billCode = body.get("billcode")?.toString();
    const refno = body.get("refno")?.toString();

    // status: "1" = success, "2" = pending, "3" = failed
    if (status !== "1" || !userId || !billCode) {
      return NextResponse.json({ ok: false, reason: "not_success" });
    }

    const supabase = adminClient();

    // Verify bill code matches user to prevent spoofing
    const { data: profile } = await supabase
      .from("profiles")
      .select("toyyibpay_bill_code")
      .eq("id", userId)
      .maybeSingle();

    if (!profile || profile.toyyibpay_bill_code !== billCode) {
      console.error("ToyyibPay webhook: bill code mismatch", { userId, billCode, stored: profile?.toyyibpay_bill_code });
      return NextResponse.json({ ok: false, reason: "mismatch" });
    }

    // Never trust the client-posted `status` field alone — confirm with
    // ToyyibPay's own API that this bill was genuinely paid before granting Pro.
    const reallyPaid = await isBillActuallyPaid(billCode);
    if (!reallyPaid) {
      console.error("ToyyibPay webhook: status claimed success but API verification failed", { userId, billCode, refno });
      return NextResponse.json({ ok: false, reason: "unverified" });
    }

    // Set Pro for 31 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 31);

    await supabase
      .from("profiles")
      .update({
        plan: "pro",
        plan_expires_at: expiresAt.toISOString(),
        toyyibpay_bill_code: null, // clear so can't replay
      })
      .eq("id", userId);

    console.log(`ToyyibPay: plan upgraded user=${userId} ref=${refno}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("ToyyibPay webhook error:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
