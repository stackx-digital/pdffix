import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PdfToImageTool from "@/components/tools/PdfToImageTool";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";

export const metadata: Metadata = {
  title: "PDF to Image — Free Online Converter | PDFix",
  description: "Convert every PDF page to a high-quality JPG or PNG image.",
  alternates: { canonical: "https://pdfix.my/tools/pdf-to-image" },
};

export default async function PdfToImagePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-12 w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">PDF to Image</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Each PDF page will be converted to a separate image in JPG or PNG format.
          </p>
        </div>
        <ToolErrorBoundary toolName="PDF to Image"><PdfToImageTool /></ToolErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}
