import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BatchCompressTool from "@/components/tools/BatchCompressTool";
export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/tools/batch-compress");
  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
  if (profile?.plan !== "pro") redirect("/pricing");
  return <div className="min-h-screen flex flex-col"><Navbar user={user} /><main className="flex-1"><BatchCompressTool /></main><Footer /></div>;
}
