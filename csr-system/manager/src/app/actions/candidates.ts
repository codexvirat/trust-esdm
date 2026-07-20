"use server";

import { revalidatePath } from "next/cache";
import { requireManagerRole } from "@/lib/dal";
import { apiFetch, ApiError } from "@/lib/api";
import type { CandidateProfile, UserSummary } from "@/lib/types";

export interface FormState {
  error?: string;
}

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function registerCandidateProfileAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { accessToken } = await requireManagerRole();

  const firstName = str(formData, "firstName");
  const lastName = str(formData, "lastName");
  const email = str(formData, "email");
  const phone = str(formData, "phone");
  const alternatePhone = str(formData, "alternatePhone");
  const dob = str(formData, "dob");
  const bloodGroup = str(formData, "bloodGroup");

  if (!firstName || !lastName) return { error: "First name and last name are required." };
  if (!email) return { error: "Email is required." };
  if (!phone) return { error: "Contact number is required." };
  if (!dob) return { error: "Date of birth is required." };

  const orgName = str(formData, "orgName");
  let affiliatedOrganisation: Record<string, unknown> | undefined;
  if (orgName) {
    const orgEmail = str(formData, "orgEmail");
    const orgType = str(formData, "orgType");
    const orgAddressLine1 = str(formData, "orgAddressLine1");
    const orgState = str(formData, "orgState");
    const orgDistrict = str(formData, "orgDistrict");
    const orgCity = str(formData, "orgCity");
    const orgPincode = str(formData, "orgPincode");
    const shortCode = str(formData, "shortCode");
    const industry = str(formData, "industry");
    const employeeCount = str(formData, "employeeCount");
    const establishedDate = str(formData, "establishedDate");

    if (!orgEmail || !orgType || !orgAddressLine1 || !orgState || !orgDistrict || !orgCity || !orgPincode) {
      return { error: "All required Organisation Details fields must be filled if you're capturing an affiliated organisation." };
    }
    if (!shortCode || !industry || !employeeCount || !establishedDate) {
      return { error: "All required Additional Information fields must be filled if you're capturing an affiliated organisation." };
    }

    affiliatedOrganisation = {
      name: orgName,
      email: orgEmail,
      phone: str(formData, "orgPhone") || undefined,
      type: orgType,
      addressLine1: orgAddressLine1,
      addressLine2: str(formData, "orgAddressLine2") || undefined,
      state: orgState,
      district: orgDistrict,
      city: orgCity,
      pincode: orgPincode,
      gstin: str(formData, "gstin") || undefined,
      pan: str(formData, "pan") || undefined,
      shortCode,
      industry,
      employeeCount: Number(employeeCount),
      establishedDate,
    };
  }

  try {
    await apiFetch("/users", {
      method: "POST",
      accessToken,
      body: {
        roleCode: "candidate",
        fullName: `${firstName} ${lastName}`,
        email,
        phone,
        candidateProfile: {
          dob,
          bloodGroup: bloodGroup || undefined,
          alternatePhone: alternatePhone || undefined,
          affiliatedOrganisation,
        },
      },
    });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to register candidate." };
  }

  revalidatePath("/dashboard/candidates");
  return {};
}

export async function deleteCandidateAction(candidateId: string): Promise<void> {
  const { accessToken } = await requireManagerRole();
  await apiFetch(`/users/${candidateId}`, { method: "DELETE", accessToken });
  revalidatePath("/dashboard/candidates");
  revalidatePath("/dashboard");
}

export async function getCandidateProfileAction(candidateId: string) {
  const { accessToken } = await requireManagerRole();
  return apiFetch<{ user: UserSummary; profile: CandidateProfile | null }>(`/users/${candidateId}/candidate-profile`, { accessToken });
}

export async function enrollCandidateAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { accessToken } = await requireManagerRole();

  const candidateUserId = str(formData, "candidateUserId");
  const workshopId = str(formData, "workshopId");
  const batchId = str(formData, "batchId");

  if (!workshopId || !batchId) {
    return { error: "Choose a workshop and a batch." };
  }

  try {
    await apiFetch("/enrollments", { method: "POST", accessToken, body: { candidateUserId, workshopId, batchId } });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Failed to enroll candidate." };
  }

  revalidatePath("/dashboard/candidates");
  revalidatePath("/dashboard");
  return {};
}
