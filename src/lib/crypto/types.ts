export interface EncryptedData {
  ciphertext: string; // Base64 encoded ciphertext + GCM tag
  iv: string;         // Base64 encoded initialization vector (12 bytes)
  version: number;    // Cryptographic schema version (e.g., 1)
  alg: string;        // Algorithm string (e.g., "AES-256-GCM")
  tagLength?: number; // Auth tag length (default 128 bits)
}

export interface WrappedVaultKey {
  ciphertext: string;
  iv: string;
  salt: string;        // Salt used to derive KEK from master password
  iterations: number;  // PBKDF2 iterations
  version: number;
  alg: string;
}

export interface KeyDerivationParams {
  salt: Uint8Array;
  iterations: number;
  hash: string;
}

export interface CryptoError extends Error {
  code: "DECRYPTION_FAILED" | "INVALID_KEY" | "CORRUPTED_DATA" | "UNSUPPORTED_VERSION";
}
