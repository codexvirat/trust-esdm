"use server";

import { revalidatePath } from "next/cache";
import { requireAdminRole } from "@/lib/dal";
import { apiFetch, ApiError } from "@/lib/api";
import type { FeedbackForm, FeedbackFormQuestion } from "@/lib/types";

export interface ActionResult {
  error?: string;
}

export async function createFeedbackFormAction(
  projectId: string,
  workshopId: string,
  title: string,
  questions: FeedbackFormQuestion[],
  feedbackQuestionBankIds: string[],
): Promise<ActionResult> {
  const { accessToken } = await requireAdminRole();

  if (!title.trim()) {
    return { error: "Title is required." };
  }
  if (questions.length === 0 && feedbackQuestionBankIds.length === 0) {
    return { error: "Add at least one question." };
  }
  for (const q of questions) {
    if (!q.questionText.trim()) return { error: "Every question needs text." };
  }

  try {
    await apiFetch<FeedbackForm>(`/workshops/${workshopId}/feedback-forms?projectId=${projectId}`, {
      method: "POST",
      accessToken,
      body: { title, questions, feedbackQuestionBankIds },
    });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to create feedback form." };
  }

  revalidatePath(`/dashboard/workshops/${workshopId}/feedback`);
  return {};
}

export async function setFeedbackEnabledAction(projectId: string, workshopId: string, formId: string, isEnabled: boolean): Promise<void> {
  const { accessToken } = await requireAdminRole();
  await apiFetch(`/workshops/${workshopId}/feedback-forms/${formId}/enabled?projectId=${projectId}`, {
    method: "PATCH",
    accessToken,
    body: { isEnabled },
  });
  revalidatePath(`/dashboard/workshops/${workshopId}/feedback`);
  revalidatePath(`/dashboard/workshops/${workshopId}`);
}

/** Narrows a workshop-wide (or differently-scoped) feedback form to one batch and turns it on — the batch's "Feedback" toggle. */
export async function assignFeedbackFormToBatchAction(projectId: string, workshopId: string, formId: string, batchId: string): Promise<ActionResult> {
  const { accessToken } = await requireAdminRole();

  try {
    await apiFetch<FeedbackForm>(`/workshops/${workshopId}/feedback-forms/${formId}?projectId=${projectId}`, {
      method: "PATCH",
      accessToken,
      body: { batchId },
    });
    await apiFetch(`/workshops/${workshopId}/feedback-forms/${formId}/enabled?projectId=${projectId}`, {
      method: "PATCH",
      accessToken,
      body: { isEnabled: true },
    });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to assign feedback form." };
  }

  revalidatePath(`/dashboard/workshops/${workshopId}/batches/${batchId}`);
  revalidatePath(`/dashboard/workshops/${workshopId}/feedback`);
  return {};
}
