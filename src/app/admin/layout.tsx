"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  ShieldAlert,
  Users,
  BarChart3,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Server,
  Lock,
  ArrowLeft,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { ThemeToggle } from "../../components/layout/ThemeToggle";
import { Tooltip } from "../../components/ui/Tooltip";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isLoginPage = pathname === "/admin/login";

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAdminDropdownOpen(false);
      }
    }
    if (adminDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [adminDropdownOpen]);

  useEffect(() => {
    // If on the login page, no need to verify or redirect
    if (isLoginPage) {
      setIsChecking(false);
      return;
    }

    async function checkAuth() {
      try {
        const res = await fetch("/api/admin/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setAdminEmail(data.admin.email);
            setIsChecking(false);
            return;
          }
        }
        // Not authenticated: redirect to login
        setAdminEmail(null);
        window.location.href = "/admin/login";
      } catch (err) {
        setAdminEmail(null);
        window.location.href = "/admin/login";
      }
    }

    checkAuth();
  }, [pathname, isLoginPage]);

  // Fast single-click disabled admin logout
  const handleLogout = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setAdminDropdownOpen(false);

    try {
      fetch("/api/admin/auth/logout", { method: "POST", keepalive: true }).catch(() => {});
    } catch {}

    setAdminEmail(null);
    window.location.href = "/admin/login";
  };

  // If on login page, render clean container immediately
  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
        {children}
      </div>
    );
  }

  // If checking authentication, show clean loader instead of blank screen
  if (isChecking) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-medium tracking-wide">
            Verifying Super Admin session...
          </span>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect is happening
  if (!adminEmail) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased transition-colors duration-200">
      {/* Top Super Admin Executive Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex items-center gap-3 group">
              <div className="relative">
                <Image
                  src="/VaultGuardLogo_250x66.png"
                  alt="VaultGuard Logo"
                  width={150}
                  height={38}
                  className="object-contain"
                />
              </div>
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm shadow-indigo-600/25">
                Super Admin
              </span>
            </Link>

            <span className="hidden md:inline-block w-px h-5 bg-slate-200 dark:bg-slate-800 mx-2" />

            <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Security Engine Online</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Link to Customer App */}
            <Tooltip content="Open end-user customer vault portal" position="bottom">
              <Link
                href="/vault"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Customer Portal</span>
              </Link>
            </Tooltip>

            {/* Admin Identity Badge & Header Tabs Dropdown */}
            {adminEmail && (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                    adminDropdownOpen
                      ? "bg-indigo-100 dark:bg-indigo-900/60 border-indigo-300 dark:border-indigo-700 text-indigo-900 dark:text-indigo-100 shadow-xs"
                      : "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/40"
                  }`}
                  aria-label="Super Admin Menu"
                  aria-expanded={adminDropdownOpen}
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="truncate max-w-[150px] sm:max-w-[180px]">{adminEmail}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-indigo-500 transition-transform duration-200 ${
                      adminDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu below Admin Login Info */}
                {adminDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-900/10 dark:shadow-black/40 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* Admin Header Info */}
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shadow-indigo-600/30">
                          SA
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            Super Administrator
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {adminEmail}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Admin Header Tabs */}
                    <div className="px-2 py-2">
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Admin Navigation Tabs
                      </div>
                      <div className="space-y-0.5 mt-1">
                        <Link
                          href="/admin"
                          onClick={() => setAdminDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
                        >
                          <BarChart3 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <div>
                            <div className="font-semibold">Executive Dashboard</div>
                            <div className="text-[10px] text-slate-500 font-normal">Real-time system telemetry</div>
                          </div>
                        </Link>
                        <Link
                          href="/vault"
                          onClick={() => setAdminDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <div>
                            <div className="font-semibold">Customer Vault Portal</div>
                            <div className="text-[10px] text-slate-500 font-normal">Switch to end-user vault</div>
                          </div>
                        </Link>
                      </div>
                    </div>

                    {/* Admin Logout Button with Single-Click Disable */}
                    <div className="px-2 pt-1.5 pb-0.5 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        disabled={isLoggingOut}
                        onClick={handleLogout}
                        className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                          isLoggingOut
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                            : "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 active:scale-[0.98]"
                        }`}
                      >
                        {isLoggingOut ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                            <span>Signing out...</span>
                          </>
                        ) : (
                          <>
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out Console</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <ThemeToggle />

            {/* Direct Fast Sign Out Button with Single-Click Disable */}
            <Tooltip content="Sign out of Super Admin Console" position="bottom">
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={handleLogout}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  isLoggingOut
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed"
                    : "text-rose-700 dark:text-rose-300 hover:text-rose-800 dark:hover:text-rose-200 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/70 border-rose-200 dark:border-rose-900/60"
                }`}
                aria-label="Super Admin Sign Out"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                    <span className="hidden sm:inline">Logging out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Logout</span>
                  </>
                )}
              </button>
            </Tooltip>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
