import { TrainerAssignment } from "../models/TrainerAssignment";
import { Batch } from "../models/Batch";
import { User } from "../models/User";
import { ApiError } from "../utils/ApiError";
import type { TrainerAssignmentRole } from "../types/enums";

export async function assignTrainer(input: {
  projectId: string;
  workshopId: string;
  batchId: string;
  trainerId: string;
  roleInBatch?: TrainerAssignmentRole;
  assignedByManagerId: string;
}) {
  const batch = await Batch.findOne({ _id: input.batchId, projectId: input.projectId, workshopId: input.workshopId });
  if (!batch) throw ApiError.notFound("Batch not found");

  const trainer = await User.findOne({ _id: input.trainerId, projectId: input.projectId, roleCode: "trainer" });
  if (!trainer) throw ApiError.badRequest("trainerId does not refer to a trainer in this project");

  const existing = await TrainerAssignment.findOne({ batchId: input.batchId, trainerId: input.trainerId });
  if (existing) {
    if (existing.status === "active") throw ApiError.conflict("Trainer is already assigned to this batch");
    return TrainerAssignment.findByIdAndUpdate(
      existing._id,
      { $set: { status: "active", roleInBatch: input.roleInBatch ?? "lead", assignedByManagerId: input.assignedByManagerId } },
      { new: true },
    );
  }

  return TrainerAssignment.create({
    projectId: input.projectId,
    batchId: input.batchId,
    workshopId: input.workshopId,
    trainerId: input.trainerId,
    assignedByManagerId: input.assignedByManagerId,
    roleInBatch: input.roleInBatch ?? "lead",
    status: "active",
  });
}

export async function listAssignmentsForBatch(projectId: string, batchId: string) {
  return TrainerAssignment.find({ projectId, batchId, status: "active" }).sort({ createdAt: 1 });
}

/** A trainer's own dashboard home: every batch they're currently assigned to, across all workshops. */
export async function listOwnAssignments(projectId: string, trainerId: string) {
  return TrainerAssignment.find({ projectId, trainerId, status: "active" }).sort({ createdAt: -1 });
}

export async function removeAssignment(projectId: string, batchId: string, assignmentId: string) {
  const assignment = await TrainerAssignment.findOneAndUpdate(
    { _id: assignmentId, projectId, batchId },
    { $set: { status: "removed" } },
    { new: true },
  );
  if (!assignment) throw ApiError.notFound("Assignment not found");
  return assignment;
}
