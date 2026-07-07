"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import FeedbackForm from "@/components/FeedbackForm";
import StatCard from "@/components/StatCard";
import { api } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { parseUTCDate } from "@/lib/utils";
import type { Complaint, User } from "@/types";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageSquare,
  Plus,
  WifiOff,
  Lightbulb,
  Snowflake,
  Loader2,
  Star,
  X,
  Upload,
  Wrench,
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

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100">
            <div className="h-10 w-10 bg-surface-container rounded-lg mb-4" />
            <div className="h-3 bg-surface-container rounded w-1/2 mb-2" />
            <div className="h-8 bg-surface-container rounded w-1/3" />
          </div>
        ))}
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100">
            <div className="h-5 bg-surface-container rounded w-2/3 mb-3" />
            <div className="h-3 bg-surface-container rounded w-1/3 mb-4" />
            <div className="h-3 bg-surface-container rounded w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // New complaint form
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("other");
  const [urgency, setUrgency] = useState<string>("medium");
  const [hostelBlock, setHostelBlock] = useState("");
  const [roomNo, setRoomNo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Cancel loading state
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  // Feedback
  const [feedbackComplaintId, setFeedbackComplaintId] = useState<number | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<Set<number>>(new Set());

  useEffect(() => {
    const u = getStoredUser();
    if (!u || u.role !== "student") {
      router.push("/login");
      return;
    }
    setUser(u);
    setHostelBlock(u.hostel_block || "");
    setRoomNo(u.room_no || "");
    loadComplaints();
  }, []);

  async function loadComplaints() {
    try {
      const data = await api.complaints.list();
      const sorted = data.sort(
        (a, b) => parseUTCDate(b.created_at).getTime() - parseUTCDate(a.created_at).getTime()
      );
      setComplaints(sorted.slice(0, 5));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load complaints");
    } finally {
      setLoading(false);
    }
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const newFiles = [...imageFiles, ...files].slice(0, 5);
    setImageFiles(newFiles);
    setImagePreviews(newFiles.map((f) => URL.createObjectURL(f)));
  }

  function removeImage(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      let urls: string[] = [];
      if (imageFiles.length > 0) {
        const results = await api.upload.images(imageFiles);
        urls = results.map((r) => r.url);
      }
      await api.complaints.create({
        title,
        description,
        category: category as any,
        urgency: urgency as any,
        hostel_block: hostelBlock,
        room_no: roomNo,
        image_urls: urls,
      });
      setShowForm(false);
      setTitle("");
      setDescription("");
      setCategory("other");
      setUrgency("medium");
      setImageFiles([]);
      setImagePreviews([]);
      await loadComplaints();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create complaint");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(id: number) {
    setCancellingId(id);
    try {
      await api.complaints.updateStatus(id, "cancelled");
      await loadComplaints();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setCancellingId(null);
    }
  }

  const stats = {
    total: complaints.length,
    inProgress: complaints.filter((c) => c.status === "in_progress").length,
    resolved: complaints.filter((c) => c.status === "completed").length,
    pending: complaints.filter((c) => c.status === "pending").length,
  };

  return (
    <DashboardLayout
      user={user}
      role="student"
      title={`Good ${new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 18 ? "Afternoon" : "Evening"}, ${user?.name || "Student"}`}
      subtitle="Here's an overview of your active campus reports."
    >
      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-error bg-error-container/30 px-4 py-3 rounded-xl mb-6 border border-error/10">
          <AlertCircle className="size-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={AlertCircle}
          iconBg="bg-primary/10"
          iconColor="text-primary"
          label="Total Submitted"
          value={stats.total}
        />
        <StatCard
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          label="In Progress"
          value={stats.inProgress}
        />
        <StatCard
          icon={CheckCircle2}
          iconBg="bg-green-50"
          iconColor="text-green-600"
          label="Resolved"
          value={stats.resolved}
        />
        <StatCard
          icon={MessageSquare}
          iconBg="bg-secondary-container/50"
          iconColor="text-on-secondary-fixed-variant"
          label="Pending"
          value={stats.pending}
        />
      </section>

      {/* Complaints Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-on-surface">Recent Complaints</h2>
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-primary/90 hover:shadow-lg hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
          >
            <Plus className="size-4" />
            New Complaint
          </button>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : complaints.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 soft-shadow">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="size-8 text-outline" />
            </div>
            <h3 className="text-lg font-bold text-on-surface mb-1">No complaints yet</h3>
            <p className="text-sm text-on-surface-variant">
              Submit your first complaint to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.map((c, idx) => {
              const cfg = statusConfig[c.status] || statusConfig.pending;
              const CatIcon = categoryIcons[c.category] || AlertCircle;
              return (
                <div
                  key={c.id}
                  className="complaint-card bg-white p-6 rounded-2xl border border-slate-100 soft-shadow flex flex-col md:flex-row md:items-center justify-between gap-4"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex gap-4 items-start flex-1">
                    <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary flex-shrink-0">
                      <CatIcon className="size-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-bold text-on-surface">{c.title}</h4>
                      <p className="text-sm text-on-surface-variant mt-1">
                        {c.hostel_block && `Block ${c.hostel_block}`}
                        {c.room_no && `, Room ${c.room_no}`}
                        {c.assigned_to && ` · Assigned to Tech #${c.assigned_to}`}
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
                        {c.image_urls && c.image_urls.length > 0 && (
                          <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                            <Upload className="size-3.5" />
                            {c.image_urls.length} file{c.image_urls.length > 1 ? "s" : ""}
                          </span>
                        )}
                        {c.urgency === "high" && (
                          <span className="text-[11px] font-bold text-error uppercase tracking-wider">
                            · High Priority
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center flex-shrink-0">
                    {c.status === "completed" && (
                      <button
                        onClick={() => {
                          if (!feedbackSubmitted.has(c.id)) {
                            setFeedbackComplaintId(feedbackComplaintId === c.id ? null : c.id);
                          }
                        }}
                        disabled={feedbackSubmitted.has(c.id)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                          feedbackSubmitted.has(c.id)
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "border border-slate-200 text-on-surface-variant hover:bg-surface-container-low"
                        }`}
                      >
                        <Star
                          className={`size-3.5 inline mr-1 ${
                            feedbackSubmitted.has(c.id) ? "fill-yellow-500 text-yellow-500" : ""
                          }`}
                        />
                        {feedbackSubmitted.has(c.id) ? "Done" : "Feedback"}
                      </button>
                    )}
                    {c.status === "pending" && (
                      <button
                        onClick={() => handleCancel(c.id)}
                        disabled={cancellingId === c.id}
                        className={`px-4 py-2 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 ${
                          cancellingId === c.id
                            ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                            : "border-slate-200 text-on-surface-variant hover:bg-surface-container-low"
                        }`}
                      >
                        {cancellingId === c.id ? (
                          <><Loader2 className="size-3.5 animate-spin" /> Cancelling...</>
                        ) : (
                          <><X className="size-3.5" /> Cancel</>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => router.push(`/student/complaints/${c.id}`)}
                      className="px-4 py-2 rounded-lg border border-slate-200 text-on-surface-variant text-xs font-bold hover:bg-surface-container-low transition-colors"
                    >
                      View Details
                    </button>
                  </div>

                  {/* Inline Feedback */}
                  {feedbackComplaintId === c.id && (
                    <div className="w-full pt-4 border-t border-slate-100">
                      <FeedbackForm
                        complaintId={c.id}
                        onSubmitted={() => {
                          setFeedbackSubmitted((prev) => new Set(prev).add(c.id));
                          setFeedbackComplaintId(null);
                          loadComplaints();
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && complaints.length > 0 && (
          <div className="mt-4 text-center">
            <a
              href="/student/complaints"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              View All Complaints
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        )}
      </section>

      {/* New Complaint Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden transform transition-all">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-on-surface">Submit a Complaint</h3>
                <p className="text-sm text-on-surface-variant mt-1">
                  The AI will auto-classify and assign it.
                </p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-outline"
              >
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Title */}
              <div>
                <label className="text-xs font-semibold text-outline uppercase tracking-wider mb-1.5 block">
                  Title
                </label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Broken faucet in bathroom"
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-outline uppercase tracking-wider mb-1.5 block">
                  Description
                </label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue in detail..."
                  rows={3}
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                />
              </div>

              {/* Category + Urgency */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-outline uppercase tracking-wider mb-1.5 block">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none"
                  >
                    <option value="plumbing">Plumbing</option>
                    <option value="electrical">Electrical</option>
                    <option value="wifi">WiFi</option>
                    <option value="carpentry">Carpentry</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-outline uppercase tracking-wider mb-1.5 block">
                    Urgency
                  </label>
                  <div className="flex gap-2">
                    {["low", "medium", "high"].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setUrgency(lvl)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          urgency === lvl
                            ? lvl === "high"
                              ? "bg-error-container border-error text-on-error-container"
                              : lvl === "medium"
                                ? "bg-amber-50 border-amber-300 text-amber-700"
                                : "bg-secondary-container border-secondary text-on-secondary-container"
                            : "border-outline-variant/50 text-on-surface-variant hover:bg-surface-container-low"
                        }`}
                      >
                        {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Block + Room */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-outline uppercase tracking-wider mb-1.5 block">
                    Hostel Block
                  </label>
                  <input
                    value={hostelBlock}
                    onChange={(e) => setHostelBlock(e.target.value)}
                    placeholder="A, B..."
                    className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-outline uppercase tracking-wider mb-1.5 block">
                    Room No
                  </label>
                  <input
                    value={roomNo}
                    onChange={(e) => setRoomNo(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="text-xs font-semibold text-outline uppercase tracking-wider mb-1.5 block">
                  Images (Optional)
                </label>
                <label className="flex items-center justify-center gap-2 h-20 rounded-xl border-2 border-dashed border-outline-variant/50 hover:border-primary/50 cursor-pointer transition-colors bg-surface-container-lowest">
                  <Upload className="size-4 text-outline" />
                  <span className="text-sm text-on-surface-variant">Upload photos</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                </label>
                {imagePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {imagePreviews.map((preview, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${i}`}
                          className="h-16 w-16 rounded-lg object-cover border border-outline-variant/30"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute -top-1.5 -right-1.5 bg-error text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 rounded-xl bg-primary text-white text-xs font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
                >
                  {submitting ? (
                    <><Loader2 className="size-4 animate-spin" /> Submitting...</>
                  ) : (
                    "Submit Complaint"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile FAB */}
      <div className="md:hidden fixed bottom-20 right-6 z-40">
        <button
          onClick={() => setShowForm(true)}
          className="w-14 h-14 bg-primary text-white rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-transform"
        >
          <Plus className="size-6" />
        </button>
      </div>
    </DashboardLayout>
  );
}
