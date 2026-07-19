import { z } from "zod";
import { FEEDBACK_QUESTION_TYPES } from "../types/enums";

export const createFeedbackQuestionSchema = z.object({
  body: z.object({
    questionText: z.string().min(3),
    type: z.enum(FEEDBACK_QUESTION_TYPES),
    required: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const updateFeedbackQuestionSchema = z.object({
  body: createFeedbackQuestionSchema.shape.body.partial(),
});
