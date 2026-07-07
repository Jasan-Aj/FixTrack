"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import type { Technician, User } from "@/types";
import {
  AlertCircle,
  Search,
  Plus,
  Trash2,
  Users,
  Bolt,
  Verified,
  CheckCircle2,
  X,
  Loader2,
  UserCircle,
} from "lucide-react";
import TechnicianProfileModal from "@/components/TechnicianProfileModal";

export default function ManageTechnicians() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"tech" | "admin">("tech");
  const [skills, setSkills] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      const data = await api.admin.technicians.list();
      setTechnicians(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.admin.users.create({
        email,
        password,
        name,
        role,
        skills: role === "tech" ? skills.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
      });
      setShowModal(false);
      setEmail("");
      setPassword("");
      setName("");
      setRole("tech");
      setSkills("");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to remove this technician?")) return;
    try {
      await api.admin.technicians.delete(id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  const filtered = technicians.filter(
    (t) =>
      (t.user?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalWorkload = technicians.reduce((sum, t) => sum + (t.workload_count || 0), 0);

  return (
    <DashboardLayout
      user={user}
      role="admin"
      title="Manage Technicians"
      subtitle="Monitor team availability, assign tasks, and maintain performance standards."
    >
      {error && (
        <div className="flex items-center gap-2 text-sm text-error bg-error-container/30 px-4 py-3 rounded-xl mb-6 border border-error/10">
          <AlertCircle className="size-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-2xl soft-shadow border border-slate-50">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="size-5 text-primary" />
            </div>
            <span className="text-[11px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
              +{technicians.length} total
            </span>
          </div>
          <p className="text-xs font-bold text-outline uppercase tracking-wider">Total Staff</p>
          <p className="text-2xl font-bold text-on-surface mt-1">{technicians.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl soft-shadow border border-slate-50">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Bolt className="size-5 text-amber-600" />
            </div>
          </div>
          <p className="text-xs font-bold text-outline uppercase tracking-wider">Total Workload</p>
          <p className="text-2xl font-bold text-on-surface mt-1">{totalWorkload}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl soft-shadow border border-slate-50">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Verified className="size-5 text-blue-600" />
            </div>
          </div>
          <p className="text-xs font-bold text-outline uppercase tracking-wider">Available</p>
          <p className="text-2xl font-bold text-on-surface mt-1">
            {technicians.filter((t) => t.is_available).length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl soft-shadow border border-slate-50">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle2 className="size-5 text-green-600" />
            </div>
          </div>
          <p className="text-xs font-bold text-outline uppercase tracking-wider">Avg. Workload</p>
          <p className="text-2xl font-bold text-on-surface mt-1">
            {technicians.length > 0
              ? Math.round(totalWorkload / technicians.length)
              : 0}
          </p>
        </div>
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-outline" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search technicians..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all active:scale-95"
        >
          <Plus className="size-4" />
          Add User
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-2xl soft-shadow border border-slate-100 overflow-hidden animate-pulse">
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-surface-container rounded-xl" />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl soft-shadow border border-slate-50 overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/30">
                  <th className="px-6 py-4 text-[11px] font-bold text-outline uppercase tracking-wider">Technician</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-outline uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-outline uppercase tracking-wider">Skills</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-outline uppercase tracking-wider">Workload</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-outline uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-outline uppercase tracking-wider text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length > 0 ? (
                  filtered.map((t) => (
                    <tr
                      key={t.id}
                      className="group hover:bg-slate-50/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedTech(t)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-primary font-bold text-sm">
                            {(t.user?.name || "T").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-on-surface">{t.user?.name || `Technician #${t.id}`}</p>
                            <p className="text-[10px] text-outline font-semibold uppercase tracking-wider">
                              {(t.skills && t.skills.length > 0) ? t.skills[0] : "General"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-on-surface-variant">{t.user?.email || "—"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(t.skills || ["General"]).slice(0, 3).map((skill, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-primary/5 text-primary text-[10px] font-bold rounded-full border border-primary/10"
                            >
                              {skill}
                            </span>
                          ))}
                          {(t.skills?.length || 0) > 3 && (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full">
                              +{t.skills!.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden w-24">
                            <div
                              className={`h-full rounded-full ${
                                (t.workload_count || 0) > 5
                                  ? "bg-error"
                                  : (t.workload_count || 0) > 3
                                    ? "bg-amber-500"
                                    : "bg-primary"
                              }`}
                              style={{
                                width: `${Math.min(((t.workload_count || 0) / 10) * 100, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-bold text-on-surface">
                            {t.workload_count || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${
                            t.is_available
                              ? "bg-green-50 text-green-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              t.is_available ? "bg-green-500" : "bg-slate-400"
                            }`}
                          />
                          {t.is_available ? "Available" : "Busy"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTech(t);
                            }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-primary hover:bg-primary/10 transition-all"
                            title="View profile"
                          >
                            <UserCircle className="size-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(t.id);
                            }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-error hover:bg-error-container/20 transition-all"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-outline">
                      No technicians found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-slate-50/30 flex justify-between items-center border-t border-slate-100">
            <span className="text-xs text-outline">
              Showing {filtered.length} of {technicians.length} technicians
            </span>

          </div>
        </div>
      )}

      {/* Technician Profile Modal */}
      {selectedTech && (
        <TechnicianProfileModal
          technician={selectedTech}
          onClose={() => setSelectedTech(null)}
        />
      )}

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-on-surface">Add User</h3>
                <p className="text-sm text-on-surface-variant mt-1">
                  Create a technician or admin account.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-outline"
              >
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-outline uppercase tracking-wider mb-1.5 block">
                  Full Name
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-outline uppercase tracking-wider mb-1.5 block">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@institution.edu"
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-outline uppercase tracking-wider mb-1.5 block">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-outline uppercase tracking-wider mb-1.5 block">
                  Role
                </label>
                <div className="flex gap-2">
                  {["tech", "admin"].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r as "tech" | "admin")}
                      className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${
                        role === r
                          ? "bg-primary text-white border-primary"
                          : "border-outline-variant/50 text-on-surface-variant hover:bg-surface-container-low"
                      }`}
                    >
                      {r === "tech" ? "Technician" : "Admin"}
                    </button>
                  ))}
                </div>
              </div>
              {role === "tech" && (
                <div>
                  <label className="text-xs font-semibold text-outline uppercase tracking-wider mb-1.5 block">
                    Skills (comma separated)
                  </label>
                  <input
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="Plumbing, Electrical, WiFi"
                    className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
              )}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
                    <><Loader2 className="size-4 animate-spin" /> Creating...</>
                  ) : (
                    "Create User"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
