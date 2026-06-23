import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Terms of Service — PDFix",
  description: "PDFix Terms of Service. Read our terms before using the platform.",
  alternates: { canonical: "https://pdfix.my/terms" },
};

export default async function TermsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const sections = [
    {
      title: "1. Acceptance of Terms",
      content: `By using PDFix (pdfix.my), you agree to comply with these terms of service. If you do not agree, please stop using this service.`,
    },
    {
      title: "2. Service Description",
      content: `PDFix provides browser-based PDF processing tools. All file processing is done entirely in your browser — no files are sent to our servers. Basic features are free; advanced features are available through the Pro plan.`,
    },
    {
      title: "3. User Accounts",
      content: `You are responsible for maintaining the confidentiality of your account password. You agree not to share your account with others. PDFix reserves the right to suspend or terminate accounts that violate these terms.`,
    },
    {
      title: "4. Permitted Use",
      content: `You agree to use PDFix only for lawful purposes. You may not use this service to process documents that violate copyright or applicable laws, or for any illegal purpose.`,
    },
    {
      title: "5. Privacy & Data",
      content: `Because all processing occurs in your browser, PDFix does not store the contents of your files. We only store usage metadata (file name, file size, tool used) for activity history purposes. Please read our Privacy Policy for more information.`,
    },
    {
      title: "6. Pro Plan & Payments",
      content: `The Pro plan is charged at RM19/month via ToyyibPay. Payments are non-refundable except in certain circumstances. Subscriptions may be cancelled at any time; Pro access will end at the conclusion of the paid period.`,
    },
    {
      title: "7. Limitation of Liability",
      content: `PDFix is provided "as is" without any warranties. We are not responsible for any data loss or damage arising from the use of this service. Always keep a copy of your original documents.`,
    },
    {
      title: "8. Changes to Terms",
      content: `PDFix reserves the right to modify these terms at any time. Changes take effect as soon as they are published on this website. Continued use after changes constitutes acceptance of the new terms.`,
    },
    {
      title: "9. Contact Us",
      content: `For any inquiries regarding these terms, please contact us at stackxdigital@gmail.com.`,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-16 w-full">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
          <p className="text-gray-500 mt-2 text-sm">Last updated: June 2025</p>
        </div>

        <div className="space-y-8">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">{s.title}</h2>
              <p className="text-gray-600 leading-relaxed">{s.content}</p>
            </section>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 text-sm text-gray-400 flex gap-4">
          <Link href="/privacy-policy" className="hover:text-red-600">Privacy Policy</Link>
          <Link href="/pricing" className="hover:text-red-600">Pricing</Link>
          <Link href="/" className="hover:text-red-600">Home</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
