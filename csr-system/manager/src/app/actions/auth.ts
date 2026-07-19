"use server";

import { redirect } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { setSessionCookies, clearSessionCookies, getSession } from "@/lib/session";
import type { SessionUser } from "@/lib/session";

export interface LoginState {
  error?: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  mustChangePassword: boolean;
}

interface MeResponse {
  user: { _id: string; fullName: string; email: string; roleCode: SessionUser["roleCode"]; projectId: string };
}

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const projectSlug = String(formData.get("projectSlug") ?? "").trim() || undefined;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  let login: LoginResponse;
  try {
    login = await apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: { email, password, projectSlug },
    });
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 409) {
        return { error: "This email is used at more than one project — enter your project slug too." };
      }
      return { error: err.message };
    }
    return { error: "Could not reach the server. Please try again." };
  }

  const me = await apiFetch<MeResponse>("/me", { accessToken: login.accessToken });

  if (me.user.roleCode !== "manager" && me.user.roleCode !== "super_admin") {
    return { error: "This portal is for Managers and Super Admins only." };
  }

  await setSessionCookies({
    accessToken: login.accessToken,
    refreshToken: login.refreshToken,
    user: {
      id: me.user._id,
      fullName: me.user.fullName,
      email: me.user.email,
      roleCode: me.user.roleCode,
      projectId: me.user.projectId,
      mustChangePassword: login.mustChangePassword,
    },
  });

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const session = await getSession();
  await clearSessionCookies();
  if (session) {
    // Best-effort — logging out client-side is what actually matters; a failed
    // server-side session revoke shouldn't block the user from leaving.
    try {
      await apiFetch("/auth/logout-all", { method: "POST", accessToken: session.accessToken });
    } catch {
      // ignore
    }
  }
  redirect("/login");
}
