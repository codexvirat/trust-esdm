import { Schema, model, type InferSchemaType } from "mongoose";
import { applyBasePlugin } from "./plugins/basePlugin";

const workshopCategorySchema = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, lowercase: true, trim: true },
  description: String,
});

applyBasePlugin(workshopCategorySchema, { tenant: true });
workshopCategorySchema.index({ projectId: 1, slug: 1 }, { unique: true });

export type WorkshopCategoryDoc = InferSchemaType<typeof workshopCategorySchema>;
export const WorkshopCategory = model("WorkshopCategory", workshopCategorySchema, "workshop_categories");
