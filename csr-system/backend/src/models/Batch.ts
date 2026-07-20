import { Schema, model, type InferSchemaType } from "mongoose";
import { applyBasePlugin } from "./plugins/basePlugin";
import { BATCH_STATUSES } from "../types/enums";

const venueSnapshotSchema = new Schema(
  { name: String, address: String, city: String, geo: { lat: Number, lng: Number } },
  { _id: false },
);

const batchPhotoSchema = new Schema({ url: { type: String, required: true } });

// Day-wise curriculum plan for a batch: what runs on which date, and who's
// responsible for it (a staff account — see assignedToUserId's role check in
// batch.service.ts, kept in the service so it stays a single source of truth
// alongside the rest of the assignment validation).
const dayPlanEntrySchema = new Schema(
  {
    date: { type: Date, required: true },
    title: { type: String, required: true, trim: true },
    assignedToUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

const batchSchema = new Schema({
  workshopId: { type: Schema.Types.ObjectId, ref: "Workshop", required: true, index: true },
  code: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  venueId: { type: Schema.Types.ObjectId, ref: "Venue", default: null },
  venue: venueSnapshotSchema,
  capacity: { type: Number, default: null },
  enrolledCount: { type: Number, default: 0 },
  status: { type: String, enum: BATCH_STATUSES, default: "scheduled", index: true },
  photos: { type: [batchPhotoSchema], default: [] },
  dayPlan: { type: [dayPlanEntrySchema], default: [] },
});

applyBasePlugin(batchSchema, { tenant: true });

batchSchema.index({ workshopId: 1, code: 1 }, { unique: true });
batchSchema.index({ workshopId: 1, status: 1 });

export type BatchDoc = InferSchemaType<typeof batchSchema>;
export const Batch = model("Batch", batchSchema, "batches");
