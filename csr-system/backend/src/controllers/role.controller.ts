import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as roleService from "../services/role.service";
import { ApiError } from "../utils/ApiError";
import { PERMISSION_CATALOG } from "../types/permissions";

export const list = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const roles = await roleService.listRolesForProject(req.user.projectId);
  res.json(roles);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const role = await roleService.createCustomRole({
    ...req.body,
    projectId: req.user.projectId,
    createdBy: req.user.userId,
  });
  res.status(201).json(role);
});

export const catalog = asyncHandler(async (_req: Request, res: Response) => {
  res.json(PERMISSION_CATALOG);
});
