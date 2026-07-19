import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as service from "../services/workshop.service";
import { ApiError } from "../utils/ApiError";
import { resolveProjectId } from "../utils/tenantScope";
import type { WorkshopStatus } from "../types/enums";

export const create = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const workshop = await service.createWorkshop({
    ...req.body,
    projectId: resolveProjectId(req),
    createdByManagerId: req.user.userId,
    createdBy: req.user.userId,
  });
  res.status(201).json(workshop);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const workshops = await service.listWorkshops(resolveProjectId(req), {
    status: req.query.status as WorkshopStatus | undefined,
    categoryId: req.query.categoryId as string | undefined,
  });
  res.json(workshops);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  res.json(await service.getWorkshopById(resolveProjectId(req), req.params.id as string));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  res.json(await service.updateWorkshop(resolveProjectId(req), req.params.id as string, req.body, req.user.userId));
});

export const setStatus = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  res.json(await service.setWorkshopStatus(resolveProjectId(req), req.params.id as string, req.body.status, req.user.userId));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await service.deleteWorkshop(resolveProjectId(req), req.params.id as string, req.user.userId);
  res.status(204).send();
});
