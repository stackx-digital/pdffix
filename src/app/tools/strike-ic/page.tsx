import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import StrikeIcTool from "@/components/tools/StrikeIcTool";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";

export const metadata: Metadata = {
  title: "Strike IC Photocopy — Free Online Tool | PDFix",
  description: "Add a diagonal cross and purpose label to your Malaysian IC photocopy to prevent misuse. 100% free, processed in your browser — your image is never uploaded.",
  alternates: { canonical: "https://pdfix.my/tools/strike-ic" },
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
