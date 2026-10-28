"use client";

import React, { useState, useRef, useEffect } from "react";
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
  User as UserIcon,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { useVault } from "@/features/vault/VaultContext";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Badge } from "@/components/ui/Badge";
import { Tooltip } from "@/components/ui/Tooltip";
import Image from "next/image";

export function Navbar() {
  const pathname = usePathname();
  const { user, isUnlocked, lockVault, logout, healthCheck } = useVault();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    if (userDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userDropdownOpen]);

  // Fast single-click logout with button disable
  const handleFastLogout = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setUserDropdownOpen(false);
    logout();
  };

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
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <div className="flex items-center shrink-0">
          <Link
            href={user ? "/vault" : "/"}
            className="flex items-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg p-0.5 sm:p-1"
          >
            <div className="w-[125px] sm:w-[155px] md:w-[170px] h-auto">
              <Image
                src="/VaultGuardLogo_250x66.png"
                alt="VaultGuard Logo"
                width={170}
                height={44}
                priority
                className="w-full h-auto object-contain"
              />
            </div>
          </Link>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
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
              {/* User Login Info Dropdown Trigger & Menu */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className={`flex items-center gap-1.5 sm:gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-medium transition-all ${
                    userDropdownOpen
                      ? "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 shadow-xs"
                      : "bg-slate-100/70 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                  aria-label="User account menu"
                  aria-expanded={userDropdownOpen}
                >
                  <div className="w-7 h-7 sm:w-6 sm:h-6 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs sm:text-[11px] shadow-xs shrink-0">
                    {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                  </div>
                  <span className="hidden sm:inline-block font-semibold text-slate-800 dark:text-slate-200 max-w-[120px] truncate leading-tight">
                    {user.name ? user.name.trim().split(/\s+/)[0] : user.email.split("@")[0]}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-500 dark:text-slate-400 transition-transform duration-200 ${
                      userDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu below User Login Info */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-900/10 dark:shadow-black/40 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* User Identity Header */}
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/20">
                          {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {user.name || "VaultGuard User"}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {user.email}
                          </div>
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                              Active Encrypted Session
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Header Tabs Navigation inside Dropdown */}
                    <div className="px-2 py-2">
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Header Tabs & Navigation
                      </div>
                      <div className="space-y-0.5 mt-1">
                        {navLinks.map((link) => {
                          const Icon = link.icon;
                          const isActive = pathname === link.href;
                          return (
                            <Link
                              key={link.href}
                              href={link.href}
                              onClick={() => setUserDropdownOpen(false)}
                              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                                isActive
                                  ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold"
                                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70"
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`p-1.5 rounded-lg ${
                                    isActive
                                      ? "bg-blue-600 text-white shadow-xs"
                                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                  }`}
                                >
                                  <Icon className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <div className="leading-tight">{link.name}</div>
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                                    {link.name === "Vault"
                                      ? "Stored items & passwords"
                                      : link.name === "Security"
                                      ? "Health audit & reused passwords"
                                      : "Security preferences & keys"}
                                  </div>
                                </div>
                              </div>
                              {link.badge}
                            </Link>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quick Vault Lock Status */}
                    <div className="px-2 py-1.5 border-t border-slate-100 dark:border-slate-800">
                      {isUnlocked ? (
                        <button
                          type="button"
                          onClick={() => {
                            lockVault();
                            setUserDropdownOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Vault is Unlocked</span>
                          </div>
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-md">
                            Click to Lock
                          </span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                          <Lock className="w-3.5 h-3.5 text-amber-500" />
                          <span>Vault is Locked (AES-256)</span>
                        </div>
                      )}
                    </div>

                    {/* Disabled On First Click Fast Logout Button */}
                    <div className="px-2 pt-1.5 pb-0.5 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        disabled={isLoggingOut}
                        onClick={handleFastLogout}
                        className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                          isLoggingOut
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                            : "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 active:scale-[0.98]"
                        }`}
                      >
                        {isLoggingOut ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                            <span>Logging out...</span>
                          </>
                        ) : (
                          <>
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Direct Fast Logout Icon with Single-Click Disable (Desktop only) */}
              <Tooltip content="Sign out of your session" position="bottom">
                <button
                  type="button"
                  disabled={isLoggingOut}
                  onClick={handleFastLogout}
                  className={`hidden sm:inline-flex p-2 rounded-xl transition-colors ${
                    isLoggingOut
                      ? "text-slate-400 dark:text-slate-600 cursor-not-allowed bg-slate-100 dark:bg-slate-800"
                      : "text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  }`}
                  aria-label="Sign out"
                >
                  {isLoggingOut ? (
                    <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                </button>
              </Tooltip>
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <Link
                href="/login"
                className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-colors ${
                  pathname === "/login"
                    ? "bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <LogIn className="w-3.5 h-3.5 shrink-0 hidden sm:inline-block" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/25 whitespace-nowrap shrink-0 transition-all active:scale-[0.98]"
              >
                <UserPlus className="w-3.5 h-3.5 shrink-0 hidden sm:inline-block" />
                <span>Get Started</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
