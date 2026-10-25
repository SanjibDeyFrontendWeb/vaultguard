"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Key, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { Button } from "@/components/ui/Button";
import { deriveKeyEncryptionKey, deriveClientAuthSecret, PBKDF2_ITERATIONS } from "@/lib/crypto/key-derivation";
import { generateVaultEncryptionKey, wrapVaultKey } from "@/lib/crypto/vault-key";
import { getRandomBytes, bytesToBase64 } from "@/lib/crypto/random";
import { generateEmergencyRecoveryKey, hashRecoveryKey } from "@/lib/crypto/recovery";
import { useToast } from "@/components/ui/Toast";
import Image from "next/image";

export default function RecoverAccountPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [recoveryKey, setRecoveryKey] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newRecoveryKey, setNewRecoveryKey] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("New master passwords do not match.");
      return;
    }

    if (newPassword.length < 12) {
      setError("New master password must be at least 12 characters.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Generate new vault key and salt
      const saltBytes = getRandomBytes(32);
      const newVaultSalt = bytesToBase64(saltBytes);

      const kek = await deriveKeyEncryptionKey(newPassword, saltBytes, PBKDF2_ITERATIONS);
      const vek = await generateVaultEncryptionKey();
      const newWrappedVaultKey = await wrapVaultKey(vek, kek, newVaultSalt, PBKDF2_ITERATIONS);

      const newAuthHash = await deriveClientAuthSecret(newPassword, email);
      const genNewRecoveryKey = generateEmergencyRecoveryKey();
      const newRecoveryKeyHash = await hashRecoveryKey(genNewRecoveryKey);

      const res = await fetch("/api/auth/recovery/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          recoveryKey: recoveryKey.trim(),
          newAuthHash,
          newVaultSalt,
          newWrappedVaultKey,
          newRecoveryKeyHash,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Recovery failed. Please check your recovery key.");
        return;
      }

      setNewRecoveryKey(genNewRecoveryKey);
      setIsSuccess(true);
      showToast("Account successfully recovered! Save your new recovery key.", "success");
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during account recovery.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="text-center">
          {/* <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 p-0.5 shadow-lg shadow-amber-500/25 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Key className="w-6 h-6 text-amber-400" />
            </div>
          </div> */}
          <div className="w-full h-full text-center">
            <Image src={"/VaultGuardLogo_250x66.png"} alt="VaultGuard Logo" width={200} height={50} className="max-w-full h-full mx-auto" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex gap-3 items-center justify-center">
            {/* <Key className="w-6 h-6 text-amber-400" />  */}
            Emergency Account Recovery
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Use your 32-character Emergency Recovery Key to regain access to your account.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {!isSuccess ? (
          <form onSubmit={handleRecover} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <Input
                type="email"
                required
                leftIcon={<Mail className="w-4 h-4" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Emergency Recovery Key
              </label>
              <Input
                type="text"
                required
                leftIcon={<Key className="w-4 h-4" />}
                value={recoveryKey}
                onChange={(e) => setRecoveryKey(e.target.value)}
                placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                New Master Password (min 12 chars)
              </label>
              <PasswordInput
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Choose new master password"
                disabled={isLoading}
              />
              <PasswordStrength password={newPassword} />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Confirm New Master Password
              </label>
              <PasswordInput
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new master password"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              isLoading={isLoading}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Reset Master Password
            </Button>

            <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
              Remember your password?{" "}
              <Link href="/login" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                Sign in
              </Link>
            </div>
          </form>
        ) : (
          <div className="space-y-5 animate-in fade-in">
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>Password successfully reset! Below is your NEW Emergency Recovery Key.</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-center text-sm font-semibold tracking-wider text-slate-900 dark:text-slate-100 break-all select-all">
              {newRecoveryKey}
            </div>

            <Button
              type="button"
              variant="primary"
              className="w-full"
              onClick={() => router.push("/vault")}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Proceed to Vault
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
