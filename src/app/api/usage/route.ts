import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { TOOLS } from "@/types";

const VALID_TOOLS = new Set(TOOLS.map(t => t.id));

const MONTHLY_LIMIT = 5;

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/usage — returns current usage status
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Logged-in users: unlimited
  if (user) {
    return NextResponse.json({ used: 0, limit: null, canProceed: true, loggedIn: true });
  }

  // Anonymous: check IP usage
  const ip = getIp(req);
  const month = currentMonth();
  const svc = serviceClient();
  const { data } = await svc.from("ip_usage").select("count").eq("ip", ip).eq("month", month).maybeSingle();
  const used = data?.count ?? 0;

  return NextResponse.json({
    used,
    limit: MONTHLY_LIMIT,
    canProceed: used < MONTHLY_LIMIT,
    loggedIn: false,
  });
}

// POST /api/usage — record one usage
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Logged-in: just record, no limit
  if (user) {
    const body = await req.json().catch(() => ({}));
    const rawTool = typeof body?.tool === "string" ? body.tool : "";
    const tool = VALID_TOOLS.has(rawTool) ? rawTool : "unknown";
    await supabase.from("usage").insert({ user_id: user.id, tool, files_processed: 1 });
    return NextResponse.json({ ok: true });
  }

  // Anonymous: increment IP counter
  const ip = getIp(req);
  const month = currentMonth();
  const svc = serviceClient();

  // Check current count first
  const { data } = await svc.from("ip_usage").select("count").eq("ip", ip).eq("month", month).maybeSingle();
  const current = data?.count ?? 0;

  if (current >= MONTHLY_LIMIT) {
    return NextResponse.json({ ok: false, limitReached: true }, { status: 429 });
  }

  // Upsert increment
  await svc.from("ip_usage").upsert(
    { ip, month, count: current + 1 },
    { onConflict: "ip,month" }
  );

  return NextResponse.json({ ok: true, used: current + 1, remaining: MONTHLY_LIMIT - current - 1 });
}
