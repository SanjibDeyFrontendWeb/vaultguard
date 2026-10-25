import { base64ToBytes, getCrypto } from "./random";
import { EncryptedData } from "./types";

/**
 * Decrypts an AES-256-GCM encrypted payload using the client's Vault Encryption Key (VEK).
 * Throws a typed error if the authentication tag fails or ciphertext is tampered.
 */
export async function decryptVaultItem<T = unknown>(
  encrypted: EncryptedData,
  vek: CryptoKey
): Promise<T> {
  if (encrypted.version !== 1) {
    throw new Error(`Unsupported encryption version: ${encrypted.version}`);
  }

  const crypto = getCrypto();
  const iv = base64ToBytes(encrypted.iv);
  const ciphertext = base64ToBytes(encrypted.ciphertext);

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv as unknown as BufferSource,
        tagLength: 128,
      },
      vek,
      ciphertext as unknown as BufferSource
    );

    const decoder = new TextDecoder();
    const jsonString = decoder.decode(decryptedBuffer);
    return JSON.parse(jsonString) as T;
  } catch (error) {
    const err = new Error("Decryption failed. Authentication tag mismatch or corrupted ciphertext.");
    (err as any).code = "DECRYPTION_FAILED";
    throw err;
  }
}
