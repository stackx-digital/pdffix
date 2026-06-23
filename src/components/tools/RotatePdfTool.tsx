"use client";

import { useState, useRef } from "react";
import { PDFDocument, degrees } from "pdf-lib";
import { RotateCw, Upload, Download, RotateCcw } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { useUsageLimit } from "@/hooks/useUsageLimit";
import UsageLimitBanner from "@/components/ui/UsageLimitBanner";

export default function RotatePdfTool() {
  const { status, limitReached, checkLimit, recordUsage } = useUsageLimit("rotate-pdf");
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [rotations, setRotations] = useState<number[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function loadFile(f: File) {
    if (f.type !== "application/pdf") return;
    const bytes = await f.arrayBuffer();
    const pdf = await PDFDocument.load(bytes);
    const count = pdf.getPageCount();
    setFile(f);
    setPageCount(count);
    setRotations(new Array(count).fill(0));
    setResultUrl(null);
  }

  function rotate(index: number, dir: 90 | -90) {
    setRotations((prev) => {
      const next = [...prev];
      next[index] = ((next[index] + dir) % 360 + 360) % 360;
      return next;
    });
    setResultUrl(null);
  }

  function rotateAll(dir: 90 | -90) {
    setRotations((prev) => prev.map((r) => ((r + dir) % 360 + 360) % 360));
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
        if (rotations[i]) page.setRotation(degrees(rotations[i]));
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Putar PDF</h1>
      <p className="text-gray-500 mb-8">Putar halaman PDF mengikut pilihan anda.</p>

      {status && !status.loggedIn && (
        <UsageLimitBanner used={status.used} limit={status.limit!} loggedIn={status.loggedIn} />
      )}
      {!file ? (
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-16 cursor-pointer hover:border-red-400 hover:bg-red-50 transition-colors">
          <Upload className="w-10 h-10 text-gray-400 mb-3" />
          <span className="font-medium text-gray-700">Klik atau seret fail PDF ke sini</span>
          <span className="text-sm text-gray-400 mt-1">Fail PDF sahaja</span>
          <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])} />
        </label>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">{formatBytes(file.size)} · {pageCount} halaman</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => rotateAll(-90)} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                <RotateCcw className="w-4 h-4" /> Semua Kiri
              </button>
              <button onClick={() => rotateAll(90)} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                <RotateCw className="w-4 h-4" /> Semua Kanan
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-6">
            {Array.from({ length: pageCount }, (_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div
                  className="w-full aspect-[3/4] bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 text-lg font-bold transition-transform"
                  style={{ transform: `rotate(${rotations[i]}deg)` }}
                >
                  {i + 1}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => rotate(i, -90)} className="p-1 rounded hover:bg-gray-100">
                    <RotateCcw className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                  <span className="text-xs text-gray-500 w-8 text-center">{rotations[i]}°</span>
                  <button onClick={() => rotate(i, 90)} className="p-1 rounded hover:bg-gray-100">
                    <RotateCw className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {resultUrl ? (
            <a href={resultUrl} download="rotated.pdf" className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700">
              <Download className="w-5 h-5" /> Muat Turun PDF
            </a>
          ) : (
            <>
              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}
              <button onClick={process} disabled={processing || limitReached} className="w-full py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-60">
              {processing ? "Memproses..." : "Putar PDF"}
            </button>
            </>
          )}

          <button onClick={() => { setFile(null); setResultUrl(null); }} className="mt-3 w-full py-2 text-sm text-gray-500 hover:text-gray-700">
            Tukar fail
          </button>
        </div>
      )}
    </div>
  );
}
