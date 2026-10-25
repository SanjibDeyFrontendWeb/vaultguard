"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Settings,
  Lock,
  Unlock,
  LogOut,
  LogIn,
  UserPlus,
  Menu,
  X,
  User as UserIcon,
} from "lucide-react";
import { useVault } from "@/features/vault/VaultContext";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Badge } from "@/components/ui/Badge";
import { Tooltip } from "@/components/ui/Tooltip";
import Image from "next/image";

export function Navbar() {
  const pathname = usePathname();
  const { user, isUnlocked, lockVault, logout, healthCheck } = useVault();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hide customer navbar on dedicated Super Admin portal
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const hasSecurityIssues =
    healthCheck && (healthCheck.reusedCount > 0 || healthCheck.weakCount > 0);

  const navLinks = [
    {
      name: "Vault",
      href: "/vault",
      icon: KeyRound,
      badge: null,
    },
    {
      name: "Security",
      href: "/security",
      icon: Shield,
      badge: hasSecurityIssues ? (
        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
      ) : null,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/85 dark:bg-slate-950/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <Link
            href={user ? "/vault" : "/"}
            className="flex items-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg p-1"
          >
            {/* <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 p-0.5 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-400 group-hover:text-cyan-300 transition-colors" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
                VaultGuard
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-cyan-400 -mt-1">
                Zero-Knowledge
              </span>
            </div> */}
            <div className="w-full h-full">
              <Image src={"/VaultGuardLogo_250x66.png"} alt="VaultGuard Logo" width={170} height={44} className="max-w-full h-full object-cover" />
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${isActive
                      ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                      }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{link.name}</span>
                    {link.badge}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2.5">
          {/* Vault Lock Status / Quick Lock Button */}
          {user && (
            <div className="flex items-center gap-2">
              {isUnlocked ? (
                <Tooltip content="Click to lock vault immediately & flush memory" position="bottom">
                  <button
                    onClick={lockVault}
                    className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60 transition-colors"
                  >
                    <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Vault Unlocked</span>
                    <span className="text-emerald-500/70 text-[10px] underline ml-0.5">Lock</span>
                  </button>
                </Tooltip>
              ) : (
                <Tooltip content="Vault is locked with AES-256-GCM" position="bottom">
                  <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-amber-700 bg-amber-50 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60">
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Vault Locked</span>
                  </div>
                </Tooltip>
              )}
            </div>
          )}

          {/* Visual Theme Toggle */}
          <ThemeToggle />

          {/* User Account / Auth Actions */}
          {user ? (
            <div className="flex items-center gap-2">
              <Tooltip content={`Signed in as ${user.email}`} position="bottom">
                <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[10px]">
                    {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                  </div>
                  <span className="max-w-[120px] truncate">{user.name || user.email}</span>
                </div>
              </Tooltip>

              <Tooltip content="Sign out of your session" position="bottom">
                <button
                  onClick={() => logout()}
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/25 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>Get Started</span>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          {user && (
            <Tooltip content={mobileMenuOpen ? "Close menu" : "Open menu"} position="bottom">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Mobile Drawer */}
      {user && mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md px-4 pt-3 pb-4 space-y-2 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800/80 text-xs text-slate-500">
            <span className="truncate">{user.email}</span>
            {isUnlocked ? (
              <button
                onClick={() => {
                  lockVault();
                  setMobileMenuOpen(false);
                }}
                className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Unlocked (Lock)</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                <Lock className="w-3.5 h-3.5" />
                <span>Locked</span>
              </span>
            )}
          </div>

          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${isActive
                  ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </div>
                {link.badge}
              </Link>
            );
          })}

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              logout();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </header>
  );
}
