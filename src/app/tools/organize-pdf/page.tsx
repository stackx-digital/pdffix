import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import OrganizePdfTool from "@/components/tools/OrganizePdfTool";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";

export const metadata: Metadata = {
  title: "Organize PDF Pages — Free Online Tool | PDFix",
  description: "Reorder, rearrange, and drag PDF pages into any order you want. Free, right in your browser.",
};
export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <div className="min-h-screen flex flex-col"><Navbar user={user} /><main className="flex-1"><ToolErrorBoundary toolName="Organize PDF"><OrganizePdfTool /></ToolErrorBoundary></main><Footer /></div>;
}
