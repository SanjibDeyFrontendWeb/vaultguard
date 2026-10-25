import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { loginSchema } from "@/lib/validation/schemas";
import { dbStore } from "@/lib/mongodb/store";
import { verifyPassword } from "@/lib/auth/password";
import { parseClientContext, setSessionCookie } from "@/lib/auth/session";
import { verifyTotpToken, verifyAndConsumeRecoveryCode } from "@/lib/auth/totp";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = loginSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid credentials format." },
        { status: 400 }
      );
    }

    const { email, authHash, twoFactorToken } = validated.data;
    const context = parseClientContext(req.headers);
    const now = new Date().toISOString();

    const user = await dbStore.findUserByEmail(email);
    if (!user) {
      // Delay response slightly to prevent timing side-channel
      await new Promise((r) => setTimeout(r, 400));
      return NextResponse.json(
        { error: "Invalid email or master password." },
        { status: 401 }
      );
    }

    // Verify scrypt hash with unique salt
    const isPasswordValid = await verifyPassword(authHash, user.passwordHash, user.salt);
    if (!isPasswordValid) {
      await dbStore.recordSecurityEvent({
        id: crypto.randomUUID(),
        userId: user.id,
        type: "login_failed",
        ip: context.ip,
        userAgent: context.userAgent,
        timestamp: now,
        status: "danger",
        details: "Failed login attempt with incorrect credentials",
      });

      return NextResponse.json(
        { error: "Invalid email or master password." },
        { status: 401 }
      );
    }

    // Check TOTP 2FA
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      if (!twoFactorToken) {
        return NextResponse.json({
          requiresTwoFactor: true,
          email: user.email,
        });
      }

      // Check whether token is standard TOTP or backup recovery code
      const isTotpValid = verifyTotpToken(user.twoFactorSecret, twoFactorToken);
      let isRecoveryValid = false;

      if (!isTotpValid && user.recoveryCodes && user.recoveryCodes.length > 0) {
        const recoveryResult = verifyAndConsumeRecoveryCode(twoFactorToken, user.recoveryCodes);
        if (recoveryResult.valid) {
          isRecoveryValid = true;
          // Update remaining recovery codes
          await dbStore.updateUser(user.id, { recoveryCodes: recoveryResult.remainingHashes });
          await dbStore.recordSecurityEvent({
            id: crypto.randomUUID(),
            userId: user.id,
            type: "login_success",
            ip: context.ip,
            userAgent: context.userAgent,
            timestamp: now,
            status: "warning",
            details: "Logged in using one-time backup recovery code",
          });
        }
      }

      if (!isTotpValid && !isRecoveryValid) {
        await dbStore.recordSecurityEvent({
          id: crypto.randomUUID(),
          userId: user.id,
          type: "login_failed",
          ip: context.ip,
          userAgent: context.userAgent,
          timestamp: now,
          status: "danger",
          details: "Failed two-factor authentication verification",
        });

        return NextResponse.json(
          { error: "Invalid two-factor authentication code or backup recovery code." },
          { status: 401 }
        );
      }
    }

    // Retrieve user's encrypted vault key
    const vault = await dbStore.getVault(user.id);
    if (!vault) {
      return NextResponse.json(
        { error: "User vault record not found." },
        { status: 500 }
      );
    }

    const sessionId = crypto.randomUUID();

    // Record security log
    await dbStore.recordSecurityEvent({
      id: crypto.randomUUID(),
      userId: user.id,
      type: "login_success",
      ip: context.ip,
      userAgent: context.userAgent,
      timestamp: now,
      status: "success",
      details: "Successful login session established",
    });

    // Record device session
    await dbStore.recordDeviceSession({
      id: sessionId,
      userId: user.id,
      deviceName: context.device,
      browser: context.browser,
      os: context.os,
      ip: context.ip,
      current: true,
      createdAt: now,
      lastActive: now,
    });

    // Establish secure HttpOnly cookie session
    const session = {
      userId: user.id,
      email: user.email,
      name: user.name,
      sessionId,
      createdAt: now,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    await setSessionCookie(session);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        twoFactorEnabled: user.twoFactorEnabled,
      },
      vault: {
        encryptedVaultKey: vault.encryptedVaultKey,
        keyVersion: vault.keyVersion,
        encryptionVersion: vault.encryptionVersion,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}
