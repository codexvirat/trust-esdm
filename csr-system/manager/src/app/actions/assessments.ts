"use server";

import { revalidatePath } from "next/cache";
import { requireManagerRole } from "@/lib/dal";
import { apiFetch, ApiError } from "@/lib/api";
import type { Assessment, AssessmentQuestion } from "@/lib/types";

export interface ActionResult {
  error?: string;
}

export interface CreateAssessmentPayload {
  title: string;
  description?: string;
  passingPercent: number;
  maxAttempts: number;
  durationMinutes: number;
  questions: AssessmentQuestion[];
}

export async function createAssessmentAction(workshopId: string, payload: CreateAssessmentPayload): Promise<ActionResult> {
  const { accessToken } = await requireManagerRole();

  if (payload.questions.length === 0) {
    return { error: "Add at least one question." };
  }
  for (const q of payload.questions) {
    if (!q.questionText.trim()) return { error: "Every question needs text." };
    if (!q.options.some((o) => o.isCorrect)) return { error: `Mark a correct option for "${q.questionText}".` };
  }

  try {
    await apiFetch<Assessment>(`/workshops/${workshopId}/assessments`, { method: "POST", accessToken, body: payload });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to create assessment." };
  }

  revalidatePath(`/dashboard/workshops/${workshopId}/assessments`);
  return {};
}

export async function setAssessmentEnabledAction(workshopId: string, assessmentId: string, isEnabled: boolean): Promise<void> {
  const { accessToken } = await requireManagerRole();
  await apiFetch(`/workshops/${workshopId}/assessments/${assessmentId}/enabled`, { method: "PATCH", accessToken, body: { isEnabled } });
  revalidatePath(`/dashboard/workshops/${workshopId}/assessments`);
}
