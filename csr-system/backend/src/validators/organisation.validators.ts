import { z } from "zod";
import { PROJECT_TYPES } from "../types/enums";

export const createOrganisationSchema = z.object({
  body: z.object({
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
  }),
});

export const updateOrganisationSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(1).optional(),
    type: z.enum(PROJECT_TYPES).optional(),
    addressLine1: z.string().min(1).optional(),
    addressLine2: z.string().min(1).optional(),
    state: z.string().min(1).optional(),
    district: z.string().min(1).optional(),
    city: z.string().min(1).optional(),
    pincode: z.string().min(1).optional(),
    gstin: z.string().min(1).optional(),
    pan: z.string().min(1).optional(),
    shortCode: z.string().min(1).optional(),
    industry: z.string().min(1).optional(),
    employeeCount: z.coerce.number().optional(),
    establishedDate: z.coerce.date().optional(),
    isActive: z.boolean().optional(),
  }),
});
