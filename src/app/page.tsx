import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ToolCard from "@/components/ui/ToolCard";
import { TOOLS } from "@/types";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isPro = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();
    isPro = profile?.plan === "pro";
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-red-50 to-white py-20 px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            Editor PDF Percuma <br className="hidden md:block" />
            <span className="text-red-600">Untuk Semua Orang</span>
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-xl mx-auto">
            Gabung, pisah, mampat dan tukar PDF terus dalam browser. Fail anda tidak diupload ke mana-mana server.
          </p>
          <div className="mt-8 flex gap-3 justify-center">
            <a
              href="#tools"
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Mula Gunakan
            </a>
            <Link
              href="/pricing"
              className="px-6 py-3 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Lihat Harga
            </Link>
          </div>
        </section>

        {/* Trust badges */}
        <section className="py-6 border-y border-gray-100 bg-white">
          <div className="max-w-4xl mx-auto px-4 flex flex-wrap justify-center gap-8 text-sm text-gray-500">
            <span className="flex items-center gap-2">🔒 Tiada upload ke server</span>
            <span className="flex items-center gap-2">⚡ Proses dalam browser</span>
            <span className="flex items-center gap-2">🆓 Percuma untuk kegunaan asas</span>
            <span className="flex items-center gap-2">🇲🇾 Dibuat untuk Malaysia</span>
          </div>
        </section>

        {/* Tools grid */}
        <section id="tools" className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Semua Tools</h2>
          <p className="text-gray-500 mb-8">Pilih tool yang anda perlukan.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {TOOLS.map((tool) => (
              <ToolCard key={tool.id} tool={tool} isPro={isPro} />
            ))}
          </div>
        </section>

        {/* CTA */}
        {!user && (
          <section className="bg-red-600 text-white py-16 px-4 text-center">
            <h2 className="text-2xl font-bold mb-2">Daftar Percuma Sekarang</h2>
            <p className="text-red-100 mb-6">
              Dapatkan akses penuh kepada semua tools PDF asas.
            </p>
            <Link
              href="/auth/register"
              className="inline-block px-8 py-3 bg-white text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-colors"
            >
              Daftar — Percuma
            </Link>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
