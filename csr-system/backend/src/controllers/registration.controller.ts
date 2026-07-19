import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as service from "../services/registration.service";
import { ApiError } from "../utils/ApiError";
import { resolveProjectId } from "../utils/tenantScope";
import type { RegistrationStatus } from "../types/enums";

export const list = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const registrations = await service.listRegistrations(resolveProjectId(req), {
    workshopId: req.query.workshopId as string | undefined,
    status: req.query.status as RegistrationStatus | undefined,
  });
  res.json(registrations);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  res.json(await service.getRegistrationById(resolveProjectId(req), req.params.id as string));
});

export const registerAndApprove = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const result = await service.registerAndApprove({
    ...req.body,
    projectId: resolveProjectId(req),
    reviewerUserId: req.user.userId,
  });
  res.status(201).json(result);
});

export const approve = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const result = await service.approveRegistration({
    projectId: resolveProjectId(req),
    registrationId: req.params.id as string,
    reviewerUserId: req.user.userId,
  });
  res.json(result);
});

export const reject = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const registration = await service.rejectRegistration({
    projectId: resolveProjectId(req),
    registrationId: req.params.id as string,
    reason: req.body.reason,
    reviewerUserId: req.user.userId,
  });
  res.json(registration);
});
