import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as service from "../services/attendanceSession.service";
import { ApiError } from "../utils/ApiError";
import { resolveProjectId } from "../utils/tenantScope";

export const create = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const session = await service.generateSession({
    ...req.body,
    projectId: resolveProjectId(req),
    workshopId: req.params.workshopId as string,
    batchId: req.params.batchId as string,
    generatedByUserId: req.user.userId,
    generatedByRoleCode: req.user.roleCode,
  });
  res.status(201).json(session);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  res.json(await service.listSessionsForBatch(resolveProjectId(req), req.params.workshopId as string, req.params.batchId as string));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  res.json(
    await service.getSessionById(resolveProjectId(req), req.params.workshopId as string, req.params.batchId as string, req.params.sessionId as string),
  );
});

export const close = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  res.json(
    await service.closeSession(resolveProjectId(req), req.params.workshopId as string, req.params.batchId as string, req.params.sessionId as string),
  );
});
