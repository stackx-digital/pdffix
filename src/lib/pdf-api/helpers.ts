import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";

export async function loadPdf(buffer: ArrayBuffer): Promise<PDFDocument> {
  return PDFDocument.load(buffer, { ignoreEncryption: true });
}

export function pdfResponse(bytes: Uint8Array, filename = "output.pdf"): Response {
  return new Response(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

export function jsonError(msg: string, status = 400): Response {
  return Response.json({ error: msg }, { status });
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
