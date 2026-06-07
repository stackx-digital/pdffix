"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Upload, Download, Unlock } from "lucide-react";
import { formatBytes } from "@/lib/utils";

export default function UnlockPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  function loadFile(f: File) {
    if (f.type !== "application/pdf") return;
    setFile(f);
    setResultUrl(null);
    setError("");
  }

  async function process() {
    if (!file) return;
    setError("");
    setProcessing(true);
    try {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const out = await pdf.save();
      setResultUrl(URL.createObjectURL(new Blob([out], { type: "application/pdf" })));
    } catch {
      setError("PDF tidak dapat dibuka. Fail mungkin rosak atau dilindungi kata laluan penuh.");
    }
    setProcessing(false);
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Buang Sekatan PDF</h1>
      <p className="text-gray-500 mb-8">Buang sekatan cetak, salin dan edit dari PDF yang terhad.</p>

      {!file ? (
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-16 cursor-pointer hover:border-red-400 hover:bg-red-50 transition-colors">
          <Upload className="w-10 h-10 text-gray-400 mb-3" />
          <span className="font-medium text-gray-700">Klik atau seret fail PDF ke sini</span>
          <input type="file" accept=".pdf" className="hidden" onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])} />
        </label>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="font-medium text-gray-900">{file.name}</p>
            <p className="text-sm text-gray-500">{formatBytes(file.size)}</p>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-xs text-blue-700">ℹ️ Tool ini membuang sekatan pemilik (cetak, salin, edit). Tidak dapat buang kata laluan pengguna.</p>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          {resultUrl ? (
            <a href={resultUrl} download={`unlocked_${file.name}`} className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700">
              <Download className="w-5 h-5" /> Muat Turun PDF Tanpa Sekatan
            </a>
          ) : (
            <button onClick={process} disabled={processing} className="flex items-center justify-center gap-2 w-full py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-60">
              <Unlock className="w-4 h-4" />
              {processing ? "Memproses..." : "Buka Kunci PDF"}
            </button>
          )}

          <button onClick={() => { setFile(null); setResultUrl(null); setError(""); }} className="w-full py-2 text-sm text-gray-500 hover:text-gray-700">
            Tukar fail
          </button>
        </div>
      )}
    </div>
  );
}
