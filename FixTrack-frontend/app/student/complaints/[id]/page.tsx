"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import FeedbackForm from "@/components/FeedbackForm";
import { api } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { parseUTCDate } from "@/lib/utils";
import type { Complaint, User } from "@/types";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Wrench,
  Star,
} from "lucide-react";

export default function StudentComplaintDetail() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    const u = getStoredUser();
    if (!u || u.role !== "student") {
      router.push("/login");
      return;
    }
    setUser(u);
    loadData();
  }, []);

  async function loadData() {
    try {
      const data = await api.complaints.list();
      const found = data.find((item) => item.id === Number(params.id));
      setComplaint(found || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  const statusSteps = [
    { key: "pending", label: "Submitted", icon: CheckCircle2 },
    { key: "in_progress", label: "In Progress", icon: Wrench },
    { key: "completed", label: "Resolved", icon: CheckCircle2 },
  ];

  const currentStepIndex = statusSteps.findIndex((s) => s.key === complaint?.status);
  const stepStatus = (index: number) => {
    if (index < currentStepIndex) return "completed";
    if (index === currentStepIndex) return "active";
    return "pending";
  };

  return (
    <DashboardLayout
      user={user}
      role="student"
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
        </div>
      ) : !complaint ? (
        <div className="text-center py-16">
          <p className="text-lg font-bold text-on-surface">Complaint not found</p>
        </div>
      ) : (
        <>
          {/* Header */}
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
                  ID: #{complaint.id.toString().padStart(5, "0")}
                </span>
                <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                  complaint.urgency === "high"
                    ? "bg-tertiary-fixed text-on-tertiary-fixed"
                    : "bg-secondary-container text-on-secondary-container"
                }`}>
                  Priority: {complaint.urgency.charAt(0).toUpperCase() + complaint.urgency.slice(1)}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-on-surface">{complaint.title}</h2>
              <p className="text-sm text-on-surface-variant mt-1 flex items-center gap-2">
                <Calendar className="size-4" />
                Submitted on{" "}
                {parseUTCDate(complaint.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Details */}
            <div className="lg:col-span-8 space-y-6">
              {/* Description */}
              <div className="bg-white rounded-xl p-6 soft-shadow border border-outline-variant/10">
                <h3 className="text-lg font-bold text-on-surface mb-4">Issue Description</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {complaint.description}
                </p>
              </div>

              {/* Images */}
              {complaint.image_urls && complaint.image_urls.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-on-surface mb-4">Evidence & Attachments</h3>
                  <div className="columns-2 gap-4">
                    {complaint.image_urls.map((url, i) => (
                      <div
                        key={i}
                        className="break-inside-avoid mb-4 bg-white rounded-xl overflow-hidden soft-shadow border border-outline-variant/10 group cursor-pointer"
                        onClick={() => window.open(url, "_blank")}
                      >
                        <img
                          src={url}
                          alt={`Attachment ${i + 1}`}
                          className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="p-3 bg-white/80 backdrop-blur-sm border-t border-outline-variant/10">
                          <p className="text-[11px] font-bold text-on-surface-variant">
                            Image {i + 1}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback */}
              {complaint.status === "completed" && !feedbackSubmitted && (
                <div className="bg-white rounded-xl p-6 soft-shadow border border-outline-variant/10">
                  <h3 className="text-lg font-bold text-on-surface mb-4">Rate Your Experience</h3>
                  <FeedbackForm
                    complaintId={complaint.id}
                    onSubmitted={() => {
                      setFeedbackSubmitted(true);
                      loadData();
                    }}
                  />
                </div>
              )}
              {feedbackSubmitted && (
                <div className="bg-white rounded-xl p-6 soft-shadow border border-green-100 text-center">
                  <Star className="size-8 text-yellow-500 fill-yellow-500 mx-auto mb-2" />
                  <p className="font-bold text-on-surface">Thank you for your feedback!</p>
                </div>
              )}
            </div>

            {/* Right: Timeline */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-xl p-6 soft-shadow border border-outline-variant/10 sticky top-24">
                <h3 className="text-lg font-bold text-on-surface mb-6">Status Timeline</h3>
                <div className="relative space-y-0">
                  <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-outline-variant/30" />
                  {statusSteps.map((step, index) => {
                    const Icon = step.icon;
                    const status = stepStatus(index);
                    return (
                      <div key={step.key} className="relative flex items-start gap-4 pb-6">
                        <div
                          className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ring-4 ring-white ${
                            status === "completed"
                              ? "bg-primary text-white"
                              : status === "active"
                                ? "bg-primary-container text-primary"
                                : "bg-surface-container-highest text-on-surface-variant"
                          }`}
                        >
                          <Icon className="size-4" />
                        </div>
                        <div className="pt-0.5">
                          <p
                            className={`text-sm font-bold ${
                              status === "active" ? "text-primary" : "text-on-surface"
                            }`}
                          >
                            {step.label}
                          </p>
                          {status === "active" && (
                            <p className="text-[11px] text-on-surface-variant mt-0.5 italic">
                              {step.key === "pending"
                                ? "Awaiting review..."
                                : step.key === "in_progress"
                                  ? "Technician is working on this."
                                  : "Finalizing..."}
                            </p>
                          )}
                          {status === "completed" && step.key === "pending" && (
                            <p className="text-[11px] text-on-surface-variant mt-0.5">
                              {parseUTCDate(complaint.created_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>


              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
