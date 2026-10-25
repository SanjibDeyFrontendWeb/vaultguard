"use client";

import React, { useState } from "react";
import { Lock, ShieldCheck, AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { useVault } from "@/features/vault/VaultContext";
import { useToast } from "@/components/ui/Toast";

interface UnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UnlockModal({ isOpen, onClose }: UnlockModalProps) {
  const { unlockVault } = useVault();
  const { showToast } = useToast();
  const [masterPassword, setMasterPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterPassword) {
      setError("Please enter your Master Password.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const success = await unlockVault(masterPassword);

      if (success) {
        showToast("Vault successfully unlocked", "success");
        setMasterPassword("");
        onClose();
      } else {
        setError("Invalid Master Password. Please check and try again.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to decrypt vault. Please verify your password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalClose = () => {
    if (!isLoading) {
      setMasterPassword("");
      setError(null);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title="Unlock Your Vault"
      description="Enter your Master Password to decrypt and access your credentials."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 text-xs text-blue-700 dark:text-blue-300">
          <ShieldCheck className="w-5 h-5 shrink-0 text-blue-600 dark:text-blue-400" />
          <span>
            Decryption happens purely inside your browser using client-side AES-256-GCM. Your master password is never transmitted.
          </span>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Master Password
          </label>
          <PasswordInput
            autoFocus
            required
            value={masterPassword}
            onChange={(e) => {
              setMasterPassword(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Enter your master password"
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleModalClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            icon={<Lock className="w-4 h-4" />}
          >
            Unlock Vault
          </Button>
        </div>
      </form>
    </Modal>
  );
}
