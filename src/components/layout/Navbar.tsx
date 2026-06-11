"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { TOOLS } from "@/types";
import type { User } from "@supabase/supabase-js";

interface NavbarProps {
  user: User | null;
}

const CATEGORIES = [
  { key: "edit",     label: "Edit" },
  { key: "convert",  label: "Tukar" },
  { key: "optimize", label: "Optimum" },
  { key: "security", label: "Keselamatan" },
] as const;

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="border-b border-gray-100/80 bg-white/70 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-15 flex items-center justify-between" style={{ height: "60px" }}>
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="PDFix" className="w-7 h-7" />
          <span className="font-bold text-lg text-gray-900">PDF<span className="text-red-600">ix</span></span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm">
          {/* Alat dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setOpen(v => !v)}
              className="flex items-center gap-1 px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Alat <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
              <div className="absolute top-full left-0 mt-2 w-[520px] bg-white rounded-2xl border border-gray-200 shadow-xl p-4 grid grid-cols-2 gap-x-6 gap-y-1">
                {CATEGORIES.map(cat => {
                  const tools = TOOLS.filter(t => t.category === cat.key);
                  return (
                    <div key={cat.key}>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5 mt-2 first:mt-0">{cat.label}</p>
                      {tools.map(tool => (
                        <Link
                          key={tool.id}
                          href={tool.href}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <span className="text-base">{tool.icon}</span>
                          {tool.name}
                          {tool.proOnly && <span className="ml-auto text-[9px] font-semibold bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full">PRO</span>}
                        </Link>
                      ))}
                    </div>
                  );
                })}
                <div className="col-span-2 border-t border-gray-100 mt-2 pt-2">
                  <Link
                    href="/#tools"
                    onClick={() => setOpen(false)}
                    className="block text-center text-xs text-red-600 hover:underline font-medium py-1"
                  >
                    Lihat semua alat →
                  </Link>
                </div>
              </div>
            )}
          </div>

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
