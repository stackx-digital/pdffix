"use client";

import Link from "next/link";
import { AlertTriangle, Zap } from "lucide-react";

interface Props {
  used: number;
  limit: number | null;
  loggedIn: boolean;
  isPro?: boolean;
}

export default function UsageLimitBanner({ used, limit, loggedIn, isPro }: Props) {
  if (limit === null || isPro) return null;
  const remaining = limit - used;
  const isExceeded = used >= limit;

  if (isExceeded) {
    if (!loggedIn) {
      return (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800 text-sm">You've used your {limit} free uses this month</p>
            <p className="text-sm text-red-600 mt-0.5">
              <Link href="/auth/register" className="underline font-medium">Create a free account</Link>{" "}
              for unlimited access, larger file sizes & activity history — no credit card required.
            </p>
          </div>
        </div>
      );
    }

    // Logged-in free user exceeded limit → prompt upgrade to Pro
    return (
      <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">Monthly limit reached</p>
            <p className="text-sm text-gray-600 mt-0.5">
              You've used all {limit} free uses this month. Upgrade to Pro for unlimited usage, files up to 100MB, OCR, and more.
            </p>
            <div className="flex items-center gap-3 mt-3">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
              >
                <Zap className="w-3.5 h-3.5" /> Upgrade to Pro — RM19/mo
              </Link>
              <span className="text-xs text-gray-400">Resets next month</span>
            </div>
          </div>
        </div>
      </div>
    );
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

    // Logged-in free user almost at limit
    return (
      <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
        <p className="text-sm text-amber-700">
          <strong>{remaining} use{remaining !== 1 ? "s" : ""}</strong> left this month.{" "}
          <Link href="/pricing" className="underline font-medium">Upgrade to Pro</Link> for unlimited access.
        </p>
      </div>
    );
  }

  return null;
}
