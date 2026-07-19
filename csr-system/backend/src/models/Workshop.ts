import { Schema, model, type InferSchemaType } from "mongoose";
import { applyBasePlugin } from "./plugins/basePlugin";
import { WORKSHOP_TYPES, WORKSHOP_MODES, WORKSHOP_STATUSES } from "../types/enums";

const certificateSettingsSchema = new Schema(
  {
    minAttendancePercent: { type: Number, default: 80, min: 0, max: 100 },
    requireAssessmentPass: { type: Boolean, default: true },
    requireFeedback: { type: Boolean, default: true },
  },
  { _id: false },
);

const workshopSchema = new Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, lowercase: true, trim: true },
  description: { type: String, required: true },
  categoryId: { type: Schema.Types.ObjectId, ref: "WorkshopCategory", default: null },
  bannerMediaId: { type: Schema.Types.ObjectId, ref: "Media", default: null },
  type: { type: String, enum: WORKSHOP_TYPES, required: true },
  mode: { type: String, enum: WORKSHOP_MODES, required: true },
  registrationOpenDate: Date,
  registrationCloseDate: Date,
  capacity: { type: Number, default: null },
  enrolledCount: { type: Number, default: 0 },
  eligibilityCriteria: String,
  tags: { type: [String], default: [] },
  status: { type: String, enum: WORKSHOP_STATUSES, default: "draft", index: true },
  certificateSettings: { type: certificateSettingsSchema, default: () => ({}) },
  createdByManagerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  assignedTrainerIds: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
});

applyBasePlugin(workshopSchema, { tenant: true });

workshopSchema.index({ projectId: 1, slug: 1 }, { unique: true });
workshopSchema.index({ projectId: 1, status: 1 });
workshopSchema.index({ categoryId: 1 });
workshopSchema.index({ title: "text", description: "text", tags: "text" });

export type WorkshopDoc = InferSchemaType<typeof workshopSchema>;
export const Workshop = model("Workshop", workshopSchema, "workshops");
