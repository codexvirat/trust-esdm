import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as formService from "../services/feedbackForm.service";
import * as responseService from "../services/feedbackResponse.service";
import { ApiError } from "../utils/ApiError";
import { resolveProjectId } from "../utils/tenantScope";

export const create = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const form = await formService.createFeedbackForm({ ...req.body, projectId: resolveProjectId(req), workshopId: req.params.workshopId as string, createdBy: req.user.userId });
  res.status(201).json(form);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const form = await formService.updateFeedbackForm(resolveProjectId(req), req.params.workshopId as string, req.params.formId as string, req.body, req.user.userId);
  res.json(form);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const forms = await formService.listFormsForWorkshop(resolveProjectId(req), req.params.workshopId as string);
  if (req.user.roleCode === "candidate") {
    res.json(forms.filter((f) => f.isEnabled));
    return;
  }
  res.json(forms);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const form = await formService.getFormById(resolveProjectId(req), req.params.workshopId as string, req.params.formId as string);
  if (req.user.roleCode === "candidate" && !form.isEnabled) throw ApiError.notFound("Feedback form not found");
  res.json(form);
});

export const setEnabled = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const form = await formService.setFormEnabled(
    resolveProjectId(req),
    req.params.workshopId as string,
    req.params.formId as string,
    req.body.isEnabled,
    req.user.userId,
  );
  res.json(form);
});

export const submit = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const response = await responseService.submitFeedback({
    ...req.body,
    projectId: resolveProjectId(req),
    workshopId: req.params.workshopId as string,
    formId: req.params.formId as string,
    candidateUserId: req.user.userId,
  });
  res.status(201).json(response);
});

export const listResponses = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  res.json(await responseService.listResponsesForForm(resolveProjectId(req), req.params.formId as string));
});

export const getOwnResponse = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  res.json(await responseService.getOwnResponse(req.user.userId, req.params.formId as string));
});
