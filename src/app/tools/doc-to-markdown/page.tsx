import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DocToMarkdownTool from "@/components/tools/DocToMarkdownTool";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";
import ToolSeoContent from "@/components/tools/ToolSeoContent";

export const metadata: Metadata = {
  title: "PDF to Markdown - Save AI Tokens | PDFfix",
  description: "Convert PDF or Word files to Markdown (.md) for AI tools like ChatGPT, Claude & Gemini. Markdown uses up to 70% fewer tokens than raw PDF. Free, browser-only.",
  alternates: { canonical: "https://pdfix.my/tools/doc-to-markdown" },
  keywords: ["pdf to markdown", "doc to markdown", "pdf to md", "ai token saver", "chatgpt pdf", "claude pdf", "convert pdf for ai"],
};

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1">
        <ToolErrorBoundary toolName="PDF to Markdown">
          <DocToMarkdownTool />
        </ToolErrorBoundary>
        <ToolSeoContent
          steps={[
            "Upload a PDF or Word (.docx) document.",
            "Click 'Convert to Markdown'.",
            "See the token savings estimate — Markdown is much lighter than PDF.",
            "Copy the Markdown and paste directly into ChatGPT, Claude, or Gemini.",
            "Or download the .md file for later use.",
          ]}
          faqs={[
            { q: "Why use Markdown instead of PDF for AI?", a: "AI models charge by tokens. A PDF contains binary overhead, fonts, and metadata — all counted as tokens. Markdown is plain text, so the same content uses up to 70% fewer tokens, saving money and fitting more content in context." },
            { q: "What file formats are supported?", a: "PDF (.pdf) and Word documents (.docx, .doc) are supported." },
            { q: "Will headings and lists be preserved?", a: "Yes. The converter detects font sizes to identify headings (# H1, ## H2) and converts bullet lists to Markdown syntax." },
            { q: "What about images in the document?", a: "Images are not included — only text is converted. For scanned PDFs with no text layer, use the OCR tool first." },
            { q: "Is my file uploaded anywhere?", a: "No. Everything runs in your browser. Your file never leaves your device." },
          ]}
        />
      </main>
      <Footer />
    </div>
  );
}
