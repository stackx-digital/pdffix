"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      setError("Gagal menghantar email. Sila cuba lagi.");
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-bold text-2xl text-red-600">PDFix</Link>
          <h1 className="mt-4 text-xl font-semibold text-gray-900">Terlupa Kata Laluan</h1>
          <p className="text-sm text-gray-500 mt-1">Kami akan hantar pautan reset ke email anda</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-3xl">✉️</span>
              </div>
              <h2 className="font-semibold text-gray-900">Email Dihantar!</h2>
              <p className="text-sm text-gray-500">
                Kami telah menghantar pautan reset kata laluan ke <strong>{email}</strong>. Sila semak inbox anda.
              </p>
              <p className="text-xs text-gray-400">Tidak dapat email? Semak folder spam atau cuba lagi.</p>
              <button
                onClick={() => { setSent(false); setEmail(""); }}
                className="text-sm text-red-600 hover:underline"
              >
                Cuba email lain
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat E-mel</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="nama@email.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Menghantar..." : "Hantar Pautan Reset"}
              </button>
            </form>
          )}

          <p className="mt-4 text-center text-sm text-gray-500">
            Ingat kata laluan?{" "}
            <Link href="/auth/login" className="text-red-600 hover:underline">
              Log Masuk
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
