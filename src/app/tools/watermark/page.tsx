import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WatermarkTool from "@/components/tools/WatermarkTool";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Watermark PDF — PDFix",
  description: "Tambah watermark teks atau logo pada PDF anda secara percuma.",
};

export default async function WatermarkPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Watermark PDF</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Tambah watermark teks atau imej pada semua halaman PDF anda.
          </p>
        </div>
        <WatermarkTool />
      </main>
      <Footer />
    </div>
  );
}
