"use server";

import { revalidatePath } from "next/cache";
import { requireAdminRole } from "@/lib/dal";
import { apiFetch, ApiError } from "@/lib/api";
import type { RoleCode, UserSummary } from "@/lib/types";

export interface FormState {
  error?: string;
}

export async function createUserInProjectAction(projectId: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  const { accessToken } = await requireAdminRole();

  const roleCode = String(formData.get("roleCode") ?? "") as RoleCode;
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!roleCode || !fullName || !email) {
    return { error: "Role, name, and email are required." };
  }

  try {
    await apiFetch<UserSummary>("/users", {
      method: "POST",
      accessToken,
      body: { roleCode, fullName, email, phone: phone || undefined, projectId },
    });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to create account." };
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard/users");
  return {};
}

export async function setUserStatusAction(
  userId: string,
  projectId: string,
  status: "active" | "inactive" | "suspended",
  redirectPath: string,
): Promise<void> {
  const { accessToken } = await requireAdminRole();
  await apiFetch(`/users/${userId}/status?projectId=${projectId}`, { method: "PATCH", accessToken, body: { status } });
  revalidatePath(redirectPath);
}

export async function deleteUserAction(userId: string, projectId: string, redirectPath: string): Promise<void> {
  const { accessToken } = await requireAdminRole();
  await apiFetch(`/users/${userId}?projectId=${projectId}`, { method: "DELETE", accessToken });
  revalidatePath(redirectPath);
  revalidatePath("/dashboard");
}
