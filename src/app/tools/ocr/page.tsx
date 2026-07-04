import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import OcrTool from "@/components/tools/OcrTool";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";
import ToolSeoContent from "@/components/tools/ToolSeoContent";

export const metadata: Metadata = {
  title: "OCR PDF — Extract Text from Scanned PDF | PDFix",
  description: "Extract text from scanned PDFs using OCR, right in your browser. Free for everyone.",
  alternates: { canonical: "https://pdfix.my/tools/ocr" },
};

export default async function OcrPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1">
        <ToolErrorBoundary toolName="OCR PDF"><OcrTool /></ToolErrorBoundary>
        <ToolSeoContent steps={["Upload your scanned or image-based PDF.", "Select the language of the document.", "Click 'Start OCR' and wait for the text extraction to complete.", "Copy the extracted text or download it as a .txt file."]} faqs={[{q:"What languages are supported?", a:"English, Bahasa Melayu, Simplified Chinese, and Arabic are currently supported."},{q:"Will OCR work on handwritten text?", a:"OCR works best on printed text. Handwriting recognition accuracy varies significantly."},{q:"Why is my OCR result inaccurate?", a:"Accuracy depends on scan quality. Use high-resolution scans (300 DPI or above) for the best results."},{q:"Is my PDF sent to a server for OCR?", a:"No. OCR is powered by Tesseract.js and runs entirely in your browser — no data is uploaded."}]} />
      </main>
      <Footer />
    </div>
  );
}
