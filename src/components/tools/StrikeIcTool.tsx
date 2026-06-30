"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, Download, RefreshCw, Plus, Trash2, Camera } from "lucide-react";
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

/** Returns true if canvas-pixel point (px, py) is inside the stamp's oriented bounding box */
function hitStamp(cfg: StampConfig, W: number, H: number, px: number, py: number): boolean {
  const baseFont = Math.round(Math.min(W, H) * 0.09 * cfg.scale);
  const cx = W * cfg.x;
  const cy = H * cfg.y;
  const rad = cfg.angle * (Math.PI / 180);
  // Rotate point into stamp's local frame
  const dx = (px - cx) * Math.cos(-rad) - (py - cy) * Math.sin(-rad);
  const dy = (px - cx) * Math.sin(-rad) + (py - cy) * Math.cos(-rad);
  // Generous hit box: ±3× font wide, ±1.4× font tall
  return Math.abs(dx) < baseFont * 3 && Math.abs(dy) < baseFont * 1.4;
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

let _nextId = 1;
function makeStamp(x = 0.5, y = 0.3): StampConfig {
  return {
    id: _nextId++,
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
  const [imgLoaded, setImgLoaded] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [stamps, setStamps] = useState<StampConfig[]>(() => [makeStamp(0.5, 0.3)]);
  const [activeId, setActiveId] = useState<number>(stamps[0].id);

  const stampIdRef = useRef(1);
  const draggingId = useRef<number | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  function newStamp(x = 0.5, y = 0.3): StampConfig {
    return { ...makeStamp(x, y), id: stampIdRef.current++ };
  }

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const activeStamp = stamps.find(s => s.id === activeId) ?? stamps[0];

  function updateActive(patch: Partial<StampConfig>) {
    setStamps(prev => prev.map(s => s.id === activeId ? { ...s, ...patch } : s));
  }

  // Size canvas then redraw — combined so sizing always happens before drawing
  useEffect(() => {
    if (!imgLoaded || !imgSrc || !canvasRef.current || !imgRef.current) return;
    const img = imgRef.current;
    const canvas = canvasRef.current;
    // Resize whenever image changes
    if (canvas.dataset.src !== imgSrc) {
      const maxW = Math.min(700, window.innerWidth - 64);
      canvas.width = maxW;
      canvas.height = Math.round(maxW * (img.naturalHeight / img.naturalWidth));
      canvas.dataset.src = imgSrc;
    }
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    for (const s of stamps) {
      renderStamp(ctx, canvas.width, canvas.height, s, s.id === activeId && !result);
    }
  });

  const loadImage = useCallback((src: string) => {
    setImgLoaded(false);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
    };
    img.src = src;
    setImgSrc(src);
  }, []);

  const handleFile = useCallback(async (f: File) => {
    setError(null); setResult(null); setImgLoaded(false);
    setFile(f);
    if (f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")) {
      setFileType("pdf");
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        const bytes = new Uint8Array(await f.arrayBuffer());
        setPdfBytes(bytes);
        const doc = await pdfjs.getDocument({ data: bytes.slice() }).promise;
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
    const px = relX * W, py = relY * H;
    // Reverse order: topmost stamp first
    for (let i = stamps.length - 1; i >= 0; i--) {
      if (hitStamp(stamps[i], W, H, px, py)) return stamps[i];
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
      draggingId.current = hit.id;
      dragOffset.current = { x: rx - hit.x, y: ry - hit.y };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (draggingId.current === null || result) return;
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const rx = (e.clientX - rect.left) / rect.width;
    const ry = (e.clientY - rect.top) / rect.height;
    setStamps(prev => prev.map(s => s.id === draggingId.current ? {
      ...s,
      x: Math.max(0.05, Math.min(0.95, rx - dragOffset.current.x)),
      y: Math.max(0.05, Math.min(0.95, ry - dragOffset.current.y)),
    } : s));
  }

  function onPointerUp() { draggingId.current = null; }

  function addStamp() {
    // Place new stamp in the lower half by default
    const lastY = stamps[stamps.length - 1]?.y ?? 0.3;
    const newY = lastY > 0.5 ? 0.3 : 0.7;
    const s = newStamp(0.5, newY);
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
        const pdfjsDoc = await pdfjs.getDocument({ data: pdfBytes.slice() }).promise;
        const outPdf = await PDFDocument.create();
        for (let i = 1; i <= pdfjsDoc.numPages; i++) {
          const page = await pdfjsDoc.getPage(i);
          const vp = page.getViewport({ scale: 2 });
          const c = document.createElement("canvas");
          c.width = vp.width; c.height = vp.height;
          const ctx = c.getContext("2d")!;
          await page.render({ canvasContext: ctx, viewport: vp, canvas: c } as any).promise;
          for (const s of stamps) renderStamp(ctx, c.width, c.height, s);
          // Use toBlob instead of fetch(dataUrl) to avoid CSP connect-src restriction
          const jpegBuf = await new Promise<ArrayBuffer>((res, rej) =>
            c.toBlob(b => b ? b.arrayBuffer().then(res).catch(rej) : rej(new Error("toBlob failed")), "image/jpeg", 0.92)
          );
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
      await recordUsage(file?.name, file?.size);
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
    const s = newStamp(0.5, 0.3);
    setStamps([s]); setActiveId(s.id);
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Strike IC</h1>
        <p className="text-gray-500 text-sm mt-1">Tampal tujuan pada IC untuk elak penyalahgunaan</p>
      </div>

      {status && !status.loggedIn && (
        <UsageLimitBanner used={status.used} limit={status.limit!} loggedIn={status.loggedIn} />
      )}

      {/* STEP 1 — Upload */}
      {!file ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        >
          {error && <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

          {/* Main upload zone */}
          <label className="flex flex-col items-center justify-center gap-3 p-10 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-red-400 hover:bg-red-50 transition-colors mb-3 bg-gray-50">
            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
              <Upload className="w-7 h-7 text-red-600" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-800">Upload gambar IC atau PDF</p>
              <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WEBP atau PDF</p>
            </div>
            <input type="file" accept="image/*,.pdf,application/pdf" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </label>

          {/* Camera button — prominent on mobile */}
          <label className="flex items-center justify-center gap-2 w-full py-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors bg-white">
            <Camera className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Ambil gambar dari kamera</span>
            <input type="file" accept="image/*" capture="environment" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </label>

          {/* Privacy note */}
          <p className="text-center text-xs text-gray-400 mt-4">🔒 Fail tidak diupload — diproses terus dalam browser</p>
        </div>

      ) : (
        <div className="space-y-4">

          {/* Canvas preview */}
          <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 shadow-sm">
            <canvas
              ref={canvasRef}
              className={`w-full block ${!result ? "cursor-grab active:cursor-grabbing touch-none" : ""}`}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            />
            {!result && (
              <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
                <span className="bg-black/50 text-white text-[11px] px-3 py-1 rounded-full">
                  Tekan &amp; seret stamp untuk ubah kedudukan
                </span>
              </div>
            )}
            {result && (
              <div className="absolute top-3 right-3 bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                ✓ Stamp berjaya diletakkan
              </div>
            )}
          </div>

          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

          {/* RESULT: Download */}
          {result ? (
            <div className="space-y-2">
              <button onClick={download}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors text-sm">
                <Download className="w-4 h-4" />
                Download {fileType === "pdf" ? "PDF" : "Gambar"}
              </button>
              <button onClick={reset}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                <RefreshCw className="w-4 h-4" /> Mula semula
              </button>
            </div>

          ) : (
            <>
              {/* Purpose selector */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">

                {/* Stamp tabs (only show if >1) */}
                {stamps.length > 1 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {stamps.map((s, i) => (
                      <div key={s.id} className="flex items-center gap-0.5">
                        <button onClick={() => setActiveId(s.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${s.id === activeId ? "bg-red-600 text-white border-red-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                          Stamp {i + 1}
                        </button>
                        <button onClick={() => deleteStamp(s.id)} className="p-1 text-gray-300 hover:text-red-500">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Purpose */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tujuan</label>
                  <select
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-400 bg-gray-50"
                    value={activeStamp.useCustom ? "__custom__" : activeStamp.purpose}
                    onChange={(e) => {
                      if (e.target.value === "__custom__") updateActive({ useCustom: true });
                      else updateActive({ useCustom: false, purpose: e.target.value });
                    }}
                  >
                    {PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}
                    <option value="__custom__">Lain-lain (taip sendiri)...</option>
                  </select>
                  {activeStamp.useCustom && (
                    <input type="text" placeholder="Contoh: Untuk pembukaan akaun Maybank sahaja"
                      value={activeStamp.customPurpose}
                      onChange={(e) => updateActive({ customPurpose: e.target.value })}
                      className="mt-2 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-gray-50" />
                  )}
                </div>

                {/* Colour */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Warna</label>
                  <div className="flex gap-2">
                    {([
                      { value: "red", label: "Merah", cls: "bg-red-600" },
                      { value: "blue", label: "Biru", cls: "bg-blue-700" },
                      { value: "black", label: "Hitam", cls: "bg-gray-900" },
                    ] as const).map((c) => (
                      <button key={c.value} onClick={() => updateActive({ color: c.value })}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-medium transition-all ${activeStamp.color === c.value ? "border-gray-900 bg-gray-100 shadow-sm" : "border-gray-200 hover:bg-gray-50"}`}>
                        <span className={`w-3 h-3 rounded-full ${c.cls}`} />
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size + Angle in one row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Saiz: {Math.round(activeStamp.scale * 100)}%
                    </label>
                    <input type="range" min="30" max="200" value={Math.round(activeStamp.scale * 100)}
                      onChange={(e) => updateActive({ scale: Number(e.target.value) / 100 })}
                      className="w-full accent-red-600" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Sudut: {activeStamp.angle}°
                    </label>
                    <input type="range" min="-60" max="60" value={activeStamp.angle}
                      onChange={(e) => updateActive({ angle: Number(e.target.value) })}
                      className="w-full accent-red-600" />
                  </div>
                </div>

                {/* Add stamp */}
                <button onClick={addStamp}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-gray-300 text-sm text-gray-500 hover:border-red-400 hover:text-red-600 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Tambah stamp lagi
                </button>
              </div>

              {/* Apply CTA */}
              <button onClick={applyStamp} disabled={processing || limitReached}
                className="w-full py-3.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-60 transition-colors text-sm">
                {processing ? "Sedang diproses..." : "✓ Letak Stamp & Download"}
              </button>

              <button onClick={reset} className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                Tukar fail
              </button>
            </>
          )}
        </div>
      )}

      <canvas ref={hiddenRef} className="hidden" />
    </div>
  );
}
