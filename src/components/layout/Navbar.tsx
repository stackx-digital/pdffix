"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import LocaleSwitcher from "@/components/ui/LocaleSwitcher";
import type { User } from "@supabase/supabase-js";

interface NavbarProps {
  user: User | null;
}

export default function Navbar({ user }: NavbarProps) {
  const t = useTranslations("nav");
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b border-gray-100 bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl text-red-600">
          PDFFix
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
          <Link href="/#tools" className="hover:text-gray-900">Tools</Link>
          <Link href="/pricing" className="hover:text-gray-900">{t("pricing")}</Link>
        </nav>

        <div className="flex items-center gap-3">
          <LocaleSwitcher />

          {user ? (
            <>
              <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
                {t("dashboard")}
              </Link>
              <button
                onClick={signOut}
                className="text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                {t("logout")}
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900">
                {t("login")}
              </Link>
              <Link
                href="/auth/register"
                className="text-sm px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                {t("register")}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
