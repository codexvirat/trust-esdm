import { Schema, model, type InferSchemaType } from "mongoose";
import { applyBasePlugin } from "./plugins/basePlugin";
import { ATTENDANCE_STATUSES } from "../types/enums";

const locationSchema = new Schema({ lat: Number, lng: Number }, { _id: false });

const attendanceRecordSchema = new Schema({
  attendanceSessionId: { type: Schema.Types.ObjectId, ref: "AttendanceSession", required: true },
  batchId: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
  workshopId: { type: Schema.Types.ObjectId, ref: "Workshop", required: true },
  candidateUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  markedByUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  scanTime: { type: Date, required: true, default: Date.now },
  status: { type: String, enum: ATTENDANCE_STATUSES, required: true },
  location: { type: locationSchema, default: null },
  deviceInfo: String,
});

applyBasePlugin(attendanceRecordSchema, { tenant: true });

attendanceRecordSchema.index({ attendanceSessionId: 1, candidateUserId: 1 }, { unique: true });
attendanceRecordSchema.index({ candidateUserId: 1 });
attendanceRecordSchema.index({ batchId: 1 });

export type AttendanceRecordDoc = InferSchemaType<typeof attendanceRecordSchema>;
export const AttendanceRecord = model("AttendanceRecord", attendanceRecordSchema, "attendance_records");
