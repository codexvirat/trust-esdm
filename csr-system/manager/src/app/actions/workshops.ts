"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireManagerRole } from "@/lib/dal";
import { apiFetch, ApiError, API_URL } from "@/lib/api";
import type { WorkshopSummary, Batch, TrainerAssignment, WorkshopManagerAssignment } from "@/lib/types";

export interface FormState {
  error?: string;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createWorkshopAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { accessToken } = await requireManagerRole();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const type = String(formData.get("type") ?? "workshop");
  const mode = String(formData.get("mode") ?? "offline");
  const capacityRaw = String(formData.get("capacity") ?? "").trim();

  if (!title || !description) {
    return { error: "Title and description are required." };
  }
  if (description.length < 10) {
    return { error: "Description must be at least 10 characters." };
  }

  let created: WorkshopSummary;
  try {
    created = await apiFetch<WorkshopSummary>("/workshops", {
      method: "POST",
      accessToken,
      body: {
        title,
        slug: slugify(title),
        description,
        type,
        mode,
        capacity: capacityRaw ? Number(capacityRaw) : undefined,
      },
    });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to create workshop." };
  }

  revalidatePath("/dashboard/workshops");
  redirect(`/dashboard/workshops/${created._id}`);
}

export async function setWorkshopStatusAction(workshopId: string, status: WorkshopSummary["status"]): Promise<void> {
  const { accessToken } = await requireManagerRole();
  await apiFetch(`/workshops/${workshopId}/status`, { method: "PATCH", accessToken, body: { status } });
  revalidatePath("/dashboard/workshops");
  revalidatePath(`/dashboard/workshops/${workshopId}`);
}

export async function updateWorkshopAction(workshopId: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  const { accessToken } = await requireManagerRole();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const type = String(formData.get("type") ?? "workshop");
  const mode = String(formData.get("mode") ?? "offline");
  const capacityRaw = String(formData.get("capacity") ?? "").trim();

  if (!title || !description) {
    return { error: "Title and description are required." };
  }
  if (description.length < 10) {
    return { error: "Description must be at least 10 characters." };
  }

  try {
    await apiFetch<WorkshopSummary>(`/workshops/${workshopId}`, {
      method: "PATCH",
      accessToken,
      body: {
        title,
        slug: slugify(title),
        description,
        type,
        mode,
        capacity: capacityRaw ? Number(capacityRaw) : undefined,
      },
    });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to update workshop." };
  }

  revalidatePath("/dashboard/workshops");
  revalidatePath(`/dashboard/workshops/${workshopId}`);
  return {};
}

export async function deleteWorkshopAction(workshopId: string): Promise<void> {
  const { accessToken } = await requireManagerRole();
  await apiFetch(`/workshops/${workshopId}`, { method: "DELETE", accessToken });
  revalidatePath("/dashboard/workshops");
  redirect("/dashboard/workshops");
}

export async function createBatchAction(workshopId: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  const { accessToken } = await requireManagerRole();

  const code = String(formData.get("code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  const capacityRaw = String(formData.get("capacity") ?? "").trim();
  const venueId = String(formData.get("venueId") ?? "").trim();

  if (!code || !name || !startDate || !endDate) {
    return { error: "Code, name, start date, and end date are required." };
  }

  try {
    await apiFetch<Batch>(`/workshops/${workshopId}/batches`, {
      method: "POST",
      accessToken,
      body: { code, name, startDate, endDate, capacity: capacityRaw ? Number(capacityRaw) : undefined, venueId: venueId || undefined },
    });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to create batch." };
  }

  revalidatePath(`/dashboard/workshops/${workshopId}`);
  return {};
}

export async function setBatchStatusAction(workshopId: string, batchId: string, status: Batch["status"]): Promise<void> {
  const { accessToken } = await requireManagerRole();
  await apiFetch(`/workshops/${workshopId}/batches/${batchId}`, { method: "PATCH", accessToken, body: { status } });
  revalidatePath(`/dashboard/workshops/${workshopId}`);
}

export async function updateBatchVenueAction(workshopId: string, batchId: string, venueId: string): Promise<void> {
  const { accessToken } = await requireManagerRole();
  await apiFetch(`/workshops/${workshopId}/batches/${batchId}`, { method: "PATCH", accessToken, body: { venueId: venueId || null } });
  revalidatePath(`/dashboard/workshops/${workshopId}`);
}

export async function deleteBatchAction(workshopId: string, batchId: string): Promise<void> {
  const { accessToken } = await requireManagerRole();
  await apiFetch(`/workshops/${workshopId}/batches/${batchId}`, { method: "DELETE", accessToken });
  revalidatePath(`/dashboard/workshops/${workshopId}`);
}

export async function assignTrainerAction(workshopId: string, batchId: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  const { accessToken } = await requireManagerRole();
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

  revalidatePath(`/dashboard/workshops/${workshopId}`);
  return {};
}

export async function removeTrainerAssignmentAction(workshopId: string, batchId: string, assignmentId: string): Promise<void> {
  const { accessToken } = await requireManagerRole();
  await apiFetch(`/workshops/${workshopId}/batches/${batchId}/trainer-assignments/${assignmentId}`, { method: "DELETE", accessToken });
  revalidatePath(`/dashboard/workshops/${workshopId}`);
}

export async function assignWorkshopManagerAction(
  workshopId: string,
  batchId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { accessToken } = await requireManagerRole();
  const workshopManagerId = String(formData.get("workshopManagerId") ?? "");

  if (!workshopManagerId) {
    return { error: "Choose a workshop manager to assign." };
  }

  try {
    await apiFetch<WorkshopManagerAssignment>(`/workshops/${workshopId}/batches/${batchId}/workshop-manager-assignments`, {
      method: "POST",
      accessToken,
      body: { workshopManagerId },
    });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to assign workshop manager." };
  }

  revalidatePath(`/dashboard/workshops/${workshopId}`);
  return {};
}

export async function removeWorkshopManagerAssignmentAction(workshopId: string, batchId: string, assignmentId: string): Promise<void> {
  const { accessToken } = await requireManagerRole();
  await apiFetch(`/workshops/${workshopId}/batches/${batchId}/workshop-manager-assignments/${assignmentId}`, {
    method: "DELETE",
    accessToken,
  });
  revalidatePath(`/dashboard/workshops/${workshopId}`);
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
  const { accessToken } = await requireManagerRole();
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
  const { accessToken } = await requireManagerRole();
  await apiFetch(`/workshops/${workshopId}/batches/${batchId}/photos/${photoId}`, { method: "DELETE", accessToken });
  revalidatePath(`/dashboard/workshops/${workshopId}/batches/${batchId}`);
}
