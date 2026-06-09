import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminDashboard from "@/components/admin/AdminDashboard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — PDFix", robots: { index: false, follow: false } };

const ADMIN_EMAIL = "stackxdigital@gmail.com";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) redirect("/dashboard");

  const admin = createAdminClient();

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, email, full_name, plan, created_at")
    .order("created_at", { ascending: false });

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: usageMonth } = await admin
    .from("usage")
    .select("user_id, tool, created_at")
    .gte("created_at", startOfMonth.toISOString());

  const { data: usageAll } = await admin.from("usage").select("user_id");

  const usageThisMonth: Record<string, number> = {};
  for (const u of usageMonth ?? []) {
    usageThisMonth[u.user_id] = (usageThisMonth[u.user_id] ?? 0) + 1;
  }
  const usageTotal: Record<string, number> = {};
  for (const u of usageAll ?? []) {
    if (u.user_id) usageTotal[u.user_id] = (usageTotal[u.user_id] ?? 0) + 1;
  }

  const toolCount: Record<string, number> = {};
  for (const u of usageMonth ?? []) {
    toolCount[u.tool] = (toolCount[u.tool] ?? 0) + 1;
  }
  const topTools = Object.entries(toolCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tool, count]) => ({ tool, count }));

  const users = (profiles ?? []).map(p => ({
    id: p.id,
    email: p.email ?? "",
    full_name: p.full_name ?? "",
    plan: p.plan as "free" | "pro",
    created_at: p.created_at,
    usage_this_month: usageThisMonth[p.id] ?? 0,
    usage_total: usageTotal[p.id] ?? 0,
  }));

  const stats = {
    total: users.length,
    pro: users.filter(u => u.plan === "pro").length,
    free: users.filter(u => u.plan === "free").length,
    usage_this_month: usageMonth?.length ?? 0,
  };

  return <AdminDashboard users={users} stats={stats} topTools={topTools} />;
}
