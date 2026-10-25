"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("VaultGuard Application Error:", error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center py-20 px-4 text-center">
      <div className="max-w-md w-full space-y-6 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-sm">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            Application Error
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Something went wrong
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            An unexpected error occurred while executing client operations.
          </p>
        </div>
        <div className="pt-2 flex justify-center gap-3">
          <Button
            variant="primary"
            onClick={() => reset()}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}
