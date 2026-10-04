import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/apiAuth";
import { PDFDocument } from "pdf-lib";
import { checkFilesSize, checkPageCount } from "@/lib/pdf-api/helpers";

export const POST = withApiAuth("pdf/merge", async (req) => {
  const form = await req.formData();
  const files = form.getAll("files") as File[];
  if (files.length < 2) return NextResponse.json({ error: "Send at least 2 files as files[]" }, { status: 400 });

  const sizeErr = checkFilesSize(files);
  if (sizeErr) return sizeErr;

  const merged = await PDFDocument.create();
  let totalPages = 0;
  for (const file of files) {
    const buf = await file.arrayBuffer();
    const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
    totalPages += doc.getPageCount();
    const pageErr = checkPageCount(totalPages);
    if (pageErr) return pageErr;
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
  }
  const bytes = await merged.save();
  return new NextResponse(bytes, {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="merged.pdf"' },
  });
});
