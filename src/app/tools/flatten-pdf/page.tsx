import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FlattenPdfTool from "@/components/tools/FlattenPdfTool";
export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/tools/flatten-pdf");
  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
  if (profile?.plan !== "pro") redirect("/pricing");
  return <div className="min-h-screen flex flex-col"><Navbar user={user} /><main className="flex-1"><FlattenPdfTool /></main><Footer /></div>;
}
