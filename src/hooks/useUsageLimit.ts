"use client";

import { useState, useEffect } from "react";

interface UsageStatus {
  used: number;
  limit: number | null;
  canProceed: boolean;
  isPro: boolean;
  loggedIn: boolean;
}

export function useUsageLimit(tool: string) {
  const [status, setStatus] = useState<UsageStatus | null>(null);
  const [limitReached, setLimitReached] = useState(false);

  useEffect(() => {
    fetch("/api/usage")
      .then((r) => r.json())
      .then((data: UsageStatus) => {
        setStatus(data);
        if (!data.canProceed) setLimitReached(true);
      })
      .catch(() => {});
  }, []);

  async function recordUsage() {
    try {
      await fetch("/api/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool }),
      });
      // Update local status
      setStatus((prev) => {
        if (!prev || prev.isPro) return prev;
        const used = prev.used + 1;
        return { ...prev, used, canProceed: used < (prev.limit ?? Infinity) };
      });
    } catch {}
  }

  // Call this before processing — returns true if allowed, false if limit reached
  async function checkLimit(): Promise<boolean> {
    const res = await fetch("/api/usage");
    const data: UsageStatus = await res.json();
    setStatus(data);
    if (!data.canProceed) {
      setLimitReached(true);
      return false;
    }
    return true;
  }

  return { status, limitReached, checkLimit, recordUsage };
}
