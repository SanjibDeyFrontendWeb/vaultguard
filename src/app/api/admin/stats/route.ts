import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { dbStore } from "@/lib/mongodb/store";

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized Super Admin access." }, { status: 401 });
  }

  try {
    const stats = await dbStore.getAdminStats();
    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Admin stats fetch error:", error);
    return NextResponse.json({ error: "Failed to load system statistics." }, { status: 500 });
  }
}
