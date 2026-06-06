import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (path.startsWith("/dashboard")) {
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
