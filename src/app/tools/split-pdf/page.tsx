import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SplitPdfTool from "@/components/tools/SplitPdfTool";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";

export const metadata: Metadata = {
  title: "Split PDF — Free Online Tool | PDFix",
  description: "Split a PDF into multiple separate files by page range.",
  alternates: { canonical: "https://pdfix.my/tools/split-pdf" },
};

export default async function SplitPdfPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-12 w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Split PDF</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Specify the page range for each section. Example: <code className="bg-gray-100 px-1 rounded">1-3, 4-6, 7</code>
          </p>
        </div>
        <ToolErrorBoundary toolName="Split PDF"><SplitPdfTool /></ToolErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}
