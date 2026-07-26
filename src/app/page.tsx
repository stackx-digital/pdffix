import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ToolsGrid from "@/components/ui/ToolsGrid";
import Faq from "@/components/ui/Faq";
import ComparisonTable from "@/components/ui/ComparisonTable";
import HowItWorks from "@/components/ui/HowItWorks";
import StatsBar from "@/components/ui/StatsBar";
import Testimonials from "@/components/ui/Testimonials";

export const metadata: Metadata = {
  title: "PDFix — Free PDF Editor, Compress, Merge & Convert PDF Online",
  description:
    "Free PDF tools for everyone. Edit PDF, compress PDF, merge PDF, split PDF, sign PDF and convert PDF to text — directly in your browser without uploading to any server.",
  alternates: { canonical: "https://pdfix.my" },
};

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1">

        {/* Hero */}
        <section className="relative overflow-hidden bg-white py-16 md:py-28 px-4 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-100/60 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 bg-red-50 border border-red-100 rounded-full text-xs font-semibold text-red-600 tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              100% Free · No Upload · No Credit Card Ever
            </div>

            <h1 className="text-4xl md:text-7xl font-extrabold text-gray-950 leading-[1.1] tracking-tight">
              Free PDF Tools{" "}
              <br className="hidden md:block" />
              <span className="text-red-600">For Everyone</span>
            </h1>

            <p className="mt-6 text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Merge, split, compress, sign and convert PDF directly in your browser.
              Your files <strong className="text-gray-700">never leave your device</strong>.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center px-4">
              <a
                href="#tools"
                className="px-8 py-4 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all shadow-lg shadow-red-200 text-sm w-full sm:w-auto"
              >
                Start for Free →
              </a>
              <Link
                href="/pricing"
                className="px-8 py-4 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all bg-white shadow-sm text-sm w-full sm:w-auto"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </section>

        {/* Trust bar */}
        <section className="py-5 border-y border-gray-100 bg-gray-50/80">
          <div className="max-w-5xl mx-auto px-4 flex flex-wrap justify-center gap-x-8 gap-y-2">
            {[
              { icon: "🔒", text: "No server upload" },
              { icon: "⚡", text: "100% in-browser processing" },
              { icon: "🆓", text: "20+ free tools" },
              { icon: "🛡️", text: "Privacy guaranteed" },
              { icon: "📱", text: "Works on all devices" },
            ].map((item) => (
              <span key={item.text} className="flex items-center gap-2 text-sm text-gray-500">
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </span>
            ))}
          </div>
        </section>

        <HowItWorks />

        <StatsBar />

        {/* Tools */}
        <section id="tools" className="max-w-6xl mx-auto px-4 py-20">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-semibold text-red-600 uppercase tracking-widest mb-2">PDF Tools</p>
              <h2 className="text-3xl font-bold text-gray-900">Everything You Need</h2>
              <p className="text-gray-500 mt-1">22 free tools. No installation. No upload.</p>
            </div>
            {!user && (
              <Link href="/auth/register" className="shrink-0 text-sm px-5 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all shadow-md shadow-red-100">
                Sign Up Free
              </Link>
            )}
          </div>
          <ToolsGrid />
        </section>

        <Testimonials />

        <ComparisonTable />

        <Faq />

        {!user && (
          <section className="relative overflow-hidden bg-gray-950 text-white py-24 px-4 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/30 via-gray-950 to-gray-950 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
            <div className="relative max-w-2xl mx-auto">
              <p className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-4">Get Started</p>
              <h2 className="text-4xl font-bold mb-4 leading-tight">Sign Up Free.<br />Start Instantly.</h2>
              <p className="text-gray-400 mb-10 text-lg">20+ free PDF tools. No credit card. No installation.</p>
              <Link
                href="/auth/register"
                className="inline-block px-10 py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-500 transition-all shadow-lg shadow-red-900/50 text-sm"
              >
                Get Started Free — No Credit Card →
              </Link>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
