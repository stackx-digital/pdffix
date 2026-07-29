// POST /api/v1/pdf/flatten — flatten interactive form fields into static PDF
import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/apiAuth";
import { PDFDocument } from "pdf-lib";

export const POST = withApiAuth("pdf/flatten", async (req) => {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const buf = await file.arrayBuffer();
  const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
  doc.getForm().flatten();

  const bytes = await doc.save();
  return new NextResponse(bytes, {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="flattened.pdf"' },
  });
});
