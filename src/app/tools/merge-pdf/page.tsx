import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MergePdfTool from "@/components/tools/MergePdfTool";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gabung PDF Percuma — PDFFix",
  description: "Cantumkan beberapa PDF menjadi satu fail dalam browser. Selamat, tiada upload ke server.",
};

export default async function MergePdfPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-12 w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Gabung PDF</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Tambah beberapa fail PDF dan susun ikut urutan yang dikehendaki, kemudian gabungkan menjadi satu fail.
          </p>
        </div>
        <MergePdfTool />
      </main>
      <Footer />
    </div>
  );
}
