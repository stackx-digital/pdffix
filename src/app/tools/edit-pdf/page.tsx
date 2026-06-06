import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PdfEditorTool from "@/components/tools/PdfEditorTool";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit PDF Percuma — PDFFix",
  description: "Tambah teks, lukis, highlight dan sisip imej terus dalam fail PDF anda.",
};

export default async function EditPdfPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full flex flex-col">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit PDF</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Tambah teks, lukis, highlight, sisip imej dan banyak lagi — terus dalam browser.
          </p>
        </div>
        <div className="flex-1">
          <PdfEditorTool />
        </div>
      </main>
      <Footer />
    </div>
  );
}
