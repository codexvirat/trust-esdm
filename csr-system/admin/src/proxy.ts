import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE, USER_COOKIE, sessionCookieOptions, decodeJwtExpiryMs, type SessionUser } from "./lib/session";

const API_URL = process.env.BACKEND_API_URL ?? "http://localhost:5000/api/v1";
const PUBLIC_PATHS = ["/login"];

/**
 * Runs on every matched request (Node runtime, per Next 16 — see the docs'
 * "Optimistic checks with Proxy" pattern). This is the ONE place allowed to
 * both read and rewrite the session cookies mid-request, so the token
 * refresh — and the forced first-login password-change gate — live here
 * rather than being re-checked on every individual page.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  let accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  let refreshedCookies: { accessToken: string; refreshToken: string } | null = null;

  const needsRefresh = !accessToken || (decodeJwtExpiryMs(accessToken) ?? 0) - Date.now() < 30_000;

  if (needsRefresh && refreshToken) {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
      });
      if (res.ok) {
        const body = (await res.json()) as { accessToken: string; refreshToken: string };
        refreshedCookies = body;
        accessToken = body.accessToken;
      } else {
        accessToken = undefined;
      }
    } catch {
      accessToken = undefined;
    }
  }

  const isAuthenticated = Boolean(accessToken);

  if (!isAuthenticated && !isPublic) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(ACCESS_COOKIE);
    response.cookies.delete(REFRESH_COOKIE);
    response.cookies.delete(USER_COOKIE);
    return response;
  }

  if (isAuthenticated && isPublic) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Force a password change before anything else on first login — mirrors
  // the design doc's "First Login -> Force Password Change" step.
  if (isAuthenticated && pathname !== "/change-password") {
    try {
      const rawUser = request.cookies.get(USER_COOKIE)?.value;
      const user = rawUser ? (JSON.parse(rawUser) as SessionUser) : null;
      if (user?.mustChangePassword) {
        return NextResponse.redirect(new URL("/change-password", request.url));
      }
    } catch {
      // malformed cookie — let the page-level session check handle it
    }
  }

  const response = NextResponse.next();
  if (refreshedCookies) {
    response.cookies.set(ACCESS_COOKIE, refreshedCookies.accessToken, sessionCookieOptions);
    response.cookies.set(REFRESH_COOKIE, refreshedCookies.refreshToken, sessionCookieOptions);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
