import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import UnlockPdfTool from "@/components/tools/UnlockPdfTool";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";
import ToolSeoContent from "@/components/tools/ToolSeoContent";

export const metadata: Metadata = {
  title: "Unlock PDF — Free Online PDF Unlocker | PDFix",
  description: "Remove passwords and restrictions from PDF files for free. Secure — your file never leaves your device.",
  alternates: { canonical: "https://pdfix.my/tools/unlock-pdf" },
};
export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <div className="min-h-screen flex flex-col"><Navbar user={user} /><main className="flex-1"><ToolErrorBoundary toolName="Unlock PDF"><UnlockPdfTool /></ToolErrorBoundary><ToolSeoContent steps={["Upload your password-protected PDF file.", "Enter the password if you know it.", "Click 'Unlock PDF'.", "Download the unlocked PDF that can be opened without a password."]} faqs={[{q:"What if I have forgotten the PDF password?", a:"This tool requires you to provide the correct password. It does not brute-force or bypass encryption."},{q:"Is it legal to unlock a PDF?", a:"Yes, if you own the document or have authorisation from the owner to remove the password protection."},{q:"What type of PDF protection can be removed?", a:"Open passwords (required to view the file) and permission restrictions (printing, copying) can both be removed."},{q:"Will unlocking change the content of the PDF?", a:"No, only the password protection layer is removed. All content remains intact."}]} /></main><Footer /></div>;
}
