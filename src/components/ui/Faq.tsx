"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "Adakah PDFFix benar-benar percuma?",
    a: "Ya! Tools asas seperti Edit PDF, Gabung PDF, Pisah PDF, Mampat PDF dan PDF ke Imej adalah percuma sepenuhnya. Tiada had bilangan penggunaan untuk tools percuma. Plan Pro pula memberikan akses kepada tools lanjutan seperti OCR dan PDF ke Word.",
  },
  {
    q: "Adakah fail saya selamat? Adakah ia diupload ke server?",
    a: "Fail anda TIDAK diupload ke mana-mana server. Semua pemprosesan berlaku 100% dalam browser anda menggunakan teknologi WebAssembly. Fail PDF anda tidak pernah meninggalkan peranti anda, menjadikannya sangat selamat dan peribadi.",
  },
  {
    q: "Apakah saiz fail maksimum yang disokong?",
    a: "Pengguna percuma boleh memproses fail sehingga 10MB. Pengguna Pro boleh memproses fail sehingga 100MB. Tiada had bilangan fail untuk pengguna Pro.",
  },
  {
    q: "Bagaimana cara Edit PDF berfungsi?",
    a: "Buka fail PDF anda, kemudian gunakan toolbar untuk tambah teks, melukis, highlight, meletakkan tandatangan, stamp, nota dan banyak lagi. Selesai edit, klik 'Simpan PDF' untuk muat turun fail yang telah diedit.",
  },
  {
    q: "Bolehkah saya tambah tandatangan pada PDF?",
    a: "Ya! Gunakan tool 'Sign' dalam editor PDF. Lukis tandatangan anda pada pad tandatangan, kemudian klik 'Letakkan' untuk memasukkannya ke dalam PDF. Anda boleh mengalihkan dan mengubah saiz tandatangan mengikut keperluan.",
  },
  {
    q: "Apakah perbezaan antara plan Percuma dan Pro?",
    a: "Plan Percuma termasuk semua tools asas (Edit, Gabung, Pisah, Mampat, PDF ke Imej, E-Sign, Watermark) dengan saiz fail maksimum 10MB. Plan Pro (RM19/bulan) menambah tools lanjutan seperti OCR PDF dan PDF ke Word, dengan had saiz fail 100MB.",
  },
  {
    q: "Adakah PDFFix berfungsi di telefon bimbit?",
    a: "Ya, PDFFix direka responsif dan berfungsi di semua peranti termasuk telefon bimbit dan tablet. Walau bagaimanapun, pengalaman terbaik adalah menggunakan komputer desktop atau laptop untuk editing yang lebih teliti.",
  },
  {
    q: "Format fail apa yang disokong untuk ditukar kepada PDF?",
    a: "Pada masa ini, PDFFix memfokuskan kepada operasi PDF-ke-PDF seperti menggabung, memisah dan memampatkan. Untuk penukaran PDF ke format lain, kami menyokong PDF ke Imej (JPG/PNG) dan PDF ke Word (plan Pro).",
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="max-w-3xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-gray-900">Soalan Lazim (FAQ)</h2>
        <p className="text-gray-500 mt-2">Jawapan kepada soalan yang sering ditanya.</p>
      </div>

      <div className="space-y-3">
        {FAQS.map((faq, i) => (
          <div
            key={i}
            className="border border-gray-200 rounded-xl overflow-hidden bg-white"
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-900 pr-4">{faq.q}</span>
              <ChevronDown
                className={cn(
                  "w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200",
                  open === i && "rotate-180"
                )}
              />
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
