import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Check } from "lucide-react";

const FREE_FEATURES = [
  "Gabung PDF (sehingga 3 fail/hari)",
  "Pisah PDF",
  "Mampat PDF",
  "PDF ke Imej",
  "Saiz fail maksimum 10MB",
  "Proses dalam browser (selamat)",
];

const PRO_FEATURES = [
  "Semua ciri percuma",
  "PDF ke Word",
  "OCR (ekstrak teks)",
  "Fail tanpa had sehari",
  "Saiz fail sehingga 100MB",
  "Sokongan prioriti",
];

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-16 w-full">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900">Harga Yang Berpatutan</h1>
          <p className="text-gray-500 mt-2">Mulakan percuma, naik taraf bila perlu.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Free */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900">Percuma</h2>
            <div className="mt-2 mb-6">
              <span className="text-4xl font-bold text-gray-900">RM0</span>
              <span className="text-gray-500">/bulan</span>
            </div>
            <ul className="space-y-3 mb-8">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={user ? "/dashboard" : "/auth/register"}
              className="block text-center py-2.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              {user ? "Dashboard" : "Daftar Percuma"}
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-red-600 text-white rounded-xl p-6 relative">
            <span className="absolute top-4 right-4 text-xs bg-white text-red-600 px-2 py-0.5 rounded-full font-medium">
              Popular
            </span>
            <h2 className="text-lg font-semibold">Pro</h2>
            <div className="mt-2 mb-6">
              <span className="text-4xl font-bold">RM19</span>
              <span className="text-red-200">/bulan</span>
            </div>
            <ul className="space-y-3 mb-8">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-red-50">
                  <Check className="w-4 h-4 text-white mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={user ? "/api/stripe/checkout" : "/auth/register?next=/pricing"}
              className="block text-center py-2.5 bg-white text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50"
            >
              Langgan Sekarang
            </Link>
          </div>
        </div>

        <p className="text-center text-sm text-gray-400 mt-8">
          Bayaran selamat melalui Stripe. Boleh batalkan bila-bila masa.
        </p>
      </main>

      <Footer />
    </div>
  );
}
