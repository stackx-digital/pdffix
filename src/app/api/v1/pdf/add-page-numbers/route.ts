// POST /api/v1/pdf/add-page-numbers
// Body: file, position? (bottom-center|bottom-right|bottom-left|top-center, default bottom-center)
//        start? (starting number, default 1), size? (font size, default 10)
import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/apiAuth";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const POST = withApiAuth("pdf/add-page-numbers", async (req) => {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const position = (form.get("position") as string) || "bottom-center";
  const start = parseInt((form.get("start") as string) || "1", 10);
  const fontSize = parseFloat((form.get("size") as string) || "10");
  const margin = 20;

  const buf = await file.arrayBuffer();
  const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);

  doc.getPages().forEach((page, i) => {
    const { width, height } = page.getSize();
    const label = String(start + i);
    const tw = font.widthOfTextAtSize(label, fontSize);

    let x: number, y: number;
    if (position === "bottom-right") { x = width - margin - tw; y = margin; }
    else if (position === "bottom-left") { x = margin; y = margin; }
    else if (position === "top-center") { x = (width - tw) / 2; y = height - margin - fontSize; }
    else { x = (width - tw) / 2; y = margin; } // bottom-center

    page.drawText(label, { x, y, size: fontSize, font, color: rgb(0.3, 0.3, 0.3) });
  });

  const bytes = await doc.save();
  return new NextResponse(bytes, {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="numbered.pdf"' },
  });
});
