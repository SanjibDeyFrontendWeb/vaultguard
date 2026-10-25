import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect /admin routes
  if (pathname.startsWith("/admin")) {
    const isLogin = pathname === "/admin/login";
    const adminToken = req.cookies.get("vaultguard_admin_session")?.value;

    // If not authenticated and trying to access protected admin page, redirect immediately to login
    if (!adminToken && !isLogin) {
      const loginUrl = new URL("/admin/login", req.url);
      return NextResponse.redirect(loginUrl);
    }

    // If already authenticated and accessing login page, redirect to admin dashboard
    if (adminToken && isLogin) {
      const adminUrl = new URL("/admin", req.url);
      return NextResponse.redirect(adminUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
