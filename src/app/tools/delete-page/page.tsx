import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DeletePageTool from "@/components/tools/DeletePageTool";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";

export const metadata: Metadata = {
  title: "Delete PDF Pages — Free Online Tool | PDFix",
  description: "Remove specific pages from your PDF file for free.",
  alternates: { canonical: "https://pdfix.my/tools/delete-page" },
};

export default async function DeletePagePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Delete PDF Pages</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Select the pages you want to remove, then download the updated PDF.
          </p>
        </div>
        <ToolErrorBoundary toolName="Delete PDF Pages"><DeletePageTool /></ToolErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}
