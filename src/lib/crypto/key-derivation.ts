import { base64ToBytes, bytesToBase64, getCrypto, getRandomBytes } from "./random";

export const PBKDF2_ITERATIONS = 310000; // OWASP recommendation for PBKDF2-HMAC-SHA256
export const AUTH_PBKDF2_ITERATIONS = 100000;

/**
 * Derives the Key Encryption Key (KEK) from the user's Master Password and a unique salt.
 * The KEK is kept solely in client memory and is used to wrap/unwrap the Vault Encryption Key (VEK).
 */
export async function deriveKeyEncryptionKey(
  masterSecret: string,
  saltBytes: Uint8Array,
  iterations = PBKDF2_ITERATIONS
): Promise<CryptoKey> {
  const crypto = getCrypto();
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(masterSecret),
    "PBKDF2",
    false,
    ["deriveKey", "deriveBits"]
  );

  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes as unknown as BufferSource,
      iterations,
      hash: "SHA-256",
    },
    passwordKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
  );
}

/**
 * Derives the client-side authentication secret from the user's master password and email.
 * This ensures the raw master password NEVER travels over the network.
 */
export async function deriveClientAuthSecret(
  masterSecret: string,
  email: string
): Promise<string> {
  const crypto = getCrypto();
  const encoder = new TextEncoder();
  const salt = encoder.encode(`vaultguard:auth:${email.toLowerCase().trim()}`);

  const passwordKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(masterSecret),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: AUTH_PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    passwordKey,
    256
  );

  return bytesToBase64(new Uint8Array(derivedBits));
}

/**
 * Generates a cryptographically strong 16-byte salt for vault key derivation.
 */
export function generateSalt(): { saltBytes: Uint8Array; saltBase64: string } {
  const saltBytes = getRandomBytes(16);
  return {
    saltBytes,
    saltBase64: bytesToBase64(saltBytes),
  };
}
