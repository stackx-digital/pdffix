"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument } from "pdf-lib";
import {
  Type, Pen, Highlighter, ImageIcon, Eraser, Download,
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Undo,
  MousePointer, Minus, Square, Upload,
} from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

type ToolType = "select" | "text" | "draw" | "highlight" | "line" | "rect" | "eraser";

export default function PdfEditorTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.4);
  const [activeTool, setActiveTool] = useState<ToolType>("select");
  const [color, setColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(16);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [error, setError] = useState("");

  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const fabricContainerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<any>(null);
  const fileBytes = useRef<ArrayBuffer | null>(null);
  const pageStates = useRef<Record<number, string>>({});

  // Refs for use inside fabric event handlers (avoid stale closures)
  const activeToolRef = useRef<ToolType>("select");
  const colorRef = useRef("#000000");
  const fontSizeRef = useRef(16);
  activeToolRef.current = activeTool;
  colorRef.current = color;
  fontSizeRef.current = fontSize;

  const loadFile = useCallback(async (f: File | null) => {
    if (!f || f.type !== "application/pdf") return;
    setError("");
    setLoading(true);
    setFile(f);
    setPdfDoc(null);
    setThumbnails([]);
    setCurrentPage(1);
    setTotalPages(0);
    pageStates.current = {};

    try {
      const bytes = await f.arrayBuffer();
      fileBytes.current = bytes.slice(0);
      const pdf = await pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;

      // Generate thumbnails
      const thumbs: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const vp = page.getViewport({ scale: 0.15 });
        const c = document.createElement("canvas");
        c.width = vp.width;
        c.height = vp.height;
        await page.render({ canvasContext: c.getContext("2d")! as any, viewport: vp, canvas: c }).promise;
        thumbs.push(c.toDataURL());
      }

      setThumbnails(thumbs);
      setTotalPages(pdf.numPages);
      // IMPORTANT: set loading=false first so canvases are mounted,
      // then set pdfDoc to trigger the render useEffect
      setLoading(false);
      setPdfDoc(pdf);
    } catch (e) {
      console.error("PDF load error:", e);
      setError("Gagal memuatkan PDF. Sila cuba fail lain.");
      setFile(null);
      setLoading(false);
    }
  }, []);

  // Render PDF page onto canvas + re-init Fabric overlay
  useEffect(() => {
    if (!pdfDoc) return;

    let cancelled = false;

    async function init() {
      // Wait one tick so React has painted the canvases into the DOM
      await new Promise(r => setTimeout(r, 0));
      if (cancelled) return;

      const pdfCanvas = pdfCanvasRef.current;
      const fabricContainer = fabricContainerRef.current;
      if (!pdfCanvas || !fabricContainer) return;

      try {
        const page = await pdfDoc!.getPage(currentPage);
        const viewport = page.getViewport({ scale });
        if (cancelled) return;

        // Render PDF to background canvas
        pdfCanvas.width = viewport.width;
        pdfCanvas.height = viewport.height;
        await page.render({
          canvasContext: pdfCanvas.getContext("2d")! as any,
          viewport,
          canvas: pdfCanvas,
        }).promise;
        if (cancelled) return;

        // Save old fabric state, then dispose
        if (fabricRef.current) {
          try {
            pageStates.current[currentPage] = JSON.stringify(fabricRef.current.toJSON());
            fabricRef.current.dispose();
          } catch {}
          fabricRef.current = null;
        }

        // Create a fresh canvas element inside the container div
        fabricContainer.innerHTML = "";
        const newCanvas = document.createElement("canvas");
        fabricContainer.appendChild(newCanvas);

        const { fabric } = await import("fabric");
        if (cancelled) return;

        const fabricCanvas = new fabric.Canvas(newCanvas, {
          width: viewport.width,
          height: viewport.height,
          isDrawingMode: false,
          selection: true,
          backgroundColor: "transparent",
        });
        fabricRef.current = fabricCanvas;

        // Restore saved annotations for this page
        if (pageStates.current[currentPage]) {
          await new Promise<void>((res) => {
            fabricCanvas.loadFromJSON(JSON.parse(pageStates.current[currentPage]), () => {
              fabricCanvas.renderAll();
              res();
            });
          });
        }

        applyTool(fabricCanvas, activeToolRef.current, colorRef.current, fontSizeRef.current);

        fabricCanvas.on("mouse:down", async (opt: any) => {
          if (activeToolRef.current !== "text") return;
          const pointer = fabricCanvas.getPointer(opt.e);
          const { fabric: f2 } = await import("fabric");
          const t = new f2.IText("Teks di sini", {
            left: pointer.x,
            top: pointer.y,
            fontSize: fontSizeRef.current,
            fill: colorRef.current,
            fontFamily: "Arial",
          });
          fabricCanvas.add(t);
          fabricCanvas.setActiveObject(t);
          t.enterEditing();
          t.selectAll();
          fabricCanvas.renderAll();
        });
      } catch (e) {
        console.error("Canvas init error:", e);
      }
    }

    init();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfDoc, currentPage, scale]);

  // Sync active tool/color/size to existing fabric canvas
  useEffect(() => {
    if (fabricRef.current) {
      applyTool(fabricRef.current, activeTool, color, fontSize);
    }
  }, [activeTool, color, fontSize]);

  function applyTool(fc: any, tool: ToolType, col: string, fsize: number) {
    fc.isDrawingMode = false;
    fc.selection = tool === "select";

    if (tool === "draw") {
      fc.isDrawingMode = true;
      fc.freeDrawingBrush.color = col;
      fc.freeDrawingBrush.width = 3;
    } else if (tool === "highlight") {
      fc.isDrawingMode = true;
      fc.freeDrawingBrush.color = "#FFFF0080";
      fc.freeDrawingBrush.width = 20;
    } else if (tool === "eraser") {
      fc.isDrawingMode = true;
      fc.freeDrawingBrush.color = "#ffffff";
      fc.freeDrawingBrush.width = 24;
    }
    fc.renderAll();
  }

  async function addShape(type: "line" | "rect") {
    if (!fabricRef.current) return;
    const { fabric } = await import("fabric");
    const fc = fabricRef.current;
    const cx = fc.width / 2;
    const cy = fc.height / 2;
    if (type === "rect") {
      fc.add(new fabric.Rect({ left: cx - 70, top: cy - 40, width: 140, height: 80, fill: "transparent", stroke: color, strokeWidth: 2 }));
    } else {
      fc.add(new fabric.Line([cx - 80, cy, cx + 80, cy], { stroke: color, strokeWidth: 2 }));
    }
    fc.renderAll();
    setActiveTool("select");
  }

  async function addImage(f: File) {
    if (!fabricRef.current) return;
    const { fabric } = await import("fabric");
    const url = URL.createObjectURL(f);
    fabric.Image.fromURL(url, (img: any) => {
      img.scaleToWidth(Math.min(180, fabricRef.current.width * 0.4));
      fabricRef.current.add(img);
      fabricRef.current.setActiveObject(img);
      fabricRef.current.renderAll();
      setActiveTool("select");
    });
  }

  function undo() {
    const fc = fabricRef.current;
    if (!fc) return;
    const objs = fc.getObjects();
    if (objs.length > 0) { fc.remove(objs[objs.length - 1]); fc.renderAll(); }
  }

  function changePage(newPage: number) {
    const clamped = Math.max(1, Math.min(totalPages, newPage));
    if (clamped === currentPage) return;
    if (fabricRef.current) {
      pageStates.current[currentPage] = JSON.stringify(fabricRef.current.toJSON());
    }
    setCurrentPage(clamped);
  }

  async function savePdf() {
    if (!fileBytes.current || !pdfDoc) return;
    if (fabricRef.current) {
      pageStates.current[currentPage] = JSON.stringify(fabricRef.current.toJSON());
    }

    setSaving(true);
    try {
      const pdfLibDoc = await PDFDocument.load(fileBytes.current);
      const { fabric } = await import("fabric");

      for (const [pageNumStr, stateJson] of Object.entries(pageStates.current)) {
        const pageNum = Number(pageNumStr);
        const state = JSON.parse(stateJson);
        if (!state.objects || state.objects.length === 0) continue;

        const pdfPage = await pdfDoc.getPage(pageNum);
        const viewport = pdfPage.getViewport({ scale });

        const tempEl = document.createElement("canvas");
        tempEl.width = viewport.width;
        tempEl.height = viewport.height;
        const tempFc = new fabric.StaticCanvas(tempEl, { width: viewport.width, height: viewport.height });

        await new Promise<void>((res) => {
          tempFc.loadFromJSON(state, () => { tempFc.renderAll(); res(); });
        });

        const imgData = tempEl.toDataURL("image/png");
        const imgBytes = await fetch(imgData).then(r => r.arrayBuffer());
        const embImg = await pdfLibDoc.embedPng(imgBytes);
        const libPage = pdfLibDoc.getPage(pageNum - 1);
        const { width, height } = libPage.getSize();
        libPage.drawImage(embImg, { x: 0, y: 0, width, height });
        tempFc.dispose();
      }

      const saved = await pdfLibDoc.save();
      const blob = new Blob([saved], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `edited-${file!.name}`;
      a.click();
    } finally {
      setSaving(false);
    }
  }

  const TOOLS: { id: ToolType; icon: React.ReactNode; label: string }[] = [
    { id: "select", icon: <MousePointer className="w-4 h-4" />, label: "Pilih" },
    { id: "text", icon: <Type className="w-4 h-4" />, label: "Teks" },
    { id: "draw", icon: <Pen className="w-4 h-4" />, label: "Lukis" },
    { id: "highlight", icon: <Highlighter className="w-4 h-4" />, label: "Highlight" },
    { id: "eraser", icon: <Eraser className="w-4 h-4" />, label: "Pemadam" },
  ];

  // ── DROPZONE ──
  if (!file) {
    return (
      <label
        className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-16 cursor-pointer hover:border-red-300 hover:bg-red-50 transition-colors"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); loadFile(e.dataTransfer.files?.[0] ?? null); }}
      >
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
          <Upload className="w-8 h-8 text-red-500" />
        </div>
        <p className="font-semibold text-gray-800 text-lg">Buka fail PDF untuk diedit</p>
        <p className="text-sm text-gray-400 mt-1">Klik atau seret fail PDF ke sini</p>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <input type="file" accept="application/pdf" className="hidden" onChange={(e) => loadFile(e.target.files?.[0] ?? null)} />
      </label>
    );
  }

  // ── EDITOR ──
  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-xl flex-wrap">
        <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
          {TOOLS.map((t) => (
            <button key={t.id} onClick={() => setActiveTool(t.id)} title={t.label}
              className={cn("flex flex-col items-center gap-0.5 p-2 rounded-lg transition-colors text-xs",
                activeTool === t.id ? "bg-red-600 text-white" : "text-gray-600 hover:bg-gray-100")}>
              {t.icon}
              <span className="text-[10px] leading-none">{t.label}</span>
            </button>
          ))}
          <button onClick={() => addShape("line")} title="Garisan" className="flex flex-col items-center gap-0.5 p-2 rounded-lg text-gray-600 hover:bg-gray-100">
            <Minus className="w-4 h-4" /><span className="text-[10px]">Garisan</span>
          </button>
          <button onClick={() => addShape("rect")} title="Kotak" className="flex flex-col items-center gap-0.5 p-2 rounded-lg text-gray-600 hover:bg-gray-100">
            <Square className="w-4 h-4" /><span className="text-[10px]">Kotak</span>
          </button>
          <label title="Imej" className="flex flex-col items-center gap-0.5 p-2 rounded-lg text-gray-600 hover:bg-gray-100 cursor-pointer">
            <ImageIcon className="w-4 h-4" /><span className="text-[10px]">Imej</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && addImage(e.target.files[0])} />
          </label>
        </div>

        <div className="flex items-center gap-3 border-r border-gray-200 pr-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">Warna</span>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer border border-gray-200" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">Saiz</span>
            <select value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="text-xs border border-gray-200 rounded px-1.5 py-1">
              {[10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
          <button onClick={undo} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100" title="Undo"><Undo className="w-4 h-4" /></button>
          <button onClick={() => setScale(s => Math.max(0.5, +(s - 0.25).toFixed(2)))} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"><ZoomOut className="w-4 h-4" /></button>
          <span className="text-xs text-gray-500 w-10 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(s => Math.min(3, +(s + 0.25).toFixed(2)))} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"><ZoomIn className="w-4 h-4" /></button>
        </div>

        <span className="text-xs text-gray-400 hidden md:block">{file.name} · {formatBytes(file.size)}</span>
        <button onClick={() => { setFile(null); setPdfDoc(null); }} className="text-xs text-gray-400 hover:text-red-500 ml-1">Tukar fail</button>
        <button onClick={savePdf} disabled={saving || !pdfDoc}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
          <Download className="w-4 h-4" />
          {saving ? "Menyimpan..." : "Simpan PDF"}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Memuatkan PDF...</p>
        </div>
      )}

      {/* Editor body */}
      {!loading && (
        <div className="flex gap-3">
          {/* Thumbnail sidebar */}
          {thumbnails.length > 1 && (
            <div className="w-24 flex-shrink-0 overflow-y-auto max-h-[75vh] space-y-2 bg-gray-50 rounded-xl p-2 border border-gray-200">
              {thumbnails.map((thumb, i) => (
                <button key={i} onClick={() => changePage(i + 1)}
                  className={cn("w-full rounded-lg overflow-hidden border-2 transition-all",
                    currentPage === i + 1 ? "border-red-500" : "border-transparent hover:border-gray-300")}>
                  <img src={thumb} alt={`Halaman ${i + 1}`} className="w-full" />
                  <p className="text-center text-[10px] py-0.5 text-gray-500">{i + 1}</p>
                </button>
              ))}
            </div>
          )}

          {/* Canvas area */}
          <div className="flex-1 flex flex-col gap-2">
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => changePage(currentPage - 1)} disabled={currentPage <= 1} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600 font-medium">Halaman {currentPage} / {totalPages}</span>
                <button onClick={() => changePage(currentPage + 1)} disabled={currentPage >= totalPages} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="overflow-auto bg-gray-300 rounded-xl p-4 flex justify-center min-h-[60vh]">
              {/* Canvas stack: PDF background + Fabric overlay */}
              <div className="relative shadow-xl inline-block">
                <canvas ref={pdfCanvasRef} className="block" />
                {/* Fabric mounts a fresh canvas inside this div each page */}
                <div
                  ref={fabricContainerRef}
                  className="absolute top-0 left-0"
                  style={{
                    cursor:
                      activeTool === "text" ? "text"
                      : activeTool === "draw" || activeTool === "highlight" || activeTool === "eraser" ? "crosshair"
                      : "default",
                  }}
                />
              </div>
            </div>

            <p className="text-xs text-center text-gray-400">
              {activeTool === "text" && "Klik pada PDF untuk tambah teks"}
              {activeTool === "draw" && "Tahan dan lukis pada PDF"}
              {activeTool === "highlight" && "Tahan dan seret untuk highlight"}
              {activeTool === "eraser" && "Tahan dan seret untuk padam annotation"}
              {activeTool === "select" && "Klik objek untuk pilih, drag untuk alih"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
