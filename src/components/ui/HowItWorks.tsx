import { Upload, SlidersHorizontal, Download } from "lucide-react";

const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Muat Naik Fail",
    desc: "Pilih fail PDF dari peranti anda. Fail tidak dihantar ke mana-mana pelayan — semuanya berlaku dalam pelayar anda.",
  },
  {
    icon: SlidersHorizontal,
    step: "02",
    title: "Edit Mengikut Keperluan",
    desc: "Gabung, pisah, mampat, tandatangan, watermark dan banyak lagi. Lebih 15 alat tersedia percuma.",
  },
  {
    icon: Download,
    step: "03",
    title: "Muat Turun Terus",
    desc: "Fail yang telah diproses boleh dimuat turun serta-merta. Tiada pendaftaran diperlukan untuk fungsi asas.",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-gray-50 py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-gray-900">Cara Guna PDFix</h2>
          <p className="text-gray-500 mt-2">3 langkah mudah, selesai dalam minit</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <div key={s.step} className="relative flex flex-col items-center text-center">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[calc(50%+3rem)] w-[calc(100%-3rem)] h-px border-t-2 border-dashed border-gray-300" />
              )}
              <div className="w-20 h-20 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center mb-4 relative">
                <s.icon className="w-8 h-8 text-red-600" />
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
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
