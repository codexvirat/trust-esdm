import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as service from "../services/assessmentAttempt.service";
import { ApiError } from "../utils/ApiError";
import { resolveProjectId } from "../utils/tenantScope";

export const start = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const result = await service.startAttempt({
    projectId: resolveProjectId(req),
    workshopId: req.params.workshopId as string,
    assessmentId: req.params.assessmentId as string,
    candidateUserId: req.user.userId,
  });
  res.status(201).json(result);
});

export const submit = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const result = await service.submitAttempt({
    projectId: resolveProjectId(req),
    workshopId: req.params.workshopId as string,
    assessmentId: req.params.assessmentId as string,
    attemptId: req.params.attemptId as string,
    candidateUserId: req.user.userId,
    answers: req.body.answers,
  });
  res.json(result);
});

export const listOwn = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  res.json(await service.listOwnAttempts(req.user.userId, req.params.assessmentId as string));
});

export const listForAssessment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  res.json(await service.listAttemptsForAssessment(resolveProjectId(req), req.params.assessmentId as string));
});
