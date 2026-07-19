import { Schema, model, type InferSchemaType } from "mongoose";
import { NOTIFICATION_CHANNELS } from "../types/enums";

const notificationTemplateSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    channel: { type: String, enum: NOTIFICATION_CHANNELS, required: true },
    subject: String,
    bodyTemplate: { type: String, required: true },
    variables: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type NotificationTemplateDoc = InferSchemaType<typeof notificationTemplateSchema>;
export const NotificationTemplate = model("NotificationTemplate", notificationTemplateSchema, "notification_templates");
