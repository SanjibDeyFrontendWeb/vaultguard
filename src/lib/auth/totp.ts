import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import crypto from "crypto";

export interface TotpSetupResult {
  secret: string; // Base32 secret
  qrCodeUrl: string; // Data URL for QR image
  otpauthUri: string;
  recoveryCodes: string[]; // Plaintext for user to record once
  recoveryCodeHashes: string[]; // Stored in database
}

/**
 * Generates a new TOTP secret, QR code DataURL, and 10 single-use recovery codes.
 */
export async function generateTotpSetup(
  userEmail: string,
  appName = "VaultGuard"
): Promise<TotpSetupResult> {
  const totp = new OTPAuth.TOTP({
    issuer: appName,
    label: userEmail,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: new OTPAuth.Secret({ size: 20 }),
  });

  const secret = totp.secret.base32;
  const otpauthUri = totp.toString();
  const qrCodeUrl = await QRCode.toDataURL(otpauthUri, {
    margin: 2,
    width: 256,
    color: {
      dark: "#0F172A",
      light: "#FFFFFF",
    },
  });

  // Generate 10 random 8-character recovery codes
  const recoveryCodes: string[] = [];
  const recoveryCodeHashes: string[] = [];

  for (let i = 0; i < 10; i++) {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    const formatted = `${code.slice(0, 4)}-${code.slice(4, 8)}`;
    recoveryCodes.push(formatted);

    const hash = crypto.createHash("sha256").update(formatted).digest("hex");
    recoveryCodeHashes.push(hash);
  }

  return {
    secret,
    qrCodeUrl,
    otpauthUri,
    recoveryCodes,
    recoveryCodeHashes,
  };
}

/**
 * Validates a 6-digit TOTP token against a user's base32 secret.
 * Allows a delta window of ±1 (current, -30s, +30s) to handle clock drift.
 */
export function verifyTotpToken(secretBase32: string, token: string): boolean {
  const cleanToken = token.trim();
  if (cleanToken.length !== 6) return false;

  const totp = new OTPAuth.TOTP({
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  });

  const delta = totp.validate({
    token: cleanToken,
    window: 1, // allows -1, 0, +1
  });

  return delta !== null;
}

/**
 * Validates and consumes a recovery code.
 */
export function verifyAndConsumeRecoveryCode(
  inputCode: string,
  storedHashes: string[]
): { valid: boolean; remainingHashes: string[] } {
  const cleanCode = inputCode.trim().toUpperCase();
  const inputHash = crypto.createHash("sha256").update(cleanCode).digest("hex");

  const matchIndex = storedHashes.findIndex((h) => h === inputHash);
  if (matchIndex === -1) {
    return { valid: false, remainingHashes: storedHashes };
  }

  const remainingHashes = [...storedHashes];
  remainingHashes.splice(matchIndex, 1);
  return { valid: true, remainingHashes };
}

// Temporary store for pending 2FA setups prior to verification
export const pendingSetups = new Map<string, { secret: string; recoveryCodeHashes: string[]; expiresAt: number }>();
