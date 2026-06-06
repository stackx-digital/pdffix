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
    <header className="border-b border-gray-100 bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl text-red-600">
          PDFFix
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
          <Link href="/#tools" className="hover:text-gray-900">Alat</Link>
          <Link href="/pricing" className="hover:text-gray-900">Harga</Link>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <button
                onClick={signOut}
                className="text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                Log Keluar
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900">
                Log Masuk
              </Link>
              <Link
                href="/auth/register"
                className="text-sm px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Daftar
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
