import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PdfToTextTool from "@/components/tools/PdfToTextTool";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";
import ToolSeoContent from "@/components/tools/ToolSeoContent";

export const metadata: Metadata = {
  title: "PDF to Text — Free Online Extractor | PDFix",
  description: "Convert PDF to a text file (.txt) for free. Extract all text from your PDF in the browser — no server upload.",
  alternates: { canonical: "https://pdfix.my/tools/pdf-to-text" },
};

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1">
        <ToolErrorBoundary toolName="PDF to Text">
          <PdfToTextTool />
        </ToolErrorBoundary>
        <ToolSeoContent steps={["Upload your PDF file.", "Click 'Extract Text'.", "Review the extracted plain text.", "Copy to clipboard or download as a .txt file."]} faqs={[{q:"Does this work on scanned PDFs?", a:"For scanned PDFs with no selectable text, use the OCR PDF tool instead, which can recognise text from images."},{q:"Will the extracted text preserve formatting?", a:"Plain text extraction removes most formatting. Headings, columns and tables may not be preserved perfectly."},{q:"Can I extract text from a specific page only?", a:"Currently all pages are extracted together. The text is labelled by page number in the output."},{q:"Is there a page limit for text extraction?", a:"No page limit. Large documents may take a few seconds to process."}]} />
      </main>
      <Footer />
    </div>
  );
}
