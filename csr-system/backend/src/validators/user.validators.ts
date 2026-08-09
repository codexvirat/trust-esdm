import { z } from "zod";
import { ROLE_CODES, USER_STATUSES, GENDERS, BLOOD_GROUPS, PROJECT_TYPES } from "../types/enums";

const affiliatedOrganisationSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
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
  employeeCount: z.number().optional(),
  establishedDate: z.coerce.date().optional(),
});

// Only meaningful when roleCode === "candidate" — ignored for other roles.
const candidateProfileSchema = z.object({
  dob: z.coerce.date().optional(),
  gender: z.enum(GENDERS).optional(),
  bloodGroup: z.enum(BLOOD_GROUPS).optional(),
  alternatePhone: z.string().optional(),
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
  affiliatedOrganisation: affiliatedOrganisationSchema.optional(),
});

export const createUserSchema = z.object({
  body: z.object({
    roleCode: z.enum(ROLE_CODES),
    fullName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    // Only honored for a Super Admin caller — see controller. Ignored for
    // everyone else, who is always scoped to their own project.
    projectId: z.string().optional(),
    candidateProfile: candidateProfileSchema.optional(),
  }),
});

export const listUsersQuerySchema = z.object({
  query: z.object({
    roleCode: z.enum(ROLE_CODES).optional(),
    status: z.enum(USER_STATUSES).optional(),
  }),
  body: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const setStatusSchema = z.object({
  body: z.object({
    status: z.enum(["active", "inactive", "suspended"]),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  }),
});

// Corrects a candidate's company affiliation after the fact — e.g. they typed
// the wrong details at registration instead of picking their already-registered
// company. Either pass organisationId (re-snapshots from the master Organisation
// record — see updateCandidateOrganisation) or affiliatedOrganisation (manual
// free-text correction). Passing neither clears the affiliation entirely.
export const updateCandidateOrganisationSchema = z.object({
  body: z.object({
    organisationId: z.string().min(1).nullable().optional(),
    affiliatedOrganisation: affiliatedOrganisationSchema.nullable().optional(),
  }),
});
