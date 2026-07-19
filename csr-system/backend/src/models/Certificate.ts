import { Schema, model, type InferSchemaType } from "mongoose";
import { applyBasePlugin } from "./plugins/basePlugin";
import { CERTIFICATE_STATUSES } from "../types/enums";

const certificateSchema = new Schema({
  enrollmentId: { type: Schema.Types.ObjectId, ref: "Enrollment", required: true },
  candidateUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  workshopId: { type: Schema.Types.ObjectId, ref: "Workshop", required: true },
  batchId: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
  certificateNumber: { type: String, required: true },
  templateId: { type: Schema.Types.ObjectId, ref: "CertificateTemplate", required: true },
  verificationCode: { type: String, required: true },
  qrMediaId: { type: Schema.Types.ObjectId, ref: "Media", default: null },
  issueDate: { type: Date, required: true, default: Date.now },
  fileMediaId: { type: Schema.Types.ObjectId, ref: "Media", default: null },
  // Plain URL string served from /uploads/certificates/... — the rendered PDF for this certificate.
  fileUrl: { type: String, default: null },
  status: { type: String, enum: CERTIFICATE_STATUSES, default: "issued" },
  revokedReason: String,
  revokedAt: { type: Date, default: null },
  revokedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
});

applyBasePlugin(certificateSchema, { tenant: true });

certificateSchema.index({ certificateNumber: 1 }, { unique: true });
certificateSchema.index({ verificationCode: 1 }, { unique: true });
certificateSchema.index(
  { enrollmentId: 1 },
  { unique: true, partialFilterExpression: { status: "issued" } },
);
certificateSchema.index({ candidateUserId: 1 });

export type CertificateDoc = InferSchemaType<typeof certificateSchema>;
export const Certificate = model("Certificate", certificateSchema, "certificates");
