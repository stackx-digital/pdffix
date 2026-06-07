import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ToolCard from "@/components/ui/ToolCard";
import Faq from "@/components/ui/Faq";
import ComparisonTable from "@/components/ui/ComparisonTable";
import HowItWorks from "@/components/ui/HowItWorks";
import StatsBar from "@/components/ui/StatsBar";
import Testimonials from "@/components/ui/Testimonials";
import { TOOLS } from "@/types";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let isPro = false;
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
    isPro = profile?.plan === "pro";
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1">

        {/* Hero */}
        <section className="relative overflow-hidden bg-white py-28 px-4 text-center">
          {/* Dot grid background */}
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />
          {/* Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-100/60 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 bg-red-50 border border-red-100 rounded-full text-xs font-semibold text-red-600 tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              🇲🇾 Dibina untuk Malaysia · 100% Percuma
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-950 leading-[1.1] tracking-tight">
              Edit PDF Percuma{" "}
              <br className="hidden md:block" />
              <span className="text-red-600">Untuk Semua</span>
            </h1>

            <p className="mt-6 text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Gabung, pisah, mampat, tandatangan dan tukar PDF terus dalam pelayar.
              Fail anda <strong className="text-gray-700">tidak pernah keluar dari peranti anda</strong>.
            </p>

            <div className="mt-10 flex flex-wrap gap-3 justify-center">
              <a
                href="#tools"
                className="px-8 py-3.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all shadow-lg shadow-red-200 hover:shadow-xl hover:shadow-red-200 hover:-translate-y-0.5 text-sm"
              >
                Mula Guna Percuma →
              </a>
              <Link
                href="/pricing"
                className="px-8 py-3.5 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all bg-white shadow-sm text-sm"
              >
                Lihat Harga
              </Link>
            </div>

            {/* Social proof mini */}
            <div className="mt-10 flex items-center justify-center gap-2 text-sm text-gray-400">
              <div className="flex -space-x-2">
                {["bg-red-400", "bg-orange-400", "bg-amber-400", "bg-rose-400"].map((c, i) => (
                  <div key={i} className={`w-7 h-7 rounded-full ${c} border-2 border-white`} />
                ))}
              </div>
              <span>Digunakan oleh ribuan pengguna Malaysia</span>
            </div>
          </div>
        </section>

        {/* Trust bar */}
        <section className="py-5 border-y border-gray-100 bg-gray-50/80">
          <div className="max-w-5xl mx-auto px-4 flex flex-wrap justify-center gap-x-8 gap-y-2">
            {[
              { icon: "🔒", text: "Tiada upload ke pelayan" },
              { icon: "⚡", text: "Proses 100% dalam pelayar" },
              { icon: "🆓", text: "15+ alat percuma" },
              { icon: "🛡️", text: "Privasi terjamin" },
              { icon: "📱", text: "Boleh guna di semua peranti" },
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
              <p className="text-xs font-semibold text-red-600 uppercase tracking-widest mb-2">Alat PDF</p>
              <h2 className="text-3xl font-bold text-gray-900">Semua Yang Anda Perlukan</h2>
              <p className="text-gray-500 mt-1">15+ alat percuma. Tiada pemasangan diperlukan.</p>
            </div>
            <Link href="/auth/register" className="shrink-0 text-sm px-5 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all shadow-md shadow-red-100">
              Daftar Percuma
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {TOOLS.map((tool) => (
              <ToolCard key={tool.id} tool={tool} isPro={isPro} />
            ))}
          </div>
        </section>

        <Testimonials />

        <ComparisonTable />

        <Faq />

        {!user && (
          <section className="relative overflow-hidden bg-gray-950 text-white py-24 px-4 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/30 via-gray-950 to-gray-950 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
            <div className="relative max-w-2xl mx-auto">
              <p className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-4">Mula Sekarang</p>
              <h2 className="text-4xl font-bold mb-4 leading-tight">Daftar Percuma.<br />Guna Terus.</h2>
              <p className="text-gray-400 mb-10 text-lg">15+ alat PDF percuma. Tiada kad kredit. Tiada pemasangan.</p>
              <Link
                href="/auth/register"
                className="inline-block px-10 py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-500 transition-all shadow-lg shadow-red-900/50 text-sm"
              >
                Daftar Percuma — Tanpa Kad Kredit →
              </Link>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
