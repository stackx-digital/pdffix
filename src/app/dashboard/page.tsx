import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ToolCard from "@/components/ui/ToolCard";
import { TOOLS } from "@/types";
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
    .maybeSingle();

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
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {profile?.full_name ?? user.email}!
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            All tools are free and unlimited for your account.
          </p>
        </div>

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

        <h2 className="text-lg font-semibold text-gray-900 mb-4">PDF Tools</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {TOOLS.map((tool) => (
            <ToolCard key={tool.id} tool={tool} isPro={true} />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
