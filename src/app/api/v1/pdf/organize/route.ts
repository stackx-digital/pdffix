// POST /api/v1/pdf/organize — reorder pages
// Body: file, order (JSON array of 1-indexed page numbers in desired order)
// e.g. order=[3,1,2] moves page 3 first
import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/apiAuth";
import { PDFDocument } from "pdf-lib";
import { parsePages } from "@/lib/pdf-api/helpers";

export const POST = withApiAuth("pdf/organize", async (req) => {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const buf = await file.arrayBuffer();
  const src = await PDFDocument.load(buf, { ignoreEncryption: true });
  const total = src.getPageCount();

  const order = parsePages(form.get("order") as string | null, total);
  if (!order || order.length === 0) return NextResponse.json({ error: "order field required (JSON array of page numbers)" }, { status: 400 });

  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, order);
  pages.forEach((p) => out.addPage(p));

  const bytes = await out.save();
  return new NextResponse(bytes, {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="organized.pdf"' },
  });
});
