"use server";

import { revalidatePath } from "next/cache";
import { requireManagerRole } from "@/lib/dal";
import { apiFetch, ApiError } from "@/lib/api";
import type { AttendanceRecord, AttendanceSession } from "@/lib/types";

export interface FormState {
  error?: string;
}

export async function generateAttendanceSessionAction(
  workshopId: string,
  batchId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { accessToken } = await requireManagerRole();

  const sessionDate = String(formData.get("sessionDate") ?? "");
  const sessionLabel = String(formData.get("sessionLabel") ?? "").trim();

  if (!sessionDate || !sessionLabel) {
    return { error: "Date and label are required." };
  }

  try {
    await apiFetch<AttendanceSession>(`/workshops/${workshopId}/batches/${batchId}/attendance-sessions`, {
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

export async function closeAttendanceSessionAction(workshopId: string, batchId: string, sessionId: string): Promise<string | void> {
  const { accessToken } = await requireManagerRole();
  try {
    await apiFetch(`/workshops/${workshopId}/batches/${batchId}/attendance-sessions/${sessionId}/close`, { method: "PATCH", accessToken });
  } catch (err) {
    return err instanceof ApiError ? err.message : "Failed to close session.";
  }
  revalidatePath(`/dashboard/workshops/${workshopId}/batches/${batchId}`);
}

/**
 * The primary way attendance gets marked — staff scan the candidate's own
 * badge (shown on their dashboard as a QR) rather than the candidate marking
 * themselves. A physical/USB QR scanner behaves as a keyboard: it "types" the
 * scanned value into whatever input is focused and submits — so a plain text
 * field is really a QR-scan target, not just a manual-entry fallback.
 */
export async function scanCandidateBadgeAction(
  workshopId: string,
  batchId: string,
  sessionId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { accessToken } = await requireManagerRole();
  const candidateQrToken = String(formData.get("candidateQrToken") ?? "").trim();

  if (!candidateQrToken) {
    return { error: "Scan or paste the candidate's badge code." };
  }

  try {
    await apiFetch<AttendanceRecord>(`/workshops/${workshopId}/batches/${batchId}/attendance-sessions/${sessionId}/scan-candidate`, {
      method: "POST",
      accessToken,
      body: { candidateQrToken },
    });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to mark attendance from that badge." };
  }

  revalidatePath(`/dashboard/workshops/${workshopId}/batches/${batchId}`);
  return {};
}

export async function markAllPresentAction(workshopId: string, batchId: string, sessionId: string): Promise<string | void> {
  const { accessToken } = await requireManagerRole();
  try {
    await apiFetch(`/workshops/${workshopId}/batches/${batchId}/attendance-sessions/${sessionId}/records/mark-all-present`, {
      method: "POST",
      accessToken,
    });
  } catch (err) {
    return err instanceof ApiError ? err.message : "Failed to mark all present.";
  }
  revalidatePath(`/dashboard/workshops/${workshopId}/batches/${batchId}`);
}

export async function markAttendanceManuallyAction(
  workshopId: string,
  batchId: string,
  sessionId: string,
  candidateUserId: string,
  status: "present" | "late" | "absent",
): Promise<string | void> {
  const { accessToken } = await requireManagerRole();
  try {
    await apiFetch(`/workshops/${workshopId}/batches/${batchId}/attendance-sessions/${sessionId}/records`, {
      method: "POST",
      accessToken,
      body: { candidateUserId, status },
    });
  } catch (err) {
    return err instanceof ApiError ? err.message : "Failed to mark attendance.";
  }
  revalidatePath(`/dashboard/workshops/${workshopId}/batches/${batchId}`);
}
