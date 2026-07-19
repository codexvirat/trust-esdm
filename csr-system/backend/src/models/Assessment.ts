import { Schema, model, type InferSchemaType } from "mongoose";
import { applyBasePlugin } from "./plugins/basePlugin";
import { QUESTION_TYPES } from "../types/enums";

const optionSchema = new Schema({ text: { type: String, required: true }, isCorrect: { type: Boolean, default: false } }, { _id: false });

// Frozen snapshot, not a live reference to QuestionBank — see design doc Part 06 /
// Part 16: a later edit to the question bank must never retroactively change what
// a candidate was actually tested on.
const assessmentQuestionSchema = new Schema(
  {
    questionBankId: { type: Schema.Types.ObjectId, ref: "QuestionBank", default: null },
    questionText: { type: String, required: true },
    type: { type: String, enum: QUESTION_TYPES, required: true },
    options: { type: [optionSchema], required: true },
    marks: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const assessmentSchema = new Schema({
  workshopId: { type: Schema.Types.ObjectId, ref: "Workshop", required: true },
  batchId: { type: Schema.Types.ObjectId, ref: "Batch", default: null },
  title: { type: String, required: true },
  description: String,
  questions: { type: [assessmentQuestionSchema], required: true, validate: (v: unknown[]) => v.length >= 1 },
  totalMarks: { type: Number, required: true, min: 0 },
  passingPercent: { type: Number, required: true, min: 0, max: 100 },
  maxAttempts: { type: Number, default: 1, min: 1 },
  durationMinutes: { type: Number, required: true, min: 1 },
  isEnabled: { type: Boolean, default: false },
  version: { type: Number, default: 1 },
});

applyBasePlugin(assessmentSchema, { tenant: true });

assessmentSchema.index({ workshopId: 1 });
assessmentSchema.index({ batchId: 1 });

export type AssessmentDoc = InferSchemaType<typeof assessmentSchema>;
export const Assessment = model("Assessment", assessmentSchema, "assessments");
