"use client";

import React from "react";
import { ShieldAlert, ShieldCheck, Shield } from "lucide-react";

interface SecurityScoreGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export function SecurityScoreGauge({ score, size = "md" }: SecurityScoreGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, score));

  // Determine color and status
  let color = "text-emerald-500 stroke-emerald-500";
  let bgColor = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400";
  let label = "Excellent Protection";
  let Icon = ShieldCheck;

  if (clampedScore < 50) {
    color = "text-rose-500 stroke-rose-500";
    bgColor = "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400";
    label = "Critical Action Required";
    Icon = ShieldAlert;
  } else if (clampedScore < 75) {
    color = "text-amber-500 stroke-amber-500";
    bgColor = "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400";
    label = "Needs Improvement";
    Icon = Shield;
  } else if (clampedScore < 90) {
    color = "text-blue-500 stroke-blue-500";
    bgColor = "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400";
    label = "Good Security";
    Icon = ShieldCheck;
  }

  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex items-center justify-center shrink-0 w-24 h-24">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 96 96">
          <circle
            cx="48"
            cy="48"
            r={radius}
            className="stroke-slate-200 dark:stroke-slate-800"
            strokeWidth="7"
            fill="transparent"
          />
          <circle
            cx="48"
            cy="48"
            r={radius}
            className={`transition-all duration-700 ease-out ${color}`}
            strokeWidth="7"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            {clampedScore}
          </span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            / 100
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <Icon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
          <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{label}</h4>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Evaluated locally using password entropy, reuse detection, and 2FA status.
        </p>
      </div>
    </div>
  );
}
