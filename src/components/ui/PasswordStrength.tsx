"use client";

import React from "react";
import { Check, X } from "lucide-react";
import { calculatePasswordEntropy } from "@/lib/crypto/random";

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const { score, level, entropy } = calculatePasswordEntropy(password);

  const colors = [
    "bg-slate-300 dark:bg-slate-700",
    "bg-rose-500",
    "bg-amber-500",
    "bg-blue-500",
    "bg-emerald-500",
  ];

  const checks = [
    { label: "12+ characters", pass: password.length >= 12 },
    { label: "Upper & lowercase", pass: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: "Numbers", pass: /[0-9]/.test(password) },
    { label: "Symbols", pass: /[^a-zA-Z0-9]/.test(password) },
  ];

  return (
    <div className="w-full space-y-2 pt-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400">Password strength:</span>
        <span
          className={`font-semibold ${
            score === 0
              ? "text-slate-400"
              : score === 1
              ? "text-rose-500"
              : score === 2
              ? "text-amber-500"
              : score === 3
              ? "text-blue-500"
              : "text-emerald-500"
          }`}
        >
          {password ? `${level} (${entropy} bits)` : "None"}
        </span>
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`rounded-full transition-colors duration-300 ${
              score >= step ? colors[score] : "bg-slate-200 dark:bg-slate-800"
            }`}
          />
        ))}
      </div>

      {/* Criteria checklist */}
      <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
        {checks.map((c, i) => (
          <div
            key={i}
            className={`flex items-center gap-1.5 transition-colors ${
              c.pass ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-600"
            }`}
          >
            {c.pass ? <Check className="w-3 h-3 shrink-0" /> : <X className="w-3 h-3 shrink-0" />}
            <span>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
