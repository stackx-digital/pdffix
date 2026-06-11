import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ExtractPagesTool from "@/components/tools/ExtractPagesTool";
import ToolErrorBoundary from "@/components/tools/ToolErrorBoundary";

export const metadata: Metadata = {
  title: "Ekstrak Halaman PDF Percuma",
  description: "Pilih dan ekstrak halaman tertentu dari PDF anda. Percuma, tiada upload ke server.",
};
export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <div className="min-h-screen flex flex-col"><Navbar user={user} /><main className="flex-1"><ToolErrorBoundary toolName="Ekstrak Halaman PDF"><ExtractPagesTool /></ToolErrorBoundary></main><Footer /></div>;
}
