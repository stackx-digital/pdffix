import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = { title: "Payment Failed — PDFix" };

const REASON_MAP: Record<string, string> = {
  bill_error: "Gagal mencipta bil pembayaran. Sila cuba lagi.",
  network: "Ralat sambungan ke ToyyibPay. Sila cuba lagi.",
  cancelled: "Pembayaran dibatalkan.",
};

export default async function FailedPage({
  searchParams,
}: {
  searchParams: { reason?: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const reason = searchParams.reason ?? "";
  const message = REASON_MAP[reason] ?? "Pembayaran tidak berjaya diproses.";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pembayaran Tidak Berjaya</h1>
          <p className="text-gray-500 mb-2">{message}</p>
          <p className="text-sm text-gray-400 mb-8">
            Ada masalah? Hubungi kami di{" "}
            <a href="mailto:stackxdigital@gmail.com" className="text-red-600 hover:underline">
              stackxdigital@gmail.com
            </a>.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/pricing"
              className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Cuba Lagi
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
