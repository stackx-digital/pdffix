import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SplitPdfTool from "@/components/tools/SplitPdfTool";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";
import ToolSeoContent from "@/components/tools/ToolSeoContent";

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
        <ToolSeoContent steps={["Upload your PDF file.", "Choose how to split: by fixed page ranges, every N pages, or extract specific pages.", "Click 'Split PDF' to process.", "Download the resulting files as a ZIP archive."]} faqs={[{q:"Can I split a PDF into individual pages?", a:"Yes, you can split every page into its own separate PDF file."},{q:"Can I specify a custom page range?", a:"Yes, enter a custom range such as 1-3, 5, 7-10 to extract exactly the pages you need."},{q:"Will splitting reduce the PDF quality?", a:"No, the content of each page is preserved exactly as-is."},{q:"Is the split done on the server?", a:"No, everything runs in your browser. Your PDF is never uploaded anywhere."}]} />
      </main>
      <Footer />
    </div>
  );
}
