"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import {
  Type, Pen, Highlighter, ImageIcon, Eraser, Download,
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Undo, Redo,
  MousePointer, Minus, Square,
} from "lucide-react";
import { cn } from "@/lib/utils";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

type Tool = "select" | "text" | "draw" | "highlight" | "line" | "rect" | "eraser" | "image";

interface PageAnnotation {
  type: "text" | "draw" | "highlight" | "line" | "rect" | "image";
  data: any;
}

interface EditorPage {
  pageNum: number;
  annotations: PageAnnotation[];
  fabricJson?: string;
}

export default function PdfEditorTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [color, setColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(16);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pages, setPages] = useState<EditorPage[]>([]);
  const [thumbnails, setThumbnails] = useState<string[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<any>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileBytes = useRef<ArrayBuffer | null>(null);

  // Load PDF
  const loadFile = useCallback(async (f: File | null) => {
    if (!f || f.type !== "application/pdf") return;
    setFile(f);
    setLoading(true);
    try {
      const bytes = await f.arrayBuffer();
      fileBytes.current = bytes;
      const pdf = await pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
      setPages(Array.from({ length: pdf.numPages }, (_, i) => ({ pageNum: i + 1, annotations: [] })));

      // Generate thumbnails
      const thumbs: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const vp = page.getViewport({ scale: 0.2 });
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

  // Render PDF page to background canvas
  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc || !pdfCanvasRef.current) return;
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const canvas = pdfCanvasRef.current;
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({
      canvasContext: canvas.getContext("2d")! as any,
      viewport,
      canvas,
    }).promise;
  }, [pdfDoc, scale]);

  // Init/update Fabric canvas
  useEffect(() => {
    if (!pdfDoc) return;

    const initFabric = async () => {
      await renderPage(currentPage);

      if (!pdfCanvasRef.current) return;
      const w = pdfCanvasRef.current.width;
      const h = pdfCanvasRef.current.height;

      // Destroy old fabric canvas
      if (fabricCanvasRef.current) {
        const json = fabricCanvasRef.current.toJSON();
        setPages(prev => prev.map(p =>
          p.pageNum === currentPage ? { ...p, fabricJson: JSON.stringify(json) } : p
        ));
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }

      // Create new fabric canvas
      const { fabric } = await import("fabric");
      const fc = new fabric.Canvas("fabric-canvas", { width: w, height: h, isDrawingMode: false });
      fabricCanvasRef.current = fc;

      // Restore saved annotations for this page
      const savedPage = pages.find(p => p.pageNum === currentPage);
      if (savedPage?.fabricJson) {
        fc.loadFromJSON(JSON.parse(savedPage.fabricJson), () => fc.renderAll());
      }

      updateToolMode(fc, activeTool, color, fontSize);
    };

    initFabric();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfDoc, currentPage, scale]);

  function updateToolMode(fc: any, tool: Tool, col: string, fsize: number) {
    if (!fc) return;
    fc.isDrawingMode = false;
    fc.selection = true;

    if (tool === "draw") {
      fc.isDrawingMode = true;
      fc.freeDrawingBrush.color = col;
      fc.freeDrawingBrush.width = 3;
    } else if (tool === "highlight") {
      fc.isDrawingMode = true;
      const hex = col === "#000000" ? "#FFFF00" : col;
      fc.freeDrawingBrush.color = hex + "80";
      fc.freeDrawingBrush.width = 20;
    } else if (tool === "eraser") {
      fc.isDrawingMode = true;
      fc.freeDrawingBrush.color = "white";
      fc.freeDrawingBrush.width = 20;
    } else if (tool === "select") {
      fc.selection = true;
    }
  }

  // Update tool mode when tool changes
  useEffect(() => {
    if (fabricCanvasRef.current) {
      updateToolMode(fabricCanvasRef.current, activeTool, color, fontSize);
    }
  }, [activeTool, color, fontSize]);

  // Add text on click
  useEffect(() => {
    const fc = fabricCanvasRef.current;
    if (!fc || activeTool !== "text") return;

    const handler = async (opt: any) => {
      const { fabric } = await import("fabric");
      const pointer = fc.getPointer(opt.e);
      const text = new fabric.IText("Taip teks di sini", {
        left: pointer.x,
        top: pointer.y,
        fontSize,
        fill: color,
        fontFamily: "Arial",
        editable: true,
      });
      fc.add(text);
      fc.setActiveObject(text);
      text.enterEditing();
      text.selectAll();
    };

    fc.on("mouse:down", handler);
    return () => fc.off("mouse:down", handler);
  }, [activeTool, color, fontSize]);

  // Add image
  async function addImage(file: File) {
    if (!fabricCanvasRef.current) return;
    const { fabric } = await import("fabric");
    const url = URL.createObjectURL(file);
    fabric.Image.fromURL(url, (img: any) => {
      img.scaleToWidth(200);
      fabricCanvasRef.current.add(img);
      fabricCanvasRef.current.setActiveObject(img);
    });
  }

  // Add shape
  async function addShape(type: "line" | "rect") {
    if (!fabricCanvasRef.current) return;
    const { fabric } = await import("fabric");
    const fc = fabricCanvasRef.current;
    if (type === "rect") {
      const rect = new fabric.Rect({ left: 100, top: 100, width: 150, height: 80, fill: "transparent", stroke: color, strokeWidth: 2 });
      fc.add(rect); fc.setActiveObject(rect);
    } else {
      const line = new fabric.Line([100, 100, 300, 100], { stroke: color, strokeWidth: 2 });
      fc.add(line); fc.setActiveObject(line);
    }
  }

  function changePage(dir: number) {
    const fc = fabricCanvasRef.current;
    if (fc) {
      const json = fc.toJSON();
      setPages(prev => prev.map(p =>
        p.pageNum === currentPage ? { ...p, fabricJson: JSON.stringify(json) } : p
      ));
    }
    setCurrentPage(prev => Math.max(1, Math.min(totalPages, prev + dir)));
  }

  function undo() {
    const fc = fabricCanvasRef.current;
    if (!fc) return;
    const objs = fc.getObjects();
    if (objs.length > 0) { fc.remove(objs[objs.length - 1]); fc.renderAll(); }
  }

  // Save PDF with annotations
  async function savePdf() {
    if (!fileBytes.current) return;
    setSaving(true);
    try {
      // Save current page canvas state
      const fc = fabricCanvasRef.current;
      const updatedPages = [...pages];
      if (fc) {
        const json = fc.toJSON();
        const idx = updatedPages.findIndex(p => p.pageNum === currentPage);
        if (idx >= 0) updatedPages[idx] = { ...updatedPages[idx], fabricJson: JSON.stringify(json) };
      }

      const pdfLibDoc = await PDFDocument.load(fileBytes.current);

      // For each page with annotations, flatten canvas onto PDF
      for (const pg of updatedPages) {
        if (!pg.fabricJson) continue;

        // Render the fabric canvas to image
        const page = await pdfDoc!.getPage(pg.pageNum);
        const viewport = page.getViewport({ scale });

        // Create temp canvas and load fabric json
        const { fabric } = await import("fabric");
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = viewport.width;
        tempCanvas.height = viewport.height;
        const tempFc = new fabric.StaticCanvas(tempCanvas);
        await new Promise<void>((resolve) => {
          tempFc.loadFromJSON(JSON.parse(pg.fabricJson!), () => {
            tempFc.renderAll();
            resolve();
          });
        });

        const imgData = tempCanvas.toDataURL("image/png");
        const imgBytes = await fetch(imgData).then(r => r.arrayBuffer());
        const embeddedImg = await pdfLibDoc.embedPng(imgBytes);

        const pdfPage = pdfLibDoc.getPage(pg.pageNum - 1);
        const { width, height } = pdfPage.getSize();
        pdfPage.drawImage(embeddedImg, { x: 0, y: 0, width, height, opacity: 1 });

        tempFc.dispose();
      }

      const bytes = await pdfLibDoc.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `edited-${file!.name}`; a.click();
    } finally {
      setSaving(false);
    }
  }

  const TOOLS: { id: Tool; icon: React.ReactNode; label: string }[] = [
    { id: "select", icon: <MousePointer className="w-4 h-4" />, label: "Pilih" },
    { id: "text", icon: <Type className="w-4 h-4" />, label: "Teks" },
    { id: "draw", icon: <Pen className="w-4 h-4" />, label: "Lukis" },
    { id: "highlight", icon: <Highlighter className="w-4 h-4" />, label: "Highlight" },
    { id: "line", icon: <Minus className="w-4 h-4" />, label: "Garisan" },
    { id: "rect", icon: <Square className="w-4 h-4" />, label: "Kotak" },
    { id: "eraser", icon: <Eraser className="w-4 h-4" />, label: "Pemadam" },
  ];

  if (!file) {
    return (
      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-12 cursor-pointer hover:border-red-300 hover:bg-red-50 transition-colors">
        <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center mb-4">
          <Type className="w-7 h-7 text-red-600" />
        </div>
        <span className="font-semibold text-gray-800 text-lg">Buka fail PDF</span>
        <span className="text-sm text-gray-400 mt-1">Klik atau seret fail PDF ke sini</span>
        <input type="file" accept="application/pdf" className="hidden" onChange={(e) => loadFile(e.target.files?.[0] ?? null)} />
      </label>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Memuatkan PDF...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top toolbar */}
      <div className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-xl mb-3 flex-wrap">
        {/* Tools */}
        <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setActiveTool(t.id);
                if (t.id === "line" || t.id === "rect") addShape(t.id);
              }}
              title={t.label}
              className={cn(
                "p-2 rounded-lg text-sm flex flex-col items-center gap-0.5 transition-colors",
                activeTool === t.id ? "bg-red-600 text-white" : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {t.icon}
              <span className="text-[10px] leading-none">{t.label}</span>
            </button>
          ))}
          {/* Image upload */}
          <label title="Imej" className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 cursor-pointer flex flex-col items-center gap-0.5">
            <ImageIcon className="w-4 h-4" />
            <span className="text-[10px] leading-none">Imej</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && addImage(e.target.files[0])} />
          </label>
        </div>

        {/* Color + font size */}
        <div className="flex items-center gap-2 border-r border-gray-200 pr-2">
          <div className="flex items-center gap-1">
            <label className="text-xs text-gray-500">Warna</label>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer border border-gray-200" />
          </div>
          <div className="flex items-center gap-1">
            <label className="text-xs text-gray-500">Saiz</label>
            <select value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="text-xs border border-gray-200 rounded px-1 py-1">
              {[10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Undo + Zoom */}
        <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
          <button onClick={undo} title="Undo" className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"><Undo className="w-4 h-4" /></button>
          <button onClick={() => setScale(s => Math.max(0.5, s - 0.25))} title="Zoom Out" className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"><ZoomOut className="w-4 h-4" /></button>
          <span className="text-xs text-gray-500 w-10 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(s => Math.min(3, s + 0.25))} title="Zoom In" className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"><ZoomIn className="w-4 h-4" /></button>
        </div>

        {/* Save */}
        <button
          onClick={savePdf}
          disabled={saving}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {saving ? "Menyimpan..." : "Simpan PDF"}
        </button>
      </div>

      <div className="flex gap-3 flex-1 min-h-0">
        {/* Thumbnail sidebar */}
        <div className="w-28 flex-shrink-0 overflow-y-auto space-y-2 bg-gray-50 rounded-xl p-2 border border-gray-200">
          {thumbnails.map((thumb, i) => (
            <button
              key={i}
              onClick={() => changePage(i + 1 - currentPage)}
              className={cn("w-full rounded-lg overflow-hidden border-2 transition-all", currentPage === i + 1 ? "border-red-500" : "border-transparent hover:border-gray-300")}
            >
              <img src={thumb} alt={`Halaman ${i + 1}`} className="w-full" />
              <p className="text-center text-xs py-1 text-gray-500">{i + 1}</p>
            </button>
          ))}
        </div>

        {/* Editor canvas area */}
        <div className="flex-1 flex flex-col gap-2">
          {/* Page nav */}
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => changePage(-1)} disabled={currentPage === 1} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-sm text-gray-600">Halaman {currentPage} / {totalPages}</span>
            <button onClick={() => changePage(1)} disabled={currentPage === totalPages} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
          </div>

          {/* Canvas stack */}
          <div className="flex-1 overflow-auto bg-gray-200 rounded-xl p-4">
            <div className="relative inline-block shadow-lg mx-auto">
              {/* PDF background */}
              <canvas ref={pdfCanvasRef} className="block" />
              {/* Fabric overlay */}
              <canvas
                id="fabric-canvas"
                className="absolute inset-0"
                style={{ cursor: activeTool === "text" ? "text" : activeTool === "draw" || activeTool === "highlight" || activeTool === "eraser" ? "crosshair" : "default" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
