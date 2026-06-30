import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { TOOLS } from "@/types";

const VALID_TOOLS = new Set(TOOLS.map(t => t.id));

const MONTHLY_LIMIT = 5;

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
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

  if (user) {
    return NextResponse.json({ used: 0, limit: null, canProceed: true, loggedIn: true });
  }

  // No usage limit for guests either — fully free for everyone
  return NextResponse.json({ used: 0, limit: null, canProceed: true, loggedIn: false });
}

// POST /api/usage — record one usage
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const body = await req.json().catch(() => ({}));
    const rawTool = typeof body?.tool === "string" ? body.tool : "";
    const tool = VALID_TOOLS.has(rawTool) ? rawTool : "unknown";
    const fileName = typeof body?.file_name === "string" ? body.file_name.slice(0, 255) : null;
    const fileSize = typeof body?.file_size === "number" && body.file_size > 0 ? Math.round(body.file_size) : null;
    await supabase.from("usage").insert({ user_id: user.id, tool, files_processed: 1, file_name: fileName, file_size: fileSize });
    return NextResponse.json({ ok: true });
  }

  // No usage limit — record usage for analytics only (no blocking)
  const ip = getIp(req);
  const month = currentMonth();
  const svc = serviceClient();
  const { data } = await svc.from("ip_usage").select("count").eq("ip", ip).eq("month", month).maybeSingle();
  const current = (data?.count ?? 0) + 1;
  await svc.from("ip_usage").upsert(
    { ip, month, count: current },
    { onConflict: "ip,month" }
  ).then(() => {}).catch(() => {});

  return NextResponse.json({ ok: true });
}
