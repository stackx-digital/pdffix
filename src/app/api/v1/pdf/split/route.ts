// POST /api/v1/pdf/split
// Body: multipart — file (PDF), from (1-indexed), to (1-indexed)
// Returns: PDF containing only pages [from..to]
import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/apiAuth";
import { PDFDocument } from "pdf-lib";

export const POST = withApiAuth("pdf/split", async (req) => {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const buf = await file.arrayBuffer();
  const src = await PDFDocument.load(buf, { ignoreEncryption: true });
  const total = src.getPageCount();

  const from = Math.max(1, parseInt((form.get("from") as string) ?? "1", 10)) - 1;
  const to = Math.min(total - 1, parseInt((form.get("to") as string) ?? String(total), 10) - 1);

  const out = await PDFDocument.create();
  const indices = Array.from({ length: to - from + 1 }, (_, i) => from + i);
  const pages = await out.copyPages(src, indices);
  pages.forEach((p) => out.addPage(p));

  const bytes = await out.save();
  return new NextResponse(bytes, {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="split.pdf"' },
  });
});
