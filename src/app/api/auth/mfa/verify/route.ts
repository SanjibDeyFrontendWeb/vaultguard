import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSession, parseClientContext } from "@/lib/auth/session";
import { dbStore } from "@/lib/mongodb/store";
import { twoFactorVerifySchema } from "@/lib/validation/schemas";
import { verifyTotpToken, pendingSetups } from "@/lib/auth/totp";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = twoFactorVerifySchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: "Invalid 6-digit code format." }, { status: 400 });
    }

    const pending = pendingSetups.get(session.userId);
    if (!pending || Date.now() > pending.expiresAt) {
      return NextResponse.json(
        { error: "Setup session expired. Please restart 2FA setup." },
        { status: 400 }
      );
    }

    const isValid = verifyTotpToken(pending.secret, validated.data.code);
    if (!isValid) {
      return NextResponse.json(
        { error: "Incorrect verification code. Please check your authenticator app." },
        { status: 400 }
      );
    }

    // Enable 2FA on the user's account
    await dbStore.updateUser(session.userId, {
      twoFactorEnabled: true,
      twoFactorSecret: pending.secret,
      recoveryCodes: pending.recoveryCodeHashes,
    });

    pendingSetups.delete(session.userId);

    const context = parseClientContext(req.headers);
    await dbStore.recordSecurityEvent({
      id: crypto.randomUUID(),
      userId: session.userId,
      type: "two_factor_enabled",
      ip: context.ip,
      userAgent: context.userAgent,
      timestamp: new Date().toISOString(),
      status: "success",
      details: "Two-factor authentication successfully enabled",
    });

    return NextResponse.json({
      success: true,
      message: "Two-factor authentication has been enabled.",
    });
  } catch (error) {
    console.error("2FA verify error:", error);
    return NextResponse.json({ error: "Failed to verify 2FA code." }, { status: 500 });
  }
}
