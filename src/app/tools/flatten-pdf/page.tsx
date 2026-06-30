import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FlattenPdfTool from "@/components/tools/FlattenPdfTool";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";

export const metadata: Metadata = {
  title: "Flatten PDF — Free Online Tool | PDFix",
  description: "Flatten PDF forms and annotations to make them non-editable. Free and secure.",
  alternates: { canonical: "https://pdfix.my/tools/flatten-pdf" },
};
export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <div className="min-h-screen flex flex-col"><Navbar user={user} /><main className="flex-1"><ToolErrorBoundary toolName="Flatten PDF"><FlattenPdfTool /></ToolErrorBoundary></main><Footer /></div>;
}
