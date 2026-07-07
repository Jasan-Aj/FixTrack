import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parse a date string from the backend into a Date object.
 * Backend stores UTC dates but serializes without 'Z' suffix.
 * This appends 'Z' so JS treats it as UTC.
 */
export function parseUTCDate(dateStr: string): Date {
  // Ensure the string ends with Z for proper UTC interpretation
  const normalized = dateStr.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(dateStr)
    ? dateStr
    : dateStr + "Z";
  return new Date(normalized);
}

/**
 * Format a backend UTC date string into a readable date/time display.
 * Example output: "Jul 6, 10:30 AM"
 */
export function formatDateTime(dateStr: string): string {
  const date = parseUTCDate(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
