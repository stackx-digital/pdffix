import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ToolCard from "@/components/ui/ToolCard";
import { TOOLS } from "@/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

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
