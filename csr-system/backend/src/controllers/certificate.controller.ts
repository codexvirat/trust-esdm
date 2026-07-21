import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as service from "../services/certificate.service";
import { ApiError } from "../utils/ApiError";
import { resolveProjectId } from "../utils/tenantScope";

export const checkEligibility = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  res.json(await service.checkEligibility(resolveProjectId(req), req.params.id as string));
});

export const issue = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const certificate = await service.issueCertificate({
    projectId: resolveProjectId(req),
    enrollmentId: req.params.id as string,
    templateId: req.body.templateId,
    issuedByUserId: req.user.userId,
    origin: `${req.protocol}://${req.get("host")}`,
  });
  res.status(201).json(certificate);
});

export const generateForBatch = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const result = await service.generateCertificatesForBatch({
    projectId: resolveProjectId(req),
    workshopId: req.params.workshopId as string,
    batchId: req.params.batchId as string,
    templateId: req.body.templateId,
    issuedByUserId: req.user.userId,
    origin: `${req.protocol}://${req.get("host")}`,
  });
  res.status(200).json(result);
});

export const publishForBatch = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const result = await service.publishCertificatesForBatch({
    projectId: resolveProjectId(req),
    workshopId: req.params.workshopId as string,
    batchId: req.params.batchId as string,
  });
  res.status(200).json(result);
});

export const revoke = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const certificate = await service.revokeCertificate({
    projectId: resolveProjectId(req),
    certificateId: req.params.id as string,
    reason: req.body.reason,
    revokedBy: req.user.userId,
  });
  res.json(certificate);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();

  if (req.user.roleCode === "candidate") {
    res.json(await service.getOwnCertificates(req.user.userId));
    return;
  }

  res.json(
    await service.listCertificates(resolveProjectId(req), {
      workshopId: req.query.workshopId as string | undefined,
      batchId: req.query.batchId as string | undefined,
      candidateUserId: req.query.candidateUserId as string | undefined,
      status: req.query.status as string | undefined,
    }),
  );
});

export const verify = asyncHandler(async (req: Request, res: Response) => {
  res.json(await service.verifyByCode(req.params.code as string));
});
