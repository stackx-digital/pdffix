import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import OcrImageTool from "@/components/tools/OcrImageTool";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";

export const metadata: Metadata = {
  title: "OCR Image — Extract Text from Photos & Scans | PDFix",
  description:
    "Extract text from JPG, PNG images — resit, IC, dokumen, screenshot. OCR runs 100% in your browser. Free, no upload.",
  alternates: { canonical: "https://pdfix.my/tools/ocr-image" },
  keywords: ["ocr image", "scan resit", "extract text from image", "ocr malaysia", "scan dokumen"],
};

export default async function OcrImagePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1">
        <ToolErrorBoundary>
          <OcrImageTool />
        </ToolErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}
