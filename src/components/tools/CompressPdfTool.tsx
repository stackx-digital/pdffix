"use client";

import { useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import { FileArchive, Download } from "lucide-react";
import { formatBytes } from "@/lib/utils";

export default function CompressPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [result, setResult] = useState<{ url: string; size: number } | null>(null);

  const loadFile = useCallback((f: File | null) => {
    if (!f || f.type !== "application/pdf") return;
    setFile(f);
    setResult(null);
  }, []);

  async function compress() {
    if (!file) return;
    setCompressing(true);
    try {
      const bytes = await file.arrayBuffer();
      // Re-save with pdf-lib removes redundant data and re-compresses streams
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const compressed = await pdf.save({ useObjectStreams: true });
      const blob = new Blob([compressed], { type: "application/pdf" });
      setResult({ url: URL.createObjectURL(blob), size: blob.size });
    } finally {
      setCompressing(false);
    }
  }

  const saving = file && result ? Math.round((1 - result.size / file.size) * 100) : 0;

  return (
    <div className="space-y-6">
      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-10 cursor-pointer hover:border-red-300 hover:bg-red-50 transition-colors">
        <FileArchive className="w-10 h-10 text-gray-300 mb-3" />
        <span className="font-medium text-gray-700">Klik atau seret fail PDF ke sini</span>
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => loadFile(e.target.files?.[0] ?? null)}
        />
      </label>

      {file && (
        <div className="p-3 bg-white border border-gray-200 rounded-lg text-sm">
          <p className="font-medium text-gray-900">{file.name}</p>
          <p className="text-gray-400">Saiz asal: {formatBytes(file.size)}</p>
        </div>
      )}

      <button
        onClick={compress}
        disabled={!file || compressing}
        className="w-full py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
      >
        {compressing ? "Sedang memampatkan..." : "Mampat PDF"}
      </button>

      {result && file && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl space-y-3">
          <p className="text-sm font-medium text-green-800">✅ PDF berjaya dimampatkan!</p>
          <div className="flex gap-6 text-sm">
            <div>
              <p className="text-gray-500">Asal</p>
              <p className="font-semibold text-gray-900">{formatBytes(file.size)}</p>
            </div>
            <div>
              <p className="text-gray-500">Selepas</p>
              <p className="font-semibold text-green-700">{formatBytes(result.size)}</p>
            </div>
            <div>
              <p className="text-gray-500">Jimat</p>
              <p className="font-semibold text-green-700">{saving > 0 ? `${saving}%` : "—"}</p>
            </div>
          </div>
          <a
            href={result.url}
            download={`dimampat-${file.name}`}
            className="flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            Muat Turun
          </a>
          {saving <= 0 && (
            <p className="text-xs text-gray-500">
              PDF ini sudah optimum — tiada pengurangan ketara dapat dicapai dalam browser.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
