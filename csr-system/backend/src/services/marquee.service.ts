import { Marquee } from "../models/Marquee";
import { ApiError } from "../utils/ApiError";
import { softDeleteById } from "../utils/softDelete";

export async function createMarquee(input: {
  projectId: string;
  message: string;
  linkTarget?: string;
  isActive?: boolean;
  createdBy: string;
}) {
  return Marquee.create(input);
}

export async function listMarquees(projectId: string) {
  return Marquee.find({ projectId }).sort({ createdAt: 1 });
}

export async function updateMarquee(projectId: string, id: string, updates: Record<string, unknown>, updatedBy: string) {
  const marquee = await Marquee.findOneAndUpdate({ _id: id, projectId }, { $set: { ...updates, updatedBy } }, { new: true });
  if (!marquee) throw ApiError.notFound("Marquee item not found");
  return marquee;
}

export async function deleteMarquee(projectId: string, id: string, deletedBy: string) {
  const marquee = await softDeleteById(Marquee, id, { projectId }, deletedBy);
  if (!marquee) throw ApiError.notFound("Marquee item not found");
}

/** Public site header — active items only, in creation order. */
export async function listActiveMarqueesForProject(projectId: string) {
  return Marquee.find({ projectId, isActive: true }).sort({ createdAt: 1 }).select("message linkTarget");
}
