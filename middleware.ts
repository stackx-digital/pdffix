import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // FIXED: protect both /dashboard and /admin routes
  if (path.startsWith("/dashboard") || path.startsWith("/admin")) {
    const hasSession = req.cookies
      .getAll()
      .some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));
    if (!hasSession) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/auth/login";
      loginUrl.searchParams.set("next", path);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)", "/auth/callback"],
};
