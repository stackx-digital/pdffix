"use client";

import { useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import { Upload, Download, X, MoveUp, MoveDown } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { useUsageLimit } from "@/hooks/useUsageLimit";
import UsageLimitBanner from "@/components/ui/UsageLimitBanner";

interface ImgFile {
  id: string;
  file: File;
  url: string;
}

export default function ImageToPdfTool() {
  const { status, limitReached, checkLimit, recordUsage } = useUsageLimit("image-to-pdf");
  const [images, setImages] = useState<ImgFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const addFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const added: ImgFile[] = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => ({ id: crypto.randomUUID(), file: f, url: URL.createObjectURL(f) }));
    setImages((prev) => [...prev, ...added]);
    setResultUrl(null);
  }, []);

  function remove(id: string) {
    setImages((prev) => prev.filter((img) => img.id !== id));
    setResultUrl(null);
  }

  function move(from: number, to: number) {
    setImages((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
    setResultUrl(null);
  }

  async function process() {
    if (images.length === 0) return;
    const allowed = await checkLimit();
    if (!allowed) return;
    setProcessing(true);
    try {
      const pdf = await PDFDocument.create();

      for (const img of images) {
        try {
          const bytes = await img.file.arrayBuffer();
          let pdfImage;
          if (img.file.type === "image/png") {
            pdfImage = await pdf.embedPng(bytes);
          } else {
            pdfImage = await pdf.embedJpg(bytes);
          }
          const { width, height } = pdfImage;
          const page = pdf.addPage([width, height]);
          page.drawImage(pdfImage, { x: 0, y: 0, width, height });
        } catch {
          // skip unsupported or corrupt images
        }
      }

      const out = await pdf.save();
      await recordUsage();
      setResultUrl(URL.createObjectURL(new Blob([out], { type: "application/pdf" })));
    } catch {
      // error is swallowed — UI returns to idle state via finally
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Imej ke PDF</h1>
      <p className="text-gray-500 mb-8">Tukar imej JPG atau PNG kepada PDF. Susun mengikut urutan yang anda mahu.</p>

      {status && !status.isPro && status.loggedIn && (
        <UsageLimitBanner used={status.used} limit={status.limit!} loggedIn={status.loggedIn} />
      )}
      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-10 cursor-pointer hover:border-red-400 hover:bg-red-50 transition-colors mb-6">
        <Upload className="w-8 h-8 text-gray-400 mb-2" />
        <span className="font-medium text-gray-700">Klik atau seret imej ke sini</span>
        <span className="text-sm text-gray-400 mt-1">JPG, PNG</span>
        <input type="file" accept="image/jpeg,image/png,image/jpg" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
      </label>

      {images.length > 0 && (
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
            {images.map((img, i) => (
              <div key={img.id} className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                <img src={img.url} alt={img.file.name} className="w-full aspect-square object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => i > 0 && move(i, i - 1)} className="p-1 bg-white rounded-lg shadow">
                    <MoveUp className="w-3 h-3" />
                  </button>
                  <button onClick={() => i < images.length - 1 && move(i, i + 1)} className="p-1 bg-white rounded-lg shadow">
                    <MoveDown className="w-3 h-3" />
                  </button>
                  <button onClick={() => remove(img.id)} className="p-1 bg-white rounded-lg shadow text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                  {img.file.name}
                </div>
                <span className="absolute top-1.5 left-1.5 bg-white text-gray-700 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow">
                  {i + 1}
                </span>
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-500 mb-4">{images.length} imej · {formatBytes(images.reduce((s, img) => s + img.file.size, 0))}</p>

          {resultUrl ? (
            <a href={resultUrl} download="images.pdf" className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700">
              <Download className="w-5 h-5" /> Muat Turun PDF
            </a>
          ) : (
            <button onClick={process} disabled={processing || limitReached} className="w-full py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-60">
              {processing ? "Memproses..." : "Tukar ke PDF"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
