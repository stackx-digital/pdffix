import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import { NextResponse } from "next/server";

export async function loadPdf(buffer: ArrayBuffer): Promise<PDFDocument> {
  return PDFDocument.load(buffer, { ignoreEncryption: true });
}

// --- Resource-exhaustion guards -------------------------------------------
// These routes accept untrusted uploads and feed them straight into
// pdf-lib / pdfjs-dist / tesseract.js, which buffer the whole file (and, for
// page-oriented operations, do work proportional to the page count) in
// memory. Without a cap, a single request with an oversized file or a PDF
// declaring an enormous page count can exhaust server memory/CPU.

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB per uploaded file
export const MAX_TOTAL_PAGES = 2000; // cap on pages processed in one request

// Checks a single uploaded File's size *before* its bytes are read into
// memory (File.size is metadata, so this is cheap). Returns an error
// Response to return immediately, or null if the file is within limits.
export function checkFileSize(file: File, maxBytes = MAX_FILE_SIZE_BYTES): NextResponse | null {
  if (typeof file.size === "number" && file.size > maxBytes) {
    return jsonError(
      `File too large: ${file.size} bytes exceeds the ${maxBytes} byte limit.`,
      413
    );
  }
  return null;
}

// Checks several uploaded files (e.g. merge's files[], image-to-pdf's
// images[]) against both a per-file size cap and a combined total cap.
export function checkFilesSize(files: File[], maxBytes = MAX_FILE_SIZE_BYTES): NextResponse | null {
  let total = 0;
  for (const f of files) {
    const err = checkFileSize(f, maxBytes);
    if (err) return err;
    total += f.size ?? 0;
  }
  if (total > maxBytes) {
    return jsonError(
      `Combined upload too large: ${total} bytes exceeds the ${maxBytes} byte limit.`,
      413
    );
  }
  return null;
}

// Guards against a PDF declaring (or a request targeting) an unreasonable
// number of pages, which would otherwise drive an unbounded loop over
// pages/copyPages/text-extraction/etc.
export function checkPageCount(total: number, maxPages = MAX_TOTAL_PAGES): NextResponse | null {
  if (total > maxPages) {
    return jsonError(
      `PDF has too many pages (${total}); limit is ${maxPages}.`,
      400
    );
  }
  return null;
}

export function pdfResponse(bytes: Uint8Array, filename = "output.pdf"): Response {
  return new Response(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

export function jsonError(msg: string, status = 400): NextResponse {
  return NextResponse.json({ error: msg }, { status });
}

// Parse comma-separated or JSON array of 1-indexed page numbers → 0-indexed
export function parsePages(raw: string | null, total: number): number[] | null {
  if (!raw) return null;
  try {
    const arr: number[] = JSON.parse(raw);
    return arr.map((n) => n - 1).filter((n) => n >= 0 && n < total);
  } catch {
    // comma-separated
    return raw
      .split(",")
      .map((s) => parseInt(s.trim(), 10) - 1)
      .filter((n) => !isNaN(n) && n >= 0 && n < total);
  }
}

export { PDFDocument, rgb, StandardFonts, degrees };
