"use client";

import { useState, useRef } from "react";
import { createWorker } from "tesseract.js";
import { Image as ImageIcon, Copy, Check, Download, Upload, X, ScanText } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { useUsageLimit } from "@/hooks/useUsageLimit";
import UsageLimitBanner from "@/components/ui/UsageLimitBanner";

type Lang = "eng" | "msa" | "chi_sim" | "ara";

const LANGUAGES: { value: Lang; label: string }[] = [
  { value: "eng", label: "English" },
  { value: "msa", label: "Bahasa Melayu" },
  { value: "chi_sim", label: "中文 (Ringkas)" },
  { value: "ara", label: "العربية" },
];

const ACCEPT = "image/jpeg,image/png,image/webp,image/bmp,image/tiff";

interface ImageResult {
  name: string;
  preview: string;
  text: string;
  confidence: number;
}

export default function OcrImageTool() {
  const { status, limitReached, checkLimit, recordUsage } = useUsageLimit("ocr-image");
  const [files, setFiles] = useState<File[]>([]);
  const [lang, setLang] = useState<Lang>("eng");
  const [processing, setProcessing] = useState(false);
  const [ocrStatus, setOcrStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImageResult[]>([]);
  const [copied, setCopied] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(incoming: FileList | null) {
    if (!incoming) return;
    const valid = Array.from(incoming).filter((f) => f.type.startsWith("image/"));
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      return [...prev, ...valid.filter((f) => !names.has(f.name))];
    });
    setResults([]);
  }

  function removeFile(i: number) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
    setResults([]);
  }

  async function runOcr() {
    if (!files.length) return;
    const allowed = await checkLimit();
    if (!allowed) return;

    setProcessing(true);
    setResults([]);
    setProgress(0);

    try {
      setOcrStatus(`Loading OCR engine (${LANGUAGES.find((l) => l.value === lang)?.label})…`);
      const worker = await createWorker(lang, 1, {});

      const out: ImageResult[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setOcrStatus(`Processing ${file.name} (${i + 1}/${files.length})…`);
        const url = URL.createObjectURL(file);
        const { data } = await worker.recognize(url);
        URL.revokeObjectURL(url);

        out.push({
          name: file.name,
          preview: URL.createObjectURL(file),
          text: data.text.trim(),
          confidence: Math.round(data.confidence),
        });
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }

      await worker.terminate();
      await recordUsage(files[0]?.name, files[0]?.size);
      setResults(out);
      setOcrStatus("");
    } catch {
      setOcrStatus("Error during OCR. Please try again.");
    }

    setProcessing(false);
  }

  async function copyText(text: string, i: number) {
    await navigator.clipboard.writeText(text);
    setCopied(i);
    setTimeout(() => setCopied(null), 2000);
  }

  function downloadAll() {
    const combined = results.map((r) => `=== ${r.name} ===\n${r.text}`).join("\n\n");
    const blob = new Blob([combined], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ocr-results.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadOne(r: ImageResult) {
    const blob = new Blob([r.text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = r.name.replace(/\.[^.]+$/, "") + ".txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  const allText = results.map((r) => r.text).join("\n\n");

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">OCR Image</h1>
      <p className="text-gray-500 mb-8">
        Extract text from images — resit, IC, dokumen, screenshot. Supports JPG, PNG, WebP. Runs in your browser, nothing uploaded.
      </p>

      {status && !status.loggedIn && (
        <UsageLimitBanner used={status.used} limit={status.limit!} loggedIn={status.loggedIn} />
      )}

      {/* Drop zone */}
      <label
        className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-10 cursor-pointer hover:border-red-400 hover:bg-red-50 transition-colors mb-4"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
      >
        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-3">
          <ImageIcon className="w-6 h-6 text-red-500" />
        </div>
        <span className="font-medium text-gray-700">Click or drag images here</span>
        <span className="text-sm text-gray-400 mt-1">JPG, PNG, WebP, BMP, TIFF — boleh pilih banyak sekaligus</span>
        <input ref={inputRef} type="file" accept={ACCEPT} multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
      </label>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-5">
          <div className="space-y-2">
            {files.map((f, i) => (
              <div key={f.name} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 overflow-hidden shrink-0">
                  <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{f.name}</p>
                  <p className="text-xs text-gray-400">{formatBytes(f.size)}</p>
                </div>
                {!processing && (
                  <button onClick={() => removeFile(i)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full py-2 text-sm text-red-600 border border-dashed border-red-200 rounded-xl hover:bg-red-50"
            >
              + Tambah gambar lagi
            </button>
          </div>

          {/* Language selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bahasa dokumen</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.value}
                  onClick={() => setLang(l.value)}
                  className={`py-2 px-3 text-sm rounded-lg border transition-colors ${
                    lang === l.value ? "bg-red-600 text-white border-red-600" : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Progress */}
          {processing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>{ocrStatus}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-gray-400">Sedang proses… sila tunggu.</p>
            </div>
          )}

          {/* Run button */}
          {!results.length && (
            <button
              onClick={runOcr}
              disabled={processing || limitReached}
              className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <ScanText className="w-5 h-5" />
              {processing ? "Processing…" : `Extract Text dari ${files.length} Gambar`}
            </button>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-green-700">✅ OCR selesai — {results.length} gambar diproses</p>
                {results.length > 1 && (
                  <button onClick={downloadAll} className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700">
                    <Download className="w-4 h-4" /> Download Semua
                  </button>
                )}
              </div>

              {results.map((r, i) => (
                <div key={r.name} className="border border-gray-200 rounded-xl overflow-hidden">
                  {/* Image preview + meta */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
                    <img src={r.preview} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{r.name}</p>
                      <p className="text-xs text-gray-400">Confidence: {r.confidence}%</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyText(r.text, i)}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg hover:bg-white"
                      >
                        {copied === i ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied === i ? "Copied!" : "Copy"}
                      </button>
                      <button
                        onClick={() => downloadOne(r)}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <Download className="w-3.5 h-3.5" /> .txt
                      </button>
                    </div>
                  </div>

                  {/* Extracted text */}
                  {r.text ? (
                    <textarea
                      readOnly
                      value={r.text}
                      rows={8}
                      className="w-full px-4 py-3 text-sm font-mono bg-white resize-y focus:outline-none"
                    />
                  ) : (
                    <p className="px-4 py-6 text-sm text-gray-400 text-center">Tiada text yang dapat dikesan dalam gambar ini.</p>
                  )}
                </div>
              ))}

              <button
                onClick={() => { setResults([]); setProgress(0); }}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl"
              >
                Cuba lagi / gambar baru
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <p className="text-sm text-blue-700 font-medium mb-1">ℹ️ Maklumat OCR</p>
        <p className="text-xs text-blue-600">
          OCR menggunakan Tesseract.js — berjalan 100% dalam browser anda tanpa upload ke mana-mana server.
          Ketepatan bergantung pada kualiti gambar. Untuk hasil terbaik, guna gambar yang terang dan teks yang jelas.
        </p>
      </div>
    </div>
  );
}
