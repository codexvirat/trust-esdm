import { z } from "zod";
import { QUESTION_TYPES, QUESTION_DIFFICULTIES } from "../types/enums";

const optionSchema = z.object({ text: z.string().min(1), isCorrect: z.boolean().default(false) });

export const createQuestionSchema = z.object({
  body: z.object({
    questionText: z.string().min(3),
    type: z.enum(QUESTION_TYPES),
    options: z.array(optionSchema).min(2),
    marks: z.number().min(0),
    difficulty: z.enum(QUESTION_DIFFICULTIES).optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const updateQuestionSchema = z.object({
  body: createQuestionSchema.shape.body.partial(),
});
