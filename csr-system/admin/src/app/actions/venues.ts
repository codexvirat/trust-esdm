"use server";

import { revalidatePath } from "next/cache";
import { requireAdminRole } from "@/lib/dal";
import { apiFetch, ApiError } from "@/lib/api";
import type { Venue } from "@/lib/types";

export interface FormState {
  error?: string;
}

export async function createVenueAction(projectId: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  const { accessToken } = await requireAdminRole();
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const capacityRaw = String(formData.get("capacity") ?? "").trim();

  if (name.length < 2) {
    return { error: "Name must be at least 2 characters." };
  }

  try {
    await apiFetch<Venue>(`/venues?projectId=${projectId}`, {
      method: "POST",
      accessToken,
      body: {
        name,
        address: address || undefined,
        city: city || undefined,
        capacity: capacityRaw ? Number(capacityRaw) : undefined,
      },
    });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to create venue." };
  }

  revalidatePath("/dashboard/venues");
  return {};
}

export async function deleteVenueAction(projectId: string, venueId: string): Promise<void> {
  const { accessToken } = await requireAdminRole();
  await apiFetch(`/venues/${venueId}?projectId=${projectId}`, { method: "DELETE", accessToken });
  revalidatePath("/dashboard/venues");
}
