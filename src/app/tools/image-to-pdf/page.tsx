import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ImageToPdfTool from "@/components/tools/ImageToPdfTool";

export const metadata: Metadata = {
  title: "Tukar Imej ke PDF Percuma — JPG PNG ke PDF",
  description: "Tukar imej JPG, PNG atau foto kepada fail PDF percuma. Cepat dan selamat dalam pelayar.",
};
export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <div className="min-h-screen flex flex-col"><Navbar user={user} /><main className="flex-1"><ImageToPdfTool /></main><Footer /></div>;
}
