import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = { title: "Bayaran Berjaya — PDFix" };

export default async function SuccessPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Bayaran Berjaya! 🎉</h1>
          <p className="text-gray-600 mb-2">Terima kasih kerana melanggan PDFix Pro.</p>
          <p className="text-sm text-gray-400 mb-8">
            Akaun anda akan dinaik taraf dalam beberapa minit selepas pengesahan dari ToyyibPay.
            Sila refresh dashboard jika status anda belum berubah.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dashboard"
              className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Pergi ke Dashboard
            </Link>
            <Link
              href="/"
              className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Laman Utama
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
