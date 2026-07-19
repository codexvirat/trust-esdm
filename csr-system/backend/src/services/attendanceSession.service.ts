import crypto from "node:crypto";
import { AttendanceSession } from "../models/AttendanceSession";
import { Batch } from "../models/Batch";
import { TrainerAssignment } from "../models/TrainerAssignment";
import { ApiError } from "../utils/ApiError";
import type { RoleCode } from "../types/enums";

const DEFAULT_EXPIRY_MINUTES = 240;

async function assertBatchExists(projectId: string, workshopId: string, batchId: string) {
  const batch = await Batch.findOne({ _id: batchId, projectId, workshopId });
  if (!batch) throw ApiError.notFound("Batch not found");
  return batch;
}

export async function generateSession(input: {
  projectId: string;
  workshopId: string;
  batchId: string;
  sessionDate: Date;
  sessionLabel: string;
  expiresInMinutes?: number;
  geoFence?: { lat: number; lng: number; radiusMeters: number };
  generatedByUserId: string;
  generatedByRoleCode: RoleCode;
}) {
  await assertBatchExists(input.projectId, input.workshopId, input.batchId);

  // A rotating, per-session QR — not one static QR for the whole workshop — closes
  // the replay gap where a photographed code from day 1 still scans on day 3.
  if (input.generatedByRoleCode === "trainer") {
    const assignment = await TrainerAssignment.findOne({ batchId: input.batchId, trainerId: input.generatedByUserId, status: "active" });
    if (!assignment) throw ApiError.forbidden("You are not an assigned trainer for this batch");
  }

  const qrToken = crypto.randomBytes(24).toString("hex");
  const expiresInMinutes = input.expiresInMinutes ?? DEFAULT_EXPIRY_MINUTES;

  return AttendanceSession.create({
    projectId: input.projectId,
    batchId: input.batchId,
    workshopId: input.workshopId,
    sessionDate: input.sessionDate,
    sessionLabel: input.sessionLabel,
    qrToken,
    qrExpiresAt: new Date(Date.now() + expiresInMinutes * 60_000),
    generatedByUserId: input.generatedByUserId,
    geoFence: input.geoFence ?? null,
    status: "open",
  });
}

export async function listSessionsForBatch(projectId: string, workshopId: string, batchId: string) {
  await assertBatchExists(projectId, workshopId, batchId);
  return AttendanceSession.find({ projectId, batchId }).sort({ sessionDate: -1 });
}

export async function getSessionById(projectId: string, workshopId: string, batchId: string, sessionId: string) {
  const session = await AttendanceSession.findOne({ _id: sessionId, projectId, workshopId, batchId });
  if (!session) throw ApiError.notFound("Attendance session not found");
  return session;
}

export async function closeSession(projectId: string, workshopId: string, batchId: string, sessionId: string) {
  const session = await AttendanceSession.findOneAndUpdate(
    { _id: sessionId, projectId, workshopId, batchId },
    { $set: { status: "closed" } },
    { new: true },
  );
  if (!session) throw ApiError.notFound("Attendance session not found");
  return session;
}
