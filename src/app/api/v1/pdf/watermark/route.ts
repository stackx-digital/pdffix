// POST /api/v1/pdf/watermark
// Body: file, text, color? (#rrggbb, default #ff0000), opacity? (0-1, default 0.15), size? (default 48)
import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/apiAuth";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255,
  };
}

export const POST = withApiAuth("pdf/watermark", async (req) => {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const text = (form.get("text") as string) || "CONFIDENTIAL";
  const colorHex = (form.get("color") as string) || "#ff0000";
  const opacity = parseFloat((form.get("opacity") as string) || "0.15");
  const fontSize = parseFloat((form.get("size") as string) || "48");

  const buf = await file.arrayBuffer();
  const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const c = hexToRgb(colorHex);

  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    page.drawText(text, {
      x: (width - textWidth) / 2,
      y: height / 2,
      size: fontSize,
      font,
      color: rgb(c.r, c.g, c.b),
      opacity,
      rotate: degrees(45),
    });
  }

  const bytes = await doc.save();
  return new NextResponse(bytes, {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="watermarked.pdf"' },
  });
});
