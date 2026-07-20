import { Organisation } from "../models/Organisation";
import { ApiError } from "../utils/ApiError";
import { softDeleteById } from "../utils/softDelete";

export async function createOrganisation(input: Record<string, unknown> & { projectId: string; createdBy: string }) {
  return Organisation.create({ ...input, isActive: true });
}

export async function listOrganisations(projectId: string) {
  return Organisation.find({ projectId, isActive: true }).sort({ name: 1 });
}

/** Same query as listOrganisations — kept as a separate export so the public (unauthenticated)
 * route has its own explicit entry point, independent of any future staff-only filtering. */
export async function listPublicOrganisations(projectId: string) {
  return Organisation.find({ projectId, isActive: true }).sort({ name: 1 });
}

export async function getOrganisationById(projectId: string, id: string) {
  const organisation = await Organisation.findOne({ _id: id, projectId });
  if (!organisation) throw ApiError.notFound("Organisation not found");
  return organisation;
}

export async function updateOrganisation(projectId: string, id: string, updates: Record<string, unknown>, updatedBy: string) {
  const existing = await Organisation.findOne({ _id: id, projectId });
  if (!existing) throw ApiError.notFound("Organisation not found");

  const nextEmail = "email" in updates ? updates.email : existing.email;
  const nextPhone = "phone" in updates ? updates.phone : existing.phone;
  if (!nextEmail && !nextPhone) {
    throw ApiError.badRequest("The company must keep at least an email or a phone number");
  }

  const organisation = await Organisation.findOneAndUpdate({ _id: id, projectId }, { $set: { ...updates, updatedBy } }, { new: true });
  return organisation!;
}

export async function deleteOrganisation(projectId: string, id: string, deletedBy: string) {
  const organisation = await softDeleteById(Organisation, id, { projectId }, deletedBy);
  if (!organisation) throw ApiError.notFound("Organisation not found");
  return organisation;
}
