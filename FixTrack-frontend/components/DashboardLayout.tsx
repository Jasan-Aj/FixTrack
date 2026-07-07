"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { clearStoredUser } from "@/lib/auth";
import type { User } from "@/types";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  AlertTriangle,
  DoorOpen,
  Wrench,
} from "lucide-react";
import NotificationDropdown from "@/components/NotificationDropdown";

interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: number;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: User | null;
  role: "student" | "tech" | "admin";
  title: string;
  subtitle?: string;
}

export default function DashboardLayout({
  children,
  user,
  role,
  title,
  subtitle,
}: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: NavItem[] =
    role === "student"
      ? [
          { label: "Dashboard", icon: LayoutDashboard, href: "/student/dashboard" },
          { label: "My Complaints", icon: AlertTriangle, href: "/student/complaints" },
        ]
      : role === "tech"
        ? [
            { label: "Dashboard", icon: LayoutDashboard, href: "/tech/dashboard" },
          ]
        : [
            { label: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
            { label: "Complaints", icon: AlertTriangle, href: "/admin/complaints" },
            { label: "Technicians", icon: Wrench, href: "/admin/technicians" },
          ];

  const roleLabel =
    role === "student"
      ? "Student Hub"
      : role === "tech"
        ? "Technician Portal"
        : "Central Management";

  function isActive(href: string) {
    if (href === "#") return false;
    return pathname === href || pathname.startsWith(href + "/");
  }

  function handleLogout() {
    clearStoredUser();
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex h-screen w-64 fixed left-0 top-0 glass-sidebar flex-col py-6 px-4 z-40 overflow-y-auto custom-scrollbar">
        {/* Brand */}
        <div className="mb-8 flex items-center gap-3 px-4">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center overflow-hidden shadow-sm ring-1 ring-black/5">
            <Image
              src="/logo1.png"
              alt="FixTrack"
              width={48}
              height={48}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary leading-tight tracking-tight">
              FixTrack
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">
              {roleLabel}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer active:translate-x-1 duration-300 group transition-all ${
                  active
                    ? "bg-primary-container text-on-primary-container font-semibold"
                    : "text-on-surface-variant hover:bg-secondary-container/50"
                }`}
              >
                <Icon className="size-5" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {item.label}
                </span>
                {item.badge !== undefined && (
                  <span className="ml-auto bg-error text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="mt-auto pt-6 border-t border-outline-variant/20 space-y-1">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-error/10 border border-error/40 text-error font-bold hover:bg-error hover:text-white hover:border-error transition-all cursor-pointer group"
          >
            <DoorOpen className="size-5 text-slate-700 group-hover:text-white group-hover:scale-110 transition-all" />
            <span className="text-xs font-semibold uppercase tracking-wider">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-h-screen flex flex-col">
        {/* Top Navigation Bar */}
        <header className="bg-surface/70 backdrop-blur-xl sticky top-0 z-30 border-b border-outline-variant/20 shadow-sm">
          <div className="flex items-center justify-between w-full px-6 md:px-10 py-3">
            <div className="flex items-center gap-4 flex-1">
              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-surface-container-low transition-colors text-on-surface-variant"
              >
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <NotificationDropdown />
              <div className="h-8 w-px bg-outline-variant/30 mx-1 hidden sm:block"></div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-on-surface">{user?.name || "User"}</p>
                  <p className="text-[10px] text-outline uppercase tracking-wider font-semibold">
                    {role === "student"
                      ? `${user?.hostel_block || ""} Block`
                      : role === "tech"
                        ? "Technician"
                        : "Administrator"}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold border-2 border-white shadow-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 px-6 md:px-10 py-8 max-w-[1280px] mx-auto w-full">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-on-surface tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-on-surface-variant mt-1">{subtitle}</p>
            )}
          </div>

          {children}
        </div>

        {/* Footer */}
        <footer className="border-t border-outline-variant/10 py-4 bg-surface mt-auto">
          <div className="flex flex-col md:flex-row justify-between items-center px-6 md:px-10 max-w-[1280px] mx-auto gap-4">
            <p className="text-xs text-on-secondary-container">
              © 2024 FixTrack. All rights reserved.
            </p>
          </div>
        </footer>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-outline-variant/20 px-4 py-2 flex justify-around items-center z-50">
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center gap-1 ${
                active ? "text-primary" : "text-outline"
              }`}
            >
              <Icon className="size-5" />
              <span className="text-[10px] font-bold">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
