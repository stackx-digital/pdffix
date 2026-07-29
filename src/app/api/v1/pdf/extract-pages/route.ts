// POST /api/v1/pdf/extract-pages
// Body: file, pages (1-indexed pages to KEEP)
import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/apiAuth";
import { PDFDocument } from "pdf-lib";
import { parsePages } from "@/lib/pdf-api/helpers";

export const POST = withApiAuth("pdf/extract-pages", async (req) => {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const buf = await file.arrayBuffer();
  const src = await PDFDocument.load(buf, { ignoreEncryption: true });
  const indices = parsePages(form.get("pages") as string | null, src.getPageCount());
  if (!indices || indices.length === 0) return NextResponse.json({ error: "No valid pages specified" }, { status: 400 });

  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, indices);
  pages.forEach((p) => out.addPage(p));

  const bytes = await out.save();
  return new NextResponse(bytes, {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="extracted.pdf"' },
  });
});
