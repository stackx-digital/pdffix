"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Upload, Download } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { useUsageLimit } from "@/hooks/useUsageLimit";
import UsageLimitBanner from "@/components/ui/UsageLimitBanner";

interface Margins { top: number; right: number; bottom: number; left: number; }

export default function CropPdfTool() {
  const { status, limitReached, checkLimit, recordUsage } = useUsageLimit("crop-pdf");
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const [margins, setMargins] = useState<Margins>({ top: 0, right: 0, bottom: 0, left: 0 });
  const [applyTo, setApplyTo] = useState<"all" | "odd" | "even">("all");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  async function loadFile(f: File) {
    if (f.type !== "application/pdf") return;
    const bytes = await f.arrayBuffer();
    const pdf = await PDFDocument.load(bytes);
    const pages = pdf.getPages();
    const { width, height } = pages[0].getSize();
    setFile(f);
    setPageCount(pages.length);
    setPageSize({ width: Math.round(width), height: Math.round(height) });
    setMargins({ top: 0, right: 0, bottom: 0, left: 0 });
    setResultUrl(null);
  }

  function setMargin(key: keyof Margins, val: string) {
    setMargins((prev) => ({ ...prev, [key]: Math.max(0, Number(val) || 0) }));
    setResultUrl(null);
  }

  async function process() {
    if (!file) return;
    const allowed = await checkLimit();
    if (!allowed) return;
    setError(null);
    setProcessing(true);
    try {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      const pages = pdf.getPages();

      pages.forEach((page, i) => {
        const pageNum = i + 1;
        const shouldCrop =
          applyTo === "all" ||
          (applyTo === "odd" && pageNum % 2 !== 0) ||
          (applyTo === "even" && pageNum % 2 === 0);

        if (!shouldCrop) return;

        const { width, height } = page.getSize();
        const x = margins.left;
        const y = margins.bottom;
        const w = width - margins.left - margins.right;
        const h = height - margins.top - margins.bottom;
        if (w > 0 && h > 0) {
          page.setCropBox(x, y, w, h);
        }
      });

      const out = await pdf.save();
      await recordUsage();
      setResultUrl(URL.createObjectURL(new Blob([out], { type: "application/pdf" })));
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong. Please try again.");
      // error is swallowed — UI returns to idle state via finally
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Potong PDF</h1>
      <p className="text-gray-500 mb-8">Potong margin halaman PDF mengikut ukuran yang anda tetapkan.</p>

      {status && !status.loggedIn && (
        <UsageLimitBanner used={status.used} limit={status.limit!} loggedIn={status.loggedIn} />
      )}
      {!file ? (
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-16 cursor-pointer hover:border-red-400 hover:bg-red-50 transition-colors">
          <Upload className="w-10 h-10 text-gray-400 mb-3" />
          <span className="font-medium text-gray-700">Klik atau seret fail PDF ke sini</span>
          <input type="file" accept=".pdf" className="hidden" onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])} />
        </label>
      ) : (
        <div className="space-y-5">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="font-medium text-gray-900">{file.name}</p>
            <p className="text-sm text-gray-500">{formatBytes(file.size)} · {pageCount} halaman · {pageSize.width} × {pageSize.height} pt</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Margin yang ingin dipotong (dalam poin/pt)</label>
            <div className="grid grid-cols-2 gap-3">
              {(["top", "right", "bottom", "left"] as const).map((side) => (
                <div key={side}>
                  <label className="block text-xs text-gray-500 mb-1 capitalize">
                    {side === "top" ? "Atas" : side === "right" ? "Kanan" : side === "bottom" ? "Bawah" : "Kiri"}
                  </label>
                  <input
                    type="number" min={0} value={margins[side]}
                    onChange={(e) => setMargin(side, e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">72pt = 1 inci. Saiz halaman standard A4 = 595 × 842 pt.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pakai pada</label>
            <div className="flex gap-2">
              {[{ v: "all", l: "Semua Halaman" }, { v: "odd", l: "Ganjil sahaja" }, { v: "even", l: "Genap sahaja" }].map((o) => (
                <button key={o.v} onClick={() => setApplyTo(o.v as any)}
                  className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${applyTo === o.v ? "bg-red-600 text-white border-red-600" : "border-gray-200 hover:bg-gray-50"}`}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>

          {resultUrl ? (
            <a href={resultUrl} download={`cropped_${file.name}`} className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700">
              <Download className="w-5 h-5" /> Muat Turun PDF
            </a>
          ) : (
            <>
              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}
              <button onClick={process} disabled={processing || limitReached} className="w-full py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-60">
              {processing ? "Memproses..." : "Potong PDF"}
            </button>
            </>
          )}

          <button onClick={() => { setFile(null); setResultUrl(null); }} className="w-full py-2 text-sm text-gray-500 hover:text-gray-700">Tukar fail</button>
        </div>
      )}
    </div>
  );
}
