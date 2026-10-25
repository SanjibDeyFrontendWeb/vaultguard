"use client";

import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Tooltip } from "@/components/ui/Tooltip";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    // If admin is already authenticated and navigating within the admin area, avoid blocking UI
    if (adminEmail && !isLoginPage) {
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
            if (isLoginPage) {
              router.push("/admin");
            }
          } else {
            setAdminEmail(null);
            if (!isLoginPage) {
              router.push("/admin/login");
            }
          }
        }
      } catch (err) {
        if (!isLoginPage) {
          router.push("/admin/login");
        }
      } finally {
        setIsChecking(false);
      }
    }

    checkAuth();
  }, [pathname, isLoginPage, router, adminEmail]);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } catch {}
    router.push("/admin/login");
  };

  // If on login page, render clean container
  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
        {children}
      </div>
    );
  }

  // If checking authentication or not authenticated, render nothing and let redirect take place
  if (isChecking || !adminEmail) {
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

            {/* Admin Identity Badge */}
            {adminEmail && (
              <Tooltip content="Authenticated with Super Admin privileges" position="bottom">
                <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="truncate max-w-[180px]">{adminEmail}</span>
                </div>
              </Tooltip>
            )}

            <ThemeToggle />

            {/* Sign Out Button */}
            <Tooltip content="Sign out of Super Admin Console" position="bottom">
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-rose-700 dark:text-rose-300 hover:text-rose-800 dark:hover:text-rose-200 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/70 border border-rose-200 dark:border-rose-900/60 transition-colors"
                aria-label="Super Admin Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
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
