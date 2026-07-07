"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { api } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { parseUTCDate } from "@/lib/utils";
import type { Analytics, Complaint, Technician, User } from "@/types";
import {
  AlertCircle,
  FileText,
  Hourglass,
  CheckCircle2,
  Users,
} from "lucide-react";

const BarChartCard = dynamic(
  () => import("./AdminCharts").then((m) => m.BarChartCard),
  { ssr: false }
);
const PieChartCard = dynamic(
  () => import("./AdminCharts").then((m) => m.PieChartCard),
  { ssr: false }
);

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-100">
            <div className="h-10 w-10 bg-surface-container rounded-lg mb-4" />
            <div className="h-3 bg-surface-container rounded w-1/2 mb-2" />
            <div className="h-8 bg-surface-container rounded w-1/3" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-slate-100 h-[400px]" />
        <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-slate-100 h-[400px]" />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      const [a, c, t] = await Promise.all([
        api.admin.analytics(),
        api.admin.complaints.list(),
        api.admin.technicians.list(),
      ]);
      setAnalytics(a);
      setComplaints(c);
      setTechnicians(t);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  const categoryData = analytics
    ? Object.entries(analytics.complaints_by_category).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }))
    : [];

  const total = complaints.length;
  const pending = complaints.filter((c) => c.status === "pending").length;
  const inProgress = complaints.filter((c) => c.status === "in_progress").length;
  const completed = complaints.filter((c) => c.status === "completed").length;

  return (
    <DashboardLayout
      user={user}
      role="admin"
      title="Institution Overview"
      subtitle="Real-time performance metrics and student satisfaction trends."
    >
      {error && (
        <div className="flex items-center gap-2 text-sm text-error bg-error-container/30 px-4 py-3 rounded-xl mb-6 border border-error/10">
          <AlertCircle className="size-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {/* Stats Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={FileText}
              iconBg="bg-primary/10"
              iconColor="text-primary"
              label="Total Complaints"
              value={total}
              trend={{ value: "+12%", positive: true }}
              progress={total > 0 ? (completed / total) * 100 : 0}
              progressColor="bg-primary"
            />
            <StatCard
              icon={Hourglass}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
              label="Pending"
              value={pending}
              trend={{ value: pending > 5 ? "+" + pending : "Normal", positive: pending <= 5 }}
              progress={total > 0 ? (pending / total) * 100 : 0}
              progressColor="bg-amber-500"
            />
            <StatCard
              icon={CheckCircle2}
              iconBg="bg-green-50"
              iconColor="text-green-600"
              label="Resolved"
              value={completed}
              trend={{ value: "+24%", positive: true }}
              progress={total > 0 ? (completed / total) * 100 : 0}
              progressColor="bg-green-500"
            />
            <StatCard
              icon={Users}
              iconBg="bg-secondary/10"
              iconColor="text-secondary"
              label="Technicians"
              value={technicians.length}
              trend={{ value: `${technicians.filter((t) => t.is_available).length} available`, positive: true }}
              progress={
                technicians.length > 0
                  ? (technicians.filter((t) => t.is_available).length / technicians.length) * 100
                  : 0
              }
              progressColor="bg-secondary"
            />
          </section>

          {/* Charts Grid */}
          <section className="grid grid-cols-12 gap-6 mb-8">
            <Suspense fallback={
              <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-slate-100 h-[400px] animate-pulse" />
            }>
              <BarChartCard data={categoryData} />
            </Suspense>
            <Suspense fallback={
              <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-slate-100 h-[400px] animate-pulse" />
            }>
              <PieChartCard data={categoryData} total={total} />
            </Suspense>
          </section>

          {/* Recent Activity + Team */}
          <section className="grid grid-cols-12 gap-6">
            {/* Recent Activity */}
            <div className="col-span-12 lg:col-span-7 bg-white p-6 rounded-2xl soft-shadow border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-on-surface">Recent Activity</h3>
                <button onClick={() => router.push("/admin/complaints")} className="text-xs font-bold text-primary hover:underline">
                  View History
                </button>
              </div>
              <div className="space-y-6">
                {complaints.slice(0, 4).map((c) => (
                  <div key={c.id} className="flex gap-4 group">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                          c.status === "completed"
                            ? "bg-green-100 text-green-600"
                            : c.status === "in_progress"
                              ? "bg-blue-100 text-blue-600"
                              : c.status === "cancelled"
                                ? "bg-slate-100 text-slate-500"
                                : "bg-primary/10 text-primary"
                        }`}
                      >
                        {c.status === "completed" ? (
                          <CheckCircle2 className="size-5" />
                        ) : c.status === "in_progress" ? (
                          <Hourglass className="size-5" />
                        ) : (
                          <AlertCircle className="size-5" />
                        )}
                      </div>
                      <div className="w-0.5 h-full bg-outline-variant/20 -mt-2" />
                    </div>
                    <div className="pb-6">
                      <p className="text-sm font-bold text-on-surface">{c.title}</p>
                      <p className="text-xs text-outline mt-0.5">
                        {c.category} · {c.hostel_block && `Block ${c.hostel_block}`}
                        {c.room_no && `, Room ${c.room_no}`}
                      </p>
                      <span className="text-[10px] font-semibold text-outline uppercase tracking-wider mt-2 block">
                        {parseUTCDate(c.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
                {complaints.length === 0 && (
                  <p className="text-sm text-outline text-center py-8">No activity yet</p>
                )}
              </div>
            </div>

            {/* Team Sync */}
            <div className="col-span-12 lg:col-span-5 bg-primary p-6 rounded-2xl shadow-xl text-white relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-lg font-bold mb-2">Technician Overview</h3>
                <p className="text-sm text-blue-100 mb-6">
                  {technicians.filter((t) => t.is_available).length} of{" "}
                  {technicians.length} technicians available.
                </p>
                {analytics?.technician_workload && analytics.technician_workload.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.technician_workload.slice(0, 4).map((tw) => (
                      <div key={tw.technician_id} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                          {tw.name?.charAt(0)?.toUpperCase() || "T"}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{tw.name}</p>
                          <p className="text-[10px] text-blue-200">
                            {tw.workload_count} task{tw.workload_count !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            tw.is_available ? "bg-emerald-400" : "bg-amber-400"
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-blue-200">No technicians registered.</p>
                )}
                <button onClick={() => router.push("/admin/technicians")} className="mt-6 w-full py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl text-xs font-bold transition-all">
                  Manage Technicians
                </button>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/20 rounded-full -ml-10 -mb-10 blur-2xl" />
            </div>
          </section>
        </>
      )}
    </DashboardLayout>
  );
}
