import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AddPageNumbersTool from "@/components/tools/AddPageNumbersTool";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";

export const metadata: Metadata = {
  title: "Add Page Numbers to PDF — Free Online Tool | PDFix",
  description: "Automatically add page numbers to your PDF for free. Fast, secure, and processed entirely in your browser.",
};
export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <div className="min-h-screen flex flex-col"><Navbar user={user} /><main className="flex-1"><ToolErrorBoundary toolName="Add Page Numbers"><AddPageNumbersTool /></ToolErrorBoundary></main><Footer /></div>;
}
