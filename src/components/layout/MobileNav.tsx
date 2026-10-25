"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { KeyRound, Shield, Settings, Plus, Sparkles } from "lucide-react";

interface MobileNavProps {
  onAddItem?: () => void;
  onOpenGenerator?: () => void;
}

export function MobileNav({ onAddItem, onOpenGenerator }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-around shadow-lg">
      <Link
        href="/vault"
        className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-semibold ${
          pathname === "/vault"
            ? "text-blue-600 dark:text-blue-400"
            : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
        }`}
      >
        <KeyRound className="w-5 h-5" />
        <span>Vault</span>
      </Link>

      <button
        onClick={onOpenGenerator}
        className="flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
      >
        <Sparkles className="w-5 h-5" />
        <span>Generator</span>
      </button>

      {onAddItem && (
        <button
          onClick={onAddItem}
          className="w-12 h-12 -mt-5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 hover:scale-105 transition-transform"
          aria-label="Add new item"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      <Link
        href="/security"
        className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-semibold ${
          pathname === "/security"
            ? "text-blue-600 dark:text-blue-400"
            : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
        }`}
      >
        <Shield className="w-5 h-5" />
        <span>Security</span>
      </Link>

      <Link
        href="/settings"
        className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-semibold ${
          pathname === "/settings"
            ? "text-blue-600 dark:text-blue-400"
            : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
        }`}
      >
        <Settings className="w-5 h-5" />
        <span>Settings</span>
      </Link>
    </div>
  );
}
