"use server";

import { revalidatePath } from "next/cache";
import { requireWorkshopManagerRole } from "@/lib/dal";
import { apiFetch, ApiError, API_URL } from "@/lib/api";
import type { Batch, TrainerAssignment } from "@/lib/types";

export interface FormState {
  error?: string;
}

export async function setBatchStatusAction(workshopId: string, batchId: string, status: Batch["status"]): Promise<string | void> {
  const { accessToken } = await requireWorkshopManagerRole();
  try {
    await apiFetch(`/workshops/${workshopId}/batches/${batchId}`, { method: "PATCH", accessToken, body: { status } });
  } catch (err) {
    return err instanceof ApiError ? err.message : "Failed to update batch status.";
  }
  revalidatePath(`/dashboard/workshops/${workshopId}/batches/${batchId}`);
  revalidatePath("/dashboard");
}

export async function updateBatchVenueAction(workshopId: string, batchId: string, venueId: string): Promise<string | void> {
  const { accessToken } = await requireWorkshopManagerRole();
  try {
    await apiFetch(`/workshops/${workshopId}/batches/${batchId}`, { method: "PATCH", accessToken, body: { venueId: venueId || null } });
  } catch (err) {
    return err instanceof ApiError ? err.message : "Failed to update venue.";
  }
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

export async function removeTrainerAssignmentAction(workshopId: string, batchId: string, assignmentId: string): Promise<string | void> {
  const { accessToken } = await requireWorkshopManagerRole();
  try {
    await apiFetch(`/workshops/${workshopId}/batches/${batchId}/trainer-assignments/${assignmentId}`, { method: "DELETE", accessToken });
  } catch (err) {
    return err instanceof ApiError ? err.message : "Failed to remove trainer.";
  }
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
  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0) {
    return { error: "Choose at least one photo to upload." };
  }

  const uploadBody = new FormData();
  for (const file of files) {
    uploadBody.append("photos", file, file.name);
  }

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

export async function removeBatchPhotoAction(workshopId: string, batchId: string, photoId: string): Promise<string | void> {
  const { accessToken } = await requireWorkshopManagerRole();
  try {
    await apiFetch(`/workshops/${workshopId}/batches/${batchId}/photos/${photoId}`, { method: "DELETE", accessToken });
  } catch (err) {
    return err instanceof ApiError ? err.message : "Failed to remove photo.";
  }
  revalidatePath(`/dashboard/workshops/${workshopId}/batches/${batchId}`);
}
