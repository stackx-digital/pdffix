import { redirect } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PDF ke Word — PDFFix Pro",
  description: "Tukar PDF kepada dokumen Word yang boleh diedit.",
};

export default async function PdfToWordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/tools/pdf-to-word");

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  if (profile?.plan !== "pro") redirect("/pricing");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-12 w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">PDF ke Word</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Penukaran PDF ke Word memerlukan pemprosesan di server melalui CloudConvert. Ciri ini akan ditambah tidak lama lagi.
          </p>
        </div>
        <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center text-gray-400">
          <p className="text-lg font-medium">Akan datang</p>
          <p className="text-sm mt-1">Ciri ini sedang dalam pembangunan.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
