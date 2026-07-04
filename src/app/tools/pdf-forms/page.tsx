import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PdfFormsTool from "@/components/tools/PdfFormsTool";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";
import ToolSeoContent from "@/components/tools/ToolSeoContent";

export const metadata: Metadata = {
  title: "Fill PDF Forms Online — Free Tool | PDFix",
  description: "Fill in PDF forms directly in your browser without printing. Free, easy, and secure.",
  alternates: { canonical: "https://pdfix.my/tools/pdf-forms" },
};
export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <div className="min-h-screen flex flex-col"><Navbar user={user} /><main className="flex-1"><ToolErrorBoundary toolName="PDF Forms"><PdfFormsTool /></ToolErrorBoundary><ToolSeoContent steps={["Upload a PDF file that contains fillable form fields.", "Click on each field and type your information.", "Review all fields before saving.", "Download the completed PDF form."]} faqs={[{q:"What types of form fields are supported?", a:"Text fields, checkboxes, radio buttons and dropdown lists are all supported."},{q:"Can I save and come back to finish later?", a:"Downloads are immediate. Save the completed PDF to your device to keep a record."},{q:"Will the form fields remain editable after downloading?", a:"By default, yes. Use the Flatten PDF tool if you want to lock the form values."},{q:"Does this work on all PDF forms?", a:"It works on standard interactive PDFs. Scanned paper forms without form fields require the OCR tool to extract text."}]} /></main><Footer /></div>;
}
