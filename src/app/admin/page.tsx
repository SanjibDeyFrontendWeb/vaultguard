"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Trash2,
  Eye,
  ShieldCheck,
  Key,
  Search,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  Sparkles,
  Activity,
  Lock,
} from "lucide-react";
import { AdminUserView, AdminSystemStats } from "@/types";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { PasswordInput } from "../../components/ui/PasswordInput";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../components/ui/Toast";
import { Tooltip } from "../../components/ui/Tooltip";
import { TableRowSkeleton, MetricSkeleton } from "../../components/ui/Skeleton";
import { getRandomBytes, bytesToBase64 } from "@/lib/crypto/random";
import {
  deriveKeyEncryptionKey,
  deriveClientAuthSecret,
  PBKDF2_ITERATIONS,
} from "@/lib/crypto/key-derivation";
import {
  generateVaultEncryptionKey,
  wrapVaultKey,
} from "@/lib/crypto/vault-key";
import {
  generateEmergencyRecoveryKey,
  hashRecoveryKey,
} from "@/lib/crypto/recovery";

export default function AdminDashboardPage() {
  const { showToast } = useToast();

  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [stats, setStats] = useState<AdminSystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);

  // Modals state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserView | null>(null);

  // Add User Form State
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    pass: string;
    recoveryKey: string;
  } | null>(null);

  // Delete User Action State
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/stats"),
      ]);

      if (usersRes.ok) {
        const uData = await usersRes.json();
        setUsers(uData.users || []);
      }

      if (statsRes.ok) {
        const sData = await statsRes.json();
        setStats(sData.stats || null);
      }
    } catch (err) {
      showToast("Failed to refresh admin data.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Generate strong random password for new user
  const handleGeneratePassword = () => {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~|}{[]:;?><,.-=";
    let pwd = "";
    const randVals = new Uint8Array(18);
    crypto.getRandomValues(randVals);
    for (let i = 0; i < 18; i++) {
      pwd += chars[randVals[i] % chars.length];
    }
    setNewUserPassword(pwd);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || newUserPassword.length < 12) {
      showToast("Password must be at least 12 characters long.", "error");
      return;
    }

    setIsSubmittingUser(true);

    try {
      // 1. Generate client-side cryptographic keys for zero-knowledge vault
      const saltBytes = getRandomBytes(32);
      const vaultSaltBase64 = bytesToBase64(saltBytes);

      const kek = await deriveKeyEncryptionKey(
        newUserPassword,
        saltBytes,
        PBKDF2_ITERATIONS
      );
      const vek = await generateVaultEncryptionKey();
      const wrappedVaultKey = await wrapVaultKey(
        vek,
        kek,
        vaultSaltBase64,
        PBKDF2_ITERATIONS
      );

      const authHash = await deriveClientAuthSecret(
        newUserPassword,
        newUserEmail.toLowerCase().trim()
      );
      const recoveryKey = generateEmergencyRecoveryKey();
      const recoveryKeyHash = await hashRecoveryKey(recoveryKey);

      // 2. Submit to admin user creation endpoint
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUserName.trim(),
          email: newUserEmail.toLowerCase().trim(),
          authHash,
          vaultSalt: vaultSaltBase64,
          wrappedVaultKey,
          recoveryKeyHash,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Failed to create user.", "error");
        setIsSubmittingUser(false);
        return;
      }

      setCreatedCredentials({
        email: newUserEmail.toLowerCase().trim(),
        pass: newUserPassword,
        recoveryKey,
      });

      showToast(`User ${newUserEmail} successfully created!`, "success");
      fetchData();
    } catch (err: any) {
      showToast(err?.message || "Error generating zero-knowledge vault for user.", "error");
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Failed to delete user.", "error");
        return;
      }

      showToast(`User ${selectedUser.email} deleted successfully.`, "success");
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      fetchData();
    } catch (err: any) {
      showToast(err?.message || "Failed to delete user.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const info =
      `VAULTGUARD USER CREDENTIALS\n` +
      `Email: ${createdCredentials.email}\n` +
      `Master Password: ${createdCredentials.pass}\n` +
      `Emergency Recovery Key: ${createdCredentials.recoveryKey}\n\n` +
      `Access Portal: http://localhost:3000/login`;

    navigator.clipboard.writeText(info);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
    showToast("Credentials & Recovery Key copied to clipboard!", "success");
  };

  // Filter users by search query
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner and Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Super Admin Management Console
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
              Root Authority
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Global directory management, live cryptographic stats, and access controls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Tooltip content="Reload system statistics and user accounts" position="bottom">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              isLoading={isLoading}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              Refresh Data
            </Button>
          </Tooltip>

          <Tooltip content="Provision a new account with generated vault keys" position="bottom">
            <Button
              size="sm"
              onClick={() => {
                setNewUserName("");
                setNewUserEmail("");
                setNewUserPassword("");
                setCreatedCredentials(null);
                setIsAddUserOpen(true);
              }}
              icon={<UserPlus className="w-4 h-4" />}
              className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25"
            >
              Create New User
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <Tooltip content="Total registered user accounts in the platform" position="top" wrapperClassName="w-full">
          <div className="w-full p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Users</span>
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                {stats?.totalUsers ?? users.length}
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                {stats?.activeUsers ?? users.length} Active
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Registered platform accounts</p>
          </div>
        </Tooltip>

        {/* Encrypted Vault Items */}
        <Tooltip content="Total zero-knowledge ciphertexts stored across all vaults" position="top" wrapperClassName="w-full">
          <div className="w-full p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Encrypted Vault Items</span>
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Key className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                {stats?.totalVaultItems ?? 0}
              </span>
              <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">Zero-Knowledge</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Total AES-256-GCM ciphertexts</p>
          </div>
        </Tooltip>

        {/* 2FA Adoption Rate */}
        <Tooltip content="Percentage of active accounts with TOTP two-factor enabled" position="top" wrapperClassName="w-full">
          <div className="w-full p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">2FA Adoption</span>
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                {stats?.twoFactorAdoptionRate ?? 0}%
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">TOTP Guarded</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Accounts with two-factor enabled</p>
          </div>
        </Tooltip>

        {/* Active Devices / Sessions */}
        <Tooltip content="Live authenticated device sessions currently active" position="top" wrapperClassName="w-full">
          <div className="w-full p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">System Sessions</span>
              <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                {stats?.totalDevices ?? 0}
              </span>
              <span className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold">Active Clients</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Authenticated device sessions</p>
          </div>
        </Tooltip>
      </div>

      {/* User Directory Management Section */}
      <div className="rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>User Directory</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Showing {filteredUsers.length} of {users.length} registered accounts
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, email..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3.5">User Identity</th>
                <th className="px-6 py-3.5">Email Address</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">2FA</th>
                <th className="px-6 py-3.5">Vault Items</th>
                <th className="px-6 py-3.5">Registered</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading && users.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={7} />
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium">No users found matching query</p>
                    <p className="text-[11px] mt-0.5">Try searching with a different keyword</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Name + Initials */}
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="flex items-center gap-3 group/link"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center text-xs shadow-xs group-hover/link:scale-105 transition-transform">
                          {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-slate-100 group-hover/link:text-indigo-600 dark:group-hover/link:text-indigo-400 transition-colors block">
                            {user.name || "Unnamed User"}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 block truncate max-w-[140px]">
                            {user.id}
                          </span>
                        </div>
                      </Link>
                    </td>

                    {/* Email ID */}
                    <td className="px-6 py-4 font-mono text-slate-700 dark:text-slate-300">
                      {user.email}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          user.status === "active"
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                            : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>

                    {/* 2FA Status */}
                    <td className="px-6 py-4">
                      {user.twoFactorEnabled ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Enabled</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500 text-[11px]">
                          <span>Disabled</span>
                        </span>
                      )}
                    </td>

                    {/* Vault Items Count */}
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-slate-700 dark:text-slate-300">
                        {user.vaultItemsCount} items
                      </span>
                    </td>

                    {/* Registered Date */}
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-[11px]">
                      {new Date(user.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Tooltip content="View full user details & card operations" position="left">
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            aria-label="View Full User Details & Operations Page"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Tooltip>

                        <Tooltip content="Delete user account" position="left">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            aria-label="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Audit Log Stream */}
      {stats?.recentEvents && stats.recentEvents.length > 0 && (
        <div className="rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Real-Time Security Event Stream</span>
            </h2>
            <span className="text-xs text-slate-500">Last 25 security audit records</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-64 overflow-y-auto pr-1">
            {stats.recentEvents.map((evt) => (
              <div
                key={evt.id}
                className="py-2.5 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      evt.status === "success"
                        ? "bg-emerald-500"
                        : evt.status === "warning"
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                  />
                  <span className="font-mono text-slate-700 dark:text-slate-300">{evt.type}</span>
                  {evt.details && (
                    <span className="text-slate-500 truncate max-w-sm">
                      — {evt.details}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                  <span>{evt.ip || "127.0.0.1"}</span>
                  <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: Add New User */}
      <Modal
        isOpen={isAddUserOpen}
        onClose={() => {
          setIsAddUserOpen(false);
          setCreatedCredentials(null);
        }}
        title={createdCredentials ? "User Created Successfully" : "Create New VaultGuard User"}
        description={
          createdCredentials
            ? "Securely deliver these credentials and recovery key to the end user."
            : "Super Admin can provision new zero-knowledge vaults for team members."
        }
        maxWidth="md"
      >
        {!createdCredentials ? (
          <form onSubmit={handleCreateUser} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                User Full Name
              </label>
              <Input
                type="text"
                required
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Jane Cooper"
                disabled={isSubmittingUser}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <Input
                type="email"
                required
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="jane@company.com"
                disabled={isSubmittingUser}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Initial Master Password (min 12 chars)
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium inline-flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Generate Strong</span>
                </button>
              </div>
              <PasswordInput
                required
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                placeholder="Enter or generate a strong password"
                disabled={isSubmittingUser}
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2">
              <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <span>
                VaultGuard derives the 256-bit AES encryption key directly in the browser.
                The raw master password is never stored in plaintext on the server.
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setIsAddUserOpen(false)}
                disabled={isSubmittingUser}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white"
                isLoading={isSubmittingUser}
                icon={<UserPlus className="w-4 h-4" />}
              >
                Provision User
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Account provisioned with encrypted vault!</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs font-mono">
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Email Address:</span>
                <span className="text-slate-900 dark:text-slate-100 font-semibold">{createdCredentials.email}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Temporary Master Password:</span>
                <span className="text-indigo-600 dark:text-indigo-300 font-semibold">{createdCredentials.pass}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Emergency Recovery Key:</span>
                <span className="text-amber-700 dark:text-amber-300 font-bold select-all break-all">
                  {createdCredentials.recoveryKey}
                </span>
              </div>
            </div>

            <Button
              type="button"
              className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
              onClick={handleCopyCredentials}
              icon={copiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            >
              {copiedKey ? "Copied to Clipboard!" : "Copy User Credentials & Key"}
            </Button>

            <Button
              type="button"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
              onClick={() => {
                setIsAddUserOpen(false);
                setCreatedCredentials(null);
              }}
            >
              Done
            </Button>
          </div>
        )}
      </Modal>

      {/* MODAL 2: Delete User Confirmation */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedUser(null);
        }}
        title="Delete User Account"
        description="This action is permanent and will purge all encrypted vault records."
        maxWidth="md"
      >
        {selectedUser && (
          <div className="space-y-4 pt-2">
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span>
                You are about to permanently delete <strong>{selectedUser.email}</strong>.
                All ({selectedUser.vaultItemsCount}) encrypted passwords, vault keys, sessions, and recovery keys will be irreversibly erased.
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedUser(null);
                }}
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
        )}
      </Modal>
    </div>
  );
}
