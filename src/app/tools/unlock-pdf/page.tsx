import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import UnlockPdfTool from "@/components/tools/UnlockPdfTool";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";

export const metadata: Metadata = {
  title: "Unlock PDF — Free Online PDF Unlocker | PDFix",
  description: "Remove passwords and restrictions from PDF files for free. Secure — your file never leaves your device.",
  alternates: { canonical: "https://pdfix.my/tools/unlock-pdf" },
};
export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <div className="min-h-screen flex flex-col"><Navbar user={user} /><main className="flex-1"><ToolErrorBoundary toolName="Unlock PDF"><UnlockPdfTool /></ToolErrorBoundary></main><Footer /></div>;
}
