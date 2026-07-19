import { z } from "zod";
import { GENDERS, BLOOD_GROUPS, PROJECT_TYPES } from "../types/enums";

const affiliatedOrganisationSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  type: z.enum(PROJECT_TYPES).optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  pincode: z.string().optional(),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  shortCode: z.string().optional(),
  industry: z.string().optional(),
  employeeCount: z.coerce.number().optional(),
  establishedDate: z.coerce.date().optional(),
});

// Mandatory version of the same shape — the public "apply" form on the
// website requires every field (including full affiliated-organisation
// details) so a candidate's profile is complete at registration time.
const requiredAffiliatedOrganisationSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  type: z.enum(PROJECT_TYPES),
  addressLine1: z.string().min(1),
  addressLine2: z.string().min(1),
  state: z.string().min(1),
  district: z.string().min(1),
  city: z.string().min(1),
  pincode: z.string().min(1),
  gstin: z.string().min(1),
  pan: z.string().min(1),
  shortCode: z.string().min(1),
  industry: z.string().min(1),
  employeeCount: z.coerce.number(),
  establishedDate: z.coerce.date(),
});

export const applyForWorkshopSchema = z.object({
  body: z
    .object({
      workshopId: z.string().min(1),
      fullName: z.string().min(2),
      email: z.string().email(),
      phone: z.string().min(6),
      dob: z.coerce.date(),
      gender: z.enum(GENDERS),
      bloodGroup: z.enum(BLOOD_GROUPS),
      alternatePhone: z.string().min(1),
      address: z.object({
        line1: z.string().min(1),
        line2: z.string().min(1),
        city: z.string().min(1),
        state: z.string().min(1),
        country: z.string().min(1),
        pincode: z.string().min(1),
      }),
      // Either an existing staff-registered company (organisationId) or the full manual
      // details (affiliatedOrganisation) must be provided — see the superRefine below.
      organisationId: z.string().min(1).optional(),
      affiliatedOrganisation: requiredAffiliatedOrganisationSchema.optional(),
      educationSnapshot: z.array(z.record(z.string(), z.unknown())).min(1),
      skillsSnapshot: z.array(z.string()).min(1),
      source: z.enum(["website", "referral", "campaign", "staff"]).optional(),
    })
    .superRefine((data, ctx) => {
      if (!data.organisationId && !data.affiliatedOrganisation) {
        ctx.addIssue({
          code: "custom",
          path: ["affiliatedOrganisation"],
          message: "Select your organisation or provide its details.",
        });
      }
    }),
});

export const registerAndApproveSchema = z.object({
  body: z.object({
    workshopId: z.string().min(1),
    fullName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(6),
    dob: z.coerce.date().optional(),
    gender: z.enum(GENDERS).optional(),
    address: z
      .object({
        line1: z.string().optional(),
        line2: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        pincode: z.string().optional(),
      })
      .optional(),
  }),
});

export const approveRegistrationSchema = z.object({
  body: z.object({}).optional(),
});

export const rejectRegistrationSchema = z.object({
  body: z.object({
    reason: z.string().min(2),
  }),
});
