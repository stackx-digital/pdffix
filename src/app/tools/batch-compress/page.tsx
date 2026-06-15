import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BatchCompressTool from "@/components/tools/BatchCompressTool";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";

export const metadata: Metadata = {
  title: "Batch Compress PDF — Free Online Tool | PDFix",
  description: "Compress multiple PDF files at once without losing quality. Free and secure, processed in your browser.",
};
export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/tools/batch-compress");
  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle();
  if (profile?.plan !== "pro") redirect("/pricing");
  return <div className="min-h-screen flex flex-col"><Navbar user={user} /><main className="flex-1"><ToolErrorBoundary toolName="Batch Compress PDF"><BatchCompressTool /></ToolErrorBoundary></main><Footer /></div>;
}
