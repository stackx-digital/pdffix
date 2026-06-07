import { redirect } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import OcrTool from "@/components/tools/OcrTool";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OCR PDF — Ekstrak Teks — PDFFix",
  description: "Ekstrak teks dari PDF yang diimbas menggunakan OCR dalam pelayar.",
};

export default async function OcrPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/tools/ocr");

  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
  if (profile?.plan !== "pro") redirect("/pricing");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1">
        <OcrTool />
      </main>
      <Footer />
    </div>
  );
}
