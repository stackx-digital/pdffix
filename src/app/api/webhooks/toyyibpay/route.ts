import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
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
    if (status !== "1" || !userId) {
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
