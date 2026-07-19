"use server";

import { revalidatePath } from "next/cache";
import { requireCandidateRole } from "@/lib/dal";
import { apiFetch, ApiError } from "@/lib/api";

export interface ActionResult {
  error?: string;
}

export interface SubmitFeedbackPayload {
  answers: { questionIndex: number; ratingValue?: number; textValue?: string }[];
}

export async function submitFeedbackAction(
  workshopId: string,
  formId: string,
  enrollmentId: string,
  payload: SubmitFeedbackPayload,
): Promise<ActionResult> {
  const { accessToken } = await requireCandidateRole();

  try {
    await apiFetch(`/workshops/${workshopId}/feedback-forms/${formId}/responses`, { method: "POST", accessToken, body: payload });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to submit feedback." };
  }

  revalidatePath(`/dashboard/trainings/${enrollmentId}`);
  revalidatePath(`/dashboard/trainings/${enrollmentId}/feedback`);
  revalidatePath("/dashboard");
  return {};
}
