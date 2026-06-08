import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AddPageNumbersTool from "@/components/tools/AddPageNumbersTool";

export const metadata: Metadata = {
  title: "Tambah Nombor Halaman PDF Percuma",
  description: "Tambah nombor halaman pada PDF anda secara automatik. Percuma, selamat dan terus dalam pelayar.",
};
export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <div className="min-h-screen flex flex-col"><Navbar user={user} /><main className="flex-1"><AddPageNumbersTool /></main><Footer /></div>;
}
