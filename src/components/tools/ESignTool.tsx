"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument } from "pdf-lib";
import { Download, Trash2, PenLine, ChevronLeft, ChevronRight, Check, Upload, ImagePlus } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface PlacedSignature {
  dataUrl: string;
  x: number; // as fraction of page width
  y: number; // as fraction of page height
  w: number;
  h: number;
  page: number;
}

export default function ESignTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale] = useState(1.4);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [signatures, setSignatures] = useState<PlacedSignature[]>([]);
  const [activeSignatureUrl, setActiveSignatureUrl] = useState<string | null>(null);
  const [penColor, setPenColor] = useState("#000000");
  const [signMode, setSignMode] = useState<"draw" | "upload">("draw");
  const [uploadedSig, setUploadedSig] = useState<string | null>(null);
  const [step, setStep] = useState<"draw" | "place">("draw");
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizing, setResizing] = useState<{ idx: number; corner: "se" | "sw" | "ne" | "nw"; startX: number; startY: number; origSig: PlacedSignature } | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);

  // Signature pad
  const padRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<File | null>(null);

  // Init signature pad
  useEffect(() => {
    const canvas = padRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [penColor]);

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    const canvas = padRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e, canvas);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    isDrawing.current = true;
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing.current) return;
    const canvas = padRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function stopDraw() { isDrawing.current = false; }

  function clearPad() {
    const canvas = padRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function useSignature() {
    const canvas = padRef.current!;
    setActiveSignatureUrl(canvas.toDataURL("image/png"));
    setStep("place");
  }

  function handleUploadSig(f: File | null) {
    if (!f || !f.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setUploadedSig(dataUrl);
    };
    reader.readAsDataURL(f);
  }

  function useUploadedSig() {
    if (!uploadedSig) return;
    setActiveSignatureUrl(uploadedSig);
    setStep("place");
  }

  // Load PDF
  const loadFile = useCallback(async (f: File | null) => {
    if (!f || f.type !== "application/pdf") return;
    setFile(f);
    setLoading(true);
    setSignatures([]);
    setStep("draw");
    setActiveSignatureUrl(null);
    try {
      fileRef.current = f;
      const bytes = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);

      const thumbs: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const vp = page.getViewport({ scale: 0.18 });
        const c = document.createElement("canvas");
        c.width = vp.width; c.height = vp.height;
        await page.render({ canvasContext: c.getContext("2d")! as any, viewport: vp, canvas: c }).promise;
        thumbs.push(c.toDataURL());
      }
      setThumbnails(thumbs);
    } finally {
      setLoading(false);
    }
  }, []);

  // Render PDF page
  useEffect(() => {
    if (!pdfDoc || !pdfCanvasRef.current) return;
    (async () => {
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale });
      const canvas = pdfCanvasRef.current!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext("2d")! as any, viewport, canvas }).promise;
    })();
  }, [pdfDoc, currentPage, scale]);

  // Place signature on click
  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!activeSignatureUrl || step !== "place" || dragging !== null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xFrac = (e.clientX - rect.left) / rect.width;
    const yFrac = (e.clientY - rect.top) / rect.height;
    setSignatures(prev => [...prev, {
      dataUrl: activeSignatureUrl,
      x: xFrac - 0.1,
      y: yFrac - 0.04,
      w: 0.2,
      h: 0.08,
      page: currentPage,
    }]);
  }

  // Drag signature
  function startDragSig(e: React.MouseEvent, idx: number) {
    e.stopPropagation();
    const overlay = overlayRef.current!;
    const rect = overlay.getBoundingClientRect();
    const sig = signatures[idx];
    setSelected(idx);
    setDragging(idx);
    setDragOffset({
      x: (e.clientX - rect.left) / rect.width - sig.x,
      y: (e.clientY - rect.top) / rect.height - sig.y,
    });
  }

  function startResize(e: React.MouseEvent, idx: number, corner: "se" | "sw" | "ne" | "nw") {
    e.stopPropagation();
    e.preventDefault();
    setResizing({ idx, corner, startX: e.clientX, startY: e.clientY, origSig: { ...signatures[idx] } });
  }

  function onOverlayMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (resizing !== null) {
      const overlay = overlayRef.current!;
      const rect = overlay.getBoundingClientRect();
      const dx = (e.clientX - resizing.startX) / rect.width;
      const dy = (e.clientY - resizing.startY) / rect.height;
      const orig = resizing.origSig;
      let { x, y, w, h } = orig;
      const MIN = 0.04;
      if (resizing.corner === "se") {
        w = Math.max(MIN, orig.w + dx);
        h = Math.max(MIN, orig.h + dy);
      } else if (resizing.corner === "sw") {
        w = Math.max(MIN, orig.w - dx);
        h = Math.max(MIN, orig.h + dy);
        x = orig.x + orig.w - w;
      } else if (resizing.corner === "ne") {
        w = Math.max(MIN, orig.w + dx);
        h = Math.max(MIN, orig.h - dy);
        y = orig.y + orig.h - h;
      } else {
        w = Math.max(MIN, orig.w - dx);
        h = Math.max(MIN, orig.h - dy);
        x = orig.x + orig.w - w;
        y = orig.y + orig.h - h;
      }
      setSignatures(prev => prev.map((s, i) => i === resizing.idx ? { ...s, x, y, w, h } : s));
      return;
    }
    if (dragging === null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - dragOffset.x;
    const y = (e.clientY - rect.top) / rect.height - dragOffset.y;
    setSignatures(prev => prev.map((s, i) => i === dragging ? { ...s, x, y } : s));
  }

  function stopInteraction() {
    setDragging(null);
    setResizing(null);
  }

  function removeSig(idx: number) {
    setSignatures(prev => prev.filter((_, i) => i !== idx));
  }

  // Save PDF
  async function savePdf() {
    if (!fileRef.current) { setSaveError("No file loaded. Please reopen the PDF."); return; }
    setSaving(true);
    setSaveError(null);
    try {
      const freshBytes = await fileRef.current.arrayBuffer();
      const pdfLibDoc = await PDFDocument.load(freshBytes);

      function dataUrlToBytes(dataUrl: string): Uint8Array {
        const base64 = dataUrl.split(",")[1];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
      }

      for (const sig of signatures) {
        const page = pdfLibDoc.getPage(sig.page - 1);
        const { width, height } = page.getSize();

        const imgBytes = dataUrlToBytes(sig.dataUrl);
        const isJpeg = sig.dataUrl.startsWith("data:image/jpeg") || sig.dataUrl.startsWith("data:image/jpg");
        const img = isJpeg
          ? await pdfLibDoc.embedJpg(imgBytes)
          : await pdfLibDoc.embedPng(imgBytes);

        const sigW = sig.w * width;
        const sigH = sig.h * height;
        const sigX = sig.x * width;
        const sigY = height - (sig.y * height) - sigH;

        page.drawImage(img, { x: sigX, y: sigY, width: sigW, height: sigH });
      }

      const bytes = await pdfLibDoc.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `signed-${file!.name}`; a.click();
    } catch (e: any) {
      setSaveError(e?.message ?? "Failed to save PDF.");
    } finally {
      setSaving(false);
    }
  }

  if (!file) {
    return (
      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-12 cursor-pointer hover:border-red-300 hover:bg-red-50 transition-colors">
        <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center mb-4">
          <PenLine className="w-7 h-7 text-red-600" />
        </div>
        <span className="font-semibold text-gray-800 text-lg">Open a PDF file to sign</span>
        <span className="text-sm text-gray-400 mt-1">Click or drag a PDF file here</span>
        <input type="file" accept="application/pdf" className="hidden" onChange={(e) => loadFile(e.target.files?.[0] ?? null)} />
      </label>
    );
  }


  return (
    <div className="flex flex-col gap-4">
      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium", step === "draw" ? "bg-red-600 text-white" : "bg-green-100 text-green-700")}>
          {step !== "draw" && <Check className="w-3.5 h-3.5" />}
          <span>1. Draw Signature</span>
        </div>
        <div className="h-px w-6 bg-gray-300" />
        <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium", step === "place" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-500")}>
          <span>2. Place on PDF</span>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Left: Signature pad or instructions */}
        <div className="w-72 flex-shrink-0 space-y-3">
          {step === "draw" ? (
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              {/* Mode tabs */}
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setSignMode("draw")}
                  className={cn("flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors", signMode === "draw" ? "bg-red-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50")}
                >
                  <PenLine className="w-3.5 h-3.5" /> Draw
                </button>
                <button
                  onClick={() => setSignMode("upload")}
                  className={cn("flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors", signMode === "upload" ? "bg-red-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50")}
                >
                  <ImagePlus className="w-3.5 h-3.5" /> Upload Image
                </button>
              </div>

              {signMode === "draw" ? (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-medium text-gray-600">Draw your signature</h3>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500">Color</label>
                      <input type="color" value={penColor} onChange={(e) => setPenColor(e.target.value)} className="w-6 h-6 rounded border border-gray-200 cursor-pointer" />
                    </div>
                  </div>
                  <canvas
                    ref={padRef}
                    width={400}
                    height={160}
                    className="w-full border-2 border-dashed border-gray-200 rounded-lg bg-white touch-none cursor-crosshair"
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={stopDraw}
                    onMouseLeave={stopDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={stopDraw}
                  />
                  <div className="flex gap-2">
                    <button onClick={clearPad} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-1.5 text-gray-600">
                      <Trash2 className="w-3.5 h-3.5" /> Clear
                    </button>
                    <button onClick={useSignature} className="flex-1 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-1.5 font-medium">
                      <Check className="w-3.5 h-3.5" /> Use
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs text-gray-500">Upload your signature image (PNG, JPG). White or transparent background.</p>
                  {uploadedSig ? (
                    <div className="space-y-2">
                      <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 p-2">
                        <img src={uploadedSig} alt="Uploaded signature" className="w-full object-contain max-h-28" />
                      </div>
                      <div className="flex gap-2">
                        <label className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-1.5 text-gray-600 cursor-pointer">
                          <Upload className="w-3.5 h-3.5" /> Change
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadSig(e.target.files?.[0] ?? null)} />
                        </label>
                        <button onClick={useUploadedSig} className="flex-1 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-1.5 font-medium">
                          <Check className="w-3.5 h-3.5" /> Use
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg p-6 cursor-pointer hover:border-red-300 hover:bg-red-50 transition-colors">
                      <Upload className="w-7 h-7 text-gray-300 mb-2" />
                      <span className="text-sm text-gray-500">Click to upload signature image</span>
                      <span className="text-xs text-gray-400 mt-0.5">PNG, JPG, SVG</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadSig(e.target.files?.[0] ?? null)} />
                    </label>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-800">Your signature</h3>
              {activeSignatureUrl && (
                <img src={activeSignatureUrl} alt="Signature" className="w-full border border-gray-100 rounded-lg bg-white" />
              )}
              <button onClick={() => setStep("draw")} className="w-full py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
                {signMode === "upload" ? "Upload again" : "Draw again"}
              </button>
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
                Click anywhere on the PDF to place the signature. Drag to move it.
              </div>

              {/* Placed signatures list */}
              {signatures.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-gray-600">{signatures.length} signature(s) placed:</p>
                  {signatures.map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-gray-50 px-2 py-1.5 rounded-lg">
                      <span className="text-gray-600">Page {s.page}</span>
                      <button onClick={() => removeSig(i)} className="text-red-500 hover:text-red-700"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              )}

              {saveError && (
                <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">{saveError}</div>
              )}
              {signatures.length > 0 && (
                <button
                  onClick={savePdf}
                  disabled={saving}
                  className="w-full py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Signed PDF"}
                </button>
              )}
            </div>
          )}

          {/* Thumbnails */}
          <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
            <p className="text-xs font-medium text-gray-600">Pages</p>
            <div className="flex flex-wrap gap-2">
              {thumbnails.map((thumb, i) => (
                <button key={i} onClick={() => setCurrentPage(i + 1)} className={cn("relative rounded overflow-hidden border-2 transition-all", currentPage === i + 1 ? "border-red-500" : "border-transparent hover:border-gray-300")}>
                  <img src={thumb} alt={`Page ${i + 1}`} className="w-16" />
                  {signatures.filter(s => s.page === i + 1).length > 0 && (
                    <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold">
                      {signatures.filter(s => s.page === i + 1).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: PDF viewer with overlay */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm text-gray-600">Page {currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-gray-400">{file.name} · {formatBytes(file.size)}</p>
          </div>

          <div className="overflow-auto bg-gray-200 rounded-xl p-4 flex-1 relative">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-200/80 rounded-xl">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Loading PDF...</p>
                </div>
              </div>
            )}
            <div
              ref={overlayRef}
              className={cn("relative inline-block shadow-lg mx-auto select-none", step === "place" && "cursor-copy")}
              onClick={(e) => { handleOverlayClick(e); setSelected(null); }}
              onMouseMove={onOverlayMouseMove}
              onMouseUp={stopInteraction}
              onMouseLeave={stopInteraction}
            >
              <canvas ref={pdfCanvasRef} className="block" />
              {/* Placed signatures on current page */}
              {signatures.map((s, globalIdx) => {
                if (s.page !== currentPage) return null;
                const isSel = selected === globalIdx;
                return (
                  <div
                    key={globalIdx}
                    className="absolute"
                    style={{
                      left: `${s.x * 100}%`,
                      top: `${s.y * 100}%`,
                      width: `${s.w * 100}%`,
                      height: `${s.h * 100}%`,
                    }}
                    onMouseDown={(e) => { e.stopPropagation(); startDragSig(e, globalIdx); }}
                    onClick={(e) => { e.stopPropagation(); setSelected(globalIdx); }}
                  >
                    <img src={s.dataUrl} alt="sig" draggable={false} className="w-full h-full cursor-move" style={{ userSelect: "none" }} />
                    {/* Selection border + resize handles */}
                    {isSel && (
                      <>
                        <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none rounded-sm" />
                        {(["nw","ne","sw","se"] as const).map(corner => (
                          <div
                            key={corner}
                            className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-sm z-10"
                            style={{
                              top: corner.startsWith("n") ? -6 : undefined,
                              bottom: corner.startsWith("s") ? -6 : undefined,
                              left: corner.endsWith("w") ? -6 : undefined,
                              right: corner.endsWith("e") ? -6 : undefined,
                              cursor: `${corner}-resize`,
                            }}
                            onMouseDown={(e) => startResize(e, globalIdx, corner)}
                          />
                        ))}
                        {/* Delete button */}
                        <button
                          className="absolute -top-5 -right-5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center z-10 hover:bg-red-600"
                          onClick={(e) => { e.stopPropagation(); removeSig(globalIdx); setSelected(null); }}
                        >×</button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
