import { Schema, model, type InferSchemaType } from "mongoose";
import { applyBasePlugin } from "./plugins/basePlugin";

const marqueeSchema = new Schema({
  message: { type: String, required: true, trim: true },
  linkTarget: { type: String, default: "#enroll", trim: true },
  isActive: { type: Boolean, default: true },
});

applyBasePlugin(marqueeSchema, { tenant: true });
marqueeSchema.index({ projectId: 1, isActive: 1 });

export type MarqueeDoc = InferSchemaType<typeof marqueeSchema>;
export const Marquee = model("Marquee", marqueeSchema, "marquees");
