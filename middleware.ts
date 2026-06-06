import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./src/i18n/routing";

const intlMiddleware = createMiddleware(routing);

export function middleware(req: NextRequest) {
  // Auth guard — works regardless of locale prefix
  const path = req.nextUrl.pathname;
  const pathWithoutLocale = path.replace(/^\/(ms|en|zh|ar)/, "") || "/";

  if (pathWithoutLocale.startsWith("/dashboard")) {
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

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)", "/auth/callback"],
};
