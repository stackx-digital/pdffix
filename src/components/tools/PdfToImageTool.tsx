"use client";

import { useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Image as ImageIcon, Download } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { useUsageLimit } from "@/hooks/useUsageLimit";
import UsageLimitBanner from "@/components/ui/UsageLimitBanner";

// Use bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export default function PdfToImageTool() {
  const { status, limitReached, checkLimit, recordUsage } = useUsageLimit("pdf-to-image");
  const [file, setFile] = useState<File | null>(null);
  const [converting, setConverting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [format, setFormat] = useState<"image/jpeg" | "image/png">("image/jpeg");
  const [progress, setProgress] = useState(0);

  const loadFile = useCallback((f: File | null) => {
    if (!f || f.type !== "application/pdf") return;
    setFile(f);
    setImages([]);
  }, []);

  async function convert() {
    if (!file) return;
    const allowed = await checkLimit();
    if (!allowed) return;
    setConverting(true);
    setImages([]);
    setProgress(0);

    try {
      const bytes = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      const results: string[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx as any, viewport, canvas }).promise;
        results.push(canvas.toDataURL(format, 0.9));
        setProgress(Math.round((i / pdf.numPages) * 100));
      }

      await recordUsage();
      setImages(results);
    } finally {
      setConverting(false);
    }
  }

  const ext = format === "image/jpeg" ? "jpg" : "png";

  return (
    <div className="space-y-6">
      {status && !status.isPro && status.loggedIn && (
        <UsageLimitBanner used={status.used} limit={status.limit!} loggedIn={status.loggedIn} />
      )}
      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-10 cursor-pointer hover:border-red-300 hover:bg-red-50 transition-colors">
        <ImageIcon className="w-10 h-10 text-gray-300 mb-3" />
        <span className="font-medium text-gray-700">Click or drag a PDF file here</span>
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Output format</label>
        <div className="flex gap-3">
          {(["image/jpeg", "image/png"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                format === f
                  ? "bg-red-600 text-white border-red-600"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {f === "image/jpeg" ? "JPG" : "PNG"}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={convert}
        disabled={!file || converting || limitReached}
        className="w-full py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
      >
        {converting ? `Converting... ${progress}%` : "Convert to Image"}
      </button>

      {images.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-green-700">✅ {images.length} page(s) converted successfully:</p>
          {images.map((src, i) => (
            <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
              <img src={src} alt={`Page ${i + 1}`} className="w-full" />
              <div className="p-3 flex items-center justify-between bg-gray-50">
                <span className="text-sm text-gray-600">Page {i + 1}</span>
                <a
                  href={src}
                  download={`page-${i + 1}.${ext}`}
                  className="flex items-center gap-1.5 text-sm text-red-600 hover:underline font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
