"use client";

import { useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import { Upload, Download, X, FileArchive, CheckCircle2 } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { useUsageLimit } from "@/hooks/useUsageLimit";
import UsageLimitBanner from "@/components/ui/UsageLimitBanner";

interface PdfEntry {
  id: string;
  file: File;
  status: "pending" | "processing" | "done" | "error";
  originalSize: number;
  compressedSize?: number;
  url?: string;
}

export default function BatchCompressTool() {
  const { status, limitReached, checkLimit, recordUsage } = useUsageLimit("batch-compress");
  const [entries, setEntries] = useState<PdfEntry[]>([]);
  const [processing, setProcessing] = useState(false);

  const addFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const added: PdfEntry[] = Array.from(files)
      .filter((f) => f.type === "application/pdf")
      .map((f) => ({ id: crypto.randomUUID(), file: f, status: "pending", originalSize: f.size }));
    setEntries((prev) => [...prev, ...added]);
  }, []);

  function remove(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  async function compressSingle(bytes: ArrayBuffer): Promise<Uint8Array> {
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
    // Re-save with compression — removes unused objects and compresses streams
    return pdf.save({ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 50 });
  }

  async function processAll() {
    const allowed = await checkLimit();
    if (!allowed) return;
    setProcessing(true);
    const pending = entries.filter((e) => e.status === "pending");

    for (const entry of pending) {
      setEntries((prev) => prev.map((e) => e.id === entry.id ? { ...e, status: "processing" } : e));
      try {
        const bytes = await entry.file.arrayBuffer();
        const out = await compressSingle(bytes);
        const url = URL.createObjectURL(new Blob([out], { type: "application/pdf" }));
        await recordUsage();
        setEntries((prev) => prev.map((e) =>
          e.id === entry.id ? { ...e, status: "done", compressedSize: out.length, url } : e
        ));
      } catch {
        setEntries((prev) => prev.map((e) => e.id === entry.id ? { ...e, status: "error" } : e));
      }
    }
    setProcessing(false);
  }

  function downloadAll() {
    entries.filter((e) => e.url).forEach((e) => {
      const a = document.createElement("a");
      a.href = e.url!;
      a.download = `compressed_${e.file.name}`;
      a.click();
    });
  }

  const totalOriginal = entries.reduce((s, e) => s + e.originalSize, 0);
  const totalCompressed = entries.filter((e) => e.compressedSize).reduce((s, e) => s + (e.compressedSize ?? 0), 0);
  const allDone = entries.length > 0 && entries.every((e) => e.status === "done" || e.status === "error");
  const hasPending = entries.some((e) => e.status === "pending");

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Mampat PDF Berganda</h1>
      <p className="text-gray-500 mb-8">Mampat banyak fail PDF sekaligus.</p>
      {status && !status.isPro && status.loggedIn && (
        <UsageLimitBanner used={status.used} limit={status.limit!} loggedIn={status.loggedIn} />
      )}

      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-10 cursor-pointer hover:border-red-400 hover:bg-red-50 transition-colors mb-6">
        <Upload className="w-8 h-8 text-gray-400 mb-2" />
        <span className="font-medium text-gray-700">Klik atau seret fail PDF ke sini</span>
        <span className="text-sm text-gray-400 mt-1">Boleh pilih beberapa fail sekaligus</span>
        <input type="file" accept=".pdf" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
      </label>

      {entries.length > 0 && (
        <>
          {allDone && totalCompressed > 0 && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="font-medium text-green-800">
                Jimat {formatBytes(totalOriginal - totalCompressed)} ({Math.round((1 - totalCompressed / totalOriginal) * 100)}%)
              </p>
              <p className="text-sm text-green-600">{formatBytes(totalOriginal)} → {formatBytes(totalCompressed)}</p>
            </div>
          )}

          <div className="space-y-2 mb-5">
            {entries.map((entry) => {
              const saved = entry.compressedSize ? entry.originalSize - entry.compressedSize : 0;
              const pct = entry.compressedSize ? Math.round((1 - entry.compressedSize / entry.originalSize) * 100) : 0;
              return (
                <div key={entry.id} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl">
                  <FileArchive className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{entry.file.name}</p>
                    <p className="text-xs text-gray-400">
                      {formatBytes(entry.originalSize)}
                      {entry.compressedSize && <span className="text-green-600"> → {formatBytes(entry.compressedSize)} ({pct}% jimat)</span>}
                      {entry.status === "error" && <span className="text-red-500"> · Ralat</span>}
                    </p>
                  </div>
                  {entry.status === "processing" && <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />}
                  {entry.status === "done" && entry.url && (
                    <a href={entry.url} download={`compressed_${entry.file.name}`} className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100">
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                  {entry.status === "pending" && (
                    <button onClick={() => remove(entry.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {entry.status === "done" && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            {hasPending && (
              <button onClick={processAll} disabled={processing || limitReached} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-60">
                {processing ? "Memproses..." : `Mampat ${entries.filter((e) => e.status === "pending").length} Fail`}
              </button>
            )}
            {allDone && (
              <button onClick={downloadAll} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700">
                Muat Turun Semua
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
