import { z } from "zod";
import { FEEDBACK_QUESTION_TYPES } from "../types/enums";

const inlineFeedbackQuestionSchema = z.object({
  feedbackQuestionBankId: z.string().optional(),
  questionText: z.string().min(2),
  type: z.enum(FEEDBACK_QUESTION_TYPES),
  required: z.boolean().optional(),
});

export const createFeedbackFormSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    batchId: z.string().optional(),
    // Either provide fully-inlined questions, or reference feedback_question_bank ids to snapshot from.
    questions: z.array(inlineFeedbackQuestionSchema).optional(),
    feedbackQuestionBankIds: z.array(z.string()).optional(),
  }),
});

export const updateFeedbackFormSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    batchId: z.string().nullable().optional(),
  }),
});

export const setFeedbackEnabledSchema = z.object({
  body: z.object({
    isEnabled: z.boolean(),
  }),
});

export const submitFeedbackSchema = z.object({
  body: z.object({
    trainerId: z.string().optional(),
    answers: z
      .array(
        z.object({
          questionIndex: z.number().min(0),
          // 0-10 covers both "rating" (1-5 stars) and "nps" (0-10) question types.
          ratingValue: z.number().min(0).max(10).optional(),
          textValue: z.string().optional(),
        }),
      )
      .optional(),
    courseRating: z.number().min(0).max(5).optional(),
    trainerRating: z.number().min(0).max(5).optional(),
    comments: z.string().optional(),
  }),
});
