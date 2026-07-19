"use server";

import { revalidatePath } from "next/cache";
import { requireAdminRole } from "@/lib/dal";
import { apiFetch, ApiError } from "@/lib/api";
import type { Organisation } from "@/lib/types";

export interface FormState {
  error?: string;
}

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function createOrganisationAction(projectId: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  const { accessToken } = await requireAdminRole();

  const name = str(formData, "name");
  const email = str(formData, "email");
  const phone = str(formData, "phone");
  const type = str(formData, "type");
  const addressLine1 = str(formData, "addressLine1");
  const addressLine2 = str(formData, "addressLine2");
  const state = str(formData, "state");
  const district = str(formData, "district");
  const city = str(formData, "city");
  const pincode = str(formData, "pincode");
  const gstin = str(formData, "gstin");
  const pan = str(formData, "pan");
  const shortCode = str(formData, "shortCode");
  const industry = str(formData, "industry");
  const employeeCount = str(formData, "employeeCount");
  const establishedDate = str(formData, "establishedDate");

  if (!name || !email || !phone || !type || !addressLine1 || !addressLine2 || !state || !district || !city || !pincode) {
    return { error: "Name, email, phone, type, and address fields are required." };
  }
  if (!gstin || !pan || !shortCode || !industry || !employeeCount || !establishedDate) {
    return { error: "GSTIN, PAN, short code, industry, employee count, and established date are required." };
  }

  try {
    await apiFetch<Organisation>(`/organisations?projectId=${projectId}`, {
      method: "POST",
      accessToken,
      body: {
        name,
        email,
        phone,
        type,
        addressLine1,
        addressLine2,
        state,
        district,
        city,
        pincode,
        gstin,
        pan,
        shortCode,
        industry,
        employeeCount: Number(employeeCount),
        establishedDate,
      },
    });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to create organisation." };
  }

  revalidatePath("/dashboard/organisations");
  return {};
}

export async function deleteOrganisationAction(projectId: string, organisationId: string): Promise<void> {
  const { accessToken } = await requireAdminRole();
  await apiFetch(`/organisations/${organisationId}?projectId=${projectId}`, { method: "DELETE", accessToken });
  revalidatePath("/dashboard/organisations");
}
