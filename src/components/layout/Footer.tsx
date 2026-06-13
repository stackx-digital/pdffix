import Link from "next/link";
import { TOOLS } from "@/types";

const categories = [
  { label: "Edit", key: "edit" },
  { label: "Tukar", key: "convert" },
  { label: "Optimum", key: "optimize" },
  { label: "Keselamatan", key: "security" },
] as const;

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Top: brand + tool columns */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <img src="/logo.svg" alt="PDFix" className="w-7 h-7" />
              <span className="font-bold text-red-600">PDFix</span>
            </Link>
            <p className="text-xs text-gray-500 leading-relaxed">
              Alat PDF percuma, selamat dan peribadi. Fail anda tidak keluar dari peranti anda.
            </p>
            <div className="mt-4 flex flex-col gap-1.5 text-xs text-gray-500">
              <Link href="/pricing" className="hover:text-gray-900">Harga</Link>
              <Link href="/privacy-policy" className="hover:text-gray-900">Privasi</Link>
              <Link href="/terms" className="hover:text-gray-900">Terma</Link>
            </div>
          </div>

          {/* Tool columns by category */}
          {categories.map((cat) => (
            <div key={cat.key}>
              <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">
                {cat.label}
              </h3>
              <ul className="space-y-2">
                {TOOLS.filter((t) => t.category === cat.key).map((tool) => (
                  <li key={tool.id}>
                    <Link
                      href={tool.href}
                      className="text-xs text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1"
                    >
                      {tool.name}
                      {tool.proOnly && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1 rounded font-medium">Pro</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} PDFix. Hak cipta terpelihara.</p>
          <p>Dibina dengan ❤️ untuk pengguna Malaysia</p>
        </div>
      </div>
    </footer>
  );
}
