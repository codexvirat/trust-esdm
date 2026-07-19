"use server";

import { revalidatePath } from "next/cache";
import { requireCandidateRole } from "@/lib/dal";
import { apiFetch, ApiError } from "@/lib/api";

export interface ActionResult {
  error?: string;
}

export async function regenerateBadgeAction(): Promise<ActionResult> {
  const { accessToken } = await requireCandidateRole();

  try {
    await apiFetch<{ attendanceQrToken: string }>("/me/attendance-qr/regenerate", {
      method: "POST",
      accessToken,
    });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to regenerate badge." };
  }

  revalidatePath("/dashboard/attendance");
  return {};
}
