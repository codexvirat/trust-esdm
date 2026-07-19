import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as service from "../services/feedbackQuestionBank.service";
import { ApiError } from "../utils/ApiError";
import { resolveProjectId } from "../utils/tenantScope";

export const create = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const question = await service.createQuestion({ ...req.body, projectId: resolveProjectId(req), createdByUserId: req.user.userId });
  res.status(201).json(question);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const tags = typeof req.query.tags === "string" ? req.query.tags.split(",") : undefined;
  res.json(await service.listQuestions(resolveProjectId(req), tags));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  res.json(await service.getQuestionById(resolveProjectId(req), req.params.id as string));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  res.json(await service.updateQuestion(resolveProjectId(req), req.params.id as string, req.body, req.user.userId));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await service.deleteQuestion(resolveProjectId(req), req.params.id as string, req.user.userId);
  res.status(204).send();
});
