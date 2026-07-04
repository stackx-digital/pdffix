import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import StrikeIcTool from "@/components/tools/StrikeIcTool";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";
import ToolSeoContent from "@/components/tools/ToolSeoContent";

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
        <ToolSeoContent steps={["Upload a photo of your IC (JPG/PNG) or use the camera button to capture it directly.", "The IC will be auto-cropped automatically.", "Select the purpose of the copy from the dropdown (e.g. For banking purposes only).", "Drag the stamp to the desired position on the IC and adjust the size and angle.", "Click 'Apply Stamp & Download' to get the stamped image."]} faqs={[{q:"Why should I stamp my IC photocopy?", a:"Stamping your IC copy with a specific purpose prevents it from being misused for other transactions without your consent."},{q:"Is this required by banks and government agencies in Malaysia?", a:"Many Malaysian banks and agencies now recommend or require a stated purpose on IC photocopies to prevent identity fraud."},{q:"Is my IC image uploaded to any server?", a:"No. Your IC image is processed entirely within your browser and is never sent to any server."},{q:"Can I stamp both the front and back of my IC on one page?", a:"Yes, use the 'Front & Back IC' mode to capture both sides and place them on a single A4 white canvas."}]} />
      </main>
      <Footer />
    </div>
  );
}
