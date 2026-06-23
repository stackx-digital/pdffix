import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CompressPdfTool from "@/components/tools/CompressPdfTool";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";

export const metadata: Metadata = {
  title: "Compress PDF — Free Online Tool | PDFix",
  description: "Reduce PDF file size without losing quality, right in your browser.",
};

export default async function CompressPdfPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-12 w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Compress PDF</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Optimize your PDF file to a smaller size without losing any content.
          </p>
        </div>
        <ToolErrorBoundary toolName="Compress PDF"><CompressPdfTool /></ToolErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}
