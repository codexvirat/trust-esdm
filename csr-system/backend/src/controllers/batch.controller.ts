import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as service from "../services/batch.service";
import { ApiError } from "../utils/ApiError";
import { resolveProjectId } from "../utils/tenantScope";

export const create = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const batch = await service.createBatch({
    ...req.body,
    projectId: resolveProjectId(req),
    workshopId: req.params.workshopId as string,
    createdBy: req.user.userId,
  });
  res.status(201).json(batch);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  res.json(await service.listBatchesForWorkshop(resolveProjectId(req), req.params.workshopId as string));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  res.json(await service.getBatchById(resolveProjectId(req), req.params.workshopId as string, req.params.batchId as string));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  res.json(
    await service.updateBatch(resolveProjectId(req), req.params.workshopId as string, req.params.batchId as string, req.body, req.user.userId),
  );
});

export const unlock = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const batch = await service.unlockBatch(
    resolveProjectId(req),
    req.params.workshopId as string,
    req.params.batchId as string,
    req.user.userId,
  );
  res.json(batch);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await service.deleteBatch(resolveProjectId(req), req.params.workshopId as string, req.params.batchId as string, req.user.userId);
  res.status(204).send();
});

export const uploadPhoto = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const files = Array.isArray(req.files) ? req.files : [];
  if (files.length === 0) throw ApiError.badRequest("At least one photo file is required");
  const urls = files.map((file) => `${req.protocol}://${req.get("host")}/uploads/batch-photos/${file.filename}`);
  const batch = await service.addBatchPhotos(resolveProjectId(req), req.params.workshopId as string, req.params.batchId as string, urls);
  res.status(201).json(batch);
});

export const removePhoto = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const batch = await service.removeBatchPhoto(
    resolveProjectId(req),
    req.params.workshopId as string,
    req.params.batchId as string,
    req.params.photoId as string,
  );
  res.json(batch);
});

export const addDayPlanEntry = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const batch = await service.addDayPlanEntry(resolveProjectId(req), req.params.workshopId as string, req.params.batchId as string, req.body);
  res.status(201).json(batch);
});

export const updateDayPlanEntry = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const batch = await service.updateDayPlanEntry(
    resolveProjectId(req),
    req.params.workshopId as string,
    req.params.batchId as string,
    req.params.entryId as string,
    req.body,
  );
  res.json(batch);
});

export const removeDayPlanEntry = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const batch = await service.removeDayPlanEntry(
    resolveProjectId(req),
    req.params.workshopId as string,
    req.params.batchId as string,
    req.params.entryId as string,
  );
  res.json(batch);
});
