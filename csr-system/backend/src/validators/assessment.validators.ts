import { z } from "zod";
import { QUESTION_TYPES } from "../types/enums";

const inlineQuestionSchema = z.object({
  questionBankId: z.string().optional(),
  questionText: z.string().min(3),
  type: z.enum(QUESTION_TYPES),
  options: z.array(z.object({ text: z.string().min(1), isCorrect: z.boolean().default(false) })).min(2),
  marks: z.number().min(0),
});

export const createAssessmentSchema = z.object({
  body: z.object({
    batchId: z.string().optional(),
    title: z.string().min(2),
    description: z.string().optional(),
    // Either provide fully-inlined questions, or reference question_bank ids to snapshot from.
    questions: z.array(inlineQuestionSchema).optional(),
    questionBankIds: z.array(z.string()).optional(),
    passingPercent: z.number().min(0).max(100),
    maxAttempts: z.number().min(1).optional(),
    durationMinutes: z.number().min(1),
  }),
});

export const updateAssessmentSchema = z.object({
  body: z.object({
    batchId: z.string().nullable().optional(),
    title: z.string().min(2).optional(),
    description: z.string().optional(),
    // Only accepted while no attempts have been submitted yet — see service layer.
    questions: z.array(inlineQuestionSchema).optional(),
    passingPercent: z.number().min(0).max(100).optional(),
    maxAttempts: z.number().min(1).optional(),
    durationMinutes: z.number().min(1).optional(),
  }),
});

export const setAssessmentEnabledSchema = z.object({
  body: z.object({
    isEnabled: z.boolean(),
  }),
});

export const submitAttemptSchema = z.object({
  body: z.object({
    answers: z.array(
      z.object({
        questionIndex: z.number().min(0),
        selectedOptions: z.array(z.number().min(0)),
      }),
    ),
  }),
});
