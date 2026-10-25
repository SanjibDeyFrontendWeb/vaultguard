import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { dbStore } from "@/lib/mongodb/store";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const events = await dbStore.getSecurityEvents(session.userId, 50);
    return NextResponse.json({ events });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load security activity" }, { status: 500 });
  }
}
