import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RotatePdfTool from "@/components/tools/RotatePdfTool";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";

export const metadata: Metadata = {
  title: "Putar Halaman PDF Percuma — Rotate PDF Online",
  description: "Putar halaman PDF 90° atau 180° secara percuma. Tiada software diperlukan, terus dalam pelayar.",
};
export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <div className="min-h-screen flex flex-col"><Navbar user={user} /><main className="flex-1"><ToolErrorBoundary toolName="Putar PDF"><RotatePdfTool /></ToolErrorBoundary></main><Footer /></div>;
}
