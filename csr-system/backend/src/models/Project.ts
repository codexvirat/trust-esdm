import { Schema, model, type InferSchemaType } from "mongoose";
import { applyBasePlugin } from "./plugins/basePlugin";
import { PROJECT_TYPES, PROJECT_STATUSES } from "../types/enums";

const addressSchema = new Schema(
  {
    line1: String,
    line2: String,
    city: String,
    state: String,
    country: String,
    pincode: String,
  },
  { _id: false },
);

const projectSchema = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  type: { type: String, enum: PROJECT_TYPES, required: true },
  logoUrl: String,
  website: String,
  contactEmail: { type: String, required: true, lowercase: true, trim: true },
  contactPhone: String,
  address: addressSchema,
  status: { type: String, enum: PROJECT_STATUSES, default: "active" },
  plan: { type: String, enum: ["free", "standard", "enterprise"], default: "free" },
  parentProjectId: { type: Schema.Types.ObjectId, ref: "Project", default: null },
  settings: { type: Schema.Types.Mixed, default: {} },
});

// Global collection — no tenant scope on itself.
applyBasePlugin(projectSchema);

projectSchema.index({ type: 1, status: 1 });

export type ProjectDoc = InferSchemaType<typeof projectSchema>;
export const Project = model("Project", projectSchema, "projects");
