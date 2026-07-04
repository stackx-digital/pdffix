import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CompressPdfTool from "@/components/tools/CompressPdfTool";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";
import ToolSeoContent from "@/components/tools/ToolSeoContent";

export const metadata: Metadata = {
  title: "Compress PDF — Free Online Tool | PDFix",
  description: "Reduce PDF file size without losing quality, right in your browser.",
  alternates: { canonical: "https://pdfix.my/tools/compress-pdf" },
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
        <ToolSeoContent steps={["Upload your PDF file.", "Select the compression quality — higher compression means smaller file size.", "Click 'Compress PDF' and wait for the process.", "Download the compressed PDF."]} faqs={[{q:"How much can I reduce my PDF file size?", a:"Typically 40–80% reduction depending on the content. PDFs with many images compress the most."},{q:"Will compression affect the quality of my PDF?", a:"Slight quality reduction is normal at high compression levels. Choose medium compression to balance size and quality."},{q:"Does compressing a PDF remove any content?", a:"No content, pages or text is removed. Only image quality is slightly reduced."},{q:"Is there a file size limit?", a:"No hard limit, but very large PDFs may take longer to process in the browser."}]} />
      </main>
      <Footer />
    </div>
  );
}
