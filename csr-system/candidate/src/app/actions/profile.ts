"use server";

import { revalidatePath } from "next/cache";
import { requireCandidateRole } from "@/lib/dal";
import { apiFetch, ApiError } from "@/lib/api";
import type { AffiliatedOrganisation, CandidateProfile, EducationEntry } from "@/lib/types";

export interface ActionResult {
  error?: string;
}

export interface UpdateProfilePayload {
  dob?: string;
  gender?: string;
  bloodGroup?: string;
  alternatePhone?: string;
  address?: { line1?: string; line2?: string; city?: string; state?: string; country?: string; pincode?: string };
  education?: EducationEntry[];
  skills?: string[];
  socialLinks?: { linkedin?: string; github?: string; portfolio?: string; twitter?: string };
  emergencyContact?: { name?: string; relation?: string; phone?: string };
  affiliatedOrganisation?: AffiliatedOrganisation;
}

export async function updateProfileAction(payload: UpdateProfilePayload): Promise<ActionResult> {
  const { accessToken } = await requireCandidateRole();

  try {
    await apiFetch<CandidateProfile>("/me/candidate-profile", { method: "PATCH", accessToken, body: payload });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to update profile." };
  }

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
  return {};
}
