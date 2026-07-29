// POST /api/v1/pdf/rotate
// Body: file, degrees (90|180|270), pages? (JSON array or comma-separated, 1-indexed; default: all)
import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/apiAuth";
import { PDFDocument, degrees } from "pdf-lib";
import { parsePages } from "@/lib/pdf-api/helpers";

export const POST = withApiAuth("pdf/rotate", async (req) => {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const deg = parseInt((form.get("degrees") as string) ?? "90", 10);
  if (![90, 180, 270, -90].includes(deg))
    return NextResponse.json({ error: "degrees must be 90, 180, or 270" }, { status: 400 });

  const buf = await file.arrayBuffer();
  const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
  const total = doc.getPageCount();

  const target = parsePages(form.get("pages") as string | null, total) ?? Array.from({ length: total }, (_, i) => i);

  for (const i of target) {
    const page = doc.getPage(i);
    page.setRotation(degrees((page.getRotation().angle + deg) % 360));
  }

  const bytes = await doc.save();
  return new NextResponse(bytes, {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="rotated.pdf"' },
  });
});
