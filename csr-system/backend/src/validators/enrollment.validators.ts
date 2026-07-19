import { z } from "zod";

export const enrollCandidateSchema = z.object({
  body: z.object({
    candidateUserId: z.string().min(1),
    workshopId: z.string().min(1),
    batchId: z.string().min(1),
  }),
});
