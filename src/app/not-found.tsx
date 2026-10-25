"use client";

import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center py-20 px-4 text-center">
      <div className="max-w-md w-full space-y-6 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            404 — Page Not Found
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Resource Does Not Exist
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            The page you requested may have been moved, deleted, or does not exist in your vault.
          </p>
        </div>
        <div className="pt-2">
          <Link href="/">
            <Button variant="primary" icon={<ArrowLeft className="w-4 h-4" />}>
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
