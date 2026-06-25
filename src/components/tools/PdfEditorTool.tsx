"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument } from "pdf-lib";
import {
  Pen, Highlighter, ImageIcon, Eraser, Download,
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Undo, Redo,
  MousePointer, Minus, Upload, PanelLeft, Type, PenLine,
  Stamp, Link, StickyNote, X, Check, Hand,
} from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import { useUsageLimit } from "@/hooks/useUsageLimit";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

// FIXED: minimal type alias for Fabric canvas/object — avoids bare `any` in function signatures
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FabricCanvas = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FabricObject = any;

type ToolType =
  | "select" | "move" | "addtext" | "edittext" | "sign"
  | "line" | "draw" | "eraser" | "highlight" | "texthighlight"
  | "image" | "stamp" | "link" | "note";

const STAMPS = ["APPROVED", "REJECTED", "DRAFT", "CONFIDENTIAL", "REVIEWED", "VOID"];

interface TextEditState {
  item: any;
  x: number; y: number;
  w: number; h: number;
  fontSize: number;
  value: string;
}

export default function PdfEditorTool() {
  const { checkLimit, recordUsage, status } = useUsageLimit("edit-pdf");

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
  const [loadingPdf, setLoadingPdf] = useState(false);

  // Stamp picker
  const [showStampPicker, setShowStampPicker] = useState(false);
  const [showAnnotationPicker, setShowAnnotationPicker] = useState(false);
  const [pendingStamp, setPendingStamp] = useState("");

  // Sign modal
  const [showSignModal, setShowSignModal] = useState(false);
  const [signTab, setSignTab] = useState<"draw" | "upload">("draw");
  const [uploadedSignature, setUploadedSignature] = useState<string | null>(null);
  const signCanvasRef = useRef<HTMLCanvasElement>(null);
  const signDrawing = useRef(false);
  const signLastPos = useRef({ x: 0, y: 0 });

  // Note modal
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [pendingNotePos, setPendingNotePos] = useState<{ x: number; y: number } | null>(null);

  // Link modal
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("https://");
  const [linkText, setLinkText] = useState("Click here");
  const [pendingLinkPos, setPendingLinkPos] = useState<{ x: number; y: number } | null>(null);

  // Pro text editing
  const [pageTextItems, setPageTextItems] = useState<any[]>([]);
  const [pageViewport, setPageViewport] = useState<any>(null);
  const [editingText, setEditingText] = useState<TextEditState | null>(null);

  // Undo/Redo stacks
  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const fabricContainerRef = useRef<HTMLDivElement>(null);
  // fabric is a dynamic import — any is intentional here (no static types available at module level)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fabricRef = useRef<any>(null);
  const fileBytes = useRef<ArrayBuffer | null>(null);
  const pageStates = useRef<Record<number, string>>({});

  const activeToolRef = useRef<ToolType>("select");
  const colorRef = useRef("#000000");
  const fontSizeRef = useRef(18);
  const fontFamilyRef = useRef("Arial");
  const pendingStampRef = useRef("");
  activeToolRef.current = activeTool;
  colorRef.current = color;
  fontSizeRef.current = fontSize;
  fontFamilyRef.current = fontFamily;
  pendingStampRef.current = pendingStamp;

  const pushUndo = useCallback(() => {
    if (!fabricRef.current) return;
    undoStack.current.push(JSON.stringify(fabricRef.current.toJSON()));
    redoStack.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, []);

  const loadFile = useCallback(async (f: File | null) => {
    if (!f || f.type !== "application/pdf") return;
    setError("");
    setLoadingPdf(true);
    setFile(f);
    setPdfDoc(null);
    setThumbnails([]);
    setCurrentPage(1);
    setTotalPages(0);
    pageStates.current = {};
    undoStack.current = [];
    redoStack.current = [];
    setCanUndo(false);
    setCanRedo(false);

    try {
      const bytes = await f.arrayBuffer();
      fileBytes.current = bytes.slice(0);
      const pdf = await pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;

      const thumbs: string[] = [];
      const thumbDpr = window.devicePixelRatio || 1;
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const vp = page.getViewport({ scale: 0.18 * thumbDpr });
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
      if (process.env.NODE_ENV === "development") console.error("PDF load error:", e); // FIXED: dev-only log
      setError("Failed to load PDF. Please try another file.");
      setFile(null);
      setLoadingPdf(false);
    }
  }, []);

  // Init canvas when page/scale/pdfDoc changes
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
        await page.render({
          canvasContext: ctx as any,
          viewport,
          canvas: pdfCanvas,
        }).promise;
        if (cancelled) return;

        // Extract text positions for Pro text editing
        try {
          const textContent = await page.getTextContent();
          setPageViewport(viewport);
          setPageTextItems(textContent.items.filter((i: any) => "str" in i && i.str.trim()));
        } catch { setPageTextItems([]); }
        setEditingText(null);

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
          enableRetinaScaling: true,
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
          const tool = activeToolRef.current;
          const pointer = fc.getPointer(opt.e);

          if (tool === "addtext") {
            const { fabric: f2 } = await import("fabric");
            pushUndo();
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
          } else if (tool === "edittext") {
            const target = opt.target;
            if (target && (target.type === "i-text" || target.type === "textbox" || target.type === "text")) {
              fc.setActiveObject(target);
              target.enterEditing?.();
              target.selectAll?.();
              fc.renderAll();
            }
          } else if (tool === "stamp" && pendingStampRef.current) {
            const stamp = pendingStampRef.current;
            const { fabric: f2 } = await import("fabric");
            pushUndo();

            // Draw stamp onto an offscreen canvas for authentic look
            const stampColors: Record<string, string> = {
              APPROVED: "#16a34a", REJECTED: "#dc2626", DRAFT: "#d97706",
              CONFIDENTIAL: "#7c3aed", REVIEWED: "#0284c7", VOID: "#64748b",
            };
            const col = stampColors[stamp] || "#dc2626";
            const pad = 18;
            const tmpC = document.createElement("canvas");
            const tmpCtx = tmpC.getContext("2d")!;
            const fnt = `bold 32px Arial`;
            tmpCtx.font = fnt;
            const tw = tmpCtx.measureText(stamp).width;
            const tw2 = tw + pad * 2;
            const th2 = 52;
            tmpC.width = tw2 + 6;
            tmpC.height = th2 + 6;
            const ctx2 = tmpC.getContext("2d")!;

            // Border rect
            ctx2.strokeStyle = col;
            ctx2.lineWidth = 4;
            ctx2.globalAlpha = 0.85;
            ctx2.beginPath();
            ctx2.roundRect(3, 3, tw2, th2, 6);
            ctx2.stroke();

            // Text
            ctx2.font = fnt;
            ctx2.fillStyle = col;
            ctx2.textAlign = "center";
            ctx2.textBaseline = "middle";
            ctx2.fillText(stamp, (tw2 + 6) / 2, (th2 + 6) / 2);

            const dataUrl = tmpC.toDataURL();
            f2.Image.fromURL(dataUrl, (img: any) => {
              img.set({
                left: pointer.x - img.width! / 2,
                top: pointer.y - img.height! / 2,
                angle: -20,
                opacity: 0.82,
              });
              fc.add(img);
              fc.setActiveObject(img);
              fc.renderAll();
            });

            setActiveTool("select");
            setPendingStamp("");
          } else if (tool === "note") {
            setPendingNotePos({ x: pointer.x, y: pointer.y });
            setNoteText("");
            setShowNoteModal(true);
          } else if (tool === "link") {
            setPendingLinkPos({ x: pointer.x, y: pointer.y });
            setShowLinkModal(true);
          }
        });

        fc.on("mouse:dblclick", (opt: any) => {
          const target = opt.target;
          if (target && (target.type === "i-text" || target.type === "textbox" || target.type === "text")) {
            fc.setActiveObject(target);
            target.enterEditing?.();
            fc.renderAll();
          }
        });

        fc.on("object:modified", () => pushUndo());
        fc.on("object:moving", (opt: any) => {
          // Show grabbing cursor while dragging
          if (activeToolRef.current === "move") {
            opt.target.canvas.setCursor("grabbing");
          }
        });
      } catch (e) {
        if (process.env.NODE_ENV === "development") console.error("Canvas init error:", e); // FIXED: dev-only log
      }
    }

    init();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfDoc, currentPage, scale]);

  useEffect(() => {
    if (fabricRef.current) applyTool(fabricRef.current, activeTool, color, fontSize);
  }, [activeTool, color, fontSize]);

  function applyTool(fc: FabricCanvas, tool: ToolType, col: string, _fsize: number) {
    fc.isDrawingMode = false;
    fc.selection = tool === "select" || tool === "edittext" || tool === "move";

    // Move tool: make every object draggable, lock rotation/scaling controls
    const objs = fc.getObjects();
    if (tool === "move") {
      objs.forEach((obj: any) => {
        obj.set({
          selectable: true,
          evented: true,
          lockRotation: false,
          lockScalingX: false,
          lockScalingY: false,
          hasControls: true,
          hasBorders: true,
        });
      });
      fc.defaultCursor = "grab";
      fc.hoverCursor = "grab";
      fc.moveCursor = "grabbing";
    } else {
      // Reset cursors for other tools
      fc.defaultCursor = "default";
      fc.hoverCursor = "move";
      fc.moveCursor = "move";
    }

    if (tool === "draw") {
      fc.isDrawingMode = true;
      fc.freeDrawingBrush.color = col;
      fc.freeDrawingBrush.width = 2;
    } else if (tool === "highlight" || tool === "texthighlight") {
      fc.isDrawingMode = true;
      fc.freeDrawingBrush.color = "#FFFF0066";
      fc.freeDrawingBrush.width = tool === "texthighlight" ? 14 : 22;
    } else if (tool === "eraser") {
      fc.isDrawingMode = true;
      fc.freeDrawingBrush.color = "#ffffff";
      fc.freeDrawingBrush.width = 20;
    }
    fc.renderAll();
  }

  function undo() {
    if (!fabricRef.current || undoStack.current.length === 0) return;
    try {
      const current = JSON.stringify(fabricRef.current.toJSON());
      redoStack.current.push(current);
      const prev = undoStack.current.pop()!;
      fabricRef.current.loadFromJSON(JSON.parse(prev), () => fabricRef.current.renderAll());
      setCanUndo(undoStack.current.length > 0);
      setCanRedo(true);
    } catch {
      undoStack.current = [];
      redoStack.current = [];
      setCanUndo(false);
      setCanRedo(false);
    }
  }

  function redo() {
    if (!fabricRef.current || redoStack.current.length === 0) return;
    try {
      const current = JSON.stringify(fabricRef.current.toJSON());
      undoStack.current.push(current);
      const next = redoStack.current.pop()!;
      fabricRef.current.loadFromJSON(JSON.parse(next), () => fabricRef.current.renderAll());
      setCanUndo(true);
      setCanRedo(redoStack.current.length > 0);
    } catch {
      undoStack.current = [];
      redoStack.current = [];
      setCanUndo(false);
      setCanRedo(false);
    }
  }

  function deleteSelected() {
    const fc = fabricRef.current;
    if (!fc) return;
    const active = fc.getActiveObjects();
    if (active.length === 0) return;
    pushUndo();
    active.forEach((obj: any) => fc.remove(obj));
    fc.discardActiveObject();
    fc.renderAll();
  }

  // Keyboard: Delete/Backspace removes selected objects
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      // Don't intercept when user is typing in an input/textarea
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        deleteSelected();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addShape(type: "line") {
    if (!fabricRef.current) return;
    const { fabric } = await import("fabric");
    const fc = fabricRef.current;
    pushUndo();
    const cx = fc.width / 2, cy = fc.height / 2;
    fc.add(new fabric.Line([cx - 80, cy, cx + 80, cy], { stroke: color, strokeWidth: 2 }));
    fc.renderAll();
    setActiveTool("select");
  }

  // Annotation symbols — placed at canvas centre, user can drag after
  async function addAnnotation(type: "crossmark" | "checkmark" | "dot" | "circle" | "crossout") {
    if (!fabricRef.current) return;
    const { fabric } = await import("fabric");
    const fc = fabricRef.current;
    pushUndo();
    const cx = fc.width / 2, cy = fc.height / 2;
    const col = color;
    let obj: FabricObject;

    switch (type) {
      case "crossmark": {
        const s = 20;
        const l1 = new fabric.Line([0, 0, s * 2, s * 2], { stroke: col, strokeWidth: 3, strokeLineCap: "round" });
        const l2 = new fabric.Line([s * 2, 0, 0, s * 2], { stroke: col, strokeWidth: 3, strokeLineCap: "round" });
        obj = new fabric.Group([l1, l2], { left: cx - s, top: cy - s });
        break;
      }
      case "checkmark": {
        const pts = [
          { x: 0, y: 12 }, { x: 8, y: 22 }, { x: 26, y: 0 },
        ];
        const poly = new fabric.Polyline(pts, {
          stroke: col, strokeWidth: 3, fill: "transparent",
          strokeLineCap: "round", strokeLineJoin: "round",
        });
        obj = new fabric.Group([poly], { left: cx - 13, top: cy - 11 });
        break;
      }
      case "dot": {
        obj = new fabric.Circle({ radius: 8, fill: col, left: cx - 8, top: cy - 8 });
        break;
      }
      case "circle": {
        obj = new fabric.Ellipse({
          rx: 40, ry: 18,
          fill: "transparent", stroke: col, strokeWidth: 2,
          left: cx - 40, top: cy - 18,
        });
        break;
      }
      case "crossout": {
        obj = new fabric.Line([cx - 60, cy, cx + 60, cy], {
          stroke: col, strokeWidth: 2, strokeLineCap: "round",
        });
        break;
      }
    }

    if (obj) {
      fc.add(obj);
      fc.setActiveObject(obj);
      fc.renderAll();
      setActiveTool("move");
    }
  }

  async function addImage(f: File) {
    if (!fabricRef.current) return;
    const { fabric } = await import("fabric");
    pushUndo();
    fabric.Image.fromURL(URL.createObjectURL(f), (img: any) => {
      img.scaleToWidth(Math.min(200, fabricRef.current.width * 0.4));
      fabricRef.current.add(img);
      fabricRef.current.setActiveObject(img);
      fabricRef.current.renderAll();
      setActiveTool("select");
    });
  }

  // Sign: draw on sign canvas
  function signStart(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    signDrawing.current = true;
    const canvas = signCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    signLastPos.current = { x: clientX - rect.left, y: clientY - rect.top };
  }
  function signMove(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!signDrawing.current) return;
    e.preventDefault();
    const canvas = signCanvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left, y = clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(signLastPos.current.x, signLastPos.current.y);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
    signLastPos.current = { x, y };
  }
  function signEnd() { signDrawing.current = false; }
  function signClear() {
    const canvas = signCanvasRef.current!;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
  }
  async function signPlace() {
    if (!fabricRef.current) return;
    const dataUrl = signTab === "upload" && uploadedSignature
      ? uploadedSignature
      : signCanvasRef.current!.toDataURL("image/png");
    const { fabric } = await import("fabric");
    pushUndo();
    fabric.Image.fromURL(dataUrl, (img: any) => {
      img.scaleToWidth(160);
      img.set({ left: 100, top: 100 });
      fabricRef.current.add(img);
      fabricRef.current.setActiveObject(img);
      fabricRef.current.renderAll();
    });
    setShowSignModal(false);
    setUploadedSignature(null);
    setSignTab("draw");
    setActiveTool("select");
  }

  function handleSignUpload(file: File | null) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setUploadedSignature(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  // Note: place sticky note
  async function placeNote() {
    if (!fabricRef.current || !pendingNotePos || !noteText.trim()) return;
    const { fabric } = await import("fabric");
    pushUndo();
    const fc = fabricRef.current;
    const bg = new fabric.Rect({ width: 160, height: 80, fill: "#fef08a", stroke: "#ca8a04", strokeWidth: 1, rx: 4, shadow: "2px 2px 4px rgba(0,0,0,0.2)" });
    const txt = new fabric.Textbox(noteText, { width: 148, fontSize: 12, fill: "#1e293b", fontFamily: "Arial", left: 6, top: 6 });
    const group = new fabric.Group([bg, txt], { left: pendingNotePos.x, top: pendingNotePos.y });
    fc.add(group);
    fc.renderAll();
    setShowNoteModal(false);
    setNoteText("");
    setActiveTool("select");
  }

  // Link: place clickable text
  async function placeLink() {
    if (!fabricRef.current || !pendingLinkPos || !linkUrl.trim()) return;
    const { fabric } = await import("fabric");
    pushUndo();
    const t = new (fabric as any).IText(linkText || linkUrl, {
      left: pendingLinkPos.x, top: pendingLinkPos.y,
      fontSize: fontSizeRef.current,
      fill: "#2563eb",
      fontFamily: fontFamilyRef.current,
      underline: true,
    });
    (t as any).url = linkUrl;
    fabricRef.current.add(t);
    fabricRef.current.renderAll();
    setShowLinkModal(false);
    setLinkUrl("https://");
    setLinkText("Click here");
    setActiveTool("select");
  }

  async function confirmTextEdit() {
    if (!editingText || !fabricRef.current) return;
    const { fabric } = await import("fabric");
    const fc = fabricRef.current;
    pushUndo();
    // White rect to cover original text
    fc.add(new fabric.Rect({
      left: editingText.x,
      top: editingText.y,
      width: Math.max(editingText.w + 20, editingText.value.length * editingText.fontSize * 0.65),
      height: editingText.h + 6,
      fill: "white",
      selectable: false,
      evented: false,
    }));
    // New editable text on top
    const t = new fabric.IText(editingText.value, {
      left: editingText.x,
      top: editingText.y + 1,
      fontSize: editingText.fontSize,
      fill: colorRef.current,
      fontFamily: fontFamilyRef.current,
    });
    fc.add(t);
    fc.setActiveObject(t);
    fc.renderAll();
    setEditingText(null);
    setActiveTool("select");
  }

  function changePage(newPage: number) {
    const p = Math.max(1, Math.min(totalPages, newPage));
    if (p === currentPage) return;
    if (fabricRef.current) pageStates.current[currentPage] = JSON.stringify(fabricRef.current.toJSON());
    setCurrentPage(p);
  }

  async function savePdf() {
    if (!fileBytes.current || !pdfDoc) return;
    const allowed = await checkLimit();
    if (!allowed) return;
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

        const dataUrl = tempEl.toDataURL("image/png");
        const base64 = dataUrl.split(",")[1];
        const binary = atob(base64);
        const imgBytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) imgBytes[i] = binary.charCodeAt(i);
        const embImg = await pdfLibDoc.embedPng(imgBytes);
        const libPage = pdfLibDoc.getPage(pageNum - 1);
        const { width, height } = libPage.getSize();
        libPage.drawImage(embImg, { x: 0, y: 0, width, height });
        tempFc.dispose();
      }

      const blob = new Blob([await pdfLibDoc.save()], { type: "application/pdf" });
      await recordUsage(file?.name, file?.size);
      const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `edited-${file!.name}` });
      a.click();
    } finally {
      setSaving(false);
    }
  }

  const FONTS = ["Arial", "Times New Roman", "Courier New", "Georgia", "Verdana"];

  const toolCursor = (tool: ToolType) => {
    if (tool === "move") return "grab";
    if (tool === "addtext" || tool === "edittext") return "text";
    if (tool === "draw" || tool === "highlight" || tool === "texthighlight" || tool === "eraser") return "crosshair";
    if (tool === "stamp" || tool === "note" || tool === "link") return "cell";
    return "default";
  };

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
        <p className="font-semibold text-gray-800 text-lg">Open PDF file to edit</p>
        <p className="text-sm text-gray-400 mt-1">Click or drag PDF file here</p>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <input type="file" accept="application/pdf" className="hidden" onChange={(e) => loadFile(e.target.files?.[0] ?? null)} />
      </label>
    );
  }

  const TB = ({ id, icon, label, onClick }: { id?: ToolType; icon: React.ReactNode; label: string; onClick?: () => void }) => (
    <button
      onClick={onClick ?? (() => id && setActiveTool(id))}
      title={label}
      className={cn(
        "flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg transition-all min-w-[48px]",
        id && activeTool === id
          ? "bg-red-50 text-red-600"
          : "text-gray-600 hover:bg-gray-100"
      )}
    >
      <span className="w-5 h-5 flex items-center justify-center">{icon}</span>
      <span className="text-[10px] leading-none whitespace-nowrap font-medium">{label}</span>
    </button>
  );

  // ── EDITOR ──
  return (
    <div className="flex flex-col h-full bg-gray-100 rounded-xl overflow-hidden border border-gray-200">

      {/* ── Toolbar row 1 ── */}
      <div className="flex items-center gap-0.5 px-2 py-1 bg-white border-b border-gray-200 flex-wrap">
        {/* Sidebar toggle */}
        <button onClick={() => setSidebarOpen(o => !o)} title="Thumbnails"
          className={cn("flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg min-w-[48px]",
            sidebarOpen ? "bg-red-50 text-red-600" : "text-gray-600 hover:bg-gray-100")}>
          <PanelLeft className="w-5 h-5" />
          <span className="text-[10px] font-medium">Thumbnails</span>
        </button>

        <div className="w-px h-8 bg-gray-200 mx-1" />

        {/* Undo / Redo */}
        <button onClick={undo} disabled={!canUndo} title="Undo"
          className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30 min-w-[48px]">
          <Undo className="w-5 h-5" /><span className="text-[10px] font-medium">Undo</span>
        </button>
        <button onClick={redo} disabled={!canRedo} title="Redo"
          className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30 min-w-[48px]">
          <Redo className="w-5 h-5" /><span className="text-[10px] font-medium">Redo</span>
        </button>
        <button onClick={deleteSelected} title="Delete selected object (Delete)"
          className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-red-500 hover:bg-red-50 min-w-[48px]">
          <X className="w-5 h-5" /><span className="text-[10px] font-medium">Delete</span>
        </button>

        <div className="w-px h-8 bg-gray-200 mx-1" />

        <TB id="move" icon={<Hand className="w-5 h-5" />} label="Susun" />

        <div className="w-px h-8 bg-gray-200 mx-1" />

        <TB id="addtext" icon={<Type className="w-5 h-5" />} label="Add text" />
        <TB id="edittext" icon={<PenLine className="w-5 h-5" />} label="Edit text" />
        <TB id="select" icon={<MousePointer className="w-5 h-5" />} label="Select" />

        {/* Sign */}
        <TB id="sign" icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 17c3-4 5-7 7-7s2 4 4 4 3-3 5-5"/><path d="M19 17h2"/></svg>} label="Sign" onClick={() => { setShowSignModal(true); setActiveTool("sign"); }} />

        <div className="w-px h-8 bg-gray-200 mx-1" />

        {/* Line */}
        <button onClick={() => addShape("line")} title="Line"
          className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 min-w-[48px]">
          <Minus className="w-5 h-5" /><span className="text-[10px] font-medium">Line</span>
        </button>

        {/* Annotation symbols dropdown */}
        <div className="relative">
          <button onClick={() => setShowAnnotationPicker(s => !s)} title="Annotation symbols"
            className={cn("flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg min-w-[48px]",
              showAnnotationPicker ? "bg-red-50 text-red-600" : "text-gray-600 hover:bg-gray-100")}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
            <span className="text-[10px] font-medium">Symbols</span>
          </button>
          {showAnnotationPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-48 py-1 overflow-hidden">
              {[
                { type: "crossmark" as const, icon: "✕", label: "Crossmark" },
                { type: "checkmark" as const, icon: "✓", label: "Checkmark" },
                { type: "dot" as const, icon: "●", label: "Dot" },
                { type: "circle" as const, icon: "○", label: "Circle around" },
                { type: "crossout" as const, icon: "—", label: "Cross out" },
              ].map(({ type, icon, label }) => (
                <button key={type}
                  onClick={() => { addAnnotation(type); setShowAnnotationPicker(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <span className="w-6 text-center text-base font-bold text-gray-500">{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-8 bg-gray-200 mx-1" />

        <TB id="draw" icon={<Pen className="w-5 h-5" />} label="Draw" />
        <TB id="eraser" icon={<Eraser className="w-5 h-5" />} label="Eraser" />
        <TB id="highlight" icon={<Highlighter className="w-5 h-5" />} label="Highlight" />
        <TB id="texthighlight" icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="14" width="18" height="4" rx="1" fill="#fde047" stroke="#ca8a04"/><path d="M7 14V7l5-3 5 3v7"/><path d="M10 14v-4h4v4"/></svg>} label="Text highlight" />

        <div className="w-px h-8 bg-gray-200 mx-1" />

        {/* Image */}
        <label title="Image" className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 cursor-pointer min-w-[48px]">
          <ImageIcon className="w-5 h-5" /><span className="text-[10px] font-medium">Image</span>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && addImage(e.target.files[0])} />
        </label>

        {/* Stamp */}
        <div className="relative">
          <button onClick={() => setShowStampPicker(s => !s)} title="Stamp"
            className={cn("flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg min-w-[48px]",
              activeTool === "stamp" ? "bg-red-50 text-red-600" : "text-gray-600 hover:bg-gray-100")}>
            <Stamp className="w-5 h-5" /><span className="text-[10px] font-medium">Stamp</span>
          </button>
          {showStampPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-2 z-50 w-44">
              {STAMPS.map(s => (
                <button key={s} onClick={() => { setPendingStamp(s); setActiveTool("stamp"); setShowStampPicker(false); }}
                  className="w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-gray-50 rounded-lg">{s}</button>
              ))}
            </div>
          )}
        </div>

        <TB id="link" icon={<Link className="w-5 h-5" />} label="Link" />
        <TB id="note" icon={<StickyNote className="w-5 h-5" />} label="Note" />

        {/* Right */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-400 hidden lg:block truncate max-w-40">{formatBytes(file.size)}</span>
          <button onClick={() => { setFile(null); setPdfDoc(null); }} className="text-xs text-gray-400 hover:text-red-500 px-2">Tukar</button>
          <button onClick={savePdf} disabled={saving || !pdfDoc}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
            <Download className="w-4 h-4" />{saving ? "Menyimpan..." : "Simpan PDF"}
          </button>
        </div>
      </div>

      {/* ── Toolbar row 2: formatting ── */}
      <div className="flex items-center gap-3 px-3 py-1.5 bg-white border-b border-gray-200">
        {/* Color swatch */}
        <div className="flex items-center gap-1.5">
          <label className="flex items-center gap-1.5 cursor-pointer group">
            <div className="w-5 h-5 rounded border-2 border-gray-300 group-hover:border-gray-400 transition-colors" style={{ backgroundColor: color }} />
            <span className="text-xs text-gray-500">Color</span>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="sr-only" />
          </label>
        </div>

        <div className="w-px h-5 bg-gray-200" />

        <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-red-400 min-w-[130px]">
          {FONTS.map(f => <option key={f}>{f}</option>)}
        </select>

        <select value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-red-400 w-16">
          {[8, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60].map(s => <option key={s}>{s}</option>)}
        </select>

        <div className="w-px h-5 bg-gray-200" />

        {/* Zoom */}
        <div className="flex items-center gap-1">
          <button onClick={() => setScale(s => Math.max(0.5, +(s - 0.25).toFixed(2)))}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500"><ZoomOut className="w-3.5 h-3.5" /></button>
          <span className="text-xs font-medium text-gray-700 w-12 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(s => Math.min(3, +(s + 0.25).toFixed(2)))}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500"><ZoomIn className="w-3.5 h-3.5" /></button>
        </div>

        {/* Page nav */}
        {totalPages > 0 && (
          <>
            <div className="w-px h-5 bg-gray-200" />
            <div className="flex items-center gap-1.5">
              <button onClick={() => changePage(currentPage - 1)} disabled={currentPage <= 1}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-30"><ChevronLeft className="w-3.5 h-3.5" /></button>
              <span className="text-xs text-gray-600 font-medium">{currentPage} / {totalPages}</span>
              <button onClick={() => changePage(currentPage + 1)} disabled={currentPage >= totalPages}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-30"><ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
          </>
        )}

        {/* Tool hint */}
        <span className="ml-auto text-[11px] text-gray-400 hidden md:block">
          {activeTool === "addtext" && "Click on the PDF to add new text"}
          {activeTool === "edittext" && "Click on existing PDF text to edit it"}
          {activeTool === "select" && "Click object to select — double-click text to edit"}
          {activeTool === "draw" && "Hold & drag to draw"}
          {activeTool === "highlight" && "Drag to highlight area"}
          {activeTool === "texthighlight" && "Drag to highlight text"}
          {activeTool === "eraser" && "Drag to erase annotation"}
          {activeTool === "move" && "Click & drag object to reposition"}
          {activeTool === "stamp" && `Click to place stamp: ${pendingStamp}`}
          {activeTool === "note" && "Click to place a note"}
          {activeTool === "link" && "Click to place a link"}
          {activeTool === "sign" && "Signature placed on PDF"}
        </span>
      </div>

      {/* ── Info banner ── */}
      {activeTool === "edittext" ? (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-50 border-b border-amber-100 text-xs text-amber-700">
          <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd"/></svg>
          Hover over text to highlight, click to edit. Press <kbd className="bg-amber-100 px-1 rounded">Enter</kbd> to save or <kbd className="bg-amber-100 px-1 rounded">Esc</kbd> to cancel.
        </div>
      ) : null}

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Thumbnail sidebar */}
        {sidebarOpen && (
          <div className="w-28 flex-shrink-0 bg-gray-200 border-r border-gray-300 overflow-y-auto py-3 px-2 space-y-2">
            {loadingPdf
              ? <p className="text-xs text-center text-gray-500 pt-8">Loading...</p>
              : thumbnails.map((thumb, i) => (
                <button key={i} onClick={() => changePage(i + 1)}
                  className={cn("w-full rounded-lg overflow-hidden border-2 transition-all bg-white shadow-sm",
                    currentPage === i + 1 ? "border-red-500 shadow-md" : "border-transparent hover:border-gray-400")}>
                  <img src={thumb} alt={`Page ${i + 1}`} className="w-full block" />
                  <p className={cn("text-center text-[10px] py-1 font-medium", currentPage === i + 1 ? "text-red-600" : "text-gray-500")}>{i + 1}</p>
                </button>
              ))
            }
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 overflow-auto bg-gray-300 flex justify-center items-start p-6 relative">
          {loadingPdf && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-gray-300/80">
              <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Loading PDF...</p>
            </div>
          )}
          <div className="relative shadow-2xl inline-block" style={{ cursor: toolCursor(activeTool) }}>
            <canvas ref={pdfCanvasRef} className="block" />
            <div ref={fabricContainerRef} className="absolute top-0 left-0" />

            {/* Pro text editing layer */}
            {activeTool === "edittext" && pageViewport && pageTextItems.map((item: any, i: number) => {
              if (!("str" in item) || !item.str.trim()) return null;
              const tx = item.transform;
              const [x, rawY] = pageViewport.convertToViewportPoint(tx[4], tx[5]);
              const fsize = Math.abs(tx[3]) * pageViewport.scale;
              const h = fsize + 4;
              const w = (item.width ?? 0) * pageViewport.scale;
              const y = rawY - h;
              return (
                <div
                  key={i}
                  onClick={() => setEditingText({ item, x, y, w: Math.max(w, 20), h, fontSize: Math.max(fsize, 8), value: item.str })}
                  className="absolute hover:bg-blue-200/40 hover:border hover:border-blue-400 rounded cursor-text transition-colors"
                  style={{ left: x, top: y, width: Math.max(w, 10), height: h }}
                  title={item.str}
                />
              );
            })}

            {/* Inline text editor */}
            {editingText && activeTool === "edittext" && (
              <div className="absolute z-50" style={{ left: editingText.x, top: editingText.y }}>
                <input
                  autoFocus
                  value={editingText.value}
                  onChange={e => setEditingText(prev => prev ? { ...prev, value: e.target.value } : null)}
                  onKeyDown={e => {
                    if (e.key === "Enter") { e.preventDefault(); confirmTextEdit(); }
                    if (e.key === "Escape") setEditingText(null);
                  }}
                  style={{
                    fontSize: editingText.fontSize,
                    fontFamily: fontFamily,
                    color: color,
                    minWidth: Math.max(editingText.w, 60),
                    height: editingText.h + 4,
                    padding: "0 3px",
                    background: "white",
                    border: "2px solid #3b82f6",
                    borderRadius: 3,
                    outline: "none",
                    boxShadow: "0 2px 8px rgba(59,130,246,0.3)",
                  }}
                />
                <div className="flex gap-1 mt-1">
                  <button onClick={confirmTextEdit}
                    className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded font-medium hover:bg-blue-700">
                    <Check className="w-3 h-3 inline" /> OK
                  </button>
                  <button onClick={() => setEditingText(null)}
                    className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200">
                    Batal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Sign Modal ── */}
      {showSignModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Signature</h3>
              <button onClick={() => { setShowSignModal(false); setActiveTool("select"); setUploadedSignature(null); setSignTab("draw"); }} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button onClick={() => setSignTab("draw")} className={cn("flex-1 py-3 text-sm font-medium transition-colors", signTab === "draw" ? "text-red-600 border-b-2 border-red-600" : "text-gray-500 hover:text-gray-700")}>
                Draw
              </button>
              <button onClick={() => setSignTab("upload")} className={cn("flex-1 py-3 text-sm font-medium transition-colors", signTab === "upload" ? "text-red-600 border-b-2 border-red-600" : "text-gray-500 hover:text-gray-700")}>
                Upload Image
              </button>
            </div>
            <div className="p-5">
              {signTab === "draw" ? (
                <>
                  <canvas
                    ref={signCanvasRef} width={420} height={160}
                    className="w-full border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 touch-none cursor-crosshair"
                    onMouseDown={signStart} onMouseMove={signMove} onMouseUp={signEnd} onMouseLeave={signEnd}
                    onTouchStart={signStart} onTouchMove={signMove} onTouchEnd={signEnd}
                  />
                  <p className="text-xs text-gray-400 text-center mt-2">Draw your signature above</p>
                </>
              ) : (
                <>
                  {uploadedSignature ? (
                    <div className="space-y-3">
                      <div className="border border-gray-200 rounded-xl bg-gray-50 p-3 flex items-center justify-center h-40">
                        <img src={uploadedSignature} alt="Signature" className="max-h-full max-w-full object-contain" />
                      </div>
                      <label className="block w-full py-2 text-center text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 cursor-pointer">
                        Change image
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleSignUpload(e.target.files?.[0] ?? null)} />
                      </label>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl h-40 cursor-pointer hover:border-red-300 hover:bg-red-50 transition-colors">
                      <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      <span className="text-sm text-gray-500">Click to upload signature image</span>
                      <span className="text-xs text-gray-400 mt-1">PNG, JPG, SVG</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleSignUpload(e.target.files?.[0] ?? null)} />
                    </label>
                  )}
                </>
              )}
            </div>
            <div className="flex gap-2 px-5 pb-5">
              {signTab === "draw" && (
                <button onClick={signClear} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Padam</button>
              )}
              <button
                onClick={signPlace}
                disabled={signTab === "upload" && !uploadedSignature}
                className="flex-1 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-40"
              >
                <Check className="w-4 h-4 inline mr-1" />Letakkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Note Modal ── */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Tambah Nota</h3>
              <button onClick={() => setShowNoteModal(false)} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5">
              <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={4} placeholder="Write your note..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button onClick={() => setShowNoteModal(false)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Batal</button>
              <button onClick={placeNote} disabled={!noteText.trim()} className="flex-1 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50">Letak Nota</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Link Modal ── */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Tambah Pautan</h3>
              <button onClick={() => setShowLinkModal(false)} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">URL</label>
                <input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Teks pautan</label>
                <input type="text" value={linkText} onChange={(e) => setLinkText(e.target.value)} placeholder="Click here"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
              </div>
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button onClick={() => setShowLinkModal(false)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Batal</button>
              <button onClick={placeLink} disabled={!linkUrl.trim()} className="flex-1 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50">Letak Pautan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
