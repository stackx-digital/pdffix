import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ToolCard from "@/components/ui/ToolCard";
import { TOOLS, FREE_LIMITS } from "@/types";

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

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count: usageToday } = await supabase
    .from("usage")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", today.toISOString());

  const filesUsed = usageToday ?? 0;
  const filesLimit = isPro ? "∞" : FREE_LIMITS.filesPerDay;
  const usagePct = isPro ? 0 : Math.min((filesUsed / FREE_LIMITS.filesPerDay) * 100, 100);

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
              <span className="text-gray-600">Penggunaan hari ini</span>
              <span className="font-medium text-gray-900">{filesUsed} / {filesLimit} fail</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 rounded-full transition-all"
                style={{ width: `${usagePct}%` }}
              />
            </div>
            {filesUsed >= FREE_LIMITS.filesPerDay && (
              <p className="mt-2 text-xs text-red-600">
                Had harian dicapai. <Link href="/pricing" className="underline">Naik taraf ke Pro</Link> untuk akses tanpa had.
              </p>
            )}
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
