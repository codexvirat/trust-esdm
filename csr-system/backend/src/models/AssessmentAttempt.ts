import { Schema, model, type InferSchemaType } from "mongoose";
import { applyBasePlugin } from "./plugins/basePlugin";
import { ATTEMPT_STATUSES, ATTEMPT_RESULTS } from "../types/enums";

const answerSchema = new Schema(
  {
    questionIndex: { type: Number, required: true },
    selectedOptions: { type: [Number], default: [] },
    isCorrect: { type: Boolean, default: false },
    marksAwarded: { type: Number, default: 0 },
  },
  { _id: false },
);

const assessmentAttemptSchema = new Schema({
  assessmentId: { type: Schema.Types.ObjectId, ref: "Assessment", required: true },
  candidateUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  attemptNumber: { type: Number, required: true, min: 1 },
  answers: { type: [answerSchema], default: [] },
  score: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  result: { type: String, enum: ATTEMPT_RESULTS, default: null },
  startedAt: { type: Date, required: true, default: Date.now },
  submittedAt: { type: Date, default: null },
  status: { type: String, enum: ATTEMPT_STATUSES, default: "in_progress" },
});

applyBasePlugin(assessmentAttemptSchema, { tenant: true });

assessmentAttemptSchema.index({ assessmentId: 1, candidateUserId: 1, attemptNumber: 1 }, { unique: true });
assessmentAttemptSchema.index({ candidateUserId: 1 });

export type AssessmentAttemptDoc = InferSchemaType<typeof assessmentAttemptSchema>;
export const AssessmentAttempt = model("AssessmentAttempt", assessmentAttemptSchema, "assessment_attempts");
