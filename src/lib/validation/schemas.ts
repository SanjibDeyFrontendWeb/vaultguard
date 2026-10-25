import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(60),
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  authHash: z.string().min(16, "Invalid client authentication hash"),
  vaultSalt: z.string().min(16, "Vault salt required"),
  wrappedVaultKey: z.object({
    ciphertext: z.string().min(1, "Ciphertext required"),
    iv: z.string().min(1, "IV required"),
    salt: z.string().min(1, "Salt required"),
    iterations: z.number().int().min(100000),
    version: z.number().int().default(1),
    alg: z.string().default("AES-256-GCM"),
  }),
  recoveryKeyHash: z.string().min(32, "Recovery key hash required"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  authHash: z.string().min(16, "Invalid client authentication hash"),
  twoFactorToken: z.string().length(6, "Code must be 6 digits").optional(),
});

export const twoFactorVerifySchema = z.object({
  code: z.string().length(6, "Verification code must be 6 digits"),
});

export const encryptedPayloadSchema = z.object({
  ciphertext: z.string().min(1, "Ciphertext required"),
  iv: z.string().min(1, "Initialization vector required"),
  version: z.number().int().default(1),
  alg: z.string().default("AES-256-GCM"),
  tagLength: z.number().int().optional(),
});

export const createVaultItemSchema = z.object({
  type: z.enum(["login", "note", "card", "apiKey", "wifi", "identity", "custom"]),
  isFavorite: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  encryptedPayload: encryptedPayloadSchema,
});

export const updateVaultItemSchema = z.object({
  type: z.enum(["login", "note", "card", "apiKey", "wifi", "identity", "custom"]).optional(),
  isFavorite: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  encryptedPayload: encryptedPayloadSchema.optional(),
});

export const recoveryVerifySchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  recoveryKey: z.string().min(16, "Recovery key is required"),
  newAuthHash: z.string().min(16, "New authentication hash is required"),
  newVaultSalt: z.string().min(16, "New vault salt is required"),
  newWrappedVaultKey: z.object({
    ciphertext: z.string(),
    iv: z.string(),
    salt: z.string(),
    iterations: z.number().int(),
    version: z.number().int(),
    alg: z.string(),
  }),
  newRecoveryKeyHash: z.string().min(32),
});
