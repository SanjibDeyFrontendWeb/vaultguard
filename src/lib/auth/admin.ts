import crypto from "crypto";
import { cookies } from "next/headers";
import { AdminSession } from "@/types";

const ADMIN_COOKIE_NAME = "vaultguard_admin_session";
const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

export function getSuperAdminCredentials(): { email: string; pass: string } {
  return {
    email: (process.env.SUPER_ADMIN_EMAIL || "admin@vaultguard.com").toLowerCase().trim(),
    pass: process.env.SUPER_ADMIN_PASSWORD || "VaultGuardAdmin2026!",
  };
}

function getSecretKey(): string {
  return process.env.SESSION_SECRET || "vaultguard_fallback_dev_secret_key_needs_64_chars_min_length!";
}

/**
 * Creates a cryptographically signed HMAC-SHA256 admin session token.
 */
export function createAdminSessionToken(session: AdminSession): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSecretKey())
    .update(`admin:${payload}`)
    .digest("base64url");
  return `${payload}.${signature}`;
}

/**
 * Verifies and decodes a signed admin session token.
 */
export function verifyAdminSessionToken(token: string): AdminSession | null {
  try {
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return null;

    const expectedSignature = crypto
      .createHmac("sha256", getSecretKey())
      .update(`admin:${payload}`)
      .digest("base64url");

    if (
      signature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
    ) {
      return null;
    }

    const sessionData = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AdminSession;
    if (new Date(sessionData.expiresAt).getTime() < Date.now()) {
      return null;
    }

    if (sessionData.role !== "superadmin") {
      return null;
    }

    return sessionData;
  } catch {
    return null;
  }
}

/**
 * Sets the secure admin session cookie.
 */
export async function setAdminSessionCookie(session: AdminSession): Promise<void> {
  const token = createAdminSessionToken(session);
  const cookieStore = await cookies();
  const isHttps = Boolean(process.env.NETLIFY || process.env.VERCEL) || Boolean(process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://"));
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isHttps,
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  });
}

/**
 * Retrieves the current admin session from cookie.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME);
  if (!sessionCookie?.value) return null;
  return verifyAdminSessionToken(sessionCookie.value);
}

/**
 * Clears the admin session cookie.
 */
export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}
