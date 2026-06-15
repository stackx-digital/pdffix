"use client";

import { useState, useCallback } from "react";
import { Upload, Download, Copy, Check, FileText } from "lucide-react";
import { useUsageLimit } from "@/hooks/useUsageLimit";
import UsageLimitBanner from "@/components/ui/UsageLimitBanner";

export default function PdfToTextTool() {
  const { status, limitReached, checkLimit, recordUsage } = useUsageLimit("pdf-to-text");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((f: File) => {
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload .pdf files only.");
      return;
    }
    setFile(f);
    setText("");
    setError(null);
  }, []);

  async function process() {
    if (!file) return;
    const allowed = await checkLimit();
    if (!allowed) return;
    setProcessing(true);
    setError(null);
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc =
        `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

      const bytes = await file.arrayBuffer();
      const doc = await pdfjs.getDocument({ data: new Uint8Array(bytes) }).promise;
      const lines: string[] = [];

      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();

        // Group items by y-position to reconstruct lines
        const byY = new Map<number, string[]>();
        for (const item of content.items) {
          if (!("str" in item) || !item.str) continue;
          const y = Math.round((item.transform as number[])[5]);
          if (!byY.has(y)) byY.set(y, []);
          byY.get(y)!.push(item.str);
        }

        // Sort by descending y (PDF origin is bottom-left)
        const sorted = [...byY.entries()].sort((a, b) => b[0] - a[0]);
        const pageLines = sorted.map(([, words]) => words.join(" ").trim()).filter(Boolean);

        if (pageLines.length) {
          lines.push(`--- Page ${i} ---`);
          lines.push(...pageLines);
          lines.push("");
        }
      }

      if (lines.length === 0) {
        throw new Error("This PDF contains no extractable text (it may be a scanned/image PDF). Try using OCR PDF.");
      }

      await recordUsage();
      setText(lines.join("\n"));
    } catch (e: any) {
      setError(e?.message ?? "Failed to process file. Please try another file.");
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (file?.name.replace(/\.pdf$/i, "") ?? "output") + ".txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">PDF to Text</h1>
      <p className="text-gray-500 mb-8">Extract all text from a PDF to a .txt file. Free & secure — processed in your browser.</p>

      {status && !status.loggedIn && (
        <UsageLimitBanner used={status.used} limit={status.limit!} loggedIn={status.loggedIn} />
      )}

      {!file ? (
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-12 cursor-pointer hover:border-red-400 hover:bg-red-50 transition-colors">
          <Upload className="w-8 h-8 text-gray-400 mb-3" />
          <span className="font-medium text-gray-700">Click or drag a PDF file here</span>
          <span className="text-sm text-gray-400 mt-1">.pdf files only</span>
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </label>
      ) : (
        <div>
          <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl mb-6">
            <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
              <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              onClick={() => { setFile(null); setText(""); setError(null); }}
              className="ml-auto text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
            >
              Change file
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
          )}

          {!text && !error && (
            <button
              onClick={process}
              disabled={processing || limitReached}
              className="w-full py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-60 transition-colors"
            >
              {processing ? "Extracting text..." : "Extract Text"}
            </button>
          )}

          {text && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">
                  Extracted Text <span className="text-gray-400 font-normal">({text.split("\n").filter(Boolean).length} lines)</span>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={copy}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button
                    onClick={download}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    <Download className="w-3.5 h-3.5" /> Download .txt
                  </button>
                </div>
              </div>
              <textarea
                readOnly
                value={text}
                className="w-full h-80 p-4 bg-gray-950 text-green-300 text-xs rounded-xl font-mono border border-gray-800 resize-none focus:outline-none"
              />
              <button
                onClick={() => { setFile(null); setText(""); }}
                className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Start over
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
