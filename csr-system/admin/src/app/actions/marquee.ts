"use server";

import { revalidatePath } from "next/cache";
import { requireAdminRole } from "@/lib/dal";
import { apiFetch, ApiError } from "@/lib/api";
import type { Marquee } from "@/lib/types";

export interface FormState {
  error?: string;
}

export async function createMarqueeAction(projectId: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  const { accessToken } = await requireAdminRole();
  const message = String(formData.get("message") ?? "").trim();
  const linkTarget = String(formData.get("linkTarget") ?? "").trim();

  if (!message) {
    return { error: "Message is required." };
  }

  try {
    await apiFetch<Marquee>(`/marquee?projectId=${projectId}`, {
      method: "POST",
      accessToken,
      body: { message, linkTarget: linkTarget || undefined },
    });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to create marquee item." };
  }

  revalidatePath("/dashboard/marquee");
  return {};
}

export async function toggleMarqueeAction(projectId: string, marqueeId: string, isActive: boolean): Promise<void> {
  const { accessToken } = await requireAdminRole();
  await apiFetch(`/marquee/${marqueeId}?projectId=${projectId}`, { method: "PATCH", accessToken, body: { isActive } });
  revalidatePath("/dashboard/marquee");
}

export async function deleteMarqueeAction(projectId: string, marqueeId: string): Promise<void> {
  const { accessToken } = await requireAdminRole();
  await apiFetch(`/marquee/${marqueeId}?projectId=${projectId}`, { method: "DELETE", accessToken });
  revalidatePath("/dashboard/marquee");
}
