import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as service from "../services/organisation.service";
import { ApiError } from "../utils/ApiError";
import { resolveProjectId } from "../utils/tenantScope";

export const create = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const organisation = await service.createOrganisation({ ...req.body, projectId: resolveProjectId(req), createdBy: req.user.userId });
  res.status(201).json(organisation);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  res.json(await service.listOrganisations(resolveProjectId(req)));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  res.json(await service.getOrganisationById(resolveProjectId(req), req.params.id as string));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  res.json(await service.updateOrganisation(resolveProjectId(req), req.params.id as string, req.body, req.user.userId));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await service.deleteOrganisation(resolveProjectId(req), req.params.id as string, req.user.userId);
  res.status(204).send();
});
