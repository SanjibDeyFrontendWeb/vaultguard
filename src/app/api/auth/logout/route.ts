import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { clearSessionCookie, getSession, parseClientContext } from "@/lib/auth/session";
import { dbStore } from "@/lib/mongodb/store";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (session) {
      const context = parseClientContext(req.headers);
      await dbStore.recordSecurityEvent({
        id: crypto.randomUUID(),
        userId: session.userId,
        type: "logout",
        ip: context.ip,
        userAgent: context.userAgent,
        timestamp: new Date().toISOString(),
        status: "success",
        details: "User initiated session logout",
      });

      if (session.sessionId) {
        await dbStore.revokeDeviceSession(session.sessionId, session.userId);
      }
    }

    await clearSessionCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    await clearSessionCookie();
    return NextResponse.json({ success: true });
  }
}
