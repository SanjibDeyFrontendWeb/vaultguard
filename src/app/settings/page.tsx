"use client";

import React, { useState } from "react";
import {
  Settings,
  Shield,
  Smartphone,
  Key,
  Clock,
  Eye,
  Lock,
  Database,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useVault } from "@/features/vault/VaultContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { TwoFactorSetupModal } from "@/features/security/TwoFactorSetupModal";
import { useToast } from "@/components/ui/Toast";
import SettingsLoading from "@/app/settings/loading";
import { deriveClientAuthSecret } from "@/lib/crypto/key-derivation";

export default function SettingsPage() {
  const {
    user,
    autoLockMinutes,
    setAutoLockMinutes,
    lockOnBackground,
    setLockOnBackground,
    setUser,
    isLoading,
  } = useVault();
  const { showToast } = useToast();

  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !disablePassword) return;

    setIsDisabling2FA(true);
    try {
      const authHash = await deriveClientAuthSecret(disablePassword, user.email);
      const res = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authHash }),
      });

      if (res.ok) {
        setUser((prev) => (prev ? { ...prev, twoFactorEnabled: false } : null));
        setShowDisable2FA(false);
        setDisablePassword("");
        showToast("Two-factor authentication disabled", "info");
      } else {
        showToast("Incorrect Master Password confirmation", "error");
      }
    } catch {
      showToast("Failed to disable 2FA", "error");
    } finally {
      setIsDisabling2FA(false);
    }
  };

  if (isLoading) {
    return <SettingsLoading />;
  }

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold">Please sign in to view Settings</h2>
        <a href="/login" className="mt-4">
          <Button>Sign In</Button>
        </a>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-blue-500" />
          <span>Security & Vault Settings</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Configure inactivity auto-lock, two-factor authentication, and cryptographic preferences.
        </p>
      </div>

      <div className="space-y-6">
        {/* Account Profile Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-500" />
            Account Identity
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-400 block mb-0.5">Full Name</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{user.name}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-400 block mb-0.5">Email Address</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                {user.email}
              </span>
            </div>
          </div>
        </div>

        {/* Auto-Lock & Clipboard Protection */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            Vault Inactivity & Auto-Lock
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                Auto-Lock Inactivity Timeout
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[5, 10, 15, 30].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => {
                      setAutoLockMinutes(mins);
                      showToast(`Auto-lock set to ${mins} minutes`, "info");
                    }}
                    className={`p-3 rounded-xl border font-bold text-xs transition-all ${
                      autoLockMinutes === mins
                        ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {mins} Minutes
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={lockOnBackground}
                onChange={(e) => {
                  setLockOnBackground(e.target.checked);
                  showToast(
                    e.target.checked
                      ? "Vault will lock when switching tabs"
                      : "Lock on tab switch disabled",
                    "info"
                  );
                }}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  Lock immediately on tab change / window blur
                </span>
                <span className="text-slate-400 text-[11px]">
                  Scrub cryptographic keys whenever the browser tab loses focus.
                </span>
              </div>
            </label>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  Clipboard Auto-Clear Timeout
                </span>
                <span className="text-slate-400 text-[11px]">
                  Copied passwords automatically scrub from clipboard after 30 seconds.
                </span>
              </div>
              <Badge variant="emerald">ACTIVE (30s)</Badge>
            </div>
          </div>
        </div>

        {/* Two-Factor Authentication Section */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-500" />
                Two-Factor Authentication (TOTP)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Require a 6-digit one-time passcode from an authenticator app upon login.
              </p>
            </div>
            <Badge variant={user.twoFactorEnabled ? "emerald" : "amber"}>
              {user.twoFactorEnabled ? "ENABLED" : "NOT CONFIGURED"}
            </Badge>
          </div>

          <div className="pt-2">
            {!user.twoFactorEnabled ? (
              <Button size="sm" onClick={() => setShow2FAModal(true)}>
                Configure Authenticator App
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  TOTP 2FA is currently protecting your account against credential theft.
                </p>
                {!showDisable2FA ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    onClick={() => setShowDisable2FA(true)}
                  >
                    Disable Two-Factor Authentication
                  </Button>
                ) : (
                  <form
                    onSubmit={handleDisable2FA}
                    className="p-4 bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl space-y-3 max-w-sm"
                  >
                    <p className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                      Confirm Master Password to disable 2FA:
                    </p>
                    <PasswordInput
                      placeholder="Master Password"
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      required
                    />
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        size="sm"
                        variant="danger"
                        isLoading={isDisabling2FA}
                      >
                        Confirm Disable
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setShowDisable2FA(false);
                          setDisablePassword("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Cryptographic Specifications */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-500" />
            Active Cryptographic Engine
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 block font-semibold">Vault Cipher</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                AES-256-GCM
              </span>
              <p className="text-[10px] text-slate-500">128-bit authentication tag per item</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 block font-semibold">Key Derivation (KDF)</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                PBKDF2-HMAC-SHA256
              </span>
              <p className="text-[10px] text-slate-500">310,000 memory-hard iterations</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 block font-semibold">Server Credential Storage</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                Scrypt (N=16384, r=8)
              </span>
              <p className="text-[10px] text-slate-500">Unique 32-byte salt & constant-time check</p>
            </div>
          </div>
        </div>
      </div>

      <TwoFactorSetupModal
        isOpen={show2FAModal}
        onClose={() => setShow2FAModal(false)}
        onSuccess={() => {
          showToast("Two-factor authentication enabled", "success");
        }}
      />
    </div>
  );
}
