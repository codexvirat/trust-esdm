/* eslint-disable no-console */
/**
 * Issues a real certificate (PDF + DB record) for any candidate, for manual testing.
 * Reuses the production issuance path (services/certificate.service.ts) so the
 * generated PDF/QR/verification-code exercise the same code the app uses.
 *
 * Usage:
 *   npx tsx scripts/generate-test-certificate.ts <email-or-userId> [enrollmentId]
 *
 * If no enrollmentId is given, it uses the candidate's first enrollment (creating
 * one against the first available Workshop+Batch in their project if they have
 * none), then force-satisfies the attendance/assessment/feedback gates so
 * issuance doesn't get blocked by real progress data.
 */
import "../src/models";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../src/config/db";
import { User } from "../src/models/User";
import { Enrollment } from "../src/models/Enrollment";
import { Workshop } from "../src/models/Workshop";
import { Batch } from "../src/models/Batch";
import { CertificateTemplate } from "../src/models/CertificateTemplate";
import { Certificate } from "../src/models/Certificate";
import { issueCertificate } from "../src/services/certificate.service";
import { CERTIFICATE_TEMPLATES_DIR } from "../src/middleware/upload";
import { env } from "../src/config/env";

// Dropped at the repo root for local testing — matches the ~1536x1024 landscape
// layout DEFAULT_CERTIFICATE_LAYOUT (certificatePdf.service.ts) is tuned for.
const FALLBACK_TEMPLATE_IMAGE = path.resolve(__dirname, "..", "..", "..", "Certificate.png");

async function main() {
  const identifier = process.argv[2];
  const enrollmentIdArg = process.argv[3];

  if (!identifier) {
    console.error("Usage: npx tsx scripts/generate-test-certificate.ts <email-or-userId> [enrollmentId]");
    process.exit(1);
  }

  await connectDB();

  const user = mongoose.isValidObjectId(identifier)
    ? await User.findById(identifier)
    : await User.findOne({ email: identifier.toLowerCase().trim() });

  if (!user) {
    console.error(`[cert] no user found for "${identifier}"`);
    await disconnectDB();
    process.exit(1);
  }

  const projectId = String(user.get("projectId"));
  console.log(`[cert] candidate: ${user.fullName} <${user.email}> (projectId=${projectId})`);

  let enrollment = enrollmentIdArg
    ? await Enrollment.findOne({ _id: enrollmentIdArg, candidateUserId: user.id, projectId })
    : await Enrollment.findOne({ candidateUserId: user.id, projectId });

  if (!enrollment) {
    console.log("[cert] no enrollment found for this candidate — creating one against an existing workshop/batch");
    const batch = await Batch.findOne({ projectId });
    if (!batch) {
      console.error("[cert] no batch exists in this project — create a Workshop + Batch first, or pass an enrollmentId");
      await disconnectDB();
      process.exit(1);
    }
    enrollment = await Enrollment.create({
      projectId,
      candidateUserId: user.id,
      workshopId: batch.workshopId,
      batchId: batch._id,
      status: "assigned",
    });
    console.log(`[cert] created enrollment ${enrollment.id} (workshopId=${batch.workshopId}, batchId=${batch._id})`);
  }

  if (enrollment.certificateId) {
    const existing = await Certificate.findById(enrollment.certificateId);
    if (existing && existing.status === "issued") {
      console.log("[cert] this enrollment is already certified — printing existing certificate instead of reissuing:");
      console.log(`  certificateNumber: ${existing.certificateNumber}`);
      console.log(`  verificationCode:  ${existing.verificationCode}`);
      console.log(`  fileUrl:           ${existing.fileUrl}`);
      await disconnectDB();
      return;
    }
  }

  const workshop = await Workshop.findById(enrollment.workshopId);
  const settings = workshop?.certificateSettings ?? { minAttendancePercent: 80 };

  // Force the eligibility gates so this test run isn't blocked by real attendance/assessment/feedback data.
  enrollment.attendancePercent = Math.max(settings.minAttendancePercent, enrollment.attendancePercent);
  enrollment.assessmentStatus = "passed";
  enrollment.feedbackSubmitted = true;
  await enrollment.save();

  let template = await CertificateTemplate.findOne({ projectId, isActive: true }).sort({ createdAt: -1 });
  if (!template) {
    if (!fs.existsSync(FALLBACK_TEMPLATE_IMAGE)) {
      console.error("[cert] no certificate template exists for this project — create one in the admin portal first");
      await disconnectDB();
      process.exit(1);
    }
    const filename = `${crypto.randomUUID()}.png`;
    fs.copyFileSync(FALLBACK_TEMPLATE_IMAGE, path.join(CERTIFICATE_TEMPLATES_DIR, filename));
    template = await CertificateTemplate.create({
      projectId,
      name: "Test template (auto-generated)",
      backgroundImageUrl: `http://localhost:${env.PORT}/uploads/certificate-templates/${filename}`,
      createdBy: user.id,
    });
    console.log(`[cert] no template found — created one from repo-root Certificate.png (templateId=${template.id})`);
  }
  if (!template.backgroundImageUrl) {
    console.warn(`[cert] template "${template.name}" has no background image — certificate will be issued without a PDF file`);
  }

  const certificate = await issueCertificate({
    projectId,
    enrollmentId: enrollment.id,
    templateId: template.id,
    issuedByUserId: user.id,
    origin: `http://localhost:${env.PORT}`,
  });

  console.log("[cert] issued:");
  console.log(`  certificateNumber: ${certificate.certificateNumber}`);
  console.log(`  verificationCode:  ${certificate.verificationCode}`);
  console.log(`  fileUrl:           ${certificate.fileUrl}`);

  await disconnectDB();
}

main().catch((err) => {
  console.error("[cert] failed", err);
  process.exit(1);
});
