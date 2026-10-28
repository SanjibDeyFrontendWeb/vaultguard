"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("vaultguard_theme");
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
      if (saved === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } else {
      document.documentElement.classList.remove("dark");
      setTheme("light");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("vaultguard_theme", next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  if (!mounted) {
    return (
      <div className="w-[52px] h-7 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300/80 dark:border-slate-700/80 shrink-0" />
    );
  }

  const isDark = theme === "dark";

  return (
    <Tooltip
      content={`Switch to ${isDark ? "light" : "dark"} mode`}
      position="bottom"
    >
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        onClick={toggleTheme}
        className="relative inline-flex h-7 w-[52px] shrink-0 cursor-pointer items-center rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-0.5 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shadow-inner"
        aria-label={`Toggle theme (currently ${theme} mode)`}
      >
        {/* Track icons inside the toggle */}
        <div className="absolute inset-0 flex items-center justify-between px-1.5 pointer-events-none select-none">
          <Sun className="w-3.5 h-3.5 text-amber-500/80" />
          <Moon className="w-3.5 h-3.5 text-indigo-400/80" />
        </div>

        {/* Sliding Thumb containing the active icon */}
        <span
          className={`pointer-events-none z-10 flex h-6 w-6 transform items-center justify-center rounded-full bg-white dark:bg-slate-900 shadow-md ring-0 transition-transform duration-200 ease-in-out ${
            isDark ? "translate-x-6 text-indigo-400" : "translate-x-0 text-amber-500"
          }`}
        >
          {isDark ? (
            <Moon className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <Sun className="w-3.5 h-3.5 shrink-0" />
          )}
        </span>
      </button>
    </Tooltip>
  );
}
