import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSuperAdminCredentials, setAdminSessionCookie } from "@/lib/auth/admin";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const superCreds = getSuperAdminCredentials();

    if (
      email.toLowerCase().trim() !== superCreds.email ||
      password !== superCreds.pass
    ) {
      return NextResponse.json(
        { error: "Invalid Super Admin credentials." },
        { status: 401 }
      );
    }

    const adminSession = {
      adminId: "superadmin_01",
      email: superCreds.email,
      role: "superadmin" as const,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    };

    await setAdminSessionCookie(adminSession);

    return NextResponse.json({
      success: true,
      admin: {
        email: adminSession.email,
        role: adminSession.role,
      },
    });
  } catch (error) {
    console.error("Super Admin login error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
