"use server";

import { revalidatePath } from "next/cache";
import { requireManagerRole } from "@/lib/dal";
import { apiFetch, ApiError } from "@/lib/api";

export interface FormState {
  error?: string;
}

export async function approveRegistrationAction(registrationId: string): Promise<FormState> {
  const { accessToken } = await requireManagerRole();

  try {
    await apiFetch(`/registrations/${registrationId}/approve`, { method: "POST", accessToken });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to approve registration." };
  }

  revalidatePath("/dashboard/registrations");
  revalidatePath("/dashboard/candidates");
  revalidatePath("/dashboard");
  return {};
}

export async function rejectRegistrationAction(registrationId: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  const { accessToken } = await requireManagerRole();
  const reason = String(formData.get("reason") ?? "").trim();

  if (reason.length < 2) {
    return { error: "Enter a reason for rejecting this application." };
  }

  try {
    await apiFetch(`/registrations/${registrationId}/reject`, { method: "POST", accessToken, body: { reason } });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to reject registration." };
  }

  revalidatePath("/dashboard/registrations");
  revalidatePath("/dashboard");
  return {};
}
