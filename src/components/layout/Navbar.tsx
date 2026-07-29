"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ChevronDown, FilePlus2, Scissors, FileArchive, FileText, Image, ScanText, PenLine, Signature, Droplets, Trash2, RotateCw, Hash, LayoutList, BookOpen, ImagePlus, Unlock, Crop, FileInput, Layers, PackageOpen, ShieldX, FileCode, Menu, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { TOOLS } from "@/types";
import type { User } from "@supabase/supabase-js";

interface NavbarProps {
  user: User | null;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FilePlus2, Scissors, FileArchive, FileText, Image, ScanText, PenLine, Signature,
  Droplets, Trash2, RotateCw, Hash, LayoutList, BookOpen, ImagePlus, Unlock, Crop,
  FileInput, Layers, PackageOpen, ShieldX, FileCode,
};

const CATEGORIES = [
  { key: "edit",     label: "Edit" },
  { key: "convert",  label: "Convert" },
  { key: "optimize", label: "Optimize" },
  { key: "security", label: "Security" },
] as const;

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
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

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); setOpen(false); }, [pathname]);

  return (
    <header className="border-b border-gray-100/80 bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <img src="/logo.svg" alt="PDFix" className="w-6 h-6" />
          <span className="font-bold text-base text-gray-900">PDF<span className="text-red-600">ix</span></span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 text-sm">
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setOpen(v => !v)}
              className="flex items-center gap-1 px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Tools <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
              <div className="absolute top-full left-0 mt-2 w-[520px] bg-white rounded-2xl border border-gray-200 shadow-xl p-4 grid grid-cols-2 gap-x-6 gap-y-1">
                {CATEGORIES.map(cat => {
                  const tools = TOOLS.filter(t => t.category === cat.key);
                  return (
                    <div key={cat.key}>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5 mt-2 first:mt-0">{cat.label}</p>
                      {tools.map(tool => (
                        <Link key={tool.id} href={tool.href} onClick={() => setOpen(false)}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors">
                          {(() => { const Icon = ICON_MAP[tool.icon] ?? FilePlus2; return <Icon className="w-3.5 h-3.5 flex-shrink-0" />; })()}
                          {tool.name}
                          {tool.proOnly && <span className="ml-auto text-[9px] font-semibold bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full">PRO</span>}
                        </Link>
                      ))}
                    </div>
                  );
                })}
                <div className="col-span-2 border-t border-gray-100 mt-2 pt-2">
                  <Link href="/#tools" onClick={() => setOpen(false)} className="block text-center text-xs text-red-600 hover:underline font-medium py-1">
                    View all tools →
                  </Link>
                </div>
              </div>
            )}
          </div>
          <Link href="/pricing" className="px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">Pricing</Link>
          <Link href="/developers" className="px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">API</Link>
          <Link href="/blog" className="px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">Blog</Link>
        </nav>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <Link href="/dashboard" className="text-sm px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">Dashboard</Link>
              <button onClick={signOut} className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">Sign Out</button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">Sign In</Link>
              <Link href="/auth/register" className="text-sm px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm shadow-red-200">
                Get Started Free
              </Link>
            </>
          )}
        </div>

        {/* Mobile right — hamburger only */}
        <div className="flex md:hidden items-center gap-2">
          {user ? (
            <Link href="/dashboard" className="text-xs text-gray-600 hover:text-gray-900">Dashboard</Link>
          ) : (
            <Link href="/auth/register" className="text-xs font-semibold text-red-600 hover:text-red-700">
              Free →
            </Link>
          )}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-4 h-4 text-gray-700" /> : <Menu className="w-4 h-4 text-gray-700" />}
          </button>
        </div>
      </div>

      {/* Mobile slide-down menu — positioned in normal flow, no fixed */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white overflow-y-auto max-h-[calc(100dvh-56px)] pb-6">
          {/* Auth section */}
          <div className="px-4 py-3 border-b border-gray-100">
            {user ? (
              <div className="flex gap-2">
                <Link href="/dashboard" className="flex-1 text-center py-2 text-sm font-medium border border-gray-200 rounded-lg text-gray-700">
                  Dashboard
                </Link>
                <button onClick={signOut} className="flex-1 py-2 text-sm font-medium border border-gray-200 rounded-lg text-gray-600">
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link href="/auth/login" className="flex-1 text-center py-2 text-sm font-medium border border-gray-200 rounded-lg text-gray-700">
                  Sign In
                </Link>
                <Link href="/auth/register" className="flex-1 text-center py-2 text-sm font-semibold bg-red-600 text-white rounded-lg">
                  Get Started Free
                </Link>
              </div>
            )}
          </div>

          {/* Nav links */}
          <div className="px-4 pt-3 pb-1 flex gap-2">
            <Link href="/pricing" className="flex-1 text-center py-1.5 text-sm text-gray-600 bg-gray-50 rounded-lg font-medium">Pricing</Link>
            <Link href="/developers" className="flex-1 text-center py-1.5 text-sm text-gray-600 bg-gray-50 rounded-lg font-medium">API</Link>
            <Link href="/blog" className="flex-1 text-center py-1.5 text-sm text-gray-600 bg-gray-50 rounded-lg font-medium">Blog</Link>
          </div>

          {/* Tools list by category */}
          <div className="px-4 pt-2">
            {CATEGORIES.map(cat => {
              const tools = TOOLS.filter(t => t.category === cat.key);
              return (
                <div key={cat.key} className="mb-3">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5 mt-2">{cat.label}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {tools.map(tool => {
                      const Icon = ICON_MAP[tool.icon] ?? FilePlus2;
                      return (
                        <Link key={tool.id} href={tool.href}
                          className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-gray-700 bg-gray-50 hover:bg-red-50 hover:text-red-600 transition-colors">
                          <Icon className="w-3.5 h-3.5 flex-shrink-0 text-red-500" />
                          <span className="truncate text-xs">{tool.name}</span>
                          {tool.proOnly && <span className="ml-auto text-[8px] font-semibold bg-amber-100 text-amber-600 px-1 rounded-full flex-shrink-0">PRO</span>}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
