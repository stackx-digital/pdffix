import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PdfFormsTool from "@/components/tools/PdfFormsTool";

export const metadata: Metadata = {
  title: "Isi Borang PDF Online Percuma",
  description: "Isi borang PDF terus dalam pelayar tanpa perlu print. Percuma, mudah dan selamat.",
};
export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <div className="min-h-screen flex flex-col"><Navbar user={user} /><main className="flex-1"><PdfFormsTool /></main><Footer /></div>;
}
