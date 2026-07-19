import { CertificateTemplate } from "../models/CertificateTemplate";
import { ApiError } from "../utils/ApiError";
import { softDeleteById } from "../utils/softDelete";

export async function createTemplate(input: {
  projectId: string;
  name: string;
  backgroundImageUrl?: string;
  layoutConfig?: Record<string, unknown>;
  createdBy: string;
}) {
  return CertificateTemplate.create({ ...input, version: 1, isActive: true });
}

export async function listTemplates(projectId: string) {
  return CertificateTemplate.find({ projectId, isActive: true }).sort({ createdAt: -1 });
}

export async function getTemplateById(projectId: string, id: string) {
  const template = await CertificateTemplate.findOne({ _id: id, projectId });
  if (!template) throw ApiError.notFound("Certificate template not found");
  return template;
}

/** Soft-deletes the template — already-issued certificates keep their own rendered PDF/QR
 * and don't need to re-read the template, so this only stops it from being offered for new ones. */
export async function deleteTemplate(projectId: string, id: string, deletedBy: string) {
  const template = await softDeleteById(CertificateTemplate, id, { projectId }, deletedBy);
  if (!template) throw ApiError.notFound("Certificate template not found");
  return template;
}
