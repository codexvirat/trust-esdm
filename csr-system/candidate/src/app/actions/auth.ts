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

  if (me.user.roleCode !== "candidate") {
    return { error: "This portal is for Candidates only." };
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

  redirect(login.mustChangePassword ? "/change-password" : "/dashboard");
}

export async function logoutAction(): Promise<void> {
  const session = await getSession();
  await clearSessionCookies();
  if (session) {
    try {
      await apiFetch("/auth/logout-all", { method: "POST", accessToken: session.accessToken });
    } catch {
      // Best-effort — logging out client-side is what actually matters.
    }
  }
  redirect("/login");
}

export interface ChangePasswordState {
  error?: string;
}

export async function changePasswordAction(_prevState: ChangePasswordState, formData: FormData): Promise<ChangePasswordState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !newPassword) {
    return { error: "Both fields are required." };
  }
  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "New password and confirmation don't match." };
  }

  try {
    await apiFetch("/auth/change-password", {
      method: "POST",
      accessToken: session.accessToken,
      body: { currentPassword, newPassword },
    });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to change password." };
  }

  // change-password revokes every session server-side (logoutAllDevices), so
  // the access/refresh tokens we're holding are already dead — clear our
  // cookies and send them back through a fresh login rather than pretending
  // the current session still works.
  await clearSessionCookies();
  redirect("/login?passwordChanged=1");
}
