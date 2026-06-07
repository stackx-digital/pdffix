"use client";

import { useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import { Scissors, Download } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { useUsageLimit } from "@/hooks/useUsageLimit";
import UsageLimitBanner from "@/components/ui/UsageLimitBanner";

export default function SplitPdfTool() {
  const { status, limitReached, checkLimit, recordUsage } = useUsageLimit("split-pdf");
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [ranges, setRanges] = useState("1");
  const [splitting, setSplitting] = useState(false);
  const [results, setResults] = useState<{ name: string; url: string }[]>([]);
  const [error, setError] = useState("");

  const loadFile = useCallback(async (f: File | null) => {
    if (!f || f.type !== "application/pdf") return;
    setFile(f);
    setResults([]);
    setError("");
    const bytes = await f.arrayBuffer();
    const pdf = await PDFDocument.load(bytes);
    setPageCount(pdf.getPageCount());
    setRanges(`1-${pdf.getPageCount()}`);
  }, []);

  function parseRanges(input: string, max: number): number[][] {
    return input.split(",").map((r) => {
      const [a, b] = r.trim().split("-").map(Number);
      const start = Math.max(1, a) - 1;
      const end = Math.min(b ?? a, max) - 1;
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    });
  }

  async function split() {
    if (!file) return;
    const allowed = await checkLimit();
    if (!allowed) return;
    setSplitting(true);
    setError("");
    try {
      const bytes = await file.arrayBuffer();
      const src = await PDFDocument.load(bytes);
      const groups = parseRanges(ranges, pageCount);
      const out: { name: string; url: string }[] = [];

      for (let i = 0; i < groups.length; i++) {
        const pages = groups[i];
        const newPdf = await PDFDocument.create();
        const copied = await newPdf.copyPages(src, pages);
        copied.forEach((p) => newPdf.addPage(p));
        const b = await newPdf.save();
        const blob = new Blob([b], { type: "application/pdf" });
        out.push({ name: `bahagian-${i + 1}.pdf`, url: URL.createObjectURL(blob) });
      }
      await recordUsage();
      setResults(out);
    } catch {
      setError("Format julat halaman tidak sah. Contoh: 1-3, 4-6");
    } finally {
      setSplitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {status && !status.isPro && status.loggedIn && (
        <UsageLimitBanner used={status.used} limit={status.limit!} loggedIn={status.loggedIn} />
      )}
      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-10 cursor-pointer hover:border-red-300 hover:bg-red-50 transition-colors">
        <Scissors className="w-10 h-10 text-gray-300 mb-3" />
        <span className="font-medium text-gray-700">Klik atau seret fail PDF ke sini</span>
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => loadFile(e.target.files?.[0] ?? null)}
        />
      </label>

      {file && (
        <div className="p-3 bg-white border border-gray-200 rounded-lg text-sm">
          <p className="font-medium text-gray-900">{file.name}</p>
          <p className="text-gray-400">{pageCount} halaman · {formatBytes(file.size)}</p>
        </div>
      )}

      {pageCount > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Julat halaman (pisahkan dengan koma)
          </label>
          <input
            type="text"
            value={ranges}
            onChange={(e) => setRanges(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="contoh: 1-3, 4-6, 7"
          />
          <p className="text-xs text-gray-400 mt-1">
            Setiap julat akan jadi satu fail PDF berasingan. Jumlah halaman: {pageCount}
          </p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      <button
        onClick={split}
        disabled={!file || splitting || limitReached}
        className="w-full py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
      >
        {splitting ? "Sedang memisahkan..." : "Pisah PDF"}
      </button>

      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-green-700">✅ {results.length} fail berjaya dihasilkan:</p>
          {results.map((r) => (
            <a
              key={r.name}
              href={r.url}
              download={r.name}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
            >
              <Download className="w-4 h-4 text-gray-400" />
              <span className="flex-1 text-gray-700">{r.name}</span>
              <span className="text-xs text-green-600 font-medium">Muat Turun</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
