"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

interface Props {
  used: number;
  limit: number | null;
  loggedIn: boolean;
}

export default function UsageLimitBanner({ used, limit, loggedIn }: Props) {
  if (limit === null) return null;
  const remaining = limit - used;
  const isExceeded = used >= limit;

  if (isExceeded) {
    if (!loggedIn) {
      return (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800 text-sm">You've used your 5 guest uses this month</p>
            <p className="text-sm text-red-600 mt-0.5">
              <Link href="/auth/register" className="underline font-medium">Create a free account</Link>{" "}
              for unlimited access, larger file sizes & activity history — no credit card required.
            </p>
          </div>
        </div>
      );
    }
    return null;
  }

  if (remaining <= 2) {
    if (!loggedIn) {
      return (
        <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700">
            <strong>{remaining} guest use{remaining !== 1 ? "s" : ""}</strong> left before sign-in required.{" "}
            <Link href="/auth/register" className="underline font-medium">Sign up free</Link> for unlimited access.
          </p>
        </div>
      );
    }
  }

  return null;
}
