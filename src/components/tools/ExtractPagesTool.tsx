"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Upload, Download } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { useUsageLimit } from "@/hooks/useUsageLimit";
import UsageLimitBanner from "@/components/ui/UsageLimitBanner";

export default function ExtractPagesTool() {
  const { status, limitReached, checkLimit, recordUsage } = useUsageLimit("extract-pages");
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  async function loadFile(f: File) {
    if (f.type !== "application/pdf") return;
    const bytes = await f.arrayBuffer();
    const pdf = await PDFDocument.load(bytes);
    setFile(f);
    setPageCount(pdf.getPageCount());
    setSelected(new Set());
    setResultUrl(null);
  }

  function toggle(page: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(page) ? next.delete(page) : next.add(page);
      return next;
    });
    setResultUrl(null);
  }

  function selectAll() {
    setSelected(new Set(Array.from({ length: pageCount }, (_, i) => i)));
    setResultUrl(null);
  }

  async function process() {
    if (!file || selected.size === 0) return;
    const allowed = await checkLimit();
    if (!allowed) return;
    setError(null);
    setProcessing(true);
    try {
      const bytes = await file.arrayBuffer();
      const srcPdf = await PDFDocument.load(bytes);
      const outPdf = await PDFDocument.create();
      const indices = Array.from(selected).sort((a, b) => a - b);
      const copied = await outPdf.copyPages(srcPdf, indices);
      copied.forEach((page) => outPdf.addPage(page));
      const out = await outPdf.save();
      await recordUsage(file?.name, file?.size);
      setResultUrl(URL.createObjectURL(new Blob([out], { type: "application/pdf" })));
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong. Please try again.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Extract PDF Pages</h1>
      <p className="text-gray-500 mb-8">Select the pages you want to extract and save as a new PDF.</p>

      {status && !status.loggedIn && (
        <UsageLimitBanner used={status.used} limit={status.limit!} loggedIn={status.loggedIn} />
      )}
      {!file ? (
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-16 cursor-pointer hover:border-red-400 hover:bg-red-50 transition-colors">
          <Upload className="w-10 h-10 text-gray-400 mb-3" />
          <span className="font-medium text-gray-700">Click or drag PDF file here</span>
          <input type="file" accept=".pdf" className="hidden" onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])} />
        </label>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">{formatBytes(file.size)} · {pageCount} pages</p>
            </div>
            <button onClick={selectAll} className="text-sm text-red-600 hover:underline">
              Select All
            </button>
          </div>

          <p className="text-xs text-gray-400 mb-3">Click a page to select/deselect. {selected.size} page(s) selected.</p>

          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 mb-6">
            {Array.from({ length: pageCount }, (_, i) => (
              <button
                key={i}
                onClick={() => toggle(i)}
                className={`aspect-[3/4] rounded-lg border-2 flex items-center justify-center text-sm font-bold transition-all ${
                  selected.has(i)
                    ? "border-red-500 bg-red-50 text-red-600"
                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {resultUrl ? (
            <a href={resultUrl} download="extracted.pdf" className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700">
              <Download className="w-5 h-5" /> Download PDF ({selected.size} pages)
            </a>
          ) : (
            <>
              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}
              <button onClick={process} disabled={processing || selected.size === 0 || limitReached} className="w-full py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-60">
                {processing ? "Processing..." : `Extract ${selected.size} Pages`}
              </button>
            </>
          )}

          <button onClick={() => { setFile(null); setResultUrl(null); }} className="mt-3 w-full py-2 text-sm text-gray-500 hover:text-gray-700">
            Change file
          </button>
        </div>
      )}
    </div>
  );
}
