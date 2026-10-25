"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Shield,
  ShieldCheck,
  Lock,
  Key,
  KeyRound,
  Database,
  Smartphone,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Server,
  Zap,
  RefreshCw,
  Copy,
  CreditCard,
  Code2,
  Wifi,
  UserCheck,
  FileText,
  FolderLock,
  Fingerprint,
  QrCode,
  ShieldAlert,
  Sliders,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { generateStrongPassword, calculatePasswordEntropy } from "@/lib/crypto/random";
import { useToast } from "@/components/ui/Toast";
import { useVault } from "@/features/vault/VaultContext";

export default function LandingPage() {
  const { user } = useVault();
  const { showToast } = useToast();
  const [demoPassword, setDemoPassword] = useState("V4ultGu@rd#2026-Secured!");
  const [demoLength, setDemoLength] = useState(20);
  const [demoCopied, setDemoCopied] = useState(false);

  const entropy = calculatePasswordEntropy(demoPassword);

  const handleRegenerateDemo = (len = demoLength) => {
    const pwd = generateStrongPassword({
      length: len,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
      excludeAmbiguous: true,
    });
    setDemoPassword(pwd);
    setDemoCopied(false);
  };

  const handleCopyDemo = () => {
    navigator.clipboard.writeText(demoPassword);
    setDemoCopied(true);
    showToast("Password copied to clipboard (clears in 30s)", "success");
    setTimeout(() => setDemoCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col font-sans">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-14 pb-20 md:pt-20 md:pb-28 border-b border-slate-200/80 dark:border-slate-800/80">
        {/* Glow backdrop effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-blue-600/15 via-cyan-500/15 to-indigo-600/10 blur-[120px] pointer-events-none rounded-full" />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          {/* Trust Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 text-xs font-semibold mb-6 shadow-xs backdrop-blur-sm animate-in fade-in slide-in-from-top-3">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Zero-Knowledge • AES-256-GCM + PBKDF2 (310,000 Iterations)</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 max-w-4xl mx-auto leading-[1.12] font-heading">
            Total privacy for your credentials.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-500">
              Encrypted before it leaves your browser.
            </span>
          </h1>

          {/* Subtext */}
          <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            VaultGuard stores logins, API keys, payment cards, and sensitive notes using pure client-side Web Crypto. Even if our database is breached, your secrets remain mathematically impossible to read.
          </p>

          {/* Action Buttons with Proper Icons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            {user ? (
              <Link href="/vault">
                <Button
                  size="lg"
                  icon={<ArrowRight className="w-4 h-4" />}
                  className="w-full sm:w-auto shadow-lg shadow-blue-500/25"
                >
                  Go to Vault Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/register">
                  <Button
                    size="lg"
                    icon={<ArrowRight className="w-4 h-4" />}
                    className="w-full sm:w-auto shadow-lg shadow-blue-500/25"
                  >
                    Create Your Free Vault
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    icon={<Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                    className="w-full sm:w-auto"
                  >
                    Unlock Existing Vault
                  </Button>
                </Link>
              </>
            )}
            <a href="#generator-section">
              <Button
                size="lg"
                variant="ghost"
                icon={<Sparkles className="w-4 h-4 text-amber-500" />}
                className="w-full sm:w-auto text-slate-600 dark:text-slate-300"
              >
                Try Generator
              </Button>
            </a>
          </div>

          {/* Real Showcase Hero Image */}
          <div className="mt-14 relative max-w-5xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-2xl bg-slate-900 group">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 opacity-40 pointer-events-none" />
              
              <Image
                src="/images/vault_hero.jpg"
                alt="VaultGuard 3D Cyber Security Shield and Vault Interface"
                width={1920}
                height={1080}
                priority
                className="w-full h-auto object-cover transform hover:scale-[1.01] transition-transform duration-700"
              />

              {/* Floating feature pills on the image */}
              <div className="absolute top-4 left-4 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-white text-xs font-semibold shadow-xl">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Web Crypto AES-256-GCM Active</span>
              </div>

              <div className="absolute bottom-4 right-4 z-20 hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-white text-xs font-semibold shadow-xl">
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                <span>Client-Side VEK Hardware Derivation</span>
              </div>
            </div>

            {/* Glowing ring under image */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl blur-2xl opacity-20 -z-10" />
          </div>

          {/* Trust Specs Grid */}
          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left pt-8 border-t border-slate-200/80 dark:border-slate-800/80">
            <div className="p-3.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Encryption</p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
                AES-256-GCM
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Key Derivation</p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
                PBKDF2 310k Iterations
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Two-Factor</p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
                RFC 6238 TOTP
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Server Plaintext</p>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                0% (Mathematically Zero)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Cryptographic Demonstration Engine */}
      <section id="generator-section" className="py-20 bg-slate-100/50 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <Badge variant="blue">LIVE CRYPTO ENGINE</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-slate-100 mt-2 font-heading">
              High-Entropy Password Engine
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-lg mx-auto">
              Sample cryptographically secure generation executed locally using the native browser Web Crypto API.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            {/* Generated Output Display */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="font-mono text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 break-all select-all">
                {demoPassword}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  icon={<RefreshCw className="w-3.5 h-3.5" />}
                  onClick={() => handleRegenerateDemo(demoLength)}
                >
                  Regenerate
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  icon={demoCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  onClick={handleCopyDemo}
                >
                  {demoCopied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            {/* Length Slider Controls */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-500" />
                  Length: {demoLength} characters
                </span>
                <span className="font-mono text-blue-600 dark:text-blue-400">
                  {entropy.entropy} bits entropy
                </span>
              </div>
              <input
                type="range"
                min="12"
                max="40"
                value={demoLength}
                onChange={(e) => {
                  const len = parseInt(e.target.value, 10);
                  setDemoLength(len);
                  handleRegenerateDemo(len);
                }}
                className="w-full accent-blue-600 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Security Assessment Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                <span className="text-slate-400 block font-medium">NIST Entropy</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-sm mt-0.5 block">
                  {entropy.entropy} bits
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                <span className="text-slate-400 block font-medium">Brute Force Resistance</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5 block">
                  Trillions of centuries
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                <span className="text-slate-400 block font-medium">Strength Rating</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 text-sm mt-0.5 block">
                  {entropy.level} Protection
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Zero-Knowledge Architecture Trust Diagram Section */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <Badge variant="purple">CRYPTOGRAPHIC TRUST BOUNDARY</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 mt-2 font-heading">
            How VaultGuard Protects You
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xl mx-auto">
            Traditional cloud password managers encrypt on their servers. VaultGuard encrypts strictly on your device before any byte touches the network.
          </p>
        </div>

        {/* Real Architectural Trust Diagram Image */}
        <div className="mb-14 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl bg-slate-900">
          <Image
            src="/images/trust_diagram.jpg"
            alt="VaultGuard Zero-Knowledge Client-Side Encryption Trust Boundary"
            width={1920}
            height={1080}
            className="w-full h-auto object-cover"
          />
        </div>

        {/* Trust Boundary Pillar Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Card 1: Client Device */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-blue-500/30 dark:border-blue-500/30 shadow-lg space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Step 1 • Trusted Client
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1 font-heading">
                Browser Device Context
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Your Master Password derives the KEK locally via PBKDF2 (310k rounds). All passwords, cards, and notes are encrypted using AES-256-GCM. Plaintext never leaves this device.
            </p>
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Plaintext decrypted in RAM only
            </div>
          </div>

          {/* Card 2: Transit Layer */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Step 2 • TLS 1.3 Transport
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1 font-heading">
                Next.js API Gateway
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Enforces Zod schema validation, HttpOnly SameSite cookie sessions, rate limiting, and CSRF defense. The server receives ONLY opaque ciphertext payloads.
            </p>
            <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-2">
              <EyeOff className="w-4 h-4 shrink-0" />
              Zero server plaintext visibility
            </div>
          </div>

          {/* Card 3: Storage */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Step 3 • Persistence
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1 font-heading">
                Encrypted Storage Vault
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Stores encrypted payloads, unique 12-byte IVs, and salts. Even a catastrophic server or database breach reveals only mathematical noise to an attacker.
            </p>
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0" />
              Ciphertext & Metadata only
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section with Proper Icons */}
      <section className="py-20 bg-slate-100/50 dark:bg-slate-950/60 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <Badge variant="blue">FEATURE CAPABILITIES</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-slate-100 mt-2 font-heading">
              Built for Security-Conscious Individuals & Teams
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xl mx-auto">
              Everything required to safeguard credentials, tokens, payment cards, and digital identities.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 hover:border-blue-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-slate-900 dark:text-slate-100 font-heading">
                7 Distinct Vault Item Types
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Logins, Secure Notes, Credit Cards, API Keys, Wi-Fi Networks, Identities, and Custom Secrets.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 hover:border-blue-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-slate-900 dark:text-slate-100 font-heading">
                Local Security Health Audit
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Scans your vault strictly in client memory for weak, reused, or aging passwords without leaking a single character.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 hover:border-blue-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <QrCode className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-slate-900 dark:text-slate-100 font-heading">
                RFC 6238 TOTP Two-Factor
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Hardware & app authenticator compatibility with QR code enrollment and printable single-use backup recovery codes.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 hover:border-blue-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-slate-900 dark:text-slate-100 font-heading">
                Configurable Auto-Lock
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Timed inactivity triggers (5-30 min) and lock-on-blur instantly scrub cryptographic keys from client RAM.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 hover:border-blue-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <Fingerprint className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-slate-900 dark:text-slate-100 font-heading">
                32-Char Emergency Recovery
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Generate and store an offline emergency key. Reset your master password safely without zero-knowledge account lockouts.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 hover:border-blue-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Server className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-slate-900 dark:text-slate-100 font-heading">
                Active Session Management
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Monitor connected devices, terminate unauthorized sessions remotely, and inspect security audit events.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <Badge variant="blue">SECURITY COMPARISON</Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-slate-100 mt-2 font-heading">
            How VaultGuard Compares
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            See the difference between zero-knowledge encryption and legacy password managers.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4">Feature</th>
                <th className="p-4 text-blue-600 dark:text-blue-400 font-bold">VaultGuard</th>
                <th className="p-4 text-slate-400">Legacy Cloud Managers</th>
                <th className="p-4 text-slate-400">Browser Built-In</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
              <tr>
                <td className="p-4 font-semibold">Zero-Knowledge Architecture</td>
                <td className="p-4 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-500" /> Yes (100% Client-Side)
                </td>
                <td className="p-4 text-slate-500">Partial / Server Decrypted</td>
                <td className="p-4 text-rose-500">No</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold">Encryption Standard</td>
                <td className="p-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                  AES-256-GCM + PBKDF2
                </td>
                <td className="p-4 font-mono text-slate-500">Varies (Often CBC)</td>
                <td className="p-4 font-mono text-slate-500">OS Keychain</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold">Local Password Health Audit</td>
                <td className="p-4 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-500" /> In-Memory Client Only
                </td>
                <td className="p-4 text-slate-500">Requires Server Sync</td>
                <td className="p-4 text-slate-500">Basic</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold">Offline Emergency Recovery Key</td>
                <td className="p-4 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-500" /> 32-Char Base32 Key
                </td>
                <td className="p-4 text-slate-500">Email Verification Only</td>
                <td className="p-4 text-rose-500">No</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold">Clipboard Auto-Clear Timer</td>
                <td className="p-4 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-500" /> 30 Seconds Auto-Destruct
                </td>
                <td className="p-4 text-slate-500">Optional / Manual</td>
                <td className="p-4 text-rose-500">No</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Final Call to Action Banner (Hidden once user is logged in) */}
      {!user && (
        <section className="py-20 border-t border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-slate-100 font-heading">
              Ready to Take Back Your Digital Sovereignty?
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
              Create an end-to-end encrypted vault in seconds. Zero tracking, zero telemetry, zero master password storage.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <Link href="/register">
                <Button
                  size="lg"
                  icon={<ArrowRight className="w-4 h-4" />}
                  className="w-full sm:w-auto shadow-lg shadow-blue-500/25"
                >
                  Create Free Account Now
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  icon={<Lock className="w-4 h-4 text-blue-500" />}
                  className="w-full sm:w-auto"
                >
                  Sign In to Vault
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="mt-auto py-10 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/VaultGuardLogo_250x66.png"
              alt="VaultGuard"
              width={160}
              height={42}
              className="h-8 w-auto object-contain dark:brightness-110"
            />
          </div>
          <div className="flex items-center gap-5">
            {user ? (
              <Link href="/vault" className="hover:text-blue-500 transition-colors font-medium">
                My Vault Dashboard
              </Link>
            ) : (
              <>
                <Link href="/register" className="hover:text-blue-500 transition-colors font-medium">
                  Create Vault
                </Link>
                <Link href="/login" className="hover:text-blue-500 transition-colors font-medium">
                  Sign In
                </Link>
              </>
            )}
            <Link href="/recover" className="hover:text-blue-500 transition-colors font-medium">
              Emergency Recovery
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
