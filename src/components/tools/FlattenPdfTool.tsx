"use client";

import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument } from "pdf-lib";
import { Upload, Download, Layers } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { useUsageLimit } from "@/hooks/useUsageLimit";
import UsageLimitBanner from "@/components/ui/UsageLimitBanner";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export default function FlattenPdfTool() {
  const { status, limitReached, checkLimit, recordUsage } = useUsageLimit("flatten-pdf");
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [quality, setQuality] = useState(90);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  async function loadFile(f: File) {
    if (f.type !== "application/pdf") return;
    const bytes = await f.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
    setFile(f);
    setPageCount(pdf.numPages);
    setResultUrl(null);
  }

  async function process() {
    if (!file) return;
    const allowed = await checkLimit();
    if (!allowed) return;
    setProcessing(true);
    setProgress(0);
    try {
      const bytes = await file.arrayBuffer();
      const srcPdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      const outPdf = await PDFDocument.create();

      for (let i = 1; i <= srcPdf.numPages; i++) {
        const page = await srcPdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await (page.render as any)({ canvasContext: ctx, viewport }).promise;

        const blob = await new Promise<Blob>((resolve) =>
          canvas.toBlob((b) => resolve(b!), "image/jpeg", quality / 100)
        );
        const imgBytes = await blob.arrayBuffer();
        const img = await outPdf.embedJpg(imgBytes);

        const pdfPage = outPdf.addPage([viewport.width / 2, viewport.height / 2]);
        pdfPage.drawImage(img, { x: 0, y: 0, width: viewport.width / 2, height: viewport.height / 2 });

        setProgress(Math.round((i / srcPdf.numPages) * 100));
      }

      const out = await outPdf.save();
      await recordUsage();
      setResultUrl(URL.createObjectURL(new Blob([out], { type: "application/pdf" })));
    } catch {
      // error is swallowed — UI returns to idle state via finally
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Flatten PDF</h1>
      <p className="text-gray-500 mb-8">Convert interactive PDFs (annotations, forms, layers) to a static PDF that cannot be edited. Ideal for official submissions.</p>
      {status && !status.loggedIn && (
        <UsageLimitBanner used={status.used} limit={status.limit!} loggedIn={status.loggedIn} />
      )}

      {!file ? (
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-16 cursor-pointer hover:border-red-400 hover:bg-red-50 transition-colors">
          <Upload className="w-10 h-10 text-gray-400 mb-3" />
          <span className="font-medium text-gray-700">Click or drag a PDF file here</span>
          <input type="file" accept=".pdf" className="hidden" onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])} />
        </label>
      ) : (
        <div className="space-y-5">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">{formatBytes(file.size)} · {pageCount} page(s)</p>
            </div>
            <button onClick={() => { setFile(null); setResultUrl(null); }} className="text-sm text-gray-400 hover:text-gray-600">Change</button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Image quality: {quality}%</label>
            <input type="range" min={60} max={100} value={quality} onChange={(e) => { setQuality(Number(e.target.value)); setResultUrl(null); }} className="w-full accent-red-600" />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Smaller file</span>
              <span>Higher quality</span>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
            <p className="text-xs text-amber-700">⚠️ Flatten will convert all pages to images. Text cannot be copied after flattening.</p>
          </div>

          {processing && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Processing...</span><span>{progress}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {resultUrl ? (
            <a href={resultUrl} download={`flattened_${file.name}`} className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700">
              <Download className="w-5 h-5" /> Download Static PDF
            </a>
          ) : (
            <button onClick={process} disabled={processing || limitReached} className="flex items-center justify-center gap-2 w-full py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-60">
              <Layers className="w-4 h-4" />
              {processing ? "Processing..." : "Flatten PDF"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
