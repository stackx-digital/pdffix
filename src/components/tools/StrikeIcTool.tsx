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

export default function StrikeIcTool() {
  const { status, limitReached, checkLimit, recordUsage } = useUsageLimit("strike-ic");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [purpose, setPurpose] = useState(PURPOSES[0]);
  const [customPurpose, setCustomPurpose] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [color, setColor] = useState<"red" | "blue" | "black">("red");
  const [processing, setProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) return;
    setImage(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
  }, []);

  async function applyStrike() {
    if (!image || !preview) return;
    const allowed = await checkLimit();
    if (!allowed) return;

    setProcessing(true);
    try {
      const img = new Image();
      img.src = preview;
      await new Promise<void>((res) => { img.onload = () => res(); });

      const canvas = canvasRef.current!;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      const W = canvas.width;
      const H = canvas.height;

      // Strike colour
      const strokeColor =
        color === "red" ? "rgba(220,38,38,0.55)"
        : color === "blue" ? "rgba(37,99,235,0.55)"
        : "rgba(30,30,30,0.50)";

      const textColor =
        color === "red" ? "rgba(220,38,38,0.85)"
        : color === "blue" ? "rgba(37,99,235,0.85)"
        : "rgba(30,30,30,0.80)";

      // Draw diagonal cross (two lines, full width/height)
      ctx.save();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = Math.max(W, H) * 0.045;
      ctx.lineCap = "round";

      // Top-left → Bottom-right
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(W, H);
      ctx.stroke();

      // Top-right → Bottom-left
      ctx.beginPath();
      ctx.moveTo(W, 0);
      ctx.lineTo(0, H);
      ctx.stroke();
      ctx.restore();

      // Purpose text — rotated diagonally across the image
      const finalPurpose = useCustom ? customPurpose.trim() || PURPOSES[0] : purpose;
      const fontSize = Math.round(Math.min(W, H) * 0.062);

      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.rotate(-Math.atan2(H, W));
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // White outline for legibility
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

      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      setResult(dataUrl);
      await recordUsage();
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!result || !image) return;
    const a = document.createElement("a");
    a.href = result;
    a.download = image.name.replace(/\.[^.]+$/, "") + "_strike.jpg";
    a.click();
  }

  function reset() {
    setImage(null);
    setPreview(null);
    setResult(null);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Strike IC Photocopy</h1>
      <p className="text-gray-500 mb-2">
        Add a diagonal cross and purpose label to your IC photocopy to prevent misuse.
      </p>
      <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
        ⚠️ Your image is processed <strong>100% in your browser</strong> — it is never uploaded to any server.
      </div>

      {status && !status.loggedIn && (
        <UsageLimitBanner used={status.used} limit={status.limit!} loggedIn={status.loggedIn} />
      )}

      {!image ? (
        <label
          className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-12 cursor-pointer hover:border-red-400 hover:bg-red-50 transition-colors"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        >
          <Upload className="w-8 h-8 text-gray-400 mb-3" />
          <span className="font-medium text-gray-700">Click or drag IC image here</span>
          <span className="text-sm text-gray-400 mt-1">JPG, PNG, WEBP supported</span>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </label>
      ) : (
        <div className="space-y-5">
          {/* Preview */}
          <div className="relative">
            <img
              src={result ?? preview!}
              alt="IC preview"
              className="w-full rounded-xl border border-gray-200 shadow"
            />
            {result && (
              <div className="absolute top-2 right-2 bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded-lg">
                ✓ Strike applied
              </div>
            )}
          </div>

          {!result && (
            <>
              {/* Purpose */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Purpose</label>
                <div className="space-y-2">
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
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
                <Download className="w-4 h-4" /> Download Image
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
              Change image
            </button>
          )}
        </div>
      )}

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
