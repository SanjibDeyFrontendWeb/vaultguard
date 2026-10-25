"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import {
  DecryptedVaultItem,
  StoredVaultItem,
  VaultItemType,
  VaultItemData,
  PasswordHealthCheck,
} from "@/types";
import { WrappedVaultKey } from "@/lib/crypto/types";
import { deriveKeyEncryptionKey, deriveClientAuthSecret } from "@/lib/crypto/key-derivation";
import { unwrapVaultKey } from "@/lib/crypto/vault-key";
import { encryptVaultItem } from "@/lib/crypto/encryption";
import { decryptVaultItem } from "@/lib/crypto/decryption";
import { base64ToBytes, calculatePasswordEntropy } from "@/lib/crypto/random";
import { useToast } from "@/components/ui/Toast";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  twoFactorEnabled: boolean;
  createdAt?: string;
}

interface VaultMetadata {
  encryptedVaultKey: WrappedVaultKey;
  keyVersion: number;
  encryptionVersion: number;
}

interface VaultContextValue {
  user: UserInfo | null;
  vaultMeta: VaultMetadata | null;
  isUnlocked: boolean;
  isLoading: boolean;
  items: DecryptedVaultItem[];
  rawStoredItems: StoredVaultItem[];
  autoLockMinutes: number;
  lockOnBackground: boolean;
  setAutoLockMinutes: (mins: number) => void;
  setLockOnBackground: (val: boolean) => void;
  unlockVault: (masterPassword: string) => Promise<boolean>;
  lockVault: () => void;
  refreshVault: () => Promise<void>;
  createVaultItem: (
    type: VaultItemType,
    name: string,
    data: VaultItemData,
    tags?: string[],
    isFavorite?: boolean
  ) => Promise<boolean>;
  updateVaultItem: (
    id: string,
    updates: {
      type?: VaultItemType;
      name?: string;
      data?: VaultItemData;
      tags?: string[];
      isFavorite?: boolean;
    }
  ) => Promise<boolean>;
  deleteVaultItem: (id: string) => Promise<boolean>;
  toggleFavorite: (id: string) => Promise<void>;
  copySecret: (secretText: string, label?: string) => Promise<void>;
  healthCheck: PasswordHealthCheck;
  logout: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<UserInfo | null>>;
  setVaultMeta: React.Dispatch<React.SetStateAction<VaultMetadata | null>>;
}

const VaultContext = createContext<VaultContextValue | undefined>(undefined);

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [vaultMeta, setVaultMeta] = useState<VaultMetadata | null>(null);
  const [vek, setVek] = useState<CryptoKey | null>(null);
  const [items, setItems] = useState<DecryptedVaultItem[]>([]);
  const [rawStoredItems, setRawStoredItems] = useState<StoredVaultItem[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Settings
  const [autoLockMinutes, setAutoLockMinutesState] = useState<number>(15);
  const [lockOnBackground, setLockOnBackgroundState] = useState<boolean>(false);

  const { showToast } = useToast();
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const clipboardTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTimeout = localStorage.getItem("vaultguard_autolock_minutes");
      if (savedTimeout) setAutoLockMinutesState(parseInt(savedTimeout, 10));

      const savedBackground = localStorage.getItem("vaultguard_lock_background");
      if (savedBackground) setLockOnBackgroundState(savedBackground === "true");
    }
  }, []);

  const setAutoLockMinutes = (mins: number) => {
    setAutoLockMinutesState(mins);
    if (typeof window !== "undefined") {
      localStorage.setItem("vaultguard_autolock_minutes", mins.toString());
    }
  };

  const setLockOnBackground = (val: boolean) => {
    setLockOnBackgroundState(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("vaultguard_lock_background", val ? "true" : "false");
    }
  };

  // Lock the vault: clean cryptographic keys and plaintext from state
  const lockVault = useCallback(() => {
    setVek(null);
    setItems([]);
    setIsUnlocked(false);
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    showToast("Vault locked", "info");
  }, [showToast]);

  // Inactivity tracking
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (isUnlocked && autoLockMinutes > 0) {
      inactivityTimerRef.current = setTimeout(() => {
        lockVault();
      }, autoLockMinutes * 60 * 1000);
    }
  }, [isUnlocked, autoLockMinutes, lockVault]);

  useEffect(() => {
    if (!isUnlocked) return;

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    const handleActivity = () => resetInactivityTimer();

    events.forEach((ev) => window.addEventListener(ev, handleActivity, { passive: true }));
    resetInactivityTimer();

    const handleVisibilityChange = () => {
      if (lockOnBackground && document.visibilityState === "hidden") {
        lockVault();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleActivity));
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [isUnlocked, lockOnBackground, resetInactivityTimer, lockVault]);

  // Initial session hydration
  const fetchSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
          setVaultMeta(data.vault);
        } else {
          setUser(null);
          setVaultMeta(null);
        }
      } else {
        setUser(null);
        setVaultMeta(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Fetch encrypted vault items from server
  const fetchEncryptedItems = async (): Promise<StoredVaultItem[]> => {
    try {
      const res = await fetch("/api/vault");
      if (res.ok) {
        const data = await res.json();
        setRawStoredItems(data.items || []);
        return data.items || [];
      }
    } catch (err) {
      console.error("Failed to load vault items:", err);
    }
    return [];
  };

  // Unlock vault using Master Password
  const unlockVault = async (masterPassword: string): Promise<boolean> => {
    if (!vaultMeta) {
      showToast("Vault metadata missing. Please re-login.", "error");
      return false;
    }

    try {
      const wrapped = vaultMeta.encryptedVaultKey;
      const saltBytes = base64ToBytes(wrapped.salt);

      // Derive KEK locally in client memory
      const kek = await deriveKeyEncryptionKey(masterPassword, saltBytes, wrapped.iterations);

      // Unwrap VEK
      const unwrappedVek = await unwrapVaultKey(wrapped, kek);
      setVek(unwrappedVek);

      // Fetch ciphertext items from server and decrypt locally
      const storedItems = await fetchEncryptedItems();
      const decryptedList: DecryptedVaultItem[] = [];

      for (const item of storedItems) {
        try {
          const payload = await decryptVaultItem<{ name: string; data: VaultItemData }>(
            item.encryptedPayload,
            unwrappedVek
          );
          decryptedList.push({
            id: item.id,
            type: item.type,
            name: payload.name || "Untitled Item",
            isFavorite: item.isFavorite,
            tags: item.tags || [],
            data: payload.data,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            lastUsedAt: item.lastUsedAt,
          });
        } catch (decryptErr) {
          console.error(`Item ${item.id} failed decryption:`, decryptErr);
        }
      }

      setItems(decryptedList);
      setIsUnlocked(true);
      showToast("Vault unlocked successfully", "success");
      return true;
    } catch (error) {
      showToast("Incorrect Master Password. Decryption failed.", "error");
      return false;
    }
  };

  // Re-fetch and decrypt
  const refreshVault = async () => {
    if (!vek) return;
    const storedItems = await fetchEncryptedItems();
    const decryptedList: DecryptedVaultItem[] = [];
    for (const item of storedItems) {
      try {
        const payload = await decryptVaultItem<{ name: string; data: VaultItemData }>(
          item.encryptedPayload,
          vek
        );
        decryptedList.push({
          id: item.id,
          type: item.type,
          name: payload.name || "Untitled Item",
          isFavorite: item.isFavorite,
          tags: item.tags || [],
          data: payload.data,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          lastUsedAt: item.lastUsedAt,
        });
      } catch (err) {
        console.error("Item decryption failed:", err);
      }
    }
    setItems(decryptedList);
  };

  // Create new vault item
  const createVaultItem = async (
    type: VaultItemType,
    name: string,
    data: VaultItemData,
    tags: string[] = [],
    isFavorite = false
  ): Promise<boolean> => {
    if (!vek) {
      showToast("Vault is locked.", "error");
      return false;
    }

    try {
      // Encrypt locally BEFORE sending to server
      const payloadToEncrypt = { name, data };
      const encryptedPayload = await encryptVaultItem(payloadToEncrypt, vek);

      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          isFavorite,
          tags,
          encryptedPayload,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Server error response:", res.status, errorData);
        throw new Error(errorData.error || `Server error (${res.status})`);
      }

      const resData = await res.json();
      const createdItem: DecryptedVaultItem = {
        id: resData.item.id,
        type,
        name,
        isFavorite,
        tags,
        data,
        createdAt: resData.item.createdAt,
        updatedAt: resData.item.updatedAt,
      };

      setItems((prev) => [createdItem, ...prev]);
      showToast("Item securely saved to vault", "success");
      return true;
    } catch (error: any) {
      console.error("Failed to save vault item:", error);
      showToast(error.message || "Failed to save vault item.", "error");
      return false;
    }
  };

  // Update existing vault item
  const updateVaultItem = async (
    id: string,
    updates: {
      type?: VaultItemType;
      name?: string;
      data?: VaultItemData;
      tags?: string[];
      isFavorite?: boolean;
    }
  ): Promise<boolean> => {
    if (!vek) {
      showToast("Vault is locked.", "error");
      return false;
    }

    try {
      const existing = items.find((i) => i.id === id);
      if (!existing) return false;

      const newName = updates.name !== undefined ? updates.name : existing.name;
      const newData = updates.data !== undefined ? updates.data : existing.data;
      const newType = updates.type !== undefined ? updates.type : existing.type;
      const newTags = updates.tags !== undefined ? updates.tags : existing.tags;
      const newFav = updates.isFavorite !== undefined ? updates.isFavorite : existing.isFavorite;

      // Encrypt updated contents locally
      const encryptedPayload = await encryptVaultItem({ name: newName, data: newData }, vek);

      const res = await fetch(`/api/vault/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newType,
          isFavorite: newFav,
          tags: newTags,
          encryptedPayload,
        }),
      });

      if (!res.ok) throw new Error("Failed to update");

      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                name: newName,
                data: newData,
                type: newType,
                tags: newTags,
                isFavorite: newFav,
                updatedAt: new Date().toISOString(),
              }
            : i
        )
      );

      showToast("Item updated successfully", "success");
      return true;
    } catch (error) {
      showToast("Failed to update item.", "error");
      return false;
    }
  };

  // Delete vault item
  const deleteVaultItem = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/vault/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");

      setItems((prev) => prev.filter((i) => i.id !== id));
      showToast("Item deleted", "info");
      return true;
    } catch {
      showToast("Failed to delete item.", "error");
      return false;
    }
  };

  // Toggle favorite
  const toggleFavorite = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    await updateVaultItem(id, { isFavorite: !item.isFavorite });
  };

  // Copy secret with auto-clear timeout (30 seconds)
  const copySecret = async (secretText: string, label = "Password") => {
    try {
      await navigator.clipboard.writeText(secretText);
      showToast(`${label} copied to clipboard (clears in 30s)`, "success");

      if (clipboardTimerRef.current) clearTimeout(clipboardTimerRef.current);
      clipboardTimerRef.current = setTimeout(async () => {
        try {
          const currentClip = await navigator.clipboard.readText();
          if (currentClip === secretText) {
            await navigator.clipboard.writeText("");
          }
        } catch {
          // Clipboard read may be blocked if document loses focus, write empty directly
          try {
            await navigator.clipboard.writeText("");
          } catch {}
        }
      }, 30000);
    } catch {
      showToast("Failed to copy to clipboard", "error");
    }
  };

  // Calculate Password Health locally
  const computeHealth = (): PasswordHealthCheck => {
    let weakCount = 0;
    const weakItems: Array<{ id: string; name: string; reason: string }> = [];
    const passwordMap = new Map<string, string[]>(); // password -> [itemName]
    const reusedItems: Array<{ id: string; name: string; username: string }> = [];
    const oldItems: Array<{ id: string; name: string; ageDays: number }> = [];

    const now = Date.now();
    let totalPasswords = 0;

    items.forEach((item) => {
      if (item.type === "login") {
        const d = item.data as any;
        if (d.password) {
          totalPasswords++;
          const entropy = calculatePasswordEntropy(d.password);

          // Weak check
          if (entropy.score < 3 || d.password.length < 12) {
            weakCount++;
            weakItems.push({
              id: item.id,
              name: item.name,
              reason: d.password.length < 12 ? "Less than 12 characters" : "Low entropy",
            });
          }

          // Reuse check
          const existing = passwordMap.get(d.password) || [];
          existing.push(item.name);
          passwordMap.set(d.password, existing);

          // Age check (over 90 days)
          const itemDate = new Date(item.updatedAt || item.createdAt).getTime();
          const ageDays = Math.floor((now - itemDate) / (1000 * 60 * 60 * 24));
          if (ageDays > 90) {
            oldItems.push({ id: item.id, name: item.name, ageDays });
          }
        }
      }
    });

    passwordMap.forEach((names, pwd) => {
      if (names.length > 1) {
        items.forEach((item) => {
          if (item.type === "login" && (item.data as any).password === pwd) {
            reusedItems.push({
              id: item.id,
              name: item.name,
              username: (item.data as any).username || "",
            });
          }
        });
      }
    });

    // Score calculation (0 - 100)
    let score = 100;
    if (totalPasswords === 0) {
      score = 70;
    } else {
      score -= weakCount * 15;
      score -= reusedItems.length * 10;
      score -= oldItems.length * 5;
    }

    if (!user?.twoFactorEnabled) score -= 15;
    score = Math.max(15, Math.min(100, score));

    return {
      overallScore: score,
      totalPasswords,
      weakCount,
      reusedCount: reusedItems.length,
      oldCount: oldItems.length,
      twoFactorEnabled: !!user?.twoFactorEnabled,
      recoveryKeyConfigured: true,
      weakItems,
      reusedItems,
      oldItems,
    };
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    lockVault();
    setUser(null);
    setVaultMeta(null);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  return (
    <VaultContext.Provider
      value={{
        user,
        vaultMeta,
        isUnlocked,
        isLoading,
        items,
        rawStoredItems,
        autoLockMinutes,
        lockOnBackground,
        setAutoLockMinutes,
        setLockOnBackground,
        unlockVault,
        lockVault,
        refreshVault,
        createVaultItem,
        updateVaultItem,
        deleteVaultItem,
        toggleFavorite,
        copySecret,
        healthCheck: computeHealth(),
        logout,
        setUser,
        setVaultMeta,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
}

export function useVault() {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error("useVault must be used within VaultProvider");
  return ctx;
}
