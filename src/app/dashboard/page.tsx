import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ToolCard from "@/components/ui/ToolCard";
import { TOOLS } from "@/types";
import { formatBytes } from "@/lib/utils";
import { Clock, FileText, Star, Key } from "lucide-react";

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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" });
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, plan, plan_expires_at")
    .eq("id", user.id)
    .maybeSingle();

  const planExpired = profile?.plan_expires_at ? new Date(profile.plan_expires_at) < new Date() : false;
  const isPro = profile?.plan === "pro" && !planExpired;
  const expiresAt = profile?.plan_expires_at;

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
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome, {profile?.full_name ?? user.email}!
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {isPro ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Pro
                </span>
              ) : (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Free</span>
              )}
              {isPro && expiresAt && (
                <span className="text-xs text-gray-400">Active until {formatDate(expiresAt)}</span>
              )}
            </div>
          </div>
          {!isPro && (
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600"
            >
              <Star className="w-4 h-4" /> Upgrade to Pro
            </Link>
          )}
        </div>

        {/* API Keys shortcut */}
        <div className="mb-8">
          <Link
            href="/dashboard/api-keys"
            className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-red-200 hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
              <Key className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">API Keys</p>
              <p className="text-xs text-gray-500">Generate keys to call the PDFix REST API from your own apps.</p>
            </div>
            <span className="ml-auto text-xs text-red-600 font-semibold group-hover:underline">Manage →</span>
          </Link>
        </div>

        {/* Recent Activity */}
        {recentUsage && recentUsage.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
              {(recentUsage as UsageRow[]).map((row) => (
                <div key={row.id} className="flex items-center gap-4 px-4 py-3">
                  <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
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
                  <span className="flex-shrink-0 text-xs text-gray-400 whitespace-nowrap">
                    {timeAgo(row.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tools */}
        <h2 className="text-lg font-semibold text-gray-900 mb-4">PDF Tools</h2>
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
