import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { dbStore } from "@/lib/mongodb/store";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized Super Admin access." }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (!id) {
    return NextResponse.json({ error: "User ID is required." }, { status: 400 });
  }

  try {
    if (sessionId) {
      await dbStore.revokeDeviceSession(sessionId, id);
    } else {
      // Revoke all sessions for this user
      const { db, isFallback } = await (dbStore as any).getDb?.() || { db: null, isFallback: true };
      await dbStore.revokeAllOtherSessions(id, "");
    }

    return NextResponse.json({ success: true, message: "Session(s) revoked successfully." });
  } catch (error) {
    console.error("Admin revoke session error:", error);
    return NextResponse.json({ error: "Failed to revoke session." }, { status: 500 });
  }
}
