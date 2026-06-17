"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, Download, RefreshCw, Plus, Trash2 } from "lucide-react";
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

const DATE_STR = new Date().toLocaleDateString("en-MY", { day: "2-digit", month: "long", year: "numeric" });

interface StampConfig {
  id: number;
  x: number;
  y: number;
  scale: number;
  angle: number;
  purpose: string;
  useCustom: boolean;
  customPurpose: string;
  color: "red" | "blue" | "black";
}

function effectivePurpose(s: StampConfig) {
  return s.useCustom ? (s.customPurpose.trim() || PURPOSES[0]) : s.purpose;
}

function stampBounds(
  cfg: StampConfig, W: number, H: number
): { cx: number; cy: number; r: number } {
  const baseFont = Math.round(Math.min(W, H) * 0.09 * cfg.scale);
  const cx = W * cfg.x;
  const cy = H * cfg.y;
  return { cx, cy, r: baseFont * 1.2 };
}

function renderStamp(ctx: CanvasRenderingContext2D, W: number, H: number, cfg: StampConfig, active = false) {
  const rgba = (a: number) =>
    cfg.color === "red" ? `rgba(220,38,38,${a})`
    : cfg.color === "blue" ? `rgba(29,78,216,${a})`
    : `rgba(17,24,39,${a})`;

  const baseFont = Math.round(Math.min(W, H) * 0.09 * cfg.scale);
  const cx = W * cfg.x;
  const cy = H * cfg.y;
  const angle = cfg.angle * (Math.PI / 180);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  // Active stamp: dashed selection ring
  if (active) {
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "rgba(59,130,246,0.7)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(
      -baseFont * 2.2, -baseFont * 0.9,
      baseFont * 4.4, baseFont * 1.8
    );
    ctx.restore();
  }

  ctx.font = `900 ${baseFont}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = baseFont * 0.12;
  ctx.lineJoin = "round";
  ctx.strokeText(effectivePurpose(cfg).toUpperCase(), 0, 0);
  ctx.fillStyle = rgba(0.82);
  ctx.fillText(effectivePurpose(cfg).toUpperCase(), 0, 0);

  const dateFont = Math.round(baseFont * 0.42);
  ctx.font = `bold ${dateFont}px Arial, sans-serif`;
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = dateFont * 0.15;
  ctx.strokeText(DATE_STR, 0, baseFont * 0.72);
  ctx.fillStyle = rgba(0.65);
  ctx.fillText(DATE_STR, 0, baseFont * 0.72);

  ctx.restore();
}

let nextId = 1;
function makeStamp(x = 0.5, y = 0.3): StampConfig {
  return {
    id: nextId++,
    x, y,
    scale: 1,
    angle: -30,
    purpose: PURPOSES[0],
    useCustom: false,
    customPurpose: "",
    color: "red",
  };
}

type FileType = "image" | "pdf";

export default function StrikeIcTool() {
  const { status, limitReached, checkLimit, recordUsage } = useUsageLimit("strike-ic");
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<FileType>("image");
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  const [stamps, setStamps] = useState<StampConfig[]>([makeStamp(0.5, 0.3)]);
  const [activeId, setActiveId] = useState<number>(stamps[0].id);

  const [draggingId, setDraggingId] = useState<number | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const activeStamp = stamps.find(s => s.id === activeId) ?? stamps[0];

  function updateActive(patch: Partial<StampConfig>) {
    setStamps(prev => prev.map(s => s.id === activeId ? { ...s, ...patch } : s));
  }

  // Redraw on every render
  useEffect(() => {
    if (!imgSrc || !canvasRef.current || !imgRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imgRef.current, 0, 0, canvas.width, canvas.height);
    for (const s of stamps) {
      renderStamp(ctx, canvas.width, canvas.height, s, s.id === activeId && !result);
    }
  });

  const loadImage = useCallback((src: string) => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const canvas = canvasRef.current!;
      const maxW = Math.min(700, window.innerWidth - 64);
      const ratio = img.naturalHeight / img.naturalWidth;
      canvas.width = maxW;
      canvas.height = Math.round(maxW * ratio);
    };
    img.src = src;
    setImgSrc(src);
  }, []);

  const handleFile = useCallback(async (f: File) => {
    setError(null); setResult(null);
    setFile(f);
    if (f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")) {
      setFileType("pdf");
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        const bytes = new Uint8Array(await f.arrayBuffer());
        setPdfBytes(bytes);
        const doc = await pdfjs.getDocument({ data: bytes }).promise;
        setTotalPages(doc.numPages);
        const page = await doc.getPage(1);
        const vp = page.getViewport({ scale: 2 });
        const c = document.createElement("canvas");
        c.width = vp.width; c.height = vp.height;
        await page.render({ canvasContext: c.getContext("2d")!, viewport: vp, canvas: c } as any).promise;
        loadImage(c.toDataURL("image/jpeg", 0.92));
      } catch { setError("Could not read PDF."); }
    } else if (f.type.startsWith("image/")) {
      setFileType("image");
      setPdfBytes(null);
      loadImage(URL.createObjectURL(f));
    } else {
      setError("Please upload JPG, PNG or PDF.");
    }
  }, [loadImage]);

  function hitTest(relX: number, relY: number): StampConfig | null {
    const canvas = canvasRef.current!;
    const W = canvas.width, H = canvas.height;
    // Test in reverse order (topmost stamp first)
    for (let i = stamps.length - 1; i >= 0; i--) {
      const s = stamps[i];
      const { cx, cy, r } = stampBounds(s, W, H);
      const dx = relX * W - cx;
      const dy = relY * H - cy;
      if (Math.sqrt(dx * dx + dy * dy) < r) return s;
    }
    return null;
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (result) return;
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const rx = (e.clientX - rect.left) / rect.width;
    const ry = (e.clientY - rect.top) / rect.height;
    const hit = hitTest(rx, ry);
    if (hit) {
      setActiveId(hit.id);
      setDraggingId(hit.id);
      dragOffset.current = { x: rx - hit.x, y: ry - hit.y };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (draggingId === null || result) return;
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const rx = (e.clientX - rect.left) / rect.width;
    const ry = (e.clientY - rect.top) / rect.height;
    setStamps(prev => prev.map(s => s.id === draggingId ? {
      ...s,
      x: Math.max(0.05, Math.min(0.95, rx - dragOffset.current.x)),
      y: Math.max(0.05, Math.min(0.95, ry - dragOffset.current.y)),
    } : s));
  }

  function onPointerUp() { setDraggingId(null); }

  function addStamp() {
    // Place new stamp in the lower half by default
    const lastY = stamps[stamps.length - 1]?.y ?? 0.3;
    const newY = lastY > 0.5 ? 0.3 : 0.7;
    const s = makeStamp(0.5, newY);
    setStamps(prev => [...prev, s]);
    setActiveId(s.id);
  }

  function deleteStamp(id: number) {
    if (stamps.length === 1) return;
    setStamps(prev => {
      const next = prev.filter(s => s.id !== id);
      if (id === activeId) setActiveId(next[next.length - 1].id);
      return next;
    });
  }

  async function applyStamp() {
    if (!file || !imgSrc) return;
    const allowed = await checkLimit();
    if (!allowed) return;
    setProcessing(true); setError(null);

    try {
      if (fileType === "pdf" && pdfBytes) {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        const { PDFDocument } = await import("pdf-lib");
        const pdfjsDoc = await pdfjs.getDocument({ data: pdfBytes }).promise;
        const outPdf = await PDFDocument.create();
        for (let i = 1; i <= pdfjsDoc.numPages; i++) {
          const page = await pdfjsDoc.getPage(i);
          const vp = page.getViewport({ scale: 2 });
          const c = document.createElement("canvas");
          c.width = vp.width; c.height = vp.height;
          const ctx = c.getContext("2d")!;
          await page.render({ canvasContext: ctx, viewport: vp, canvas: c } as any).promise;
          for (const s of stamps) renderStamp(ctx, c.width, c.height, s);
          const jpegBuf = await fetch(c.toDataURL("image/jpeg", 0.92)).then(r => r.arrayBuffer());
          const img = await outPdf.embedJpg(jpegBuf);
          const p = outPdf.addPage([img.width / 2, img.height / 2]);
          p.drawImage(img, { x: 0, y: 0, width: img.width / 2, height: img.height / 2 });
        }
        const blob = new Blob([await outPdf.save()], { type: "application/pdf" });
        setResult(URL.createObjectURL(blob));
      } else {
        const img = imgRef.current!;
        const hidden = hiddenRef.current!;
        hidden.width = img.naturalWidth;
        hidden.height = img.naturalHeight;
        const ctx = hidden.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        for (const s of stamps) renderStamp(ctx, hidden.width, hidden.height, s);
        setResult(hidden.toDataURL("image/jpeg", 0.92));
      }
      await recordUsage();
    } catch (e: any) {
      setError(e?.message ?? "Failed to process.");
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!result || !file) return;
    const a = document.createElement("a");
    a.href = result;
    a.download = file.name.replace(/\.[^.]+$/, "") + "_stamped" + (fileType === "pdf" ? ".pdf" : ".jpg");
    a.click();
  }

  function reset() {
    setFile(null); setImgSrc(null); setResult(null); setError(null); setPdfBytes(null);
    const s = makeStamp(0.5, 0.3);
    setStamps([s]); setActiveId(s.id);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Strike IC Photocopy</h1>
      <p className="text-gray-500 mb-2">Add a purpose stamp to your IC photocopy to prevent misuse.</p>
      <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
        ⚠️ Processed <strong>100% in your browser</strong> — your file is never uploaded.
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
          <input type="file" accept="image/*,.pdf,application/pdf" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </label>
      ) : (
        <div className="space-y-4">
          {/* Canvas */}
          <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow bg-gray-100">
            <canvas
              ref={canvasRef}
              className={`w-full block ${!result ? "cursor-grab active:cursor-grabbing" : ""}`}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            />
            {!result && (
              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-lg">
                Click stamp to select · Drag to reposition
              </div>
            )}
            {result && (
              <div className="absolute top-2 right-2 bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded-lg">
                ✓ Stamp applied
              </div>
            )}
          </div>

          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

          {!result && (
            <>
              {/* Stamp tabs */}
              <div className="flex items-center gap-2 flex-wrap">
                {stamps.map((s, i) => (
                  <div key={s.id} className="flex items-center">
                    <button
                      onClick={() => setActiveId(s.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                        s.id === activeId
                          ? "bg-red-600 text-white border-red-600"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      Stamp {i + 1}
                    </button>
                    {stamps.length > 1 && (
                      <button
                        onClick={() => deleteStamp(s.id)}
                        className="ml-1 p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove this stamp"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addStamp}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border border-dashed border-gray-300 text-gray-500 hover:border-red-400 hover:text-red-600 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add stamp
                </button>
              </div>

              {/* Active stamp controls */}
              <div className="p-4 border border-gray-200 rounded-xl space-y-4">
                {/* Purpose */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Purpose</label>
                  <div className="space-y-2">
                    <select
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                      value={activeStamp.useCustom ? "__custom__" : activeStamp.purpose}
                      onChange={(e) => {
                        if (e.target.value === "__custom__") updateActive({ useCustom: true });
                        else updateActive({ useCustom: false, purpose: e.target.value });
                      }}
                    >
                      {PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}
                      <option value="__custom__">Custom...</option>
                    </select>
                    {activeStamp.useCustom && (
                      <input type="text" placeholder="e.g. For Maybank account opening only"
                        value={activeStamp.customPurpose}
                        onChange={(e) => updateActive({ customPurpose: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                    )}
                  </div>
                </div>

                {/* Colour + Angle */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Colour</label>
                    <div className="flex gap-2">
                      {(["red", "blue", "black"] as const).map((c) => (
                        <button key={c} onClick={() => updateActive({ color: c })}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${activeStamp.color === c ? "border-gray-900 bg-gray-100" : "border-gray-200 hover:bg-gray-50"}`}>
                          <span className={`w-2.5 h-2.5 rounded-full ${c === "red" ? "bg-red-600" : c === "blue" ? "bg-blue-700" : "bg-gray-900"}`} />
                          {c.charAt(0).toUpperCase() + c.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Angle: {activeStamp.angle}°
                    </label>
                    <input type="range" min="-60" max="60" value={activeStamp.angle}
                      onChange={(e) => updateActive({ angle: Number(e.target.value) })}
                      className="w-full accent-red-600" />
                  </div>
                </div>

                {/* Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Size: {Math.round(activeStamp.scale * 100)}%
                  </label>
                  <input type="range" min="30" max="200" value={Math.round(activeStamp.scale * 100)}
                    onChange={(e) => updateActive({ scale: Number(e.target.value) / 100 })}
                    className="w-full accent-red-600" />
                </div>
              </div>

              <button onClick={applyStamp} disabled={processing || limitReached}
                className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-60 transition-colors">
                {processing ? "Applying..." : `Apply ${stamps.length} Stamp${stamps.length > 1 ? "s" : ""}`}
              </button>
            </>
          )}

          {result && (
            <div className="flex gap-3">
              <button onClick={download}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors">
                <Download className="w-4 h-4" /> Download {fileType === "pdf" ? "PDF" : "Image"}
              </button>
              <button onClick={reset}
                className="flex items-center justify-center gap-2 px-5 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors">
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

      <canvas ref={hiddenRef} className="hidden" />
    </div>
  );
}
