"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { formatDateTime, parseUTCDate } from "@/lib/utils";
import type { Complaint, User } from "@/types";
import {
  AlertCircle,
  CheckCircle2,
  MapPin,
  Share2,
  Printer,
  Info,
  ZoomIn,
  Star,
} from "lucide-react";

export default function TechTaskDetail() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [task, setTask] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const u = getStoredUser();
    if (!u || u.role !== "tech") {
      router.push("/login");
      return;
    }
    setUser(u);
    loadData();
  }, []);

  async function loadData() {
    try {
      const data = await api.technicians.tasks();
      const found = data.find((item) => item.id === Number(params.id));
      setTask(found || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept() {
    setActionLoading(true);
    try {
      await api.technicians.updateTaskStatus(Number(params.id), "in_progress");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleComplete() {
    setActionLoading(true);
    try {
      await api.technicians.updateTaskStatus(Number(params.id), "completed");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete");
    } finally {
      setActionLoading(false);
    }
  }

  function Timeline({ task: t }: { task: Complaint }) {
    return (
      <div className="space-y-6">
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-primary ring-4 ring-primary/10" />
            <div className="w-0.5 flex-grow bg-outline-variant/30 my-1" />
          </div>
          <div className="pb-6">
            <p className="text-[11px] font-bold text-outline uppercase tracking-wider">
              {parseUTCDate(t.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p className="text-sm mt-1">Complaint registered</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <div
              className={`w-3 h-3 rounded-full ring-4 ${
                t.status !== "pending"
                  ? "bg-primary ring-primary/10"
                  : "bg-outline-variant"
              }`}
            />
            {t.status === "pending" && (
              <div className="w-0.5 flex-grow bg-outline-variant/30 my-1" />
            )}
          </div>
          <div>
            <p className="text-[11px] font-bold text-outline uppercase tracking-wider">
              {t.status !== "pending" ? "Assigned" : "Waiting..."}
            </p>
            <p className="text-sm mt-1">
              {t.status !== "pending"
                ? "Assigned to you"
                : "Awaiting your acceptance"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const timeAgo = task
    ? formatDateTime(task.created_at)
    : "";

  return (
    <DashboardLayout
      user={user}
      role="tech"
      title=""
      subtitle=""
    >
      {error && (
        <div className="flex items-center gap-2 text-sm text-error bg-error-container/30 px-4 py-3 rounded-xl mb-6 border border-error/10">
          <AlertCircle className="size-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl soft-shadow border border-slate-100 p-8 animate-pulse">
          <div className="h-8 bg-surface-container rounded w-1/3 mb-4" />
          <div className="h-4 bg-surface-container rounded w-1/2 mb-8" />
          <div className="h-20 bg-surface-container rounded mb-4" />
        </div>
      ) : !task ? (
        <div className="text-center py-16">
          <p className="text-lg font-bold text-on-surface">Task not found</p>
        </div>
      ) : (
        <div className="pb-24">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[11px] font-bold">
                  REF: #{task.id.toString().padStart(5, "0")}
                </span>
                {task.urgency === "high" && (
                  <span className="bg-error-container text-on-error-container px-3 py-1 rounded-full text-[11px] font-bold">
                    High Priority
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-on-surface">{task.title}</h2>
              <p className="text-sm text-on-surface-variant mt-1 flex items-center gap-2">
                <MapPin className="size-4" />
                Block {task.hostel_block}, Room {task.room_no} · {timeAgo}
              </p>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Main Content */}
            <div className="md:col-span-8 space-y-6">
              {/* Description */}
              <div className="bg-white rounded-xl p-6 soft-shadow border border-slate-100">
                <h3 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
                  Complaint Details
                </h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {task.description}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  <div className="p-4 rounded-lg bg-surface-container-low">
                    <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1">
                      Category
                    </p>
                    <p className="text-sm font-bold capitalize">{task.category}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-surface-container-low">
                    <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1">
                      Status
                    </p>
                    <p className="text-sm font-bold capitalize">{task.status.replace("_", " ")}</p>
                  </div>
                </div>
              </div>

              {/* Images */}
              {task.image_urls && task.image_urls.length > 0 && (
                <div className="bg-white rounded-xl p-6 soft-shadow border border-slate-100">
                  <h3 className="text-lg font-bold text-on-surface mb-4">Attachment Evidence</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {task.image_urls.map((url, i) => (
                      <div
                        key={i}
                        className="aspect-square rounded-lg overflow-hidden group cursor-pointer relative"
                        onClick={() => window.open(url, "_blank")}
                      >
                        <img
                          src={url}
                          alt={`Attachment ${i + 1}`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ZoomIn className="size-6 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

{/* Timeline - in left column only when no images */}
              {(task.image_urls?.length || 0) === 0 && (
                <div className="bg-white rounded-xl p-6 soft-shadow border border-slate-100">
                  <h3 className="text-lg font-bold text-on-surface mb-6">Activity History</h3>
                  <Timeline task={task} />
                </div>
              )}

              {/* Feedback */}
              {task.feedback && (
                <div className="bg-white rounded-xl p-6 soft-shadow border border-slate-100">
                  <h3 className="text-lg font-bold text-on-surface mb-4">Student Feedback</h3>
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`size-6 ${
                          star <= task.feedback!.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-slate-200"
                        }`}
                      />
                    ))}
                    <span className="text-lg font-bold text-on-surface ml-2">
                      {task.feedback.rating}/5
                    </span>
                  </div>
                  {task.feedback.comment && (
                    <p className="text-sm text-on-surface-variant italic leading-relaxed">
                      "{task.feedback.comment}"
                    </p>
                  )}
                  <p className="text-[10px] text-outline font-medium mt-3">
                    {formatDateTime(task.feedback.created_at)}
                  </p>
                </div>
              )}
            </div>

            {/* Right Panel */}
            <div className="md:col-span-4 space-y-6">
              {/* Location */}
              <div className="bg-white rounded-xl p-4 soft-shadow border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                    <MapPin className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-outline uppercase tracking-wider">
                      Location
                    </h4>
                    <p className="text-sm font-bold">Block {task.hostel_block}, Room {task.room_no}</p>
                  </div>
                </div>
              </div>

              {/* Reported By */}
              <div className="bg-white rounded-xl p-4 soft-shadow border border-slate-100">
                <h4 className="text-[11px] font-bold text-outline uppercase tracking-wider mb-4">
                  Reported By
                </h4>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-primary font-bold">
                    {task.student?.name?.charAt(0)?.toUpperCase() || "S"}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{task.student?.name || "Student"}</p>
                    <p className="text-[10px] text-outline">
                      {task.hostel_block && `Block ${task.hostel_block}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Task Info */}
              <div className="bg-white rounded-xl p-4 soft-shadow border border-slate-100">
                <h4 className="text-[11px] font-bold text-outline uppercase tracking-wider mb-4">
                  Task Info
                </h4>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed text-xs flex gap-2">
                    <Info className="size-4 flex-shrink-0" />
                    <span>Category: {task.category}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-surface-container text-on-surface-variant text-xs italic">
                    Status: {task.status.replace("_", " ")}
                  </div>
                </div>
              </div>

              {/* Activity History - in right column when images are attached */}
              {(task.image_urls?.length || 0) > 0 && (
                <div className="bg-white rounded-xl p-4 soft-shadow border border-slate-100">
                  <h4 className="text-[11px] font-bold text-outline uppercase tracking-wider mb-4">
                    Activity History
                  </h4>
                  <Timeline task={task} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Bar */}
      {task && (
        <div className="fixed bottom-0 left-0 right-0 md:left-64 p-4 z-40 flex justify-center pointer-events-none">
          <div className="glass-panel pointer-events-auto w-full max-w-[600px] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="hidden sm:block">
              <p className="text-[10px] font-bold text-outline uppercase tracking-wider">
                Status
              </p>
              <p className="text-sm font-bold text-on-surface">
                {task.status.replace("_", " ")}
              </p>
            </div>
            <div className="flex w-full sm:w-auto gap-3">
              {task.status === "pending" && (
                <button
                  onClick={handleAccept}
                  disabled={actionLoading}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all hover:brightness-110"
                >
                  <CheckCircle2 className="size-5" />
                  {actionLoading ? "Accepting..." : "Accept Task"}
                </button>
              )}
              {task.status === "in_progress" && (
                <button
                  onClick={handleComplete}
                  disabled={actionLoading}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-green-900/10 active:scale-95 transition-all hover:brightness-110"
                >
                  <CheckCircle2 className="size-5" />
                  {actionLoading ? "Completing..." : "Mark Complete"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}


