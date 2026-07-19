import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as service from "../services/workshopManagerAssignment.service";
import { ApiError } from "../utils/ApiError";
import { resolveProjectId } from "../utils/tenantScope";

export const assign = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const assignment = await service.assignWorkshopManager({
    ...req.body,
    projectId: resolveProjectId(req),
    workshopId: req.params.workshopId as string,
    batchId: req.params.batchId as string,
    assignedByUserId: req.user.userId,
  });
  res.status(201).json(assignment);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  res.json(await service.listAssignmentsForBatch(resolveProjectId(req), req.params.batchId as string));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await service.removeAssignment(resolveProjectId(req), req.params.batchId as string, req.params.assignmentId as string);
  res.status(204).send();
});
