"use client";

import { useState, useRef } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { Upload, Download, Hash } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { useUsageLimit } from "@/hooks/useUsageLimit";
import UsageLimitBanner from "@/components/ui/UsageLimitBanner";

type Position = "bottom-center" | "bottom-right" | "bottom-left" | "top-center" | "top-right" | "top-left";

export default function AddPageNumbersTool() {
  const { status, limitReached, checkLimit, recordUsage } = useUsageLimit("add-page-numbers");
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [position, setPosition] = useState<Position>("bottom-center");
  const [startFrom, setStartFrom] = useState(1);
  const [fontSize, setFontSize] = useState(12);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function loadFile(f: File) {
    if (f.type !== "application/pdf") return;
    const bytes = await f.arrayBuffer();
    const pdf = await PDFDocument.load(bytes);
    setFile(f);
    setPageCount(pdf.getPageCount());
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
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const pages = pdf.getPages();

      pages.forEach((page, i) => {
        const { width, height } = page.getSize();
        const text = String(startFrom + i);
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        const margin = 20;

        let x = width / 2 - textWidth / 2;
        let y = margin;

        if (position.includes("right")) x = width - margin - textWidth;
        if (position.includes("left")) x = margin;
        if (position.includes("top")) y = height - margin - fontSize;

        page.drawText(text, { x, y, size: fontSize, font, color: rgb(0.3, 0.3, 0.3) });
      });

      const out = await pdf.save();
      await recordUsage(file?.name, file?.size);
      setResultUrl(URL.createObjectURL(new Blob([out], { type: "application/pdf" })));
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong. Please try again.");
      // error is swallowed — UI returns to idle state via finally
    } finally {
      setProcessing(false);
    }
  }

  const POSITIONS: { value: Position; label: string }[] = [
    { value: "bottom-left", label: "Bawah Kiri" },
    { value: "bottom-center", label: "Bawah Tengah" },
    { value: "bottom-right", label: "Bawah Kanan" },
    { value: "top-left", label: "Atas Kiri" },
    { value: "top-center", label: "Atas Tengah" },
    { value: "top-right", label: "Atas Kanan" },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Nombor Halaman PDF</h1>
      <p className="text-gray-500 mb-8">Tambah nombor halaman pada PDF anda.</p>

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
            <p className="text-sm text-gray-500">{formatBytes(file.size)} · {pageCount} halaman</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kedudukan</label>
            <div className="grid grid-cols-3 gap-2">
              {POSITIONS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPosition(p.value)}
                  className={`py-2 px-3 text-sm rounded-lg border transition-colors ${position === p.value ? "bg-red-600 text-white border-red-600" : "border-gray-200 hover:bg-gray-50"}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mula dari nombor</label>
              <input
                type="number" min={1} value={startFrom}
                onChange={(e) => setStartFrom(Math.max(1, Number(e.target.value)))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Saiz fon</label>
              <input
                type="number" min={8} max={24} value={fontSize}
                onChange={(e) => setFontSize(Math.max(8, Math.min(24, Number(e.target.value))))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          {resultUrl ? (
            <a href={resultUrl} download="numbered.pdf" className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700">
              <Download className="w-5 h-5" /> Muat Turun PDF
            </a>
          ) : (
            <>
              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}
              <button onClick={process} disabled={processing || limitReached} className="w-full py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-60">
              {processing ? "Memproses..." : "Tambah Nombor Halaman"}
            </button>
            </>
          )}

          <button onClick={() => { setFile(null); setResultUrl(null); }} className="w-full py-2 text-sm text-gray-500 hover:text-gray-700">
            Tukar fail
          </button>
        </div>
      )}
    </div>
  );
}
