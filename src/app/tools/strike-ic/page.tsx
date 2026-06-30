import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import StrikeIcTool from "@/components/tools/StrikeIcTool";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";

export const metadata: Metadata = {
  title: "Strike IC — Tampal Tujuan Guna Fotokopi IC | PDFix",
  description: "Strike IC secara online percuma. Upload gambar IC (JPG/PNG) atau PDF, pilih tujuan, terus download. Selamat — fail anda tidak diupload ke mana-mana server.",
  alternates: { canonical: "https://pdfix.my/tools/strike-ic" },
  keywords: ["strike ic", "tampal ic", "fotokopi ic", "tujuan ic", "ic photocopy malaysia", "strike ic online", "stamp ic"],
};

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1">
        <ToolErrorBoundary toolName="Strike IC">
          <StrikeIcTool />
        </ToolErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}
