"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminRole } from "@/lib/dal";
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

export async function createWorkshopAction(projectId: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  const { accessToken } = await requireAdminRole();

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
    created = await apiFetch<WorkshopSummary>(`/workshops?projectId=${projectId}`, {
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
  redirect(`/dashboard/workshops/${created._id}?projectId=${projectId}`);
}

export async function setWorkshopStatusAction(projectId: string, workshopId: string, status: WorkshopSummary["status"]): Promise<void> {
  const { accessToken } = await requireAdminRole();
  await apiFetch(`/workshops/${workshopId}/status?projectId=${projectId}`, { method: "PATCH", accessToken, body: { status } });
  revalidatePath("/dashboard/workshops");
  revalidatePath(`/dashboard/workshops/${workshopId}`);
}

export async function updateWorkshopAction(
  projectId: string,
  workshopId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { accessToken } = await requireAdminRole();

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
    await apiFetch<WorkshopSummary>(`/workshops/${workshopId}?projectId=${projectId}`, {
      method: "PATCH",
      accessToken,
      body: {
        title,
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

export async function deleteWorkshopAction(projectId: string, workshopId: string): Promise<void> {
  const { accessToken } = await requireAdminRole();
  await apiFetch(`/workshops/${workshopId}?projectId=${projectId}`, { method: "DELETE", accessToken });
  revalidatePath("/dashboard/workshops");
  redirect("/dashboard/workshops");
}

export async function createBatchAction(
  projectId: string,
  workshopId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { accessToken } = await requireAdminRole();

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
    await apiFetch<Batch>(`/workshops/${workshopId}/batches?projectId=${projectId}`, {
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

export async function setBatchStatusAction(projectId: string, workshopId: string, batchId: string, status: Batch["status"]): Promise<void> {
  const { accessToken } = await requireAdminRole();
  await apiFetch(`/workshops/${workshopId}/batches/${batchId}?projectId=${projectId}`, { method: "PATCH", accessToken, body: { status } });
  revalidatePath(`/dashboard/workshops/${workshopId}`);
}

export async function updateBatchVenueAction(projectId: string, workshopId: string, batchId: string, venueId: string): Promise<void> {
  const { accessToken } = await requireAdminRole();
  await apiFetch(`/workshops/${workshopId}/batches/${batchId}?projectId=${projectId}`, {
    method: "PATCH",
    accessToken,
    body: { venueId: venueId || null },
  });
  revalidatePath(`/dashboard/workshops/${workshopId}`);
}

export async function deleteBatchAction(projectId: string, workshopId: string, batchId: string): Promise<void> {
  const { accessToken } = await requireAdminRole();
  await apiFetch(`/workshops/${workshopId}/batches/${batchId}?projectId=${projectId}`, { method: "DELETE", accessToken });
  revalidatePath(`/dashboard/workshops/${workshopId}`);
}

export async function assignTrainerAction(
  projectId: string,
  workshopId: string,
  batchId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { accessToken } = await requireAdminRole();
  const trainerId = String(formData.get("trainerId") ?? "");

  if (!trainerId) {
    return { error: "Choose a trainer to assign." };
  }

  try {
    await apiFetch<TrainerAssignment>(`/workshops/${workshopId}/batches/${batchId}/trainer-assignments?projectId=${projectId}`, {
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

export async function removeTrainerAssignmentAction(
  projectId: string,
  workshopId: string,
  batchId: string,
  assignmentId: string,
): Promise<void> {
  const { accessToken } = await requireAdminRole();
  await apiFetch(`/workshops/${workshopId}/batches/${batchId}/trainer-assignments/${assignmentId}?projectId=${projectId}`, {
    method: "DELETE",
    accessToken,
  });
  revalidatePath(`/dashboard/workshops/${workshopId}`);
}

export async function assignWorkshopManagerAction(
  projectId: string,
  workshopId: string,
  batchId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { accessToken } = await requireAdminRole();
  const workshopManagerId = String(formData.get("workshopManagerId") ?? "");

  if (!workshopManagerId) {
    return { error: "Choose a workshop manager to assign." };
  }

  try {
    await apiFetch<WorkshopManagerAssignment>(`/workshops/${workshopId}/batches/${batchId}/workshop-manager-assignments?projectId=${projectId}`, {
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

export async function removeWorkshopManagerAssignmentAction(
  projectId: string,
  workshopId: string,
  batchId: string,
  assignmentId: string,
): Promise<void> {
  const { accessToken } = await requireAdminRole();
  await apiFetch(`/workshops/${workshopId}/batches/${batchId}/workshop-manager-assignments/${assignmentId}?projectId=${projectId}`, {
    method: "DELETE",
    accessToken,
  });
  revalidatePath(`/dashboard/workshops/${workshopId}`);
}

export interface UploadPhotoState {
  error?: string;
}

export async function uploadBatchPhotoAction(
  projectId: string,
  workshopId: string,
  batchId: string,
  _prevState: UploadPhotoState,
  formData: FormData,
): Promise<UploadPhotoState> {
  const { accessToken } = await requireAdminRole();
  const file = formData.get("photo");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a photo to upload." };
  }

  const uploadBody = new FormData();
  uploadBody.append("photo", file, file.name);

  const res = await fetch(`${API_URL}/workshops/${workshopId}/batches/${batchId}/photos?projectId=${projectId}`, {
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

export async function removeBatchPhotoAction(projectId: string, workshopId: string, batchId: string, photoId: string): Promise<void> {
  const { accessToken } = await requireAdminRole();
  await apiFetch(`/workshops/${workshopId}/batches/${batchId}/photos/${photoId}?projectId=${projectId}`, { method: "DELETE", accessToken });
  revalidatePath(`/dashboard/workshops/${workshopId}/batches/${batchId}`);
}

export async function addDayPlanEntryAction(
  projectId: string,
  workshopId: string,
  batchId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { accessToken } = await requireAdminRole();

  const date = String(formData.get("date") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const assignedToUserId = String(formData.get("assignedToUserId") ?? "").trim();

  if (!date || !title) {
    return { error: "Date and title are required." };
  }

  try {
    await apiFetch(`/workshops/${workshopId}/batches/${batchId}/day-plan?projectId=${projectId}`, {
      method: "POST",
      accessToken,
      body: { date, title, assignedToUserId: assignedToUserId || undefined },
    });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to add day-plan entry." };
  }

  revalidatePath(`/dashboard/workshops/${workshopId}/batches/${batchId}`);
  return {};
}

export async function removeDayPlanEntryAction(projectId: string, workshopId: string, batchId: string, entryId: string): Promise<void> {
  const { accessToken } = await requireAdminRole();
  await apiFetch(`/workshops/${workshopId}/batches/${batchId}/day-plan/${entryId}?projectId=${projectId}`, {
    method: "DELETE",
    accessToken,
  });
  revalidatePath(`/dashboard/workshops/${workshopId}/batches/${batchId}`);
}
