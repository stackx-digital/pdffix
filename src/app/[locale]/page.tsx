import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ToolCard from "@/components/ui/ToolCard";
import Faq from "@/components/ui/Faq";
import { TOOLS } from "@/types";

function HomeContent({ isPro, user }: { isPro: boolean; user: any }) {
  const t = useTranslations("home");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1">
        <section className="bg-gradient-to-b from-red-50 to-white py-20 px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            {t("hero_title")} <br className="hidden md:block" />
            <span className="text-red-600">{t("hero_title2")}</span>
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-xl mx-auto">{t("hero_desc")}</p>
          <div className="mt-8 flex gap-3 justify-center">
            <a href="#tools" className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors">
              {t("cta_start")}
            </a>
            <Link href="/pricing" className="px-6 py-3 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
              {t("cta_pricing")}
            </Link>
          </div>
        </section>

        <section className="py-6 border-y border-gray-100 bg-white">
          <div className="max-w-4xl mx-auto px-4 flex flex-wrap justify-center gap-8 text-sm text-gray-500">
            <span>🔒 {t("badge_server")}</span>
            <span>⚡ {t("badge_browser")}</span>
            <span>🆓 {t("badge_free")}</span>
            <span>🇲🇾 {t("badge_local")}</span>
          </div>
        </section>

        <section id="tools" className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("tools_title")}</h2>
          <p className="text-gray-500 mb-8">{t("tools_desc")}</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {TOOLS.map((tool) => (
              <ToolCard key={tool.id} tool={tool} isPro={isPro} />
            ))}
          </div>
        </section>

        <Faq />

        {!user && (
          <section className="bg-red-600 text-white py-16 px-4 text-center">
            <h2 className="text-2xl font-bold mb-2">{t("cta_register_title")}</h2>
            <p className="text-red-100 mb-6">{t("cta_register_desc")}</p>
            <Link href="/auth/register" className="inline-block px-8 py-3 bg-white text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-colors">
              {t("cta_register_btn")}
            </Link>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let isPro = false;
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
    isPro = profile?.plan === "pro";
  }
  return <HomeContent isPro={isPro} user={user} />;
}
