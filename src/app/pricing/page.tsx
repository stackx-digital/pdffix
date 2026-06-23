import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Check, X } from "lucide-react";

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
  { label: "Activity log (filename & size)", included: true },
  { label: "Max file size 10MB", included: true },
  { label: "5 edits per month", included: true },
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
  { label: "Unlimited edits per month", included: true },
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
          <h1 className="text-3xl font-bold text-gray-900">Simple, Transparent Pricing</h1>
          <p className="text-gray-500 mt-2">15+ free PDF tools. Upgrade for advanced features.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Free */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900">Free</h2>
            <p className="text-sm text-gray-500 mt-1">For everyone</p>
            <div className="mt-4 mb-6">
              <span className="text-4xl font-bold text-gray-900">RM0</span>
              <span className="text-gray-500">/month</span>
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
              {user ? "Dashboard" : "Sign Up Free"}
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-red-600 text-white rounded-xl p-6 relative">
            <span className="absolute top-4 right-4 text-xs bg-white text-red-600 px-2 py-0.5 rounded-full font-medium">
              Popular
            </span>
            <h2 className="text-lg font-semibold">Pro</h2>
            <p className="text-sm text-red-200 mt-1">For professionals & businesses</p>
            <div className="mt-4 mb-6">
              <span className="text-4xl font-bold">RM19</span>
              <span className="text-red-200">/month</span>
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
              Subscribe Now
            </Link>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-600">
            💡 All processing is done <strong>100% in your browser</strong> — your files are never sent to any server.
          </p>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Secure payment via ToyyibPay · Cancel anytime · No contracts
        </p>
      </main>

      <Footer />
    </div>
  );
}
