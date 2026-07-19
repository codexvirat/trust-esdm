import { Schema, model, type InferSchemaType } from "mongoose";
import { applyBasePlugin } from "./plugins/basePlugin";
import { ENROLLMENT_STATUSES, ASSESSMENT_ENROLLMENT_STATUSES } from "../types/enums";

const enrollmentSchema = new Schema({
  candidateUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  workshopId: { type: Schema.Types.ObjectId, ref: "Workshop", required: true },
  batchId: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
  registrationId: { type: Schema.Types.ObjectId, ref: "Registration", default: null },
  status: { type: String, enum: ENROLLMENT_STATUSES, default: "assigned", index: true },
  attendancePercent: { type: Number, default: 0, min: 0, max: 100 },
  assessmentStatus: { type: String, enum: ASSESSMENT_ENROLLMENT_STATUSES, default: "not_started" },
  feedbackSubmitted: { type: Boolean, default: false },
  certificateId: { type: Schema.Types.ObjectId, ref: "Certificate", default: null },
});

applyBasePlugin(enrollmentSchema, { tenant: true });

enrollmentSchema.index({ candidateUserId: 1, batchId: 1 }, { unique: true });
enrollmentSchema.index({ workshopId: 1, status: 1 });
enrollmentSchema.index({ candidateUserId: 1 });

export type EnrollmentDoc = InferSchemaType<typeof enrollmentSchema>;
export const Enrollment = model("Enrollment", enrollmentSchema, "enrollments");
