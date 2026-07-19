"use server";

import { revalidatePath } from "next/cache";
import { requireOrgAdminRole } from "@/lib/dal";
import { apiFetch, ApiError } from "@/lib/api";
import type { Question, QuestionOption, QuestionType } from "@/lib/types";

export interface ActionResult {
  error?: string;
}

export async function createQuestionAction(payload: {
  questionText: string;
  type: QuestionType;
  marks: number;
  options: QuestionOption[];
  tags?: string[];
}): Promise<ActionResult> {
  const { accessToken } = await requireOrgAdminRole();

  if (!payload.questionText.trim()) return { error: "Question text is required." };
  if (!payload.options.some((o) => o.isCorrect)) return { error: "Mark at least one option as correct." };

  try {
    await apiFetch<Question>("/question-bank", { method: "POST", accessToken, body: payload });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to create question." };
  }

  revalidatePath("/dashboard/question-bank");
  return {};
}

export async function deleteQuestionAction(questionId: string): Promise<void> {
  const { accessToken } = await requireOrgAdminRole();
  await apiFetch(`/question-bank/${questionId}`, { method: "DELETE", accessToken });
  revalidatePath("/dashboard/question-bank");
}
