import { Schema, model, type InferSchemaType } from "mongoose";
import { applyBasePlugin } from "./plugins/basePlugin";
import { WORKSHOP_MANAGER_ASSIGNMENT_STATUSES } from "../types/enums";

const workshopManagerAssignmentSchema = new Schema({
  batchId: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
  workshopId: { type: Schema.Types.ObjectId, ref: "Workshop", required: true },
  workshopManagerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  // Admin or Manager — either may assign a Workshop Manager to a batch.
  assignedByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: WORKSHOP_MANAGER_ASSIGNMENT_STATUSES, default: "active" },
});

applyBasePlugin(workshopManagerAssignmentSchema, { tenant: true });

workshopManagerAssignmentSchema.index({ batchId: 1, workshopManagerId: 1 }, { unique: true });
workshopManagerAssignmentSchema.index({ workshopManagerId: 1, status: 1 });

export type WorkshopManagerAssignmentDoc = InferSchemaType<typeof workshopManagerAssignmentSchema>;
export const WorkshopManagerAssignment = model(
  "WorkshopManagerAssignment",
  workshopManagerAssignmentSchema,
  "workshop_manager_assignments",
);
