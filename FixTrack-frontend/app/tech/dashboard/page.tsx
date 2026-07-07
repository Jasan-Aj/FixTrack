"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";
import type { Complaint, User } from "@/types";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Wrench,
  Lightbulb,
  Snowflake,
  WifiOff,
  Building2,
  Loader2,
} from "lucide-react";

const urgencyConfig: Record<string, { label: string; class: string }> = {
  high: {
    label: "High Priority",
    class: "bg-error-container text-on-error-container",
  },
  medium: {
    label: "Medium",
    class: "bg-tertiary text-white",
  },
  low: {
    label: "Low Priority",
    class: "bg-secondary text-white",
  },
};

const categoryIcons: Record<string, typeof Wrench> = {
  plumbing: Snowflake,
  electrical: Lightbulb,
  wifi: WifiOff,
  cleaning: AlertCircle,
  carpentry: Wrench,
  other: Wrench,
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
};

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-slate-100">
              <div className="h-5 bg-surface-container rounded w-2/3 mb-3" />
              <div className="h-3 bg-surface-container rounded w-1/3 mb-4" />
              <div className="h-3 bg-surface-container rounded w-full" />
            </div>
          ))}
        </div>
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-primary p-6 rounded-2xl h-48" />
          <div className="bg-white p-6 rounded-2xl border border-slate-100 h-32" />
        </div>
      </div>
    </div>
  );
}

export default function TechDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  useEffect(() => {
    const u = getStoredUser();
    if (!u || u.role !== "tech") {
      router.push("/login");
      return;
    }
    setUser(u);
    loadTasks();
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const profile = await api.technicians.profile();
      setIsAvailable(profile.is_available);
    } catch {
      // ignore
    }
  }

  async function loadTasks() {
    try {
      const data = await api.technicians.tasks();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(id: number) {
    setActionLoading(id);
    try {
      await api.technicians.updateTaskStatus(id, "in_progress");
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept task");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleComplete(id: number) {
    setActionLoading(id);
    try {
      await api.technicians.updateTaskStatus(id, "completed");
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete task");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleToggleAvailability() {
    setAvailabilityLoading(true);
    const newStatus = !isAvailable;
    try {
      await api.technicians.toggleAvailability(newStatus);
      setIsAvailable(newStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update availability");
    } finally {
      setAvailabilityLoading(false);
    }
  }

  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const activeTask = tasks.find((t) => t.status === "in_progress");

  return (
    <DashboardLayout
      user={user}
      role="tech"
      title={`Welcome back, ${user?.name || "Technician"}`}
      subtitle={`You have ${pendingTasks.length} pending task${pendingTasks.length !== 1 ? "s" : ""} across campus.`}
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
        <div className="grid grid-cols-12 gap-6">
          {/* Task List */}
          <div className="col-span-12 lg:col-span-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-on-surface">
                {activeTask ? "Active Task" : "Pending Tasks"}
              </h2>
              <button onClick={() => router.push("/tech/tasks")} className="text-xs font-bold text-primary hover:underline">
                View All Tasks
              </button>
            </div>

            {tasks.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-100 soft-shadow text-center">
                <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="size-8 text-outline" />
                </div>
                <h3 className="text-lg font-bold text-on-surface mb-1">All clear!</h3>
                <p className="text-sm text-on-surface-variant">
                  No tasks assigned yet. New tasks will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => {
                  const urgency = urgencyConfig[task.urgency] || urgencyConfig.medium;
                  const CatIcon = categoryIcons[task.category] || Wrench;
                  const timeAgo = formatDateTime(task.created_at);

                  return (
                    <div
                      key={task.id}
                      className="bg-white p-6 rounded-xl soft-shadow border border-slate-100 group hover:border-primary/30 transition-all cursor-pointer"
                      onClick={() => router.push(`/tech/tasks/${task.id}`)}
                    >
                      <div className="flex gap-4 items-start">
                        <div className={`p-4 rounded-xl flex-shrink-0 ${
                          task.urgency === "high"
                            ? "bg-error-container/20 text-error"
                            : task.urgency === "medium"
                              ? "bg-tertiary-fixed/40 text-tertiary"
                              : "bg-secondary-container text-primary"
                        }`}>
                          <CatIcon className="size-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-3 mb-1">
                            <h4 className="text-lg font-bold text-on-surface">{task.title}</h4>
                            <span className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-bold leading-none ${urgency.class}`}>
                              {urgency.label}
                            </span>
                          </div>
                          <p className="text-sm text-on-surface-variant mb-3 line-clamp-2">
                            {task.description}
                          </p>
                          <div className="flex items-center gap-4 text-on-surface-variant text-xs">
                            {task.hostel_block && (
                              <span className="flex items-center gap-1">
                                <Building2 className="size-3.5" />
                                Block {task.hostel_block}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="size-3.5" />
                              {timeAgo}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColors[task.status] || ""}`}>
                              {task.status.replace("_", " ")}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 self-center">
                          <ChevronRight className="size-5 text-outline" />
                          {task.status === "pending" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAccept(task.id);
                              }}
                              disabled={actionLoading !== null}
                              className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {actionLoading === task.id ? "Accepting..." : "Accept"}
                            </button>
                          )}
                          {task.status === "in_progress" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleComplete(task.id);
                              }}
                              disabled={actionLoading !== null}
                              className="px-4 py-2 rounded-lg bg-green-600 text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {actionLoading === task.id ? "Completing..." : "Complete"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* Performance Stats */}
            <div className="bg-primary p-6 rounded-2xl text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-lg font-bold mb-4">Performance Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider opacity-70">
                      Resolved Today
                    </p>
                    <p className="text-3xl font-bold">
                      {tasks.filter((t) => t.status === "completed" && isToday(t.resolved_at || t.created_at)).length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider opacity-70">
                      Active
                    </p>
                    <p className="text-3xl font-bold">{activeTask ? 1 : 0}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/20">
                  <p className="text-sm opacity-90 italic">
                    {tasks.length > 0
                      ? `${pendingTasks.length} task${pendingTasks.length !== 1 ? "s" : ""} pending your attention.`
                      : "No pending tasks. Great work!"}
                  </p>
                </div>
              </div>
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            </div>

            {/* Availability Toggle */}
            <div className="bg-white p-6 rounded-xl soft-shadow border border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Availability</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {isAvailable
                      ? "You can receive new tasks"
                      : "Not accepting new tasks"}
                  </p>
                </div>
                <button
                  onClick={handleToggleAvailability}
                  disabled={availabilityLoading}
                  className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
                    isAvailable
                      ? "bg-primary shadow-sm shadow-primary/30"
                      : "bg-slate-200"
                  } disabled:opacity-50`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center ${
                      isAvailable ? "translate-x-7" : "translate-x-0"
                    }`}
                  >
                    {availabilityLoading ? (
                      <Loader2 className="size-3 animate-spin text-primary" />
                    ) : (
                      <span
                        className={`size-2 rounded-full ${
                          isAvailable ? "bg-green-500" : "bg-slate-400"
                        }`}
                      />
                    )}
                  </span>
                </button>
              </div>
            </div>

            {/* Stats Summary */}
            <div className="bg-white p-6 rounded-xl soft-shadow border border-slate-100">
              <h3 className="text-xs font-bold text-outline uppercase tracking-wider mb-4">
                Overview
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span className="flex-1 text-sm">Pending</span>
                  <span className="text-sm font-bold">{pendingTasks.length}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="flex-1 text-sm">In Progress</span>
                  <span className="text-sm font-bold">{activeTask ? 1 : 0}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="flex-1 text-sm">Completed</span>
                  <span className="text-sm font-bold">{tasks.filter((t) => t.status === "completed").length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function isToday(dateStr: string): boolean {
  const utc = dateStr.endsWith("Z") ? dateStr : dateStr + "Z";
  const date = new Date(utc);
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}
