import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ESignTool from "@/components/tools/ESignTool";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";

export const metadata: Metadata = {
  title: "E-Sign PDF — Free Digital Signature Tool | PDFix",
  description: "Add a digital signature to your PDF for free, directly in your browser.",
  alternates: { canonical: "https://pdfix.my/tools/e-sign" },
};

export default async function ESignPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">E-Sign PDF</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Draw your signature and place it on any page of your PDF.
          </p>
        </div>
        <ToolErrorBoundary toolName="E-Sign PDF"><ESignTool /></ToolErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}
