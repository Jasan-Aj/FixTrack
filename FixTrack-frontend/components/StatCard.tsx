"use client";

import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  label: string;
  value: string | number;
  trend?: {
    value: string;
    positive: boolean;
  };
  progress?: number;
  progressColor?: string;
}

export default function StatCard({
  icon: Icon,
  iconBg = "bg-primary/10",
  iconColor = "text-primary",
  label,
  value,
  trend,
  progress,
  progressColor = "bg-primary",
}: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-2xl soft-shadow border border-slate-100 soft-lift">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-lg ${iconBg} ${iconColor}`}>
          <Icon className="size-6" />
        </div>
        {trend && (
          <span
            className={`text-xs font-bold flex items-center px-2 py-1 rounded-full ${
              trend.positive
                ? "text-emerald-600 bg-emerald-50"
                : "text-amber-600 bg-amber-50"
            }`}
          >
            {trend.positive ? (
              <TrendingUp className="size-3.5 mr-1" />
            ) : (
              <TrendingDown className="size-3.5 mr-1" />
            )}
            {trend.value}
          </span>
        )}
      </div>
      <p className="text-xs font-semibold uppercase tracking-widest text-outline mb-1">
        {label}
      </p>
      <h3 className="text-3xl font-bold text-on-surface">{value}</h3>
      {progress !== undefined && (
        <div className="mt-4 w-full bg-surface-container rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full ${progressColor}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
