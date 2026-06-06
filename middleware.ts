import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const hasSupabaseSession = req.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"));

  if (req.nextUrl.pathname.startsWith("/dashboard") && !hasSupabaseSession) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/callback"]
};
