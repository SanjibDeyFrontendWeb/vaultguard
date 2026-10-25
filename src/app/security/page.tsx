"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Key,
  AlertTriangle,
  Clock,
  History,
  Laptop,
  Trash2,
  Lock,
} from "lucide-react";
import { useVault } from "@/features/vault/VaultContext";
import { SecurityScoreGauge } from "@/components/ui/SecurityScoreGauge";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TwoFactorSetupModal } from "@/features/security/TwoFactorSetupModal";
import { SecurityEvent, DeviceSession } from "@/types";
import { useToast } from "@/components/ui/Toast";
import { Tooltip } from "@/components/ui/Tooltip";
import SecurityLoading from "@/app/security/loading";

export default function SecurityPage() {
  const { user, isUnlocked, healthCheck, refreshVault, isLoading } = useVault();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"health" | "devices" | "activity">("health");
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [devices, setDevices] = useState<DeviceSession[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  // Load devices
  const loadDevices = async () => {
    setIsLoadingDevices(true);
    try {
      const res = await fetch("/api/sessions");
      if (res.ok) {
        const data = await res.json();
        setDevices(data.devices || []);
      }
    } catch {}
    setIsLoadingDevices(false);
  };

  // Load security activity log
  const loadEvents = async () => {
    setIsLoadingEvents(true);
    try {
      const res = await fetch("/api/security/activity");
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch {}
    setIsLoadingEvents(false);
  };

  useEffect(() => {
    if (user) {
      loadDevices();
      loadEvents();
    }
  }, [user]);

  const handleRevokeDevice = async (sessionId: string) => {
    try {
      const res = await fetch("/api/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) {
        showToast("Device session terminated", "info");
        loadDevices();
      }
    } catch {
      showToast("Failed to revoke session", "error");
    }
  };

  const handleRevokeAllOther = async () => {
    try {
      const res = await fetch("/api/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revokeAllOther: true }),
      });
      if (res.ok) {
        showToast("Signed out of all other devices", "success");
        loadDevices();
      }
    } catch {
      showToast("Failed to sign out other devices", "error");
    }
  };

  if (isLoading) {
    return <SecurityLoading />;
  }

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold">Please sign in to view Security Center</h2>
        <a href="/login" className="mt-4">
          <Button>Sign In</Button>
        </a>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
          <Shield className="w-7 h-7 text-blue-500" />
          <span>Security Center & Password Health</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Zero-knowledge audit evaluated in client memory. No plaintext passwords or credentials
          are sent over the network.
        </p>
      </div>

      {/* Security Score Banner */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <SecurityScoreGauge score={healthCheck.overallScore} />

        <div className="flex flex-wrap items-center gap-2.5">
          {!user.twoFactorEnabled ? (
            <Tooltip content="Add authenticator app protection to boost security score" position="left">
              <Button
                size="sm"
                variant="primary"
                icon={<Smartphone className="w-4 h-4" />}
                onClick={() => setShow2FAModal(true)}
              >
                Enable 2FA (+15 Score)
              </Button>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
              2FA Active
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("health")}
          className={`pb-3 transition-colors relative ${
            activeTab === "health"
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          Password Health ({healthCheck.weakCount + healthCheck.reusedCount + healthCheck.oldCount})
        </button>
        <button
          onClick={() => setActiveTab("devices")}
          className={`pb-3 transition-colors relative ${
            activeTab === "devices"
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          Active Sessions ({devices.length})
        </button>
        <button
          onClick={() => setActiveTab("activity")}
          className={`pb-3 transition-colors relative ${
            activeTab === "activity"
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          Security Audit Log
        </button>
      </div>

      {/* Tab 1: Password Health */}
      {activeTab === "health" && (
        <div className="space-y-6">
          {!isUnlocked ? (
            <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <Lock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                Unlock Vault to Analyze Health
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Because VaultGuard cannot see your plaintext data on the server, password health
                must be audited in your browser after unlocking.
              </p>
              <a href="/vault">
                <Button size="sm">Go to Vault & Unlock</Button>
              </a>
            </div>
          ) : (
            <>
              {/* Quick Health Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                  <span className="text-xs font-medium text-slate-500">Weak Passwords</span>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-rose-500">
                      {healthCheck.weakCount}
                    </span>
                    <Badge variant={healthCheck.weakCount === 0 ? "emerald" : "rose"}>
                      {healthCheck.weakCount === 0 ? "PASSED" : "VULNERABLE"}
                    </Badge>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                  <span className="text-xs font-medium text-slate-500">Reused Passwords</span>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-amber-500">
                      {healthCheck.reusedCount}
                    </span>
                    <Badge variant={healthCheck.reusedCount === 0 ? "emerald" : "amber"}>
                      {healthCheck.reusedCount === 0 ? "PASSED" : "SHARED"}
                    </Badge>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                  <span className="text-xs font-medium text-slate-500">Old Passwords (&gt;90d)</span>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-blue-500">
                      {healthCheck.oldCount}
                    </span>
                    <Badge variant={healthCheck.oldCount === 0 ? "emerald" : "blue"}>
                      {healthCheck.oldCount === 0 ? "FRESH" : "NEEDS ROTATION"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Weak Passwords List */}
              {healthCheck.weakItems.length > 0 && (
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-950/60 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Weak or Short Passwords</span>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {healthCheck.weakItems.map((item) => (
                      <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {item.name}
                          </span>
                          <span className="text-slate-400 ml-2">({item.reason})</span>
                        </div>
                        <a href="/vault">
                          <Button size="sm" variant="outline">
                            Update
                          </Button>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reused Passwords List */}
              {healthCheck.reusedItems.length > 0 && (
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-950/60 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Reused Passwords Across Accounts</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    If one site is compromised, credential stuffing attackers will gain access to
                    these other accounts.
                  </p>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {healthCheck.reusedItems.map((item, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {item.name}
                          </span>
                          <span className="text-slate-400 ml-2 font-mono">
                            {item.username}
                          </span>
                        </div>
                        <a href="/vault">
                          <Button size="sm" variant="outline">
                            Change
                          </Button>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Old Passwords List */}
              {healthCheck.oldItems.length > 0 && (
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
                    <Clock className="w-4 h-4" />
                    <span>Passwords Older Than 90 Days</span>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {healthCheck.oldItems.map((item) => (
                      <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {item.name}
                          </span>
                          <span className="text-slate-400 ml-2">({item.ageDays} days old)</span>
                        </div>
                        <a href="/vault">
                          <Button size="sm" variant="outline">
                            Rotate
                          </Button>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {healthCheck.weakCount === 0 &&
                healthCheck.reusedCount === 0 &&
                healthCheck.oldCount === 0 && (
                  <div className="p-8 text-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
                    <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      Zero Vulnerabilities Detected
                    </h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      All your vault credentials satisfy strict entropy thresholds and are uniquely
                      generated.
                    </p>
                  </div>
                )}
            </>
          )}
        </div>
      )}

      {/* Tab 2: Active Connected Devices / Sessions */}
      {activeTab === "devices" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Manage and revoke active sessions connected to your account.
            </p>
            {devices.length > 1 && (
              <Tooltip content="Sign out of all other active browser and client sessions" position="left">
                <Button
                  size="sm"
                  variant="danger"
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                  onClick={handleRevokeAllOther}
                >
                  Sign Out All Other Devices
                </Button>
              </Tooltip>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            {devices.map((device) => (
              <div
                key={device.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                        {device.deviceName}
                      </span>
                      {device.current && <Badge variant="emerald">CURRENT DEVICE</Badge>}
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      IP: {device.ip} • Last active {new Date(device.lastActive).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {!device.current && (
                  <Tooltip content="Terminate this session" position="left">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      onClick={() => handleRevokeDevice(device.id)}
                    >
                      Revoke
                    </Button>
                  </Tooltip>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Security Audit Log */}
      {activeTab === "activity" && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <History className="w-4 h-4 text-blue-500" />
              Audit Trail (Zero Plaintext Logged)
            </h3>
            <span className="text-xs text-slate-400">{events.length} recorded events</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {events.map((event) => (
              <div key={event.id} className="py-3 flex items-start justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                      {event.type.replace(/_/g, " ").toUpperCase()}
                    </span>
                    <Badge
                      variant={
                        event.status === "success"
                          ? "emerald"
                          : event.status === "warning"
                          ? "amber"
                          : "rose"
                      }
                    >
                      {event.status.toUpperCase()}
                    </Badge>
                  </div>
                  {event.details && (
                    <p className="text-slate-500 dark:text-slate-400">{event.details}</p>
                  )}
                  <p className="text-[11px] text-slate-400 font-mono">
                    IP: {event.ip || "127.0.0.1"} • {event.userAgent || "Client"}
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 whitespace-nowrap ml-4">
                  {new Date(event.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2FA Modal */}
      <TwoFactorSetupModal
        isOpen={show2FAModal}
        onClose={() => setShow2FAModal(false)}
        onSuccess={() => {
          showToast("Two-factor authentication is now active", "success");
        }}
      />
    </div>
  );
}
