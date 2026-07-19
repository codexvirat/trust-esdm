import { Schema, model, type InferSchemaType } from "mongoose";
import { applyBasePlugin } from "./plugins/basePlugin";
import { FEEDBACK_QUESTION_TYPES } from "../types/enums";

const feedbackQuestionBankSchema = new Schema({
  questionText: { type: String, required: true },
  type: { type: String, enum: FEEDBACK_QUESTION_TYPES, required: true },
  required: { type: Boolean, default: true },
  tags: { type: [String], default: [] },
  createdByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

applyBasePlugin(feedbackQuestionBankSchema, { tenant: true });
feedbackQuestionBankSchema.index({ projectId: 1, tags: 1 });

export type FeedbackQuestionBankDoc = InferSchemaType<typeof feedbackQuestionBankSchema>;
export const FeedbackQuestionBank = model("FeedbackQuestionBank", feedbackQuestionBankSchema, "feedback_question_bank");
