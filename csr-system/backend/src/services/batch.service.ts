import { Batch } from "../models/Batch";
import { Workshop } from "../models/Workshop";
import { User } from "../models/User";
import { ApiError } from "../utils/ApiError";
import { softDeleteById } from "../utils/softDelete";
import { cascadeDeleteBatch } from "../utils/cascadeDelete";

// Only staff roles that can be handed responsibility for a day's plan —
// deliberately excludes trainer/candidate, who aren't among the "manager, org
// admin, admin, or workshop manager" set this feature was built for.
const DAY_PLAN_ASSIGNABLE_ROLES = ["super_admin", "admin", "manager", "workshop_manager"] as const;

async function assertAssignableToDayPlan(projectId: string, assignedToUserId: string) {
  const user = await User.findOne({ _id: assignedToUserId, projectId, roleCode: { $in: DAY_PLAN_ASSIGNABLE_ROLES } });
  if (!user) throw ApiError.badRequest("assignedToUserId must be a Manager, Admin, Super Admin, or Workshop Manager in this project");
}

async function assertWorkshopExists(projectId: string, workshopId: string) {
  const workshop = await Workshop.findOne({ _id: workshopId, projectId });
  if (!workshop) throw ApiError.notFound("Workshop not found");
  return workshop;
}

export async function createBatch(input: {
  projectId: string;
  workshopId: string;
  code: string;
  name: string;
  startDate: Date;
  endDate: Date;
  venueId?: string;
  capacity?: number;
  createdBy: string;
}) {
  await assertWorkshopExists(input.projectId, input.workshopId);
  const existing = await Batch.findOne({ workshopId: input.workshopId, code: input.code });
  if (existing) throw ApiError.conflict(`Batch code "${input.code}" already exists for this workshop`);
  return Batch.create(input);
}

export async function listBatchesForWorkshop(projectId: string, workshopId: string) {
  await assertWorkshopExists(projectId, workshopId);
  return Batch.find({ projectId, workshopId }).sort({ startDate: 1 });
}

export async function getBatchById(projectId: string, workshopId: string, batchId: string) {
  const batch = await Batch.findOne({ _id: batchId, projectId, workshopId });
  if (!batch) throw ApiError.notFound("Batch not found");
  return batch;
}

export async function updateBatch(projectId: string, workshopId: string, batchId: string, updates: Record<string, unknown>, updatedBy: string) {
  const batch = await Batch.findOneAndUpdate({ _id: batchId, projectId, workshopId }, { $set: { ...updates, updatedBy } }, { new: true });
  if (!batch) throw ApiError.notFound("Batch not found");
  return batch;
}

/**
 * Deleting a batch cascades to everything scoped to it — enrollments,
 * attendance, certificates, trainer assignments, batch-specific
 * assessments/feedback forms and their attempts/responses (see
 * utils/cascadeDelete.ts) — before soft-deleting the batch itself.
 */
export async function deleteBatch(projectId: string, workshopId: string, batchId: string, deletedBy: string) {
  const existing = await Batch.findOne({ _id: batchId, projectId, workshopId });
  if (!existing) throw ApiError.notFound("Batch not found");

  await cascadeDeleteBatch(projectId, batchId, workshopId, deletedBy);

  const batch = await softDeleteById(Batch, batchId, { projectId, workshopId }, deletedBy);
  if (!batch) throw ApiError.notFound("Batch not found");
}

interface PopulatedVenue {
  name: string;
  city?: string;
  address?: string;
  geo?: { lat: number; lng: number };
}

interface PopulatedWorkshop {
  title: string;
  slug: string;
  status: string;
}

function toVenueSummary(venueId: unknown): PopulatedVenue | null {
  return venueId && typeof venueId === "object" ? (venueId as PopulatedVenue) : null;
}

/**
 * Public site batch list — trimmed to fields safe to show on an unauthenticated
 * marketing page. Deliberately omits enrolledCount/capacity (seat availability)
 * and never touches Enrollment/User, so no candidate PII is exposed here.
 *
 * Venue is resolved live from venueId (rather than a stored snapshot) so it
 * always reflects the current Venue record, including venues assigned after
 * the batch was created.
 */
export async function getPublicBatchesForWorkshop(projectId: string, workshopId: string) {
  const batches = await Batch.find({ projectId, workshopId })
    .sort({ startDate: 1 })
    .select("code name startDate endDate venueId status")
    .populate("venueId", "name city address geo")
    .lean();

  return batches.map(({ venueId, ...batch }) => ({
    ...batch,
    venue: toVenueSummary(venueId),
  }));
}

export async function getPublicBatchById(projectId: string, batchId: string) {
  const batch = await Batch.findOne({ _id: batchId, projectId })
    .select("code name startDate endDate venueId status workshopId photos")
    .populate("venueId", "name city address geo")
    .populate("workshopId", "title slug status")
    .lean();
  const workshop = batch?.workshopId && typeof batch.workshopId === "object" ? (batch.workshopId as unknown as PopulatedWorkshop) : null;
  if (!batch || !workshop || !["published", "ongoing", "completed"].includes(workshop.status)) {
    throw ApiError.notFound("Batch not found");
  }

  const { venueId, workshopId: _workshopId, ...rest } = batch;
  return {
    ...rest,
    venue: toVenueSummary(venueId),
    workshop: { title: workshop.title, slug: workshop.slug },
  };
}

export async function addBatchPhoto(projectId: string, workshopId: string, batchId: string, url: string) {
  const batch = await Batch.findOneAndUpdate(
    { _id: batchId, projectId, workshopId },
    { $push: { photos: { url } } },
    { new: true },
  );
  if (!batch) throw ApiError.notFound("Batch not found");
  return batch;
}

export async function removeBatchPhoto(projectId: string, workshopId: string, batchId: string, photoId: string) {
  const batch = await Batch.findOneAndUpdate(
    { _id: batchId, projectId, workshopId },
    { $pull: { photos: { _id: photoId } } },
    { new: true },
  );
  if (!batch) throw ApiError.notFound("Batch not found");
  return batch;
}

export async function addDayPlanEntry(
  projectId: string,
  workshopId: string,
  batchId: string,
  input: { date: Date; title: string; assignedToUserId?: string | null },
) {
  if (input.assignedToUserId) await assertAssignableToDayPlan(projectId, input.assignedToUserId);

  const batch = await Batch.findOneAndUpdate(
    { _id: batchId, projectId, workshopId },
    { $push: { dayPlan: { date: input.date, title: input.title, assignedToUserId: input.assignedToUserId || null } } },
    { new: true },
  );
  if (!batch) throw ApiError.notFound("Batch not found");
  return batch;
}

export async function updateDayPlanEntry(
  projectId: string,
  workshopId: string,
  batchId: string,
  entryId: string,
  updates: { date?: Date; title?: string; assignedToUserId?: string | null },
) {
  if (updates.assignedToUserId) await assertAssignableToDayPlan(projectId, updates.assignedToUserId);

  const set: Record<string, unknown> = {};
  if (updates.date !== undefined) set["dayPlan.$.date"] = updates.date;
  if (updates.title !== undefined) set["dayPlan.$.title"] = updates.title;
  if (updates.assignedToUserId !== undefined) set["dayPlan.$.assignedToUserId"] = updates.assignedToUserId || null;

  const batch = await Batch.findOneAndUpdate(
    { _id: batchId, projectId, workshopId, "dayPlan._id": entryId },
    { $set: set },
    { new: true },
  );
  if (!batch) throw ApiError.notFound("Batch or day-plan entry not found");
  return batch;
}

export async function removeDayPlanEntry(projectId: string, workshopId: string, batchId: string, entryId: string) {
  const batch = await Batch.findOneAndUpdate(
    { _id: batchId, projectId, workshopId },
    { $pull: { dayPlan: { _id: entryId } } },
    { new: true },
  );
  if (!batch) throw ApiError.notFound("Batch not found");
  return batch;
}
