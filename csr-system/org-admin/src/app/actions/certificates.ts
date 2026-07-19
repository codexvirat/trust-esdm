"use server";

import { revalidatePath } from "next/cache";
import { requireOrgAdminRole } from "@/lib/dal";
import { apiFetch, ApiError } from "@/lib/api";
import type { Certificate, CertificateTemplate } from "@/lib/types";

export interface FormState {
  error?: string;
}

export async function issueCertificateAction(
  enrollmentId: string,
  revalidatePathTarget: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { accessToken } = await requireOrgAdminRole();
  const templateId = String(formData.get("templateId") ?? "");

  if (!templateId) {
    return { error: "Choose a certificate template." };
  }

  try {
    await apiFetch<Certificate>(`/enrollments/${enrollmentId}/certificate`, {
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

export async function revokeCertificateAction(certificateId: string, reason: string): Promise<FormState> {
  const { accessToken } = await requireOrgAdminRole();

  try {
    await apiFetch<Certificate>(`/certificates/${certificateId}/revoke`, { method: "POST", accessToken, body: { reason } });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to revoke certificate." };
  }

  revalidatePath("/dashboard/certificates");
  return {};
}

export async function createCertificateTemplateAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { accessToken } = await requireOrgAdminRole();
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return { error: "Template name is required." };
  }

  try {
    await apiFetch<CertificateTemplate>("/certificate-templates", { method: "POST", accessToken, body: { name } });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to create template." };
  }

  revalidatePath("/dashboard/certificate-templates");
  return {};
}
