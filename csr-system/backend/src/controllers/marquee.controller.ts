import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as service from "../services/marquee.service";
import { ApiError } from "../utils/ApiError";
import { resolveProjectId } from "../utils/tenantScope";

export const create = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const marquee = await service.createMarquee({ ...req.body, projectId: resolveProjectId(req), createdBy: req.user.userId });
  res.status(201).json(marquee);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  res.json(await service.listMarquees(resolveProjectId(req)));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  res.json(await service.updateMarquee(resolveProjectId(req), req.params.id as string, req.body, req.user.userId));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await service.deleteMarquee(resolveProjectId(req), req.params.id as string, req.user.userId);
  res.status(204).send();
});
