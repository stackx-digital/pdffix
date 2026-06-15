import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing — PDFix Free PDF Tools",
  description: "PDFix is 100% free. All PDF tools available to everyone. Sign up free for unlimited monthly usage.",
  alternates: { canonical: "https://pdfix.my/pricing" },
};

const FEATURES = [
  "Edit PDF (text, draw, highlight, signature)",
  "Merge PDF",
  "Split PDF",
  "Compress PDF & Batch Compress",
  "PDF to Image (JPG/PNG)",
  "Image to PDF",
  "Rotate PDF",
  "Delete / Extract PDF Pages",
  "Organize PDF Pages",
  "Add Page Numbers",
  "Watermark PDF",
  "E-Sign PDF (draw / upload signature)",
  "Fill PDF Forms",
  "Unlock PDF",
  "Crop PDF",
  "Flatten PDF",
  "PDF to Text (.txt)",
  "DOC/PDF to Markdown",
  "OCR PDF (4 languages)",
  "100% in-browser — files never uploaded",
];

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-16 w-full">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900">100% Free — For Everyone</h1>
          <p className="text-gray-500 mt-2">All 20+ PDF tools, no credit card, no hidden fees.</p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="bg-white border-2 border-red-600 rounded-xl p-8 relative shadow-lg">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
              Always Free
            </span>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Free Account</h2>
            <p className="text-sm text-gray-500 mb-4">For everyone, forever</p>
            <div className="mb-6">
              <span className="text-5xl font-extrabold text-gray-900">RM0</span>
              <span className="text-gray-500">/month</span>
            </div>
            <ul className="space-y-2.5 mb-8">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={user ? "/dashboard" : "/auth/register"}
              className="block text-center py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              {user ? "Go to Dashboard" : "Sign Up Free — No Credit Card"}
            </Link>
          </div>
        </div>

        <div className="mt-10 bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-600">
            ⚡ <strong>No sign-up needed</strong> for your first 5 uses per month.
            Create a free account for <strong>unlimited access</strong> — no credit card ever required.
          </p>
        </div>

        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-600">
            💡 All processing is done <strong>100% in your browser</strong> — your files are never sent to any server.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
