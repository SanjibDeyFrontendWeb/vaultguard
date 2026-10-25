import { base64ToBytes, bytesToBase64, getCrypto, getRandomBytes } from "./random";
import { EncryptedData } from "./types";

/**
 * Encrypts an arbitrary object/string with the client's Vault Encryption Key (VEK) using AES-256-GCM.
 * Generates a fresh unique 96-bit (12-byte) initialization vector for every item.
 */
export async function encryptVaultItem(
  payload: unknown,
  vek: CryptoKey
): Promise<EncryptedData> {
  const crypto = getCrypto();
  const encoder = new TextEncoder();
  const jsonString = JSON.stringify(payload);
  const dataBytes = encoder.encode(jsonString);

  // 12-byte IV recommended for AES-GCM
  const iv = getRandomBytes(12);

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv as unknown as BufferSource,
      tagLength: 128,
    },
    vek,
    dataBytes as unknown as BufferSource
  );

  return {
    ciphertext: bytesToBase64(new Uint8Array(encryptedBuffer)),
    iv: bytesToBase64(iv),
    version: 1,
    alg: "AES-256-GCM",
    tagLength: 128,
  };
}
