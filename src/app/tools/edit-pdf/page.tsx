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
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar user={user} />
      <main className="flex-1 flex flex-col overflow-hidden px-4 py-4 max-w-[1600px] mx-auto w-full">
        <div className="mb-3">
          <h1 className="text-xl font-bold text-gray-900">Edit PDF</h1>
          <p className="text-gray-500 text-xs mt-0.5">Add text, draw, highlight, insert images — right in your browser.</p>
        </div>
        <div className="flex-1 overflow-hidden">
          <ToolErrorBoundary toolName="Edit PDF"><PdfEditorTool /></ToolErrorBoundary>
        </div>
      </main>
    </div>
  );
}
