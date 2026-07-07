"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Bell, Check, CheckCheck, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { parseUTCDate } from "@/lib/utils";
import type { Notification } from "@/types";

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const [list, count] = await Promise.all([
        api.notifications.list(),
        api.notifications.unreadCount(),
      ]);
      setNotifications(list);
      setUnreadCount(count.count);
    } catch {
      // Ignore errors
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleMarkRead(id: number) {
    try {
      await api.notifications.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Ignore errors
    }
  }

  async function handleMarkAllRead() {
    try {
      await api.notifications.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // Ignore errors
    }
  }

  function formatTime(dateStr: string) {
    const date = parseUTCDate(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-full hover:bg-surface-container-low transition-colors text-on-surface-variant relative"
        aria-label="Notifications"
      >
        <div className="relative">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-error text-white text-[10px] font-bold rounded-full px-1 border-2 border-surface">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[380px] max-w-[90vw] bg-white rounded-2xl shadow-xl border border-outline-variant/20 z-50 max-h-[70vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/10">
            <h3 className="text-sm font-bold text-on-surface">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                <CheckCheck className="size-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="size-8 text-outline-variant mb-3" />
                <p className="text-sm font-semibold text-on-surface-variant">
                  No notifications yet
                </p>
                <p className="text-xs text-outline mt-1">
                  You&apos;re all caught up!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/10">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-5 py-4 transition-colors ${
                      !n.is_read
                        ? "bg-primary/5"
                        : "hover:bg-surface-container-low"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-sm leading-tight ${
                            !n.is_read
                              ? "font-bold text-on-surface"
                              : "font-semibold text-on-surface-variant"
                          }`}
                        >
                          {n.title}
                        </p>
                        {!n.is_read && (
                          <span className="size-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-outline mt-1 line-clamp-2">
                        {n.message}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-[10px] text-outline font-medium">
                          <Clock className="size-3" />
                          {formatTime(n.created_at)}
                        </span>
                      </div>
                    </div>
                    {!n.is_read && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="flex-shrink-0 p-1.5 rounded-lg hover:bg-surface-container-high transition-colors text-outline hover:text-primary mt-0.5"
                        title="Mark as read"
                      >
                        <Check className="size-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
