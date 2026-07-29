// POST /api/v1/pdf/image-to-pdf
// Body: images[] (JPG or PNG files), fit? (contain|fill, default contain)
import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/apiAuth";
import { PDFDocument } from "pdf-lib";

export const POST = withApiAuth("pdf/image-to-pdf", async (req) => {
  const form = await req.formData();
  const images = form.getAll("images") as File[];
  if (images.length === 0) return NextResponse.json({ error: "No images provided (field: images[])" }, { status: 400 });

  const doc = await PDFDocument.create();

  for (const img of images) {
    const buf = await img.arrayBuffer();
    const mime = img.type || "";

    let embedded;
    if (mime.includes("png")) {
      embedded = await doc.embedPng(buf);
    } else {
      embedded = await doc.embedJpg(buf);
    }

    const page = doc.addPage([embedded.width, embedded.height]);
    page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });
  }

  const bytes = await doc.save();
  return new NextResponse(bytes, {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="images.pdf"' },
  });
});
