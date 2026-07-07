"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { parseUTCDate } from "@/lib/utils";
import type { Complaint, Technician, User } from "@/types";
import {
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const statusStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function AdminComplaints() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    const u = getStoredUser();
    if (!u || u.role !== "admin") {
      router.push("/login");
      return;
    }
    setUser(u);
    loadData();
  }, []);

  async function loadData() {
    try {
      const [c, t] = await Promise.all([
        api.admin.complaints.list(),
        api.admin.technicians.list(),
      ]);
      setComplaints(c);
      setTechnicians(t);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  function techName(id: number | undefined): string {
    if (!id) return "Unassigned"
    const tech = technicians.find((t) => t.id === id)
    return tech?.user?.name || `Tech #${id}`
  }

  const filtered = complaints.filter((c) => {
    const matchSearch = !search
      || c.title.toLowerCase().includes(search.toLowerCase())
      || c.category.toLowerCase().includes(search.toLowerCase())
      || c.hostel_block?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || c.status === statusFilter
    const matchCategory = !categoryFilter || c.category === categoryFilter
    return matchSearch && matchStatus && matchCategory
  })

  return (
    <DashboardLayout
      user={user}
      role="admin"
      title="All Complaints"
      subtitle="Review, manage, and override complaint assignments across the institution."
    >
      {error && (
        <div className="flex items-center gap-2 text-sm text-error bg-error-container/30 px-4 py-3 rounded-xl mb-6 border border-error/10">
          <AlertCircle className="size-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-2xl soft-shadow border border-slate-50">
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Total Active</p>
          <p className="text-3xl font-bold text-on-surface">{complaints.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl soft-shadow border border-slate-50">
          <p className="text-xs font-bold text-tertiary uppercase tracking-widest mb-1">Pending</p>
          <p className="text-3xl font-bold text-on-surface">
            {complaints.filter((c) => c.status === "pending").length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl soft-shadow border border-slate-50">
          <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">In Progress</p>
          <p className="text-3xl font-bold text-on-surface">
            {complaints.filter((c) => c.status === "in_progress").length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl soft-shadow border border-slate-50">
          <p className="text-xs font-bold text-outline uppercase tracking-widest mb-1">Resolved</p>
          <p className="text-3xl font-bold text-on-surface">
            {complaints.filter((c) => c.status === "completed").length}
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-outline" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search complaints..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        >
          <option value="">All categories</option>
          <option value="plumbing">Plumbing</option>
          <option value="electrical">Electrical</option>
          <option value="wifi">WiFi</option>
          <option value="carpentry">Carpentry</option>
          <option value="cleaning">Cleaning</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-2xl soft-shadow border border-slate-100 overflow-hidden animate-pulse">
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-surface-container rounded-xl" />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl soft-shadow border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low/50 border-b border-outline-variant/10">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-bold text-outline uppercase tracking-wider">ID & Title</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-outline uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-outline uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-outline uppercase tracking-wider">Assigned To</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-outline uppercase tracking-wider text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length > 0 ? (
                  filtered.map((c) => {
                    const statusStyle = statusStyles[c.status] || statusStyles.pending;
                    return (
                      <tr
                        key={c.id}
                        className="hover:bg-surface-container-low transition-colors cursor-pointer group"
                        onClick={() => router.push(`/admin/complaints/${c.id}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-on-surface">
                              #{c.id.toString().padStart(5, "0")}
                            </span>
                            <span className="text-xs text-on-surface-variant truncate max-w-[250px]">
                              {c.title}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${statusStyle}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              c.status === "pending" ? "bg-amber-500" :
                              c.status === "in_progress" ? "bg-blue-500" :
                              c.status === "completed" ? "bg-green-500" : "bg-slate-400"
                            }`} />
                            {c.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-on-surface-variant">
                          {c.category}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center text-[10px] font-bold text-primary">
                              {c.assigned_to ? techName(c.assigned_to).charAt(0).toUpperCase() : "?"}
                            </div>
                            <span className="text-xs text-on-surface">
                              {techName(c.assigned_to)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-xs text-outline">
                          {parseUTCDate(c.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>

                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-outline">
                      No complaints found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-50 bg-surface-bright">
            <p className="text-xs text-on-surface-variant">
              Showing <span className="font-bold">{filtered.length}</span> of{" "}
              <span className="font-bold">{complaints.length}</span> complaints
            </p>

          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
