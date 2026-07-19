import { z } from "zod";
import { TRAINER_ASSIGNMENT_ROLES } from "../types/enums";

export const createTrainerAssignmentSchema = z.object({
  body: z.object({
    trainerId: z.string().min(1),
    roleInBatch: z.enum(TRAINER_ASSIGNMENT_ROLES).optional(),
  }),
});
