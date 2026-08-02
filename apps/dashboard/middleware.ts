import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Validates that a session token looks like a valid Better Auth token.
 * Checks both standard and __Secure- prefixed production HTTPS cookies.
 */
function isAuthenticated(request: NextRequest): boolean {
  const cookie =
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("__Secure-better-auth.session_token");

  if (!cookie || !cookie.value) return false;

  const token = cookie.value;
  if (token.length < 32) return false;
  if (!/^[A-Za-z0-9_-]+$/.test(token)) return false;

  return true;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Root URL: redirect based on auth status
  if (pathname === "/") {
    if (isAuthenticated(request)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Public paths — always allow
  if (
    pathname === "/login" || pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname === "/logo.gif" ||
    pathname === "/hero-background.gif"
  ) {
    return NextResponse.next();
  }

  // Protected: /dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!isAuthenticated(request)) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Everything else is public
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.gif|hero-background.gif).*)",
  ],
};
