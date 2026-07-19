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

export const updateCandidateProfileSchema = z.object({
  body: z.object({
    dob: z.coerce.date().optional(),
    gender: z.enum(GENDERS).optional(),
    bloodGroup: z.enum(BLOOD_GROUPS).optional(),
    alternatePhone: z.string().optional(),
    affiliatedOrganisation: affiliatedOrganisationSchema.optional(),
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
    education: z
      .array(
        z.object({
          degree: z.string().optional(),
          institution: z.string().optional(),
          fieldOfStudy: z.string().optional(),
          startYear: z.number().optional(),
          endYear: z.number().optional(),
          grade: z.string().optional(),
        }),
      )
      .optional(),
    skills: z.array(z.string()).optional(),
    socialLinks: z
      .object({
        linkedin: z.string().optional(),
        github: z.string().optional(),
        portfolio: z.string().optional(),
        twitter: z.string().optional(),
      })
      .optional(),
    emergencyContact: z
      .object({
        name: z.string().optional(),
        relation: z.string().optional(),
        phone: z.string().optional(),
      })
      .optional(),
  }),
});

export const updateTrainerProfileSchema = z.object({
  body: z.object({
    specializations: z.array(z.string()).optional(),
    bio: z.string().optional(),
    experienceYears: z.number().min(0).optional(),
    certifications: z.array(z.string()).optional(),
  }),
});
