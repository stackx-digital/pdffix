import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WatermarkTool from "@/components/tools/WatermarkTool";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";

export const metadata: Metadata = {
  title: "Watermark PDF — Free Online Tool | PDFix",
  description: "Add a text or image watermark to your PDF for free.",
};

export default async function WatermarkPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Watermark PDF</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Add a text or image watermark to all pages of your PDF.
          </p>
        </div>
        <ToolErrorBoundary toolName="Watermark PDF"><WatermarkTool /></ToolErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}
