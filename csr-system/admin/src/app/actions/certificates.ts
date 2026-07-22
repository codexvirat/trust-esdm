"use server";

import { revalidatePath } from "next/cache";
import { requireAdminRole } from "@/lib/dal";
import { apiFetch, ApiError, API_URL } from "@/lib/api";
import type { BatchGenerateResult, BatchPublishResult, Certificate, CertificateTemplate } from "@/lib/types";

export interface FormState {
  error?: string;
}

export async function issueCertificateAction(
  projectId: string,
  enrollmentId: string,
  revalidatePathTarget: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { accessToken } = await requireAdminRole();
  const templateId = String(formData.get("templateId") ?? "");

  if (!templateId) {
    return { error: "Choose a certificate template." };
  }

  try {
    await apiFetch<Certificate>(`/enrollments/${enrollmentId}/certificate?projectId=${projectId}`, {
      method: "POST",
      accessToken,
      body: { templateId },
    });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to issue certificate." };
  }

  revalidatePath(revalidatePathTarget);
  return {};
}

export async function revokeCertificateAction(projectId: string, certificateId: string, reason: string): Promise<FormState> {
  const { accessToken } = await requireAdminRole();

  try {
    await apiFetch<Certificate>(`/certificates/${certificateId}/revoke?projectId=${projectId}`, {
      method: "POST",
      accessToken,
      body: { reason },
    });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to revoke certificate." };
  }

  revalidatePath("/dashboard/certificates");
  return {};
}

export async function createCertificateTemplateAction(projectId: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  const { accessToken } = await requireAdminRole();
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return { error: "Template name is required." };
  }

  try {
    await apiFetch<CertificateTemplate>(`/certificate-templates?projectId=${projectId}`, { method: "POST", accessToken, body: { name } });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to create template." };
  }

  revalidatePath("/dashboard/certificate-templates");
  return {};
}

export async function uploadCertificateTemplateAction(projectId: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  const { accessToken } = await requireAdminRole();
  const name = String(formData.get("name") ?? "").trim();
  const file = formData.get("background");

  if (!name) {
    return { error: "Template name is required." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a background image to upload." };
  }

  const locationFilledIn = formData.get("locationFilledIn") === "true";
  const dateFilledIn = formData.get("dateFilledIn") === "true";
  const qrFilledIn = formData.get("qrFilledIn") === "true";

  const uploadBody = new FormData();
  uploadBody.append("name", name);
  uploadBody.append("background", file, file.name);
  if (locationFilledIn || dateFilledIn || qrFilledIn) {
    uploadBody.append(
      "layoutConfig",
      JSON.stringify({
        location: locationFilledIn ? null : undefined,
        issueDate: dateFilledIn ? null : undefined,
        qr: qrFilledIn ? null : undefined,
      }),
    );
  }

  const res = await fetch(`${API_URL}/certificate-templates/upload?projectId=${projectId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: uploadBody,
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    return { error: (payload && typeof payload === "object" && "message" in payload && String(payload.message)) || "Failed to upload template." };
  }

  revalidatePath("/dashboard/certificate-templates");
  return {};
}

export async function deleteCertificateTemplateAction(projectId: string, templateId: string): Promise<void> {
  const { accessToken } = await requireAdminRole();
  await apiFetch(`/certificate-templates/${templateId}?projectId=${projectId}`, { method: "DELETE", accessToken });
  revalidatePath("/dashboard/certificate-templates");
}

export interface GenerateBatchState {
  error?: string;
  result?: BatchGenerateResult;
}

export async function generateCertificatesForBatchAction(
  projectId: string,
  workshopId: string,
  batchId: string,
  _prevState: GenerateBatchState,
  formData: FormData,
): Promise<GenerateBatchState> {
  const { accessToken } = await requireAdminRole();
  const templateId = String(formData.get("templateId") ?? "");

  if (!templateId) {
    return { error: "Choose a certificate template." };
  }

  try {
    const result = await apiFetch<BatchGenerateResult>(
      `/workshops/${workshopId}/batches/${batchId}/certificates/generate?projectId=${projectId}`,
      { method: "POST", accessToken, body: { templateId } },
    );
    revalidatePath(`/dashboard/workshops/${workshopId}/batches/${batchId}`);
    return { result };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to generate certificates." };
  }
}

export interface PublishBatchState {
  error?: string;
  result?: BatchPublishResult;
}

export async function publishCertificatesForBatchAction(
  projectId: string,
  workshopId: string,
  batchId: string,
  _prevState: PublishBatchState,
): Promise<PublishBatchState> {
  const { accessToken } = await requireAdminRole();

  try {
    const result = await apiFetch<BatchPublishResult>(
      `/workshops/${workshopId}/batches/${batchId}/certificates/publish?projectId=${projectId}`,
      { method: "POST", accessToken },
    );
    revalidatePath(`/dashboard/workshops/${workshopId}/batches/${batchId}`);
    return { result };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to publish certificates." };
  }
}

export interface DiscardDraftsState {
  error?: string;
  result?: { discarded: number };
}

export async function discardDraftCertificatesForBatchAction(
  projectId: string,
  workshopId: string,
  batchId: string,
  _prevState: DiscardDraftsState,
): Promise<DiscardDraftsState> {
  const { accessToken } = await requireAdminRole();

  try {
    const result = await apiFetch<{ discarded: number }>(
      `/workshops/${workshopId}/batches/${batchId}/certificates/drafts?projectId=${projectId}`,
      { method: "DELETE", accessToken },
    );
    revalidatePath(`/dashboard/workshops/${workshopId}/batches/${batchId}`);
    return { result };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to discard draft certificates." };
  }
}
