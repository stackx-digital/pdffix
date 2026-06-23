import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import AdminDashboard from "@/components/admin/AdminDashboard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — PDFix", robots: { index: false, follow: false } };

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "stackxdigital@gmail.com";

// Cache stats for 5 minutes — avoids hitting Supabase on every admin page load
const getAdminStats = unstable_cache(
  async () => {
    const { createClient: createServerClient } = await import("@/lib/supabase/server");
    const supabase = await createServerClient();

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, full_name, plan, created_at")
      .order("created_at", { ascending: false });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: usageMonth } = await supabase
      .from("usage")
      .select("user_id, tool, created_at")
      .gte("created_at", startOfMonth.toISOString());

    const { data: usageAll } = await supabase.from("usage").select("user_id");

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

    const users = (profiles ?? []).map(p => ({
      id: p.id,
      email: p.email ?? "",
      full_name: p.full_name ?? "",
      plan: p.plan as "free" | "pro",
      created_at: p.created_at,
      usage_this_month: usageThisMonth[p.id] ?? 0,
      usage_total: usageTotal[p.id] ?? 0,
    }));

    return {
      users,
      stats: {
        total: users.length,
        pro: users.filter(u => u.plan === "pro").length,
        free: users.filter(u => u.plan === "free").length,
        usage_this_month: usageMonth?.length ?? 0,
      },
      topTools: Object.entries(toolCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([tool, count]) => ({ tool, count })),
    };
  },
  ["admin-stats"],
  { revalidate: 300 } // 5 minutes
);

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) redirect("/dashboard");

  const { users, stats, topTools } = await getAdminStats();

  return <AdminDashboard users={users} stats={stats} topTools={topTools} />;
}
