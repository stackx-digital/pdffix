import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RotatePdfTool from "@/components/tools/RotatePdfTool";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";
import ToolSeoContent from "@/components/tools/ToolSeoContent";

export const metadata: Metadata = {
  title: "Rotate PDF Pages — Free Online Tool | PDFix",
  description: "Rotate PDF pages 90° or 180° for free. No software needed — works entirely in your browser.",
  alternates: { canonical: "https://pdfix.my/tools/rotate-pdf" },
};
export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <div className="min-h-screen flex flex-col"><Navbar user={user} /><main className="flex-1"><ToolErrorBoundary toolName="Rotate PDF"><RotatePdfTool /></ToolErrorBoundary><ToolSeoContent steps={["Upload your PDF file.", "Select the pages to rotate — all pages or specific ones.", "Choose the rotation angle: 90°, 180°, or 270°.", "Click 'Rotate PDF' and download."]} faqs={[{q:"Can I rotate only specific pages?", a:"Yes, you can choose to rotate all pages or select individual pages to rotate."},{q:"Will rotating affect the text or images?", a:"No, the content is rotated as-is with no quality loss."},{q:"Can I rotate a page back to its original orientation?", a:"Yes, rotating 90° clockwise three times returns a page to its original position, or use 270° directly."},{q:"Does this work for both portrait and landscape PDFs?", a:"Yes, rotation works on any PDF regardless of original orientation."}]} /></main><Footer /></div>;
}
