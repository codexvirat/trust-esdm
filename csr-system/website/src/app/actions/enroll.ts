"use server";

import { apiFetch, ApiError } from "@/lib/api";
import { PROJECT_SLUG } from "@/lib/constants";

export interface EnrollFormState {
  error?: string;
  success?: boolean;
}

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

/** Strips spaces, dashes, a leading +91/91 or 0 — leaves the bare 10-digit mobile number. */
function normaliseMobile(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

export async function submitEnrollAction(_prevState: EnrollFormState, formData: FormData): Promise<EnrollFormState> {
  const workshopId = str(formData, "workshopId");
  const fullName = str(formData, "fullName");
  const email = str(formData, "email");
  const phone = normaliseMobile(str(formData, "phone"));
  const idNumber = str(formData, "idNumber").replace(/\s+/g, "").toUpperCase();
  const gender = str(formData, "gender");
  const companyName = str(formData, "companyName");
  const organisationId = str(formData, "organisationId");
  const address = str(formData, "address");

  if (!workshopId) return { error: "Enrollment is not open right now. Please call us instead." };
  if (fullName.length < 2) return { error: "Please enter your full name." };
  if (!email) return { error: "Please enter a valid email address." };
  if (!/^\d{10}$/.test(phone)) return { error: "Please enter a valid 10-digit mobile number." };
  if (!/^\d{12}$/.test(idNumber) && !/^[A-Z]{5}\d{4}[A-Z]$/.test(idNumber)) {
    return { error: "Please enter a valid 12-digit Aadhaar number or 10-character PAN number." };
  }
  if (!gender) return { error: "Gender is required." };
  if (!companyName) return { error: "Company name is required." };
  if (!address) return { error: "Address is required." };

  try {
    await apiFetch(`/public/${PROJECT_SLUG}/registrations`, {
      method: "POST",
      body: {
        workshopId,
        fullName,
        email,
        phone,
        idNumber,
        gender,
        address: { line1: address },
        organisationId: organisationId || undefined,
        affiliatedOrganisation: organisationId ? undefined : { name: companyName },
        source: "website",
      },
    });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong. Please try again." };
  }

  return { success: true };
}
