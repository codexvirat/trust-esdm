import { Schema, model, type InferSchemaType } from "mongoose";
import { applyBasePlugin } from "./plugins/basePlugin";

const answerSchema = new Schema(
  { questionIndex: { type: Number, required: true }, ratingValue: Number, textValue: String },
  { _id: false },
);

const feedbackResponseSchema = new Schema({
  feedbackFormId: { type: Schema.Types.ObjectId, ref: "FeedbackForm", required: true },
  workshopId: { type: Schema.Types.ObjectId, ref: "Workshop", required: true },
  candidateUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  trainerId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  answers: { type: [answerSchema], default: [] },
  courseRating: { type: Number, min: 0, max: 5 },
  trainerRating: { type: Number, min: 0, max: 5 },
  comments: String,
  submittedAt: { type: Date, default: Date.now },
  formVersionAtResponse: { type: Number, required: true },
});

applyBasePlugin(feedbackResponseSchema, { tenant: true });

feedbackResponseSchema.index({ feedbackFormId: 1, candidateUserId: 1 }, { unique: true });
feedbackResponseSchema.index({ workshopId: 1 });

export type FeedbackResponseDoc = InferSchemaType<typeof feedbackResponseSchema>;
export const FeedbackResponse = model("FeedbackResponse", feedbackResponseSchema, "feedback_responses");
