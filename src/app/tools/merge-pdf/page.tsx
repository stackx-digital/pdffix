import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MergePdfTool from "@/components/tools/MergePdfTool";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";
import ToolSeoContent from "@/components/tools/ToolSeoContent";

export const metadata: Metadata = {
  title: "Merge PDF — Free Online Tool | PDFix",
  description: "Combine multiple PDF files into one in your browser. Secure, no server upload required.",
  alternates: { canonical: "https://pdfix.my/tools/merge-pdf" },
};

export default async function MergePdfPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-12 w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Merge PDF</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Add multiple PDF files and arrange them in the desired order, then merge them into a single file.
          </p>
        </div>
        <ToolErrorBoundary toolName="Merge PDF"><MergePdfTool /></ToolErrorBoundary>
        <ToolSeoContent steps={["Upload two or more PDF files by clicking the upload area or dragging and dropping them.", "Arrange the files in your desired order using the drag handles.", "Click 'Merge PDF' and wait a moment for the files to be combined.", "Download your merged PDF file instantly."]} faqs={[{q:"How many PDF files can I merge at once?", a:"You can merge as many PDF files as you need. There is no hard limit on the number of files."},{q:"Is my data safe when merging PDFs?", a:"Yes. All merging happens directly in your browser — your files are never uploaded to any server."},{q:"Can I rearrange the order of pages after merging?", a:"Yes, use the Organize PDF tool after merging to reorder individual pages."},{q:"What is the maximum file size supported?", a:"There is no strict file size limit, but very large files may take longer to process depending on your device."}]} />
      </main>
      <Footer />
    </div>
  );
}
