"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Mail,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Key,
  Lock,
  Unlock,
  Smartphone,
  Trash2,
  Edit2,
  Check,
  X,
  Copy,
  Calendar,
  Clock,
  Laptop,
  Activity,
  AlertTriangle,
  RefreshCw,
  FolderLock,
  Layers,
  Database,
  CheckCircle2,
} from "lucide-react";
import { DeviceSession, SecurityEvent } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { Tooltip } from "@/components/ui/Tooltip";

interface UserDetailData {
  user: {
    id: string;
    name: string;
    email: string;
    status: "active" | "locked" | "suspended";
    twoFactorEnabled: boolean;
    createdAt: string;
    updatedAt: string;
  };
  vault: {
    vaultId: string;
    keyVersion: number;
    encryptionVersion: number;
    alg: string;
    iterations: number;
    createdAt: string;
    updatedAt: string;
  } | null;
  stats: {
    totalItems: number;
    itemsByType: Record<string, number>;
    activeDevicesCount: number;
  };
  devices: DeviceSession[];
  events: SecurityEvent[];
}

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const resolvedParams = use(params);
  const userId = resolvedParams.id;

  const [data, setData] = useState<UserDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(false);

  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Status Change State
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Delete User Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 2FA Reset Modal State
  const [isReset2FAModalOpen, setIsReset2FAModalOpen] = useState(false);
  const [isResetting2FA, setIsResetting2FA] = useState(false);

  // Session Revoke State
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);

  const fetchUserDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (!res.ok) {
        if (res.status === 404) {
          showToast("User not found.", "error");
          router.push("/admin");
          return;
        }
        throw new Error("Failed to load user details.");
      }
      const json = await res.json();
      setData(json);
      setEditName(json.user.name || "");
      setEditEmail(json.user.email || "");
    } catch (err: any) {
      showToast(err?.message || "Failed to load user.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [userId, showToast, router]);

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  const handleCopyId = () => {
    if (!data?.user) return;
    navigator.clipboard.writeText(data.user.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
    showToast("User ID copied to clipboard", "info");
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editEmail.trim()) {
      showToast("Name and email cannot be blank.", "error");
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, email: editEmail }),
      });

      const resJson = await res.json();
      if (!res.ok) {
        showToast(resJson.error || "Failed to update profile.", "error");
        return;
      }

      showToast("User profile updated successfully!", "success");
      setIsEditing(false);
      fetchUserDetails();
    } catch (err: any) {
      showToast(err?.message || "Update failed.", "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdateStatus = async (newStatus: "active" | "locked" | "suspended") => {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const resJson = await res.json();
        showToast(resJson.error || "Status update failed.", "error");
        return;
      }

      showToast(`User status set to ${newStatus.toUpperCase()}`, "success");
      fetchUserDetails();
    } catch (err: any) {
      showToast(err?.message || "Failed to change status.", "error");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleReset2FA = async () => {
    setIsResetting2FA(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ twoFactorEnabled: false }),
      });

      if (!res.ok) {
        showToast("Failed to reset two-factor authentication.", "error");
        return;
      }

      showToast("Two-factor authentication disabled for this user.", "success");
      setIsReset2FAModalOpen(false);
      fetchUserDetails();
    } catch (err: any) {
      showToast(err?.message || "Reset failed.", "error");
    } finally {
      setIsResetting2FA(false);
    }
  };

  const handleRevokeSession = async (sessionId?: string) => {
    if (sessionId) setRevokingSessionId(sessionId);
    try {
      const url = sessionId
        ? `/api/admin/users/${userId}/sessions?sessionId=${sessionId}`
        : `/api/admin/users/${userId}/sessions`;

      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Revocation failed");

      showToast(
        sessionId ? "Device session revoked." : "All user sessions terminated.",
        "success"
      );
      fetchUserDetails();
    } catch (err) {
      showToast("Failed to revoke session.", "error");
    } finally {
      setRevokingSessionId(null);
    }
  };

  const handleDeleteUser = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      const resJson = await res.json();
      if (!res.ok) {
        showToast(resJson.error || "Failed to delete user.", "error");
        return;
      }

      showToast("User and all vault data permanently erased.", "success");
      router.push("/admin");
    } catch (err: any) {
      showToast(err?.message || "Failed to delete user.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-150">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-24 rounded-xl" />
          <Skeleton className="h-8 w-48 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  const { user, vault, stats, devices, events } = data;

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Navigation Breadcrumb and Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <Tooltip content="Return to user directory" position="right">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to User Directory</span>
            </Link>
          </Tooltip>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-extrabold flex items-center justify-center text-sm shadow-sm">
              {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {user.name || "User Account"}
                </h1>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    user.status === "active"
                      ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                      : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20"
                  }`}
                >
                  {user.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Global User Operations Buttons */}
        <div className="flex items-center gap-2">
          <Tooltip content="Reload latest user data & events" position="bottom">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUserDetails}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              Refresh
            </Button>
          </Tooltip>

          <Tooltip content="Permanently delete user account and vault" position="bottom">
            <Button
              size="sm"
              variant="danger"
              onClick={() => setIsDeleteModalOpen(true)}
              icon={<Trash2 className="w-4 h-4" />}
            >
              Delete User
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Primary Operations Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CARD 1: Identity & Profile Details (With Edit Operation) */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Identity & Account Info</span>
            </h2>
            {!isEditing ? (
              <Tooltip content="Edit user name and email" position="left">
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              </Tooltip>
            ) : (
              <button
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            )}
          </div>

          {!isEditing ? (
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">Full Name</span>
                <span className="text-slate-900 dark:text-slate-100 font-medium text-sm">
                  {user.name || "N/A"}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">Email Address</span>
                <span className="text-slate-900 dark:text-slate-100 font-mono text-xs">
                  {user.email}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">Unique User ID</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300 truncate max-w-[200px]">
                    {user.id}
                  </span>
                  <Tooltip content={copiedId ? "Copied!" : "Copy User ID to clipboard"} position="top">
                    <button
                      onClick={handleCopyId}
                      className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      aria-label="Copy User ID"
                    >
                      {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </Tooltip>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Created</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Last Updated</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {new Date(user.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Full Name
                </label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="User Name"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white"
                  isLoading={isSavingProfile}
                >
                  Save Profile
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* CARD 2: Account Lifecycle & Status Operation */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Account Status & Access Control</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Control authentication permissions and vault accessibility
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-slate-400 text-[10px] uppercase font-semibold block mb-1">
                Current Access State
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    user.status === "active"
                      ? "bg-emerald-500"
                      : user.status === "locked"
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  }`}
                />
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">
                  {user.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                {user.status === "active"
                  ? "User can authenticate and decrypt their vault normally."
                  : user.status === "locked"
                  ? "Authentication locked. Client cannot log in until unblocked."
                  : "Account suspended by platform administrator."}
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <span className="text-slate-400 text-[10px] uppercase font-semibold block">
                Change Status:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <Tooltip content="Restore active login & vault access" position="top" wrapperClassName="w-full">
                  <button
                    type="button"
                    disabled={user.status === "active" || isUpdatingStatus}
                    onClick={() => handleUpdateStatus("active")}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      user.status === "active"
                        ? "bg-emerald-600 text-white shadow-sm pointer-events-none"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40"
                    }`}
                  >
                    Active
                  </button>
                </Tooltip>

                <Tooltip content="Temporarily lock account from logging in" position="top" wrapperClassName="w-full">
                  <button
                    type="button"
                    disabled={user.status === "locked" || isUpdatingStatus}
                    onClick={() => handleUpdateStatus("locked")}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      user.status === "locked"
                        ? "bg-amber-600 text-white shadow-sm pointer-events-none"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/40"
                    }`}
                  >
                    Lock
                  </button>
                </Tooltip>

                <Tooltip content="Suspend account access indefinitely" position="top" wrapperClassName="w-full">
                  <button
                    type="button"
                    disabled={user.status === "suspended" || isUpdatingStatus}
                    onClick={() => handleUpdateStatus("suspended")}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      user.status === "suspended"
                        ? "bg-rose-600 text-white shadow-sm pointer-events-none"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40"
                    }`}
                  >
                    Suspend
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: Two-Factor Authentication (2FA) Operation */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Two-Factor Authentication</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Multi-factor TOTP authentication status and admin overrides
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-semibold block mb-1">
                2FA Status
              </span>
              <div className="flex items-center gap-2">
                {user.twoFactorEnabled ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      Enabled (TOTP Authenticator)
                    </span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold text-slate-500">
                      Not Configured
                    </span>
                  </>
                )}
              </div>
            </div>

            {user.twoFactorEnabled ? (
              <div className="space-y-2">
                <p className="text-[11px] text-slate-500">
                  If the user lost their authenticator app and backup recovery keys, Super Admin can force-reset 2FA to restore their access.
                </p>
                <Tooltip content="Override & clear user's TOTP secret key" position="bottom" wrapperClassName="w-full">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900/60 dark:hover:bg-rose-950/40"
                    onClick={() => setIsReset2FAModalOpen(true)}
                    icon={<Unlock className="w-3.5 h-3.5" />}
                  >
                    Force Reset & Disable 2FA
                  </Button>
                </Tooltip>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500">
                User has not yet activated two-factor authentication. They can enable TOTP from their customer settings panel.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Second Row: Vault Cryptography & Device Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CARD 4: Zero-Knowledge Vault Cryptography Card */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FolderLock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Zero-Knowledge Vault</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              AES-256-GCM
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <span className="text-slate-400 text-[10px] block">Stored Ciphertexts</span>
                <span className="text-lg font-black text-slate-900 dark:text-slate-100">
                  {stats.totalItems} items
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <span className="text-slate-400 text-[10px] block">Key Version</span>
                <span className="text-lg font-black text-slate-900 dark:text-slate-100">
                  v{vault?.keyVersion || 1}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <span className="text-slate-400 text-[10px] uppercase font-semibold block">Item Type Distribution:</span>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                <div className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950">
                  <span className="text-slate-500">Logins:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{stats.itemsByType.login || 0}</span>
                </div>
                <div className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950">
                  <span className="text-slate-500">Cards:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{stats.itemsByType.card || 0}</span>
                </div>
                <div className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950">
                  <span className="text-slate-500">Secure Notes:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{stats.itemsByType.note || 0}</span>
                </div>
                <div className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950">
                  <span className="text-slate-500">API Keys:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{stats.itemsByType.apiKey || 0}</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
              Ciphertext items are encrypted solely on the client using the user's master key. Super Admin cannot decrypt or read the plaintext contents.
            </p>
          </div>
        </div>

        {/* CARD 5: Connected Devices & Session Management Operation */}
        <div className="lg:col-span-2 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Laptop className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>Connected Devices & Sessions ({devices.length})</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Inspect authenticated clients and terminate untrusted sessions
              </p>
            </div>

            {devices.length > 0 && (
              <Tooltip content="Terminate all active client sessions" position="left">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900/60 dark:hover:bg-rose-950/40"
                  onClick={() => handleRevokeSession()}
                >
                  Revoke All
                </Button>
              </Tooltip>
            )}
          </div>

          <div className="space-y-2.5">
            {devices.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                No active device sessions registered for this user.
              </div>
            ) : (
              devices.map((device) => (
                <div
                  key={device.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                      <Laptop className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                        {device.deviceName || "Desktop Client"}
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        {device.browser} • {device.os} • IP: {device.ip || "127.0.0.1"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                      {new Date(device.lastActive).toLocaleTimeString()}
                    </span>
                    <Tooltip content="Terminate this device session" position="left">
                      <button
                        onClick={() => handleRevokeSession(device.id)}
                        disabled={revokingSessionId === device.id}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        aria-label="Terminate this device session"
                      >
                        {revokingSessionId === device.id ? "Revoking..." : "Revoke"}
                      </button>
                    </Tooltip>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* CARD 6: User Security Audit Events Stream */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>User Security Audit Log Stream</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical authentication and cryptographic security records
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {events.length} recorded events
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-80 overflow-y-auto pr-1">
          {events.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs">
              No security events recorded for this account yet.
            </div>
          ) : (
            events.map((evt) => (
              <div
                key={evt.id}
                className="py-3 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      evt.status === "success"
                        ? "bg-emerald-500"
                        : evt.status === "warning"
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                  />
                  <div>
                    <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
                      {evt.type}
                    </span>
                    {evt.details && (
                      <span className="text-slate-500 ml-2">
                        — {evt.details}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
                  <span>{evt.ip || "127.0.0.1"}</span>
                  <span>{new Date(evt.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL: Delete User Confirmation */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Permanently Delete User"
        description="Irreversible operation that removes the user and all associated vault ciphertexts."
        maxWidth="md"
      >
        <div className="space-y-4 pt-2">
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <span>
              Are you sure you want to permanently delete <strong>{user.email}</strong>?
              This will completely wipe their encrypted vault, {stats.totalItems} stored items, session tokens, and security logs.
            </span>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              className="flex-1"
              onClick={handleDeleteUser}
              isLoading={isDeleting}
              icon={<Trash2 className="w-4 h-4" />}
            >
              Permanently Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Force Reset 2FA Confirmation */}
      <Modal
        isOpen={isReset2FAModalOpen}
        onClose={() => setIsReset2FAModalOpen(false)}
        title="Force Reset Two-Factor Authentication"
        description="Disable 2FA so the user can log in with only their master password."
        maxWidth="md"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            This operation will disable TOTP requirements and discard the user&apos;s current two-factor secret and backup codes. The user will be required to re-configure 2FA if desired.
          </p>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setIsReset2FAModalOpen(false)}
              disabled={isResetting2FA}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1 bg-amber-600 hover:bg-amber-500 text-white"
              onClick={handleReset2FA}
              isLoading={isResetting2FA}
            >
              Disable 2FA
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
