"use server";

import { revalidatePath } from "next/cache";
import { requireAdminRole } from "@/lib/dal";
import { apiFetch, ApiError } from "@/lib/api";
import type { AttendanceRecord, AttendanceSession } from "@/lib/types";

export interface FormState {
  error?: string;
}

export async function generateAttendanceSessionAction(
  projectId: string,
  workshopId: string,
  batchId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { accessToken } = await requireAdminRole();

  const sessionDate = String(formData.get("sessionDate") ?? "");
  const sessionLabel = String(formData.get("sessionLabel") ?? "").trim();

  if (!sessionDate || !sessionLabel) {
    return { error: "Date and label are required." };
  }

  try {
    await apiFetch<AttendanceSession>(`/workshops/${workshopId}/batches/${batchId}/attendance-sessions?projectId=${projectId}`, {
      method: "POST",
      accessToken,
      body: { sessionDate, sessionLabel, expiresInMinutes: 480 },
    });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to open session." };
  }

  revalidatePath(`/dashboard/workshops/${workshopId}/batches/${batchId}`);
  return {};
}

export async function closeAttendanceSessionAction(projectId: string, workshopId: string, batchId: string, sessionId: string): Promise<void> {
  const { accessToken } = await requireAdminRole();
  await apiFetch(`/workshops/${workshopId}/batches/${batchId}/attendance-sessions/${sessionId}/close?projectId=${projectId}`, {
    method: "PATCH",
    accessToken,
  });
  revalidatePath(`/dashboard/workshops/${workshopId}/batches/${batchId}`);
}

export async function scanCandidateBadgeAction(
  projectId: string,
  workshopId: string,
  batchId: string,
  sessionId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { accessToken } = await requireAdminRole();
  const candidateQrToken = String(formData.get("candidateQrToken") ?? "").trim();

  if (!candidateQrToken) {
    return { error: "Scan or paste the candidate's badge code." };
  }

  try {
    await apiFetch<AttendanceRecord>(
      `/workshops/${workshopId}/batches/${batchId}/attendance-sessions/${sessionId}/scan-candidate?projectId=${projectId}`,
      { method: "POST", accessToken, body: { candidateQrToken } },
    );
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to mark attendance from that badge." };
  }

  revalidatePath(`/dashboard/workshops/${workshopId}/batches/${batchId}`);
  return {};
}

export async function markAttendanceManuallyAction(
  projectId: string,
  workshopId: string,
  batchId: string,
  sessionId: string,
  candidateUserId: string,
  status: "present" | "late" | "absent",
): Promise<void> {
  const { accessToken } = await requireAdminRole();
  await apiFetch(`/workshops/${workshopId}/batches/${batchId}/attendance-sessions/${sessionId}/records?projectId=${projectId}`, {
    method: "POST",
    accessToken,
    body: { candidateUserId, status },
  });
  revalidatePath(`/dashboard/workshops/${workshopId}/batches/${batchId}`);
}
