import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Check, X } from "lucide-react";

const FREE_FEATURES = [
  { label: "Edit PDF (teks, lukis, highlight, tandatangan)", included: true },
  { label: "Gabung PDF", included: true },
  { label: "Pisah PDF", included: true },
  { label: "Mampat PDF", included: true },
  { label: "PDF ke Imej (JPG/PNG)", included: true },
  { label: "Imej ke PDF", included: true },
  { label: "Putar PDF", included: true },
  { label: "Buang / Ekstrak Halaman PDF", included: true },
  { label: "Susun Semula Halaman PDF", included: true },
  { label: "Tambah Nombor Halaman", included: true },
  { label: "Watermark PDF", included: true },
  { label: "E-Sign PDF (lukis / upload tandatangan)", included: true },
  { label: "Isi Borang PDF", included: true },
  { label: "Buang Sekatan PDF", included: true },
  { label: "Potong PDF (crop margin)", included: true },
  { label: "Log aktiviti (nama & saiz fail)", included: true },
  { label: "Saiz fail maksimum 10MB", included: true },
  { label: "Had 5 edit sebulan", included: true },
  { label: "OCR PDF (4 bahasa)", included: false },
  { label: "Flatten PDF (PDF statik)", included: false },
  { label: "Mampat Berganda (batch)", included: false },
  { label: "Saiz fail sehingga 100MB", included: false },
];

const PRO_FEATURES = [
  { label: "Semua ciri pelan Percuma", included: true },
  { label: "OCR PDF — 4 bahasa (MS, EN, ZH, AR)", included: true },
  { label: "Flatten PDF — tukar ke PDF statik", included: true },
  { label: "Mampat Berganda — batch compress", included: true },
  { label: "Edit tanpa had sebulan", included: true },
  { label: "Saiz fail sehingga 100MB", included: true },
  { label: "Sokongan prioriti", included: true },
];

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 max-w-5xl mx-auto px-4 py-16 w-full">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900">Harga Yang Berpatutan</h1>
          <p className="text-gray-500 mt-2">15+ alat PDF percuma. Naik taraf untuk ciri lanjutan.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Free */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900">Percuma</h2>
            <p className="text-sm text-gray-500 mt-1">Untuk semua pengguna</p>
            <div className="mt-4 mb-6">
              <span className="text-4xl font-bold text-gray-900">RM0</span>
              <span className="text-gray-500">/bulan</span>
            </div>
            <ul className="space-y-2.5 mb-8">
              {FREE_FEATURES.map((f) => (
                <li key={f.label} className={`flex items-start gap-2 text-sm ${f.included ? "text-gray-700" : "text-gray-400"}`}>
                  {f.included
                    ? <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    : <X className="w-4 h-4 text-gray-300 mt-0.5 shrink-0" />
                  }
                  {f.label}
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
            <p className="text-sm text-red-200 mt-1">Untuk profesional & perniagaan</p>
            <div className="mt-4 mb-6">
              <span className="text-4xl font-bold">RM19</span>
              <span className="text-red-200">/bulan</span>
            </div>
            <ul className="space-y-2.5 mb-8">
              {PRO_FEATURES.map((f) => (
                <li key={f.label} className="flex items-start gap-2 text-sm text-red-50">
                  <Check className="w-4 h-4 text-white mt-0.5 shrink-0" />
                  {f.label}
                </li>
              ))}
            </ul>
            <Link
              href={user ? "/api/subscribe/toyyibpay" : "/auth/register?next=/pricing"}
              className="block text-center py-2.5 bg-white text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50"
            >
              Langgan Sekarang
            </Link>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-600">
            💡 Semua pemprosesan dilakukan <strong>100% dalam pelayar anda</strong> — fail tidak dihantar ke mana-mana pelayan.
          </p>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Bayaran selamat melalui Stripe · Boleh batalkan bila-bila masa · Tiada kontrak
        </p>
      </main>

      <Footer />
    </div>
  );
}
