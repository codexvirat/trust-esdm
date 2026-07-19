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

/** Manager and Super Admin both operate this portal; Trainer/Candidate are out of scope here. */
export async function requireManagerRole(): Promise<{ accessToken: string; user: SessionUser }> {
  const session = await requireSession();
  if (session.user.roleCode !== "manager" && session.user.roleCode !== "super_admin") {
    redirect("/login?error=wrong-portal");
  }
  return session;
}
