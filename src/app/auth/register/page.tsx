"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Semak e-mel anda</h2>
          <p className="text-gray-500">
            Kami telah hantar pautan pengesahan ke <strong>{email}</strong>. Sila klik pautan tersebut untuk aktifkan akaun anda.
          </p>
          <Link href="/auth/login" className="mt-6 inline-block text-red-600 hover:underline text-sm">
            Kembali ke Log Masuk
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-bold text-2xl text-red-600">PDFFix</Link>
          <h1 className="mt-4 text-xl font-semibold text-gray-900">Daftar Percuma</h1>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Penuh</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Ahmad bin Ali"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mel</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="nama@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kata Laluan</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Sekurang-kurangnya 8 aksara"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Sedang mendaftar..." : "Daftar Sekarang"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            Sudah ada akaun?{" "}
            <Link href="/auth/login" className="text-red-600 hover:underline">
              Log masuk
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
