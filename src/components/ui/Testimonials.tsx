const testimonials = [
  {
    name: "Nurul Ain",
    role: "Pelajar Universiti",
    avatar: "NA",
    quote: "Saya guna PDFix setiap minggu untuk gabungkan nota kuliah. Senang sangat, tak perlu install software pun. Yang paling best, fail saya tak dihantar ke mana-mana!",
  },
  {
    name: "Ahmad Faris",
    role: "Eksekutif HR",
    avatar: "AF",
    quote: "Sebelum ni saya guna iLovePDF tapi ada had free. PDFix lebih berpatutan dan fungsinya lengkap — boleh sign dokumen, watermark, compress semua dalam satu tempat.",
  },
  {
    name: "Siti Hajar",
    role: "Guru Sekolah",
    avatar: "SH",
    quote: "Mudah digunakan walaupun saya bukan orang IT. Saya selalu guna untuk potong dan gabung soalan peperiksaan sebelum hantar ke pelajar.",
  },
];

export default function Testimonials() {
  return (
    <section className="max-w-5xl mx-auto px-4 py-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900">Apa Kata Pengguna Kami</h2>
        <p className="text-gray-500 mt-2">Dipercayai oleh pelajar, guru dan profesional Malaysia</p>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {testimonials.map((t) => (
          <div key={t.name} className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-5 shadow-sm hover:shadow-md transition-shadow duration-200">
            <p className="text-gray-600 text-sm leading-relaxed flex-1">
              <span className="text-red-400 text-2xl font-serif leading-none mr-1">"</span>
              {t.quote}
            </p>
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-400 to-red-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {t.avatar}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                <p className="text-xs text-gray-400">{t.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
