import { Batch } from "../models/Batch";
import { Workshop } from "../models/Workshop";
import { Enrollment } from "../models/Enrollment";
import { User } from "../models/User";
import { Certificate } from "../models/Certificate";
import { AttendanceSession } from "../models/AttendanceSession";
import { AttendanceRecord } from "../models/AttendanceRecord";
import { Assessment } from "../models/Assessment";
import { AssessmentAttempt } from "../models/AssessmentAttempt";
import { FeedbackForm } from "../models/FeedbackForm";
import { FeedbackResponse } from "../models/FeedbackResponse";
import { TrainerAssignment } from "../models/TrainerAssignment";
import { CandidateProfile } from "../models/CandidateProfile";
import { Organisation } from "../models/Organisation";
import { ApiError } from "../utils/ApiError";

export type SessionAttendanceStatus = "present" | "late" | "absent" | null;

export interface BatchReportCandidateRow {
  fullName: string;
  email: string;
  attendancePercent: number;
  assessmentStatus: string;
  assessmentPercentage: number | null;
  courseRating: number | null;
  trainerRating: number | null;
  feedbackSubmitted: boolean;
  certificateStatus: "issued" | "draft" | "none";
  certificateNumber: string | null;
  /** One entry per BatchReportData.sessions, in the same order — this candidate's status in that session. */
  sessionAttendance: SessionAttendanceStatus[];
}

export interface BatchReportTrainerRow {
  fullName: string;
  email: string;
  phone: string | null;
  roleInBatch: "lead" | "co_trainer";
}

export interface BatchReportSessionRow {
  sessionDate: Date;
  sessionLabel: string;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  totalEnrolled: number;
}

export interface BatchReportOrganisationRow {
  name: string;
  type: string | null;
  email: string | null;
  phone: string | null;
  addressLine: string | null;
  gstin: string | null;
  pan: string | null;
  cin: string | null;
  udyamNumber: string | null;
  industry: string | null;
  employeeCount: number | null;
}

export interface BatchReportData {
  batch: {
    name: string;
    code: string;
    startDate: Date;
    endDate: Date;
    status: string;
    venueLabel: string | null;
    photoUrls: string[];
  };
  workshopTitle: string;
  trainers: BatchReportTrainerRow[];
  totalSessions: number;
  sessions: BatchReportSessionRow[];
  candidates: BatchReportCandidateRow[];
  organisations: BatchReportOrganisationRow[];
  summary: {
    totalEnrolled: number;
    averageAttendancePercent: number;
    certifiedCount: number;
    passedCount: number;
    averageCourseRating: number | null;
    averageTrainerRating: number | null;
  };
  generatedAt: Date;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function joinAddress(parts: (string | null | undefined)[]): string | null {
  const filtered = parts.map((p) => p?.trim()).filter((p): p is string => !!p);
  return filtered.length ? filtered.join(", ") : null;
}

interface PopulatedVenue {
  name: string;
  city?: string;
  address?: string;
  geo?: { lat: number; lng: number };
}

function toVenueSummary(venueId: unknown): PopulatedVenue | null {
  return venueId && typeof venueId === "object" ? (venueId as PopulatedVenue) : null;
}

function formatVenueLabel(venue: PopulatedVenue | null): string | null {
  if (!venue) return null;
  const location = [venue.address, venue.city].filter(Boolean).join(", ");
  return location ? `${venue.name} — ${location}` : venue.name;
}

export async function getBatchReportData(projectId: string, workshopId: string, batchId: string): Promise<BatchReportData> {
  const batch = await Batch.findOne({ _id: batchId, projectId, workshopId }).populate("venueId", "name city address geo");
  if (!batch) throw ApiError.notFound("Batch not found");

  const workshop = await Workshop.findOne({ _id: workshopId, projectId });
  if (!workshop) throw ApiError.notFound("Workshop not found");

  const enrollments = await Enrollment.find({ projectId, workshopId, batchId });
  const candidateIds = enrollments.map((e) => e.candidateUserId);

  const [candidates, certificates, attendanceSessions, attendanceRecords, assessments, feedbackForms, trainerAssignments, candidateProfiles] = await Promise.all([
    User.find({ _id: { $in: candidateIds } }),
    Certificate.find({ projectId, batchId, status: { $ne: "revoked" } }),
    AttendanceSession.find({ projectId, batchId }).sort({ sessionDate: 1 }),
    AttendanceRecord.find({ projectId, batchId }),
    Assessment.find({ projectId, workshopId, $or: [{ batchId }, { batchId: null }] }),
    FeedbackForm.find({ projectId, workshopId, $or: [{ batchId }, { batchId: null }] }),
    TrainerAssignment.find({ projectId, batchId, status: "active" }),
    CandidateProfile.find({ projectId, userId: { $in: candidateIds } }),
  ]);

  const profileByUserId = new Map(candidateProfiles.map((p) => [p.userId.toString(), p]));
  const organisationIds = candidateProfiles.map((p) => p.organisationId).filter((id): id is NonNullable<typeof id> => id != null);
  const organisationDocs = organisationIds.length ? await Organisation.find({ _id: { $in: organisationIds } }) : [];
  const organisationById = new Map(organisationDocs.map((o) => [o.id, o]));

  const trainerUsers = trainerAssignments.length
    ? await User.find({ _id: { $in: trainerAssignments.map((a) => a.trainerId) } })
    : [];
  const trainerUserById = new Map(trainerUsers.map((u) => [u.id, u]));
  const trainerRows: BatchReportTrainerRow[] = trainerAssignments
    .map((assignment) => {
      const trainer = trainerUserById.get(assignment.trainerId.toString());
      if (!trainer) return null;
      return {
        fullName: trainer.fullName,
        email: trainer.email,
        phone: trainer.phone ?? null,
        roleInBatch: assignment.roleInBatch as "lead" | "co_trainer",
      };
    })
    .filter((row): row is BatchReportTrainerRow => row !== null)
    // Lead trainer(s) first, then co-trainers.
    .sort((a, b) => (a.roleInBatch === b.roleInBatch ? 0 : a.roleInBatch === "lead" ? -1 : 1));

  const recordsBySession = new Map<string, typeof attendanceRecords>();
  // candidateUserId -> sessionId -> status, for the per-candidate session matrix below.
  const statusByCandidateAndSession = new Map<string, Map<string, SessionAttendanceStatus>>();
  for (const record of attendanceRecords) {
    const sessionKey = record.attendanceSessionId.toString();
    const list = recordsBySession.get(sessionKey) ?? [];
    list.push(record);
    recordsBySession.set(sessionKey, list);

    const candidateKey = record.candidateUserId.toString();
    const bySession = statusByCandidateAndSession.get(candidateKey) ?? new Map<string, SessionAttendanceStatus>();
    bySession.set(sessionKey, record.status);
    statusByCandidateAndSession.set(candidateKey, bySession);
  }

  const sessionRows: BatchReportSessionRow[] = attendanceSessions.map((session) => {
    const records = recordsBySession.get(session.id) ?? [];
    return {
      sessionDate: session.sessionDate,
      sessionLabel: session.sessionLabel,
      presentCount: records.filter((r) => r.status === "present").length,
      lateCount: records.filter((r) => r.status === "late").length,
      absentCount: records.filter((r) => r.status === "absent").length,
      totalEnrolled: enrollments.length,
    };
  });

  const candidateById = new Map(candidates.map((c) => [c.id, c]));
  const certificateByEnrollmentId = new Map(certificates.map((c) => [c.enrollmentId.toString(), c]));

  const assessmentIds = assessments.map((a) => a._id);
  const attempts = assessmentIds.length
    ? await AssessmentAttempt.find({ projectId, assessmentId: { $in: assessmentIds }, candidateUserId: { $in: candidateIds } })
    : [];
  // Best attempt per candidate = the one with the highest attemptNumber (their latest/final try).
  const bestAttemptByCandidate = new Map<string, (typeof attempts)[number]>();
  for (const attempt of attempts) {
    const key = attempt.candidateUserId.toString();
    const existing = bestAttemptByCandidate.get(key);
    if (!existing || attempt.attemptNumber > existing.attemptNumber) bestAttemptByCandidate.set(key, attempt);
  }

  const feedbackFormIds = feedbackForms.map((f) => f._id);
  const feedbackResponses = feedbackFormIds.length
    ? await FeedbackResponse.find({ projectId, feedbackFormId: { $in: feedbackFormIds }, candidateUserId: { $in: candidateIds } })
    : [];
  const responsesByCandidate = new Map<string, typeof feedbackResponses>();
  for (const response of feedbackResponses) {
    const key = response.candidateUserId.toString();
    const list = responsesByCandidate.get(key) ?? [];
    list.push(response);
    responsesByCandidate.set(key, list);
  }

  const candidateRows: BatchReportCandidateRow[] = enrollments.map((enrollment) => {
    const candidate = candidateById.get(enrollment.candidateUserId.toString());
    const bestAttempt = bestAttemptByCandidate.get(enrollment.candidateUserId.toString());
    const responses = responsesByCandidate.get(enrollment.candidateUserId.toString()) ?? [];
    const courseRating = average(responses.map((r) => r.courseRating).filter((v): v is number => typeof v === "number"));
    const trainerRating = average(responses.map((r) => r.trainerRating).filter((v): v is number => typeof v === "number"));
    const certificate = certificateByEnrollmentId.get(enrollment.id);
    const candidateSessionStatuses = statusByCandidateAndSession.get(enrollment.candidateUserId.toString());
    const sessionAttendance: SessionAttendanceStatus[] = attendanceSessions.map((session) => candidateSessionStatuses?.get(session.id) ?? null);

    return {
      fullName: candidate?.fullName ?? "Unknown candidate",
      email: candidate?.email ?? "",
      attendancePercent: enrollment.attendancePercent,
      assessmentStatus: enrollment.assessmentStatus,
      assessmentPercentage: bestAttempt?.percentage ?? null,
      courseRating,
      trainerRating,
      feedbackSubmitted: enrollment.feedbackSubmitted,
      certificateStatus: certificate ? (certificate.status as "issued" | "draft") : "none",
      certificateNumber: certificate?.certificateNumber ?? null,
      sessionAttendance,
    };
  });

  const organisationRows: BatchReportOrganisationRow[] = [];
  const organisationRowByKey = new Map<string, BatchReportOrganisationRow>();
  for (const enrollment of enrollments) {
    const candidateKey = enrollment.candidateUserId.toString();
    const profile = profileByUserId.get(candidateKey);
    if (!profile) continue;

    const org = profile.organisationId ? organisationById.get(profile.organisationId.toString()) : null;
    const snapshot = profile.affiliatedOrganisation;
    const name = org?.name ?? snapshot?.name;
    if (!name) continue;

    const key = profile.organisationId ? profile.organisationId.toString() : `snapshot:${name.trim().toLowerCase()}`;
    let row = organisationRowByKey.get(key);
    if (!row) {
      row = {
        name,
        type: org?.type ?? snapshot?.type ?? null,
        email: org?.email ?? snapshot?.email ?? null,
        phone: org?.phone ?? snapshot?.phone ?? null,
        addressLine: joinAddress([
          org?.addressLine1 ?? snapshot?.addressLine1,
          org?.addressLine2 ?? snapshot?.addressLine2,
          org?.city ?? snapshot?.city,
          org?.district ?? snapshot?.district,
          org?.state ?? snapshot?.state,
          org?.pincode ?? snapshot?.pincode,
        ]),
        gstin: org?.gstin ?? snapshot?.gstin ?? null,
        pan: org?.pan ?? snapshot?.pan ?? null,
        cin: org?.cin ?? null,
        udyamNumber: org?.udyamNumber ?? null,
        industry: org?.industry ?? snapshot?.industry ?? null,
        employeeCount: org?.employeeCount ?? snapshot?.employeeCount ?? null,
      };
      organisationRowByKey.set(key, row);
      organisationRows.push(row);
    }
  }

  const venueLabel = formatVenueLabel(toVenueSummary(batch.venueId)) ?? batch.venue?.name ?? batch.venue?.city ?? null;

  return {
    batch: {
      name: batch.name,
      code: batch.code,
      startDate: batch.startDate,
      endDate: batch.endDate,
      status: batch.status,
      venueLabel,
      photoUrls: (batch.photos ?? []).map((p) => p.url),
    },
    workshopTitle: workshop.title,
    trainers: trainerRows,
    totalSessions: attendanceSessions.length,
    sessions: sessionRows,
    candidates: candidateRows,
    organisations: organisationRows,
    summary: {
      totalEnrolled: enrollments.length,
      averageAttendancePercent: average(enrollments.map((e) => e.attendancePercent)) ?? 0,
      certifiedCount: certificates.filter((c) => c.status === "issued").length,
      passedCount: enrollments.filter((e) => e.assessmentStatus === "passed").length,
      averageCourseRating: average(candidateRows.map((r) => r.courseRating).filter((v): v is number => v !== null)),
      averageTrainerRating: average(candidateRows.map((r) => r.trainerRating).filter((v): v is number => v !== null)),
    },
    generatedAt: new Date(),
  };
}
