import "server-only";
import { redirect } from "next/navigation";
import { getSession, type SessionUser } from "./session";

/** Call at the top of any protected Server Component/Action. Redirects if the session is missing. */
export async function requireSession(): Promise<{ accessToken: string; user: SessionUser }> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

/** This portal is Super Admin-only. */
export async function requireAdminRole(): Promise<{ accessToken: string; user: SessionUser }> {
  const session = await requireSession();
  if (session.user.roleCode !== "super_admin") {
    redirect("/login?error=wrong-portal");
  }
  return session;
}
