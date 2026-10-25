/**
 * Cross-platform cryptographic utilities for Web Crypto API.
 */

export function getCrypto(): Crypto {
  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.subtle) {
    return globalThis.crypto;
  }
  throw new Error("Web Crypto API is not supported in this runtime environment.");
}

export function getRandomBytes(length: number): Uint8Array {
  const crypto = getCrypto();
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.replace(/[^0-9a-fA-F]/g, "");
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

export interface PasswordGeneratorOptions {
  length: number;
  uppercase?: boolean;
  lowercase?: boolean;
  numbers?: boolean;
  symbols?: boolean;
  excludeAmbiguous?: boolean;
}

const CHARSETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
  ambiguous: "B8G6I1l0OQDS5Z2",
};

export function generateStrongPassword(options: PasswordGeneratorOptions): string {
  const {
    length = 20,
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true,
    excludeAmbiguous = false,
  } = options;

  let pool = "";
  const requiredChars: string[] = [];

  const filterAmbiguous = (str: string) =>
    excludeAmbiguous
      ? str
          .split("")
          .filter((c) => !CHARSETS.ambiguous.includes(c))
          .join("")
      : str;

  const upper = filterAmbiguous(CHARSETS.uppercase);
  const lower = filterAmbiguous(CHARSETS.lowercase);
  const nums = filterAmbiguous(CHARSETS.numbers);
  const syms = filterAmbiguous(CHARSETS.symbols);

  if (uppercase && upper.length > 0) {
    pool += upper;
    requiredChars.push(getRandomChar(upper));
  }
  if (lowercase && lower.length > 0) {
    pool += lower;
    requiredChars.push(getRandomChar(lower));
  }
  if (numbers && nums.length > 0) {
    pool += nums;
    requiredChars.push(getRandomChar(nums));
  }
  if (symbols && syms.length > 0) {
    pool += syms;
    requiredChars.push(getRandomChar(syms));
  }

  if (pool.length === 0) {
    pool = lower;
    requiredChars.push(getRandomChar(lower));
  }

  const result: string[] = [...requiredChars];
  const remainingLength = Math.max(0, length - result.length);

  const randomBytes = getRandomBytes(remainingLength);
  for (let i = 0; i < remainingLength; i++) {
    const randomIndex = randomBytes[i] % pool.length;
    result.push(pool[randomIndex]);
  }

  // Shuffle array using Fisher-Yates with Web Crypto
  for (let i = result.length - 1; i > 0; i--) {
    const randomByte = getRandomBytes(1)[0];
    const j = randomByte % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result.join("");
}

function getRandomChar(charset: string): string {
  const byte = getRandomBytes(1)[0];
  return charset[byte % charset.length];
}

export function calculatePasswordEntropy(password: string): {
  entropy: number;
  score: number; // 0 to 4
  level: "Very Weak" | "Weak" | "Fair" | "Strong" | "Excellent";
} {
  if (!password) {
    return { entropy: 0, score: 0, level: "Very Weak" };
  }

  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/[0-9]/.test(password)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 33;

  const entropy = Math.round(password.length * (poolSize > 0 ? Math.log2(poolSize) : 0));

  let score = 0;
  let level: "Very Weak" | "Weak" | "Fair" | "Strong" | "Excellent" = "Very Weak";

  if (entropy < 28 || password.length < 8) {
    score = 0;
    level = "Very Weak";
  } else if (entropy < 45 || password.length < 10) {
    score = 1;
    level = "Weak";
  } else if (entropy < 60 || password.length < 12) {
    score = 2;
    level = "Fair";
  } else if (entropy < 80 || password.length < 16) {
    score = 3;
    level = "Strong";
  } else {
    score = 4;
    level = "Excellent";
  }

  return { entropy, score, level };
}
