import { Schema, model, type InferSchemaType } from "mongoose";
import { applyBasePlugin } from "./plugins/basePlugin";
import { ATTENDANCE_SESSION_STATUSES } from "../types/enums";

const geoFenceSchema = new Schema({ lat: Number, lng: Number, radiusMeters: Number }, { _id: false });

const attendanceSessionSchema = new Schema({
  batchId: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
  workshopId: { type: Schema.Types.ObjectId, ref: "Workshop", required: true },
  sessionDate: { type: Date, required: true },
  sessionLabel: { type: String, required: true },
  qrToken: { type: String, required: true },
  qrExpiresAt: { type: Date, required: true },
  generatedByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  geoFence: { type: geoFenceSchema, default: null },
  status: { type: String, enum: ATTENDANCE_SESSION_STATUSES, default: "open" },
});

applyBasePlugin(attendanceSessionSchema, { tenant: true });

attendanceSessionSchema.index({ qrToken: 1 }, { unique: true });
attendanceSessionSchema.index({ batchId: 1, sessionDate: 1 });

export type AttendanceSessionDoc = InferSchemaType<typeof attendanceSessionSchema>;
export const AttendanceSession = model("AttendanceSession", attendanceSessionSchema, "attendance_sessions");
