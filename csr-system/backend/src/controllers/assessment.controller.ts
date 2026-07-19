import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as service from "../services/assessment.service";
import { ApiError } from "../utils/ApiError";
import { resolveProjectId } from "../utils/tenantScope";

export const create = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const assessment = await service.createAssessment({
    ...req.body,
    projectId: resolveProjectId(req),
    workshopId: req.params.workshopId as string,
    createdBy: req.user.userId,
  });
  res.status(201).json(assessment);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const assessments = await service.listAssessmentsForWorkshop(resolveProjectId(req), req.params.workshopId as string);

  if (req.user.roleCode === "candidate") {
    res.json(assessments.filter((a) => a.isEnabled).map((a) => service.sanitizeAssessmentForCandidate(a)));
    return;
  }
  res.json(assessments);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const assessment = await service.getAssessmentById(resolveProjectId(req), req.params.workshopId as string, req.params.assessmentId as string);

  if (req.user.roleCode === "candidate") {
    if (!assessment.isEnabled) throw ApiError.notFound("Assessment not found");
    res.json(service.sanitizeAssessmentForCandidate(assessment));
    return;
  }
  res.json(assessment);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const assessment = await service.updateAssessment(
    resolveProjectId(req),
    req.params.workshopId as string,
    req.params.assessmentId as string,
    req.body,
    req.user.userId,
  );
  res.json(assessment);
});

export const setEnabled = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const assessment = await service.setAssessmentEnabled(
    resolveProjectId(req),
    req.params.workshopId as string,
    req.params.assessmentId as string,
    req.body.isEnabled,
    req.user.userId,
  );
  res.json(assessment);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await service.deleteAssessment(resolveProjectId(req), req.params.workshopId as string, req.params.assessmentId as string, req.user.userId);
  res.status(204).send();
});
