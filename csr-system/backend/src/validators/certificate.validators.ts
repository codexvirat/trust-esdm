import { z } from "zod";

const positionSchema = z.object({
  xPct: z.number().min(0).max(100),
  yPct: z.number().min(0).max(100),
  fontSize: z.number().positive().optional(),
  widthPct: z.number().positive().optional(),
  color: z.string().optional(),
  align: z.enum(["left", "center", "right"]).optional(),
});

export const certificateLayoutConfigSchema = z.object({
  certificateNumber: positionSchema.optional(),
  participantName: positionSchema.optional(),
  // null = this template's background image already has location/date/QR baked in;
  // skip drawing an overlay for it (see certificatePdf.service.ts#mergeWithDefaults).
  location: positionSchema.nullish(),
  issueDate: positionSchema.nullish(),
  qr: positionSchema.nullish(),
});

export const createCertificateTemplateSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    layoutConfig: certificateLayoutConfigSchema.optional(),
  }),
});

export const issueCertificateSchema = z.object({
  body: z.object({
    templateId: z.string().min(1),
  }),
});

export const generateCertificatesForBatchSchema = z.object({
  body: z.object({
    templateId: z.string().min(1),
  }),
});

export const revokeCertificateSchema = z.object({
  body: z.object({
    reason: z.string().min(2),
  }),
});
