"use server";

import { revalidatePath } from "next/cache";
import { requireTrainerRole } from "@/lib/dal";
import { apiFetch } from "@/lib/api";

export async function setFeedbackEnabledAction(workshopId: string, batchId: string, formId: string, isEnabled: boolean): Promise<void> {
  const { accessToken } = await requireTrainerRole();
  await apiFetch(`/workshops/${workshopId}/feedback-forms/${formId}/enabled`, { method: "PATCH", accessToken, body: { isEnabled } });
  revalidatePath(`/dashboard/workshops/${workshopId}/batches/${batchId}`);
}
