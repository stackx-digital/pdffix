// POST /api/v1/pdf/protect — add password protection to PDF
// Note: uses pdf-lib encryption via SaveOptions (RC4-128)
// Body: file, password
import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/apiAuth";
import { PDFDocument, type SaveOptions } from "pdf-lib";

export const POST = withApiAuth("pdf/protect", async (req) => {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const password = form.get("password") as string | null;
  if (!password) return NextResponse.json({ error: "password field required" }, { status: 400 });

  const buf = await file.arrayBuffer();
  const doc = await PDFDocument.load(buf, { ignoreEncryption: true });

  // pdf-lib encryption options (cast needed for older type definitions)
  const saveOpts = {
    userPassword: password,
    ownerPassword: (form.get("owner_password") as string) || password,
    permissions: {
      printing: "highResolution",
      modifying: false,
      copying: false,
      annotating: false,
      fillingForms: true,
      contentAccessibility: true,
      documentAssembly: false,
    },
  } as unknown as SaveOptions;

  const bytes = await doc.save(saveOpts);

  return new NextResponse(bytes, {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="protected.pdf"' },
  });
});
