// POST /api/v1/pdf/delete-pages
// Body: file, pages (JSON array or comma-separated 1-indexed page numbers to DELETE)
import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/apiAuth";
import { PDFDocument } from "pdf-lib";
import { parsePages } from "@/lib/pdf-api/helpers";

export const POST = withApiAuth("pdf/delete-pages", async (req) => {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const buf = await file.arrayBuffer();
  const src = await PDFDocument.load(buf, { ignoreEncryption: true });
  const total = src.getPageCount();

  const toDelete = new Set(parsePages(form.get("pages") as string | null, total) ?? []);
  if (toDelete.size === 0) return NextResponse.json({ error: "No valid pages specified" }, { status: 400 });

  const keepIndices = Array.from({ length: total }, (_, i) => i).filter((i) => !toDelete.has(i));
  if (keepIndices.length === 0) return NextResponse.json({ error: "Cannot delete all pages" }, { status: 400 });

  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, keepIndices);
  pages.forEach((p) => out.addPage(p));

  const bytes = await out.save();
  return new NextResponse(bytes, {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="output.pdf"' },
  });
});
