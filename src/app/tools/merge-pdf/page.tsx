import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MergePdfTool from "@/components/tools/MergePdfTool";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";

export const metadata: Metadata = {
  title: "Merge PDF — Free Online Tool | PDFix",
  description: "Combine multiple PDF files into one in your browser. Secure, no server upload required.",
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
        <ToolErrorBoundary toolName="Gabung PDF"><MergePdfTool /></ToolErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}
