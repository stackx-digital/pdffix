import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BatchCompressTool from "@/components/tools/BatchCompressTool";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";
import ToolSeoContent from "@/components/tools/ToolSeoContent";

export const metadata: Metadata = {
  title: "Batch Compress PDF — Free Online Tool | PDFix",
  description: "Compress multiple PDF files at once without losing quality. Free and secure, processed in your browser.",
  alternates: { canonical: "https://pdfix.my/tools/batch-compress" },
};
export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <div className="min-h-screen flex flex-col"><Navbar user={user} /><main className="flex-1"><ToolErrorBoundary toolName="Batch Compress PDF"><BatchCompressTool /></ToolErrorBoundary></main><Footer /></div>;
}
