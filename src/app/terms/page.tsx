import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Terms of Service — PDFix",
  description: "PDFix Terms of Service. Read our terms before using the platform.",
  alternates: { canonical: "https://pdfix.my/terms" },
};

export default async function TermsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const sections = [
    {
      title: "1. Penerimaan Terma",
      content: `Dengan menggunakan PDFix (pdfix.my), anda bersetuju untuk mematuhi terma perkhidmatan ini. Jika anda tidak bersetuju, sila hentikan penggunaan perkhidmatan ini.`,
    },
    {
      title: "2. Penerangan Perkhidmatan",
      content: `PDFix menyediakan alat pemprosesan PDF berasaskan pelayar web. Semua pemprosesan fail dilakukan sepenuhnya dalam pelayar anda — tiada fail dihantar ke pelayan kami. Perkhidmatan asas adalah percuma; ciri lanjutan tersedia melalui pelan Pro.`,
    },
    {
      title: "3. Akaun Pengguna",
      content: `Anda bertanggungjawab untuk menjaga kerahsiaan kata laluan akaun anda. Anda bersetuju untuk tidak berkongsi akaun dengan pihak lain. PDFix berhak untuk menangguhkan atau menamatkan akaun yang melanggar terma ini.`,
    },
    {
      title: "4. Penggunaan Yang Dibenarkan",
      content: `Anda bersetuju untuk menggunakan PDFix hanya untuk tujuan yang sah. Anda tidak dibenarkan menggunakan perkhidmatan ini untuk memproses dokumen yang melanggar hak cipta atau undang-undang, atau untuk sebarang tujuan haram.`,
    },
    {
      title: "5. Privasi & Data",
      content: `Kerana semua pemprosesan berlaku dalam pelayar anda, PDFix tidak menyimpan kandungan fail anda. Kami hanya menyimpan metadata penggunaan (nama fail, saiz fail, alat yang digunakan) untuk tujuan sejarah aktiviti. Sila baca Dasar Privasi kami untuk maklumat lanjut.`,
    },
    {
      title: "6. Pelan Pro & Pembayaran",
      content: `Pelan Pro dikenakan bayaran RM19/bulan melalui ToyyibPay. Bayaran tidak boleh dikembalikan melainkan dalam keadaan tertentu. Langganan boleh dibatalkan pada bila-bila masa; akses Pro akan berakhir pada penghujung tempoh berbayar.`,
    },
    {
      title: "7. Had Liabiliti",
      content: `PDFix disediakan "seadanya" tanpa sebarang jaminan. Kami tidak bertanggungjawab atas sebarang kehilangan data atau kerosakan yang timbul daripada penggunaan perkhidmatan ini. Sentiasa simpan salinan asal dokumen anda.`,
    },
    {
      title: "8. Perubahan Terma",
      content: `PDFix berhak untuk mengubah terma ini pada bila-bila masa. Perubahan akan dikuatkuasakan sebaik sahaja dipaparkan di laman web ini. Penggunaan berterusan selepas perubahan menandakan penerimaan terma baharu.`,
    },
    {
      title: "9. Hubungi Kami",
      content: `Untuk sebarang pertanyaan berkaitan terma ini, sila hubungi kami di stackxdigital@gmail.com.`,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-16 w-full">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Terma Perkhidmatan</h1>
          <p className="text-gray-500 mt-2 text-sm">Dikemaskini: Jun 2025</p>
        </div>

        <div className="space-y-8">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">{s.title}</h2>
              <p className="text-gray-600 leading-relaxed">{s.content}</p>
            </section>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 text-sm text-gray-400 flex gap-4">
          <Link href="/privacy-policy" className="hover:text-red-600">Dasar Privasi</Link>
          <Link href="/pricing" className="hover:text-red-600">Harga</Link>
          <Link href="/" className="hover:text-red-600">Laman Utama</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
