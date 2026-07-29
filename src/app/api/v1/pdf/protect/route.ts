// POST /api/v1/pdf/protect — add password to PDF
// Body: file, password (user password), owner_password? (owner password, defaults to password)
import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/apiAuth";
import { PDFDocument } from "pdf-lib";

export const POST = withApiAuth("pdf/protect", async (req) => {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const password = form.get("password") as string | null;
  if (!password) return NextResponse.json({ error: "password field required" }, { status: 400 });

  const ownerPassword = (form.get("owner_password") as string) || password;

  const buf = await file.arrayBuffer();
  const doc = await PDFDocument.load(buf, { ignoreEncryption: true });

  const bytes = await doc.save({
    userPassword: password,
    ownerPassword,
    permissions: {
      printing: "highResolution",
      modifying: false,
      copying: false,
      annotating: false,
      fillingForms: true,
      contentAccessibility: true,
      documentAssembly: false,
    },
  });

  return new NextResponse(bytes, {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="protected.pdf"' },
  });
});
