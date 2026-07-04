import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DocToMarkdownTool from "@/components/tools/DocToMarkdownTool";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";
import ToolSeoContent from "@/components/tools/ToolSeoContent";

export const metadata: Metadata = {
  title: "DOC/PDF to Markdown — Free Converter | PDFix",
  description: "Convert Word (.docx, .doc) or PDF files to Markdown (.md) format for free. No server upload — everything is processed in your browser.",
  alternates: { canonical: "https://pdfix.my/tools/doc-to-markdown" },
};

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1">
        <ToolErrorBoundary toolName="DOC/PDF to Markdown">
          <DocToMarkdownTool />
        </ToolErrorBoundary>
        <ToolSeoContent steps={["Upload a PDF or Word document.", "Click 'Convert to Markdown'.", "Review the converted Markdown output.", "Download the .md file or copy the text."]} faqs={[{q:"What file formats are accepted?", a:"PDF and Word documents (.docx) are supported."},{q:"Will headings and lists be preserved?", a:"Yes, the converter attempts to detect headings, bullet lists and numbered lists and convert them to Markdown syntax."},{q:"What about images in the document?", a:"Images are not included in the Markdown output — only text content is converted."},{q:"Is the conversion perfect?", a:"Complex layouts may not convert perfectly. Manual cleanup of the Markdown may be needed for intricate documents."}]} />
      </main>
      <Footer />
    </div>
  );
}
