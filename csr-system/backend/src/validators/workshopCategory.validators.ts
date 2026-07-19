import { z } from "zod";

export const createWorkshopCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2),
    slug: z
      .string()
      .min(2)
      .regex(/^[a-z0-9-]+$/, "slug must be lowercase alphanumeric with hyphens only"),
    description: z.string().optional(),
  }),
});

export const updateWorkshopCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
  }),
});
