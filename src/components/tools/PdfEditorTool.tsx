"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument } from "pdf-lib";
import {
  Pen, Highlighter, ImageIcon, Eraser, Download,
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Undo, Redo,
  MousePointer, Minus, Upload, PanelLeft, PanelRight, Type, PenLine,
  Stamp, Link, StickyNote, X, Check, Hand,
  Square, Circle, ArrowUpRight, Bold, Italic, Underline, Copy,
  BringToFront, SendToBack, Maximize2, AlignLeft, AlignCenter, AlignRight,
} from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import { useUsageLimit } from "@/hooks/useUsageLimit";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FabricCanvas = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FabricObject = any;

type ToolType =
  | "select" | "move" | "addtext" | "edittext" | "sign"
  | "line" | "rect" | "circle" | "arrow"
  | "draw" | "eraser" | "highlight" | "texthighlight"
  | "image" | "stamp" | "link" | "note";

type SelectedType = "none" | "text" | "shape" | "image" | "path" | "group";

const STAMPS = ["APPROVED", "REJECTED", "DRAFT", "CONFIDENTIAL", "REVIEWED", "VOID"];
const HIGHLIGHT_PRESETS = [
  { color: "#FFFF0066", label: "Yellow" },
  { color: "#00FF0066", label: "Green" },
  { color: "#FF69B466", label: "Pink" },
  { color: "#00BFFF55", label: "Blue" },
];
const FONTS = ["Arial", "Times New Roman", "Courier New", "Georgia", "Verdana"];

interface TextEditState {
  item: any; x: number; y: number; w: number; h: number; fontSize: number; value: string;
}

export default function PdfEditorTool() {
  const { checkLimit, recordUsage } = useUsageLimit("edit-pdf");

  // Document state
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.3);
  const [saving, setSaving] = useState(false);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loadingPdf, setLoadingPdf] = useState(false);

  // UI layout
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  // Active tool + draw settings
  const [activeTool, setActiveTool] = useState<ToolType>("select");
  const [color, setColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState("Arial");
  const [penWidth, setPenWidth] = useState(2);
  const [highlightColor, setHighlightColor] = useState("#FFFF0066");
  const [textBold, setTextBold] = useState(false);
  const [textItalic, setTextItalic] = useState(false);
  const [textUnderline, setTextUnderline] = useState(false);

  // Right panel — selected object properties
  const [selectedType, setSelectedType] = useState<SelectedType>("none");
  const [objColor, setObjColor] = useState("#000000");
  const [objFill, setObjFill] = useState("#ffffff");
  const [objHasFill, setObjHasFill] = useState(false);
  const [objStroke, setObjStroke] = useState("#000000");
  const [objStrokeWidth, setObjStrokeWidth] = useState(2);
  const [objOpacity, setObjOpacity] = useState(100);
  const [objFontFamily, setObjFontFamily] = useState("Arial");
  const [objFontSize, setObjFontSize] = useState(16);
  const [objBold, setObjBold] = useState(false);
  const [objItalic, setObjItalic] = useState(false);
  const [objUnderline, setObjUnderline] = useState(false);
  const [objAlign, setObjAlign] = useState<"left" | "center" | "right">("left");

  // Pickers / modals
  const [showStampPicker, setShowStampPicker] = useState(false);
  const [showAnnotationPicker, setShowAnnotationPicker] = useState(false);
  const [pendingStamp, setPendingStamp] = useState("");
  const [showSignModal, setShowSignModal] = useState(false);
  const [signTab, setSignTab] = useState<"draw" | "upload" | "type">("draw");
  const [uploadedSignature, setUploadedSignature] = useState<string | null>(null);
  const [signTypeText, setSignTypeText] = useState("");
  const signCanvasRef = useRef<HTMLCanvasElement>(null);
  const signDrawing = useRef(false);
  const signLastPos = useRef({ x: 0, y: 0 });
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [pendingNotePos, setPendingNotePos] = useState<{ x: number; y: number } | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("https://");
  const [linkText, setLinkText] = useState("Click here");
  const [pendingLinkPos, setPendingLinkPos] = useState<{ x: number; y: number } | null>(null);

  // Text edit overlay
  const [pageTextItems, setPageTextItems] = useState<any[]>([]);
  const [pageViewport, setPageViewport] = useState<any>(null);
  const [editingText, setEditingText] = useState<TextEditState | null>(null);

  // Undo/Redo
  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Canvas refs
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const fabricContainerRef = useRef<HTMLDivElement>(null);
  const canvasScrollRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fabricRef = useRef<any>(null);
  const fileBytes = useRef<ArrayBuffer | null>(null);
  const pageStates = useRef<Record<number, string>>({});
  const prevPage = useRef<number>(1);
  const activeObjRef = useRef<FabricObject>(null);

  // Shape drawing
  const isDrawingShape = useRef(false);
  const shapeOrigin = useRef({ x: 0, y: 0 });
  const shapeEnd = useRef({ x: 0, y: 0 });
  const shapePreview = useRef<FabricObject>(null);

  // Sync refs for event handlers
  const activeToolRef = useRef<ToolType>("select");
  const colorRef = useRef("#000000");
  const fontSizeRef = useRef(16);
  const fontFamilyRef = useRef("Arial");
  const penWidthRef = useRef(2);
  const highlightColorRef = useRef("#FFFF0066");
  const textBoldRef = useRef(false);
  const textItalicRef = useRef(false);
  const textUnderlineRef = useRef(false);
  const pendingStampRef = useRef("");

  activeToolRef.current = activeTool;
  colorRef.current = color;
  fontSizeRef.current = fontSize;
  fontFamilyRef.current = fontFamily;
  penWidthRef.current = penWidth;
  highlightColorRef.current = highlightColor;
  textBoldRef.current = textBold;
  textItalicRef.current = textItalic;
  textUnderlineRef.current = textUnderline;
  pendingStampRef.current = pendingStamp;

  // ── Sync selected object → right panel ──
  const syncFromObject = useCallback((obj: FabricObject | null) => {
    activeObjRef.current = obj;
    if (!obj) { setSelectedType("none"); return; }
    const type: string = obj.type ?? "";
    setObjOpacity(Math.round((obj.opacity ?? 1) * 100));

    if (type === "i-text" || type === "textbox" || type === "text") {
      setSelectedType("text");
      setObjColor(obj.fill ?? "#000000");
      setObjFontFamily(obj.fontFamily ?? "Arial");
      setObjFontSize(Math.round(obj.fontSize ?? 16));
      setObjBold(obj.fontWeight === "bold");
      setObjItalic(obj.fontStyle === "italic");
      setObjUnderline(!!obj.underline);
      setObjAlign((obj.textAlign as any) ?? "left");
    } else if (type === "image") {
      setSelectedType("image");
    } else if (type === "path") {
      setSelectedType("path");
      setObjColor(obj.stroke ?? "#000000");
      setObjStrokeWidth(obj.strokeWidth ?? 2);
    } else if (type === "rect" || type === "ellipse" || type === "circle" || type === "line" || type === "triangle") {
      setSelectedType("shape");
      setObjStroke(obj.stroke ?? "#000000");
      setObjStrokeWidth(obj.strokeWidth ?? 2);
      const fill = obj.fill;
      const hasFill = !!fill && fill !== "transparent" && fill !== "";
      setObjHasFill(hasFill);
      setObjFill(hasFill ? fill : "#ffffff");
    } else {
      setSelectedType("group");
      setObjStroke(obj.stroke ?? "#000000");
      setObjStrokeWidth(obj.strokeWidth ?? 2);
    }
  }, []);

  // Apply right-panel change to active Fabric object
  const applyToObj = useCallback((props: Record<string, any>) => {
    const obj = activeObjRef.current;
    if (!obj || !fabricRef.current) return;
    obj.set(props);
    fabricRef.current.renderAll();
  }, []);

  const pushUndo = useCallback(() => {
    if (!fabricRef.current) return;
    undoStack.current.push(JSON.stringify(fabricRef.current.toJSON()));
    redoStack.current = [];
    setCanUndo(true); setCanRedo(false);
  }, []);

  const loadFile = useCallback(async (f: File | null) => {
    if (!f || f.type !== "application/pdf") return;
    setError(""); setLoadingPdf(true); setFile(f); setPdfDoc(null);
    setThumbnails([]); setCurrentPage(1); setTotalPages(0);
    pageStates.current = {}; prevPage.current = 1;
    undoStack.current = []; redoStack.current = [];
    setCanUndo(false); setCanRedo(false); setSelectedType("none");
    try {
      const bytes = await f.arrayBuffer();
      fileBytes.current = bytes.slice(0);
      const pdf = await pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
      const thumbs: string[] = [];
      const dpr = window.devicePixelRatio || 1;
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const vp = page.getViewport({ scale: 0.18 * dpr });
        const c = document.createElement("canvas");
        c.width = vp.width; c.height = vp.height;
        await page.render({ canvasContext: c.getContext("2d")! as any, viewport: vp, canvas: c }).promise;
        thumbs.push(c.toDataURL());
      }
      setThumbnails(thumbs); setTotalPages(pdf.numPages);
      setLoadingPdf(false); setPdfDoc(pdf);
    } catch {
      setError("Failed to load PDF. Please try another file.");
      setFile(null); setLoadingPdf(false);
    }
  }, []);

  // ── Canvas init ──
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
        const dpr = window.devicePixelRatio || 1;
        pdfCanvas.width = viewport.width * dpr;
        pdfCanvas.height = viewport.height * dpr;
        pdfCanvas.style.width = `${viewport.width}px`;
        pdfCanvas.style.height = `${viewport.height}px`;
        const ctx = pdfCanvas.getContext("2d")!;
        ctx.scale(dpr, dpr);
        await page.render({ canvasContext: ctx as any, viewport, canvas: pdfCanvas }).promise;
        if (cancelled) return;
        try {
          const tc = await page.getTextContent();
          setPageViewport(viewport);
          setPageTextItems(tc.items.filter((i: any) => "str" in i && i.str.trim()));
        } catch { setPageTextItems([]); }
        setEditingText(null);

        if (fabricRef.current) {
          try { pageStates.current[prevPage.current] = JSON.stringify(fabricRef.current.toJSON()); fabricRef.current.dispose(); } catch {}
          fabricRef.current = null;
        }
        prevPage.current = currentPage;
        fabricContainer.innerHTML = "";
        const newCanvas = document.createElement("canvas");
        fabricContainer.appendChild(newCanvas);
        const { fabric } = await import("fabric");
        if (cancelled) return;

        const fc = new fabric.Canvas(newCanvas, {
          width: viewport.width, height: viewport.height,
          enableRetinaScaling: true, isDrawingMode: false,
          selection: true, backgroundColor: "transparent",
        });
        fabricRef.current = fc;
        if (pageStates.current[currentPage]) {
          await new Promise<void>(res => { fc.loadFromJSON(JSON.parse(pageStates.current[currentPage]), () => { fc.renderAll(); res(); }); });
        }
        applyTool(fc, activeToolRef.current, colorRef.current, fontSizeRef.current);

        // ── Selection sync ──
        fc.on("selection:created", (e: any) => {
          const objs = e.selected ?? [];
          if (objs.length === 1) syncFromObject(objs[0]);
          else if (objs.length > 1) { setSelectedType("group"); activeObjRef.current = fc.getActiveObject(); }
        });
        fc.on("selection:updated", (e: any) => {
          const objs = e.selected ?? [];
          if (objs.length === 1) syncFromObject(objs[0]);
          else if (objs.length > 1) { setSelectedType("group"); activeObjRef.current = fc.getActiveObject(); }
        });
        fc.on("selection:cleared", () => { setSelectedType("none"); activeObjRef.current = null; });
        fc.on("object:modified", (e: any) => { pushUndo(); if (e.target) syncFromObject(e.target); });

        // ── mouse:down ──
        fc.on("mouse:down", async (opt: any) => {
          const tool = activeToolRef.current;
          const pointer = fc.getPointer(opt.e);

          if (tool === "rect" || tool === "circle" || tool === "arrow") {
            if (opt.target) return;
            isDrawingShape.current = true;
            shapeOrigin.current = { x: pointer.x, y: pointer.y };
            shapeEnd.current = { x: pointer.x, y: pointer.y };
            const { fabric: f2 } = await import("fabric");
            let preview: FabricObject;
            if (tool === "rect") {
              preview = new f2.Rect({ left: pointer.x, top: pointer.y, width: 0, height: 0, fill: "transparent", stroke: colorRef.current, strokeWidth: penWidthRef.current, selectable: false, evented: false });
            } else if (tool === "circle") {
              preview = new f2.Ellipse({ left: pointer.x, top: pointer.y, rx: 0, ry: 0, fill: "transparent", stroke: colorRef.current, strokeWidth: penWidthRef.current, selectable: false, evented: false });
            } else {
              preview = new f2.Line([pointer.x, pointer.y, pointer.x, pointer.y], { stroke: colorRef.current, strokeWidth: penWidthRef.current, selectable: false, evented: false });
            }
            shapePreview.current = preview; fc.add(preview); fc.renderAll();
            return;
          }

          if (tool === "addtext") {
            const { fabric: f2 } = await import("fabric");
            pushUndo();
            const t = new f2.IText("Text", {
              left: pointer.x, top: pointer.y, fontSize: fontSizeRef.current,
              fill: colorRef.current, fontFamily: fontFamilyRef.current,
              fontWeight: textBoldRef.current ? "bold" : "normal",
              fontStyle: textItalicRef.current ? "italic" : "normal",
              underline: textUnderlineRef.current,
            });
            fc.add(t); fc.setActiveObject(t); t.enterEditing(); t.selectAll(); fc.renderAll();
          } else if (tool === "edittext") {
            const target = opt.target;
            if (target && (target.type === "i-text" || target.type === "textbox" || target.type === "text")) {
              fc.setActiveObject(target); target.enterEditing?.(); target.selectAll?.(); fc.renderAll();
            }
          } else if (tool === "stamp" && pendingStampRef.current) {
            const stamp = pendingStampRef.current;
            const { fabric: f2 } = await import("fabric");
            pushUndo();
            const stampColors: Record<string, string> = { APPROVED: "#16a34a", REJECTED: "#dc2626", DRAFT: "#d97706", CONFIDENTIAL: "#7c3aed", REVIEWED: "#0284c7", VOID: "#64748b" };
            const col = stampColors[stamp] || "#dc2626";
            const pad = 18; const fnt = `bold 32px Arial`;
            const tmpC = document.createElement("canvas");
            const tmpCtx = tmpC.getContext("2d")!;
            tmpCtx.font = fnt;
            const tw = tmpCtx.measureText(stamp).width + pad * 2;
            const th = 52;
            tmpC.width = tw + 6; tmpC.height = th + 6;
            const ctx2 = tmpC.getContext("2d")!;
            ctx2.strokeStyle = col; ctx2.lineWidth = 4; ctx2.globalAlpha = 0.85;
            ctx2.beginPath(); ctx2.roundRect(3, 3, tw, th, 6); ctx2.stroke();
            ctx2.font = fnt; ctx2.fillStyle = col; ctx2.textAlign = "center"; ctx2.textBaseline = "middle";
            ctx2.fillText(stamp, (tw + 6) / 2, (th + 6) / 2);
            f2.Image.fromURL(tmpC.toDataURL(), (img: any) => {
              img.set({ left: pointer.x - img.width! / 2, top: pointer.y - img.height! / 2, angle: -20, opacity: 0.82 });
              fc.add(img); fc.setActiveObject(img); fc.renderAll();
            });
            setActiveTool("select"); setPendingStamp("");
          } else if (tool === "note") {
            setPendingNotePos({ x: pointer.x, y: pointer.y }); setNoteText(""); setShowNoteModal(true);
          } else if (tool === "link") {
            setPendingLinkPos({ x: pointer.x, y: pointer.y }); setShowLinkModal(true);
          }
        });

        // ── Shape preview ──
        fc.on("mouse:move", (opt: any) => {
          if (!isDrawingShape.current || !shapePreview.current) return;
          const ptr = fc.getPointer(opt.e);
          shapeEnd.current = { x: ptr.x, y: ptr.y };
          const obj = shapePreview.current;
          const ox = shapeOrigin.current.x, oy = shapeOrigin.current.y;
          const tool = activeToolRef.current;
          if (tool === "rect") { obj.set({ left: Math.min(ptr.x, ox), top: Math.min(ptr.y, oy), width: Math.abs(ptr.x - ox), height: Math.abs(ptr.y - oy) }); }
          else if (tool === "circle") { obj.set({ left: Math.min(ptr.x, ox), top: Math.min(ptr.y, oy), rx: Math.abs(ptr.x - ox) / 2, ry: Math.abs(ptr.y - oy) / 2 }); }
          else if (tool === "arrow") { obj.set({ x2: ptr.x, y2: ptr.y }); }
          fc.renderAll();
        });

        fc.on("mouse:up", async () => {
          if (!isDrawingShape.current) return;
          isDrawingShape.current = false;
          const preview = shapePreview.current; shapePreview.current = null;
          if (!preview) return;
          const tool = activeToolRef.current;
          const ex = shapeEnd.current.x, ey = shapeEnd.current.y;
          const ox = shapeOrigin.current.x, oy = shapeOrigin.current.y;
          const dx = Math.abs(ex - ox), dy = Math.abs(ey - oy);
          fc.remove(preview);
          if (dx < 5 && dy < 5) { fc.renderAll(); return; }
          const { fabric: f2 } = await import("fabric");
          pushUndo();
          if (tool === "rect") {
            const r = new f2.Rect({ left: Math.min(ex, ox), top: Math.min(ey, oy), width: dx, height: dy, fill: "transparent", stroke: colorRef.current, strokeWidth: penWidthRef.current });
            fc.add(r); fc.setActiveObject(r);
          } else if (tool === "circle") {
            const e = new f2.Ellipse({ left: Math.min(ex, ox), top: Math.min(ey, oy), rx: dx / 2, ry: dy / 2, fill: "transparent", stroke: colorRef.current, strokeWidth: penWidthRef.current });
            fc.add(e); fc.setActiveObject(e);
          } else if (tool === "arrow") {
            const angle = Math.atan2(ey - oy, ex - ox);
            const line = new f2.Line([ox, oy, ex, ey], { stroke: colorRef.current, strokeWidth: penWidthRef.current });
            const headLen = Math.max(12, penWidthRef.current * 4);
            const tri = new f2.Triangle({ width: headLen, height: headLen, fill: colorRef.current, left: ex, top: ey, originX: "center", originY: "center", angle: (angle * 180 / Math.PI) + 90 });
            fc.add(new f2.Group([line, tri]));
          }
          fc.renderAll(); setActiveTool("select");
        });

        fc.on("mouse:dblclick", (opt: any) => {
          const t = opt.target;
          if (t && (t.type === "i-text" || t.type === "textbox" || t.type === "text")) { fc.setActiveObject(t); t.enterEditing?.(); fc.renderAll(); }
        });
        fc.on("object:moving", (opt: any) => { if (activeToolRef.current === "move") opt.target.canvas.setCursor("grabbing"); });
      } catch { /* swallowed in prod */ }
    }
    init();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfDoc, currentPage, scale]);

  useEffect(() => {
    if (fabricRef.current) applyTool(fabricRef.current, activeTool, color, fontSize);
  }, [activeTool, color, fontSize, penWidth, highlightColor]);

  function applyTool(fc: FabricCanvas, tool: ToolType, col: string, _fs: number) {
    fc.isDrawingMode = false;
    fc.selection = tool === "select" || tool === "edittext" || tool === "move";
    const isShape = tool === "rect" || tool === "circle" || tool === "arrow";
    if (tool === "move") {
      fc.getObjects().forEach((o: any) => o.set({ selectable: true, evented: true, hasControls: true, hasBorders: true }));
      fc.defaultCursor = "grab"; fc.hoverCursor = "grab"; fc.moveCursor = "grabbing";
    } else {
      fc.defaultCursor = isShape ? "crosshair" : "default";
      fc.hoverCursor = "move"; fc.moveCursor = "move";
    }
    if (tool === "draw") { fc.isDrawingMode = true; fc.freeDrawingBrush.color = col; fc.freeDrawingBrush.width = penWidthRef.current; }
    else if (tool === "highlight" || tool === "texthighlight") { fc.isDrawingMode = true; fc.freeDrawingBrush.color = highlightColorRef.current; fc.freeDrawingBrush.width = tool === "texthighlight" ? 14 : 22; }
    else if (tool === "eraser") { fc.isDrawingMode = true; fc.freeDrawingBrush.color = "#ffffff"; fc.freeDrawingBrush.width = 20; }
    fc.renderAll();
  }

  function undo() {
    if (!fabricRef.current || !undoStack.current.length) return;
    try {
      redoStack.current.push(JSON.stringify(fabricRef.current.toJSON()));
      const prev = undoStack.current.pop()!;
      fabricRef.current.loadFromJSON(JSON.parse(prev), () => fabricRef.current.renderAll());
      setCanUndo(undoStack.current.length > 0); setCanRedo(true);
    } catch { undoStack.current = []; redoStack.current = []; setCanUndo(false); setCanRedo(false); }
  }

  function redo() {
    if (!fabricRef.current || !redoStack.current.length) return;
    try {
      undoStack.current.push(JSON.stringify(fabricRef.current.toJSON()));
      const next = redoStack.current.pop()!;
      fabricRef.current.loadFromJSON(JSON.parse(next), () => fabricRef.current.renderAll());
      setCanUndo(true); setCanRedo(redoStack.current.length > 0);
    } catch { undoStack.current = []; redoStack.current = []; setCanUndo(false); setCanRedo(false); }
  }

  function deleteSelected() {
    const fc = fabricRef.current; if (!fc) return;
    const active = fc.getActiveObjects(); if (!active.length) return;
    pushUndo(); active.forEach((o: any) => fc.remove(o)); fc.discardActiveObject(); fc.renderAll();
  }

  function duplicateSelected() {
    const fc = fabricRef.current; if (!fc) return;
    const active = fc.getActiveObject(); if (!active) return;
    pushUndo();
    active.clone((cloned: FabricObject) => {
      cloned.set({ left: (cloned.left ?? 0) + 16, top: (cloned.top ?? 0) + 16 });
      fc.add(cloned); fc.setActiveObject(cloned); fc.renderAll();
    });
  }

  function bringForward() { const fc = fabricRef.current; if (!fc) return; const o = fc.getActiveObject(); if (o) { fc.bringForward(o); fc.renderAll(); } }
  function sendBackward() { const fc = fabricRef.current; if (!fc) return; const o = fc.getActiveObject(); if (o) { fc.sendBackwards(o); fc.renderAll(); } }

  function fitToWidth() {
    if (!pdfDoc || !canvasScrollRef.current) return;
    pdfDoc.getPage(currentPage).then(page => {
      const vp = page.getViewport({ scale: 1 });
      const avail = canvasScrollRef.current!.clientWidth - 80;
      setScale(Math.round((avail / vp.width) * 100) / 100);
    });
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable) return;
      if (e.key === "Delete" || e.key === "Backspace") deleteSelected();
      if ((e.ctrlKey || e.metaKey) && e.key === "d") { e.preventDefault(); duplicateSelected(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") { e.preventDefault(); redo(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addShape(type: "line") {
    if (!fabricRef.current) return;
    const { fabric } = await import("fabric");
    const fc = fabricRef.current; pushUndo();
    const cx = fc.width / 2, cy = fc.height / 2;
    fc.add(new fabric.Line([cx - 80, cy, cx + 80, cy], { stroke: color, strokeWidth: penWidth }));
    fc.renderAll(); setActiveTool("select");
  }

  async function addAnnotation(type: "crossmark" | "checkmark" | "dot" | "circle" | "crossout") {
    if (!fabricRef.current) return;
    const { fabric } = await import("fabric");
    const fc = fabricRef.current; pushUndo();
    const cx = fc.width / 2, cy = fc.height / 2; const col = color;
    let obj: FabricObject;
    switch (type) {
      case "crossmark": { const s = 20; obj = new fabric.Group([new fabric.Line([0,0,s*2,s*2],{stroke:col,strokeWidth:3,strokeLineCap:"round"}),new fabric.Line([s*2,0,0,s*2],{stroke:col,strokeWidth:3,strokeLineCap:"round"})],{left:cx-s,top:cy-s}); break; }
      case "checkmark": { obj = new fabric.Group([new fabric.Polyline([{x:0,y:12},{x:8,y:22},{x:26,y:0}],{stroke:col,strokeWidth:3,fill:"transparent",strokeLineCap:"round",strokeLineJoin:"round"})],{left:cx-13,top:cy-11}); break; }
      case "dot": obj = new fabric.Circle({radius:8,fill:col,left:cx-8,top:cy-8}); break;
      case "circle": obj = new fabric.Ellipse({rx:40,ry:18,fill:"transparent",stroke:col,strokeWidth:2,left:cx-40,top:cy-18}); break;
      case "crossout": obj = new fabric.Line([cx-60,cy,cx+60,cy],{stroke:col,strokeWidth:2,strokeLineCap:"round"}); break;
    }
    if (obj!) { fc.add(obj); fc.setActiveObject(obj); fc.renderAll(); setActiveTool("move"); }
  }

  async function addImage(f: File) {
    if (!fabricRef.current) return;
    const { fabric } = await import("fabric"); pushUndo();
    fabric.Image.fromURL(URL.createObjectURL(f), (img: any) => {
      img.scaleToWidth(Math.min(200, fabricRef.current.width * 0.4));
      fabricRef.current.add(img); fabricRef.current.setActiveObject(img); fabricRef.current.renderAll(); setActiveTool("select");
    });
  }

  function signStart(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    signDrawing.current = true;
    const canvas = signCanvasRef.current!; const rect = canvas.getBoundingClientRect();
    const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
    const cy = "touches" in e ? e.touches[0].clientY : e.clientY;
    signLastPos.current = { x: cx - rect.left, y: cy - rect.top };
  }
  function signMove(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!signDrawing.current) return; e.preventDefault();
    const canvas = signCanvasRef.current!; const ctx = canvas.getContext("2d")!; const rect = canvas.getBoundingClientRect();
    const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
    const cy = "touches" in e ? e.touches[0].clientY : e.clientY;
    const x = cx - rect.left, y = cy - rect.top;
    ctx.beginPath(); ctx.moveTo(signLastPos.current.x, signLastPos.current.y); ctx.lineTo(x, y);
    ctx.strokeStyle = "#1e293b"; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.stroke();
    signLastPos.current = { x, y };
  }
  function signEnd() { signDrawing.current = false; }
  function signClear() { signCanvasRef.current!.getContext("2d")!.clearRect(0, 0, 420, 160); }

  async function signPlace() {
    if (!fabricRef.current) return;
    const { fabric } = await import("fabric"); pushUndo();
    if (signTab === "type" && signTypeText.trim()) {
      const t = new fabric.IText(signTypeText.trim(), { left: 80, top: 80, fontSize: 36, fontFamily: "Georgia, serif", fill: "#1e293b", fontStyle: "italic" });
      fabricRef.current.add(t); fabricRef.current.setActiveObject(t); fabricRef.current.renderAll();
    } else {
      const dataUrl = signTab === "upload" && uploadedSignature ? uploadedSignature : signCanvasRef.current!.toDataURL("image/png");
      fabric.Image.fromURL(dataUrl, (img: any) => { img.scaleToWidth(160); img.set({ left: 100, top: 100 }); fabricRef.current.add(img); fabricRef.current.setActiveObject(img); fabricRef.current.renderAll(); });
    }
    setShowSignModal(false); setUploadedSignature(null); setSignTab("draw"); setSignTypeText(""); setActiveTool("select");
  }

  function handleSignUpload(file: File | null) {
    if (!file || !file.type.startsWith("image/")) return;
    const r = new FileReader(); r.onload = (e) => setUploadedSignature(e.target?.result as string); r.readAsDataURL(file);
  }

  async function placeNote() {
    if (!fabricRef.current || !pendingNotePos || !noteText.trim()) return;
    const { fabric } = await import("fabric"); pushUndo();
    const fc = fabricRef.current;
    const bg = new fabric.Rect({ width: 160, height: 80, fill: "#fef08a", stroke: "#ca8a04", strokeWidth: 1, rx: 4, shadow: "2px 2px 4px rgba(0,0,0,0.2)" });
    const txt = new fabric.Textbox(noteText, { width: 148, fontSize: 12, fill: "#1e293b", fontFamily: "Arial", left: 6, top: 6 });
    fc.add(new fabric.Group([bg, txt], { left: pendingNotePos.x, top: pendingNotePos.y }));
    fc.renderAll(); setShowNoteModal(false); setNoteText(""); setActiveTool("select");
  }

  async function placeLink() {
    if (!fabricRef.current || !pendingLinkPos || !linkUrl.trim()) return;
    const { fabric } = await import("fabric"); pushUndo();
    const t = new (fabric as any).IText(linkText || linkUrl, { left: pendingLinkPos.x, top: pendingLinkPos.y, fontSize: fontSizeRef.current, fill: "#2563eb", fontFamily: fontFamilyRef.current, underline: true });
    (t as any).url = linkUrl;
    fabricRef.current.add(t); fabricRef.current.renderAll();
    setShowLinkModal(false); setLinkUrl("https://"); setLinkText("Click here"); setActiveTool("select");
  }

  async function confirmTextEdit() {
    if (!editingText || !fabricRef.current) return;
    const { fabric } = await import("fabric"); const fc = fabricRef.current; pushUndo();
    fc.add(new fabric.Rect({ left: editingText.x, top: editingText.y, width: Math.max(editingText.w + 20, editingText.value.length * editingText.fontSize * 0.65), height: editingText.h + 6, fill: "white", selectable: false, evented: false }));
    const t = new fabric.IText(editingText.value, { left: editingText.x, top: editingText.y + 1, fontSize: editingText.fontSize, fill: colorRef.current, fontFamily: fontFamilyRef.current });
    fc.add(t); fc.setActiveObject(t); fc.renderAll(); setEditingText(null); setActiveTool("select");
  }

  function changePage(newPage: number) {
    const p = Math.max(1, Math.min(totalPages, newPage));
    if (p === currentPage) return;
    if (fabricRef.current) pageStates.current[currentPage] = JSON.stringify(fabricRef.current.toJSON());
    setCurrentPage(p);
  }

  async function savePdf() {
    if (!fileBytes.current || !pdfDoc) return;
    const allowed = await checkLimit(); if (!allowed) return;
    if (fabricRef.current) pageStates.current[currentPage] = JSON.stringify(fabricRef.current.toJSON());
    setSaving(true);
    try {
      const pdfLibDoc = await PDFDocument.load(fileBytes.current);
      const { fabric } = await import("fabric");
      for (const [pgStr, stateJson] of Object.entries(pageStates.current)) {
        const pgNum = Number(pgStr); const state = JSON.parse(stateJson);
        if (!state.objects?.length) continue;
        const pdfPage = await pdfDoc.getPage(pgNum);
        const vp = pdfPage.getViewport({ scale });
        const el = document.createElement("canvas"); el.width = vp.width; el.height = vp.height;
        const tempFc = new fabric.StaticCanvas(el, { width: vp.width, height: vp.height });
        await new Promise<void>(res => { tempFc.loadFromJSON(state, () => { tempFc.renderAll(); res(); }); });
        const b64 = el.toDataURL("image/png").split(",")[1];
        const bin = atob(b64); const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const img = await pdfLibDoc.embedPng(bytes);
        const libPage = pdfLibDoc.getPage(pgNum - 1);
        const { width, height } = libPage.getSize();
        libPage.drawImage(img, { x: 0, y: 0, width, height });
        tempFc.dispose();
      }
      const blob = new Blob([await pdfLibDoc.save()], { type: "application/pdf" });
      await recordUsage(file?.name, file?.size);
      Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `edited-${file!.name}` }).click();
    } finally { setSaving(false); }
  }

  const toolCursor = (t: ToolType) => {
    if (t === "move") return "grab";
    if (t === "addtext" || t === "edittext") return "text";
    if (t === "draw" || t === "highlight" || t === "texthighlight" || t === "eraser") return "crosshair";
    if (t === "stamp" || t === "note" || t === "link") return "cell";
    if (t === "rect" || t === "circle" || t === "arrow") return "crosshair";
    return "default";
  };

  // ── Tool button component ──
  const TB = ({ id, icon, tip, onClick, active }: { id?: ToolType; icon: React.ReactNode; tip: string; onClick?: () => void; active?: boolean }) => (
    <button
      onClick={onClick ?? (() => id && setActiveTool(id))}
      title={tip}
      className={cn(
        "w-8 h-8 flex items-center justify-center rounded-lg transition-all",
        (active ?? (id && activeTool === id))
          ? "bg-red-600 text-white shadow-sm"
          : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
      )}
    >
      <span className="w-4 h-4 flex items-center justify-center">{icon}</span>
    </button>
  );

  const Sep = () => <div className="w-px h-6 bg-gray-300 mx-1" />;

  // ── DROPZONE ──
  if (!file) {
    return (
      <label
        className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-20 cursor-pointer hover:border-red-300 hover:bg-red-50/30 transition-all group"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); loadFile(e.dataTransfer.files?.[0] ?? null); }}
      >
        <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center mb-5 group-hover:bg-red-100 transition-colors">
          <Upload className="w-9 h-9 text-red-500" />
        </div>
        <p className="font-bold text-gray-800 text-xl mb-1">Open PDF to Edit</p>
        <p className="text-sm text-gray-400">Click or drag & drop a PDF file here</p>
        {error && <p className="mt-3 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>}
        <input type="file" accept="application/pdf" className="hidden" onChange={(e) => loadFile(e.target.files?.[0] ?? null)} />
      </label>
    );
  }

  const isDrawTool = activeTool === "draw";
  const isHighlightTool = activeTool === "highlight" || activeTool === "texthighlight";

  return (
    <div className="flex flex-col bg-[#e8e8e8] rounded-xl overflow-hidden border border-gray-300" style={{ height: "calc(100vh - 140px)", minHeight: 560 }}>

      {/* ══════════════════════════════════════
          TOOLBAR  — Adobe-style compact ribbon
          ══════════════════════════════════════ */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-[#f2f2f2] border-b border-gray-300 flex-nowrap overflow-x-auto">

        {/* Sidebar toggles */}
        <TB icon={<PanelLeft className="w-4 h-4" />} tip="Page thumbnails" onClick={() => setSidebarOpen(o => !o)} active={sidebarOpen} />
        <TB icon={<PanelRight className="w-4 h-4" />} tip="Properties panel" onClick={() => setRightPanelOpen(o => !o)} active={rightPanelOpen} />
        <Sep />

        {/* History */}
        <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-200 disabled:opacity-30"><Undo className="w-4 h-4" /></button>
        <button onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)" className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-200 disabled:opacity-30"><Redo className="w-4 h-4" /></button>
        <Sep />

        {/* Selection */}
        <TB id="select" icon={<MousePointer className="w-4 h-4" />} tip="Select (click to select objects)" />
        <TB id="move" icon={<Hand className="w-4 h-4" />} tip="Move (drag objects)" />
        <Sep />

        {/* Text */}
        <TB id="addtext" icon={<Type className="w-4 h-4" />} tip="Add text" />
        <TB id="edittext" icon={<PenLine className="w-4 h-4" />} tip="Edit existing PDF text" />

        {/* Sign */}
        <button title="Add signature" onClick={() => { setShowSignModal(true); setActiveTool("sign"); }}
          className={cn("w-8 h-8 flex items-center justify-center rounded-lg transition-all", activeTool === "sign" ? "bg-red-600 text-white" : "text-gray-600 hover:bg-gray-200")}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 17c3-4 5-7 7-7s2 4 4 4 3-3 5-5"/><path d="M19 17h2"/></svg>
        </button>
        <Sep />

        {/* Shapes */}
        <button onClick={() => addShape("line")} title="Line" className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-200"><Minus className="w-4 h-4" /></button>
        <TB id="arrow" icon={<ArrowUpRight className="w-4 h-4" />} tip="Arrow (drag to draw)" />
        <TB id="rect" icon={<Square className="w-4 h-4" />} tip="Rectangle (drag to draw)" />
        <TB id="circle" icon={<Circle className="w-4 h-4" />} tip="Ellipse (drag to draw)" />

        {/* Symbols dropdown */}
        <div className="relative">
          <button onClick={() => setShowAnnotationPicker(s => !s)} title="Annotation symbols"
            className={cn("w-8 h-8 flex items-center justify-center rounded-lg transition-all", showAnnotationPicker ? "bg-red-600 text-white" : "text-gray-600 hover:bg-gray-200")}>
            <Check className="w-4 h-4" />
          </button>
          {showAnnotationPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 w-44 py-1">
              {[{type:"crossmark" as const,icon:"✕",label:"Crossmark"},{type:"checkmark" as const,icon:"✓",label:"Checkmark"},{type:"dot" as const,icon:"●",label:"Dot"},{type:"circle" as const,icon:"○",label:"Circle"},{type:"crossout" as const,icon:"—",label:"Cross out"}].map(({type,icon,label}) => (
                <button key={type} onClick={() => { addAnnotation(type); setShowAnnotationPicker(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <span className="w-5 text-center font-bold text-gray-500">{icon}</span><span>{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <Sep />

        {/* Draw tools */}
        <TB id="draw" icon={<Pen className="w-4 h-4" />} tip="Freehand draw" />
        <TB id="eraser" icon={<Eraser className="w-4 h-4" />} tip="Eraser (white paint)" />
        <TB id="highlight" icon={<Highlighter className="w-4 h-4" />} tip="Area highlight" />
        <TB id="texthighlight" icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="14" width="18" height="4" rx="1" fill="#fde047" stroke="#ca8a04"/><path d="M7 14V7l5-3 5 3v7"/><path d="M10 14v-4h4v4"/></svg>} tip="Text highlight" />
        <Sep />

        {/* Insert */}
        <label title="Insert image" className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-200 cursor-pointer">
          <ImageIcon className="w-4 h-4" />
          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && addImage(e.target.files[0])} />
        </label>
        <div className="relative">
          <button onClick={() => setShowStampPicker(s => !s)} title="Stamp"
            className={cn("w-8 h-8 flex items-center justify-center rounded-lg transition-all", activeTool === "stamp" ? "bg-red-600 text-white" : "text-gray-600 hover:bg-gray-200")}>
            <Stamp className="w-4 h-4" />
          </button>
          {showStampPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl p-2 z-50 w-40">
              {STAMPS.map(s => <button key={s} onClick={() => { setPendingStamp(s); setActiveTool("stamp"); setShowStampPicker(false); }} className="w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-gray-50 rounded-lg">{s}</button>)}
            </div>
          )}
        </div>
        <TB id="link" icon={<Link className="w-4 h-4" />} tip="Insert link" />
        <TB id="note" icon={<StickyNote className="w-4 h-4" />} tip="Sticky note" />
        <Sep />

        {/* Object actions */}
        <button onClick={deleteSelected} title="Delete (Del)" className="w-8 h-8 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50"><X className="w-4 h-4" /></button>
        <button onClick={duplicateSelected} title="Duplicate (Ctrl+D)" className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-200"><Copy className="w-4 h-4" /></button>
        <button onClick={bringForward} title="Bring forward" className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-200"><BringToFront className="w-4 h-4" /></button>
        <button onClick={sendBackward} title="Send backward" className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-200"><SendToBack className="w-4 h-4" /></button>

        {/* Right — color + formatting + file info + save */}
        <div className="ml-auto flex items-center gap-2">
          {/* Color picker */}
          <label className="cursor-pointer flex items-center gap-1.5 group" title="Stroke / text color">
            <div className="w-5 h-5 rounded border-2 border-white shadow-sm ring-1 ring-gray-300 group-hover:ring-gray-400 transition-all" style={{ backgroundColor: color }} />
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="sr-only" />
          </label>

          {/* Highlight preset when highlight active */}
          {isHighlightTool && (
            <div className="flex gap-1">
              {HIGHLIGHT_PRESETS.map(({ color: hc, label }) => (
                <button key={hc} title={label} onClick={() => setHighlightColor(hc)}
                  className={cn("w-5 h-5 rounded border-2 transition-all", highlightColor === hc ? "border-gray-700 scale-110" : "border-white hover:border-gray-400")}
                  style={{ backgroundColor: hc.replace("66","cc").replace("55","cc") }} />
              ))}
            </div>
          )}

          {/* Pen width when draw/shape active */}
          {(isDrawTool || activeTool === "rect" || activeTool === "circle" || activeTool === "arrow" || activeTool === "line") && (
            <div className="flex items-center gap-1.5">
              <input type="range" min={1} max={20} value={penWidth} onChange={(e) => setPenWidth(Number(e.target.value))} className="w-16 accent-red-600" />
              <span className="text-xs text-gray-600 w-4">{penWidth}</span>
            </div>
          )}

          <Sep />
          <span className="text-xs text-gray-400 hidden lg:block">{formatBytes(file.size)}</span>
          <button onClick={() => { setFile(null); setPdfDoc(null); }} className="text-xs text-gray-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors">Change</button>
          <button onClick={savePdf} disabled={saving || !pdfDoc}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 disabled:opacity-50 whitespace-nowrap shadow-sm">
            <Download className="w-3.5 h-3.5" />{saving ? "Saving..." : "Save PDF"}
          </button>
        </div>
      </div>

      {/* edittext hint */}
      {activeTool === "edittext" && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-50 border-b border-amber-200 text-xs text-amber-700">
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" /></svg>
          Hover over PDF text to highlight it, then click to edit. <kbd className="bg-amber-100 px-1 rounded mx-1">Enter</kbd> save · <kbd className="bg-amber-100 px-1 rounded">Esc</kbd> cancel
        </div>
      )}

      {/* ══════════════════════════════════════
          BODY — sidebar | canvas | properties
          ══════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: Page thumbnails ── */}
        {sidebarOpen && (
          <div className="w-28 flex-shrink-0 bg-[#d8d8d8] border-r border-gray-400 overflow-y-auto py-3 px-2 space-y-2">
            {loadingPdf
              ? <p className="text-xs text-center text-gray-500 pt-8">Loading...</p>
              : thumbnails.map((thumb, i) => (
                <button key={i} onClick={() => changePage(i + 1)}
                  className={cn("w-full rounded-lg overflow-hidden border-2 transition-all bg-white shadow-sm",
                    currentPage === i + 1 ? "border-red-500 shadow-md" : "border-transparent hover:border-gray-400")}>
                  <img src={thumb} alt={`Page ${i + 1}`} className="w-full block" />
                  <p className={cn("text-center text-[10px] py-0.5 font-semibold", currentPage === i + 1 ? "text-red-600" : "text-gray-500")}>{i + 1}</p>
                </button>
              ))
            }
          </div>
        )}

        {/* ── Centre: PDF Canvas ── */}
        <div ref={canvasScrollRef} className="flex-1 overflow-auto bg-[#808080] flex justify-center items-start p-8 relative">
          {loadingPdf && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-[#808080]/80">
              <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-white">Loading PDF...</p>
            </div>
          )}
          <div className="relative inline-block" style={{ cursor: toolCursor(activeTool), boxShadow: "0 4px 32px rgba(0,0,0,0.45)" }}>
            <canvas ref={pdfCanvasRef} className="block" />
            <div ref={fabricContainerRef} className="absolute top-0 left-0" />

            {/* Text edit overlay */}
            {activeTool === "edittext" && pageViewport && pageTextItems.map((item: any, i: number) => {
              if (!("str" in item) || !item.str.trim()) return null;
              const tx = item.transform;
              const [x, rawY] = pageViewport.convertToViewportPoint(tx[4], tx[5]);
              const fsize = Math.abs(tx[3]) * pageViewport.scale;
              const h = fsize + 4; const w = (item.width ?? 0) * pageViewport.scale; const y = rawY - h;
              return (
                <div key={i} onClick={() => setEditingText({ item, x, y, w: Math.max(w, 20), h, fontSize: Math.max(fsize, 8), value: item.str })}
                  className="absolute hover:bg-blue-300/30 hover:border hover:border-blue-400 rounded cursor-text transition-colors"
                  style={{ left: x, top: y, width: Math.max(w, 10), height: h }} title={item.str} />
              );
            })}

            {/* Inline editor */}
            {editingText && activeTool === "edittext" && (
              <div className="absolute z-50" style={{ left: editingText.x, top: editingText.y }}>
                <input autoFocus value={editingText.value}
                  onChange={e => setEditingText(p => p ? { ...p, value: e.target.value } : null)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); confirmTextEdit(); } if (e.key === "Escape") setEditingText(null); }}
                  style={{ fontSize: editingText.fontSize, fontFamily, color, minWidth: Math.max(editingText.w, 60), height: editingText.h + 4, padding: "0 3px", background: "white", border: "2px solid #3b82f6", borderRadius: 3, outline: "none", boxShadow: "0 2px 8px rgba(59,130,246,0.3)" }}
                />
                <div className="flex gap-1 mt-1">
                  <button onClick={confirmTextEdit} className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded"><Check className="w-3 h-3 inline" /> OK</button>
                  <button onClick={() => setEditingText(null)} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════
            RIGHT PANEL — Properties Inspector
            ══════════════════════════════════════ */}
        {rightPanelOpen && (
          <div className="w-56 flex-shrink-0 bg-white border-l border-gray-300 overflow-y-auto flex flex-col">

            {/* Panel header */}
            <div className="px-3 py-2.5 border-b border-gray-200 bg-[#f7f7f7]">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Properties</p>
            </div>

            {/* No selection */}
            {selectedType === "none" && (
              <div className="flex-1 flex flex-col items-center justify-center px-4 text-center gap-3 py-8">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <MousePointer className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">Select an object on the PDF to see and edit its properties here.</p>
              </div>
            )}

            {/* ── Text properties ── */}
            {selectedType === "text" && (
              <div className="p-3 space-y-4">
                <Section label="Font">
                  <select value={objFontFamily} onChange={e => { setObjFontFamily(e.target.value); applyToObj({ fontFamily: e.target.value }); }}
                    className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-red-400">
                    {FONTS.map(f => <option key={f}>{f}</option>)}
                  </select>
                  <div className="flex gap-2 mt-2">
                    <input type="number" min={6} max={120} value={objFontSize}
                      onChange={e => { const v = Number(e.target.value); setObjFontSize(v); applyToObj({ fontSize: v }); }}
                      className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-400" />
                    <span className="text-xs text-gray-400 self-center">pt</span>
                  </div>
                </Section>

                <Section label="Style">
                  <div className="flex gap-1">
                    {[
                      { label: <Bold className="w-3.5 h-3.5" />, active: objBold, tip: "Bold", onClick: () => { const n = !objBold; setObjBold(n); applyToObj({ fontWeight: n ? "bold" : "normal" }); } },
                      { label: <Italic className="w-3.5 h-3.5" />, active: objItalic, tip: "Italic", onClick: () => { const n = !objItalic; setObjItalic(n); applyToObj({ fontStyle: n ? "italic" : "normal" }); } },
                      { label: <Underline className="w-3.5 h-3.5" />, active: objUnderline, tip: "Underline", onClick: () => { const n = !objUnderline; setObjUnderline(n); applyToObj({ underline: n }); } },
                    ].map((btn, i) => (
                      <button key={i} title={btn.tip} onClick={btn.onClick}
                        className={cn("flex-1 py-1.5 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors",
                          btn.active ? "bg-red-100 text-red-700 border border-red-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
                        {btn.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1 mt-1">
                    {(["left","center","right"] as const).map(align => {
                      const Icon = align === "left" ? AlignLeft : align === "center" ? AlignCenter : AlignRight;
                      return (
                        <button key={align} title={`Align ${align}`} onClick={() => { setObjAlign(align); applyToObj({ textAlign: align }); }}
                          className={cn("flex-1 py-1.5 flex items-center justify-center rounded-lg transition-colors",
                            objAlign === align ? "bg-red-100 text-red-700 border border-red-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
                          <Icon className="w-3.5 h-3.5" />
                        </button>
                      );
                    })}
                  </div>
                </Section>

                <Section label="Color">
                  <ColorRow label="Text" value={objColor} onChange={v => { setObjColor(v); applyToObj({ fill: v }); }} />
                </Section>

                <Section label="Opacity">
                  <OpacityRow value={objOpacity} onChange={v => { setObjOpacity(v); applyToObj({ opacity: v / 100 }); }} />
                </Section>
              </div>
            )}

            {/* ── Shape properties ── */}
            {(selectedType === "shape" || selectedType === "group") && (
              <div className="p-3 space-y-4">
                <Section label="Stroke">
                  <ColorRow label="Color" value={objStroke} onChange={v => { setObjStroke(v); applyToObj({ stroke: v }); }} />
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-500 w-16 shrink-0">Width</span>
                    <input type="range" min={1} max={20} value={objStrokeWidth}
                      onChange={e => { const v = Number(e.target.value); setObjStrokeWidth(v); applyToObj({ strokeWidth: v }); }}
                      className="flex-1 accent-red-600" />
                    <span className="text-xs text-gray-600 w-4">{objStrokeWidth}</span>
                  </div>
                </Section>

                {selectedType === "shape" && (
                  <Section label="Fill">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={objHasFill} onChange={e => { setObjHasFill(e.target.checked); applyToObj({ fill: e.target.checked ? objFill : "transparent" }); }} className="accent-red-600" />
                      <span className="text-xs text-gray-600">Enable fill</span>
                    </label>
                    {objHasFill && <ColorRow label="Color" value={objFill} onChange={v => { setObjFill(v); applyToObj({ fill: v }); }} />}
                  </Section>
                )}

                <Section label="Opacity">
                  <OpacityRow value={objOpacity} onChange={v => { setObjOpacity(v); applyToObj({ opacity: v / 100 }); }} />
                </Section>
              </div>
            )}

            {/* ── Image properties ── */}
            {selectedType === "image" && (
              <div className="p-3 space-y-4">
                <Section label="Opacity">
                  <OpacityRow value={objOpacity} onChange={v => { setObjOpacity(v); applyToObj({ opacity: v / 100 }); }} />
                </Section>
                <p className="text-xs text-gray-400 text-center pt-2">Drag corners to resize the image</p>
              </div>
            )}

            {/* ── Path (freehand draw) properties ── */}
            {selectedType === "path" && (
              <div className="p-3 space-y-4">
                <Section label="Stroke">
                  <ColorRow label="Color" value={objColor} onChange={v => { setObjColor(v); applyToObj({ stroke: v }); }} />
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-500 w-16 shrink-0">Width</span>
                    <input type="range" min={1} max={20} value={objStrokeWidth}
                      onChange={e => { const v = Number(e.target.value); setObjStrokeWidth(v); applyToObj({ strokeWidth: v }); }}
                      className="flex-1 accent-red-600" />
                    <span className="text-xs text-gray-600 w-4">{objStrokeWidth}</span>
                  </div>
                </Section>
                <Section label="Opacity">
                  <OpacityRow value={objOpacity} onChange={v => { setObjOpacity(v); applyToObj({ opacity: v / 100 }); }} />
                </Section>
              </div>
            )}

            {/* Common actions at the bottom */}
            {selectedType !== "none" && (
              <div className="mt-auto border-t border-gray-200 p-3 space-y-1.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Actions</p>
                <button onClick={duplicateSelected} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                  <Copy className="w-3.5 h-3.5" /> Duplicate
                </button>
                <button onClick={bringForward} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                  <BringToFront className="w-3.5 h-3.5" /> Bring Forward
                </button>
                <button onClick={sendBackward} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                  <SendToBack className="w-3.5 h-3.5" /> Send Backward
                </button>
                <button onClick={deleteSelected} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <X className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════
          STATUS BAR — page nav + zoom + fit
          ══════════════════════════════════════ */}
      <div className="flex items-center gap-3 px-4 py-1.5 bg-[#f2f2f2] border-t border-gray-300 text-xs text-gray-600 flex-nowrap">

        {/* Page navigation */}
        {totalPages > 0 && (
          <div className="flex items-center gap-1.5">
            <button onClick={() => changePage(currentPage - 1)} disabled={currentPage <= 1}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-300 disabled:opacity-30 transition-colors">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-medium px-1">Page {currentPage} of {totalPages}</span>
            <button onClick={() => changePage(currentPage + 1)} disabled={currentPage >= totalPages}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-300 disabled:opacity-30 transition-colors">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="w-px h-4 bg-gray-300 mx-1" />

        {/* Zoom controls */}
        <div className="flex items-center gap-1.5">
          <button onClick={() => setScale(s => Math.max(0.25, +(s - 0.25).toFixed(2)))} title="Zoom out"
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-300 transition-colors">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <input type="range" min={25} max={300} value={Math.round(scale * 100)}
            onChange={e => setScale(Number(e.target.value) / 100)}
            className="w-24 accent-red-600" />
          <button onClick={() => setScale(s => Math.min(3, +(s + 0.25).toFixed(2)))} title="Zoom in"
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-300 transition-colors">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { const v = prompt("Zoom %", String(Math.round(scale * 100))); if (v) { const n = parseInt(v); if (n >= 10 && n <= 400) setScale(n / 100); } }}
            className="w-12 text-center font-medium hover:bg-gray-300 rounded px-1 py-0.5 transition-colors">
            {Math.round(scale * 100)}%
          </button>
        </div>

        <div className="w-px h-4 bg-gray-300 mx-1" />

        {/* Fit buttons */}
        <button onClick={fitToWidth} title="Fit to width" className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-gray-300 transition-colors">
          <Maximize2 className="w-3 h-3" /> Fit Width
        </button>
        <button onClick={() => setScale(1.0)} title="Actual size (100%)" className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-gray-300 transition-colors">
          100%
        </button>

        {/* Tool hint on right */}
        <span className="ml-auto text-gray-400 hidden md:block truncate max-w-xs">
          {activeTool === "addtext" && "Click canvas to place text"}
          {activeTool === "edittext" && "Click existing text to edit"}
          {activeTool === "select" && "Click to select · Del to delete · Ctrl+D to duplicate"}
          {activeTool === "draw" && "Hold & drag to draw"}
          {activeTool === "highlight" && "Drag to highlight area"}
          {activeTool === "texthighlight" && "Drag over text"}
          {activeTool === "eraser" && "Drag to erase"}
          {activeTool === "move" && "Drag to reposition objects"}
          {activeTool === "rect" && "Click & drag to draw rectangle"}
          {activeTool === "circle" && "Click & drag to draw ellipse"}
          {activeTool === "arrow" && "Click & drag to draw arrow"}
          {activeTool === "stamp" && `Click to place: ${pendingStamp}`}
          {activeTool === "note" && "Click to place sticky note"}
          {activeTool === "link" && "Click to insert hyperlink"}
        </span>
      </div>

      {/* ══ SIGN MODAL ══ */}
      {showSignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-bold text-gray-900">Add Signature</h3>
              <button onClick={() => { setShowSignModal(false); setActiveTool("select"); setUploadedSignature(null); setSignTab("draw"); setSignTypeText(""); }} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex border-b">
              {(["draw","type","upload"] as const).map(tab => (
                <button key={tab} onClick={() => setSignTab(tab)}
                  className={cn("flex-1 py-3 text-sm font-medium capitalize transition-colors", signTab === tab ? "text-red-600 border-b-2 border-red-600" : "text-gray-500 hover:text-gray-700")}>
                  {tab === "draw" ? "Draw" : tab === "type" ? "Type" : "Upload"}
                </button>
              ))}
            </div>
            <div className="p-5">
              {signTab === "draw" && (
                <>
                  <canvas ref={signCanvasRef} width={420} height={160}
                    className="w-full border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 touch-none cursor-crosshair"
                    onMouseDown={signStart} onMouseMove={signMove} onMouseUp={signEnd} onMouseLeave={signEnd}
                    onTouchStart={signStart} onTouchMove={signMove} onTouchEnd={signEnd} />
                  <p className="text-xs text-gray-400 text-center mt-2">Draw your signature above</p>
                </>
              )}
              {signTab === "type" && (
                <div className="space-y-4">
                  <input type="text" placeholder="Type your name..." value={signTypeText} onChange={e => setSignTypeText(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
                  {signTypeText && (
                    <div className="border border-gray-200 rounded-xl bg-gray-50 p-4 flex items-center justify-center h-24">
                      <span style={{ fontFamily: "Georgia, serif", fontSize: 34, fontStyle: "italic", color: "#1e293b" }}>{signTypeText}</span>
                    </div>
                  )}
                </div>
              )}
              {signTab === "upload" && (
                uploadedSignature ? (
                  <div className="space-y-3">
                    <div className="border border-gray-200 rounded-xl bg-gray-50 p-3 flex items-center justify-center h-40">
                      <img src={uploadedSignature} alt="Signature" className="max-h-full max-w-full object-contain" />
                    </div>
                    <label className="block w-full py-2 text-center text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 cursor-pointer">
                      Change image <input type="file" accept="image/*" className="hidden" onChange={e => handleSignUpload(e.target.files?.[0] ?? null)} />
                    </label>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl h-40 cursor-pointer hover:border-red-300 hover:bg-red-50 transition-colors">
                    <Upload className="w-8 h-8 text-gray-300 mb-2" />
                    <span className="text-sm text-gray-500">Upload signature image</span>
                    <span className="text-xs text-gray-400 mt-1">PNG, JPG, SVG</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleSignUpload(e.target.files?.[0] ?? null)} />
                  </label>
                )
              )}
            </div>
            <div className="flex gap-2 px-5 pb-5">
              {signTab === "draw" && <button onClick={signClear} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Clear</button>}
              <button onClick={signPlace} disabled={(signTab === "upload" && !uploadedSignature) || (signTab === "type" && !signTypeText.trim())}
                className="flex-1 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-40">
                <Check className="w-4 h-4 inline mr-1" /> Place Signature
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ NOTE MODAL ══ */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-bold text-gray-900">Sticky Note</h3>
              <button onClick={() => setShowNoteModal(false)} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5">
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={4} placeholder="Write your note..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button onClick={() => setShowNoteModal(false)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={placeNote} disabled={!noteText.trim()} className="flex-1 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50">Place Note</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ LINK MODAL ══ */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-bold text-gray-900">Insert Link</h3>
              <button onClick={() => setShowLinkModal(false)} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">URL</label>
                <input type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Display text</label>
                <input type="text" value={linkText} onChange={e => setLinkText(e.target.value)} placeholder="Click here"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
              </div>
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button onClick={() => setShowLinkModal(false)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={placeLink} disabled={!linkUrl.trim()} className="flex-1 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50">Insert Link</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Small reusable panel sub-components ──
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{label}</p>
      {children}
    </div>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <div className="w-6 h-6 rounded-md border-2 border-gray-200 group-hover:border-gray-400 transition-colors shadow-sm" style={{ backgroundColor: value }} />
      <span className="text-xs text-gray-600 flex-1">{label}</span>
      <span className="text-xs text-gray-400 font-mono">{value.toUpperCase()}</span>
      <input type="color" value={value} onChange={e => onChange(e.target.value)} className="sr-only" />
    </label>
  );
}

function OpacityRow({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input type="range" min={5} max={100} value={value} onChange={e => onChange(Number(e.target.value))} className="flex-1 accent-red-600" />
      <span className="text-xs text-gray-600 w-8 text-right">{value}%</span>
    </div>
  );
}
