import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ authenticated: false, admin: null }, { status: 200 });
  }

  return NextResponse.json({
    authenticated: true,
    admin: {
      email: session.email,
      role: session.role,
    },
  });
}
