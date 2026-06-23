"use client";

import { useState, useEffect } from "react";

export interface UsageStatus {
  used: number;
  limit: number | null;
  canProceed: boolean;
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
      .catch((err) => {
        if (process.env.NODE_ENV === "development") console.error("useUsageLimit fetch error:", err);
      });
  }, []);

  async function checkLimit(): Promise<boolean> {
    try {
      const res = await fetch("/api/usage");
      const data: UsageStatus = await res.json();
      setStatus(data);
      if (!data.canProceed) {
        setLimitReached(true);
        return false;
      }
      return true;
    } catch {
      return true;
    }
  }

  async function recordUsage(fileName?: string, fileSize?: number) {
    try {
      const res = await fetch("/api/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool, file_name: fileName, file_size: fileSize }),
      });
      const data = await res.json();
      if (data.limitReached) {
        setLimitReached(true);
        return;
      }
      setStatus((prev) => {
        if (!prev || prev.limit === null) return prev;
        const used = prev.used + 1;
        return { ...prev, used, canProceed: used < prev.limit };
      });
    } catch {}
  }

  return { status, limitReached, checkLimit, recordUsage };
}
