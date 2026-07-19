import { Schema, model, type InferSchemaType } from "mongoose";
import { applyBasePlugin } from "./plugins/basePlugin";
import { FEEDBACK_QUESTION_TYPES } from "../types/enums";

// Frozen snapshot, not a live reference to FeedbackQuestionBank — mirrors the
// Assessment/QuestionBank pattern (design doc Part 06/16): a later edit to the
// question bank must never retroactively change a form candidates already saw.
const feedbackQuestionSchema = new Schema(
  {
    feedbackQuestionBankId: { type: Schema.Types.ObjectId, ref: "FeedbackQuestionBank", default: null },
    questionText: { type: String, required: true },
    type: { type: String, enum: FEEDBACK_QUESTION_TYPES, required: true },
    required: { type: Boolean, default: true },
  },
  { _id: false },
);

const feedbackFormSchema = new Schema({
  workshopId: { type: Schema.Types.ObjectId, ref: "Workshop", required: true },
  batchId: { type: Schema.Types.ObjectId, ref: "Batch", default: null },
  title: { type: String, default: "" },
  questions: { type: [feedbackQuestionSchema], required: true, validate: (v: unknown[]) => v.length >= 1 },
  isEnabled: { type: Boolean, default: false },
  version: { type: Number, default: 1 },
});

applyBasePlugin(feedbackFormSchema, { tenant: true });
feedbackFormSchema.index({ workshopId: 1 });
feedbackFormSchema.index({ batchId: 1 });

export type FeedbackFormDoc = InferSchemaType<typeof feedbackFormSchema>;
export const FeedbackForm = model("FeedbackForm", feedbackFormSchema, "feedback_forms");
