"use client";

import { useState, useRef, useEffect } from "react";
import { Users, Crown, Activity, TrendingUp, Search, ChevronUp, ChevronDown, BookOpen, ExternalLink, Tag, Calendar, Upload, Trash2, Eye, EyeOff, CheckCircle2, AlertCircle, Key, BarChart2, Copy, Plus, ArrowUp, ArrowDown, Minus } from "lucide-react";
import type { PostMeta } from "@/lib/blog";

interface User {
  id: string;
  email: string;
  full_name: string;
  plan: "free" | "pro";
  created_at: string;
  usage_this_month: number;
  usage_total: number;
}

interface Props {
  users: User[];
  stats: { total: number; pro: number; free: number; usage_this_month: number };
  topTools: { tool: string; count: number }[];
  posts: PostMeta[];
}

type SortKey = "created_at" | "email" | "plan" | "usage_this_month" | "usage_total";

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminDashboard({ users, stats, topTools, posts }: Props) {
  const [tab, setTab] = useState<"users" | "blog" | "apikeys" | "seo">("users");
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<"all" | "free" | "pro">("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortAsc, setSortAsc] = useState(false);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(false); }
  }

  const filtered = users
    .filter(u => {
      if (planFilter !== "all" && u.plan !== planFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return u.email.toLowerCase().includes(q) || u.full_name.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      let va: string | number = a[sortKey];
      let vb: string | number = b[sortKey];
      if (typeof va === "string") va = va.toLowerCase();
      if (typeof vb === "string") vb = vb.toLowerCase();
      return sortAsc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronUp className="w-3 h-3 text-gray-300" />;
    return sortAsc ? <ChevronUp className="w-3 h-3 text-red-500" /> : <ChevronDown className="w-3 h-3 text-red-500" />;
  }

  const maxToolCount = topTools[0]?.count ?? 1;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <span className="font-bold text-xl text-red-600">PDFix</span>
            <span className="text-gray-400 mx-2">·</span>
            <span className="text-gray-600 font-medium">Admin Dashboard</span>
          </div>
          <a href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← Back</a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<Users className="w-5 h-5 text-blue-600" />} bg="bg-blue-50" label="Total Users" value={stats.total} />
          <StatCard icon={<Crown className="w-5 h-5 text-amber-500" />} bg="bg-amber-50" label="Pro Users" value={stats.pro} />
          <StatCard icon={<Users className="w-5 h-5 text-green-600" />} bg="bg-green-50" label="Free Users" value={stats.free} />
          <StatCard icon={<Activity className="w-5 h-5 text-red-600" />} bg="bg-red-50" label="Usage This Month" value={stats.usage_this_month} />
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 border-b border-gray-200">
          <button
            onClick={() => setTab("users")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === "users" ? "border-red-600 text-red-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            <Users className="w-4 h-4" /> Users
          </button>
          <button
            onClick={() => setTab("blog")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === "blog" ? "border-red-600 text-red-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            <BookOpen className="w-4 h-4" /> Blog Posts
            <span className="ml-1 px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{posts.length}</span>
          </button>
          <button
            onClick={() => setTab("apikeys")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === "apikeys" ? "border-red-600 text-red-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            <Key className="w-4 h-4" /> API Keys
          </button>
          <button
            onClick={() => setTab("seo")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === "seo" ? "border-red-600 text-red-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            <BarChart2 className="w-4 h-4" /> SEO Rankings
          </button>
        </div>

        {tab === "blog" && <BlogManager initialPosts={posts} />}
        {tab === "apikeys" && <ApiKeysManager />}
        {tab === "seo" && <SeoRankings />}

        {tab === "users" && <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
              <h2 className="font-semibold text-gray-900">Users</h2>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search email / name..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 w-44"
                  />
                </div>
                <select
                  value={planFilter}
                  onChange={e => setPlanFilter(e.target.value as any)}
                  className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-400"
                >
                  <option value="all">All Plans</option>
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <Th label="User" k="email" sortKey={sortKey} sortAsc={sortAsc} toggle={toggleSort} />
                    <Th label="Plan" k="plan" sortKey={sortKey} sortAsc={sortAsc} toggle={toggleSort} />
                    <Th label="Joined" k="created_at" sortKey={sortKey} sortAsc={sortAsc} toggle={toggleSort} />
                    <Th label="This Month" k="usage_this_month" sortKey={sortKey} sortAsc={sortAsc} toggle={toggleSort} />
                    <Th label="Total" k="usage_total" sortKey={sortKey} sortAsc={sortAsc} toggle={toggleSort} />
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">No users found</td></tr>
                  )}
                  {filtered.map(u => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 truncate max-w-[180px]">{u.email}</div>
                        {u.full_name && <div className="text-xs text-gray-400 truncate">{u.full_name}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${u.plan === "pro" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}>
                          {u.plan === "pro" && <Crown className="w-3 h-3" />}
                          {u.plan === "pro" ? "Pro" : "Free"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmt(u.created_at)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-semibold ${u.usage_this_month > 0 ? "text-red-600" : "text-gray-300"}`}>{u.usage_this_month}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-semibold text-gray-700">{u.usage_total}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
              {filtered.length} of {users.length} users
            </div>
          </div>

          {/* Top tools */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-red-500" /> Top Tools This Month
            </h2>
            {topTools.length === 0 && <p className="text-sm text-gray-400">No data yet</p>}
            <div className="space-y-3">
              {topTools.map(({ tool, count }) => (
                <div key={tool}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 capitalize">{tool.replace(/-/g, " ")}</span>
                    <span className="font-semibold text-gray-900">{count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full transition-all"
                      style={{ width: `${(count / maxToolCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-5 border-t border-gray-100 space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Summary</h3>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Pro rate</span>
                <span className="font-semibold text-amber-600">
                  {stats.total > 0 ? Math.round((stats.pro / stats.total) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Avg usage/user</span>
                <span className="font-semibold text-gray-700">
                  {stats.total > 0 ? (stats.usage_this_month / stats.total).toFixed(1) : 0}
                </span>
              </div>
            </div>
          </div>
        </div>}
      </div>
    </div>
  );
}

function BlogManager({ initialPosts }: { initialPosts: PostMeta[] }) {
  const [posts, setPosts] = useState<PostMeta[]>(initialPosts);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/blog", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        showToast("error", json.error ?? "Upload failed");
      } else {
        showToast("success", `"${json.title}" published successfully`);
      }
    }
    setUploading(false);
    // Refresh list
    const r = await fetch("/api/admin/blog/list");
    if (r.ok) setPosts(await r.json());
    else window.location.reload();
  }

  async function togglePublished(slug: string, current: boolean) {
    const res = await fetch("/api/admin/blog", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, published: !current }),
    });
    if (res.ok) {
      setPosts(prev => prev.map(p => p.slug === slug ? { ...p, published: !current } : p));
    }
  }

  async function deletePost(slug: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    const res = await fetch("/api/admin/blog", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    if (res.ok) {
      setPosts(prev => prev.filter(p => p.slug !== slug));
      showToast("success", "Post deleted");
    } else {
      showToast("error", "Delete failed");
    }
  }

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${toast.type === "success" ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Upload area */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-red-400 hover:bg-red-50 transition-colors cursor-pointer"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleUpload(e.dataTransfer.files); }}
      >
        <input ref={inputRef} type="file" accept=".md,.mdx" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
        <Upload className={`w-8 h-8 mx-auto mb-3 ${uploading ? "text-red-500 animate-pulse" : "text-gray-400"}`} />
        <p className="font-medium text-gray-700">{uploading ? "Uploading..." : "Click or drag .md / .mdx files here"}</p>
        <p className="text-xs text-gray-400 mt-1">Frontmatter fields supported: title, description, date, author, tags, slug</p>
      </div>

      {/* Post list */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">All Posts <span className="text-gray-400 font-normal text-sm">({posts.length})</span></h2>
          <a href="/blog" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-red-600 hover:underline">
            View Blog <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
        <div className="divide-y divide-gray-50">
          {posts.length === 0 && (
            <p className="text-gray-400 text-sm py-10 text-center">No blog posts yet. Upload your first article above.</p>
          )}
          {posts.map((post) => (
            <div key={post.slug} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${post.published ? "bg-green-500" : "bg-gray-300"}`} />
                  <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className="font-medium text-gray-900 hover:text-red-600 transition-colors text-sm flex items-center gap-1">
                    {post.title} <ExternalLink className="w-3 h-3 opacity-40" />
                  </a>
                </div>
                <p className="text-xs text-gray-400 truncate mb-1.5">{post.description}</p>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Calendar className="w-3 h-3" />{fmt(post.date)}
                  </span>
                  {post.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="flex items-center gap-0.5 px-1.5 py-0.5 bg-red-50 text-red-600 text-xs rounded-full">
                      <Tag className="w-2.5 h-2.5" />{tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => togglePublished(post.slug, post.published)}
                  title={post.published ? "Unpublish" : "Publish"}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {post.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => deletePost(post.slug, post.title)}
                  title="Delete"
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── API Keys Manager ────────────────────────────────────────────────────────

interface ApiKey {
  id: string;
  label: string;
  key_prefix: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}

function ApiKeysManager() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState("SEO Agent");
  const [creating, setCreating] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  }

  useEffect(() => {
    fetch("/api/v1/keys").then(r => r.json()).then(d => { setKeys(d.keys ?? []); setLoading(false); });
  }, []);

  async function createKey() {
    if (!newLabel.trim()) return;
    setCreating(true);
    const res = await fetch("/api/v1/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: newLabel.trim() }),
    });
    const json = await res.json();
    setCreating(false);
    if (!res.ok) { showToast("error", json.error ?? "Failed"); return; }
    setRevealedKey(json.key);
    const r = await fetch("/api/v1/keys");
    const d = await r.json();
    setKeys(d.keys ?? []);
  }

  async function revokeKey(id: string, label: string) {
    if (!confirm(`Revoke key "${label}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/v1/keys?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setKeys(prev => prev.filter(k => k.id !== id));
      showToast("success", "Key revoked");
    } else {
      showToast("error", "Revoke failed");
    }
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {toast && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${toast.type === "success" ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Revealed key banner */}
      {revealedKey && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <p className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" /> Save this key — it will not be shown again
          </p>
          <div className="flex items-center gap-2 bg-white border border-amber-300 rounded-xl px-4 py-2.5 font-mono text-sm text-gray-800 break-all">
            <span className="flex-1 select-all">{revealedKey}</span>
            <button onClick={() => copyKey(revealedKey)} className="flex-shrink-0 text-amber-600 hover:text-amber-800">
              {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <button onClick={() => setRevealedKey(null)} className="mt-3 text-xs text-amber-600 hover:underline">
            I've saved the key — dismiss
          </button>
        </div>
      )}

      {/* Create new key */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-red-500" /> Generate New API Key
        </h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            placeholder="Key label (e.g. SEO Agent)"
            className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          <button
            onClick={createKey}
            disabled={creating || !newLabel.trim()}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <Key className="w-4 h-4" /> {creating ? "Generating..." : "Generate Key"}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">Keys start with <code className="bg-gray-100 px-1 rounded">pfx_</code>. Use as <code className="bg-gray-100 px-1 rounded">Authorization: Bearer &lt;key&gt;</code> header.</p>
      </div>

      {/* Keys list */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Active Keys <span className="text-gray-400 font-normal text-sm">({keys.length})</span></h3>
        </div>
        {loading && <p className="text-sm text-gray-400 py-8 text-center">Loading...</p>}
        {!loading && keys.length === 0 && <p className="text-sm text-gray-400 py-8 text-center">No API keys yet.</p>}
        <div className="divide-y divide-gray-50">
          {keys.map((k) => (
            <div key={k.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                <Key className="w-4 h-4 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-medium text-sm text-gray-900">{k.label}</span>
                  <span className={`px-1.5 py-0.5 text-xs rounded-full font-medium ${k.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {k.is_active ? "Active" : "Revoked"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{k.key_prefix}…</span>
                  <span>Created {fmt(k.created_at)}</span>
                  {k.last_used_at && <span>Last used {fmt(k.last_used_at)}</span>}
                </div>
              </div>
              <button
                onClick={() => revokeKey(k.id, k.label)}
                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                title="Revoke key"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* API reference */}
      <div className="bg-gray-900 rounded-2xl p-5 text-sm text-gray-300 space-y-3">
        <p className="text-white font-semibold text-xs uppercase tracking-widest mb-4">API Reference</p>
        {[
          ["GET",    "/api/v1/blog",              "List all posts (?published=true|false)"],
          ["POST",   "/api/v1/blog",              "Create / upsert post (JSON body)"],
          ["GET",    "/api/v1/blog/:slug",         "Get single post"],
          ["PUT",    "/api/v1/blog/:slug",         "Full update"],
          ["PATCH",  "/api/v1/blog/:slug",         "Partial update (e.g. {published:true})"],
          ["DELETE", "/api/v1/blog/:slug",         "Delete post"],
          ["GET",    "/api/v1/seo/rankings",       "Get rankings (?keyword=...&summary=true)"],
          ["POST",   "/api/v1/seo/rankings",       "Submit ranking(s) — single obj or array"],
        ].map(([method, path, desc]) => (
          <div key={path + method} className="flex gap-3 items-start">
            <span className={`font-mono text-xs px-1.5 py-0.5 rounded font-bold flex-shrink-0 mt-0.5 ${
              method === "GET" ? "bg-blue-900 text-blue-300" :
              method === "POST" ? "bg-green-900 text-green-300" :
              method === "PUT" || method === "PATCH" ? "bg-yellow-900 text-yellow-300" :
              "bg-red-900 text-red-300"
            }`}>{method}</span>
            <span className="font-mono text-xs text-gray-400 flex-shrink-0 min-w-[200px]">{path}</span>
            <span className="text-xs text-gray-500">{desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SEO Rankings Dashboard ──────────────────────────────────────────────────

interface RankingRow {
  id: string;
  keyword: string;
  position: number | null;
  url: string;
  search_engine: string;
  location: string;
  checked_at: string;
}

function SeoRankings() {
  const [summary, setSummary] = useState<RankingRow[]>([]);
  const [history, setHistory] = useState<RankingRow[]>([]);
  const [selectedKw, setSelectedKw] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/seo/rankings?summary=true").then(r => r.json()).then(d => {
      setSummary(d.rankings ?? []);
      setLoading(false);
    });
  }, []);

  async function loadHistory(keyword: string) {
    if (selectedKw === keyword) { setSelectedKw(null); setHistory([]); return; }
    setSelectedKw(keyword);
    const r = await fetch(`/api/v1/seo/rankings?keyword=${encodeURIComponent(keyword)}&limit=30`);
    const d = await r.json();
    setHistory(d.rankings ?? []);
  }

  function rankBadge(pos: number | null) {
    if (pos === null) return <span className="text-gray-400 text-xs">—</span>;
    const color = pos <= 3 ? "text-green-600 bg-green-50" : pos <= 10 ? "text-blue-600 bg-blue-50" : pos <= 20 ? "text-yellow-600 bg-yellow-50" : "text-red-600 bg-red-50";
    return <span className={`px-2 py-0.5 rounded-full font-bold text-sm ${color}`}>#{pos}</span>;
  }

  function trendIcon(curr: number | null, prev: number | null) {
    if (curr === null || prev === null) return <Minus className="w-3 h-3 text-gray-300" />;
    if (curr < prev) return <ArrowUp className="w-3 h-3 text-green-500" />;
    if (curr > prev) return <ArrowDown className="w-3 h-3 text-red-500" />;
    return <Minus className="w-3 h-3 text-gray-300" />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Keyword Rankings — Latest</h3>
          <span className="text-xs text-gray-400">{summary.length} keywords tracked</span>
        </div>

        {loading && <p className="text-sm text-gray-400 py-8 text-center">Loading...</p>}
        {!loading && summary.length === 0 && (
          <div className="py-12 text-center">
            <BarChart2 className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No rankings yet. The SEO agent will submit rankings via <code className="bg-gray-100 px-1 rounded">POST /api/v1/seo/rankings</code>.</p>
          </div>
        )}

        {summary.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Keyword</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Position</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">URL</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Last Checked</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Engine</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((row) => (
                  <>
                    <tr
                      key={row.id}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => loadHistory(row.keyword)}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">{row.keyword}</td>
                      <td className="px-4 py-3">{rankBadge(row.position)}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 truncate max-w-[200px]">
                        <a href={row.url} target="_blank" rel="noopener noreferrer" className="hover:text-red-600 hover:underline" onClick={e => e.stopPropagation()}>
                          {row.url.replace("https://pdfix.my", "")}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmt(row.checked_at)}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{row.search_engine} · {row.location}</td>
                    </tr>
                    {selectedKw === row.keyword && history.length > 0 && (
                      <tr key={row.id + "_history"}>
                        <td colSpan={5} className="bg-blue-50 px-6 py-4">
                          <p className="text-xs font-semibold text-blue-700 mb-2">History for "{row.keyword}"</p>
                          <div className="flex flex-wrap gap-2">
                            {history.map((h, i) => (
                              <div key={h.id} className="flex items-center gap-1 bg-white border border-blue-200 rounded-lg px-2 py-1 text-xs">
                                <span className="text-gray-500 whitespace-nowrap">{fmt(h.checked_at)}</span>
                                {trendIcon(h.position, history[i + 1]?.position ?? null)}
                                {rankBadge(h.position)}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, bg, label, value }: { icon: React.ReactNode; bg: string; label: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function Th({ label, k, sortKey, sortAsc, toggle }: { label: string; k: SortKey; sortKey: SortKey; sortAsc: boolean; toggle: (k: SortKey) => void }) {
  return (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-700 select-none whitespace-nowrap"
      onClick={() => toggle(k)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey === k
          ? sortAsc ? <ChevronUp className="w-3 h-3 text-red-500" /> : <ChevronDown className="w-3 h-3 text-red-500" />
          : <ChevronUp className="w-3 h-3 text-gray-300" />}
      </span>
    </th>
  );
}
