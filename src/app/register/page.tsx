"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Copy,
  AlertTriangle,
  Download,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { Button } from "@/components/ui/Button";
import { deriveKeyEncryptionKey, deriveClientAuthSecret, PBKDF2_ITERATIONS } from "@/lib/crypto/key-derivation";
import { generateVaultEncryptionKey, wrapVaultKey } from "@/lib/crypto/vault-key";
import { getRandomBytes, bytesToBase64 } from "@/lib/crypto/random";
import { generateEmergencyRecoveryKey, hashRecoveryKey } from "@/lib/crypto/recovery";
import { useVault } from "@/features/vault/VaultContext";
import { useToast } from "@/components/ui/Toast";
import Image from "next/image";

export default function RegisterPage() {
  const router = useRouter();
  const { setUser, setVaultMeta } = useVault();
  const { showToast } = useToast();

  const [step, setStep] = useState<"form" | "recovery">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [masterPassword, setMasterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recoveryKey, setRecoveryKey] = useState("");
  const [hasSavedRecoveryKey, setHasSavedRecoveryKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (masterPassword !== confirmPassword) {
      setError("Master passwords do not match.");
      return;
    }

    if (masterPassword.length < 12) {
      setError("Master password must be at least 12 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Generate unique 32-byte salt for this user's vault
      const saltBytes = getRandomBytes(32);
      const vaultSaltBase64 = bytesToBase64(saltBytes);

      // 2. Derive KEK (Key Encryption Key) locally from master password
      const kek = await deriveKeyEncryptionKey(masterPassword, saltBytes, PBKDF2_ITERATIONS);

      // 3. Generate brand-new 256-bit symmetric Vault Encryption Key (VEK)
      const vek = await generateVaultEncryptionKey();

      // 4. Wrap VEK with KEK
      const wrappedVaultKey = await wrapVaultKey(vek, kek, vaultSaltBase64, PBKDF2_ITERATIONS);

      // 5. Derive client authentication secret (never sends master password!)
      const authHash = await deriveClientAuthSecret(masterPassword, email);

      // 6. Generate emergency recovery key and hash
      const genRecoveryKey = generateEmergencyRecoveryKey();
      const recoveryKeyHash = await hashRecoveryKey(genRecoveryKey);

      // 7. Send registration payload to server
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          authHash,
          vaultSalt: vaultSaltBase64,
          wrappedVaultKey,
          recoveryKeyHash,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create account. Please try again.");
        return;
      }

      setRecoveryKey(genRecoveryKey);
      setStep("recovery");
      showToast("Account created! Please save your recovery key.", "success");
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during encryption setup.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadRecoveryKey = () => {
    const content = `VAULTGUARD EMERGENCY RECOVERY KEY\n` +
      `Email: ${email}\n` +
      `Key: ${recoveryKey}\n\n` +
      `Keep this key completely private and safe. If you ever forget your master password,\n` +
      `this key is the ONLY cryptographic backdoor to reset your account.`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vaultguard-recovery-key-${email.replace(/[^a-zA-Z0-9]/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setHasSavedRecoveryKey(true);
    showToast("Recovery key downloaded", "success");
  };

  const handleCopyRecoveryKey = () => {
    navigator.clipboard.writeText(recoveryKey);
    setHasSavedRecoveryKey(true);
    showToast("Recovery key copied to clipboard", "success");
  };

  const handleCompleteRegistration = () => {
    router.push("/vault");
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="text-center">
          {/* <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-blue-500/25 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-400" />

            </div>
          </div> */}
          <div className="w-full h-full text-center">
            <Image src={"/VaultGuardLogo_250x66.png"} alt="VaultGuard Logo" width={200} height={50} className="max-w-full h-full mx-auto" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {step === "form" ? "Create Your Encrypted Vault" : "Emergency Recovery Key"}
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {step === "form"
              ? "Zero-knowledge encryption keys generated right in your browser"
              : "Store this in a secure location. It cannot be recovered if lost."}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        {step === "form" ? (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Full Name
              </label>
              <Input
                type="text"
                required
                leftIcon={<User className="w-4 h-4" />}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
                disabled={isLoading}
              />
            </div>

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
                placeholder="alex@example.com"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Master Password (min 12 chars)
              </label>
              <PasswordInput
                required
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                placeholder="Choose a strong master password"
                disabled={isLoading}
              />
              <PasswordStrength password={masterPassword} />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Confirm Master Password
              </label>
              <PasswordInput
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your master password"
                disabled={isLoading}
              />
            </div>

            <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                VaultGuard has no knowledge of your master password. If you lose both your master password and your emergency recovery key, your data cannot be retrieved.
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              isLoading={isLoading}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Generate Vault & Register
            </Button>

            <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                Sign in
              </Link>
            </div>
          </form>
        ) : (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-center text-sm font-semibold tracking-wider text-slate-900 dark:text-slate-100 break-all select-all">
              {recoveryKey}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                icon={<Copy className="w-4 h-4" />}
                onClick={handleCopyRecoveryKey}
              >
                Copy Key
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                icon={<Download className="w-4 h-4" />}
                onClick={handleDownloadRecoveryKey}
              >
                Download (.txt)
              </Button>
            </div>

            <label className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={hasSavedRecoveryKey}
                onChange={(e) => setHasSavedRecoveryKey(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                I have securely saved this recovery key and understand it is required if I forget my master password.
              </span>
            </label>

            <Button
              type="button"
              variant="primary"
              className="w-full"
              disabled={!hasSavedRecoveryKey}
              onClick={handleCompleteRegistration}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              Go to Vault
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
