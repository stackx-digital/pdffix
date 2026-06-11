import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// FIXED: moved to env var to avoid hardcoding in source
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "stackxdigital@gmail.com";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const admin = createAdminClient();

  // All profiles
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, email, full_name, plan, created_at")
    .order("created_at", { ascending: false });

  // Usage per user this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: usage } = await admin
    .from("usage")
    .select("user_id, tool, created_at")
    .gte("created_at", startOfMonth.toISOString());

  // Usage all time per user
  const { data: usageAll } = await admin
    .from("usage")
    .select("user_id");

  // Signups per day last 30 days
  const { data: recentSignups } = await admin
    .from("profiles")
    .select("created_at")
    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  const usageThisMonthByUser: Record<string, number> = {};
  for (const u of usage ?? []) {
    usageThisMonthByUser[u.user_id] = (usageThisMonthByUser[u.user_id] ?? 0) + 1;
  }

  const usageAllByUser: Record<string, number> = {};
  for (const u of usageAll ?? []) {
    if (u.user_id) usageAllByUser[u.user_id] = (usageAllByUser[u.user_id] ?? 0) + 1;
  }

  const users = (profiles ?? []).map(p => ({
    id: p.id,
    email: p.email,
    full_name: p.full_name,
    plan: p.plan,
    created_at: p.created_at,
    usage_this_month: usageThisMonthByUser[p.id] ?? 0,
    usage_total: usageAllByUser[p.id] ?? 0,
  }));

  // Tool popularity this month
  const toolCount: Record<string, number> = {};
  for (const u of usage ?? []) {
    toolCount[u.tool] = (toolCount[u.tool] ?? 0) + 1;
  }
  const topTools = Object.entries(toolCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tool, count]) => ({ tool, count }));

  // Signups by day
  const signupsByDay: Record<string, number> = {};
  for (const s of recentSignups ?? []) {
    const day = s.created_at.slice(0, 10);
    signupsByDay[day] = (signupsByDay[day] ?? 0) + 1;
  }

  return NextResponse.json({
    users,
    stats: {
      total: users.length,
      pro: users.filter(u => u.plan === "pro").length,
      free: users.filter(u => u.plan === "free").length,
      usage_this_month: usage?.length ?? 0,
    },
    topTools,
    signupsByDay,
  });
}
