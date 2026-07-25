import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Check, X } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing — Free & Pro Plans | PDFix",
  description: "PDFix is free to use. All tools — Merge PDF, Compress, Edit, Strike IC and more — available without signup. Upgrade to Pro for unlimited usage.",
  alternates: { canonical: "https://pdfix.my/pricing" },
  keywords: ["pdfix pricing", "free pdf tools", "pdf tool malaysia", "merge pdf free", "compress pdf free"],
};

const FREE_FEATURES = [
  { label: "Edit PDF (text, draw, highlight, signature)", included: true },
  { label: "Merge PDF", included: true },
  { label: "Split PDF", included: true },
  { label: "Compress PDF", included: true },
  { label: "PDF to Image (JPG/PNG)", included: true },
  { label: "Image to PDF", included: true },
  { label: "Rotate PDF", included: true },
  { label: "Delete / Extract PDF Pages", included: true },
  { label: "Organize PDF Pages", included: true },
  { label: "Add Page Numbers", included: true },
  { label: "Watermark PDF", included: true },
  { label: "E-Sign PDF (draw / upload signature)", included: true },
  { label: "Fill PDF Forms", included: true },
  { label: "Unlock PDF", included: true },
  { label: "Crop PDF (trim margins)", included: true },
  { label: "Unlimited usage — no monthly limit", included: true },
  { label: "Activity log (filename & size)", included: true },
  { label: "Max file size 10MB", included: true },
  { label: "OCR PDF (4 languages)", included: false },
  { label: "Flatten PDF (static PDF)", included: false },
  { label: "Batch Compress (multiple files)", included: false },
  { label: "File size up to 100MB", included: false },
];

const PRO_FEATURES = [
  { label: "Everything in Free plan", included: true },
  { label: "OCR PDF — 4 languages (MS, EN, ZH, AR)", included: true },
  { label: "Flatten PDF — convert to static PDF", included: true },
  { label: "Batch Compress — compress multiple files", included: true },
  { label: "File size up to 100MB", included: true },
  { label: "Priority support", included: true },
];

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 max-w-5xl mx-auto px-4 py-16 w-full">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-red-600 uppercase tracking-widest mb-3">Pricing</p>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Simple, Transparent Pricing</h1>
          <p className="text-gray-500 mt-2 text-lg">22 free PDF tools. Upgrade for advanced features.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12 max-w-3xl mx-auto">
          {/* Free */}
          <div className="bg-white border border-gray-200 rounded-2xl p-7 flex flex-col">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Free</h2>
              <p className="text-sm text-gray-500 mt-1">Untuk semua orang</p>
            </div>
            <div className="mt-5 mb-6">
              <span className="text-5xl font-extrabold text-gray-900">RM0</span>
              <span className="text-gray-400 text-sm ml-1">/bulan</span>
            </div>
            <ul className="space-y-2.5 mb-8 flex-1">
              {FREE_FEATURES.map((f) => (
                <li key={f.label} className={`flex items-start gap-2.5 text-sm ${f.included ? "text-gray-700" : "text-gray-350 line-through decoration-gray-300"}`}>
                  {f.included
                    ? <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    : <X className="w-4 h-4 text-gray-300 mt-0.5 shrink-0" />
                  }
                  <span className={f.included ? "" : "text-gray-400"}>{f.label}</span>
                </li>
              ))}
            </ul>
            <Link
              href={user ? "/dashboard" : "/auth/register"}
              className="block text-center py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              {user ? "Pergi ke Dashboard" : "Daftar Percuma"}
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-gradient-to-br from-red-600 to-red-700 text-white rounded-2xl p-7 relative flex flex-col shadow-xl shadow-red-200">
            <div className="absolute -top-3 right-6">
              <span className="bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                ⭐ POPULAR
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold">Pro</h2>
              <p className="text-sm text-red-200 mt-1">Untuk profesional & perniagaan</p>
            </div>
            <div className="mt-5 mb-6">
              <span className="text-5xl font-extrabold">RM19</span>
              <span className="text-red-200 text-sm ml-1">/bulan</span>
              <p className="text-red-300 text-xs mt-1">Bayaran bulanan · Batal bila-bila masa</p>
            </div>
            <p className="text-red-100 text-sm mb-4 pb-4 border-b border-red-500/50">
              Semua yang ada dalam Free, ditambah:
            </p>
            <ul className="space-y-2.5 mb-8 flex-1">
              {PRO_FEATURES.slice(1).map((f) => (
                <li key={f.label} className="flex items-start gap-2.5 text-sm text-white">
                  <Check className="w-4 h-4 text-red-200 mt-0.5 shrink-0" />
                  {f.label}
                </li>
              ))}
            </ul>
            <Link
              href={user ? "/api/subscribe/toyyibpay" : "/auth/register?next=/pricing"}
              className="block text-center py-3 bg-white text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors shadow-lg"
            >
              {user ? "Naik Taraf Sekarang →" : "Cuba Pro Sekarang →"}
            </Link>
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-center">
            <p className="text-sm text-blue-700">
              🔒 Semua fail diproses <strong>100% dalam browser anda</strong> — tiada fail dihantar ke mana-mana server.
            </p>
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">
            Pembayaran selamat melalui ToyyibPay · Batal bila-bila masa · Tiada kontrak
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
