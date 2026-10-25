import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { registerSchema } from "@/lib/validation/schemas";
import { dbStore, UserRecord, VaultRecord } from "@/lib/mongodb/store";
import { hashPassword } from "@/lib/auth/password";
import { parseClientContext, setSessionCookie } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.format() },
        { status: 400 }
      );
    }

    const { name, email, authHash, vaultSalt, wrappedVaultKey, recoveryKeyHash } = validated.data;

    // Check if user already exists
    const existingUser = await dbStore.findUserByEmail(email);
    if (existingUser) {
      // Avoid account enumeration in production messaging
      return NextResponse.json(
        { error: "An account with this email already exists or is unavailable." },
        { status: 409 }
      );
    }

    // Hash client-provided auth key using scrypt with unique salt
    const { hash, salt } = await hashPassword(authHash);

    const userId = crypto.randomUUID();
    const vaultId = crypto.randomUUID();
    const now = new Date().toISOString();

    const newUser: UserRecord = {
      id: userId,
      name,
      email,
      passwordHash: hash,
      salt,
      status: "active",
      twoFactorEnabled: false,
      recoveryKeyHash,
      createdAt: now,
      updatedAt: now,
    };

    await dbStore.createUser(newUser);

    // Save initial vault metadata with wrapped vault encryption key
    const vaultRecord: VaultRecord = {
      userId,
      vaultId,
      encryptedVaultKey: wrappedVaultKey,
      keyVersion: 1,
      encryptionVersion: 1,
      createdAt: now,
      updatedAt: now,
    };

    await dbStore.createVault(vaultRecord);

    const context = parseClientContext(req.headers);
    const sessionId = crypto.randomUUID();

    // Log security audit event
    await dbStore.recordSecurityEvent({
      id: crypto.randomUUID(),
      userId,
      type: "login_success",
      ip: context.ip,
      userAgent: context.userAgent,
      timestamp: now,
      status: "success",
      details: "Initial account creation and vault generation",
    });

    // Record initial device session
    await dbStore.recordDeviceSession({
      id: sessionId,
      userId,
      deviceName: context.device,
      browser: context.browser,
      os: context.os,
      ip: context.ip,
      current: true,
      createdAt: now,
      lastActive: now,
    });

    // Establish secure session
    const session = {
      userId,
      email,
      name,
      sessionId,
      createdAt: now,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    await setSessionCookie(session);

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        name,
        email,
        twoFactorEnabled: false,
      },
      vault: {
        encryptedVaultKey: wrappedVaultKey,
        keyVersion: 1,
        encryptionVersion: 1,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error during registration." },
      { status: 500 }
    );
  }
}
