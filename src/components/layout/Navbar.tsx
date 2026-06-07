"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface NavbarProps {
  user: User | null;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b border-gray-100/80 bg-white/70 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-15 flex items-center justify-between" style={{ height: "60px" }}>
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="PDFix" className="w-7 h-7" />
          <span className="font-bold text-lg text-gray-900">PDF<span className="text-red-600">ix</span></span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm">
          <Link href="/#tools" className="px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">Alat</Link>
          <Link href="/pricing" className="px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">Harga</Link>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/dashboard" className="text-sm px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                Dashboard
              </Link>
              <button
                onClick={signOut}
                className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Log Keluar
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                Log Masuk
              </Link>
              <Link
                href="/auth/register"
                className="text-sm px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm shadow-red-200"
              >
                Daftar Percuma
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
