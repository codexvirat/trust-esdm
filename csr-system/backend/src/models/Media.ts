import { Schema, model, type InferSchemaType } from "mongoose";
import { applyBasePlugin } from "./plugins/basePlugin";
import { MEDIA_FILE_TYPES, MEDIA_PROVIDERS, MEDIA_STATUSES } from "../types/enums";

const mediaSchema = new Schema({
  uploadedByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  ownerType: { type: String, required: true },
  ownerId: { type: Schema.Types.ObjectId, default: null },
  fileType: { type: String, enum: MEDIA_FILE_TYPES, required: true },
  provider: { type: String, enum: MEDIA_PROVIDERS, required: true },
  url: { type: String, required: true },
  providerKey: { type: String, required: true },
  sizeBytes: Number,
  mimeType: String,
  status: { type: String, enum: MEDIA_STATUSES, default: "pending" },
});

applyBasePlugin(mediaSchema, { tenant: true });

mediaSchema.index({ ownerType: 1, ownerId: 1 });
mediaSchema.index({ uploadedByUserId: 1 });

export type MediaDoc = InferSchemaType<typeof mediaSchema>;
export const Media = model("Media", mediaSchema, "media");
