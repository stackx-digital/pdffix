"use client";

import { useState, useCallback, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument } from "pdf-lib";
import { Trash2, Download, Upload, RotateCcw } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import { useUsageLimit } from "@/hooks/useUsageLimit";
import UsageLimitBanner from "@/components/ui/UsageLimitBanner";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export default function DeletePageTool() {
  const { status, limitReached, checkLimit, recordUsage } = useUsageLimit("delete-page");
  const [file, setFile] = useState<File | null>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const fileBytes = useRef<ArrayBuffer | null>(null);

  const loadFile = useCallback(async (f: File | null) => {
    if (!f || f.type !== "application/pdf") return;
    setError("");
    setLoading(true);
    setFile(f);
    setThumbnails([]);
    setSelected(new Set());
    setDone(false);

    try {
      const bytes = await f.arrayBuffer();
      fileBytes.current = bytes.slice(0);
      const pdf = await pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
      setTotalPages(pdf.numPages);

      const thumbs: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const vp = page.getViewport({ scale: 0.25 });
        const c = document.createElement("canvas");
        c.width = vp.width;
        c.height = vp.height;
        await page.render({ canvasContext: c.getContext("2d")! as any, viewport: vp, canvas: c }).promise;
        thumbs.push(c.toDataURL());
      }
      setThumbnails(thumbs);
    } catch {
      setError("Gagal memuatkan PDF. Sila cuba fail lain.");
      setFile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  function togglePage(pageNum: number) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(pageNum) ? next.delete(pageNum) : next.add(pageNum);
      return next;
    });
    setDone(false);
  }

  function selectAll() {
    setSelected(new Set(Array.from({ length: totalPages }, (_, i) => i + 1)));
  }

  function clearAll() {
    setSelected(new Set());
  }

  async function deletePages() {
    if (!fileBytes.current || selected.size === 0) return;
    const allowed = await checkLimit();
    if (!allowed) return;
    if (selected.size === totalPages) {
      setError("Tidak boleh delete semua halaman. Sekurang-kurangnya satu halaman mesti dikekalkan.");
      return;
    }
    setError("");
    setProcessing(true);
    try {
      const pdfDoc = await PDFDocument.load(fileBytes.current);
      // Remove pages in reverse order so indices stay valid
      const toDelete = Array.from(selected).sort((a, b) => b - a);
      for (const pageNum of toDelete) {
        pdfDoc.removePage(pageNum - 1);
      }
      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `deleted-pages-${file!.name}`;
      a.click();
      await recordUsage();
      setDone(true);
    } finally {
      setProcessing(false);
    }
  }

  if (!file) {
    return (
      <label
        className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-16 cursor-pointer hover:border-red-300 hover:bg-red-50 transition-colors"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); loadFile(e.dataTransfer.files?.[0] ?? null); }}
      >
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
          <Trash2 className="w-8 h-8 text-red-500" />
        </div>
        <p className="font-semibold text-gray-800 text-lg">Buka fail PDF</p>
        <p className="text-sm text-gray-400 mt-1">Klik atau seret fail PDF ke sini</p>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <input type="file" accept="application/pdf" className="hidden" onChange={(e) => loadFile(e.target.files?.[0] ?? null)} />
      </label>
    );
  }

  return (
    <div className="space-y-5">
      {status && !status.isPro && status.loggedIn && (
        <UsageLimitBanner used={status.used} limit={status.limit!} loggedIn={status.loggedIn} />
      )}
      {/* File bar */}
      <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl">
        <div>
          <p className="text-sm font-medium text-gray-900">{file.name}</p>
          <p className="text-xs text-gray-400">{formatBytes(file.size)} · {totalPages} halaman</p>
        </div>
        <button onClick={() => { setFile(null); setThumbnails([]); }} className="text-xs text-red-500 hover:underline">Tukar fail</button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Memuatkan halaman...</p>
        </div>
      ) : (
        <>
          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                {selected.size > 0
                  ? `${selected.size} halaman dipilih untuk didelete`
                  : "Pilih halaman yang ingin didelete"}
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={selectAll} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">Pilih Semua</button>
              <button onClick={clearAll} disabled={selected.size === 0} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 disabled:opacity-40">Nyahpilih</button>
            </div>
          </div>

          {/* Thumbnail grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {thumbnails.map((thumb, i) => {
              const pageNum = i + 1;
              const isSelected = selected.has(pageNum);
              return (
                <button
                  key={i}
                  onClick={() => togglePage(pageNum)}
                  className={cn(
                    "relative rounded-xl overflow-hidden border-2 transition-all group",
                    isSelected
                      ? "border-red-500 shadow-lg shadow-red-100"
                      : "border-gray-200 hover:border-gray-400"
                  )}
                >
                  <img src={thumb} alt={`Halaman ${pageNum}`} className="w-full block" />

                  {/* Overlay when selected */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                      <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                        <Trash2 className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}

                  {/* Hover overlay when not selected */}
                  {!isSelected && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 w-7 h-7 bg-white/80 rounded-full flex items-center justify-center transition-opacity">
                        <Trash2 className="w-3.5 h-3.5 text-gray-600" />
                      </div>
                    </div>
                  )}

                  {/* Page number */}
                  <div className={cn(
                    "text-center text-[11px] py-1 font-medium",
                    isSelected ? "bg-red-600 text-white" : "bg-gray-50 text-gray-500"
                  )}>
                    {isSelected ? "✕ Delete" : `Halaman ${pageNum}`}
                  </div>
                </button>
              );
            })}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {/* Action */}
          <div className="flex items-center gap-3">
            <button
              onClick={deletePages}
              disabled={selected.size === 0 || processing || limitReached}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              <Download className="w-5 h-5" />
              {processing ? "Memproses..." : `Delete ${selected.size > 0 ? selected.size + " halaman & " : ""}Muat Turun`}
            </button>

            {selected.size > 0 && (
              <button onClick={clearAll} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
                <RotateCcw className="w-4 h-4" /> Reset pilihan
              </button>
            )}
          </div>

          {done && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
              ✅ Berjaya! PDF baharu dengan {totalPages - selected.size} halaman telah dimuat turun.
            </div>
          )}

          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 space-y-1">
            <p className="font-medium">Nota:</p>
            <p>• Klik thumbnail untuk pilih/nyahpilih halaman yang ingin didelete</p>
            <p>• Halaman yang ditanda merah akan dibuang dari PDF</p>
            <p>• Fail asal anda tidak akan terjejas</p>
          </div>
        </>
      )}
    </div>
  );
}
