import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { recoveryVerifySchema } from "@/lib/validation/schemas";
import { dbStore } from "@/lib/mongodb/store";
import { hashPassword } from "@/lib/auth/password";
import { verifyRecoveryKey } from "@/lib/crypto/recovery";
import { parseClientContext, setSessionCookie } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = recoveryVerifySchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: "Invalid recovery request data." }, { status: 400 });
    }

    const { email, recoveryKey, newAuthHash, newWrappedVaultKey, newRecoveryKeyHash } = validated.data;
    const user = await dbStore.findUserByEmail(email);

    if (!user) {
      await new Promise((r) => setTimeout(r, 400));
      return NextResponse.json({ error: "Invalid recovery credentials." }, { status: 400 });
    }

    // Verify recovery key
    const isRecoveryMatch = await verifyRecoveryKey(recoveryKey, user.recoveryKeyHash);
    if (!isRecoveryMatch) {
      const context = parseClientContext(req.headers);
      await dbStore.recordSecurityEvent({
        id: crypto.randomUUID(),
        userId: user.id,
        type: "login_failed",
        ip: context.ip,
        userAgent: context.userAgent,
        timestamp: new Date().toISOString(),
        status: "danger",
        details: "Failed emergency recovery key verification",
      });
      return NextResponse.json({ error: "Invalid emergency recovery key." }, { status: 401 });
    }

    // Update password hash and vault key
    const { hash, salt } = await hashPassword(newAuthHash);
    await dbStore.updateUser(user.id, {
      passwordHash: hash,
      salt,
      recoveryKeyHash: newRecoveryKeyHash,
      twoFactorEnabled: false, // Reset 2FA upon emergency recovery
      twoFactorSecret: undefined,
    });

    await dbStore.updateVaultKey(user.id, newWrappedVaultKey);

    const context = parseClientContext(req.headers);
    const sessionId = crypto.randomUUID();
    const now = new Date().toISOString();

    await dbStore.recordSecurityEvent({
      id: crypto.randomUUID(),
      userId: user.id,
      type: "recovery_key_generated",
      ip: context.ip,
      userAgent: context.userAgent,
      timestamp: now,
      status: "warning",
      details: "Emergency recovery executed: master password and vault keys rotated",
    });

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
      message: "Vault access successfully restored with new master credentials.",
    });
  } catch (error) {
    console.error("Recovery verification error:", error);
    return NextResponse.json({ error: "Emergency recovery failed." }, { status: 500 });
  }
}
