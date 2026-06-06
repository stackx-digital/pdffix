"use client";

import { useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { ScanText, Copy, Check } from "lucide-react";
import { formatBytes } from "@/lib/utils";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export default function OcrTool() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [text, setText] = useState("");
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  const loadFile = useCallback((f: File | null) => {
    if (!f || f.type !== "application/pdf") return;
    setFile(f);
    setText("");
  }, []);

  async function extract() {
    if (!file) return;
    setProcessing(true);
    setText("");
    setProgress(0);

    try {
      const bytes = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      const parts: string[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item: any) => item.str)
          .join(" ")
          .trim();
        parts.push(`--- Halaman ${i} ---\n${pageText}`);
        setProgress(Math.round((i / pdf.numPages) * 100));
      }

      setText(parts.join("\n\n"));
    } finally {
      setProcessing(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-10 cursor-pointer hover:border-red-300 hover:bg-red-50 transition-colors">
        <ScanText className="w-10 h-10 text-gray-300 mb-3" />
        <span className="font-medium text-gray-700">Klik atau seret fail PDF ke sini</span>
        <p className="text-xs text-gray-400 mt-1">Ekstrak teks dari PDF yang mempunyai lapisan teks</p>
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
          <p className="text-gray-400">{formatBytes(file.size)}</p>
        </div>
      )}

      <button
        onClick={extract}
        disabled={!file || processing}
        className="w-full py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
      >
        {processing ? `Mengekstrak teks... ${progress}%` : "Ekstrak Teks"}
      </button>

      {text && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-green-700">✅ Teks berjaya diekstrak</p>
            <button
              onClick={copy}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              {copied ? "Disalin!" : "Salin Semua"}
            </button>
          </div>
          <textarea
            readOnly
            value={text}
            rows={16}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono bg-gray-50 resize-y focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}
