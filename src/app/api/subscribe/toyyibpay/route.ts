import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TOYYIBPAY_BASE = process.env.TOYYIBPAY_BASE_URL ?? "https://toyyibpay.com";
const SECRET_KEY = process.env.TOYYIBPAY_SECRET_KEY ?? "";
const CATEGORY_CODE = process.env.TOYYIBPAY_CATEGORY_CODE ?? "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://pdfix.my";
const PRICE_SEN = "1900"; // RM19.00

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/auth/login?next=/pricing", req.url));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, email, full_name, phone")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.plan === "pro") {
    return NextResponse.redirect(new URL("/dashboard?msg=already_pro", req.url));
  }

  // Create bill via ToyyibPay API
  const body = new URLSearchParams({
    userSecretKey: SECRET_KEY,
    categoryCode: CATEGORY_CODE,
    billName: "PDFix Pro",
    billDescription: "Langganan PDFix Pro 1 Bulan",
    billPriceSetting: "1",
    billPayorInfo: "1",
    billAmount: PRICE_SEN,
    billReturnUrl: `${APP_URL}/subscribe/success`,
    billCallbackUrl: `${APP_URL}/api/webhooks/toyyibpay`,
    billExternalReferenceNo: user.id.replace(/-/g, ""),
    billTo: profile?.full_name ?? user.email ?? "",
    billEmail: profile?.email ?? user.email ?? "",
    billPhone: profile?.phone ?? "0000000000",
    billSplitPayment: "0",
    billSplitPaymentArgs: "",
    billPaymentChannel: "0",
    billContentEmail: "Terima kasih kerana melanggan PDFix Pro!",
    billChargeToCustomer: "1",
  });

  try {
    const res = await fetch(`${TOYYIBPAY_BASE}/index.php/api/createBill`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    const text = await res.text();
    let json: any;
    try { json = JSON.parse(text); } catch { json = text; }
    const billCode = Array.isArray(json) ? json?.[0]?.BillCode : null;
    if (!billCode) {
      const detail = encodeURIComponent(typeof json === "string" ? json.slice(0, 100) : JSON.stringify(json).slice(0, 100));
      console.error("ToyyibPay createBill failed:", json);
      return NextResponse.redirect(new URL(`/subscribe/failed?reason=bill_error&detail=${detail}`, req.url));
    }

    // Save bill code to profile
    await supabase
      .from("profiles")
      .update({ toyyibpay_bill_code: billCode })
      .eq("id", user.id);

    return NextResponse.redirect(new URL(`/${billCode}`, TOYYIBPAY_BASE));
  } catch (e) {
    console.error("ToyyibPay error:", e);
    return NextResponse.redirect(new URL("/subscribe/failed?reason=network", req.url));
  }
}
