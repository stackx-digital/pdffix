"use client";

import { useEffect, useState } from "react";
import { Copy, Plus, Trash2, Key, AlertCircle, CheckCircle, ExternalLink } from "lucide-react";
import Link from "next/link";

interface ApiKey {
  id: string;
  label: string;
  key_prefix: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  monthly_calls: number;
  calls_reset_at: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [quota, setQuota] = useState(100);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/user/api-keys");
    if (res.ok) {
      const data = await res.json();
      setKeys(data.keys ?? []);
      setQuota(data.quota?.free ?? 100);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function create() {
    if (!newLabel.trim()) return;
    setCreating(true);
    setError(null);
    const res = await fetch("/api/user/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: newLabel.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setCreating(false); return; }
    setNewKey(data.key);
    setNewLabel("");
    await load();
    setCreating(false);
  }

  async function revoke(id: string) {
    if (!confirm("Revoke this API key? This cannot be undone.")) return;
    await fetch(`/api/user/api-keys?id=${id}`, { method: "DELETE" });
    await load();
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Key className="w-6 h-6 text-red-600" /> API Keys
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Use these keys to call the PDFix REST API.{" "}
            <Link href="/developers" className="text-red-600 hover:underline" target="_blank">
              View docs <ExternalLink className="inline w-3 h-3" />
            </Link>
          </p>
        </div>
      </div>

      {/* New key revealed */}
      {newKey && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-1">
            <CheckCircle className="w-4 h-4" /> API key created — copy it now, it won&apos;t be shown again
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white border border-green-200 rounded-lg px-3 py-2 text-xs font-mono text-gray-800 break-all">
              {newKey}
            </code>
            <button
              onClick={() => copyKey(newKey)}
              className="shrink-0 px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <button onClick={() => setNewKey(null)} className="mt-2 text-xs text-green-700 hover:underline">
            I&apos;ve saved it — dismiss
          </button>
        </div>
      )}

      {/* Create form */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Generate New Key</h2>
        {error && (
          <p className="text-xs text-red-600 mb-3 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> {error}
          </p>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Key label (e.g. Production)"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400"
          />
          <button
            onClick={create}
            disabled={creating || !newLabel.trim()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            {creating ? "Creating…" : "Create"}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">Maximum 5 active keys per account.</p>
      </div>

      {/* Key list */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-sm text-gray-400 text-center py-8">Loading…</div>
        ) : keys.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-8">No API keys yet. Create one above.</div>
        ) : (
          keys.map((k) => (
            <div key={k.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                <Key className="w-4 h-4 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{k.label}</p>
                <p className="text-xs text-gray-400 font-mono">{k.key_prefix}••••••••••••••••</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-400">
                    {k.monthly_calls}/{quota} calls this month
                  </span>
                  {k.last_used_at && (
                    <span className="text-xs text-gray-400">
                      Last used {new Date(k.last_used_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              {/* Usage bar */}
              <div className="w-24 hidden sm:block">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${Math.min(100, (k.monthly_calls / quota) * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5 text-right">{k.monthly_calls}/{quota}</p>
              </div>
              <button
                onClick={() => revoke(k.id)}
                className="shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Revoke key"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
        <strong>Free tier:</strong> {quota} API calls/month. Upgrade to Pro for unlimited calls.{" "}
        <Link href="/pricing" className="underline">View pricing →</Link>
      </div>
    </div>
  );
}
