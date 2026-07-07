"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Technician, TechnicianProfile } from "@/types";
import {
  X,
  Mail,
  Wrench,
  CheckCircle2,
  Clock,
  Building2,
  Star,
  Loader2,
  Award,
} from "lucide-react";

interface Props {
  technician: Technician;
  onClose: () => void;
}

export default function TechnicianProfileModal({ technician, onClose }: Props) {
  const [profile, setProfile] = useState<TechnicianProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [technician.id]);

  async function loadProfile() {
    try {
      const data = await api.admin.technicians.profile(technician.id);
      setProfile(data);
    } catch {
      // fallback: use the technician data we already have
      setProfile({
        id: technician.id,
        user_id: technician.user_id,
        skills: technician.skills,
        is_available: technician.is_available,
        workload_count: technician.workload_count,
        completed_count: 0,
        user: technician.user,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-primary to-primary/80 px-6 pt-8 pb-20 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="size-4" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-2xl border-2 border-white/40">
              {(technician.user?.name || "T").charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-bold">
                {technician.user?.name || `Technician #${technician.id}`}
              </h3>
              <p className="text-sm text-white/80 flex items-center gap-1.5 mt-1">
                <Mail className="size-3.5" />
                {technician.user?.email || "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 -mt-12 relative z-10">
          {loading ? (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 flex items-center justify-center">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 divide-y divide-slate-50">
              {/* Status & Availability */}
              <div className="p-5 flex items-center justify-between">
                <span className="text-sm font-semibold text-on-surface-variant">Availability</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                    (profile?.is_available ?? technician.is_available)
                      ? "bg-green-50 text-green-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      (profile?.is_available ?? technician.is_available)
                        ? "bg-green-500"
                        : "bg-slate-400"
                    }`}
                  />
                  {(profile?.is_available ?? technician.is_available) ? "Available" : "Unavailable"}
                </span>
              </div>

              {/* Skills */}
              <div className="p-5">
                <p className="text-xs font-bold text-outline uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Wrench className="size-3.5" />
                  Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(technician.skills?.length ? technician.skills : ["General"]).map(
                    (skill, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-primary/5 text-primary text-[11px] font-bold rounded-full border border-primary/10"
                      >
                        {skill}
                      </span>
                    )
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="p-5">
                <p className="text-xs font-bold text-outline uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Award className="size-3.5" />
                  Performance
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Clock className="size-4 text-amber-600" />
                    </div>
                    <p className="text-lg font-bold text-on-surface">
                      {profile?.workload_count ?? technician.workload_count}
                    </p>
                    <p className="text-[10px] font-bold text-outline uppercase tracking-wider">
                      Active Tasks
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <CheckCircle2 className="size-4 text-green-600" />
                    </div>
                    <p className="text-lg font-bold text-on-surface">
                      {profile?.completed_count ?? 0}
                    </p>
                    <p className="text-[10px] font-bold text-outline uppercase tracking-wider">
                      Completed
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Star className="size-4 text-primary" />
                    </div>
                    <p className="text-lg font-bold text-on-surface">
                      {(profile?.workload_count ?? technician.workload_count) +
                        (profile?.completed_count ?? 0)}
                    </p>
                    <p className="text-[10px] font-bold text-outline uppercase tracking-wider">
                      Total Tasks
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
