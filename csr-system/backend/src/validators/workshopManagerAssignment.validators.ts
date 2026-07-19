import { z } from "zod";

export const createWorkshopManagerAssignmentSchema = z.object({
  body: z.object({
    workshopManagerId: z.string().min(1),
  }),
});
