"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Download, RefreshCw } from "lucide-react";
import { useUsageLimit } from "@/hooks/useUsageLimit";
import UsageLimitBanner from "@/components/ui/UsageLimitBanner";

const PURPOSES = [
  "For banking purposes only",
  "For employment purposes only",
  "For rental purposes only",
  "For insurance purposes only",
  "For loan application only",
  "For government purposes only",
  "For education purposes only",
  "For medical purposes only",
];

type FileType = "image" | "pdf";

export default function StrikeIcTool() {
  const { status, limitReached, checkLimit, recordUsage } = useUsageLimit("strike-ic");
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<FileType>("image");
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);  // data URL (jpeg)
  const [purpose, setPurpose] = useState(PURPOSES[0]);
  const [customPurpose, setCustomPurpose] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [color, setColor] = useState<"red" | "blue" | "black">("red");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = useCallback(async (f: File) => {
    setError(null);
    setResult(null);
    if (f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")) {
      setFileType("pdf");
      setFile(f);
      // Render first page of PDF as preview
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        const bytes = await f.arrayBuffer();
        const doc = await pdfjs.getDocument({ data: new Uint8Array(bytes) }).promise;
        const page = await doc.getPage(1);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext("2d")!, viewport, canvas } as any).promise;
        setPreview(canvas.toDataURL("image/jpeg", 0.9));
      } catch {
        setError("Could not render PDF. Please try another file.");
      }
    } else if (f.type.startsWith("image/")) {
      setFileType("image");
      setFile(f);
      setPreview(URL.createObjectURL(f));
    } else {
      setError("Unsupported format. Please upload a JPG, PNG or PDF file.");
    }
  }, []);

  function drawStrike(ctx: CanvasRenderingContext2D, W: number, H: number) {
    const finalPurpose = useCustom ? customPurpose.trim() || PURPOSES[0] : purpose;

    const strokeColor =
      color === "red" ? "rgba(220,38,38,0.55)"
      : color === "blue" ? "rgba(37,99,235,0.55)"
      : "rgba(30,30,30,0.50)";
    const textColor =
      color === "red" ? "rgba(220,38,38,0.85)"
      : color === "blue" ? "rgba(37,99,235,0.85)"
      : "rgba(30,30,30,0.80)";

    // Diagonal cross
    ctx.save();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = Math.max(W, H) * 0.045;
    ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W, 0); ctx.lineTo(0, H); ctx.stroke();
    ctx.restore();

    // Purpose text — rotated diagonally
    const fontSize = Math.round(Math.min(W, H) * 0.062);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-Math.atan2(H, W));
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = fontSize * 0.18;
    ctx.lineJoin = "round";
    ctx.strokeText(finalPurpose.toUpperCase(), 0, 0);
    ctx.fillStyle = textColor;
    ctx.fillText(finalPurpose.toUpperCase(), 0, 0);
    ctx.restore();

    // Date stamp bottom-right
    const dateStr = new Date().toLocaleDateString("en-MY", { day: "2-digit", month: "long", year: "numeric" });
    const dateFontSize = Math.round(Math.min(W, H) * 0.032);
    const pad = dateFontSize * 0.8;
    ctx.save();
    ctx.font = `bold ${dateFontSize}px Arial, sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = dateFontSize * 0.2;
    ctx.lineJoin = "round";
    ctx.strokeText(dateStr, W - pad, H - pad);
    ctx.fillStyle = textColor;
    ctx.fillText(dateStr, W - pad, H - pad);
    ctx.restore();
  }

  async function applyStrike() {
    if (!file || !preview) return;
    const allowed = await checkLimit();
    if (!allowed) return;

    setProcessing(true);
    setError(null);
    try {
      if (fileType === "pdf") {
        // Re-render all PDF pages with strike, combine into a PDF
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        const { PDFDocument } = await import("pdf-lib");

        const bytes = await file.arrayBuffer();
        const pdfjsDoc = await pdfjs.getDocument({ data: new Uint8Array(bytes) }).promise;
        const outPdf = await PDFDocument.create();

        for (let i = 1; i <= pdfjsDoc.numPages; i++) {
          const page = await pdfjsDoc.getPage(i);
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d")!;
          await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
          drawStrike(ctx, canvas.width, canvas.height);
          const jpegBytes = await fetch(canvas.toDataURL("image/jpeg", 0.92)).then(r => r.arrayBuffer());
          const img = await outPdf.embedJpg(jpegBytes);
          const pdfPage = outPdf.addPage([img.width / 2, img.height / 2]);
          pdfPage.drawImage(img, { x: 0, y: 0, width: img.width / 2, height: img.height / 2 });
        }

        const pdfOut = await outPdf.save();
        const blob = new Blob([pdfOut], { type: "application/pdf" });
        setResult(URL.createObjectURL(blob));
        // Show first page as preview
        const firstPage = await pdfjsDoc.getPage(1);
        const vp = firstPage.getViewport({ scale: 2 });
        const c = document.createElement("canvas");
        c.width = vp.width; c.height = vp.height;
        const cx = c.getContext("2d")!;
        await firstPage.render({ canvasContext: cx, viewport: vp, canvas: c } as any).promise;
        drawStrike(cx, c.width, c.height);
        setPreview(c.toDataURL("image/jpeg", 0.9));
      } else {
        // Image path
        const img = new Image();
        img.src = preview;
        await new Promise<void>((res) => { img.onload = () => res(); });
        const canvas = canvasRef.current!;
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        drawStrike(ctx, canvas.width, canvas.height);
        setResult(canvas.toDataURL("image/jpeg", 0.92));
        setPreview(canvas.toDataURL("image/jpeg", 0.92));
      }
      await recordUsage();
    } catch (e: any) {
      setError(e?.message ?? "Failed to process file. Please try again.");
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!result || !file) return;
    const a = document.createElement("a");
    a.href = result;
    const ext = fileType === "pdf" ? ".pdf" : ".jpg";
    a.download = file.name.replace(/\.[^.]+$/, "") + "_strike" + ext;
    a.click();
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Strike IC Photocopy</h1>
      <p className="text-gray-500 mb-2">
        Add a diagonal cross and purpose label to your IC photocopy to prevent misuse.
      </p>
      <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
        ⚠️ Your file is processed <strong>100% in your browser</strong> — it is never uploaded to any server.
      </div>

      {status && !status.loggedIn && (
        <UsageLimitBanner used={status.used} limit={status.limit!} loggedIn={status.loggedIn} />
      )}

      {!file ? (
        <label
          className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-12 cursor-pointer hover:border-red-400 hover:bg-red-50 transition-colors"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        >
          <Upload className="w-8 h-8 text-gray-400 mb-3" />
          <span className="font-medium text-gray-700">Click or drag IC file here</span>
          <span className="text-sm text-gray-400 mt-1">JPG, PNG, WEBP or PDF</span>
          <input type="file" accept="image/*,.pdf,application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </label>
      ) : (
        <div className="space-y-5">
          {/* Preview */}
          {preview && (
            <div className="relative">
              <img src={preview} alt="IC preview" className="w-full rounded-xl border border-gray-200 shadow" />
              {fileType === "pdf" && !result && (
                <div className="absolute top-2 left-2 bg-gray-800 text-white text-xs font-semibold px-2 py-1 rounded-lg">
                  PDF — page 1 preview
                </div>
              )}
              {result && (
                <div className="absolute top-2 right-2 bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded-lg">
                  ✓ Strike applied
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
          )}

          {!result && (
            <>
              {/* Purpose */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Purpose</label>
                <div className="space-y-2">
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    value={useCustom ? "__custom__" : purpose}
                    onChange={(e) => {
                      if (e.target.value === "__custom__") { setUseCustom(true); }
                      else { setUseCustom(false); setPurpose(e.target.value); }
                    }}
                  >
                    {PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}
                    <option value="__custom__">Custom purpose...</option>
                  </select>
                  {useCustom && (
                    <input
                      type="text"
                      placeholder="e.g. For Maybank account opening only"
                      value={customPurpose}
                      onChange={(e) => setCustomPurpose(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  )}
                </div>
              </div>

              {/* Colour */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Strike colour</label>
                <div className="flex gap-3">
                  {(["red", "blue", "black"] as const).map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                        color === c ? "border-gray-900 bg-gray-100" : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${
                        c === "red" ? "bg-red-600" : c === "blue" ? "bg-blue-600" : "bg-gray-900"
                      }`} />
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={applyStrike}
                disabled={processing || limitReached}
                className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {processing ? "Applying strike..." : "Apply Strike"}
              </button>
            </>
          )}

          {result && (
            <div className="flex gap-3">
              <button
                onClick={download}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download {fileType === "pdf" ? "PDF" : "Image"}
              </button>
              <button
                onClick={reset}
                className="flex items-center justify-center gap-2 px-5 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Start over
              </button>
            </div>
          )}

          {!result && (
            <button onClick={reset} className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors">
              Change file
            </button>
          )}
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
