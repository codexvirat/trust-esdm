import { Schema, model, type InferSchemaType } from "mongoose";
import { PASSWORD_RESET_PURPOSES } from "../types/enums";

const passwordResetTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true },
    purpose: { type: String, enum: PASSWORD_RESET_PURPOSES, required: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
passwordResetTokenSchema.index({ userId: 1, purpose: 1 });

export type PasswordResetTokenDoc = InferSchemaType<typeof passwordResetTokenSchema>;
export const PasswordResetToken = model("PasswordResetToken", passwordResetTokenSchema, "password_reset_tokens");
