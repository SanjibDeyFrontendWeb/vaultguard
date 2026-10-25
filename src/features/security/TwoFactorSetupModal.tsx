"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ShieldCheck, Copy, Download, KeyRound, AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useVault } from "@/features/vault/VaultContext";

interface TwoFactorSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function TwoFactorSetupModal({
  isOpen,
  onClose,
  onSuccess,
}: TwoFactorSetupModalProps) {
  const { showToast } = useToast();
  const { setUser } = useVault();

  const [step, setStep] = useState<"loading" | "qr" | "codes" | "verify">("loading");
  const [setupData, setSetupData] = useState<{
    secret: string;
    qrCodeUrl: string;
    recoveryCodes: string[];
  } | null>(null);
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize setup
  React.useEffect(() => {
    if (isOpen) {
      setStep("loading");
      setError(null);
      setCode("");

      fetch("/api/auth/2fa/setup", { method: "POST" })
        .then((res) => res.json())
        .then((data) => {
          if (data.secret) {
            setSetupData(data);
            setStep("qr");
          } else {
            setError(data.error || "Failed to initialize 2FA setup");
          }
        })
        .catch(() => setError("Failed to start 2FA configuration"));
    }
  }, [isOpen]);

  const handleCopySecret = () => {
    if (!setupData) return;
    navigator.clipboard.writeText(setupData.secret);
    showToast("Secret key copied to clipboard", "success");
  };

  const handleDownloadCodes = () => {
    if (!setupData) return;
    const content = `VAULTGUARD 2FA EMERGENCY RECOVERY CODES\nGenerated: ${new Date().toISOString()}\n\nEach code can be used ONCE if you lose access to your authenticator app:\n\n${setupData.recoveryCodes
      .map((c, i) => `${i + 1}. ${c}`)
      .join("\n")}\n\nStore these in a secure offline location.`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vaultguard-recovery-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Recovery codes downloaded", "success");
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();
      if (res.ok) {
        setUser((prev) => (prev ? { ...prev, twoFactorEnabled: true } : null));
        showToast("Two-Factor Authentication activated!", "success");
        onSuccess();
        onClose();
      } else {
        setError(data.error || "Verification failed. Check the code and try again.");
      }
    } catch {
      setError("Network error during verification.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Set Up Two-Factor Authentication (TOTP)"
      description="Add an extra layer of defense with Google Authenticator, Authy, or 1Password."
      maxWidth="md"
    >
      <div className="space-y-4">
        {step === "loading" && (
          <div className="py-12 text-center text-slate-400 text-sm">
            Generating cryptographic 2FA secret...
          </div>
        )}

        {step === "qr" && setupData && (
          <div className="space-y-4 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              1. Scan this QR code using your authenticator application.
            </p>

            <div className="flex justify-center">
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm inline-block">
                <Image
                  src={setupData.qrCodeUrl}
                  alt="2FA QR Code"
                  width={180}
                  height={180}
                  className="rounded-lg"
                  unoptimized
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-left">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Manual Entry Key
                </span>
                <button
                  type="button"
                  onClick={handleCopySecret}
                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium hover:underline"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
              </div>
              <p className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 break-all select-all">
                {setupData.secret}
              </p>
            </div>

            <Button
              className="w-full"
              size="md"
              onClick={() => setStep("codes")}
            >
              Next: View Recovery Codes
            </Button>
          </div>
        )}

        {step === "codes" && setupData && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                Save these backup recovery codes now. If you lose your phone, they are your only
                way to regain account access.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs">
              {setupData.recoveryCodes.map((code, idx) => (
                <div key={idx} className="p-1.5 text-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200/60 dark:border-slate-800/60 text-slate-800 dark:text-slate-200">
                  {code}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                icon={<Download className="w-3.5 h-3.5" />}
                onClick={handleDownloadCodes}
              >
                Download Codes
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={() => setStep("verify")}
              >
                Next: Verify Code
              </Button>
            </div>
          </div>
        )}

        {step === "verify" && (
          <form onSubmit={handleVerify} className="space-y-4 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter the 6-digit verification code currently shown in your authenticator app.
            </p>

            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
              placeholder="123456"
              maxLength={6}
              className="text-center font-mono text-2xl tracking-[0.4em] font-bold h-12"
              autoFocus
              error={error || undefined}
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="ghost" size="sm" onClick={() => setStep("qr")}>
                Back
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isVerifying}
                icon={<ShieldCheck className="w-4 h-4" />}
              >
                Activate 2FA
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
