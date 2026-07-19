"use server";

import { revalidatePath } from "next/cache";
import { requireTrainerRole } from "@/lib/dal";
import { apiFetch, ApiError } from "@/lib/api";
import type { TrainerProfile } from "@/lib/types";

export interface ActionResult {
  error?: string;
}

export interface UpdateTrainerProfilePayload {
  specializations: string[];
  bio?: string;
  experienceYears: number;
  certifications: string[];
}

export async function updateTrainerProfileAction(payload: UpdateTrainerProfilePayload): Promise<ActionResult> {
  const { accessToken } = await requireTrainerRole();

  try {
    await apiFetch<TrainerProfile>("/me/trainer-profile", { method: "PATCH", accessToken, body: payload });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to update profile." };
  }

  revalidatePath("/dashboard/profile");
  return {};
}
