import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { HydratedDocument } from "mongoose";
import { Certificate, type CertificateDoc } from "../models/Certificate";
import { CertificateTemplate, type CertificateTemplateDoc } from "../models/CertificateTemplate";
import { Enrollment, type EnrollmentDoc } from "../models/Enrollment";
import { Batch } from "../models/Batch";
import { Workshop, type WorkshopDoc } from "../models/Workshop";
import { Assessment } from "../models/Assessment";
import { FeedbackForm } from "../models/FeedbackForm";
import { User, type UserAttrs, type UserMethods } from "../models/User";
import { Project } from "../models/Project";
import { CandidateProfile } from "../models/CandidateProfile";
import { Organisation } from "../models/Organisation";
import { getNextSequence } from "../models/Counter";
import { ApiError } from "../utils/ApiError";
import { sendNotification } from "./notification.service";
import { sendCertificateIssuedEmail, sendCertificateRevokedEmail } from "./email.service";
import { CERTIFICATES_DIR, resolveUploadsPath } from "../middleware/upload";
import { renderCertificatePdf, mergeWithDefaults } from "./certificatePdf.service";
import { env } from "../config/env";

interface GateCheck {
  attendance: { required: number; actual: number; met: boolean };
  assessment: { required: boolean; applicable: boolean; met: boolean };
  feedback: { required: boolean; applicable: boolean; met: boolean };
}

async function evaluateGates(projectId: string, enrollment: { workshopId: unknown; batchId: unknown; attendancePercent: number; assessmentStatus: string; feedbackSubmitted: boolean }): Promise<GateCheck> {
  const workshop = await Workshop.findOne({ _id: enrollment.workshopId, projectId });
  if (!workshop) throw ApiError.notFound("Workshop not found for this enrollment");

  const settings = workshop.certificateSettings ?? { minAttendancePercent: 80, requireAssessmentPass: true, requireFeedback: true };

  const assessmentExists = await Assessment.exists({ projectId, workshopId: enrollment.workshopId });
  const feedbackExists = await FeedbackForm.exists({ projectId, workshopId: enrollment.workshopId });

  return {
    attendance: {
      required: settings.minAttendancePercent,
      actual: enrollment.attendancePercent,
      met: enrollment.attendancePercent >= settings.minAttendancePercent,
    },
    assessment: {
      required: settings.requireAssessmentPass,
      applicable: Boolean(assessmentExists),
      met: !settings.requireAssessmentPass || !assessmentExists || enrollment.assessmentStatus === "passed",
    },
    feedback: {
      required: settings.requireFeedback,
      applicable: Boolean(feedbackExists),
      met: !settings.requireFeedback || !feedbackExists || enrollment.feedbackSubmitted === true,
    },
  };
}

function gatesMet(gates: GateCheck): boolean {
  return gates.attendance.met && gates.assessment.met && gates.feedback.met;
}

export async function checkEligibility(projectId: string, enrollmentId: string) {
  const enrollment = await Enrollment.findOne({ _id: enrollmentId, projectId });
  if (!enrollment) throw ApiError.notFound("Enrollment not found");
  const gates = await evaluateGates(projectId, enrollment);
  return { eligible: gatesMet(gates), gates };
}

/**
 * Sends the "your certificate is ready" email + in-app notification for an already-persisted,
 * issued certificate. Called right after issuance for a single-issue, and again later for every
 * certificate in a batch when an admin publishes a batch of drafts (see publishCertificatesForBatch).
 */
async function deliverCertificateEmail(input: {
  projectId: string;
  certificate: HydratedDocument<CertificateDoc>;
  candidate: HydratedDocument<UserAttrs, UserMethods> | null;
  workshop: HydratedDocument<WorkshopDoc> | null;
  pdfBuffer?: Buffer;
}): Promise<import("./email.service").SendResult> {
  const { projectId, certificate, candidate, workshop } = input;
  const verificationUrl = `${env.WEBSITE_URL}/verify`;

  let pdfBuffer = input.pdfBuffer;
  if (!pdfBuffer && certificate.fileUrl) {
    try {
      pdfBuffer = await fs.readFile(resolveUploadsPath(certificate.fileUrl));
    } catch (err) {
      console.error("[certificate] could not read stored PDF for email attachment:", err);
    }
  }

  if (!candidate) {
    return { delivered: false, reason: "No candidate email on file" };
  }

  const emailResult = await sendCertificateIssuedEmail({
    to: candidate.email,
    fullName: candidate.fullName,
    workshopTitle: workshop?.title ?? "your training",
    certificateNumber: certificate.certificateNumber,
    verificationCode: certificate.verificationCode,
    verificationUrl,
    pdfBuffer,
  });

  await sendNotification({
    projectId,
    recipientUserId: candidate.id,
    channel: "email",
    subject: `Your certificate for ${workshop?.title ?? "your training"} is ready`,
    body: emailResult.delivered ? `Certificate email sent to ${candidate.email}.` : `Email delivery skipped (${emailResult.reason}).`,
    relatedEntity: { type: "certificate", id: certificate.id },
  });

  return emailResult;
}

/**
 * Core single-enrollment issuance: gate check (unless precomputed), certificate number/verification
 * code, PDF render + write to disk, and the Enrollment update. Shared by the single-issue endpoint
 * and the batch bulk-generate loop so there is exactly one place that knows how to actually mint a
 * certificate. When `status` is "draft" the certificate is rendered and saved but NOT emailed and
 * the enrollment is NOT flipped to "certified" yet — that only happens on publish (see
 * publishCertificatesForBatch), so drafts stay invisible to the candidate until an admin reviews and
 * publishes them.
 */
async function issueCertificateCore(input: {
  projectId: string;
  enrollment: HydratedDocument<EnrollmentDoc>;
  template: HydratedDocument<CertificateTemplateDoc>;
  issuedByUserId: string;
  origin: string;
  gates?: GateCheck;
  status: "draft" | "issued";
}): Promise<{ certificate: HydratedDocument<CertificateDoc>; emailResult: import("./email.service").SendResult }> {
  const { projectId, enrollment, template, issuedByUserId, origin, status } = input;

  const gates = input.gates ?? (await evaluateGates(projectId, enrollment));
  if (!gatesMet(gates)) {
    throw ApiError.badRequest("Certificate gates not satisfied", gates);
  }

  const [candidate, workshop, batch] = await Promise.all([
    User.findById(enrollment.candidateUserId),
    Workshop.findById(enrollment.workshopId),
    Batch.findById(enrollment.batchId),
  ]);

  const seq = await getNextSequence(`certificate_seq_${projectId}`);
  const certificateNumber = String(seq).padStart(2, "0");
  const verificationCode = crypto.randomBytes(8).toString("hex");
  // Static verification URL — every certificate's QR is byte-identical and just points at the
  // lookup landing page; the candidate types their certificate number in there themselves.
  const verificationUrl = `${env.WEBSITE_URL}/verify`;

  let fileUrl: string | null = null;
  let pdfBuffer: Buffer | undefined;
  if (template.backgroundImageUrl) {
    try {
      pdfBuffer = await renderCertificatePdf({
        backgroundImageAbsolutePath: resolveUploadsPath(template.backgroundImageUrl),
        layoutConfig: mergeWithDefaults(template.layoutConfig as Record<string, unknown> | null),
        certificateNumber,
        participantName: candidate?.fullName ?? "Participant",
        location: batch?.venue?.city || batch?.venue?.name || "",
        issueDate: new Date(),
        verificationUrl,
      });
      const filename = `${crypto.randomUUID()}.pdf`;
      await fs.writeFile(path.join(CERTIFICATES_DIR, filename), pdfBuffer);
      fileUrl = `${origin}/uploads/certificates/${filename}`;
    } catch (err) {
      console.error("[certificate] PDF render failed, issuing without a file:", err);
      pdfBuffer = undefined;
    }
  }

  const certificate = await Certificate.create({
    projectId,
    enrollmentId: enrollment._id,
    candidateUserId: enrollment.candidateUserId,
    workshopId: enrollment.workshopId,
    batchId: enrollment.batchId,
    certificateNumber,
    templateId: template._id,
    verificationCode,
    issueDate: new Date(),
    fileUrl,
    status,
    createdBy: issuedByUserId,
  });

  await Enrollment.updateOne(
    { _id: enrollment.id },
    { $set: { certificateId: certificate._id, ...(status === "issued" ? { status: "certified" } : {}) } },
  );

  let emailResult: import("./email.service").SendResult = { delivered: false, reason: "Saved as draft — not yet published" };
  if (status === "issued") {
    emailResult = await deliverCertificateEmail({ projectId, certificate, candidate, workshop, pdfBuffer });
  }

  return { certificate, emailResult };
}

export async function issueCertificate(input: { projectId: string; enrollmentId: string; templateId: string; issuedByUserId: string; origin: string }) {
  const enrollment = await Enrollment.findOne({ _id: input.enrollmentId, projectId: input.projectId });
  if (!enrollment) throw ApiError.notFound("Enrollment not found");

  const template = await CertificateTemplate.findOne({ _id: input.templateId, projectId: input.projectId });
  if (!template) throw ApiError.notFound("Certificate template not found");

  const { certificate } = await issueCertificateCore({
    projectId: input.projectId,
    enrollment,
    template,
    issuedByUserId: input.issuedByUserId,
    origin: input.origin,
    status: "issued",
  });
  return certificate;
}

export interface BatchGenerateResult {
  totalEnrollments: number;
  drafted: { enrollmentId: string; candidateName: string; certificateId: string; certificateNumber: string }[];
  skippedAlreadyCertified: { enrollmentId: string; candidateName: string }[];
  skippedIneligible: { enrollmentId: string; candidateName: string; gates: GateCheck }[];
  failed: { enrollmentId: string; candidateName: string; error: string }[];
}

/** Renders + saves a certificate (as a draft — not emailed, not yet visible to the candidate) for
 * every eligible, not-yet-certified enrollment in a batch. One candidate's failure is caught and
 * reported, never aborts the rest of the batch. Drafts are reviewed (e.g. via the certificates-zip
 * download) and then sent out for real with publishCertificatesForBatch below. */
export async function generateCertificatesForBatch(input: {
  projectId: string;
  workshopId: string;
  batchId: string;
  templateId: string;
  issuedByUserId: string;
  origin: string;
}): Promise<BatchGenerateResult> {
  const template = await CertificateTemplate.findOne({ _id: input.templateId, projectId: input.projectId });
  if (!template) throw ApiError.notFound("Certificate template not found");

  const enrollments = await Enrollment.find({ projectId: input.projectId, workshopId: input.workshopId, batchId: input.batchId });

  const result: BatchGenerateResult = { totalEnrollments: enrollments.length, drafted: [], skippedAlreadyCertified: [], skippedIneligible: [], failed: [] };

  for (const enrollment of enrollments) {
    const candidate = await User.findById(enrollment.candidateUserId);
    const candidateName = candidate?.fullName ?? "Unknown candidate";

    if (enrollment.status === "certified" || enrollment.certificateId) {
      result.skippedAlreadyCertified.push({ enrollmentId: enrollment.id, candidateName });
      continue;
    }

    try {
      const gates = await evaluateGates(input.projectId, enrollment);
      if (!gatesMet(gates)) {
        result.skippedIneligible.push({ enrollmentId: enrollment.id, candidateName, gates });
        continue;
      }

      const { certificate } = await issueCertificateCore({
        projectId: input.projectId,
        enrollment,
        template,
        issuedByUserId: input.issuedByUserId,
        origin: input.origin,
        gates,
        status: "draft",
      });
      result.drafted.push({ enrollmentId: enrollment.id, candidateName, certificateId: certificate.id, certificateNumber: certificate.certificateNumber });
    } catch (err) {
      result.failed.push({ enrollmentId: enrollment.id, candidateName, error: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  return result;
}

export interface BatchPublishResult {
  totalDrafts: number;
  published: { certificateId: string; candidateName: string; certificateNumber: string; emailDelivered: boolean }[];
  failed: { certificateId: string; candidateName: string; error: string }[];
}

/** Flips every draft certificate in a batch to "issued": sends the candidate their certificate
 * email, and marks the enrollment "certified" so it shows up on the candidate's dashboard. This is
 * the deliberate second step an admin takes after reviewing/downloading the drafts from
 * generateCertificatesForBatch — nothing reaches the candidate until this runs. */
export async function publishCertificatesForBatch(input: {
  projectId: string;
  workshopId: string;
  batchId: string;
}): Promise<BatchPublishResult> {
  const drafts = await Certificate.find({
    projectId: input.projectId,
    workshopId: input.workshopId,
    batchId: input.batchId,
    status: "draft",
  });

  const result: BatchPublishResult = { totalDrafts: drafts.length, published: [], failed: [] };

  for (const certificate of drafts) {
    const candidate = await User.findById(certificate.candidateUserId);
    const candidateName = candidate?.fullName ?? "Unknown candidate";

    try {
      const workshop = await Workshop.findById(certificate.workshopId);

      certificate.status = "issued";
      await certificate.save();
      await Enrollment.updateOne({ _id: certificate.enrollmentId }, { $set: { status: "certified" } });

      const emailResult = await deliverCertificateEmail({ projectId: input.projectId, certificate, candidate, workshop });
      result.published.push({
        certificateId: certificate.id,
        candidateName,
        certificateNumber: certificate.certificateNumber,
        emailDelivered: emailResult.delivered,
      });
    } catch (err) {
      result.failed.push({ certificateId: certificate.id, candidateName, error: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  return result;
}

export async function revokeCertificate(input: { projectId: string; certificateId: string; reason: string; revokedBy: string }) {
  const certificate = await Certificate.findOne({ _id: input.certificateId, projectId: input.projectId });
  if (!certificate) throw ApiError.notFound("Certificate not found");
  if (certificate.status !== "issued") throw ApiError.conflict("Certificate is not currently issued");

  certificate.status = "revoked";
  certificate.revokedReason = input.reason;
  certificate.revokedAt = new Date();
  certificate.set("revokedBy", input.revokedBy);
  await certificate.save();

  await Enrollment.updateOne({ _id: certificate.enrollmentId }, { $set: { status: "completed" } });

  const [candidate, workshop] = await Promise.all([
    User.findById(certificate.candidateUserId),
    Workshop.findById(certificate.workshopId),
  ]);

  if (candidate) {
    const emailResult = await sendCertificateRevokedEmail({
      to: candidate.email,
      fullName: candidate.fullName,
      workshopTitle: workshop?.title ?? "your training",
      certificateNumber: certificate.certificateNumber,
      reason: input.reason,
    });

    await sendNotification({
      projectId: input.projectId,
      recipientUserId: candidate.id,
      channel: "email",
      subject: `Your certificate for ${workshop?.title ?? "your training"} was revoked`,
      body: emailResult.delivered ? `Revocation email sent to ${candidate.email}.` : `Email delivery skipped (${emailResult.reason}).`,
      relatedEntity: { type: "certificate", id: certificate.id },
    });
  }

  return certificate;
}

export async function listCertificates(projectId: string, filters: { workshopId?: string; batchId?: string; candidateUserId?: string; status?: string }) {
  const query: Record<string, unknown> = { projectId };
  if (filters.workshopId) query.workshopId = filters.workshopId;
  if (filters.batchId) query.batchId = filters.batchId;
  if (filters.candidateUserId) query.candidateUserId = filters.candidateUserId;
  if (filters.status) query.status = filters.status;
  return Certificate.find(query).sort({ issueDate: -1 });
}

export async function getOwnCertificates(candidateUserId: string) {
  // Drafts aren't published yet — keep them off the candidate's own certificate list.
  return Certificate.find({ candidateUserId, status: { $ne: "draft" } }).sort({ issueDate: -1 });
}

/**
 * Public verification — no auth, no tenant context. Accepts either the random verificationCode
 * (from an old per-certificate QR) or the human-readable certificateNumber printed on the
 * certificate itself (what a candidate types in on the /verify landing page). Drafts are excluded —
 * they aren't published yet, so they shouldn't verify successfully.
 */
export async function verifyByCode(code: string) {
  const trimmed = code.trim();
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const certificate = await Certificate.findOne({
    status: { $ne: "draft" },
    $or: [{ verificationCode: trimmed }, { certificateNumber: { $regex: `^${escaped}$`, $options: "i" } }],
  });
  if (!certificate) throw ApiError.notFound("No certificate matches this ID");

  const [candidate, workshop, project, batch] = await Promise.all([
    User.findById(certificate.candidateUserId),
    Workshop.findById(certificate.workshopId),
    Project.findById(certificate.get("projectId")),
    Batch.findById(certificate.batchId),
  ]);

  // "Organization" on the public verify page means the company/NGO the candidate registered
  // under — not this platform's own tenant (Project). Prefer the staff-registered Organisation
  // record, then a manually-typed affiliatedOrganisation, falling back to the project name only
  // if the candidate has neither (e.g. an individual walk-in with no employer on file).
  let organisationName: string | null = null;
  if (candidate) {
    const candidateProfile = await CandidateProfile.findOne({ userId: candidate._id });
    if (candidateProfile?.organisationId) {
      const organisation = await Organisation.findById(candidateProfile.organisationId);
      organisationName = organisation?.name ?? null;
    } else if (candidateProfile?.affiliatedOrganisation?.name) {
      organisationName = candidateProfile.affiliatedOrganisation.name;
    }
  }

  return {
    certificateNumber: certificate.certificateNumber,
    status: certificate.status,
    issueDate: certificate.issueDate,
    candidateName: candidate?.fullName ?? "Unknown",
    workshopTitle: workshop?.title ?? "Unknown",
    batchName: batch?.name ?? null,
    organisationName: organisationName ?? project?.name ?? "Unknown",
  };
}
