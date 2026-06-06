"use client";

import { useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import { FilePlus2, X, Download, MoveUp, MoveDown } from "lucide-react";
import { formatBytes } from "@/lib/utils";

interface PdfFile {
  id: string;
  file: File;
  pageCount: number;
}

export default function MergePdfTool() {
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [merging, setMerging] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const addFiles = useCallback(async (newFiles: FileList | null) => {
    if (!newFiles) return;
    const added: PdfFile[] = [];
    for (const file of Array.from(newFiles)) {
      if (file.type !== "application/pdf") continue;
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      added.push({ id: crypto.randomUUID(), file, pageCount: pdf.getPageCount() });
    }
    setFiles((prev) => [...prev, ...added]);
    setResultUrl(null);
  }, []);

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setResultUrl(null);
  }

  function moveFile(index: number, dir: -1 | 1) {
    setFiles((prev) => {
      const arr = [...prev];
      const target = index + dir;
      if (target < 0 || target >= arr.length) return arr;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return arr;
    });
  }

  async function merge() {
    if (files.length < 2) return;
    setMerging(true);
    try {
      const merged = await PDFDocument.create();
      for (const { file } of files) {
        const bytes = await file.arrayBuffer();
        const src = await PDFDocument.load(bytes);
        const pages = await merged.copyPages(src, src.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
      }
      const bytes = await merged.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      setResultUrl(URL.createObjectURL(blob));
    } finally {
      setMerging(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-10 cursor-pointer hover:border-red-300 hover:bg-red-50 transition-colors">
        <FilePlus2 className="w-10 h-10 text-gray-300 mb-3" />
        <span className="font-medium text-gray-700">Klik atau seret fail PDF ke sini</span>
        <span className="text-sm text-gray-400 mt-1">Boleh pilih beberapa fail sekaligus</span>
        <input
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </label>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">{files.length} fail dipilih — susun ikut urutan yang dikehendaki:</p>
          {files.map((f, i) => (
            <div key={f.id} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
              <div className="flex flex-col gap-0.5">
                <button onClick={() => moveFile(i, -1)} disabled={i === 0} className="p-0.5 hover:text-red-600 disabled:opacity-30">
                  <MoveUp className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => moveFile(i, 1)} disabled={i === files.length - 1} className="p-0.5 hover:text-red-600 disabled:opacity-30">
                  <MoveDown className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-sm font-mono text-gray-400 w-5 text-center">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{f.file.name}</p>
                <p className="text-xs text-gray-400">{f.pageCount} halaman · {formatBytes(f.file.size)}</p>
              </div>
              <button onClick={() => removeFile(f.id)} className="p-1 hover:text-red-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={merge}
          disabled={files.length < 2 || merging}
          className="flex-1 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {merging ? "Sedang menggabungkan..." : `Gabung ${files.length} Fail PDF`}
        </button>

        {resultUrl && (
          <a
            href={resultUrl}
            download="gabungan.pdf"
            className="flex items-center gap-2 px-5 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            Muat Turun
          </a>
        )}
      </div>

      {resultUrl && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
          ✅ PDF berjaya digabungkan! Klik butang "Muat Turun" untuk simpan.
        </div>
      )}
    </div>
  );
}
