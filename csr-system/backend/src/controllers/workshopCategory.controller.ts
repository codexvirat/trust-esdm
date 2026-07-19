import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as service from "../services/workshopCategory.service";
import { ApiError } from "../utils/ApiError";
import { resolveProjectId } from "../utils/tenantScope";

export const create = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const category = await service.createWorkshopCategory({ ...req.body, projectId: resolveProjectId(req), createdBy: req.user.userId });
  res.status(201).json(category);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  res.json(await service.listWorkshopCategories(resolveProjectId(req)));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  res.json(await service.updateWorkshopCategory(resolveProjectId(req), req.params.id as string, req.body, req.user.userId));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await service.deleteWorkshopCategory(resolveProjectId(req), req.params.id as string, req.user.userId);
  res.status(204).send();
});
