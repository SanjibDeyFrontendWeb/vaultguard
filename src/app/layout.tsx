import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { VaultProvider } from "@/features/vault/VaultContext";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "VaultGuard — End-to-End Encrypted Password Manager",
  description:
    "Production-grade, zero-knowledge password manager with AES-256-GCM encryption, TOTP two-factor authentication, and local credential analysis.",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
    ],
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  keywords: [
    "password manager",
    "zero-knowledge",
    "end-to-end encryption",
    "AES-256-GCM",
    "security",
    "TOTP 2FA",
    "credentials",
  ],
  authors: [{ name: "VaultGuard Security Team" }],
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const savedTheme = localStorage.getItem('vaultguard_theme');
                if (savedTheme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
        <ToastProvider>
          <VaultProvider>
            <Navbar />
            <main className="flex-1 flex flex-col">{children}</main>
          </VaultProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
