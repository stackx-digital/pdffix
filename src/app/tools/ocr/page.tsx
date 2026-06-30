import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import OcrTool from "@/components/tools/OcrTool";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";

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
      </main>
      <Footer />
    </div>
  );
}
