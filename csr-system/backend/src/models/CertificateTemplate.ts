import { Schema, model, type InferSchemaType } from "mongoose";
import { applyBasePlugin } from "./plugins/basePlugin";

const certificateTemplateSchema = new Schema({
  name: { type: String, required: true },
  backgroundMediaId: { type: Schema.Types.ObjectId, ref: "Media", default: null },
  // Plain URL string served from /uploads/certificate-templates/... — same pattern as Batch.photos[].url.
  backgroundImageUrl: { type: String, default: null },
  // Percentage-based (0-100) positions for the 5 overlay fields — see certificatePdf.service.ts#CertificateLayoutConfig.
  layoutConfig: { type: Schema.Types.Mixed, default: {} },
  version: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },
});

applyBasePlugin(certificateTemplateSchema, { tenant: true });

export type CertificateTemplateDoc = InferSchemaType<typeof certificateTemplateSchema>;
export const CertificateTemplate = model("CertificateTemplate", certificateTemplateSchema, "certificate_templates");
