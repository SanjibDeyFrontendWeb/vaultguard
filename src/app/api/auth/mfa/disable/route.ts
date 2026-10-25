import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSession, parseClientContext } from "@/lib/auth/session";
import { dbStore } from "@/lib/mongodb/store";
import { verifyPassword } from "@/lib/auth/password";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { authHash } = await req.json();
    if (!authHash) {
      return NextResponse.json({ error: "Authentication hash required to disable 2FA." }, { status: 400 });
    }

    const user = await dbStore.findUserById(session.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const isPasswordValid = await verifyPassword(authHash, user.passwordHash, user.salt);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid master password confirmation." }, { status: 401 });
    }

    await dbStore.updateUser(user.id, {
      twoFactorEnabled: false,
      twoFactorSecret: undefined,
      recoveryCodes: [],
    });

    const context = parseClientContext(req.headers);
    await dbStore.recordSecurityEvent({
      id: crypto.randomUUID(),
      userId: user.id,
      type: "two_factor_disabled",
      ip: context.ip,
      userAgent: context.userAgent,
      timestamp: new Date().toISOString(),
      status: "warning",
      details: "Two-factor authentication disabled by user",
    });

    return NextResponse.json({ success: true, message: "Two-factor authentication disabled." });
  } catch (error) {
    return NextResponse.json({ error: "Failed to disable 2FA." }, { status: 500 });
  }
}
