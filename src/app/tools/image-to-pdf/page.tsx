import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ImageToPdfTool from "@/components/tools/ImageToPdfTool";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";
import ToolSeoContent from "@/components/tools/ToolSeoContent";

export const metadata: Metadata = {
  title: "Image to PDF — Free JPG PNG to PDF Converter | PDFix",
  description: "Convert JPG, PNG, or other images to a PDF file for free. Fast and secure, processed in your browser.",
  alternates: { canonical: "https://pdfix.my/tools/image-to-pdf" },
};
export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <div className="min-h-screen flex flex-col"><Navbar user={user} /><main className="flex-1"><ToolErrorBoundary toolName="Image to PDF"><ImageToPdfTool /></ToolErrorBoundary><ToolSeoContent steps={["Upload one or more image files (JPG, PNG, WEBP, etc.).", "Arrange the images in the order you want them to appear.", "Click 'Convert to PDF'.", "Download the resulting PDF."]} faqs={[{q:"What image formats are supported?", a:"JPG, PNG, WEBP, GIF, BMP and most common image formats are supported."},{q:"Can I convert multiple images into one PDF?", a:"Yes, upload multiple images and they will each become a separate page in the PDF."},{q:"Will image quality be reduced?", a:"Images are embedded at high quality. Some slight compression is applied to keep file sizes manageable."},{q:"Is there a limit on how many images I can convert?", a:"No hard limit, though converting very many large images may take longer."}]} /></main><Footer /></div>;
}
