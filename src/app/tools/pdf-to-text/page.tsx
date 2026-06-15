import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PdfToTextTool from "@/components/tools/PdfToTextTool";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";

export const metadata: Metadata = {
  title: "PDF ke Teks Percuma — Ekstrak Teks dari PDF",
  description: "Tukar PDF kepada fail teks (.txt) secara percuma. Ekstrak semua teks dari PDF dalam pelayar anda — tiada upload ke pelayan.",
  alternates: { canonical: "https://pdfix.my/tools/pdf-to-text" },
};

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1">
        <ToolErrorBoundary toolName="PDF ke Teks">
          <PdfToTextTool />
        </ToolErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}
