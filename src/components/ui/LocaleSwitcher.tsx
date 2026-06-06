"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Globe } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const LOCALES = [
  { code: "ms", label: "BM", name: "Bahasa Malaysia" },
  { code: "en", label: "EN", name: "English" },
  { code: "zh", label: "中文", name: "中文" },
  { code: "ar", label: "AR", name: "العربية" },
];

export default function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function switchLocale(newLocale: string) {
    router.replace(pathname, { locale: newLocale });
    setOpen(false);
  }

  const current = LOCALES.find((l) => l.code === locale);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
      >
        <Globe className="w-4 h-4" />
        <span className="font-medium">{current?.label}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-44 py-1 overflow-hidden">
            {LOCALES.map((l) => (
              <button
                key={l.code}
                onClick={() => switchLocale(l.code)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors",
                  locale === l.code ? "text-red-600 font-semibold" : "text-gray-700"
                )}
              >
                <span className="w-8 text-center font-medium">{l.label}</span>
                <span>{l.name}</span>
                {locale === l.code && <span className="ml-auto text-red-500">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
