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
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar user={user} />
      <main className="flex-1 flex flex-col overflow-hidden px-4 py-4 max-w-[1600px] mx-auto w-full">
        <div className="mb-3">
          <h1 className="text-xl font-bold text-gray-900">Edit PDF</h1>
          <p className="text-gray-500 text-xs mt-0.5">Tambah teks, lukis, highlight, sisip imej — terus dalam browser.</p>
        </div>
        <div className="flex-1 overflow-hidden">
          <PdfEditorTool />
        </div>
      </main>
    </div>
  );
}
