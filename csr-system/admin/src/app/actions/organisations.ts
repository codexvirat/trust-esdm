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

function orgBodyFromForm(formData: FormData) {
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
  const cin = str(formData, "cin");
  const udyamNumber = str(formData, "udyamNumber");
  const shortCode = str(formData, "shortCode");
  const industry = str(formData, "industry");
  const employeeCount = str(formData, "employeeCount");
  const establishedDate = str(formData, "establishedDate");

  return {
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
    cin,
    udyamNumber,
    shortCode,
    industry,
    employeeCount,
    establishedDate,
  };
}

export async function createOrganisationAction(projectId: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  const { accessToken } = await requireAdminRole();
  const fields = orgBodyFromForm(formData);

  if (!fields.name) {
    return { error: "Organisation name is required." };
  }
  if (!fields.email && !fields.phone) {
    return { error: "Provide at least an email or a phone number for the company." };
  }

  try {
    await apiFetch<Organisation>(`/organisations?projectId=${projectId}`, {
      method: "POST",
      accessToken,
      body: {
        name: fields.name,
        email: fields.email || undefined,
        phone: fields.phone || undefined,
        type: fields.type || undefined,
        addressLine1: fields.addressLine1 || undefined,
        addressLine2: fields.addressLine2 || undefined,
        state: fields.state || undefined,
        district: fields.district || undefined,
        city: fields.city || undefined,
        pincode: fields.pincode || undefined,
        gstin: fields.gstin || undefined,
        pan: fields.pan || undefined,
        cin: fields.cin || undefined,
        udyamNumber: fields.udyamNumber || undefined,
        shortCode: fields.shortCode || undefined,
        industry: fields.industry || undefined,
        employeeCount: fields.employeeCount ? Number(fields.employeeCount) : undefined,
        establishedDate: fields.establishedDate || undefined,
      },
    });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to create organisation." };
  }

  revalidatePath("/dashboard/organisations");
  return {};
}

export async function updateOrganisationAction(
  projectId: string,
  organisationId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { accessToken } = await requireAdminRole();
  const fields = orgBodyFromForm(formData);

  if (!fields.name) {
    return { error: "Organisation name is required." };
  }
  if (!fields.email && !fields.phone) {
    return { error: "Provide at least an email or a phone number for the company." };
  }

  try {
    await apiFetch<Organisation>(`/organisations/${organisationId}?projectId=${projectId}`, {
      method: "PATCH",
      accessToken,
      body: {
        name: fields.name,
        email: fields.email || undefined,
        phone: fields.phone || undefined,
        type: fields.type || undefined,
        addressLine1: fields.addressLine1 || undefined,
        addressLine2: fields.addressLine2 || undefined,
        state: fields.state || undefined,
        district: fields.district || undefined,
        city: fields.city || undefined,
        pincode: fields.pincode || undefined,
        gstin: fields.gstin || undefined,
        pan: fields.pan || undefined,
        cin: fields.cin || undefined,
        udyamNumber: fields.udyamNumber || undefined,
        shortCode: fields.shortCode || undefined,
        industry: fields.industry || undefined,
        employeeCount: fields.employeeCount ? Number(fields.employeeCount) : undefined,
        establishedDate: fields.establishedDate || undefined,
      },
    });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to update organisation." };
  }

  revalidatePath("/dashboard/organisations");
  return {};
}

export async function deleteOrganisationAction(projectId: string, organisationId: string): Promise<void> {
  const { accessToken } = await requireAdminRole();
  await apiFetch(`/organisations/${organisationId}?projectId=${projectId}`, { method: "DELETE", accessToken });
  revalidatePath("/dashboard/organisations");
}
