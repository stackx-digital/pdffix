import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CropPdfTool from "@/components/tools/CropPdfTool";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";
import ToolSeoContent from "@/components/tools/ToolSeoContent";

export const metadata: Metadata = {
  title: "Crop PDF — Free Online PDF Cropping Tool | PDFix",
  description: "Crop or trim specific areas of your PDF pages for free, directly in your browser.",
  alternates: { canonical: "https://pdfix.my/tools/crop-pdf" },
};
export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <div className="min-h-screen flex flex-col"><Navbar user={user} /><main className="flex-1"><ToolErrorBoundary toolName="Crop PDF"><CropPdfTool /></ToolErrorBoundary><ToolSeoContent steps={["Upload your PDF file.", "Set the crop margins for top, bottom, left and right.", "Choose whether to apply to all pages or specific pages.", "Click 'Crop PDF' and download the result."]} faqs={[{q:"Can I crop different pages with different margins?", a:"Currently the same crop settings apply to all pages. For per-page cropping, process the file in batches."},{q:"Will cropping remove content permanently?", a:"The visible area is reduced but the content outside the crop area may still exist in the PDF structure. Use Flatten PDF after cropping to fully remove it."},{q:"What units are used for crop margins?", a:"Margins are specified in points (pt), the standard PDF measurement unit."},{q:"Can I crop a single page PDF?", a:"Yes, single-page and multi-page PDFs are both supported."}]} /></main><Footer /></div>;
}
