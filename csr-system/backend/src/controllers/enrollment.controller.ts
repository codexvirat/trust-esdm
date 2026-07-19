import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as service from "../services/enrollment.service";
import { ApiError } from "../utils/ApiError";
import { resolveProjectId } from "../utils/tenantScope";
import type { EnrollmentStatus } from "../types/enums";

export const list = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();

  if (req.user.roleCode === "candidate") {
    res.json(await service.listOwnEnrollments(req.user.userId));
    return;
  }

  if (req.user.roleCode === "trainer") {
    // Trainers only ever see one batch's worth at a time, and only a batch
    // they're actually assigned to — never an unscoped project-wide list.
    const batchId = req.query.batchId as string | undefined;
    if (!batchId) throw ApiError.badRequest("batchId is required");
    await service.assertTrainerAssignedToBatch(resolveProjectId(req), req.user.userId, batchId);
    res.json(await service.listProjectEnrollments(resolveProjectId(req), { batchId }));
    return;
  }

  if (req.user.roleCode === "workshop_manager") {
    // Same idea as trainers — a workshop manager only ever sees one assigned
    // batch's worth at a time, never an unscoped project-wide list.
    const batchId = req.query.batchId as string | undefined;
    if (!batchId) throw ApiError.badRequest("batchId is required");
    await service.assertWorkshopManagerAssignedToBatch(resolveProjectId(req), req.user.userId, batchId);
    res.json(await service.listProjectEnrollments(resolveProjectId(req), { batchId }));
    return;
  }

  if (!["super_admin", "admin", "manager"].includes(req.user.roleCode)) {
    throw ApiError.forbidden("Only candidates (their own), workshop managers (their batch), or managers/admins (project-wide) may list enrollments");
  }

  res.json(
    await service.listProjectEnrollments(resolveProjectId(req), {
      workshopId: req.query.workshopId as string | undefined,
      batchId: req.query.batchId as string | undefined,
      status: req.query.status as EnrollmentStatus | undefined,
    }),
  );
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const enrollment = await service.getEnrollmentById(resolveProjectId(req), req.params.id as string);

  if (req.user.roleCode === "candidate" && enrollment.candidateUserId.toString() !== req.user.userId) {
    throw ApiError.forbidden("Not your enrollment");
  }

  res.json(enrollment);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const result = await service.enrollExistingCandidate({
    projectId: resolveProjectId(req),
    candidateUserId: req.body.candidateUserId,
    workshopId: req.body.workshopId,
    batchId: req.body.batchId,
    reviewerUserId: req.user.userId,
  });
  res.status(201).json(result);
});
