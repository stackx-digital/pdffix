import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PdfToImageTool from "@/components/tools/PdfToImageTool";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PDF ke Imej Percuma — PDFix",
  description: "Tukar setiap halaman PDF kepada imej JPG atau PNG berkualiti tinggi.",
};

export default async function PdfToImagePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-12 w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">PDF ke Imej</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Setiap halaman PDF akan ditukar kepada imej berasingan dalam format JPG atau PNG.
          </p>
        </div>
        <PdfToImageTool />
      </main>
      <Footer />
    </div>
  );
}
