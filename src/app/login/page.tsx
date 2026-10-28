"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Lock, Mail, ArrowRight, ShieldCheck, KeyRound, Smartphone } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { deriveClientAuthSecret } from "@/lib/crypto/key-derivation";
import { useVault } from "@/features/vault/VaultContext";
import { useToast } from "@/components/ui/Toast";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setVaultMeta } = useVault();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [masterPassword, setMasterPassword] = useState("");
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    router.prefetch("/vault");
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Derive client authentication hash locally (never send raw master password)
      const authHash = await deriveClientAuthSecret(masterPassword, email);

      const payload: { email: string; authHash: string; twoFactorToken?: string } = {
        email: email.toLowerCase().trim(),
        authHash,
      };

      if (requiresTwoFactor && twoFactorToken) {
        payload.twoFactorToken = twoFactorToken.trim();
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed. Please check your credentials.");
        return;
      }

      if (data.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        showToast("Two-factor authentication code required.", "info");
        return;
      }

      if (data.user && data.vault) {
        setUser(data.user);
        setVaultMeta(data.vault);
        showToast("Signed in successfully!", "success");
        router.push("/vault");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to log in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="text-center">
          {/* <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-blue-500/25 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
          </div> */}
          <div className="w-full h-full text-center">
            <Image src={"/VaultGuardLogo_250x66.png"} alt="VaultGuard Logo" width={200} height={50} className="max-w-full h-full mx-auto site-logo" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Sign in to VaultGuard
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Zero-knowledge authentication • End-to-end client encryption
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
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
              disabled={isLoading || requiresTwoFactor}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Master Password
              </label>
              <Link
                href="/recover"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              required
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
              placeholder="Enter master password"
              disabled={isLoading || requiresTwoFactor}
            />
          </div>

          {requiresTwoFactor && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                2FA Verification Code
              </label>
              <Input
                type="text"
                autoFocus
                maxLength={6}
                required
                leftIcon={<Smartphone className="w-4 h-4" />}
                value={twoFactorToken}
                onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g, ""))}
                placeholder="6-digit code or backup code"
                disabled={isLoading}
              />
              <p className="text-[11px] text-slate-500">
                Enter code from your authenticator app (Google Authenticator, Authy)
              </p>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2"
            isLoading={isLoading}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            {requiresTwoFactor ? "Verify & Unlock" : "Sign In"}
          </Button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
          Don&apos;t have a vault yet?{" "}
          <Link href="/register" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
