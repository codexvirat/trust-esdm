import { Schema, model, type InferSchemaType } from "mongoose";

// Append-only by design — no base plugin, no updatedAt, no soft delete, no
// application-level update/delete path (see design doc Part 09 / Part 17).
const auditLogSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", default: null, index: true },
    actorUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    before: { type: Schema.Types.Mixed, default: null },
    after: { type: Schema.Types.Mixed, default: null },
    ipAddress: String,
    userAgent: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

auditLogSchema.index({ projectId: 1, entityType: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ actorUserId: 1, createdAt: -1 });

export type AuditLogDoc = InferSchemaType<typeof auditLogSchema>;
export const AuditLog = model("AuditLog", auditLogSchema, "audit_logs");
