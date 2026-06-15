import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CropPdfTool from "@/components/tools/CropPdfTool";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";

export const metadata: Metadata = {
  title: "Crop PDF — Free Online PDF Cropping Tool | PDFix",
  description: "Crop or trim specific areas of your PDF pages for free, directly in your browser.",
};
export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <div className="min-h-screen flex flex-col"><Navbar user={user} /><main className="flex-1"><ToolErrorBoundary toolName="Crop PDF"><CropPdfTool /></ToolErrorBoundary></main><Footer /></div>;
}
