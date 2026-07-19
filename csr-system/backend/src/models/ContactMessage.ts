import { Schema, model, type InferSchemaType } from "mongoose";
import { applyBasePlugin } from "./plugins/basePlugin";
import { CONTACT_MESSAGE_STATUSES } from "../types/enums";

const contactMessageSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: CONTACT_MESSAGE_STATUSES, default: "new" },
  respondedByUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
});

applyBasePlugin(contactMessageSchema, { tenant: true });
contactMessageSchema.index({ projectId: 1, status: 1, createdAt: -1 });

export type ContactMessageDoc = InferSchemaType<typeof contactMessageSchema>;
export const ContactMessage = model("ContactMessage", contactMessageSchema, "contact_messages");
