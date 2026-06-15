import { Check, X, Minus } from "lucide-react";

const rows = [
  { feature: "Free basic use", pdfix: true, ilovepdf: true, smallpdf: "partial", adobe: "partial" },
  { feature: "No server upload", pdfix: true, ilovepdf: false, smallpdf: false, adobe: false },
  { feature: "Edit PDF (text, draw, highlight)", pdfix: true, ilovepdf: false, smallpdf: false, adobe: true },
  { feature: "E-Sign & signatures", pdfix: true, ilovepdf: true, smallpdf: true, adobe: true },
  { feature: "Fill PDF forms", pdfix: true, ilovepdf: true, smallpdf: false, adobe: true },
  { feature: "OCR (extract text from images)", pdfix: true, ilovepdf: true, smallpdf: true, adobe: true },
  { feature: "Watermark PDF", pdfix: true, ilovepdf: true, smallpdf: "partial", adobe: true },
  { feature: "Remove PDF restrictions", pdfix: true, ilovepdf: true, smallpdf: true, adobe: false },
  { feature: "Crop PDF", pdfix: true, ilovepdf: false, smallpdf: false, adobe: true },
  { feature: "Privacy — files never leave your device", pdfix: true, ilovepdf: false, smallpdf: false, adobe: false },
  { feature: "Starting price", pdfix: "RM19/mo", ilovepdf: "RM45/mo", smallpdf: "RM52/mo", adobe: "RM85/mo" },
];

type CellValue = boolean | "partial" | string;

function Cell({ val }: { val: CellValue }) {
  if (val === true) return <Check className="w-5 h-5 text-green-500 mx-auto" />;
  if (val === false) return <X className="w-5 h-5 text-gray-300 mx-auto" />;
  if (val === "partial") return <Minus className="w-5 h-5 text-amber-400 mx-auto" />;
  return <span className="text-sm font-medium text-gray-700">{val}</span>;
}

export default function ComparisonTable() {
  return (
    <section className="max-w-5xl mx-auto px-4 py-24">
      <div className="text-center mb-12">
        <p className="text-xs font-semibold text-red-600 uppercase tracking-widest mb-3">Comparison</p>
        <h2 className="text-3xl font-bold text-gray-900">PDFix vs Competitors</h2>
        <p className="text-gray-500 mt-2">Why choose PDFix over other tools?</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left px-5 py-4 text-gray-500 font-medium w-1/3">Feature</th>
              <th className="px-4 py-4 text-center">
                <div className="flex flex-col items-center gap-1">
                  <span className="font-bold text-red-600 text-base">PDFix</span>
                  <span className="text-xs text-gray-400">pdfix.my</span>
                </div>
              </th>
              <th className="px-4 py-4 text-center">
                <div className="flex flex-col items-center gap-1">
                  <span className="font-semibold text-gray-700">iLovePDF</span>
                  <span className="text-xs text-gray-400">ilovepdf.com</span>
                </div>
              </th>
              <th className="px-4 py-4 text-center">
                <div className="flex flex-col items-center gap-1">
                  <span className="font-semibold text-gray-700">Smallpdf</span>
                  <span className="text-xs text-gray-400">smallpdf.com</span>
                </div>
              </th>
              <th className="px-4 py-4 text-center">
                <div className="flex flex-col items-center gap-1">
                  <span className="font-semibold text-gray-700">Adobe</span>
                  <span className="text-xs text-gray-400">adobe.com</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.feature}
                className={`border-b border-gray-100 last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
              >
                <td className="px-5 py-3.5 text-gray-700">{row.feature}</td>
                <td className="px-4 py-3.5 text-center bg-red-50">
                  <Cell val={row.pdfix} />
                </td>
                <td className="px-4 py-3.5 text-center">
                  <Cell val={row.ilovepdf} />
                </td>
                <td className="px-4 py-3.5 text-center">
                  <Cell val={row.smallpdf} />
                </td>
                <td className="px-4 py-3.5 text-center">
                  <Cell val={row.adobe} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-center text-xs text-gray-400 mt-4">
        * Comparison based on publicly available information. Competitor pricing may vary.
      </p>
    </section>
  );
}
