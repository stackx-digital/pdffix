import { Upload, SlidersHorizontal, Download } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Upload Your File",
    desc: "Select a PDF file from your device. Files are never sent to any server — everything happens right in your browser.",
  },
  {
    icon: SlidersHorizontal,
    title: "Edit as Needed",
    desc: "Merge, split, compress, sign, watermark, and more. Over 15 tools available for free.",
  },
  {
    icon: Download,
    title: "Download Instantly",
    desc: "Your processed file is ready to download immediately. No registration required for basic features.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24 px-4 bg-white border-b border-gray-100">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-red-600 uppercase tracking-widest mb-3">How It Works</p>
          <h2 className="text-3xl font-bold text-gray-900">3 Simple Steps</h2>
          <p className="text-gray-500 mt-2">Done in under a minute</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <div key={s.title} className="relative group">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[calc(100%_-_12px)] w-6 h-px bg-gray-200 z-10" />
              )}
              <div className="bg-white border border-gray-200 rounded-2xl p-7 hover:border-red-200 hover:shadow-lg hover:shadow-red-50 transition-all duration-200 h-full">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                    <s.icon className="w-5 h-5 text-red-600" />
                  </div>
                  <span className="text-5xl font-black text-gray-100 select-none leading-none">0{i + 1}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
