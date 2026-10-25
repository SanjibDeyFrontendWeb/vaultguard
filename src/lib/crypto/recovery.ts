import { bytesToHex, getCrypto, getRandomBytes } from "./random";

/**
 * Generates an emergency recovery key formatted into 8 groups of 4 characters.
 */
export function generateEmergencyRecoveryKey(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // Base32 without ambiguous characters
  const bytes = getRandomBytes(32);
  let key = "";
  for (let i = 0; i < 32; i++) {
    key += chars[bytes[i] % chars.length];
  }
  // Group in 8 blocks of 4 chars
  return key.match(/.{1,4}/g)?.join("-") || key;
}

/**
 * Computes a SHA-256 hash of the recovery key for server verification.
 */
export async function hashRecoveryKey(recoveryKey: string): Promise<string> {
  const cleanKey = recoveryKey.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  const crypto = getCrypto();
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(cleanKey));
  return bytesToHex(new Uint8Array(hashBuffer));
}

/**
 * Verifies if user input matches expected recovery key hash.
 */
export async function verifyRecoveryKey(
  inputKey: string,
  expectedHashHex: string
): Promise<boolean> {
  const inputHash = await hashRecoveryKey(inputKey);
  return inputHash.toLowerCase() === expectedHashHex.toLowerCase();
}
