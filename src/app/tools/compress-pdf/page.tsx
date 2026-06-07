import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CompressPdfTool from "@/components/tools/CompressPdfTool";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mampat PDF Percuma — PDFix",
  description: "Kurangkan saiz fail PDF tanpa hilang kualiti, terus dalam browser.",
};

export default async function CompressPdfPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-12 w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Mampat PDF</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Optimumkan fail PDF anda untuk saiz yang lebih kecil tanpa kehilangan kandungan.
          </p>
        </div>
        <CompressPdfTool />
      </main>
      <Footer />
    </div>
  );
}
