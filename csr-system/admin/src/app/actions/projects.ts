"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminRole } from "@/lib/dal";
import { apiFetch, ApiError } from "@/lib/api";
import type { Project } from "@/lib/types";

export interface FormState {
  error?: string;
}

export async function createProjectAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { accessToken } = await requireAdminRole();

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const contactEmail = String(formData.get("contactEmail") ?? "").trim();
  const contactPhone = String(formData.get("contactPhone") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();

  if (!name || !slug || !type || !contactEmail) {
    return { error: "Name, slug, type, and contact email are required." };
  }

  try {
    await apiFetch<Project>("/projects", {
      method: "POST",
      accessToken,
      body: { name, slug, type, contactEmail, contactPhone: contactPhone || undefined, website: website || undefined },
    });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to create project." };
  }

  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard");
  return {};
}

export async function setProjectStatusAction(projectId: string, status: "active" | "suspended" | "inactive"): Promise<void> {
  const { accessToken } = await requireAdminRole();
  await apiFetch(`/projects/${projectId}`, { method: "PATCH", accessToken, body: { status } });
  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard");
}

export async function updateProjectAction(projectId: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  const { accessToken } = await requireAdminRole();

  const name = String(formData.get("name") ?? "").trim();
  const contactEmail = String(formData.get("contactEmail") ?? "").trim();
  const contactPhone = String(formData.get("contactPhone") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();

  if (!name || !contactEmail) {
    return { error: "Name and contact email are required." };
  }

  try {
    await apiFetch(`/projects/${projectId}`, {
      method: "PATCH",
      accessToken,
      body: { name, contactEmail, contactPhone: contactPhone || undefined, website: website || undefined },
    });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to update project." };
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard/projects");
  return {};
}

export async function deleteProjectAction(projectId: string): Promise<void> {
  const { accessToken } = await requireAdminRole();
  await apiFetch(`/projects/${projectId}`, { method: "DELETE", accessToken });
  revalidatePath("/dashboard/projects");
  redirect("/dashboard/projects");
}
