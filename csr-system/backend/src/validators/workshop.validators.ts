import { z } from "zod";
import { WORKSHOP_TYPES, WORKSHOP_MODES, WORKSHOP_STATUSES } from "../types/enums";

export const createWorkshopSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    slug: z
      .string()
      .min(3)
      .regex(/^[a-z0-9-]+$/, "slug must be lowercase alphanumeric with hyphens only"),
    description: z.string().min(10),
    categoryId: z.string().optional(),
    type: z.enum(WORKSHOP_TYPES),
    mode: z.enum(WORKSHOP_MODES),
    registrationOpenDate: z.coerce.date().optional(),
    registrationCloseDate: z.coerce.date().optional(),
    capacity: z.number().min(1).optional(),
    eligibilityCriteria: z.string().optional(),
    tags: z.array(z.string()).optional(),
    certificateSettings: z
      .object({
        minAttendancePercent: z.number().min(0).max(100).optional(),
        requireAssessmentPass: z.boolean().optional(),
        requireFeedback: z.boolean().optional(),
      })
      .optional(),
  }),
});

export const updateWorkshopSchema = z.object({
  body: createWorkshopSchema.shape.body.partial(),
});

export const setWorkshopStatusSchema = z.object({
  body: z.object({
    status: z.enum(WORKSHOP_STATUSES),
  }),
});

export const listPublicWorkshopsQuerySchema = z.object({
  query: z.object({
    q: z.string().optional(),
    category: z.string().optional(),
    page: z.coerce.number().min(1).optional(),
    limit: z.coerce.number().min(1).max(100).optional(),
  }),
  body: z.object({}).optional(),
  params: z.object({}).optional(),
});
