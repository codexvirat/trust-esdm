import { z } from "zod";
import { FEEDBACK_QUESTION_TYPES } from "../types/enums";

const feedbackQuestionBodySchema = z.object({
  questionText: z.string().min(3),
  type: z.enum(FEEDBACK_QUESTION_TYPES),
  required: z.boolean().optional(),
  rows: z.array(z.string().min(1)).optional(),
  options: z.array(z.string().min(1)).optional(),
  allowMultiple: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

export const createFeedbackQuestionSchema = z.object({
  body: feedbackQuestionBodySchema
    .refine((q) => q.type !== "grid" || (q.rows && q.rows.length >= 1), {
      message: "Grid questions need at least one row",
      path: ["rows"],
    })
    .refine((q) => q.type !== "mcq" || (q.options && q.options.length >= 2), {
      message: "Multiple choice questions need at least two options",
      path: ["options"],
    }),
});

export const updateFeedbackQuestionSchema = z.object({
  body: feedbackQuestionBodySchema.partial(),
});
