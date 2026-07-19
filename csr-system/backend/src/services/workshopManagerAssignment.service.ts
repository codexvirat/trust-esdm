import { WorkshopManagerAssignment } from "../models/WorkshopManagerAssignment";
import { Batch } from "../models/Batch";
import { User } from "../models/User";
import { ApiError } from "../utils/ApiError";

export async function assignWorkshopManager(input: {
  projectId: string;
  workshopId: string;
  batchId: string;
  workshopManagerId: string;
  assignedByUserId: string;
}) {
  const batch = await Batch.findOne({ _id: input.batchId, projectId: input.projectId, workshopId: input.workshopId });
  if (!batch) throw ApiError.notFound("Batch not found");

  const workshopManager = await User.findOne({
    _id: input.workshopManagerId,
    projectId: input.projectId,
    roleCode: "workshop_manager",
  });
  if (!workshopManager) throw ApiError.badRequest("workshopManagerId does not refer to a workshop manager in this project");

  const existing = await WorkshopManagerAssignment.findOne({ batchId: input.batchId, workshopManagerId: input.workshopManagerId });
  if (existing) {
    if (existing.status === "active") throw ApiError.conflict("Workshop manager is already assigned to this batch");
    return WorkshopManagerAssignment.findByIdAndUpdate(
      existing._id,
      { $set: { status: "active", assignedByUserId: input.assignedByUserId } },
      { new: true },
    );
  }

  return WorkshopManagerAssignment.create({
    projectId: input.projectId,
    batchId: input.batchId,
    workshopId: input.workshopId,
    workshopManagerId: input.workshopManagerId,
    assignedByUserId: input.assignedByUserId,
    status: "active",
  });
}

export async function listAssignmentsForBatch(projectId: string, batchId: string) {
  return WorkshopManagerAssignment.find({ projectId, batchId, status: "active" }).sort({ createdAt: 1 });
}

/** A workshop manager's own dashboard home: every batch they're currently assigned to, across all workshops. */
export async function listOwnAssignments(projectId: string, workshopManagerId: string) {
  return WorkshopManagerAssignment.find({ projectId, workshopManagerId, status: "active" }).sort({ createdAt: -1 });
}

export async function removeAssignment(projectId: string, batchId: string, assignmentId: string) {
  const assignment = await WorkshopManagerAssignment.findOneAndUpdate(
    { _id: assignmentId, projectId, batchId },
    { $set: { status: "removed" } },
    { new: true },
  );
  if (!assignment) throw ApiError.notFound("Assignment not found");
  return assignment;
}
