import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ToolCard from "@/components/ui/ToolCard";
import { TOOLS, FREE_LIMITS } from "@/types";
import { formatBytes } from "@/lib/utils";
import { Clock, FileText } from "lucide-react";

interface UsageRow {
  id: string;
  tool: string;
  file_name: string | null;
  file_size: number | null;
  created_at: string;
}

function toolLabel(toolId: string): string {
  return TOOLS.find((t) => t.id === toolId)?.name ?? toolId;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const isPro = profile?.plan === "pro";

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: usageThisMonth } = await supabase
    .from("usage")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", startOfMonth.toISOString());

  const editsUsed = usageThisMonth ?? 0;
  const editsLimit = FREE_LIMITS.editsPerMonth;
  const usagePct = isPro ? 0 : Math.min((editsUsed / editsLimit) * 100, 100);

  const { data: recentUsage } = await supabase
    .from("usage")
    .select("id, tool, file_name, file_size, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 max-w-6xl mx-auto px-4 py-10 w-full">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Selamat datang, {profile?.full_name ?? user.email}!
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Plan: <span className={`font-medium ${isPro ? "text-amber-600" : "text-gray-700"}`}>
                {isPro ? "Pro" : "Percuma"}
              </span>
            </p>
          </div>

          {!isPro && (
            <Link
              href="/pricing"
              className="inline-block px-5 py-2.5 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 text-sm"
            >
              Naik Taraf ke Pro →
            </Link>
          )}
        </div>

        {/* Usage bar */}
        {!isPro && (
          <div className="mb-8 p-4 bg-white border border-gray-200 rounded-xl">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Edit bulan ini</span>
              <span className="font-medium text-gray-900">{editsUsed} / {editsLimit} edit</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 rounded-full transition-all"
                style={{ width: `${usagePct}%` }}
              />
            </div>
            {editsUsed >= editsLimit ? (
              <p className="mt-2 text-xs text-red-600">
                Had bulanan dicapai. <Link href="/pricing" className="underline">Naik taraf ke Pro</Link> untuk akses tanpa had.
              </p>
            ) : (
              <p className="mt-2 text-xs text-gray-400">
                Baki {editsLimit - editsUsed} edit lagi bulan ini. Had reset pada 1 haribulan.
              </p>
            )}
          </div>
        )}

        {/* Recent Activity */}
        {recentUsage && recentUsage.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Aktiviti Terbaru</h2>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
              {(recentUsage as UsageRow[]).map((row) => (
                <div key={row.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="flex-shrink-0">
                    <FileText className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-800">{toolLabel(row.tool)}</span>
                      {row.file_name && (
                        <span className="text-sm text-gray-500 truncate max-w-[200px]">&mdash; {row.file_name}</span>
                      )}
                    </div>
                    {row.file_size && (
                      <p className="text-xs text-gray-400">{formatBytes(row.file_size)}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-xs text-gray-400 whitespace-nowrap">
                    {timeAgo(row.created_at)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tools */}
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Tools PDF</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {TOOLS.map((tool) => (
            <ToolCard key={tool.id} tool={tool} isPro={isPro} />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
