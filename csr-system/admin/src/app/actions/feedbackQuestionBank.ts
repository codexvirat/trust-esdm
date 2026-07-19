"use server";

import { revalidatePath } from "next/cache";
import { requireAdminRole } from "@/lib/dal";
import { apiFetch, ApiError } from "@/lib/api";
import type { FeedbackBankQuestion, FeedbackQuestionType } from "@/lib/types";

export interface ActionResult {
  error?: string;
}

export async function createFeedbackQuestionAction(
  projectId: string,
  payload: {
    questionText: string;
    type: FeedbackQuestionType;
    required?: boolean;
    tags?: string[];
  },
): Promise<ActionResult> {
  const { accessToken } = await requireAdminRole();

  if (!payload.questionText.trim()) return { error: "Question text is required." };

  try {
    await apiFetch<FeedbackBankQuestion>(`/feedback-question-bank?projectId=${projectId}`, { method: "POST", accessToken, body: payload });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to create question." };
  }

  revalidatePath("/dashboard/feedback-question-bank");
  return {};
}

export async function deleteFeedbackQuestionAction(projectId: string, questionId: string): Promise<void> {
  const { accessToken } = await requireAdminRole();
  await apiFetch(`/feedback-question-bank/${questionId}?projectId=${projectId}`, { method: "DELETE", accessToken });
  revalidatePath("/dashboard/feedback-question-bank");
}
