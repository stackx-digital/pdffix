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
        <section className="relative overflow-hidden bg-gradient-to-br from-red-50 via-white to-rose-50 py-24 px-4 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-100/40 via-transparent to-transparent pointer-events-none" />
          <div className="relative max-w-3xl mx-auto">
            <span className="inline-block mb-4 px-3 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-full tracking-wide uppercase">
              🇲🇾 Dibina untuk Malaysia
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight">
              Editor PDF Percuma{" "}
              <span className="text-red-600">Untuk Semua</span>
            </h1>
            <p className="mt-5 text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
              Gabung, pisah, mampat dan tukar PDF terus dalam pelayar. Fail anda tidak dimuatnaik ke mana-mana pelayan.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <a href="#tools" className="px-7 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all shadow-md shadow-red-200 hover:shadow-lg hover:shadow-red-200">
                Mula Sekarang
              </a>
              <Link href="/pricing" className="px-7 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all bg-white shadow-sm">
                Lihat Harga
              </Link>
            </div>
          </div>
        </section>

        {/* Trust bar */}
        <section className="py-4 border-y border-gray-100 bg-white">
          <div className="max-w-4xl mx-auto px-4 flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">🔒 Tiada upload ke pelayan</span>
            <span className="flex items-center gap-1.5">⚡ Proses dalam pelayar</span>
            <span className="flex items-center gap-1.5">🆓 Fungsi asas percuma</span>
            <span className="flex items-center gap-1.5">🛡️ 100% peribadi & selamat</span>
          </div>
        </section>

        <HowItWorks />

        <StatsBar />

        <section id="tools" className="max-w-6xl mx-auto px-4 py-16">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Semua Alat PDF</h2>
            <p className="text-gray-500">15+ alat percuma. Tiada pemasangan diperlukan.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {TOOLS.map((tool) => (
              <ToolCard key={tool.id} tool={tool} isPro={isPro} />
            ))}
          </div>
        </section>

        <Testimonials />

        <ComparisonTable />

        <Faq />

        {!user && (
          <section className="relative overflow-hidden bg-red-600 text-white py-20 px-4 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-red-500 via-red-600 to-red-700 pointer-events-none" />
            <div className="relative">
              <h2 className="text-3xl font-bold mb-3">Mula Guna PDFix Sekarang</h2>
              <p className="text-red-100 mb-8 text-lg max-w-md mx-auto">Daftar percuma dan dapatkan akses kepada 15+ alat PDF tanpa had pemasangan.</p>
              <Link href="/auth/register" className="inline-block px-10 py-3.5 bg-white text-red-600 rounded-xl font-bold hover:bg-red-50 transition-all shadow-lg shadow-red-800/30">
                Daftar Percuma — Tanpa Kad Kredit
              </Link>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
