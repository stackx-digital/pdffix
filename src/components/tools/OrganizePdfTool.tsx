"use client";

import { useState, useRef } from "react";
import { PDFDocument } from "pdf-lib";
import { Upload, Download, GripVertical, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { useUsageLimit } from "@/hooks/useUsageLimit";
import UsageLimitBanner from "@/components/ui/UsageLimitBanner";

interface Page {
  index: number;
  label: string;
}

export default function OrganizePdfTool() {
  const { status, limitReached, checkLimit, recordUsage } = useUsageLimit("organize-pdf");
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  async function loadFile(f: File) {
    if (!f.name.toLowerCase().endsWith(".pdf") && f.type !== "application/pdf") {
      setError("Please upload a valid PDF file.");
      return;
    }
    setError(null);
    try {
      const bytes = await f.arrayBuffer();
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const count = pdf.getPageCount();
      if (count === 0) { setError("This PDF has no pages."); return; }
      setFile(f);
      setPages(Array.from({ length: count }, (_, i) => ({ index: i, label: `Page ${i + 1}` })));
      setResultUrl(null);
    } catch {
      setError("Could not open this PDF. It may be password-protected or corrupted. Try unlocking it first using the Unlock PDF tool.");
    }
  }

  function move(from: number, to: number) {
    setPages((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
    setResultUrl(null);
  }

  function removePage(pos: number) {
    setPages((prev) => prev.filter((_, i) => i !== pos));
    setResultUrl(null);
  }

  function onDragStart(pos: number) { dragItem.current = pos; }
  function onDragEnter(pos: number) { dragOver.current = pos; }
  function onDragEnd() {
    if (dragItem.current !== null && dragOver.current !== null && dragItem.current !== dragOver.current) {
      move(dragItem.current, dragOver.current);
    }
    dragItem.current = null;
    dragOver.current = null;
  }

  async function process() {
    if (!file || pages.length === 0) return;
    const allowed = await checkLimit();
    if (!allowed) return;
    setError(null);
    setProcessing(true);
    try {
      const bytes = await file.arrayBuffer();
      const srcPdf = await PDFDocument.load(bytes);
      const outPdf = await PDFDocument.create();
      const indices = pages.map((p) => p.index);
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
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Organize PDF Pages</h1>
      <p className="text-gray-500 mb-8">Reorder or remove pages from your PDF.</p>

      {status && !status.loggedIn && (
        <UsageLimitBanner used={status.used} limit={status.limit!} loggedIn={status.loggedIn} />
      )}
      {!file ? (
        <>
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-16 cursor-pointer hover:border-red-400 hover:bg-red-50 transition-colors">
            <Upload className="w-10 h-10 text-gray-400 mb-3" />
            <span className="font-medium text-gray-700">Click or drag PDF file here</span>
            <input type="file" accept=".pdf" className="hidden" onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])} />
          </label>
        </>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">{formatBytes(file.size)} · {pages.length} pages</p>
            </div>
          </div>

          <p className="text-xs text-gray-400 mb-3">Drag to reorder · Click X to remove a page</p>

          <div className="space-y-2 mb-6">
            {pages.map((page, pos) => (
              <div
                key={`${page.index}-${pos}`}
                draggable
                onDragStart={() => onDragStart(pos)}
                onDragEnter={() => onDragEnter(pos)}
                onDragEnd={onDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl cursor-grab active:cursor-grabbing hover:border-red-200 hover:shadow-sm transition-all"
              >
                <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="w-8 h-10 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                  {page.index + 1}
                </div>
                <span className="flex-1 text-sm font-medium text-gray-700">{page.label}</span>
                <div className="flex gap-1">
                  <button onClick={() => pos > 0 && move(pos, pos - 1)} disabled={pos === 0} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30">
                    <ArrowUp className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                  <button onClick={() => pos < pages.length - 1 && move(pos, pos + 1)} disabled={pos === pages.length - 1} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30">
                    <ArrowDown className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                  <button onClick={() => removePage(pos)} className="p-1 rounded hover:bg-red-50 text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {resultUrl ? (
            <a href={resultUrl} download="organized.pdf" className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700">
              <Download className="w-5 h-5" /> Download PDF
            </a>
          ) : (
            <>
              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}
              <button onClick={process} disabled={processing || pages.length === 0 || limitReached} className="w-full py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-60">
                {processing ? "Processing..." : "Save PDF"}
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
