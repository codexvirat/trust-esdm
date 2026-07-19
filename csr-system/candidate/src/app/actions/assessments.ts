"use server";

import { revalidatePath } from "next/cache";
import { requireCandidateRole } from "@/lib/dal";
import { apiFetch, ApiError } from "@/lib/api";
import type { AssessmentAttempt, CandidateAssessment } from "@/lib/types";

export interface StartAttemptResult {
  error?: string;
  attempt?: AssessmentAttempt;
  assessment?: CandidateAssessment;
}

export async function startAttemptAction(workshopId: string, assessmentId: string): Promise<StartAttemptResult> {
  const { accessToken } = await requireCandidateRole();

  try {
    const result = await apiFetch<{ attempt: AssessmentAttempt; assessment: CandidateAssessment }>(
      `/workshops/${workshopId}/assessments/${assessmentId}/attempts`,
      { method: "POST", accessToken },
    );
    return { attempt: result.attempt, assessment: result.assessment };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to start assessment." };
  }
}

export interface SubmitAttemptResult {
  error?: string;
  attempt?: AssessmentAttempt;
  assessmentStatus?: string;
}

export async function submitAttemptAction(
  workshopId: string,
  assessmentId: string,
  attemptId: string,
  answers: { questionIndex: number; selectedOptions: number[] }[],
  enrollmentId: string,
): Promise<SubmitAttemptResult> {
  const { accessToken } = await requireCandidateRole();

  try {
    const result = await apiFetch<{ attempt: AssessmentAttempt; assessmentStatus: string }>(
      `/workshops/${workshopId}/assessments/${assessmentId}/attempts/${attemptId}/submit`,
      { method: "POST", accessToken, body: { answers } },
    );
    revalidatePath(`/dashboard/trainings/${enrollmentId}`);
    revalidatePath(`/dashboard/trainings/${enrollmentId}/assessments`);
    revalidatePath("/dashboard");
    return { attempt: result.attempt, assessmentStatus: result.assessmentStatus };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to submit assessment." };
  }
}
