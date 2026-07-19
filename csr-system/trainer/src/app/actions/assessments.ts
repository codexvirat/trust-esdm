"use server";

import { revalidatePath } from "next/cache";
import { requireTrainerRole } from "@/lib/dal";
import { apiFetch } from "@/lib/api";

export async function setAssessmentEnabledAction(workshopId: string, batchId: string, assessmentId: string, isEnabled: boolean): Promise<void> {
  const { accessToken } = await requireTrainerRole();
  await apiFetch(`/workshops/${workshopId}/assessments/${assessmentId}/enabled`, { method: "PATCH", accessToken, body: { isEnabled } });
  revalidatePath(`/dashboard/workshops/${workshopId}/batches/${batchId}`);
}
