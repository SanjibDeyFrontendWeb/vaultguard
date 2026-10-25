import { base64ToBytes, bytesToBase64, getCrypto, getRandomBytes } from "./random";
import { WrappedVaultKey } from "./types";
import { PBKDF2_ITERATIONS } from "./key-derivation";

/**
 * Generates a brand-new random 256-bit Vault Encryption Key (VEK).
 * This symmetric key is used to encrypt all items inside the vault.
 */
export async function generateVaultEncryptionKey(): Promise<CryptoKey> {
  const crypto = getCrypto();
  return await crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true, // extractable so it can be wrapped and unwrapped
    ["encrypt", "decrypt"]
  );
}

/**
 * Wraps the Vault Encryption Key (VEK) using the derived Key Encryption Key (KEK).
 */
export async function wrapVaultKey(
  vek: CryptoKey,
  kek: CryptoKey,
  saltBase64: string,
  iterations = PBKDF2_ITERATIONS
): Promise<WrappedVaultKey> {
  const crypto = getCrypto();
  const iv = getRandomBytes(12);

  const rawVek = await crypto.subtle.exportKey("raw", vek);

  const encryptedVekBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv as unknown as BufferSource,
      tagLength: 128,
    },
    kek,
    rawVek as unknown as BufferSource
  );

  return {
    ciphertext: bytesToBase64(new Uint8Array(encryptedVekBuffer)),
    iv: bytesToBase64(iv),
    salt: saltBase64,
    iterations,
    version: 1,
    alg: "AES-256-GCM",
  };
}

/**
 * Unwraps the Vault Encryption Key (VEK) using the Key Encryption Key (KEK).
 */
export async function unwrapVaultKey(
  wrapped: WrappedVaultKey,
  kek: CryptoKey
): Promise<CryptoKey> {
  const crypto = getCrypto();
  const iv = base64ToBytes(wrapped.iv);
  const ciphertext = base64ToBytes(wrapped.ciphertext);

  try {
    const rawVekBuffer = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv as unknown as BufferSource,
        tagLength: 128,
      },
      kek,
      ciphertext as unknown as BufferSource
    );

    return await crypto.subtle.importKey(
      "raw",
      rawVekBuffer,
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
    );
  } catch (error) {
    const err = new Error("Failed to unwrap vault key. Invalid master password or corrupted key data.");
    (err as any).code = "INVALID_KEY";
    throw err;
  }
}
