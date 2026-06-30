import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RotatePdfTool from "@/components/tools/RotatePdfTool";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";

export const metadata: Metadata = {
  title: "Rotate PDF Pages — Free Online Tool | PDFix",
  description: "Rotate PDF pages 90° or 180° for free. No software needed — works entirely in your browser.",
  alternates: { canonical: "https://pdfix.my/tools/rotate-pdf" },
};
export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <div className="min-h-screen flex flex-col"><Navbar user={user} /><main className="flex-1"><ToolErrorBoundary toolName="Rotate PDF"><RotatePdfTool /></ToolErrorBoundary></main><Footer /></div>;
}
