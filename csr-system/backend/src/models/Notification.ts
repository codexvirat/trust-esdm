import { Schema, model, type InferSchemaType } from "mongoose";
import { applyBasePlugin } from "./plugins/basePlugin";
import { NOTIFICATION_CHANNELS, NOTIFICATION_STATUSES } from "../types/enums";

const relatedEntitySchema = new Schema({ type: String, id: Schema.Types.ObjectId }, { _id: false });

const notificationSchema = new Schema({
  recipientUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  templateCode: { type: String, ref: "NotificationTemplate", default: null },
  channel: { type: String, enum: NOTIFICATION_CHANNELS, required: true },
  subject: String,
  body: { type: String, required: true },
  status: { type: String, enum: NOTIFICATION_STATUSES, default: "queued" },
  sentAt: { type: Date, default: null },
  readAt: { type: Date, default: null },
  errorMessage: String,
  relatedEntity: { type: relatedEntitySchema, default: null },
});

applyBasePlugin(notificationSchema, { tenant: true });

notificationSchema.index({ recipientUserId: 1, status: 1, createdAt: -1 });

export type NotificationDoc = InferSchemaType<typeof notificationSchema>;
export const Notification = model("Notification", notificationSchema, "notifications");
