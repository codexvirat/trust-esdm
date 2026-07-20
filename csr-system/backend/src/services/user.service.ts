import { User } from "../models/User";
import { Role } from "../models/Role";
import { Project } from "../models/Project";
import { CandidateProfile } from "../models/CandidateProfile";
import { TrainerProfile } from "../models/TrainerProfile";
import { ApiError } from "../utils/ApiError";
import { hashPassword, generateTemporaryPassword, generateRawToken } from "../utils/password";
import { sendNotification } from "./notification.service";
import { sendAccountWelcomeEmail } from "./email.service";
import { cascadeDeleteCandidate, cascadeDeleteTrainer } from "../utils/cascadeDelete";
import { env } from "../config/env";
import type { RoleCode } from "../types/enums";

// Candidates get their welcome email later, at enrollment (sendCandidateWelcomeEmail) — see below.
const STAFF_PORTAL_BY_ROLE: Partial<Record<RoleCode, { url: string; label: string }>> = {
  super_admin: { url: env.ADMIN_PORTAL_URL, label: "Super Admin" },
  admin: { url: env.ORG_ADMIN_PORTAL_URL, label: "Admin" },
  manager: { url: env.MANAGER_PORTAL_URL, label: "Manager" },
  workshop_manager: { url: env.WORKSHOP_MANAGER_PORTAL_URL, label: "Workshop Manager" },
  trainer: { url: env.TRAINER_PORTAL_URL, label: "Trainer" },
};

async function resolveRole(projectId: string, roleCode: RoleCode) {
  const role = await Role.findOne({ projectId: null, code: roleCode.toUpperCase(), isSystemRole: true });
  if (!role) throw ApiError.badRequest(`System role "${roleCode}" is not seeded — run the seed script`);
  return role;
}

/**
 * Direct account creation by an Admin/Manager (Managers and Trainers never go
 * through the public `registrations` funnel — see design doc Part 04).
 * Also reused by the registration-approval flow for candidates, which is why
 * the temp-password + mustChangePassword behavior lives here in one place.
 */
export async function createUserDirect(input: {
  projectId: string;
  roleCode: RoleCode;
  fullName: string;
  email: string;
  phone?: string;
  createdBy: string;
  candidateProfile?: {
    dob?: Date;
    gender?: string;
    bloodGroup?: string;
    alternatePhone?: string;
    address?: Record<string, unknown>;
    affiliatedOrganisation?: Record<string, unknown>;
  };
  // Candidate registration is now a two-step flow: this creates the account
  // silently, and the welcome email (with login credentials + QR badge) fires
  // later, when the candidate is actually enrolled into a batch — see
  // enrollment.service.ts#enrollExistingCandidate. Other roles keep the
  // immediate-email default.
  sendWelcomeEmail?: boolean;
}) {
  const project = await Project.findById(input.projectId);
  if (!project) throw ApiError.notFound("Target project not found");

  const email = input.email.trim().toLowerCase();
  const existing = await User.findOne({ projectId: input.projectId, email });
  if (existing) throw ApiError.conflict(`A user with email "${email}" already exists in this project`);

  const role = await resolveRole(input.projectId, input.roleCode);
  const temporaryPassword = generateTemporaryPassword();

  const user = await User.create({
    projectId: input.projectId,
    roleId: role._id,
    roleCode: input.roleCode,
    fullName: input.fullName,
    email,
    phone: input.phone,
    passwordHash: await hashPassword(temporaryPassword),
    mustChangePassword: true,
    status: "active",
    createdBy: input.createdBy,
  });

  if (input.roleCode === "candidate") {
    await CandidateProfile.create({
      userId: user._id,
      projectId: input.projectId,
      dob: input.candidateProfile?.dob,
      gender: input.candidateProfile?.gender,
      bloodGroup: input.candidateProfile?.bloodGroup,
      alternatePhone: input.candidateProfile?.alternatePhone,
      address: input.candidateProfile?.address,
      affiliatedOrganisation: input.candidateProfile?.affiliatedOrganisation,
      attendanceQrToken: generateRawToken(),
    });
  } else if (input.roleCode === "trainer") {
    await TrainerProfile.create({ userId: user._id, projectId: input.projectId });
  }

  const sendWelcomeEmail = input.sendWelcomeEmail ?? true;
  if (sendWelcomeEmail) {
    await sendNotification({
      projectId: input.projectId,
      recipientUserId: user.id,
      channel: "email",
      subject: "Your account has been created",
      body: `Hi ${input.fullName}, your account was created. Email: ${email} — Temporary password: ${temporaryPassword}. You will be asked to change it on first login.`,
      relatedEntity: { type: "user", id: user.id },
    });

    const portal = STAFF_PORTAL_BY_ROLE[input.roleCode];
    if (portal) {
      await sendAccountWelcomeEmail({
        to: email,
        fullName: input.fullName,
        loginEmail: email,
        temporaryPassword,
        roleLabel: portal.label,
        portalUrl: portal.url,
      });
    }
  }

  return user;
}

export async function listUsers(projectId: string, filters: { roleCode?: RoleCode; status?: string }) {
  const query: Record<string, unknown> = { projectId };
  if (filters.roleCode) query.roleCode = filters.roleCode;
  if (filters.status) query.status = filters.status;
  return User.find(query).sort({ createdAt: -1 });
}

export async function getUserById(projectId: string, userId: string) {
  const user = await User.findOne({ _id: userId, projectId });
  if (!user) throw ApiError.notFound("User not found");
  return user;
}

/** Full staff-facing view of a candidate: the account plus their CandidateProfile, with photo/resume resolved. */
export async function getUserCandidateProfile(projectId: string, userId: string) {
  const user = await getUserById(projectId, userId);
  if (user.roleCode !== "candidate") throw ApiError.badRequest("User is not a candidate");

  const profile = await CandidateProfile.findOne({ userId: user._id, projectId })
    .populate("photoMediaId")
    .populate("resumeMediaId");

  return { user, profile };
}

export async function setUserStatus(projectId: string, userId: string, status: "active" | "inactive" | "suspended", updatedBy: string) {
  await getUserById(projectId, userId); // 404s if missing/out of tenant before the update below
  const updated = await User.findByIdAndUpdate(userId, { $set: { status, updatedBy } }, { new: true });
  return updated!;
}

/**
 * Fixes typos in a user's identity fields (fullName/email/phone) — e.g. a
 * candidate's email was mistyped at registration. Duplicate checks mirror the
 * partial unique indexes on User (projectId+email, phone), scoped to
 * non-deleted users, so this can't collide with an active account but can
 * reuse an email/phone freed up by a soft-deleted one.
 */
export async function updateUserBasicInfo(
  projectId: string,
  userId: string,
  updates: { fullName?: string; email?: string; phone?: string },
  updatedBy: string,
) {
  await getUserById(projectId, userId); // 404s if missing/out of tenant before the checks below

  const set: Record<string, unknown> = { updatedBy };
  const unset: Record<string, unknown> = {};

  if (updates.fullName !== undefined) set.fullName = updates.fullName;

  if (updates.email !== undefined) {
    const email = updates.email.trim().toLowerCase();
    const existing = await User.findOne({ projectId, email, isDeleted: false, _id: { $ne: userId } });
    if (existing) throw ApiError.conflict(`A user with email "${email}" already exists in this project`);
    set.email = email;
  }

  if (updates.phone !== undefined) {
    const phone = updates.phone.trim();
    if (phone) {
      const existing = await User.findOne({ phone, isDeleted: false, _id: { $ne: userId } });
      if (existing) throw ApiError.conflict(`A user with phone "${phone}" already exists`);
      set.phone = phone;
    } else {
      unset.phone = "";
    }
  }

  const update: Record<string, unknown> = { $set: set };
  if (Object.keys(unset).length > 0) update.$unset = unset;

  const updated = await User.findByIdAndUpdate(userId, update, { new: true });
  return updated!;
}

/**
 * Deleting a user is never just that one document — a candidate carries
 * enrollments/certificates/attendance/assessment-attempts/feedback, and a
 * trainer carries batch assignments. This cascades the appropriate cleanup
 * (see utils/cascadeDelete.ts) before soft-deleting the account itself, so
 * nothing is left pointing at a "removed" user across the rest of the app.
 */
export async function softDeleteUser(projectId: string, userId: string, deletedBy: string) {
  const user = await getUserById(projectId, userId);

  if (user.roleCode === "candidate") {
    await cascadeDeleteCandidate(projectId, userId, deletedBy);
  } else if (user.roleCode === "trainer") {
    await cascadeDeleteTrainer(projectId, userId, deletedBy);
  }

  await user.softDelete(deletedBy);
  return user;
}
