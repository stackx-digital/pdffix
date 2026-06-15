import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PdfFormsTool from "@/components/tools/PdfFormsTool";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";

export const metadata: Metadata = {
  title: "Fill PDF Forms Online — Free Tool | PDFix",
  description: "Fill in PDF forms directly in your browser without printing. Free, easy, and secure.",
};
export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <div className="min-h-screen flex flex-col"><Navbar user={user} /><main className="flex-1"><ToolErrorBoundary toolName="PDF Forms"><PdfFormsTool /></ToolErrorBoundary></main><Footer /></div>;
}
