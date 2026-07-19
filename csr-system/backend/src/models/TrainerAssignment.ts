import { Schema, model, type InferSchemaType } from "mongoose";
import { applyBasePlugin } from "./plugins/basePlugin";
import { TRAINER_ASSIGNMENT_ROLES, TRAINER_ASSIGNMENT_STATUSES } from "../types/enums";

const trainerAssignmentSchema = new Schema({
  batchId: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
  workshopId: { type: Schema.Types.ObjectId, ref: "Workshop", required: true },
  trainerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  assignedByManagerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  roleInBatch: { type: String, enum: TRAINER_ASSIGNMENT_ROLES, default: "lead" },
  status: { type: String, enum: TRAINER_ASSIGNMENT_STATUSES, default: "active" },
});

applyBasePlugin(trainerAssignmentSchema, { tenant: true });

trainerAssignmentSchema.index({ batchId: 1, trainerId: 1 }, { unique: true });
trainerAssignmentSchema.index({ trainerId: 1, status: 1 });

export type TrainerAssignmentDoc = InferSchemaType<typeof trainerAssignmentSchema>;
export const TrainerAssignment = model("TrainerAssignment", trainerAssignmentSchema, "trainer_assignments");
