import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as service from "../services/venue.service";
import { ApiError } from "../utils/ApiError";
import { resolveProjectId } from "../utils/tenantScope";

export const create = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const venue = await service.createVenue({ ...req.body, projectId: resolveProjectId(req), createdBy: req.user.userId });
  res.status(201).json(venue);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  res.json(await service.listVenues(resolveProjectId(req), req.query.city as string | undefined));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  res.json(await service.updateVenue(resolveProjectId(req), req.params.id as string, req.body, req.user.userId));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await service.deleteVenue(resolveProjectId(req), req.params.id as string, req.user.userId);
  res.status(204).send();
});
