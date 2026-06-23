import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ImageToPdfTool from "@/components/tools/ImageToPdfTool";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";

export const metadata: Metadata = {
  title: "Image to PDF — Free JPG PNG to PDF Converter | PDFix",
  description: "Convert JPG, PNG, or other images to a PDF file for free. Fast and secure, processed in your browser.",
};
export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <div className="min-h-screen flex flex-col"><Navbar user={user} /><main className="flex-1"><ToolErrorBoundary toolName="Image to PDF"><ImageToPdfTool /></ToolErrorBoundary></main><Footer /></div>;
}
