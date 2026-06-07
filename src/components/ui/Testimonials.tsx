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
    <section className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-gray-900">Apa Kata Pengguna Kami</h2>
        <p className="text-gray-500 mt-2">Dipercayai oleh pelajar, guru dan profesional Malaysia</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {testimonials.map((t) => (
          <div key={t.name} className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col gap-4">
            <p className="text-gray-600 text-sm leading-relaxed flex-1">"{t.quote}"</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 font-bold text-sm flex items-center justify-center shrink-0">
                {t.avatar}
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">{t.name}</p>
                <p className="text-xs text-gray-400">{t.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
