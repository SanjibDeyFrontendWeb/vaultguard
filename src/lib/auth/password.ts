import crypto from "crypto";

/**
 * Server-side password hashing using memory-hard scrypt algorithm with unique 32-byte salts.
 * Implements constant-time comparison to prevent timing side-channel attacks.
 */
export async function hashPassword(clientAuthHash: string): Promise<{ hash: string; salt: string }> {
  const salt = crypto.randomBytes(32).toString("hex");

  return new Promise((resolve, reject) => {
    // Scrypt parameters: N=16384, r=8, p=1, keylen=64
    crypto.scrypt(clientAuthHash, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
      if (err) return reject(err);
      resolve({
        hash: derivedKey.toString("hex"),
        salt,
      });
    });
  });
}

/**
 * Verifies a client-provided auth hash against the stored scrypt hash in constant time.
 */
export async function verifyPassword(clientAuthHash: string, storedHash: string, salt: string): Promise<boolean> {
  return new Promise((resolve) => {
    crypto.scrypt(clientAuthHash, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
      if (err) return resolve(false);
      try {
        const storedKeyBuffer = Buffer.from(storedHash, "hex");
        // Timing-safe comparison to prevent side-channel timing attacks
        if (storedKeyBuffer.length !== derivedKey.length) {
          return resolve(false);
        }
        resolve(crypto.timingSafeEqual(storedKeyBuffer, derivedKey));
      } catch {
        resolve(false);
      }
    });
  });
}
