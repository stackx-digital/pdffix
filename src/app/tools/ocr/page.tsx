import { redirect } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import OcrTool from "@/components/tools/OcrTool";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OCR PDF — Ekstrak Teks — PDFFix",
  description: "Ekstrak teks daripada PDF yang mempunyai lapisan teks.",
};

export default async function OcrPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/tools/ocr");

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
          <h1 className="text-2xl font-bold text-gray-900">OCR — Ekstrak Teks</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Ekstrak teks daripada PDF yang mempunyai lapisan teks digital.
          </p>
        </div>
        <OcrTool />
      </main>
      <Footer />
    </div>
  );
}
