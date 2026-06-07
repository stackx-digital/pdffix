"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

interface Props {
  used: number;
  limit: number;
  loggedIn: boolean;
}

export default function UsageLimitBanner({ used, limit, loggedIn }: Props) {
  const remaining = limit - used;
  const isExceeded = used >= limit;

  if (!loggedIn) return null;

  if (isExceeded) {
    return (
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-red-800 text-sm">Had bulanan dicapai</p>
          <p className="text-sm text-red-600 mt-0.5">
            Anda telah menggunakan {used}/{limit} edit bulan ini.{" "}
            <Link href="/pricing" className="underline font-medium">Naik taraf ke Pro</Link> untuk penggunaan tanpa had.
          </p>
        </div>
      </div>
    );
  }

  if (remaining <= 2) {
    return (
      <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
        <p className="text-sm text-amber-700">
          Baki <strong>{remaining} edit</strong> lagi bulan ini.{" "}
          <Link href="/pricing" className="underline">Naik taraf ke Pro</Link> untuk tanpa had.
        </p>
      </div>
    );
  }

  return null;
}
