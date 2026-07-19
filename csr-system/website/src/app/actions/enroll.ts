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

export async function submitEnrollAction(_prevState: EnrollFormState, formData: FormData): Promise<EnrollFormState> {
  const workshopId = str(formData, "workshopId");
  const firstName = str(formData, "firstName");
  const lastName = str(formData, "lastName");
  const email = str(formData, "email");
  const phone = str(formData, "phone");
  const alternatePhone = str(formData, "alternatePhone");
  const dob = str(formData, "dob");
  const bloodGroup = str(formData, "bloodGroup");
  const gender = str(formData, "gender");

  if (!workshopId) return { error: "Please choose which track interests you." };
  if (!firstName || !lastName) return { error: "First name and last name are required." };
  if (!email) return { error: "Please enter a valid email address." };
  if (!phone || phone.replace(/\D/g, "").length < 6) return { error: "Please enter a valid phone number." };
  if (!alternatePhone) return { error: "Alternate mobile number is required." };
  if (!dob) return { error: "Date of birth is required." };
  if (!bloodGroup) return { error: "Blood group is required." };
  if (!gender) return { error: "Gender is required." };

  const addressLine1 = str(formData, "addressLine1");
  const addressLine2 = str(formData, "addressLine2");
  const city = str(formData, "city");
  const state = str(formData, "state");
  const country = str(formData, "country");
  const pincode = str(formData, "pincode");
  if (!addressLine1 || !addressLine2 || !city || !state || !country || !pincode) {
    return { error: "All Address fields are required." };
  }
  const address = { line1: addressLine1, line2: addressLine2, city, state, country, pincode };

  const degree = str(formData, "degree");
  const institution = str(formData, "institution");
  const fieldOfStudy = str(formData, "fieldOfStudy");
  const grade = str(formData, "grade");
  const startYear = str(formData, "startYear");
  const endYear = str(formData, "endYear");
  if (!degree || !institution || !fieldOfStudy || !grade || !startYear || !endYear) {
    return { error: "All Education fields are required." };
  }
  const educationSnapshot = [
    { degree, institution, fieldOfStudy, startYear: Number(startYear), endYear: Number(endYear), grade },
  ];

  const skillsRaw = str(formData, "skills");
  if (!skillsRaw) return { error: "Please list at least one skill." };
  const skillsSnapshot = skillsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const organisationId = str(formData, "organisationId");

  let affiliatedOrganisation: Record<string, unknown> | undefined;
  if (!organisationId) {
    const orgName = str(formData, "orgName");
    const orgEmail = str(formData, "orgEmail");
    const orgPhone = str(formData, "orgPhone");
    const orgType = str(formData, "orgType");
    const orgAddressLine1 = str(formData, "orgAddressLine1");
    const orgAddressLine2 = str(formData, "orgAddressLine2");
    const orgState = str(formData, "orgState");
    const orgDistrict = str(formData, "orgDistrict");
    const orgCity = str(formData, "orgCity");
    const orgPincode = str(formData, "orgPincode");
    const gstin = str(formData, "gstin");
    const pan = str(formData, "pan");
    const shortCode = str(formData, "shortCode");
    const industry = str(formData, "industry");
    const employeeCount = str(formData, "employeeCount");
    const establishedDate = str(formData, "establishedDate");

    if (
      !orgName ||
      !orgEmail ||
      !orgType ||
      !orgAddressLine1 ||
      !orgAddressLine2 ||
      !orgState ||
      !orgDistrict ||
      !orgCity ||
      !orgPincode ||
      !orgPhone
    ) {
      return { error: "All Organisation Details fields are required." };
    }
    if (!gstin || !pan || !shortCode || !industry || !employeeCount || !establishedDate) {
      return { error: "All Additional Information fields are required." };
    }

    affiliatedOrganisation = {
      name: orgName,
      email: orgEmail,
      phone: orgPhone,
      type: orgType,
      addressLine1: orgAddressLine1,
      addressLine2: orgAddressLine2,
      state: orgState,
      district: orgDistrict,
      city: orgCity,
      pincode: orgPincode,
      gstin,
      pan,
      shortCode,
      industry,
      employeeCount: Number(employeeCount),
      establishedDate,
    };
  }

  try {
    await apiFetch(`/public/${PROJECT_SLUG}/registrations`, {
      method: "POST",
      body: {
        workshopId,
        fullName: `${firstName} ${lastName}`,
        email,
        phone,
        alternatePhone,
        dob,
        bloodGroup,
        gender,
        address,
        educationSnapshot,
        skillsSnapshot,
        organisationId: organisationId || undefined,
        affiliatedOrganisation,
        source: "website",
      },
    });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong. Please try again." };
  }

  return { success: true };
}
