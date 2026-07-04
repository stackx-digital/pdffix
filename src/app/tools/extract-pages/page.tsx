import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ExtractPagesTool from "@/components/tools/ExtractPagesTool";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";
import ToolSeoContent from "@/components/tools/ToolSeoContent";

export const metadata: Metadata = {
  title: "Extract PDF Pages — Free Online Tool | PDFix",
  description: "Select and extract specific pages from your PDF for free. No server upload required.",
  alternates: { canonical: "https://pdfix.my/tools/extract-pages" },
};
export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <div className="min-h-screen flex flex-col"><Navbar user={user} /><main className="flex-1"><ToolErrorBoundary toolName="Extract PDF Pages"><ExtractPagesTool /></ToolErrorBoundary><ToolSeoContent steps={["Upload your PDF file.", "Enter the page numbers or ranges you want to extract (e.g. 1-3, 5, 8-10).", "Click 'Extract Pages'.", "Download the new PDF containing only the extracted pages."]} faqs={[{q:"What is the difference between Extract and Split?", a:"Extract lets you pick specific pages and saves them as one PDF. Split divides the file into multiple separate PDFs."},{q:"Can I extract non-consecutive pages?", a:"Yes, enter ranges separated by commas, e.g. 1-2, 5, 8-10."},{q:"Will extracted pages retain their original quality?", a:"Yes, page content is preserved exactly."},{q:"Is my PDF uploaded to a server?", a:"No, extraction happens entirely in your browser."}]} /></main><Footer /></div>;
}
