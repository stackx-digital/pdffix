"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";
import { Droplets, Download, Eye } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import { useUsageLimit } from "@/hooks/useUsageLimit";
import UsageLimitBanner from "@/components/ui/UsageLimitBanner";

type WatermarkType = "text" | "image";

export default function WatermarkTool() {
  const { status, limitReached, checkLimit, recordUsage } = useUsageLimit("watermark");
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<WatermarkType>("text");
  const [text, setText] = useState("SULIT");
  const [fontSize, setFontSize] = useState(60);
  const [opacity, setOpacity] = useState(0.25);
  const [rotation, setRotation] = useState(45);
  const [color, setColor] = useState("#ff0000");
  const [position, setPosition] = useState<"center" | "top-left" | "top-right" | "bottom-left" | "bottom-right" | "tile">("center");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const fileBytes = useRef<ArrayBuffer | null>(null);

  const imagePreviewUrl = useMemo(() => {
    if (!imageFile) return null;
    const url = URL.createObjectURL(imageFile);
    return url;
  }, [imageFile]);

  useEffect(() => {
    return () => { if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl); };
  }, [imagePreviewUrl]);

  const loadFile = useCallback(async (f: File | null) => {
    if (!f || f.type !== "application/pdf") return;
    setFile(f);
    setDone(false);
    fileBytes.current = await f.arrayBuffer();
  }, []);

  function hexToRgb(hex: string) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return rgb(r, g, b);
  }

  function getPositions(pageW: number, pageH: number, wmW: number, wmH: number) {
    const margin = 40;
    const positions: { x: number; y: number }[] = [];
    switch (position) {
      case "center": positions.push({ x: (pageW - wmW) / 2, y: (pageH - wmH) / 2 }); break;
      case "top-left": positions.push({ x: margin, y: pageH - wmH - margin }); break;
      case "top-right": positions.push({ x: pageW - wmW - margin, y: pageH - wmH - margin }); break;
      case "bottom-left": positions.push({ x: margin, y: margin }); break;
      case "bottom-right": positions.push({ x: pageW - wmW - margin, y: margin }); break;
      case "tile":
        for (let x = margin; x < pageW; x += wmW * 1.5) {
          for (let y = margin; y < pageH; y += wmH * 2) {
            positions.push({ x, y });
          }
        }
        break;
    }
    return positions;
  }

  async function apply() {
    if (!fileBytes.current || !file) return;
    const allowed = await checkLimit();
    if (!allowed) return;
    setProcessing(true);
    setDone(false);
    try {
      const pdfDoc = await PDFDocument.load(fileBytes.current);
      const pages = pdfDoc.getPages();

      if (type === "text") {
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const col = hexToRgb(color);

        for (const page of pages) {
          const { width, height } = page.getSize();
          const textWidth = font.widthOfTextAtSize(text, fontSize);
          const textHeight = fontSize;

          const positions = getPositions(width, height, textWidth, textHeight);
          for (const pos of positions) {
            page.drawText(text, {
              x: pos.x,
              y: pos.y,
              size: fontSize,
              font,
              color: col,
              opacity,
              rotate: degrees(rotation),
            });
          }
        }
      } else if (type === "image" && imageFile) {
        const imgBytes = await imageFile.arrayBuffer();
        const isPng = imageFile.type === "image/png";
        const img = isPng
          ? await pdfDoc.embedPng(imgBytes)
          : await pdfDoc.embedJpg(imgBytes);

        const wmW = 150;
        const wmH = (img.height / img.width) * wmW;

        for (const page of pages) {
          const { width, height } = page.getSize();
          const positions = getPositions(width, height, wmW, wmH);
          for (const pos of positions) {
            page.drawImage(img, {
              x: pos.x,
              y: pos.y,
              width: wmW,
              height: wmH,
              opacity,
              rotate: degrees(rotation),
            });
          }
        }
      }

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `watermarked-${file.name}`;
      a.click();
      await recordUsage(file?.name, file?.size);
      setDone(true);
    } finally {
      setProcessing(false);
    }
  }

  const PRESETS = ["SULIT", "DRAFT", "CONFIDENTIAL", "TIDAK SAH", "CONTOH", "SAMPLE"];
  const POSITIONS = [
    { id: "center", label: "Tengah" },
    { id: "top-left", label: "Atas Kiri" },
    { id: "top-right", label: "Atas Kanan" },
    { id: "bottom-left", label: "Bawah Kiri" },
    { id: "bottom-right", label: "Bawah Kanan" },
    { id: "tile", label: "Tile (Semua)" },
  ] as const;

  return (
    <div className="space-y-6">
      {status && !status.loggedIn && (
        <UsageLimitBanner used={status.used} limit={status.limit!} loggedIn={status.loggedIn} />
      )}
      {/* File upload */}
      {!file ? (
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-12 cursor-pointer hover:border-red-300 hover:bg-red-50 transition-colors">
          <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center mb-4">
            <Droplets className="w-7 h-7 text-red-600" />
          </div>
          <span className="font-semibold text-gray-800 text-lg">Buka fail PDF</span>
          <span className="text-sm text-gray-400 mt-1">Klik atau seret fail PDF ke sini</span>
          <input type="file" accept="application/pdf" className="hidden" onChange={(e) => loadFile(e.target.files?.[0] ?? null)} />
        </label>
      ) : (
        <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl">
          <div>
            <p className="text-sm font-medium text-gray-900">{file.name}</p>
            <p className="text-xs text-gray-400">{formatBytes(file.size)}</p>
          </div>
          <button onClick={() => { setFile(null); fileBytes.current = null; setDone(false); }} className="text-xs text-red-500 hover:underline">Tukar fail</button>
        </div>
      )}

      {file && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Settings */}
          <div className="space-y-4">
            {/* Type toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Watermark</label>
              <div className="flex gap-2">
                {(["text", "image"] as const).map(t => (
                  <button key={t} onClick={() => setType(t)} className={cn("flex-1 py-2 rounded-lg border text-sm font-medium transition-colors", type === t ? "bg-red-600 text-white border-red-600" : "border-gray-200 text-gray-700 hover:bg-gray-50")}>
                    {t === "text" ? "Teks" : "Imej/Logo"}
                  </button>
                ))}
              </div>
            </div>

            {type === "text" ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teks Watermark</label>
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Contoh: SULIT, DRAFT..."
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {PRESETS.map(p => (
                      <button key={p} onClick={() => setText(p)} className="text-xs px-2 py-1 bg-gray-100 rounded-md hover:bg-gray-200 text-gray-700">{p}</button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Saiz Fon: {fontSize}pt</label>
                    <input type="range" min={20} max={120} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full accent-red-600" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Warna</label>
                    <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-full h-9 rounded-lg border border-gray-200 cursor-pointer" />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Imej/Logo (PNG atau JPG)</label>
                <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 text-sm text-gray-600">
                  {imageFile ? imageFile.name : "Pilih fail imej..."}
                  <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
                </label>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kelegapan: {Math.round(opacity * 100)}%</label>
                <input type="range" min={5} max={100} value={opacity * 100} onChange={(e) => setOpacity(Number(e.target.value) / 100)} className="w-full accent-red-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Putaran: {rotation}°</label>
                <input type="range" min={-90} max={90} value={rotation} onChange={(e) => setRotation(Number(e.target.value))} className="w-full accent-red-600" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kedudukan</label>
              <div className="grid grid-cols-3 gap-2">
                {POSITIONS.map(p => (
                  <button key={p.id} onClick={() => setPosition(p.id)} className={cn("py-1.5 rounded-lg border text-xs font-medium transition-colors", position === p.id ? "bg-red-600 text-white border-red-600" : "border-gray-200 text-gray-700 hover:bg-gray-50")}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview + action */}
          <div className="space-y-4">
            {/* Live preview box */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5"><Eye className="w-4 h-4" />Pratonton</label>
              <div className="relative h-52 bg-white border-2 border-gray-200 rounded-xl overflow-hidden flex items-center justify-center">
                {/* Mock PDF lines */}
                <div className="absolute inset-0 p-4 space-y-2 opacity-20">
                  {[80, 100, 65, 90, 75, 85, 60].map((w, i) => <div key={i} className="h-2 bg-gray-400 rounded" style={{ width: `${w}%` }} />)}
                </div>
                {/* Watermark preview */}
                {type === "text" && text && (
                  <div
                    className="absolute font-bold pointer-events-none whitespace-nowrap"
                    style={{
                      color,
                      fontSize: Math.min(fontSize * 0.5, 40),
                      opacity,
                      transform: `rotate(${rotation}deg)`,
                      ...(position === "top-left" && { top: 16, left: 16 }),
                      ...(position === "top-right" && { top: 16, right: 16 }),
                      ...(position === "bottom-left" && { bottom: 16, left: 16 }),
                      ...(position === "bottom-right" && { bottom: 16, right: 16 }),
                    }}
                  >
                    {text}
                  </div>
                )}
                {type === "image" && imagePreviewUrl && (
                  <img
                    src={imagePreviewUrl}
                    alt="watermark"
                    className="absolute"
                    style={{ opacity, transform: `rotate(${rotation}deg)`, maxWidth: "40%", maxHeight: "40%" }}
                  />
                )}
              </div>
            </div>

            <button
              onClick={apply}
              disabled={processing || limitReached || (type === "image" && !imageFile)}
              className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              {processing ? "Sedang memproses..." : "Guna Watermark & Muat Turun"}
            </button>

            {done && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800 text-center">
                ✅ Watermark berjaya ditambah! Fail telah dimuat turun.
              </div>
            )}

            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 space-y-1">
              <p className="font-medium">Nota:</p>
              <p>• Watermark akan digunakan pada semua halaman PDF</p>
              <p>• Fail asal anda tidak diubah</p>
              <p>• Proses berlaku sepenuhnya dalam browser anda</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
