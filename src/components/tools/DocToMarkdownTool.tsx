"use client";

import { useState, useCallback } from "react";
import { Upload, Download, Copy, Check, FileText } from "lucide-react";
import { useUsageLimit } from "@/hooks/useUsageLimit";
import UsageLimitBanner from "@/components/ui/UsageLimitBanner";

type FileType = "docx" | "pdf" | null;

export default function DocToMarkdownTool() {
  const { status, limitReached, checkLimit, recordUsage } = useUsageLimit("doc-to-markdown");
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<FileType>(null);
  const [markdown, setMarkdown] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((f: File) => {
    const name = f.name.toLowerCase();
    if (name.endsWith(".docx") || name.endsWith(".doc")) {
      setFileType("docx");
    } else if (name.endsWith(".pdf")) {
      setFileType("pdf");
    } else {
      setError("Format tidak disokong. Sila muat naik fail .docx, .doc, atau .pdf.");
      return;
    }
    setFile(f);
    setMarkdown("");
    setError(null);
  }, []);

  async function process() {
    if (!file || !fileType) return;
    const allowed = await checkLimit();
    if (!allowed) return;
    setProcessing(true);
    setError(null);
    try {
      let md = "";
      if (fileType === "docx") {
        const mammoth = (await import("mammoth")).default;
        const TurndownService = (await import("turndown")).default;
        const bytes = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer: bytes });
        const td = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });
        md = td.turndown(result.value);
      } else {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
        const bytes = await file.arrayBuffer();
        const doc = await pdfjs.getDocument({ data: bytes }).promise;
        const parts: string[] = [];
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          const content = await page.getTextContent();
          const text = content.items.map((item: any) => ("str" in item ? item.str : "")).join(" ");
          if (text.trim()) parts.push(`## Halaman ${i}\n\n${text.trim()}`);
        }
        md = parts.join("\n\n---\n\n");
      }
      await recordUsage();
      setMarkdown(md);
    } catch (e) {
      setError("Gagal memproses fail. Sila cuba fail lain.");
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (file?.name.replace(/\.[^.]+$/, "") ?? "output") + ".md";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copy() {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">DOC / PDF ke Markdown</h1>
      <p className="text-gray-500 mb-8">Tukar fail Word (.docx) atau PDF kepada format Markdown (.md).</p>

      {status && !status.isPro && status.loggedIn && (
        <UsageLimitBanner used={status.used} limit={status.limit!} loggedIn={status.loggedIn} />
      )}

      {!file ? (
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-12 cursor-pointer hover:border-red-400 hover:bg-red-50 transition-colors">
          <Upload className="w-8 h-8 text-gray-400 mb-3" />
          <span className="font-medium text-gray-700">Klik atau seret fail ke sini</span>
          <span className="text-sm text-gray-400 mt-1">.docx, .doc, .pdf</span>
          <input
            type="file"
            accept=".docx,.doc,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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
              <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB · {fileType?.toUpperCase()}</p>
            </div>
            <button
              onClick={() => { setFile(null); setFileType(null); setMarkdown(""); setError(null); }}
              className="ml-auto text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
            >
              Tukar fail
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
          )}

          {!markdown && !error && (
            <button
              onClick={process}
              disabled={processing || limitReached}
              className="w-full py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-60 transition-colors"
            >
              {processing ? "Memproses..." : "Tukar ke Markdown"}
            </button>
          )}

          {markdown && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">Hasil Markdown</p>
                <div className="flex gap-2">
                  <button
                    onClick={copy}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Disalin!" : "Salin"}
                  </button>
                  <button
                    onClick={download}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    <Download className="w-3.5 h-3.5" /> Muat Turun .md
                  </button>
                </div>
              </div>
              <pre className="w-full h-80 p-4 bg-gray-950 text-green-300 text-xs rounded-xl overflow-auto font-mono border border-gray-800 whitespace-pre-wrap">
                {markdown}
              </pre>
              <button
                onClick={() => { setFile(null); setFileType(null); setMarkdown(""); }}
                className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Mula semula
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
