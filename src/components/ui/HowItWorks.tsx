import { Upload, SlidersHorizontal, Download } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Muat Naik Fail",
    desc: "Pilih fail PDF dari peranti anda. Fail tidak dihantar ke mana-mana pelayan — semuanya berlaku dalam pelayar anda.",
  },
  {
    icon: SlidersHorizontal,
    title: "Edit Mengikut Keperluan",
    desc: "Gabung, pisah, mampat, tandatangan, watermark dan banyak lagi. Lebih 15 alat tersedia percuma.",
  },
  {
    icon: Download,
    title: "Muat Turun Terus",
    desc: "Fail yang telah diproses boleh dimuat turun serta-merta. Tiada pendaftaran diperlukan untuk fungsi asas.",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-gray-50/80 py-20 px-4 border-y border-gray-100">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900">Cara Guna PDFix</h2>
          <p className="text-gray-500 mt-2">3 langkah mudah, selesai dalam minit</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <div key={s.title} className="relative bg-white rounded-2xl border border-gray-200 p-7 flex flex-col items-start shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                  <s.icon className="w-6 h-6 text-red-600" />
                </div>
                <span className="text-4xl font-black text-gray-100 select-none">0{i + 1}</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
