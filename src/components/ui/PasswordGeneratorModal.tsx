"use client";

import React, { useState, useEffect } from "react";
import { Copy, RefreshCw, Check, Sparkles } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Tooltip } from "./Tooltip";
import { generateStrongPassword, calculatePasswordEntropy } from "@/lib/crypto/random";
import { useToast } from "./Toast";

interface PasswordGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPassword?: (password: string) => void;
}

export function PasswordGeneratorModal({
  isOpen,
  onClose,
  onSelectPassword,
}: PasswordGeneratorModalProps) {
  const [length, setLength] = useState(20);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const { showToast } = useToast();

  const handleGenerate = () => {
    const pwd = generateStrongPassword({
      length,
      uppercase,
      lowercase,
      numbers,
      symbols,
      excludeAmbiguous,
    });
    setGeneratedPassword(pwd);
    setCopied(false);
  };

  useEffect(() => {
    if (isOpen) {
      handleGenerate();
    }
  }, [isOpen, length, uppercase, lowercase, numbers, symbols, excludeAmbiguous]);

  const handleCopy = () => {
    if (!generatedPassword) return;
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    showToast("Password copied to clipboard (clears in 30s)", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUse = () => {
    if (onSelectPassword && generatedPassword) {
      onSelectPassword(generatedPassword);
      onClose();
    }
  };

  const { score, level, entropy } = calculatePasswordEntropy(generatedPassword);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Secure Password Generator"
      description="Create cryptographically random, collision-resistant passwords."
      maxWidth="md"
    >
      <div className="space-y-5">
        {/* Output Display */}
        <div className="relative flex items-center justify-between p-3.5 bg-slate-100 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="font-mono text-base break-all select-all font-semibold text-slate-800 dark:text-slate-100 pr-2">
            {generatedPassword}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Tooltip content="Regenerate password" position="top">
              <button
                onClick={handleGenerate}
                className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Regenerate password"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip content={copied ? "Copied!" : "Copy to clipboard"} position="top">
              <button
                onClick={handleCopy}
                className="p-2 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Copy to clipboard"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Strength feedback */}
        <div className="flex items-center justify-between text-xs px-1">
          <span className="text-slate-500">
            Entropy: <strong className="text-slate-700 dark:text-slate-300">{entropy} bits</strong>
          </span>
          <span
            className={`font-semibold ${
              score >= 3 ? "text-emerald-500" : score === 2 ? "text-amber-500" : "text-rose-500"
            }`}
          >
            {level}
          </span>
        </div>

        {/* Length Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <label htmlFor="length-slider" className="font-medium text-slate-700 dark:text-slate-300">
              Password Length: <span className="font-bold text-blue-600 dark:text-blue-400">{length}</span>
            </label>
          </div>
          <input
            id="length-slider"
            type="range"
            min={8}
            max={64}
            value={length}
            onChange={(e) => setLength(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>8 chars</span>
            <span>20 (recommended)</span>
            <span>64 chars</span>
          </div>
        </div>

        {/* Options Checklist */}
        <div className="space-y-2.5 pt-1">
          <label className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={uppercase}
              onChange={(e) => setUppercase(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span>Include Uppercase Letters (A-Z)</span>
          </label>

          <label className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={lowercase}
              onChange={(e) => setLowercase(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span>Include Lowercase Letters (a-z)</span>
          </label>

          <label className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={numbers}
              onChange={(e) => setNumbers(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span>Include Numbers (0-9)</span>
          </label>

          <label className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={symbols}
              onChange={(e) => setSymbols(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span>Include Special Symbols (!@#$%^&*)</span>
          </label>

          <label className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={excludeAmbiguous}
              onChange={(e) => setExcludeAmbiguous(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span>Avoid Ambiguous Characters (e.g. 1, l, I, 0, O)</span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="secondary" size="sm" icon={<Copy className="w-3.5 h-3.5" />} onClick={handleCopy}>
            Copy Password
          </Button>
          {onSelectPassword && (
            <Button variant="primary" size="sm" icon={<Sparkles className="w-3.5 h-3.5" />} onClick={handleUse}>
              Use in Item
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
