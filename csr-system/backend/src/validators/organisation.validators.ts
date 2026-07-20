import { z } from "zod";
import { PROJECT_TYPES } from "../types/enums";

const baseOrganisationFields = {
  name: z.string().min(1),
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
  cin: z.string().optional(),
  udyamNumber: z.string().optional(),
  shortCode: z.string().optional(),
  industry: z.string().optional(),
  employeeCount: z.coerce.number().optional(),
  establishedDate: z.coerce.date().optional(),
};

export const createOrganisationSchema = z.object({
  body: z
    .object(baseOrganisationFields)
    .refine((body) => Boolean(body.email) || Boolean(body.phone), {
      message: "Provide at least an email or a phone number for the company",
      path: ["email"],
    }),
});

export const updateOrganisationSchema = z.object({
  body: z.object({
    ...baseOrganisationFields,
    name: z.string().min(1).optional(),
    isActive: z.boolean().optional(),
  }),
});
