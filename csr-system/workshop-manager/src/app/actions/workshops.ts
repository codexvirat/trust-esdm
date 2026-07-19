"use server";

import { revalidatePath } from "next/cache";
import { requireWorkshopManagerRole } from "@/lib/dal";
import { apiFetch, ApiError, API_URL } from "@/lib/api";
import type { Batch, TrainerAssignment } from "@/lib/types";

export interface FormState {
  error?: string;
}

export async function setBatchStatusAction(workshopId: string, batchId: string, status: Batch["status"]): Promise<void> {
  const { accessToken } = await requireWorkshopManagerRole();
  await apiFetch(`/workshops/${workshopId}/batches/${batchId}`, { method: "PATCH", accessToken, body: { status } });
  revalidatePath(`/dashboard/workshops/${workshopId}/batches/${batchId}`);
  revalidatePath("/dashboard");
}

export async function updateBatchVenueAction(workshopId: string, batchId: string, venueId: string): Promise<void> {
  const { accessToken } = await requireWorkshopManagerRole();
  await apiFetch(`/workshops/${workshopId}/batches/${batchId}`, { method: "PATCH", accessToken, body: { venueId: venueId || null } });
  revalidatePath(`/dashboard/workshops/${workshopId}/batches/${batchId}`);
  revalidatePath("/dashboard");
}

export async function assignTrainerAction(workshopId: string, batchId: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  const { accessToken } = await requireWorkshopManagerRole();
  const trainerId = String(formData.get("trainerId") ?? "");

  if (!trainerId) {
    return { error: "Choose a trainer to assign." };
  }

  try {
    await apiFetch<TrainerAssignment>(`/workshops/${workshopId}/batches/${batchId}/trainer-assignments`, {
      method: "POST",
      accessToken,
      body: { trainerId },
    });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to assign trainer." };
  }

  revalidatePath("/dashboard");
  return {};
}

export async function removeTrainerAssignmentAction(workshopId: string, batchId: string, assignmentId: string): Promise<void> {
  const { accessToken } = await requireWorkshopManagerRole();
  await apiFetch(`/workshops/${workshopId}/batches/${batchId}/trainer-assignments/${assignmentId}`, { method: "DELETE", accessToken });
  revalidatePath("/dashboard");
}

export interface UploadPhotoState {
  error?: string;
}

export async function uploadBatchPhotoAction(
  workshopId: string,
  batchId: string,
  _prevState: UploadPhotoState,
  formData: FormData,
): Promise<UploadPhotoState> {
  const { accessToken } = await requireWorkshopManagerRole();
  const file = formData.get("photo");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a photo to upload." };
  }

  const uploadBody = new FormData();
  uploadBody.append("photo", file, file.name);

  const res = await fetch(`${API_URL}/workshops/${workshopId}/batches/${batchId}/photos`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: uploadBody,
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    return { error: (payload && typeof payload === "object" && "message" in payload && String(payload.message)) || "Failed to upload photo." };
  }

  revalidatePath(`/dashboard/workshops/${workshopId}/batches/${batchId}`);
  return {};
}

export async function removeBatchPhotoAction(workshopId: string, batchId: string, photoId: string): Promise<void> {
  const { accessToken } = await requireWorkshopManagerRole();
  await apiFetch(`/workshops/${workshopId}/batches/${batchId}/photos/${photoId}`, { method: "DELETE", accessToken });
  revalidatePath(`/dashboard/workshops/${workshopId}/batches/${batchId}`);
}
