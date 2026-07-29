// POST /api/v1/pdf/pdf-to-text
// Body: file
// Returns: JSON { pages: [{ page: 1, text: "..." }, ...], full_text: "..." }
import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/apiAuth";

export const POST = withApiAuth("pdf/pdf-to-text", async (req) => {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const buf = await file.arrayBuffer();

  // pdfjs-dist works in Node.js for text extraction
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs" as string);
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buf), disableFontFace: true });
  const pdfDoc = await loadingTask.promise;

  const pages: { page: number; text: string }[] = [];
  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item: any) => ("str" in item ? item.str : "")).join(" ");
    pages.push({ page: i, text: text.trim() });
  }

  return NextResponse.json({
    pages,
    full_text: pages.map((p) => p.text).join("\n\n"),
    page_count: pdfDoc.numPages,
  });
});
