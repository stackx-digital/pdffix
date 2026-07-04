import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FlattenPdfTool from "@/components/tools/FlattenPdfTool";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";
import ToolSeoContent from "@/components/tools/ToolSeoContent";

export const metadata: Metadata = {
  title: "Flatten PDF — Free Online Tool | PDFix",
  description: "Flatten PDF forms and annotations to make them non-editable. Free and secure.",
  alternates: { canonical: "https://pdfix.my/tools/flatten-pdf" },
};
export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <div className="min-h-screen flex flex-col"><Navbar user={user} /><main className="flex-1"><ToolErrorBoundary toolName="Flatten PDF"><FlattenPdfTool /></ToolErrorBoundary><ToolSeoContent steps={["Upload your PDF file that contains form fields, annotations or layers.", "Click 'Flatten PDF'.", "Wait for processing.", "Download the flattened PDF."]} faqs={[{q:"What does flattening a PDF mean?", a:"Flattening merges all interactive form fields, annotations and layers into the static page content, making them uneditable."},{q:"Why would I need to flatten a PDF?", a:"Flattening ensures the document looks the same on all viewers and prevents others from changing filled-in form data."},{q:"Can I unflatten a PDF after flattening?", a:"No, flattening is permanent. Keep a copy of the original if you may need to edit it later."},{q:"Does flattening affect the visual appearance?", a:"No, the document should look identical before and after flattening."}]} /></main><Footer /></div>;
}
