import crypto from "crypto";
import { cookies } from "next/headers";
import { UserSession } from "@/types";

const COOKIE_NAME = "vaultguard_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecretKey(): string {
  return process.env.SESSION_SECRET || "vaultguard_fallback_dev_secret_key_needs_64_chars_min_length!";
}

/**
 * Creates a cryptographically signed HMAC-SHA256 session token.
 */
export function createSessionToken(session: UserSession): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSecretKey())
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

/**
 * Verifies and decodes a signed session token.
 */
export function verifySessionToken(token: string): UserSession | null {
  try {
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return null;

    const expectedSignature = crypto
      .createHmac("sha256", getSecretKey())
      .update(payload)
      .digest("base64url");

    // Timing-safe comparison of signatures
    if (
      signature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
    ) {
      return null;
    }

    const sessionData = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as UserSession;
    if (new Date(sessionData.expiresAt).getTime() < Date.now()) {
      return null; // Expired
    }

    return sessionData;
  } catch {
    return null;
  }
}

/**
 * Sets the secure session cookie in Next.js response.
 */
export async function setSessionCookie(session: UserSession): Promise<void> {
  const token = createSessionToken(session);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

/**
 * Retrieves the current user session from the request cookie.
 */
export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);
  if (!sessionCookie?.value) return null;
  return verifySessionToken(sessionCookie.value);
}

/**
 * Revokes the session cookie.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Parses user-agent and IP from request headers for security audit logs & device management.
 */
export function parseClientContext(headers: Headers): {
  ip: string;
  userAgent: string;
  browser: string;
  os: string;
  device: string;
} {
  const forwardedFor = headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
  const userAgent = headers.get("user-agent") || "Unknown Client";

  let browser = "Web Browser";
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) browser = "Chrome";
  else if (userAgent.includes("Edg")) browser = "Edge";
  else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) browser = "Safari";
  else if (userAgent.includes("Firefox")) browser = "Firefox";

  let os = "Desktop";
  if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("Macintosh")) os = "macOS";
  else if (userAgent.includes("Linux")) os = "Linux";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) os = "iOS";

  const device = `${browser} on ${os}`;

  return { ip, userAgent, browser, os, device };
}
