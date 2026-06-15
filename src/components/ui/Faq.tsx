"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "Is PDFix really free?",
    a: "Yes! Core tools like PDF editing, merging, splitting, compressing, and PDF to image are completely free. The Pro plan adds advanced tools such as OCR and PDF to Word.",
  },
  {
    q: "Are my files safe? Are they uploaded to a server?",
    a: "Your files are never uploaded to any server. All processing happens 100% in your browser. Your PDF files never leave your device.",
  },
  {
    q: "What is the maximum supported file size?",
    a: "Free users can process files up to 10MB. Pro users can process files up to 100MB.",
  },
  {
    q: "How does PDF editing work?",
    a: "Open a PDF file and use the toolbar to add text, draw, highlight, sign, stamp, and more. Click 'Save PDF' to download.",
  },
  {
    q: "Can I add a signature to a PDF?",
    a: "Absolutely! Use the 'Signature' tool in the editor. Draw your signature on the signature pad, then place it anywhere on the PDF.",
  },
  {
    q: "What's the difference between the Free and Pro versions?",
    a: "The Free version includes all core tools with a 10MB file limit. Pro (RM19/month) adds OCR and PDF to Word, with a 100MB file limit.",
  },
  {
    q: "Can I use PDFix on my phone?",
    a: "Yes, PDFix works on all devices. For the best editing experience, we recommend using a desktop computer.",
  },
  {
    q: "What file formats are supported?",
    a: "PDFix focuses on PDF operations. We support PDF to image (JPG/PNG) and PDF to Word (Pro version).",
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="max-w-3xl mx-auto px-4 py-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
        <p className="text-gray-500 mt-2">Answers to common questions.</p>
      </div>
      <div className="space-y-2">
        {FAQS.map((faq, i) => (
          <div key={i} className={cn("rounded-2xl border overflow-hidden transition-colors duration-200", open === i ? "border-red-200 bg-red-50/40" : "border-gray-200 bg-white")}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-6 py-4 text-left"
            >
              <span className="font-medium text-gray-900 pr-4 text-sm">{faq.q}</span>
              <ChevronDown className={cn("w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200", open === i && "rotate-180 text-red-500")} />
            </button>
            {open === i && (
              <div className="px-6 pb-5 text-sm text-gray-600 leading-relaxed">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
