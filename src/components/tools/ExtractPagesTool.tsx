"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Upload, Download } from "lucide-react";
import { formatBytes } from "@/lib/utils";

export default function ExtractPagesTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [processing, setProcessing] = useState(false);
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
    setProcessing(true);
    try {
      const bytes = await file.arrayBuffer();
      const srcPdf = await PDFDocument.load(bytes);
      const outPdf = await PDFDocument.create();
      const indices = Array.from(selected).sort((a, b) => a - b);
      const copied = await outPdf.copyPages(srcPdf, indices);
      copied.forEach((page) => outPdf.addPage(page));
      const out = await outPdf.save();
      setResultUrl(URL.createObjectURL(new Blob([out], { type: "application/pdf" })));
    } catch {
      // error is swallowed — UI returns to idle state via finally
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Ekstrak Halaman PDF</h1>
      <p className="text-gray-500 mb-8">Pilih halaman yang anda mahu ekstrak dan simpan sebagai PDF baru.</p>

      {!file ? (
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-16 cursor-pointer hover:border-red-400 hover:bg-red-50 transition-colors">
          <Upload className="w-10 h-10 text-gray-400 mb-3" />
          <span className="font-medium text-gray-700">Klik atau seret fail PDF ke sini</span>
          <input type="file" accept=".pdf" className="hidden" onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])} />
        </label>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">{formatBytes(file.size)} · {pageCount} halaman</p>
            </div>
            <button onClick={selectAll} className="text-sm text-red-600 hover:underline">
              Pilih Semua
            </button>
          </div>

          <p className="text-xs text-gray-400 mb-3">Klik halaman untuk pilih/nyahpilih. {selected.size} halaman dipilih.</p>

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
              <Download className="w-5 h-5" /> Muat Turun PDF ({selected.size} halaman)
            </a>
          ) : (
            <button onClick={process} disabled={processing || selected.size === 0} className="w-full py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-60">
              {processing ? "Memproses..." : `Ekstrak ${selected.size} Halaman`}
            </button>
          )}

          <button onClick={() => { setFile(null); setResultUrl(null); }} className="mt-3 w-full py-2 text-sm text-gray-500 hover:text-gray-700">
            Tukar fail
          </button>
        </div>
      )}
    </div>
  );
}
