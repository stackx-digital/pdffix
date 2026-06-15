import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DocToMarkdownTool from "@/components/tools/DocToMarkdownTool";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";

export const metadata: Metadata = {
  title: "DOC/PDF ke Markdown Percuma — Tukar Word & PDF kepada Markdown",
  description: "Tukar fail Word (.docx, .doc) atau PDF kepada format Markdown (.md) secara percuma. Tiada upload ke pelayan, semua diproses dalam pelayar anda.",
  alternates: { canonical: "https://pdfix.my/tools/doc-to-markdown" },
};

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1">
        <ToolErrorBoundary toolName="DOC/PDF ke Markdown">
          <DocToMarkdownTool />
        </ToolErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}
