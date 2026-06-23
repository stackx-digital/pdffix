"use client";

import { useState } from "react";
import { Users, Crown, Activity, TrendingUp, Search, ChevronUp, ChevronDown, BookOpen, ExternalLink, Tag, Calendar } from "lucide-react";
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
  const [tab, setTab] = useState<"users" | "blog">("users");
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
        </div>

        {tab === "blog" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Blog Posts</h2>
              <a href="/blog" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-red-600 hover:underline">
                View Blog <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <div className="p-5">
              <p className="text-xs text-gray-400 mb-4">Posts are stored as MDX files in <code className="bg-gray-100 px-1 rounded">src/content/blog/</code>. Add a new <code className="bg-gray-100 px-1 rounded">.mdx</code> file to publish a new post.</p>
              {posts.length === 0 ? (
                <p className="text-gray-400 text-sm py-6 text-center">No blog posts yet.</p>
              ) : (
                <div className="space-y-3">
                  {posts.map((post) => (
                    <div key={post.slug} className="flex items-start justify-between gap-4 p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                      <div className="flex-1 min-w-0">
                        <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className="font-medium text-gray-900 hover:text-red-600 transition-colors text-sm flex items-center gap-1.5">
                          {post.title} <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-50" />
                        </a>
                        <p className="text-xs text-gray-400 mt-1 truncate">{post.description}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Calendar className="w-3 h-3" />{fmt(post.date)}
                          </span>
                          <div className="flex gap-1 flex-wrap">
                            {post.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="flex items-center gap-0.5 px-1.5 py-0.5 bg-red-50 text-red-600 text-xs rounded-full">
                                <Tag className="w-2.5 h-2.5" />{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 font-mono whitespace-nowrap shrink-0">{post.slug}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

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
