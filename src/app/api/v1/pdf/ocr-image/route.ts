// POST /api/v1/pdf/ocr-image — OCR on image files (JPG, PNG) to extract text
// Perfect for scanning receipts, ICs, documents
// Body: image (single file), lang? (eng|msa|chi_sim|ara, default eng)
// Returns: JSON { text, confidence, words: [{ text, confidence }] }
import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/apiAuth";
import Tesseract from "tesseract.js";

export const POST = withApiAuth("pdf/ocr-image", async (req) => {
  const form = await req.formData();
  const image = form.get("image") as File | null;
  if (!image) return NextResponse.json({ error: "No image provided (field: image)" }, { status: 400 });

  const lang = (form.get("lang") as string) || "eng";
  const validLangs = ["eng", "msa", "chi_sim", "ara"];
  if (!validLangs.includes(lang))
    return NextResponse.json({ error: `lang must be one of: ${validLangs.join(", ")}` }, { status: 400 });

  const buf = await image.arrayBuffer();

  const { data } = await Tesseract.recognize(Buffer.from(buf), lang, {
    // No logger in API context
  });

  return NextResponse.json({
    text: data.text.trim(),
    confidence: Math.round(data.confidence),
    words: data.words.map((w) => ({ text: w.text, confidence: Math.round(w.confidence) })),
    lang,
  });
});
