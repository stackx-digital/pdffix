import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WatermarkTool from "@/components/tools/WatermarkTool";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";
import ToolSeoContent from "@/components/tools/ToolSeoContent";

export const metadata: Metadata = {
  title: "Watermark PDF — Free Online Tool | PDFix",
  description: "Add a text or image watermark to your PDF for free.",
  alternates: { canonical: "https://pdfix.my/tools/watermark" },
};

export default async function WatermarkPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Watermark PDF</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Add a text or image watermark to all pages of your PDF.
          </p>
        </div>
        <ToolErrorBoundary toolName="Watermark PDF"><WatermarkTool /></ToolErrorBoundary>
        <ToolSeoContent steps={["Upload your PDF file.", "Type the watermark text and customise the font size, opacity, and angle.", "Preview the result on the canvas.", "Click 'Apply Watermark' and download."]} faqs={[{q:"Can I use an image as a watermark?", a:"Currently text watermarks are supported. Image watermarks may be added in a future update."},{q:"Can I control the transparency of the watermark?", a:"Yes, adjust the opacity slider to make the watermark more or less visible."},{q:"Will the watermark appear on every page?", a:"Yes, the watermark is applied uniformly across all pages."},{q:"Can the watermark be removed after adding?", a:"Once the PDF is downloaded with the watermark, it cannot be easily removed. Keep the original file as a backup."}]} />
      </main>
      <Footer />
    </div>
  );
}
