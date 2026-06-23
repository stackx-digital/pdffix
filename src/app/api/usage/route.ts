import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FREE_LIMITS } from "@/types";

function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

// GET /api/usage — returns current month usage status
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ used: 0, limit: FREE_LIMITS.editsPerMonth, canProceed: true, isPro: false, loggedIn: false });
  }

  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle();
  const isPro = profile?.plan === "pro";

  if (isPro) {
    return NextResponse.json({ used: 0, limit: null, canProceed: true, isPro: true, loggedIn: true });
  }

  const { count } = await supabase
    .from("usage")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", startOfMonth());

  const used = count ?? 0;
  return NextResponse.json({
    used,
    limit: FREE_LIMITS.editsPerMonth,
    canProceed: used < FREE_LIMITS.editsPerMonth,
    isPro: false,
    loggedIn: true,
  });
}

// POST /api/usage — record one edit usage
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ ok: false, error: "not logged in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const tool = typeof body?.tool === "string" ? body.tool : "unknown";
  const fileName = typeof body?.file_name === "string" ? body.file_name.slice(0, 255) : null;
  const fileSize = typeof body?.file_size === "number" && body.file_size > 0 ? Math.round(body.file_size) : null;

  const { error } = await supabase.from("usage").insert({
    user_id: user.id,
    tool,
    files_processed: 1,
    file_name: fileName,
    file_size: fileSize,
  });

  return NextResponse.json({ ok: !error }, { status: error ? 500 : 200 });
}
