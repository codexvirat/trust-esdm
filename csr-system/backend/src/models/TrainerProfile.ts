import { Schema, model, type InferSchemaType } from "mongoose";
import { applyBasePlugin } from "./plugins/basePlugin";

const trainerProfileSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  specializations: { type: [String], default: [] },
  bio: String,
  experienceYears: { type: Number, default: 0, min: 0 },
  certifications: { type: [String], default: [] },
  photoMediaId: { type: Schema.Types.ObjectId, ref: "Media", default: null },
  ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
  ratingCount: { type: Number, default: 0, min: 0 },
});

applyBasePlugin(trainerProfileSchema, { tenant: true });

export type TrainerProfileDoc = InferSchemaType<typeof trainerProfileSchema>;
export const TrainerProfile = model("TrainerProfile", trainerProfileSchema, "trainer_profiles");
