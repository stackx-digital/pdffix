"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument } from "pdf-lib";
import {
  Type, Pen, Highlighter, ImageIcon, Eraser, Download,
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Undo, Redo,
  MousePointer, Minus, Square, Upload, PanelLeft,
} from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

type ToolType = "select" | "text" | "draw" | "highlight" | "line" | "rect" | "eraser" | "image";

interface HistoryEntry { page: number; json: string; }

export default function PdfEditorTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.3);
  const [activeTool, setActiveTool] = useState<ToolType>("select");
  const [color, setColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(18);
  const [fontFamily, setFontFamily] = useState("Arial");
  const [saving, setSaving] = useState(false);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loadingPdf, setLoadingPdf] = useState(false);

  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const fabricContainerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<any>(null);
  const fileBytes = useRef<ArrayBuffer | null>(null);
  const pageStates = useRef<Record<number, string>>({});

  const activeToolRef = useRef<ToolType>("select");
  const colorRef = useRef("#000000");
  const fontSizeRef = useRef(18);
  const fontFamilyRef = useRef("Arial");
  activeToolRef.current = activeTool;
  colorRef.current = color;
  fontSizeRef.current = fontSize;
  fontFamilyRef.current = fontFamily;

  const loadFile = useCallback(async (f: File | null) => {
    if (!f || f.type !== "application/pdf") return;
    setError("");
    setLoadingPdf(true);
    setFile(f);
    setPdfDoc(null);
    setThumbnails([]);
    setCurrentPage(1);
    setTotalPages(0);
    setHistory([]);
    pageStates.current = {};

    try {
      const bytes = await f.arrayBuffer();
      fileBytes.current = bytes.slice(0);
      const pdf = await pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;

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
      setTotalPages(pdf.numPages);
      setLoadingPdf(false);
      setPdfDoc(pdf);
    } catch (e) {
      console.error("PDF load error:", e);
      setError("Gagal memuatkan PDF. Sila cuba fail lain.");
      setFile(null);
      setLoadingPdf(false);
    }
  }, []);

  useEffect(() => {
    if (!pdfDoc) return;
    let cancelled = false;

    async function init() {
      await new Promise(r => setTimeout(r, 0));
      if (cancelled) return;

      const pdfCanvas = pdfCanvasRef.current;
      const fabricContainer = fabricContainerRef.current;
      if (!pdfCanvas || !fabricContainer) return;

      try {
        const page = await pdfDoc!.getPage(currentPage);
        const viewport = page.getViewport({ scale });
        if (cancelled) return;

        pdfCanvas.width = viewport.width;
        pdfCanvas.height = viewport.height;
        await page.render({
          canvasContext: pdfCanvas.getContext("2d")! as any,
          viewport,
          canvas: pdfCanvas,
        }).promise;
        if (cancelled) return;

        if (fabricRef.current) {
          try {
            pageStates.current[currentPage] = JSON.stringify(fabricRef.current.toJSON());
            fabricRef.current.dispose();
          } catch {}
          fabricRef.current = null;
        }

        fabricContainer.innerHTML = "";
        const newCanvas = document.createElement("canvas");
        fabricContainer.appendChild(newCanvas);

        const { fabric } = await import("fabric");
        if (cancelled) return;

        const fc = new fabric.Canvas(newCanvas, {
          width: viewport.width,
          height: viewport.height,
          isDrawingMode: false,
          selection: true,
          backgroundColor: "transparent",
        });
        fabricRef.current = fc;

        if (pageStates.current[currentPage]) {
          await new Promise<void>((res) => {
            fc.loadFromJSON(JSON.parse(pageStates.current[currentPage]), () => { fc.renderAll(); res(); });
          });
        }

        applyTool(fc, activeToolRef.current, colorRef.current, fontSizeRef.current);

        fc.on("mouse:down", async (opt: any) => {
          if (activeToolRef.current !== "text") return;
          const pointer = fc.getPointer(opt.e);
          const { fabric: f2 } = await import("fabric");
          const t = new f2.IText("Teks", {
            left: pointer.x, top: pointer.y,
            fontSize: fontSizeRef.current,
            fill: colorRef.current,
            fontFamily: fontFamilyRef.current,
          });
          fc.add(t);
          fc.setActiveObject(t);
          t.enterEditing();
          t.selectAll();
          fc.renderAll();
        });

        fc.on("object:added", () => {
          setHistory(h => [...h, { page: currentPage, json: JSON.stringify(fc.toJSON()) }]);
        });
      } catch (e) {
        console.error("Canvas init error:", e);
      }
    }

    init();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfDoc, currentPage, scale]);

  useEffect(() => {
    if (fabricRef.current) applyTool(fabricRef.current, activeTool, color, fontSize);
  }, [activeTool, color, fontSize]);

  function applyTool(fc: any, tool: ToolType, col: string, fsize: number) {
    fc.isDrawingMode = false;
    fc.selection = tool === "select";
    if (tool === "draw") {
      fc.isDrawingMode = true;
      fc.freeDrawingBrush.color = col;
      fc.freeDrawingBrush.width = 2;
    } else if (tool === "highlight") {
      fc.isDrawingMode = true;
      fc.freeDrawingBrush.color = "#FFFF0066";
      fc.freeDrawingBrush.width = 22;
    } else if (tool === "eraser") {
      fc.isDrawingMode = true;
      fc.freeDrawingBrush.color = "#ffffff";
      fc.freeDrawingBrush.width = 20;
    }
    fc.renderAll();
  }

  async function addShape(type: "line" | "rect") {
    if (!fabricRef.current) return;
    const { fabric } = await import("fabric");
    const fc = fabricRef.current;
    const cx = fc.width / 2, cy = fc.height / 2;
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
    fabric.Image.fromURL(URL.createObjectURL(f), (img: any) => {
      img.scaleToWidth(Math.min(200, fabricRef.current.width * 0.4));
      fabricRef.current.add(img);
      fabricRef.current.setActiveObject(img);
      fabricRef.current.renderAll();
      setActiveTool("select");
    });
  }

  function undo() {
    if (history.length === 0 || !fabricRef.current) return;
    const newHistory = history.slice(0, -1);
    setHistory(newHistory);
    const prev = newHistory[newHistory.length - 1];
    if (prev && prev.page === currentPage) {
      fabricRef.current.loadFromJSON(JSON.parse(prev.json), () => fabricRef.current.renderAll());
    } else {
      const objs = fabricRef.current.getObjects();
      if (objs.length > 0) { fabricRef.current.remove(objs[objs.length - 1]); fabricRef.current.renderAll(); }
    }
  }

  function changePage(newPage: number) {
    const p = Math.max(1, Math.min(totalPages, newPage));
    if (p === currentPage) return;
    if (fabricRef.current) pageStates.current[currentPage] = JSON.stringify(fabricRef.current.toJSON());
    setCurrentPage(p);
  }

  async function savePdf() {
    if (!fileBytes.current || !pdfDoc) return;
    if (fabricRef.current) pageStates.current[currentPage] = JSON.stringify(fabricRef.current.toJSON());
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
        tempEl.width = viewport.width; tempEl.height = viewport.height;
        const tempFc = new fabric.StaticCanvas(tempEl, { width: viewport.width, height: viewport.height });
        await new Promise<void>((res) => { tempFc.loadFromJSON(state, () => { tempFc.renderAll(); res(); }); });

        const imgBytes = await fetch(tempEl.toDataURL("image/png")).then(r => r.arrayBuffer());
        const embImg = await pdfLibDoc.embedPng(imgBytes);
        const libPage = pdfLibDoc.getPage(pageNum - 1);
        const { width, height } = libPage.getSize();
        libPage.drawImage(embImg, { x: 0, y: 0, width, height });
        tempFc.dispose();
      }

      const blob = new Blob([await pdfLibDoc.save()], { type: "application/pdf" });
      const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `edited-${file!.name}` });
      a.click();
    } finally {
      setSaving(false);
    }
  }

  const FONTS = ["Arial", "Times New Roman", "Courier New", "Georgia", "Verdana"];

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

  const toolBtn = (id: ToolType, icon: React.ReactNode, label: string) => (
    <button
      key={id} onClick={() => setActiveTool(id)} title={label}
      className={cn(
        "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all text-xs font-medium",
        activeTool === id
          ? "bg-red-50 text-red-600 border border-red-200"
          : "text-gray-600 hover:bg-gray-100 border border-transparent"
      )}
    >
      {icon}
      <span className="text-[10px] leading-none mt-0.5">{label}</span>
    </button>
  );

  // ── EDITOR ──
  return (
    <div className="flex flex-col h-full bg-gray-100 rounded-xl overflow-hidden border border-gray-200">

      {/* ── Top toolbar row 1: main tools ── */}
      <div className="flex items-center gap-1 px-3 py-1.5 bg-white border-b border-gray-200 flex-wrap">
        {/* Sidebar toggle */}
        <button onClick={() => setSidebarOpen(o => !o)} title="Panel halaman"
          className={cn("p-2 rounded-lg border transition-all", sidebarOpen ? "bg-red-50 border-red-200 text-red-600" : "border-transparent text-gray-500 hover:bg-gray-100")}>
          <PanelLeft className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Undo / Redo */}
        <button onClick={undo} disabled={history.length === 0} title="Undo" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30"><Undo className="w-4 h-4" /></button>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {toolBtn("select", <MousePointer className="w-4 h-4" />, "Pilih")}
        {toolBtn("text", <Type className="w-4 h-4" />, "Teks")}
        {toolBtn("draw", <Pen className="w-4 h-4" />, "Lukis")}
        {toolBtn("highlight", <Highlighter className="w-4 h-4" />, "Highlight")}
        {toolBtn("eraser", <Eraser className="w-4 h-4" />, "Pemadam")}

        <div className="w-px h-6 bg-gray-200 mx-1" />

        <button onClick={() => addShape("line")} title="Garisan"
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 border border-transparent text-xs font-medium">
          <Minus className="w-4 h-4" /><span className="text-[10px]">Garisan</span>
        </button>
        <button onClick={() => addShape("rect")} title="Kotak"
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 border border-transparent text-xs font-medium">
          <Square className="w-4 h-4" /><span className="text-[10px]">Kotak</span>
        </button>
        <label title="Imej"
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 border border-transparent text-xs font-medium cursor-pointer">
          <ImageIcon className="w-4 h-4" /><span className="text-[10px]">Imej</span>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && addImage(e.target.files[0])} />
        </label>

        {/* Right side: file info + save */}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-gray-400 hidden lg:block truncate max-w-48">{file.name}</span>
          <button onClick={() => { setFile(null); setPdfDoc(null); }} className="text-xs text-gray-400 hover:text-red-500">Tukar</button>
          <button onClick={savePdf} disabled={saving || !pdfDoc}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">
            <Download className="w-4 h-4" />
            {saving ? "Menyimpan..." : "Simpan PDF"}
          </button>
        </div>
      </div>

      {/* ── Toolbar row 2: formatting ── */}
      <div className="flex items-center gap-3 px-3 py-1.5 bg-white border-b border-gray-200">
        {/* Color */}
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-sm border border-gray-300" style={{ backgroundColor: color }} />
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
            className="w-0 h-0 opacity-0 absolute" id="color-input" />
          <label htmlFor="color-input" className="text-xs text-gray-600 cursor-pointer hover:text-red-600">Warna</label>
        </div>

        <div className="w-px h-5 bg-gray-200" />

        {/* Font family */}
        <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-red-400 min-w-[120px]">
          {FONTS.map(f => <option key={f}>{f}</option>)}
        </select>

        {/* Font size */}
        <select value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-red-400 w-16">
          {[8, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60].map(s => <option key={s}>{s}</option>)}
        </select>

        <div className="w-px h-5 bg-gray-200" />

        {/* Zoom */}
        <div className="flex items-center gap-1">
          <button onClick={() => setScale(s => Math.max(0.5, +(s - 0.25).toFixed(2)))}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500"><ZoomOut className="w-3.5 h-3.5" /></button>
          <span className="text-xs text-gray-600 w-12 text-center font-medium">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(s => Math.min(3, +(s + 0.25).toFixed(2)))}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500"><ZoomIn className="w-3.5 h-3.5" /></button>
        </div>

        {/* Page nav (inline) */}
        {totalPages > 0 && (
          <>
            <div className="w-px h-5 bg-gray-200" />
            <div className="flex items-center gap-1.5">
              <button onClick={() => changePage(currentPage - 1)} disabled={currentPage <= 1}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-30"><ChevronLeft className="w-3.5 h-3.5" /></button>
              <span className="text-xs text-gray-600 font-medium">
                <span className="font-semibold">{currentPage}</span> / {totalPages}
              </span>
              <button onClick={() => changePage(currentPage + 1)} disabled={currentPage >= totalPages}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-30"><ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
          </>
        )}

        {/* Hint */}
        <span className="ml-auto text-[11px] text-gray-400 hidden md:block">
          {activeTool === "text" && "Klik pada PDF untuk tambah teks"}
          {activeTool === "draw" && "Tahan & seret untuk melukis"}
          {activeTool === "highlight" && "Tahan & seret untuk highlight"}
          {activeTool === "eraser" && "Tahan & seret untuk padam"}
          {activeTool === "select" && "Klik objek untuk pilih & alih"}
        </span>
      </div>

      {/* ── Body: sidebar + canvas ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Thumbnail sidebar */}
        {sidebarOpen && (
          <div className="w-28 flex-shrink-0 bg-gray-200 border-r border-gray-300 overflow-y-auto py-3 px-2 space-y-2">
            {loadingPdf
              ? <p className="text-xs text-center text-gray-500 pt-8">Memuatkan...</p>
              : thumbnails.map((thumb, i) => (
                <button key={i} onClick={() => changePage(i + 1)}
                  className={cn("w-full rounded-lg overflow-hidden border-2 transition-all bg-white shadow-sm",
                    currentPage === i + 1 ? "border-red-500 shadow-md" : "border-transparent hover:border-gray-400")}>
                  <img src={thumb} alt={`Halaman ${i + 1}`} className="w-full block" />
                  <p className={cn("text-center text-[10px] py-1 font-medium", currentPage === i + 1 ? "text-red-600" : "text-gray-500")}>{i + 1}</p>
                </button>
              ))
            }
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 overflow-auto bg-gray-300 flex justify-center items-start p-6">
          {loadingPdf ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Memuatkan PDF...</p>
            </div>
          ) : (
            <div className="relative shadow-2xl inline-block"
              style={{
                cursor:
                  activeTool === "text" ? "text"
                  : activeTool === "draw" || activeTool === "highlight" || activeTool === "eraser" ? "crosshair"
                  : "default",
              }}>
              <canvas ref={pdfCanvasRef} className="block" />
              <div ref={fabricContainerRef} className="absolute top-0 left-0" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
