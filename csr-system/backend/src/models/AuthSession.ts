import { Schema, model, type InferSchemaType } from "mongoose";

// High-write, TTL-expired collection — deliberately excludes the base plugin
// (no soft delete, no projectId: a session is looked up by token, not tenant).
const authSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    refreshTokenHash: { type: String, required: true },
    deviceInfo: String,
    ipAddress: String,
    userAgent: String,
    issuedAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

authSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type AuthSessionDoc = InferSchemaType<typeof authSessionSchema>;
export const AuthSession = model("AuthSession", authSessionSchema, "auth_sessions");
