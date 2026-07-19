import { Venue } from "../models/Venue";
import { ApiError } from "../utils/ApiError";
import { softDeleteById } from "../utils/softDelete";

export async function createVenue(input: {
  projectId: string;
  name: string;
  address?: string;
  city?: string;
  capacity?: number;
  geo?: { lat: number; lng: number };
  createdBy: string;
}) {
  return Venue.create(input);
}

export async function listVenues(projectId: string, city?: string) {
  const filter: Record<string, unknown> = { projectId };
  if (city) filter.city = city;
  return Venue.find(filter).sort({ name: 1 });
}

export async function updateVenue(projectId: string, id: string, updates: Record<string, unknown>, updatedBy: string) {
  const venue = await Venue.findOneAndUpdate({ _id: id, projectId }, { $set: { ...updates, updatedBy } }, { new: true });
  if (!venue) throw ApiError.notFound("Venue not found");
  return venue;
}

export async function deleteVenue(projectId: string, id: string, deletedBy: string) {
  const venue = await softDeleteById(Venue, id, { projectId }, deletedBy);
  if (!venue) throw ApiError.notFound("Venue not found");
}
