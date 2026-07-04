import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import OrganizePdfTool from "@/components/tools/OrganizePdfTool";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";
import ToolSeoContent from "@/components/tools/ToolSeoContent";

export const metadata: Metadata = {
  title: "Organize PDF Pages — Free Online Tool | PDFix",
  description: "Reorder, rearrange, and drag PDF pages into any order you want. Free, right in your browser.",
  alternates: { canonical: "https://pdfix.my/tools/organize-pdf" },
};
export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <div className="min-h-screen flex flex-col"><Navbar user={user} /><main className="flex-1"><ToolErrorBoundary toolName="Organize PDF"><OrganizePdfTool /></ToolErrorBoundary><ToolSeoContent steps={["Upload your PDF file.", "Drag and drop the page thumbnails to reorder them.", "Remove any unwanted pages using the delete button.", "Click 'Save' and download the reorganised PDF."]} faqs={[{q:"Can I also delete pages while organizing?", a:"Yes, you can remove individual pages during the reordering process."},{q:"How many pages can I organize?", a:"There is no page limit — large PDFs may take a moment to load thumbnails."},{q:"Will reordering affect page quality?", a:"No, page content is untouched — only the order changes."},{q:"Can I add pages from another PDF while organizing?", a:"Not directly. Merge both PDFs first using the Merge PDF tool, then organize."}]} /></main><Footer /></div>;
}
