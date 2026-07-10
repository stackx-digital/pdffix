import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PdfEditorTool from "@/components/tools/PdfEditorTool";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";
import ToolSeoContent from "@/components/tools/ToolSeoContent";

export const metadata: Metadata = {
  title: "Edit PDF — Free Online PDF Editor | PDFix",
  description: "Add text, draw, highlight, and insert images directly in your PDF file.",
  alternates: { canonical: "https://pdfix.my/tools/edit-pdf" },
};

export default async function EditPdfPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 flex flex-col px-4 py-4 max-w-[1600px] mx-auto w-full">
        <div className="mb-3">
          <h1 className="text-xl font-bold text-gray-900">Edit PDF</h1>
          <p className="text-gray-500 text-xs mt-0.5">Add text, draw, highlight, insert images — right in your browser.</p>
        </div>
        <div className="flex-1 min-h-[600px]">
          <ToolErrorBoundary toolName="Edit PDF"><PdfEditorTool /></ToolErrorBoundary>
        </div>
        <ToolSeoContent steps={["Upload your PDF file.", "Use the toolbar to add text, draw, highlight, or insert shapes.", "Click and drag elements to position them.", "Download the edited PDF when done."]} faqs={[{q:"Can I edit the existing text in a PDF?", a:"You can add new text on top of existing content. Editing original embedded text requires a desktop PDF editor."},{q:"Can I add images to a PDF?", a:"Yes, you can insert image annotations and draw shapes directly on your PDF."},{q:"Will my edits be permanent?", a:"Yes, the downloaded PDF includes all your edits as a flattened layer."},{q:"Does this work on scanned PDFs?", a:"Yes, you can annotate and add text over scanned PDF pages."}]} />
      </main>
    </div>
  );
}
