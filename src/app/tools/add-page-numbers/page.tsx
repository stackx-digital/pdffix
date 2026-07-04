import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AddPageNumbersTool from "@/components/tools/AddPageNumbersTool";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";
import ToolSeoContent from "@/components/tools/ToolSeoContent";

export const metadata: Metadata = {
  title: "Add Page Numbers to PDF — Free Online Tool | PDFix",
  description: "Automatically add page numbers to your PDF for free. Fast, secure, and processed entirely in your browser.",
  alternates: { canonical: "https://pdfix.my/tools/add-page-numbers" },
};
export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <div className="min-h-screen flex flex-col"><Navbar user={user} /><main className="flex-1"><ToolErrorBoundary toolName="Add Page Numbers"><AddPageNumbersTool /></ToolErrorBoundary><ToolSeoContent steps={["Upload your PDF file.", "Choose the position of page numbers: bottom centre, top right, etc.", "Set the starting number and font size.", "Click 'Add Page Numbers' and download."]} faqs={[{q:"Can I choose where the page number appears?", a:"Yes, six positions are supported: bottom left, bottom centre, bottom right, top left, top centre, top right."},{q:"Can I start numbering from a number other than 1?", a:"Yes, set any starting number you prefer."},{q:"Can I add Roman numerals or letters instead of numbers?", a:"Currently only Arabic numerals (1, 2, 3…) are supported."},{q:"Will page numbers be added to all pages?", a:"Yes, numbers are added to every page in the document."}]} /></main><Footer /></div>;
}
