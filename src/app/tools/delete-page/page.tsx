import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DeletePageTool from "@/components/tools/DeletePageTool";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";
import ToolSeoContent from "@/components/tools/ToolSeoContent";

export const metadata: Metadata = {
  title: "Delete PDF Pages — Free Online Tool | PDFix",
  description: "Remove specific pages from your PDF file for free.",
  alternates: { canonical: "https://pdfix.my/tools/delete-page" },
};

export default async function DeletePagePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Delete PDF Pages</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Select the pages you want to remove, then download the updated PDF.
          </p>
        </div>
        <ToolErrorBoundary toolName="Delete PDF Pages"><DeletePageTool /></ToolErrorBoundary>
        <ToolSeoContent steps={["Upload your PDF file.", "Select the page or pages you want to delete.", "Click 'Delete Pages' to remove them.", "Download the updated PDF."]} faqs={[{q:"Can I delete multiple pages at once?", a:"Yes, you can select multiple pages and delete them all in one step."},{q:"Can I undo a deletion?", a:"The original file on your device is unchanged. If you made a mistake, simply upload the original again."},{q:"What happens if I delete all pages?", a:"You cannot delete all pages — at least one page must remain."},{q:"Is there a limit on how many pages I can delete?", a:"No, you can delete any number of pages as long as at least one remains."}]} />
      </main>
      <Footer />
    </div>
  );
}
