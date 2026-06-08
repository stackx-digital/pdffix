import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import OrganizePdfTool from "@/components/tools/OrganizePdfTool";

export const metadata: Metadata = {
  title: "Susun Halaman PDF Percuma — Atur Semula PDF",
  description: "Susun, atur semula dan seret halaman PDF mengikut urutan yang dikehendaki. Percuma dalam pelayar.",
};
export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <div className="min-h-screen flex flex-col"><Navbar user={user} /><main className="flex-1"><OrganizePdfTool /></main><Footer /></div>;
}
