"use server";

import { revalidatePath } from "next/cache";
import { requireManagerRole } from "@/lib/dal";
import { apiFetch, ApiError } from "@/lib/api";
import type { FeedbackForm, FeedbackFormQuestion } from "@/lib/types";

export interface ActionResult {
  error?: string;
}

export async function createFeedbackFormAction(workshopId: string, questions: FeedbackFormQuestion[]): Promise<ActionResult> {
  const { accessToken } = await requireManagerRole();

  if (questions.length === 0) {
    return { error: "Add at least one question." };
  }
  for (const q of questions) {
    if (!q.questionText.trim()) return { error: "Every question needs text." };
  }

  try {
    await apiFetch<FeedbackForm>(`/workshops/${workshopId}/feedback-forms`, { method: "POST", accessToken, body: { questions } });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to create feedback form." };
  }

  revalidatePath(`/dashboard/workshops/${workshopId}/feedback`);
  return {};
}

export async function setFeedbackEnabledAction(workshopId: string, formId: string, isEnabled: boolean): Promise<void> {
  const { accessToken } = await requireManagerRole();
  await apiFetch(`/workshops/${workshopId}/feedback-forms/${formId}/enabled`, { method: "PATCH", accessToken, body: { isEnabled } });
  revalidatePath(`/dashboard/workshops/${workshopId}/feedback`);
}
