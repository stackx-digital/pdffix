import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BatchCompressTool from "@/components/tools/BatchCompressTool";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";
import ToolSeoContent from "@/components/tools/ToolSeoContent";

export const metadata: Metadata = {
  title: "Batch Compress PDF — Free Online Tool | PDFix",
  description: "Compress multiple PDF files at once without losing quality. Free and secure, processed in your browser.",
  alternates: { canonical: "https://pdfix.my/tools/batch-compress" },
};
export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <div className="min-h-screen flex flex-col"><Navbar user={user} /><main className="flex-1"><ToolErrorBoundary toolName="Batch Compress PDF"><BatchCompressTool /></ToolErrorBoundary><ToolSeoContent steps={["Upload multiple PDF files at once.", "Select the compression level to apply to all files.", "Click 'Compress All' and wait for processing.", "Download each compressed PDF individually."]} faqs={[{q:"How many files can I compress at once?", a:"There is no hard limit, though compressing many large files simultaneously may slow down your browser."},{q:"Are all files compressed at the same settings?", a:"Yes, the same compression level is applied to all files in the batch."},{q:"Will I get one ZIP file or individual downloads?", a:"Each file can be downloaded individually after processing."},{q:"Is batch processing secure?", a:"Yes, all processing happens in your browser. No files are uploaded to any external server."}]} /></main><Footer /></div>;
}
