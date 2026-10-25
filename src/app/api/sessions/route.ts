import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { dbStore } from "@/lib/mongodb/store";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const devices = await dbStore.getDeviceSessions(session.userId, session.sessionId);
    return NextResponse.json({ devices });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load active sessions" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId, revokeAllOther } = await req.json();

    if (revokeAllOther) {
      await dbStore.revokeAllOtherSessions(session.userId, session.sessionId);
      return NextResponse.json({ success: true, message: "All other sessions revoked." });
    }

    if (sessionId) {
      await dbStore.revokeDeviceSession(sessionId, session.userId);
      return NextResponse.json({ success: true, message: "Session revoked." });
    }

    return NextResponse.json({ error: "Invalid revocation request" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to revoke session" }, { status: 500 });
  }
}
