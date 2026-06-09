"use client";

import { useState } from "react";
import { Users, Crown, Activity, TrendingUp, Search, ChevronUp, ChevronDown } from "lucide-react";

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
}

type SortKey = "created_at" | "email" | "plan" | "usage_this_month" | "usage_total";

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ms-MY", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminDashboard({ users, stats, topTools }: Props) {
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
          <a href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← Kembali</a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<Users className="w-5 h-5 text-blue-600" />} bg="bg-blue-50" label="Jumlah Pengguna" value={stats.total} />
          <StatCard icon={<Crown className="w-5 h-5 text-amber-500" />} bg="bg-amber-50" label="Pengguna Pro" value={stats.pro} />
          <StatCard icon={<Users className="w-5 h-5 text-green-600" />} bg="bg-green-50" label="Pengguna Free" value={stats.free} />
          <StatCard icon={<Activity className="w-5 h-5 text-red-600" />} bg="bg-red-50" label="Penggunaan Bulan Ini" value={stats.usage_this_month} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
              <h2 className="font-semibold text-gray-900">Senarai Pengguna</h2>
              <div className="flex gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari email / nama..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 w-44"
                  />
                </div>
                {/* Plan filter */}
                <select
                  value={planFilter}
                  onChange={e => setPlanFilter(e.target.value as any)}
                  className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-400"
                >
                  <option value="all">Semua Plan</option>
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <Th label="Pengguna" k="email" sortKey={sortKey} sortAsc={sortAsc} toggle={toggleSort} />
                    <Th label="Plan" k="plan" sortKey={sortKey} sortAsc={sortAsc} toggle={toggleSort} />
                    <Th label="Daftar" k="created_at" sortKey={sortKey} sortAsc={sortAsc} toggle={toggleSort} />
                    <Th label="Bulan Ini" k="usage_this_month" sortKey={sortKey} sortAsc={sortAsc} toggle={toggleSort} />
                    <Th label="Total" k="usage_total" sortKey={sortKey} sortAsc={sortAsc} toggle={toggleSort} />
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">Tiada pengguna dijumpai</td></tr>
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
              {filtered.length} daripada {users.length} pengguna
            </div>
          </div>

          {/* Top tools */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-red-500" /> Alat Popular Bulan Ini
            </h2>
            {topTools.length === 0 && <p className="text-sm text-gray-400">Tiada data lagi</p>}
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

            {/* Quick stats */}
            <div className="mt-6 pt-5 border-t border-gray-100 space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Ringkasan</h3>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Kadar Pro</span>
                <span className="font-semibold text-amber-600">
                  {stats.total > 0 ? Math.round((stats.pro / stats.total) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Purata penggunaan/user</span>
                <span className="font-semibold text-gray-700">
                  {stats.total > 0 ? (stats.usage_this_month / stats.total).toFixed(1) : 0}
                </span>
              </div>
            </div>
          </div>
        </div>
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
