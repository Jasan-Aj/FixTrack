"use client";

import { useState } from "react";
import { Star, Loader2, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";

interface FeedbackFormProps {
  complaintId: number;
  onSubmitted: () => void;
}

export default function FeedbackForm({ complaintId, onSubmitted }: FeedbackFormProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) return;
    setSubmitting(true);
    setError("");
    try {
      await api.complaints.feedback(complaintId, rating, comment || undefined);
      setSubmitted(true);
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-8 animate-success">
        <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="size-8 text-primary" />
        </div>
        <h3 className="text-lg font-bold text-on-surface mb-1">Thank You!</h3>
        <p className="text-sm text-on-surface-variant">
          Your feedback helps us build a better experience.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <p className="text-xs text-error text-center bg-error-container/30 px-3 py-2 rounded-lg">{error}</p>
      )}

      <div>
        <p className="text-center text-[11px] font-bold text-outline uppercase tracking-widest mb-4">
          Select Rating
        </p>
        <div className="flex justify-center gap-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="p-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-full"
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              onClick={() => {
                setRating(star);
                // Subtle scale effect
                const el = document.getElementById(`star-${star}`);
                if (el) {
                  el.style.transform = "scale(0.9)";
                  setTimeout(() => { el.style.transform = "scale(1)"; }, 100);
                }
              }}
            >
              <Star
                id={`star-${star}`}
                className={`size-8 transition-all duration-200 ${
                  star <= (hover || rating)
                    ? "fill-yellow-500 text-yellow-500 scale-110"
                    : "text-outline-variant"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <textarea
        placeholder="Tell us what's on your mind..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all resize-none placeholder:text-outline/50"
      />

      <button
        type="submit"
        disabled={rating === 0 || submitting}
        className="w-full bg-primary text-white py-3.5 rounded-xl text-sm font-bold shadow-sm hover:shadow-md hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            Submitting...
          </span>
        ) : (
          "Submit Feedback"
        )}
      </button>
    </form>
  );
}
