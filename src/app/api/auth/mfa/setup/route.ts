import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { dbStore } from "@/lib/mongodb/store";
import { generateTotpSetup, pendingSetups } from "@/lib/auth/totp";

export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await dbStore.findUserById(session.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const setupData = await generateTotpSetup(user.email);

    // Save pending setup for 10 minutes
    pendingSetups.set(user.id, {
      secret: setupData.secret,
      recoveryCodeHashes: setupData.recoveryCodeHashes,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    return NextResponse.json({
      secret: setupData.secret,
      qrCodeUrl: setupData.qrCodeUrl,
      otpauthUri: setupData.otpauthUri,
      recoveryCodes: setupData.recoveryCodes,
    });
  } catch (error) {
    console.error("2FA setup error:", error);
    return NextResponse.json({ error: "Failed to initialize 2FA setup." }, { status: 500 });
  }
}
