"use client";

import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { createWorker } from "tesseract.js";
import { ScanText, Copy, Check, Download, Upload } from "lucide-react";
import { formatBytes } from "@/lib/utils";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

type Lang = "eng" | "msa" | "chi_sim" | "ara";

const LANGUAGES: { value: Lang; label: string }[] = [
  { value: "eng", label: "English" },
  { value: "msa", label: "Bahasa Melayu" },
  { value: "chi_sim", label: "中文 (Ringkas)" },
  { value: "ara", label: "العربية" },
];

export default function OcrTool() {
  const [file, setFile] = useState<File | null>(null);
  const [lang, setLang] = useState<Lang>("eng");
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);

  function loadFile(f: File | null) {
    if (!f || f.type !== "application/pdf") return;
    setFile(f);
    setText("");
    setStatus("");
    setProgress(0);
  }

  async function renderPageToCanvas(page: pdfjsLib.PDFPageProxy, scale = 2): Promise<HTMLCanvasElement> {
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    await (page.render as any)({ canvasContext: ctx, viewport }).promise;
    return canvas;
  }

  async function runOcr() {
    if (!file) return;
    setProcessing(true);
    setText("");
    setProgress(0);

    try {
      const bytes = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      const totalPages = pdf.numPages;
      const results: string[] = [];

      setStatus(`Memuatkan enjin OCR (${LANGUAGES.find((l) => l.value === lang)?.label})...`);
      const worker = await createWorker(lang, 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            // per-page progress handled below
          }
        },
      });

      for (let i = 1; i <= totalPages; i++) {
        setStatus(`Memproses halaman ${i} / ${totalPages}...`);
        const page = await pdf.getPage(i);
        const canvas = await renderPageToCanvas(page);
        const { data } = await worker.recognize(canvas);
        results.push(`--- Halaman ${i} ---\n${data.text.trim()}`);
        setProgress(Math.round((i / totalPages) * 100));
      }

      await worker.terminate();
      setText(results.join("\n\n"));
      setStatus("");
    } catch (e) {
      setStatus("Ralat semasa OCR. Cuba semula.");
    }

    setProcessing(false);
  }

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadTxt() {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (file?.name.replace(".pdf", "") ?? "ocr") + ".txt";
    a.click();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">OCR PDF</h1>
      <p className="text-gray-500 mb-8">Ekstrak teks dari PDF yang diimbas menggunakan OCR. Berfungsi pada PDF imbasan dan imej.</p>

      {!file ? (
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-16 cursor-pointer hover:border-red-400 hover:bg-red-50 transition-colors">
          <Upload className="w-10 h-10 text-gray-400 mb-3" />
          <span className="font-medium text-gray-700">Klik atau seret fail PDF ke sini</span>
          <span className="text-sm text-gray-400 mt-1">PDF imbasan, PDF imej</span>
          <input type="file" accept=".pdf" className="hidden" onChange={(e) => loadFile(e.target.files?.[0] ?? null)} />
        </label>
      ) : (
        <div className="space-y-5">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">{formatBytes(file.size)}</p>
            </div>
            <button onClick={() => { setFile(null); setText(""); }} className="text-sm text-gray-400 hover:text-gray-600">Tukar</button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bahasa Dokumen</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.value}
                  onClick={() => setLang(l.value)}
                  className={`py-2 px-3 text-sm rounded-lg border transition-colors ${lang === l.value ? "bg-red-600 text-white border-red-600" : "border-gray-200 hover:bg-gray-50"}`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {processing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>{status}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-gray-400">OCR mengambil masa bergantung pada saiz PDF. Sila tunggu...</p>
            </div>
          )}

          {!text && (
            <button onClick={runOcr} disabled={processing} className="w-full py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-60">
              {processing ? "Memproses..." : "Mula OCR"}
            </button>
          )}

          {text && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-green-700">✅ OCR selesai</p>
                <div className="flex gap-2">
                  <button onClick={copy} className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Disalin!" : "Salin"}
                  </button>
                  <button onClick={downloadTxt} className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700">
                    <Download className="w-4 h-4" /> Muat Turun .txt
                  </button>
                </div>
              </div>
              <textarea
                readOnly
                value={text}
                rows={18}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono bg-gray-50 resize-y focus:outline-none"
              />
              <button onClick={() => { setText(""); setProgress(0); }} className="w-full py-2 text-sm text-gray-500 hover:text-gray-700">
                OCR semula
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <p className="text-sm text-blue-700 font-medium mb-1">ℹ️ Maklumat OCR</p>
        <p className="text-xs text-blue-600">OCR menggunakan Tesseract.js — berfungsi sepenuhnya dalam pelayar tanpa upload ke pelayan. Ketepatan bergantung pada kualiti imbasan. Untuk hasil terbaik, gunakan PDF dengan resolusi tinggi.</p>
      </div>
    </div>
  );
}
