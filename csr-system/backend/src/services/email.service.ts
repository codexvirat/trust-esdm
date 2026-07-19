import { Resend } from "resend";
import QRCode from "qrcode";
import { env } from "../config/env";

let resend: Resend | null | undefined;

function getResend(): Resend | null {
  if (resend !== undefined) return resend;
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM_ADDRESS) {
    resend = null;
    return resend;
  }
  resend = new Resend(env.RESEND_API_KEY);
  return resend;
}

const FROM = () => `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM_ADDRESS}>`;
const NOT_CONFIGURED_REASON = "Email not configured (RESEND_API_KEY/EMAIL_FROM_ADDRESS unset)";

export interface SendResult {
  delivered: boolean;
  reason?: string;
}

export interface SendAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
  /** Set to inline this attachment and reference it in the HTML via `cid:<contentId>` instead of a data: URI (Gmail and most clients strip data: URIs from received mail). */
  contentId?: string;
}

async function send(input: { to: string; subject: string; html: string; attachments?: SendAttachment[] }): Promise<SendResult> {
  const client = getResend();
  if (!client) {
    const attachmentNote = input.attachments?.length ? ` (with ${input.attachments.length} attachment(s): ${input.attachments.map((a) => a.filename).join(", ")})` : "";
    console.log(`[email:stub] Resend not configured (set RESEND_API_KEY/EMAIL_FROM_ADDRESS in backend/.env) — would have emailed ${input.to}: "${input.subject}"${attachmentNote}`);
    return { delivered: false, reason: NOT_CONFIGURED_REASON };
  }

  const { error } = await client.emails.send({
    from: FROM(),
    to: input.to,
    subject: input.subject,
    html: input.html,
    attachments: input.attachments?.map((a) => ({ filename: a.filename, content: a.content, contentType: a.contentType, contentId: a.contentId })),
  });

  if (error) {
    console.error("[email] Resend send failed:", error);
    return { delivered: false, reason: error.message };
  }
  return { delivered: true };
}

/**
 * The one real (non-stub) email this system sends: a candidate's welcome mail
 * once they're enrolled into a batch, carrying their login credentials and
 * their attendance QR badge as an inline (base64) image. Falls back to a
 * console-only stub when Resend isn't configured (see config/env.ts) so
 * local dev doesn't hard-fail without an API key.
 */
export async function sendCandidateWelcomeEmail(input: {
  to: string;
  fullName: string;
  loginEmail: string;
  temporaryPassword: string;
  attendanceQrToken: string;
  workshopTitle: string;
  batchName: string;
}): Promise<SendResult> {
  const qrBuffer = await QRCode.toBuffer(input.attendanceQrToken, { width: 320, margin: 2 });
  const portalUrl = env.CANDIDATE_PORTAL_URL;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #0f172a;">
      <h2 style="color: #0f766e;">Welcome to ${input.workshopTitle}</h2>
      <p>Hi ${input.fullName},</p>
      <p>You've been enrolled in <b>${input.batchName}</b>. Your candidate portal account is ready:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Portal</td>
          <td style="padding: 8px 0;"><a href="${portalUrl}" style="color: #0f766e;">${portalUrl}</a></td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Login ID</td>
          <td style="padding: 8px 0;"><b>${input.loginEmail}</b></td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Temporary password</td>
          <td style="padding: 8px 0;"><b>${input.temporaryPassword}</b></td>
        </tr>
      </table>
      <p style="color: #b45309; font-size: 13px;">You'll be asked to set a new password the first time you sign in.</p>
      <p>Below is your personal attendance badge. Show this QR code to your trainer at every session so they can check you in — you never need to scan it yourself.</p>
      <div style="text-align: center; margin: 20px 0;">
        <img src="cid:qrcode" alt="Attendance QR badge" style="width: 220px; height: 220px;" />
      </div>
      <p style="font-size: 12px; color: #94a3b8;">This badge is also always available on your dashboard under "My QR / Attendance".</p>
    </div>
  `;

  return send({
    to: input.to,
    subject: `You're enrolled in ${input.workshopTitle} — your login & attendance badge`,
    html,
    attachments: [{ filename: "attendance-qr.png", content: qrBuffer, contentType: "image/png", contentId: "qrcode" }],
  });
}

/**
 * Quick "you're enrolled" confirmation, sent immediately when a candidate is
 * assigned to a batch — right before the fuller login-credentials + QR badge
 * email (sendCandidateWelcomeEmail) that follows it. Same
 * Resend-or-console-stub fallback as the other email functions here.
 */
export async function sendEnrollmentConfirmationEmail(input: {
  to: string;
  fullName: string;
  workshopTitle: string;
  batchName: string;
}): Promise<SendResult> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #0f172a;">
      <h2 style="color: #0f766e;">You're enrolled!</h2>
      <p>Hi ${input.fullName},</p>
      <p>You've been successfully enrolled in <b>${input.workshopTitle}</b> — <b>${input.batchName}</b>.</p>
      <p style="color: #64748b; font-size: 13px;">Your portal login details and attendance QR badge are on their way in a separate email.</p>
    </div>
  `;

  return send({ to: input.to, subject: `You're enrolled in ${input.workshopTitle}`, html });
}

/**
 * Welcome mail for staff accounts (Admin/Manager/Trainer) created directly by
 * an Admin/Manager — see user.service.ts#createUserDirect. Same
 * Resend-or-console-stub fallback as sendCandidateWelcomeEmail.
 */
export async function sendAccountWelcomeEmail(input: {
  to: string;
  fullName: string;
  loginEmail: string;
  temporaryPassword: string;
  roleLabel: string;
  portalUrl: string;
}): Promise<SendResult> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #0f172a;">
      <h2 style="color: #0f766e;">Welcome, ${input.fullName}</h2>
      <p>Your <b>${input.roleLabel}</b> account has been created.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Portal</td>
          <td style="padding: 8px 0;"><a href="${input.portalUrl}" style="color: #0f766e;">${input.portalUrl}</a></td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Login ID</td>
          <td style="padding: 8px 0;"><b>${input.loginEmail}</b></td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Temporary password</td>
          <td style="padding: 8px 0;"><b>${input.temporaryPassword}</b></td>
        </tr>
      </table>
      <p style="color: #b45309; font-size: 13px;">You'll be asked to set a new password the first time you sign in.</p>
    </div>
  `;

  return send({ to: input.to, subject: `Your ${input.roleLabel} account is ready`, html });
}

/** Sent when a staff member approves a pending public registration — see registration.service.ts#approveRegistration. */
export async function sendRegistrationApprovedEmail(input: { to: string; fullName: string }): Promise<SendResult> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #0f172a;">
      <h2 style="color: #0f766e;">Your registration was approved</h2>
      <p>Hi ${input.fullName},</p>
      <p>Good news — your registration has been approved and your account is ready.</p>
      <p style="color: #64748b; font-size: 13px;">You'll receive your login details and attendance QR badge by email once you're enrolled into a training batch.</p>
    </div>
  `;

  return send({ to: input.to, subject: "Your registration was approved", html });
}

/** Sent when a staff member rejects a pending public registration — see registration.service.ts#rejectRegistration. */
export async function sendRegistrationRejectedEmail(input: { to: string; fullName: string; reason: string }): Promise<SendResult> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #0f172a;">
      <h2 style="color: #b91c1c;">Update on your registration</h2>
      <p>Hi ${input.fullName},</p>
      <p>Unfortunately, your registration was not approved.</p>
      <p style="padding: 12px; background: #fef2f2; border-radius: 8px; color: #991b1b;"><b>Reason:</b> ${input.reason}</p>
    </div>
  `;

  return send({ to: input.to, subject: "Update on your registration", html });
}

/** Sent when a certificate is issued — see certificate.service.ts#issueCertificateCore. */
export async function sendCertificateIssuedEmail(input: {
  to: string;
  fullName: string;
  workshopTitle: string;
  certificateNumber: string;
  verificationCode: string;
  verificationUrl?: string;
  pdfBuffer?: Buffer;
}): Promise<SendResult> {
  const portalUrl = env.CANDIDATE_PORTAL_URL;
  const qrBuffer = input.verificationUrl ? await QRCode.toBuffer(input.verificationUrl, { width: 220, margin: 2 }) : null;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #0f172a;">
      <h2 style="color: #0f766e;">Congratulations, ${input.fullName}!</h2>
      <p>Your certificate for <b>${input.workshopTitle}</b> has been issued${input.pdfBuffer ? " — it's attached to this email as a PDF" : ""}.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Certificate number</td>
          <td style="padding: 8px 0;"><b>${input.certificateNumber}</b></td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Verification code</td>
          <td style="padding: 8px 0;"><b>${input.verificationCode}</b></td>
        </tr>
      </table>
      ${
        qrBuffer
          ? `<p>Scan this QR code any time to verify the certificate's authenticity:</p>
      <div style="text-align: center; margin: 20px 0;">
        <img src="cid:certqrcode" alt="Certificate verification QR" style="width: 180px; height: 180px;" />
      </div>`
          : ""
      }
      <p>View or download it anytime from <a href="${portalUrl}/dashboard/certificates" style="color: #0f766e;">your candidate portal</a>.</p>
    </div>
  `;

  const attachments: SendAttachment[] = [];
  if (input.pdfBuffer) attachments.push({ filename: `${input.certificateNumber}.pdf`, content: input.pdfBuffer, contentType: "application/pdf" });
  if (qrBuffer) attachments.push({ filename: "certificate-qr.png", content: qrBuffer, contentType: "image/png", contentId: "certqrcode" });

  return send({
    to: input.to,
    subject: `Your certificate for ${input.workshopTitle} is ready`,
    html,
    attachments: attachments.length ? attachments : undefined,
  });
}

/** Sent when a certificate is revoked — see certificate.service.ts#revokeCertificate. */
export async function sendCertificateRevokedEmail(input: {
  to: string;
  fullName: string;
  workshopTitle: string;
  certificateNumber: string;
  reason: string;
}): Promise<SendResult> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #0f172a;">
      <h2 style="color: #b91c1c;">Certificate revoked</h2>
      <p>Hi ${input.fullName},</p>
      <p>Your certificate <b>${input.certificateNumber}</b> for <b>${input.workshopTitle}</b> has been revoked.</p>
      <p style="padding: 12px; background: #fef2f2; border-radius: 8px; color: #991b1b;"><b>Reason:</b> ${input.reason}</p>
    </div>
  `;

  return send({ to: input.to, subject: `Your certificate for ${input.workshopTitle} was revoked`, html });
}
