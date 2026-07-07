"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { parseUTCDate } from "@/lib/utils";
import type { Complaint, Technician, User } from "@/types";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ChevronRight,
  Calendar,
  Loader2,
  Star,
} from "lucide-react";

export default function AdminComplaintDetail() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reassigning, setReassigning] = useState(false);

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
      const found = c.find((item) => item.id === Number(params.id));
      setComplaint(found || null);
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

  async function handleReassign(techId: number) {
    setReassigning(true);
    try {
      await api.admin.complaints.reassign(Number(params.id), techId);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reassign");
    } finally {
      setReassigning(false);
    }
  }

  const statusClass =
    complaint?.status === "completed"
      ? "bg-green-50 text-green-700"
      : complaint?.status === "in_progress"
        ? "bg-blue-50 text-blue-700"
        : complaint?.status === "cancelled"
          ? "bg-slate-100 text-slate-600"
          : "bg-amber-50 text-amber-700";

  return (
    <DashboardLayout
      user={user}
      role="admin"
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
      ) : !complaint ? (
        <div className="text-center py-16">
          <p className="text-lg font-bold text-on-surface">Complaint not found</p>
        </div>
      ) : (
        <>
          {/* Back + Header */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-surface-container-low transition-colors text-on-surface-variant"
            >
              <ArrowLeft className="size-5" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[11px] font-bold">
                  #{complaint.id.toString().padStart(5, "0")}
                </span>
                <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${statusClass}`}>
                  {complaint.status.replace("_", " ")}
                </span>
                {complaint.urgency === "high" && (
                  <span className="bg-error-container text-on-error-container px-3 py-1 rounded-full text-[11px] font-bold">
                    High Priority
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-on-surface">{complaint.title}</h2>
              <p className="text-sm text-on-surface-variant mt-1 flex items-center gap-2">
                <Calendar className="size-4" />
                {parseUTCDate(complaint.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Main Content */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
              {/* Description */}
              <div className="bg-white rounded-xl p-6 soft-shadow border border-slate-100">
                <h3 className="text-lg font-bold text-on-surface mb-4">Issue Description</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {complaint.description}
                </p>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="p-4 bg-surface-container-low rounded-xl">
                    <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1">Block</p>
                    <p className="text-sm font-bold">{complaint.hostel_block || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-surface-container-low rounded-xl">
                    <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1">Room</p>
                    <p className="text-sm font-bold">{complaint.room_no || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-surface-container-low rounded-xl">
                    <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1">Category</p>
                    <p className="text-sm font-bold capitalize">{complaint.category}</p>
                  </div>
                </div>
              </div>

              {/* Images */}
              {complaint.image_urls && complaint.image_urls.length > 0 && (
                <div className="bg-white rounded-xl p-6 soft-shadow border border-slate-100">
                  <h3 className="text-lg font-bold text-on-surface mb-4">Attachments</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {complaint.image_urls.map((url, i) => (
                      <div
                        key={i}
                        className="aspect-square rounded-xl overflow-hidden cursor-pointer group"
                        onClick={() => window.open(url, "_blank")}
                      >
                        <img
                          src={url}
                          alt={`Attachment ${i + 1}`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="bg-white rounded-xl p-6 soft-shadow border border-slate-100">
                <h3 className="text-lg font-bold text-on-surface mb-6">Case History</h3>
                <div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-[11px] before:top-0 before:bottom-0 before:w-0.5 before:bg-slate-200">
                  <div className="relative">
                    <div className="absolute -left-[28px] top-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center ring-4 ring-white">
                      <CheckCircle2 className="size-3 text-white" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-outline uppercase tracking-wider">
                        {parseUTCDate(complaint.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-sm mt-1">
                        <span className="font-bold">Complaint Created</span> —{" "}
                        {complaint.category} issue reported in Block {complaint.hostel_block}
                      </p>
                    </div>
                  </div>
                  {complaint.assigned_to && (
                    <div className="relative">
                      <div className="absolute -left-[28px] top-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center ring-4 ring-white">
                        <span className="text-[10px] text-white font-bold">T</span>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-outline uppercase tracking-wider">
                          Assigned
                        </p>
                        <p className="text-sm mt-1">
                          <span className="font-bold">Assigned to {techName(complaint.assigned_to)}</span>
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="relative">
                    <div className={`absolute -left-[28px] top-1 w-5 h-5 rounded-full ring-4 ring-white flex items-center justify-center ${
                      complaint.status === "completed"
                        ? "bg-green-500"
                        : complaint.status === "in_progress"
                          ? "bg-blue-500"
                          : "bg-slate-300"
                    }`}>
                      {complaint.status === "completed" ? (
                        <CheckCircle2 className="size-3 text-white" />
                      ) : (
                        <Clock className="size-3 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-outline uppercase tracking-wider">
                        {complaint.status === "completed"
                          ? "Resolved"
                          : complaint.status === "in_progress"
                            ? "In Progress"
                            : "Pending"}
                      </p>
                      <p className="text-sm mt-1 text-on-surface-variant italic">
                        {complaint.status === "completed"
                          ? "Issue has been resolved."
                          : complaint.status === "in_progress"
                            ? "Technician is working on this issue."
                            : "Awaiting assignment."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feedback */}
              {complaint.feedback && (
                <div className="bg-white rounded-xl p-6 soft-shadow border border-slate-100">
                  <h3 className="text-lg font-bold text-on-surface mb-4">Student Feedback</h3>
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`size-6 ${
                          star <= complaint.feedback!.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-slate-200"
                        }`}
                      />
                    ))}
                    <span className="text-lg font-bold text-on-surface ml-2">
                      {complaint.feedback.rating}/5
                    </span>
                  </div>
                  {complaint.feedback.comment && (
                    <p className="text-sm text-on-surface-variant italic leading-relaxed">
                      "{complaint.feedback.comment}"
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Right Panel - Reassign */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              {/* Current Technician */}
              <div className="bg-white rounded-xl p-6 soft-shadow border border-slate-100">
                <h4 className="text-[11px] font-bold text-outline uppercase tracking-wider mb-4">
                  Current Assignment
                </h4>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-primary font-bold">
                    {complaint.assigned_to ? techName(complaint.assigned_to).charAt(0).toUpperCase() : "?"}
                  </div>
                  <div>
                    <p className="text-sm font-bold">
                      {techName(complaint.assigned_to)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reassign */}
              <div className="bg-white rounded-xl p-6 soft-shadow border border-slate-100">
                <h4 className="text-[11px] font-bold text-outline uppercase tracking-wider mb-4">
                  Reassign Task
                </h4>
                <div className="space-y-2 mb-4">
                  {technicians
                    .filter((t) => t.id !== complaint.assigned_to)
                    .map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleReassign(t.id)}
                        disabled={reassigning}
                        className="w-full p-3 bg-white hover:bg-primary/5 border border-slate-100 rounded-xl transition-all flex items-center justify-between group active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-sm font-bold text-primary">
                            {(t.user?.name || "T").charAt(0)}
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold">{t.user?.name || `Tech #${t.id}`}</p>
                            <p className="text-[10px] text-on-surface-variant">
                              {(t.skills && t.skills.length > 0) ? t.skills.join(", ") : "General"} ·{" "}
                              {t.workload_count || 0} tasks
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="size-4 text-outline opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  {technicians.length === 0 && (
                    <p className="text-xs text-outline">No technicians available</p>
                  )}
                </div>
                {reassigning && (
                  <div className="flex items-center justify-center gap-2 text-sm text-primary">
                    <Loader2 className="size-4 animate-spin" />
                    Reassigning...
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
