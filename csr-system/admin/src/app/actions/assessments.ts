"use server";

import { revalidatePath } from "next/cache";
import { requireAdminRole } from "@/lib/dal";
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
  questionBankIds: string[];
}

export async function createAssessmentAction(projectId: string, workshopId: string, payload: CreateAssessmentPayload): Promise<ActionResult> {
  const { accessToken } = await requireAdminRole();

  if (payload.questions.length === 0 && payload.questionBankIds.length === 0) {
    return { error: "Add at least one question." };
  }
  for (const q of payload.questions) {
    if (!q.questionText.trim()) return { error: "Every question needs text." };
    if (!q.options.some((o) => o.isCorrect)) return { error: `Mark a correct option for "${q.questionText}".` };
  }
  if (!payload.title.trim()) {
    return { error: "Title is required." };
  }

  try {
    await apiFetch<Assessment>(`/workshops/${workshopId}/assessments?projectId=${projectId}`, { method: "POST", accessToken, body: payload });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to create assessment." };
  }

  revalidatePath(`/dashboard/workshops/${workshopId}/assessments`);
  return {};
}

export async function setAssessmentEnabledAction(projectId: string, workshopId: string, assessmentId: string, isEnabled: boolean): Promise<void> {
  const { accessToken } = await requireAdminRole();
  await apiFetch(`/workshops/${workshopId}/assessments/${assessmentId}/enabled?projectId=${projectId}`, {
    method: "PATCH",
    accessToken,
    body: { isEnabled },
  });
  revalidatePath(`/dashboard/workshops/${workshopId}/assessments`);
  revalidatePath(`/dashboard/workshops/${workshopId}`);
}

export async function deleteAssessmentAction(projectId: string, workshopId: string, assessmentId: string): Promise<void> {
  const { accessToken } = await requireAdminRole();
  await apiFetch(`/workshops/${workshopId}/assessments/${assessmentId}?projectId=${projectId}`, { method: "DELETE", accessToken });
  revalidatePath(`/dashboard/workshops/${workshopId}/assessments`);
}

/** Narrows a workshop-wide (or differently-scoped) assessment to one batch and turns it on — the batch's "Assessment" toggle. */
export async function assignAssessmentToBatchAction(projectId: string, workshopId: string, assessmentId: string, batchId: string): Promise<ActionResult> {
  const { accessToken } = await requireAdminRole();

  try {
    await apiFetch<Assessment>(`/workshops/${workshopId}/assessments/${assessmentId}?projectId=${projectId}`, {
      method: "PATCH",
      accessToken,
      body: { batchId },
    });
    await apiFetch(`/workshops/${workshopId}/assessments/${assessmentId}/enabled?projectId=${projectId}`, {
      method: "PATCH",
      accessToken,
      body: { isEnabled: true },
    });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to assign assessment." };
  }

  revalidatePath(`/dashboard/workshops/${workshopId}/batches/${batchId}`);
  revalidatePath(`/dashboard/workshops/${workshopId}/assessments`);
  return {};
}
