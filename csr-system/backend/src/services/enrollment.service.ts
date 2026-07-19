import mongoose from "mongoose";
import { Enrollment } from "../models/Enrollment";
import { Workshop } from "../models/Workshop";
import { Batch } from "../models/Batch";
import { User } from "../models/User";
import { CandidateProfile } from "../models/CandidateProfile";
import { TrainerAssignment } from "../models/TrainerAssignment";
import { WorkshopManagerAssignment } from "../models/WorkshopManagerAssignment";
import { ApiError } from "../utils/ApiError";
import { hashPassword, generateTemporaryPassword } from "../utils/password";
import { runInTransaction } from "../utils/transaction";
import { sendCandidateWelcomeEmail, sendEnrollmentConfirmationEmail } from "./email.service";
import { sendNotification } from "./notification.service";
import type { EnrollmentStatus } from "../types/enums";

export async function assertTrainerAssignedToBatch(projectId: string, trainerId: string, batchId: string) {
  const assigned = await TrainerAssignment.exists({ projectId, batchId, trainerId, status: "active" });
  if (!assigned) throw ApiError.forbidden("You are not assigned to this batch");
}

export async function assertWorkshopManagerAssignedToBatch(projectId: string, workshopManagerId: string, batchId: string) {
  const assigned = await WorkshopManagerAssignment.exists({ projectId, batchId, workshopManagerId, status: "active" });
  if (!assigned) throw ApiError.forbidden("You are not assigned to this batch");
}

export async function listOwnEnrollments(candidateUserId: string) {
  return Enrollment.find({ candidateUserId }).sort({ createdAt: -1 });
}

export async function listProjectEnrollments(projectId: string, filters: { workshopId?: string; batchId?: string; status?: EnrollmentStatus }) {
  const query: Record<string, unknown> = { projectId };
  if (filters.workshopId) query.workshopId = filters.workshopId;
  if (filters.batchId) query.batchId = filters.batchId;
  if (filters.status) query.status = filters.status;
  return Enrollment.find(query).sort({ createdAt: -1 });
}

export async function getEnrollmentById(projectId: string, id: string) {
  const enrollment = await Enrollment.findOne({ _id: id, projectId });
  if (!enrollment) throw ApiError.notFound("Enrollment not found");
  return enrollment;
}

/**
 * Step 2 of the two-step candidate flow (see user.service.ts#createUserDirect
 * for step 1): a manager picks an already-registered candidate and a
 * batch, and this is where the account actually gets "activated" — a fresh
 * temporary password is issued (the one from registration was never
 * communicated) and the real welcome email goes out with the login and the
 * candidate's attendance QR badge attached.
 */
export async function enrollExistingCandidate(input: {
  projectId: string;
  candidateUserId: string;
  workshopId: string;
  batchId: string;
  reviewerUserId: string;
}) {
  const candidate = await User.findOne({ _id: input.candidateUserId, projectId: input.projectId, roleCode: "candidate" });
  if (!candidate) throw ApiError.notFound("Candidate not found in this project");

  const workshop = await Workshop.findOne({ _id: input.workshopId, projectId: input.projectId });
  if (!workshop) throw ApiError.notFound("Workshop not found");

  const batch = await Batch.findOne({ _id: input.batchId, projectId: input.projectId, workshopId: input.workshopId });
  if (!batch) throw ApiError.badRequest("batchId does not belong to this workshop");

  const profile = await CandidateProfile.findOne({ userId: candidate._id, projectId: input.projectId });
  if (!profile) throw ApiError.notFound("Candidate profile not found");

  const temporaryPassword = generateTemporaryPassword();
  let enrollmentId: mongoose.Types.ObjectId;

  await runInTransaction(async (session) => {
    const existing = await Enrollment.findOne({ candidateUserId: candidate._id, batchId: batch._id }).session(session);
    if (existing) throw ApiError.conflict("Candidate is already enrolled in this batch");

    const created = await Enrollment.create(
      [
        {
          projectId: input.projectId,
          candidateUserId: candidate._id,
          workshopId: workshop._id,
          batchId: batch._id,
          status: "assigned",
          createdBy: input.reviewerUserId,
        },
      ],
      { session },
    );
    enrollmentId = created[0]!._id;

    await User.updateOne(
      { _id: candidate._id },
      { $set: { passwordHash: await hashPassword(temporaryPassword), mustChangePassword: true, updatedBy: input.reviewerUserId } },
    ).session(session);

    await Batch.updateOne({ _id: batch._id }, { $inc: { enrolledCount: 1 } }).session(session);
    await Workshop.updateOne({ _id: workshop._id }, { $inc: { enrolledCount: 1 } }).session(session);
  });

  await sendEnrollmentConfirmationEmail({
    to: candidate.email,
    fullName: candidate.fullName,
    workshopTitle: workshop.title,
    batchName: batch.name,
  });

  const emailResult = await sendCandidateWelcomeEmail({
    to: candidate.email,
    fullName: candidate.fullName,
    loginEmail: candidate.email,
    temporaryPassword,
    attendanceQrToken: profile.attendanceQrToken!,
    workshopTitle: workshop.title,
    batchName: batch.name,
  });

  // Always record it in the Notification audit trail too, regardless of
  // whether the real Gmail send succeeded — mirrors every other flow's
  // sendNotification call so it shows up the same way in one place.
  await sendNotification({
    projectId: input.projectId,
    recipientUserId: candidate.id,
    channel: "email",
    subject: `You're enrolled in ${workshop.title}`,
    body: emailResult.delivered
      ? `Welcome email with login credentials and attendance QR badge sent to ${candidate.email}.`
      : `Email delivery skipped (${emailResult.reason}). Temporary password: ${temporaryPassword}`,
    relatedEntity: { type: "enrollment", id: enrollmentId!.toString() },
  });

  return { enrollmentId: enrollmentId!, candidateUserId: candidate.id, emailDelivered: emailResult.delivered };
}
