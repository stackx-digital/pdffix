import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Dasar Privasi — PDFix",
  description: "Dasar Privasi PDFix. Ketahui bagaimana kami melindungi data dan privasi anda.",
  alternates: { canonical: "https://pdfix.my/privacy-policy" },
};

export default async function PrivacyPolicyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-16 w-full">
        <div className="mb-10">
          <p className="text-xs font-semibold text-red-600 uppercase tracking-widest mb-3">Privasi</p>
          <h1 className="text-3xl font-bold text-gray-900">Dasar Privasi</h1>
          <p className="text-gray-500 mt-2 text-sm">Tarikh Berkuat Kuasa: 13 Jun 2026</p>
        </div>

        <div className="prose prose-gray max-w-none space-y-10 text-sm leading-relaxed">

          {/* Section 1 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Pengenalan</h2>
            <p className="text-gray-600">
              PDFix ("kami", "perkhidmatan kami") beroperasi di bawah <strong>Stack Digital</strong>.
              Dasar Privasi ini menerangkan bagaimana kami mengumpul, menggunakan, dan melindungi maklumat
              anda apabila menggunakan laman web <strong>pdfix.my</strong>.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Fail PDF Anda — 100% Peribadi</h2>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-3">
              <p className="text-green-800 font-medium">
                ✅ Fail PDF dan imej yang anda proses <strong>tidak pernah dihantar ke pelayan kami</strong>.
                Semua pemprosesan berlaku terus dalam pelayar (browser) peranti anda.
                Kami tidak mempunyai akses kepada kandungan fail anda.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Maklumat Yang Kami Kumpul</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-gray-800 mb-1">a) Maklumat Akaun (jika anda mendaftar):</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
                  <li>Alamat e-mel</li>
                  <li>Nama penuh (pilihan)</li>
                  <li>Kata laluan (disimpan dalam bentuk yang disulitkan)</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-800 mb-1">b) Data Penggunaan:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
                  <li>Alat PDF yang digunakan (contoh: "compress-pdf", "merge-pdf")</li>
                  <li>Bilangan fail yang diproses</li>
                  <li>Tarikh dan masa penggunaan</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-800 mb-1">c) Data Teknikal (automatik):</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
                  <li>Jenis pelayar dan peranti</li>
                  <li>Alamat IP</li>
                  <li>Data tingkah laku laman web melalui Microsoft Clarity (analitik)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Bagaimana Kami Menggunakan Maklumat Anda</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
              <li>Menguruskan akaun dan pengesahan log masuk</li>
              <li>Memantau had penggunaan pelan percuma (5 penggunaan/bulan)</li>
              <li>Menambah baik perkhidmatan berdasarkan corak penggunaan</li>
              <li>Menghantar e-mel berkaitan akaun (pengesahan, reset kata laluan)</li>
            </ul>
            <p className="text-gray-600 mt-3">Kami <strong>tidak</strong> menjual maklumat anda kepada pihak ketiga.</p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Perkhidmatan Pihak Ketiga</h2>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Perkhidmatan</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Tujuan</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Dasar Privasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { name: "Supabase", purpose: "Pangkalan data & pengesahan", url: "https://supabase.com/privacy" },
                    { name: "Microsoft Clarity", purpose: "Analitik tingkah laku", url: "https://privacy.microsoft.com" },
                    { name: "Stripe", purpose: "Pemprosesan pembayaran (Pro)", url: "https://stripe.com/privacy" },
                    { name: "Resend", purpose: "Penghantaran e-mel", url: "https://resend.com/privacy" },
                  ].map((s) => (
                    <tr key={s.name}>
                      <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                      <td className="px-4 py-3 text-gray-600">{s.purpose}</td>
                      <td className="px-4 py-3">
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">
                          Baca →
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Penyimpanan Data</h2>
            <p className="text-gray-600">
              Data anda disimpan di pelayan <strong>Supabase</strong> yang terletak di kawasan
              Asia Pasifik (Singapura). Data dijaga dengan penyulitan SSL/TLS semasa penghantaran.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Hak Anda</h2>
            <ul className="text-gray-600 space-y-2 ml-2">
              {[
                { right: "Akses", desc: "Meminta salinan data peribadi anda" },
                { right: "Pembetulan", desc: "Mengemas kini maklumat yang tidak tepat" },
                { right: "Pemadaman", desc: "Meminta akaun dan data anda dipadam sepenuhnya" },
                { right: "Penarikan Kebenaran", desc: "Berhenti menggunakan perkhidmatan pada bila-bila masa" },
              ].map((item) => (
                <li key={item.right} className="flex gap-2">
                  <span className="font-medium text-gray-800 min-w-fit">• {item.right}:</span>
                  <span>{item.desc}</span>
                </li>
              ))}
            </ul>
            <p className="text-gray-600 mt-3">
              Untuk membuat sebarang permintaan, hubungi kami di:{" "}
              <a href="mailto:stackxdigital@gmail.com" className="text-red-600 hover:underline font-medium">
                stackxdigital@gmail.com
              </a>
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Kuki (Cookies)</h2>
            <p className="text-gray-600">
              Kami menggunakan kuki sesi untuk mengekalkan status log masuk anda. Kuki analitik
              Microsoft Clarity digunakan untuk memahami corak penggunaan laman web.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Perubahan Dasar Ini</h2>
            <p className="text-gray-600">
              Kami mungkin mengemas kini Dasar Privasi ini dari semasa ke semasa. Perubahan ketara
              akan dimaklumkan melalui e-mel atau notis dalam laman web.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Hubungi Kami</h2>
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-gray-600 space-y-1">
              <p><strong className="text-gray-800">Stack Digital</strong></p>
              <p>E-mel: <a href="mailto:stackxdigital@gmail.com" className="text-red-600 hover:underline">stackxdigital@gmail.com</a></p>
              <p>Laman web: <a href="https://pdfix.my" className="text-red-600 hover:underline">pdfix.my</a></p>
            </div>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 text-center">
          <Link href="/" className="text-sm text-red-600 hover:underline">← Kembali ke laman utama</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
