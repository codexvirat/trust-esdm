import { z } from "zod";

export const createMarqueeSchema = z.object({
  body: z.object({
    message: z.string().min(1),
    linkTarget: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateMarqueeSchema = z.object({
  body: z.object({
    message: z.string().min(1).optional(),
    linkTarget: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});
