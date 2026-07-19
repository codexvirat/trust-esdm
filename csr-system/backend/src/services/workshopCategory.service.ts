import { WorkshopCategory } from "../models/WorkshopCategory";
import { ApiError } from "../utils/ApiError";
import { softDeleteById } from "../utils/softDelete";

export async function createWorkshopCategory(input: { projectId: string; name: string; slug: string; description?: string; createdBy: string }) {
  const existing = await WorkshopCategory.findOne({ projectId: input.projectId, slug: input.slug.toLowerCase() });
  if (existing) throw ApiError.conflict(`Category slug "${input.slug}" already exists`);
  return WorkshopCategory.create({ ...input, slug: input.slug.toLowerCase() });
}

export async function listWorkshopCategories(projectId: string) {
  return WorkshopCategory.find({ projectId }).sort({ name: 1 });
}

export async function updateWorkshopCategory(projectId: string, id: string, updates: { name?: string; description?: string }, updatedBy: string) {
  const category = await WorkshopCategory.findOneAndUpdate({ _id: id, projectId }, { $set: { ...updates, updatedBy } }, { new: true });
  if (!category) throw ApiError.notFound("Category not found");
  return category;
}

export async function deleteWorkshopCategory(projectId: string, id: string, deletedBy: string) {
  const category = await softDeleteById(WorkshopCategory, id, { projectId }, deletedBy);
  if (!category) throw ApiError.notFound("Category not found");
}
