import { AttendanceSession } from "../models/AttendanceSession";
import { AttendanceRecord } from "../models/AttendanceRecord";
import { Enrollment } from "../models/Enrollment";
import { CandidateProfile } from "../models/CandidateProfile";
import { ApiError } from "../utils/ApiError";
import type { AttendanceStatus } from "../types/enums";

/**
 * Recomputed synchronously after every write (design doc Part 15 suggests an
 * async change-stream consumer at real scale; for this foundation, correctness
 * on every scan matters more than shaving milliseconds off the QR check-in path).
 */
async function recomputeAttendancePercent(projectId: string, batchId: string, candidateUserId: string): Promise<number> {
  const [totalSessions, attendedCount] = await Promise.all([
    AttendanceSession.countDocuments({ projectId, batchId }),
    AttendanceRecord.countDocuments({ projectId, batchId, candidateUserId, status: { $in: ["present", "late"] } }),
  ]);
  const attendancePercent = totalSessions === 0 ? 0 : Math.round((attendedCount / totalSessions) * 100);
  await Enrollment.updateOne({ projectId, batchId, candidateUserId }, { $set: { attendancePercent } });
  return attendancePercent;
}

/**
 * Staff-initiated marking: a trainer/manager/admin scans the *candidate's*
 * personal badge QR (see CandidateProfile.attendanceQrToken / GET /me/attendance-qr)
 * against a chosen open session. Candidates never mark their own attendance —
 * this is the inverse of a self-scan, deliberately, to prevent one candidate
 * scanning in for another from a shared photo.
 */
export async function markAttendanceByBadgeScan(input: {
  projectId: string;
  workshopId: string;
  batchId: string;
  sessionId: string;
  candidateQrToken: string;
  markedByUserId: string;
  location?: { lat: number; lng: number };
  deviceInfo?: string;
}) {
  const session = await AttendanceSession.findOne({
    _id: input.sessionId,
    projectId: input.projectId,
    batchId: input.batchId,
    workshopId: input.workshopId,
  });
  if (!session) throw ApiError.notFound("Attendance session not found");
  if (session.status !== "open" || session.qrExpiresAt < new Date()) {
    throw ApiError.badRequest("This session is closed or has expired");
  }

  const profile = await CandidateProfile.findOne({ projectId: input.projectId, attendanceQrToken: input.candidateQrToken });
  if (!profile) throw ApiError.notFound("This badge doesn't match any candidate in your project");
  const candidateUserId = profile.userId.toString();

  const enrollment = await Enrollment.findOne({ projectId: input.projectId, batchId: session.batchId, candidateUserId });
  if (!enrollment) throw ApiError.badRequest("This candidate is not enrolled in this batch");

  const existing = await AttendanceRecord.findOne({ attendanceSessionId: session._id, candidateUserId });
  if (existing) throw ApiError.conflict("Attendance already marked for this candidate in this session");

  const record = await AttendanceRecord.create({
    projectId: input.projectId,
    attendanceSessionId: session._id,
    batchId: session.batchId,
    workshopId: session.workshopId,
    candidateUserId,
    markedByUserId: input.markedByUserId,
    scanTime: new Date(),
    status: "present",
    location: input.location,
    deviceInfo: input.deviceInfo,
  });

  await recomputeAttendancePercent(input.projectId, session.batchId.toString(), candidateUserId);
  return record;
}

export async function markAttendanceManually(input: {
  projectId: string;
  workshopId: string;
  batchId: string;
  sessionId: string;
  candidateUserId: string;
  status: AttendanceStatus;
  markedByUserId: string;
}) {
  const session = await AttendanceSession.findOne({
    _id: input.sessionId,
    projectId: input.projectId,
    batchId: input.batchId,
    workshopId: input.workshopId,
  });
  if (!session) throw ApiError.notFound("Attendance session not found");

  const enrollment = await Enrollment.findOne({
    projectId: input.projectId,
    batchId: input.batchId,
    candidateUserId: input.candidateUserId,
  });
  if (!enrollment) throw ApiError.badRequest("Candidate is not enrolled in this batch");

  const record = await AttendanceRecord.findOneAndUpdate(
    { attendanceSessionId: session._id, candidateUserId: input.candidateUserId },
    {
      $set: {
        projectId: input.projectId,
        batchId: session.batchId,
        workshopId: session.workshopId,
        markedByUserId: input.markedByUserId,
        scanTime: new Date(),
        status: input.status,
      },
    },
    { new: true, upsert: true },
  );

  await recomputeAttendancePercent(input.projectId, input.batchId, input.candidateUserId);
  return record;
}

export async function listProjectRecords(projectId: string, filters: { batchId?: string; candidateUserId?: string }) {
  const query: Record<string, unknown> = { projectId };
  if (filters.batchId) query.batchId = filters.batchId;
  if (filters.candidateUserId) query.candidateUserId = filters.candidateUserId;
  return AttendanceRecord.find(query).sort({ scanTime: -1 });
}

export async function listOwnRecords(candidateUserId: string, filters: { batchId?: string }) {
  const query: Record<string, unknown> = { candidateUserId };
  if (filters.batchId) query.batchId = filters.batchId;
  return AttendanceRecord.find(query).sort({ scanTime: -1 });
}
