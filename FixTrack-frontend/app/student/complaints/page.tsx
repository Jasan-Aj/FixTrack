"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { parseUTCDate } from "@/lib/utils";
import type { Complaint, User } from "@/types";
import {
  AlertCircle,
  WifiOff,
  Lightbulb,
  Snowflake,
  Wrench,
  Loader2,
  Search,
  ArrowLeft,
} from "lucide-react";

const statusConfig: Record<string, { label: string; class: string; dot: string }> = {
  pending: {
    label: "Pending",
    class: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  in_progress: {
    label: "In Progress",
    class: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  completed: {
    label: "Resolved",
    class: "bg-green-50 text-green-700 border-green-200",
    dot: "bg-green-500",
  },
  cancelled: {
    label: "Closed",
    class: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  },
};

const categoryIcons: Record<string, typeof Wrench> = {
  wifi: WifiOff,
  electrical: Lightbulb,
  plumbing: Snowflake,
  cleaning: AlertCircle,
  carpentry: Wrench,
  other: AlertCircle,
};

export default function StudentComplaints() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    const u = getStoredUser();
    if (!u || u.role !== "student") {
      router.push("/login");
      return;
    }
    setUser(u);
    loadComplaints();
  }, []);

  async function loadComplaints() {
    try {
      const data = await api.complaints.list();
      const sorted = data.sort(
        (a, b) => parseUTCDate(b.created_at).getTime() - parseUTCDate(a.created_at).getTime()
      );
      setComplaints(sorted);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }

  const filtered = complaints.filter((c) => {
    const matchSearch = !searchQuery
      || c.title.toLowerCase().includes(searchQuery.toLowerCase())
      || c.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = !statusFilter || c.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <DashboardLayout
      user={user}
      role="student"
      title="My Complaints"
      subtitle="View and track all your submitted complaints."
    >
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-outline" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-sm"
            placeholder="Search your complaints..."
            type="text"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-outline" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 soft-shadow">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="size-8 text-outline" />
          </div>
          <h3 className="text-lg font-bold text-on-surface mb-1">
            {searchQuery || statusFilter ? "No matching complaints" : "No complaints yet"}
          </h3>
          <p className="text-sm text-on-surface-variant mb-6">
            {searchQuery || statusFilter
              ? "Try adjusting your search or filters."
              : "Submit your first complaint to get started."}
          </p>
          {!searchQuery && !statusFilter && (
            <button
              onClick={() => router.push("/student/dashboard")}
              className="px-6 py-3 rounded-xl bg-primary text-white text-xs font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all"
            >
              Submit a Complaint
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((c) => {
            const cfg = statusConfig[c.status] || statusConfig.pending;
            const CatIcon = categoryIcons[c.category] || AlertCircle;
            return (
              <div
                key={c.id}
                className="complaint-card bg-white p-6 rounded-2xl border border-slate-100 soft-shadow flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div
                  className="flex gap-4 items-start flex-1 cursor-pointer"
                  onClick={() => router.push(`/student/complaints/${c.id}`)}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary flex-shrink-0">
                    <CatIcon className="size-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-bold text-on-surface">{c.title}</h4>
                    <p className="text-sm text-on-surface-variant mt-1">
                      {c.hostel_block && `Block ${c.hostel_block}`}
                      {c.room_no && `, Room ${c.room_no}`}
                      {c.assigned_to && ` · Tech #${c.assigned_to}`}
                      {" · "}
                      {parseUTCDate(c.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-sm text-on-surface-variant mt-2 line-clamp-2">
                      {c.description}
                    </p>
                    <div className="mt-3 flex items-center gap-3 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase border ${cfg.class}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                      {c.urgency === "high" && (
                        <span className="text-[11px] font-bold text-error uppercase tracking-wider">
                          · High Priority
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
