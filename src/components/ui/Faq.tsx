"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQ_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

export default function Faq() {
  const t = useTranslations("faq");
  const [open, setOpen] = useState<string | null>(null);

  return (
    <section className="max-w-3xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-gray-900">{t("title")}</h2>
        <p className="text-gray-500 mt-2">{t("subtitle")}</p>
      </div>
      <div className="space-y-3">
        {FAQ_KEYS.map((key) => (
          <div key={key} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
            <button
              onClick={() => setOpen(open === key ? null : key)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-900 pr-4">{t(`q${key}`)}</span>
              <ChevronDown className={cn("w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200", open === key && "rotate-180")} />
            </button>
            {open === key && (
              <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                {t(`a${key}`)}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
