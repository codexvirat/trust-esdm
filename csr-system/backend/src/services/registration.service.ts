import mongoose from "mongoose";
import { Registration } from "../models/Registration";
import { Workshop } from "../models/Workshop";
import { User } from "../models/User";
import { Role } from "../models/Role";
import { CandidateProfile } from "../models/CandidateProfile";
import { Organisation } from "../models/Organisation";
import { ApiError } from "../utils/ApiError";
import { hashPassword, generateTemporaryPassword, generateRawToken } from "../utils/password";
import { runInTransaction } from "../utils/transaction";
import { sendNotification } from "./notification.service";
import { sendRegistrationApprovedEmail, sendRegistrationRejectedEmail } from "./email.service";
import type { RegistrationStatus } from "../types/enums";

export async function applyForWorkshop(input: {
  projectId: string;
  workshopId: string;
  fullName: string;
  email: string;
  phone: string;
  dob?: Date;
  gender?: string;
  bloodGroup?: string;
  alternatePhone?: string;
  address?: Record<string, unknown>;
  organisationId?: string;
  affiliatedOrganisation?: Record<string, unknown>;
  educationSnapshot?: unknown[];
  skillsSnapshot?: string[];
  source?: string;
}) {
  const workshop = await Workshop.findOne({ _id: input.workshopId, projectId: input.projectId });
  if (!workshop || !["published", "ongoing"].includes(workshop.status)) {
    throw ApiError.notFound("Workshop not found or not open for registration");
  }
  const now = new Date();
  if (workshop.registrationOpenDate && now < workshop.registrationOpenDate) throw ApiError.badRequest("Registration has not opened yet");
  if (workshop.registrationCloseDate && now > workshop.registrationCloseDate) throw ApiError.badRequest("Registration has closed");

  const email = input.email.trim().toLowerCase();
  const existing = await Registration.findOne({ workshopId: workshop._id, email });
  if (existing) throw ApiError.conflict("You have already applied to this workshop with this email");

  // If the candidate selected an existing company, snapshot its details server-side —
  // never trust client-submitted affiliatedOrganisation fields for a known organisationId.
  let organisationId: string | undefined;
  let affiliatedOrganisation = input.affiliatedOrganisation;
  if (input.organisationId) {
    const organisation = await Organisation.findOne({ _id: input.organisationId, projectId: input.projectId, isActive: true });
    if (!organisation) throw ApiError.notFound("Selected organisation not found");
    organisationId = organisation.id;
    affiliatedOrganisation = {
      name: organisation.name,
      email: organisation.email,
      phone: organisation.phone,
      type: organisation.type,
      addressLine1: organisation.addressLine1,
      addressLine2: organisation.addressLine2,
      state: organisation.state,
      district: organisation.district,
      city: organisation.city,
      pincode: organisation.pincode,
      gstin: organisation.gstin,
      pan: organisation.pan,
      shortCode: organisation.shortCode,
      industry: organisation.industry,
      employeeCount: organisation.employeeCount,
      establishedDate: organisation.establishedDate,
    };
  }

  return Registration.create({
    projectId: input.projectId,
    workshopId: workshop._id,
    fullName: input.fullName,
    email,
    phone: input.phone,
    dob: input.dob,
    gender: input.gender,
    bloodGroup: input.bloodGroup,
    alternatePhone: input.alternatePhone,
    address: input.address,
    organisationId,
    affiliatedOrganisation,
    educationSnapshot: input.educationSnapshot ?? [],
    skillsSnapshot: input.skillsSnapshot ?? [],
    source: input.source ?? "website",
    status: "pending",
    statusHistory: [{ status: "pending", changedAt: new Date(), note: "Submitted via public site" }],
  });
}

export async function listRegistrations(projectId: string, filters: { workshopId?: string; status?: RegistrationStatus }) {
  const query: Record<string, unknown> = { projectId };
  if (filters.workshopId) query.workshopId = filters.workshopId;
  if (filters.status) query.status = filters.status;
  return Registration.find(query).sort({ createdAt: -1 });
}

export async function getRegistrationById(projectId: string, id: string) {
  const registration = await Registration.findOne({ _id: id, projectId });
  if (!registration) throw ApiError.notFound("Registration not found");
  return registration;
}

/**
 * Approving a registration only creates (or reuses) the candidate's account —
 * it does not enroll them into a batch. Enrollment is a separate, explicit
 * step from the Candidates list (see enrollment.service.ts#enrollExistingCandidate),
 * same as any staff-registered candidate. That's also where the real welcome
 * email with login credentials and the attendance QR badge gets sent, so a
 * freshly-approved account here doesn't get emailed a password that would
 * just be overwritten the moment they're actually enrolled.
 */
export async function approveRegistration(input: { projectId: string; registrationId: string; reviewerUserId: string }) {
  const registration = await getRegistrationById(input.projectId, input.registrationId);
  if (registration.status !== "pending") {
    throw ApiError.conflict(`Registration is already ${registration.status}`);
  }

  let isNewUser = false;
  let candidateUserId: mongoose.Types.ObjectId;

  await runInTransaction(async (session) => {
    let user = await User.findOne({ projectId: input.projectId, email: registration.email }).session(session);

    if (!user) {
      isNewUser = true;
      const candidateRole = await Role.findOne({ projectId: null, code: "CANDIDATE", isSystemRole: true }).session(session);
      if (!candidateRole) throw ApiError.badRequest('System role "candidate" is not seeded — run the seed script');

      const created = await User.create(
        [
          {
            projectId: input.projectId,
            roleId: candidateRole._id,
            roleCode: "candidate",
            fullName: registration.fullName,
            email: registration.email,
            phone: registration.phone,
            passwordHash: await hashPassword(generateTemporaryPassword()),
            mustChangePassword: true,
            status: "active",
            createdBy: input.reviewerUserId,
          },
        ],
        { session },
      );
      user = created[0]!;

      await CandidateProfile.create(
        [
          {
            projectId: input.projectId,
            userId: user._id,
            dob: registration.dob,
            gender: registration.gender,
            bloodGroup: registration.bloodGroup,
            alternatePhone: registration.alternatePhone,
            address: registration.address,
            organisationId: registration.organisationId,
            affiliatedOrganisation: registration.affiliatedOrganisation,
            education: registration.educationSnapshot ?? [],
            skills: registration.skillsSnapshot ?? [],
            resumeMediaId: registration.resumeMediaId,
            attendanceQrToken: generateRawToken(),
            createdBy: input.reviewerUserId,
          },
        ],
        { session },
      );
    }

    candidateUserId = user._id;

    registration.status = "approved";
    registration.reviewedByUserId = input.reviewerUserId as never;
    registration.reviewedAt = new Date();
    registration.convertedUserId = user._id as never;
    registration.statusHistory.push({
      status: "approved",
      changedBy: input.reviewerUserId as never,
      changedAt: new Date(),
    } as never);
    await registration.save({ session });
  });

  const emailResult = await sendRegistrationApprovedEmail({ to: registration.email, fullName: registration.fullName });

  await sendNotification({
    projectId: input.projectId,
    recipientUserId: candidateUserId!.toString(),
    channel: "email",
    subject: "Your registration was approved",
    body: emailResult.delivered
      ? `Approval email sent to ${registration.email}.`
      : `Email delivery skipped (${emailResult.reason}).`,
    relatedEntity: { type: "registration", id: registration.id },
  });

  return { registration, candidateUserId: candidateUserId!, isNewUser };
}

/**
 * Staff-initiated registration — a Manager/Admin entering a walk-in candidate
 * directly, rather than the candidate applying through the public site. Skips
 * the pending queue and goes straight to approved, reusing the same
 * create-account path as a normal approval. Like any other approval, this
 * only creates the account — enroll them into a batch separately afterward.
 */
export async function registerAndApprove(input: {
  projectId: string;
  workshopId: string;
  fullName: string;
  email: string;
  phone: string;
  dob?: Date;
  gender?: string;
  address?: Record<string, unknown>;
  reviewerUserId: string;
}) {
  const registration = await applyForWorkshop({
    projectId: input.projectId,
    workshopId: input.workshopId,
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
    dob: input.dob,
    gender: input.gender,
    address: input.address,
    source: "staff",
  });

  return approveRegistration({
    projectId: input.projectId,
    registrationId: registration.id,
    reviewerUserId: input.reviewerUserId,
  });
}

export async function rejectRegistration(input: { projectId: string; registrationId: string; reason: string; reviewerUserId: string }) {
  const registration = await getRegistrationById(input.projectId, input.registrationId);
  if (registration.status !== "pending") {
    throw ApiError.conflict(`Registration is already ${registration.status}`);
  }

  registration.status = "rejected";
  registration.reviewedByUserId = input.reviewerUserId as never;
  registration.reviewedAt = new Date();
  registration.rejectionReason = input.reason;
  registration.statusHistory.push({
    status: "rejected",
    changedBy: input.reviewerUserId as never,
    changedAt: new Date(),
    note: input.reason,
  } as never);
  await registration.save();

  const emailResult = await sendRegistrationRejectedEmail({ to: registration.email, fullName: registration.fullName, reason: input.reason });

  await sendNotification({
    projectId: input.projectId,
    channel: "email",
    subject: "Update on your registration",
    body: emailResult.delivered ? `Rejection email sent to ${registration.email}.` : `Email delivery skipped (${emailResult.reason}).`,
    relatedEntity: { type: "registration", id: registration.id },
  });

  return registration;
}
