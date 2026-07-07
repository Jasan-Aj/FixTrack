"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import type { User } from "@/types";
import {
  AlertCircle,
  Loader2,
  Upload,
  X,
  ChevronRight,
  Send,
} from "lucide-react";

export default function NewComplaint() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [priority, setPriority] = useState("medium");
  const [hostelBlock, setHostelBlock] = useState("");
  const [roomNo, setRoomNo] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    const u = getStoredUser();
    if (!u || u.role !== "student") {
      router.push("/login");
      return;
    }
    setUser(u);
    setHostelBlock(u.hostel_block || "");
    setRoomNo(u.room_no || "");
  }, []);

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

  async function handleSubmit(e: React.FormEvent) {
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
        urgency: priority as any,
        hostel_block: hostelBlock,
        room_no: roomNo,
        image_urls: urls,
      });
      router.push("/student/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create complaint");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout
      user={user}
      role="student"
      title=""
      subtitle=""
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-outline text-[11px] font-bold uppercase tracking-wider">
        <button onClick={() => router.push("/student/dashboard")} className="hover:text-primary transition-colors">
          Complaints
        </button>
        <ChevronRight className="size-3.5" />
        <span className="text-on-surface">New Complaint</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-on-surface tracking-tight mb-2">
          Submit a New Complaint
        </h1>
        <p className="text-on-surface-variant max-w-xl">
          Please provide specific details so our team can resolve your issue as quickly as possible.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-error bg-error-container/30 px-4 py-3 rounded-xl mb-6 border border-error/10">
          <AlertCircle className="size-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-[800px] space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category */}
          <div>
            <label className="block text-[11px] font-bold text-outline uppercase tracking-wider mb-2">
              Complaint Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-14 px-4 bg-white border border-outline-variant/50 rounded-xl appearance-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer text-sm"
            >
              <option value="plumbing">Plumbing</option>
              <option value="electrical">Electrical</option>
              <option value="wifi">WiFi</option>
              <option value="carpentry">Carpentry</option>
              <option value="cleaning">Cleaning</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-[11px] font-bold text-outline uppercase tracking-wider mb-2">
              Priority Level
            </label>
            <div className="flex gap-2 h-14">
              {["low", "medium", "high"].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setPriority(lvl)}
                  className={`flex-1 h-full rounded-xl text-xs font-bold border transition-all ${
                    priority === lvl
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

          {/* Title */}
          <div className="col-span-full">
            <label className="block text-[11px] font-bold text-outline uppercase tracking-wider mb-2">
              Complaint Title
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Broken faucet in bathroom"
              className="w-full h-14 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
            />
          </div>

          {/* Description */}
          <div className="col-span-full">
            <label className="block text-[11px] font-bold text-outline uppercase tracking-wider mb-2">
              Detailed Description
            </label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail, including specific locations and times if applicable..."
              rows={5}
              className="w-full p-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm resize-none"
            />
          </div>

          {/* Block + Room */}
          <div>
            <label className="block text-[11px] font-bold text-outline uppercase tracking-wider mb-2">
              Hostel Block
            </label>
            <input
              value={hostelBlock}
              onChange={(e) => setHostelBlock(e.target.value)}
              placeholder="A, B..."
              className="w-full h-14 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-outline uppercase tracking-wider mb-2">
              Room No
            </label>
            <input
              value={roomNo}
              onChange={(e) => setRoomNo(e.target.value)}
              className="w-full h-14 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
            />
          </div>

          {/* File Upload */}
          <div className="col-span-full">
            <label className="block text-[11px] font-bold text-outline uppercase tracking-wider mb-2">
              Attachments (Optional)
            </label>
            <label className="relative h-40 flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/50 rounded-2xl hover:border-primary/50 hover:bg-surface-container-low transition-all group cursor-pointer">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageSelect}
              />
              <Upload className="size-8 text-outline group-hover:text-primary transition-colors mb-2" />
              <p className="text-xs text-on-surface-variant">
                Drag and drop images or <span className="text-primary font-bold">browse</span>
              </p>
              <p className="text-[11px] text-outline mt-1">PNG, JPG up to 10MB each</p>
            </label>
            {imagePreviews.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {imagePreviews.map((preview, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${i}`}
                      className="h-20 w-20 rounded-lg object-cover border border-outline-variant/30"
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
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t border-outline-variant/10">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-8 h-14 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors active:scale-95"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-10 h-14 bg-primary text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all active:scale-95 flex items-center gap-2"
          >
            {submitting ? (
              <><Loader2 className="size-4 animate-spin" /> Submitting...</>
            ) : (
              <><Send className="size-4" /> Submit Complaint</>
            )}
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}
