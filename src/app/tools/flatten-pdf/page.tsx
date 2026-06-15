import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FlattenPdfTool from "@/components/tools/FlattenPdfTool";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";

export const metadata: Metadata = {
  title: "Flatten PDF — Free Online Tool | PDFix",
  description: "Flatten PDF forms and annotations to make them non-editable. Free and secure.",
};
export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/tools/flatten-pdf");
  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle();
  if (profile?.plan !== "pro") redirect("/pricing");
  return <div className="min-h-screen flex flex-col"><Navbar user={user} /><main className="flex-1"><ToolErrorBoundary toolName="Flatten PDF"><FlattenPdfTool /></ToolErrorBoundary></main><Footer /></div>;
}
