import { Workshop } from "../models/Workshop";
import { ApiError } from "../utils/ApiError";
import { softDeleteById } from "../utils/softDelete";
import type { WorkshopStatus } from "../types/enums";

export async function createWorkshop(input: {
  projectId: string;
  title: string;
  slug: string;
  createdByManagerId: string;
  [key: string]: unknown;
}) {
  const existing = await Workshop.findOne({ projectId: input.projectId, slug: (input.slug as string).toLowerCase() });
  if (existing) throw ApiError.conflict(`Workshop slug "${input.slug}" already exists`);
  return Workshop.create({ ...input, slug: (input.slug as string).toLowerCase() });
}

export async function listWorkshops(projectId: string, filters: { status?: WorkshopStatus; categoryId?: string }) {
  const query: Record<string, unknown> = { projectId };
  if (filters.status) query.status = filters.status;
  if (filters.categoryId) query.categoryId = filters.categoryId;
  return Workshop.find(query).sort({ createdAt: -1 });
}

export async function getWorkshopById(projectId: string, id: string) {
  const workshop = await Workshop.findOne({ _id: id, projectId });
  if (!workshop) throw ApiError.notFound("Workshop not found");
  return workshop;
}

export async function updateWorkshop(projectId: string, id: string, updates: Record<string, unknown>, updatedBy: string) {
  const workshop = await Workshop.findOneAndUpdate({ _id: id, projectId }, { $set: { ...updates, updatedBy } }, { new: true });
  if (!workshop) throw ApiError.notFound("Workshop not found");
  return workshop;
}

export async function setWorkshopStatus(projectId: string, id: string, status: WorkshopStatus, updatedBy: string) {
  const workshop = await Workshop.findOneAndUpdate({ _id: id, projectId }, { $set: { status, updatedBy } }, { new: true });
  if (!workshop) throw ApiError.notFound("Workshop not found");
  return workshop;
}

export async function deleteWorkshop(projectId: string, id: string, deletedBy: string) {
  const workshop = await softDeleteById(Workshop, id, { projectId }, deletedBy);
  if (!workshop) throw ApiError.notFound("Workshop not found");
}

/** Public site browse/search — published workshops for one project's public site. */
export async function searchPublicWorkshops(projectId: string, query: { q?: string; category?: string; page?: number; limit?: number }) {
  const filter: Record<string, unknown> = { projectId, status: "published" };
  if (query.category) filter.categoryId = query.category;
  if (query.q) filter.$text = { $search: query.q };

  const page = query.page ?? 1;
  const limit = query.limit ?? 20;

  const [items, total] = await Promise.all([
    Workshop.find(filter)
      .sort(query.q ? { score: { $meta: "textScore" } } : { createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Workshop.countDocuments(filter),
  ]);

  return { items, total, page, limit };
}

export async function getPublicWorkshopBySlug(projectId: string, slug: string) {
  const workshop = await Workshop.findOne({ projectId, slug: slug.toLowerCase(), status: { $in: ["published", "ongoing"] } });
  if (!workshop) throw ApiError.notFound("Workshop not found");
  return workshop;
}
