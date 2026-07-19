import "server-only";
import { cookies } from "next/headers";

export const ACCESS_COOKIE = "csr_trainer_access_token";
export const REFRESH_COOKIE = "csr_trainer_refresh_token";
export const USER_COOKIE = "csr_trainer_user";

export type RoleCode = "super_admin" | "manager" | "trainer" | "candidate";

export interface SessionUser {
  id: string;
  fullName: string;
  email: string;
  roleCode: RoleCode;
  projectId: string;
  mustChangePassword: boolean;
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days — bounded by the refresh token's own expiry either way
};

/**
 * Reads the session for use in Server Components/Actions. Does NOT refresh
 * expired tokens — proxy.ts already does that on every matched request
 * (cookies can only be written from a Server Action, Route Handler, or
 * Proxy, never while rendering a Server Component).
 */
export async function getSession(): Promise<{ accessToken: string; user: SessionUser } | null> {
  const store = await cookies();
  const accessToken = store.get(ACCESS_COOKIE)?.value;
  const rawUser = store.get(USER_COOKIE)?.value;
  if (!accessToken || !rawUser) return null;

  try {
    const user = JSON.parse(rawUser) as SessionUser;
    return { accessToken, user };
  } catch {
    return null;
  }
}

/** Server Action / Route Handler only — writes the session cookies after login or refresh. */
export async function setSessionCookies(input: { accessToken: string; refreshToken: string; user: SessionUser }) {
  const store = await cookies();
  store.set(ACCESS_COOKIE, input.accessToken, sessionCookieOptions);
  store.set(REFRESH_COOKIE, input.refreshToken, sessionCookieOptions);
  store.set(USER_COOKIE, JSON.stringify(input.user), sessionCookieOptions);
}

/** Server Action / Route Handler only. */
export async function clearSessionCookies() {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
  store.delete(USER_COOKIE);
}

export function decodeJwtExpiryMs(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { exp?: number };
    return typeof json.exp === "number" ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}
