import { z } from "zod";
import { PROJECT_TYPES } from "../types/enums";

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    slug: z
      .string()
      .min(2)
      .regex(/^[a-z0-9-]+$/, "slug must be lowercase alphanumeric with hyphens only"),
    type: z.enum(PROJECT_TYPES),
    contactEmail: z.string().email(),
    contactPhone: z.string().optional(),
    website: z.string().url().optional(),
    parentProjectId: z.string().optional(),
  }),
});

export const updateProjectSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    type: z.enum(PROJECT_TYPES).optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
    website: z.string().url().optional(),
    status: z.enum(["active", "suspended", "inactive"]).optional(),
  }),
});
