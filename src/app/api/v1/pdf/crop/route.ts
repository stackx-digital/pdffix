// POST /api/v1/pdf/crop
// Body: file, top? left? right? bottom? (margin in pt to cut from each side, default 0)
import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/apiAuth";
import { PDFDocument } from "pdf-lib";

export const POST = withApiAuth("pdf/crop", async (req) => {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const top    = parseFloat((form.get("top")    as string) || "0");
  const bottom = parseFloat((form.get("bottom") as string) || "0");
  const left   = parseFloat((form.get("left")   as string) || "0");
  const right  = parseFloat((form.get("right")  as string) || "0");

  const buf = await file.arrayBuffer();
  const doc = await PDFDocument.load(buf, { ignoreEncryption: true });

  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    page.setCropBox(left, bottom, width - left - right, height - top - bottom);
  }

  const bytes = await doc.save();
  return new NextResponse(bytes, {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="cropped.pdf"' },
  });
});
