import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy — PDFix",
  description: "PDFix Privacy Policy. Learn how we protect your data and privacy.",
  alternates: { canonical: "https://pdfix.my/privacy-policy" },
};

export default async function PrivacyPolicyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-16 w-full">
        <div className="mb-10">
          <p className="text-xs font-semibold text-red-600 uppercase tracking-widest mb-3">Privacy</p>
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="text-gray-500 mt-2 text-sm">Effective Date: 13 June 2026</p>
        </div>

        <div className="prose prose-gray max-w-none space-y-10 text-sm leading-relaxed">

          {/* Section 1 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Introduction</h2>
            <p className="text-gray-600">
              PDFix ("we", "our service") operates under <strong>Stack Digital</strong>.
              This Privacy Policy explains how we collect, use, and protect your information
              when you use the website <strong>pdfix.my</strong>.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Your PDF Files — 100% Private</h2>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-3">
              <p className="text-green-800 font-medium">
                ✅ The PDF files and images you process are <strong>never sent to our servers</strong>.
                All processing happens directly in your device's browser.
                We have no access to the contents of your files.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-gray-800 mb-1">a) Account Information (if you register):</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
                  <li>Email address</li>
                  <li>Full name (optional)</li>
                  <li>Password (stored in encrypted form)</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-800 mb-1">b) Usage Data:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
                  <li>PDF tools used (e.g., "compress-pdf", "merge-pdf")</li>
                  <li>Number of files processed</li>
                  <li>Date and time of usage</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-800 mb-1">c) Technical Data (automatic):</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
                  <li>Browser type and device</li>
                  <li>IP address</li>
                  <li>Website behaviour data via Microsoft Clarity (analytics)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. How We Use Your Information</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
              <li>Managing your account and login authentication</li>
              <li>Tracking free plan usage limits (5 uses/month)</li>
              <li>Improving our service based on usage patterns</li>
              <li>Sending account-related emails (verification, password reset)</li>
            </ul>
            <p className="text-gray-600 mt-3">We <strong>do not</strong> sell your information to third parties.</p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Third-Party Services</h2>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Service</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Purpose</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Privacy Policy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { name: "Supabase", purpose: "Database & authentication", url: "https://supabase.com/privacy" },
                    { name: "Microsoft Clarity", purpose: "Behaviour analytics", url: "https://privacy.microsoft.com" },
                    { name: "Stripe", purpose: "Payment processing (Pro)", url: "https://stripe.com/privacy" },
                    { name: "Resend", purpose: "Email delivery", url: "https://resend.com/privacy" },
                  ].map((s) => (
                    <tr key={s.name}>
                      <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                      <td className="px-4 py-3 text-gray-600">{s.purpose}</td>
                      <td className="px-4 py-3">
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">
                          Read →
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Data Storage</h2>
            <p className="text-gray-600">
              Your data is stored on <strong>Supabase</strong> servers located in the
              Asia Pacific region (Singapore). Data is protected with SSL/TLS encryption in transit.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Your Rights</h2>
            <ul className="text-gray-600 space-y-2 ml-2">
              {[
                { right: "Access", desc: "Request a copy of your personal data" },
                { right: "Correction", desc: "Update any inaccurate information" },
                { right: "Deletion", desc: "Request that your account and data be permanently deleted" },
                { right: "Withdrawal of Consent", desc: "Stop using the service at any time" },
              ].map((item) => (
                <li key={item.right} className="flex gap-2">
                  <span className="font-medium text-gray-800 min-w-fit">• {item.right}:</span>
                  <span>{item.desc}</span>
                </li>
              ))}
            </ul>
            <p className="text-gray-600 mt-3">
              To make any request, contact us at:{" "}
              <a href="mailto:stackxdigital@gmail.com" className="text-red-600 hover:underline font-medium">
                stackxdigital@gmail.com
              </a>
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Cookies</h2>
            <p className="text-gray-600">
              We use session cookies to maintain your login state. Microsoft Clarity analytics
              cookies are used to understand website usage patterns.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Changes to This Policy</h2>
            <p className="text-gray-600">
              We may update this Privacy Policy from time to time. Significant changes
              will be communicated via email or a notice on the website.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Contact Us</h2>
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-gray-600 space-y-1">
              <p><strong className="text-gray-800">Stack Digital</strong></p>
              <p>Email: <a href="mailto:stackxdigital@gmail.com" className="text-red-600 hover:underline">stackxdigital@gmail.com</a></p>
              <p>Website: <a href="https://pdfix.my" className="text-red-600 hover:underline">pdfix.my</a></p>
            </div>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 text-center">
          <Link href="/" className="text-sm text-red-600 hover:underline">← Back to home</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
