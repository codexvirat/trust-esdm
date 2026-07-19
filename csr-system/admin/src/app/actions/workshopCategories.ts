"use server";

import { revalidatePath } from "next/cache";
import { requireAdminRole } from "@/lib/dal";
import { apiFetch, ApiError } from "@/lib/api";
import type { WorkshopCategory } from "@/lib/types";

export interface FormState {
  error?: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createWorkshopCategoryAction(projectId: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  const { accessToken } = await requireAdminRole();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (name.length < 2) {
    return { error: "Name must be at least 2 characters." };
  }

  try {
    await apiFetch<WorkshopCategory>(`/workshop-categories?projectId=${projectId}`, {
      method: "POST",
      accessToken,
      body: { name, slug: slugify(name), description: description || undefined },
    });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to create category." };
  }

  revalidatePath("/dashboard/workshop-categories");
  return {};
}

export async function deleteWorkshopCategoryAction(projectId: string, categoryId: string): Promise<void> {
  const { accessToken } = await requireAdminRole();
  await apiFetch(`/workshop-categories/${categoryId}?projectId=${projectId}`, { method: "DELETE", accessToken });
  revalidatePath("/dashboard/workshop-categories");
}
