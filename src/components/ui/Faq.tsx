"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "Adakah PDFix benar-benar percuma?",
    a: "Ya! Alat asas seperti edit PDF, gabung PDF, pisah PDF, mampat PDF dan PDF ke imej adalah percuma sepenuhnya. Pelan Pro menawarkan alat lanjutan seperti OCR dan PDF ke Word.",
  },
  {
    q: "Adakah fail saya selamat? Adakah ia dimuatnaik ke pelayan?",
    a: "Fail anda tidak dimuatnaik ke mana-mana pelayan. Semua pemprosesan dilakukan 100% dalam pelayar anda. Fail PDF anda tidak pernah meninggalkan peranti anda.",
  },
  {
    q: "Apakah saiz fail maksimum yang disokong?",
    a: "Pengguna percuma boleh memproses fail sehingga 10MB. Pengguna Pro boleh memproses fail sehingga 100MB.",
  },
  {
    q: "Bagaimana pengeditan PDF berfungsi?",
    a: "Buka fail PDF, gunakan bar alat untuk tambah teks, lukis, serlahkan, tandatangan, setem dan lain-lain. Klik 'Simpan PDF' untuk muat turun.",
  },
  {
    q: "Bolehkah saya menambah tandatangan pada PDF?",
    a: "Boleh! Gunakan alat 'Tandatangan' dalam editor. Lukis tandatangan anda pada pad tandatangan, kemudian letakkan pada PDF.",
  },
  {
    q: "Apakah perbezaan antara versi Percuma dan Pro?",
    a: "Versi Percuma merangkumi semua alat asas dengan had fail 10MB. Versi Pro (RM19/bulan) menambah OCR dan PDF ke Word, dengan had fail 100MB.",
  },
  {
    q: "Bolehkah PDFix digunakan pada telefon?",
    a: "Ya, PDFix boleh digunakan pada semua peranti. Disyorkan menggunakan komputer desktop untuk pengalaman pengeditan terbaik.",
  },
  {
    q: "Format fail apa yang disokong?",
    a: "PDFix fokus pada operasi PDF. Kami menyokong PDF ke imej (JPG/PNG) dan PDF ke Word (versi Pro).",
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="max-w-3xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-gray-900">Soalan Lazim</h2>
        <p className="text-gray-500 mt-2">Jawapan kepada soalan-soalan biasa.</p>
      </div>
      <div className="space-y-3">
        {FAQS.map((faq, i) => (
          <div key={i} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-900 pr-4">{faq.q}</span>
              <ChevronDown className={cn("w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200", open === i && "rotate-180")} />
            </button>
            {open === i && (
              <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
