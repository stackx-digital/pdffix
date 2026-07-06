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
      setError("Unsupported format. Please upload a .docx, .doc, or .pdf file.");
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
        // Disable worker — runs in main thread, works on all browsers including iOS Safari
        pdfjs.GlobalWorkerOptions.workerSrc = "";
        const bytes = await file.arrayBuffer();
        const doc = await pdfjs.getDocument({ data: new Uint8Array(bytes) }).promise;
        const parts: string[] = [];

        // single pass: collect items per page, track sizes for heading detection
        type PageData = { items: { str: string; height: number; y: number }[] };
        const pages: PageData[] = [];
        const allSizes: number[] = [];

        for (let p = 1; p <= doc.numPages; p++) {
          const page = await doc.getPage(p);
          const content = await page.getTextContent();
          const items: PageData["items"] = [];
          for (let k = 0; k < content.items.length; k++) {
            const raw = content.items[k] as any;
            if (!raw || typeof raw.str !== "string" || !raw.str) continue;
            const h = typeof raw.height === "number" ? raw.height : 0;
            const y = Array.isArray(raw.transform) ? Math.round(raw.transform[5]) : 0;
            items.push({ str: raw.str, height: h, y });
            if (h > 0) allSizes.push(h);
          }
          pages.push({ items });
        }

        const sorted = allSizes.slice().sort((a, b) => a - b);
        const medianSize = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 12;
        const h1Threshold = medianSize * 1.8;
        const h2Threshold = medianSize * 1.3;

        for (let p = 0; p < pages.length; p++) {
          const { items } = pages[p];
          const lines: { text: string; height: number }[] = [];
          let prevY: number | null = null;
          let lineText = "";
          let lineHeight = 0;

          for (let k = 0; k < items.length; k++) {
            const { str, height, y } = items[k];
            if (prevY !== null && Math.abs(y - prevY) > (lineHeight || medianSize) * 0.5) {
              if (lineText.trim()) lines.push({ text: lineText.trim(), height: lineHeight });
              lineText = "";
              lineHeight = 0;
            }
            lineText += (lineText && !lineText.endsWith(" ") ? " " : "") + str;
            if (height > lineHeight) lineHeight = height;
            prevY = y;
          }
          if (lineText.trim()) lines.push({ text: lineText.trim(), height: lineHeight });

          if (lines.length === 0) continue;

          const pageLines: string[] = [];
          for (let k = 0; k < lines.length; k++) {
            const { text, height } = lines[k];
            if (height >= h1Threshold && text.length < 120) {
              pageLines.push(`# ${text}`);
            } else if (height >= h2Threshold && text.length < 120) {
              pageLines.push(`## ${text}`);
            } else if (/^[•\-\*]\s/.test(text) || /^\d+\.\s/.test(text)) {
              pageLines.push(text.replace(/^[•]\s*/, "- "));
            } else {
              pageLines.push(text);
            }
          }
          parts.push(pageLines.join("\n\n"));
        }

        if (parts.length === 0) {
          throw new Error("This PDF contains no extractable text (it may be a scanned/image PDF). Use the OCR tool instead.");
        }
        md = parts.join("\n\n---\n\n");
      }
      await recordUsage(file?.name, file?.size);
      setMarkdown(md);
    } catch (e: any) {
      setError(e?.message ?? "Failed to process file. Please try another file.");
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
      <h1 className="text-2xl font-bold text-gray-900 mb-1">PDF / DOC to Markdown</h1>
      <p className="text-gray-500 mb-2">Convert PDF or Word files to clean Markdown (.md) — ideal for feeding into AI tools like ChatGPT, Claude, or Gemini.</p>
      <div className="flex items-center gap-2 mb-8">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1">
          ⚡ Up to 70% fewer tokens vs raw PDF
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1">
          🤖 AI-ready format
        </span>
      </div>

      {status && !status.loggedIn && (
        <UsageLimitBanner used={status.used} limit={status.limit!} loggedIn={status.loggedIn} />
      )}

      {!file ? (
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-12 cursor-pointer hover:border-red-400 hover:bg-red-50 transition-colors">
          <Upload className="w-8 h-8 text-gray-400 mb-3" />
          <span className="font-medium text-gray-700">Click or drag a file here</span>
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
              Change file
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
              {processing ? "Processing..." : "Convert to Markdown"}
            </button>
          )}

          {markdown && (
            <div>
              <div className="flex items-center gap-3 mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                <div className="text-center">
                  <p className="text-xs text-gray-500">File size</p>
                  <p className="text-sm font-bold text-gray-800">{(file!.size / 1024).toFixed(0)} KB</p>
                </div>
                <div className="text-green-400 text-lg font-bold">→</div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">MD size</p>
                  <p className="text-sm font-bold text-green-700">{(new Blob([markdown]).size / 1024).toFixed(0)} KB</p>
                </div>
                <div className="ml-auto text-center">
                  <p className="text-xs text-gray-500">Est. tokens saved</p>
                  <p className="text-sm font-bold text-green-700">
                    ~{Math.max(0, Math.round((file!.size - new Blob([markdown]).size) / 4 / 1000))}k tokens
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">Markdown Output</p>
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
                    <Download className="w-3.5 h-3.5" /> Download .md
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
                Start over
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
