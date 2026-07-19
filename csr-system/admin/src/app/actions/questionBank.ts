"use server";

import { revalidatePath } from "next/cache";
import { requireAdminRole } from "@/lib/dal";
import { apiFetch, ApiError } from "@/lib/api";
import type { Question, QuestionOption, QuestionType } from "@/lib/types";

export interface ActionResult {
  error?: string;
}

export async function createQuestionAction(
  projectId: string,
  payload: {
    questionText: string;
    type: QuestionType;
    marks: number;
    options: QuestionOption[];
    tags?: string[];
  },
): Promise<ActionResult> {
  const { accessToken } = await requireAdminRole();

  if (!payload.questionText.trim()) return { error: "Question text is required." };
  if (!payload.options.some((o) => o.isCorrect)) return { error: "Mark at least one option as correct." };

  try {
    await apiFetch<Question>(`/question-bank?projectId=${projectId}`, { method: "POST", accessToken, body: payload });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to create question." };
  }

  revalidatePath("/dashboard/question-bank");
  return {};
}

export async function deleteQuestionAction(projectId: string, questionId: string): Promise<void> {
  const { accessToken } = await requireAdminRole();
  await apiFetch(`/question-bank/${questionId}?projectId=${projectId}`, { method: "DELETE", accessToken });
  revalidatePath("/dashboard/question-bank");
}
