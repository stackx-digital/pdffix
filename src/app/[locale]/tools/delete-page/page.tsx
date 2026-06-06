import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DeletePageTool from "@/components/tools/DeletePageTool";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Delete Halaman PDF — PDFFix",
  description: "Buang halaman tertentu dari fail PDF anda secara percuma.",
};

export default async function DeletePagePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Delete Halaman PDF</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Pilih halaman yang ingin dibuang, kemudian muat turun PDF baharu.
          </p>
        </div>
        <DeletePageTool />
      </main>
      <Footer />
    </div>
  );
}
