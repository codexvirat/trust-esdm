import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as service from "../services/attendanceRecord.service";
import { ApiError } from "../utils/ApiError";
import { resolveProjectId } from "../utils/tenantScope";

export const scanCandidateBadge = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const record = await service.markAttendanceByBadgeScan({
    ...req.body,
    projectId: resolveProjectId(req),
    workshopId: req.params.workshopId as string,
    batchId: req.params.batchId as string,
    sessionId: req.params.sessionId as string,
    markedByUserId: req.user.userId,
  });
  res.status(201).json(record);
});

export const markManually = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const record = await service.markAttendanceManually({
    ...req.body,
    projectId: resolveProjectId(req),
    workshopId: req.params.workshopId as string,
    batchId: req.params.batchId as string,
    sessionId: req.params.sessionId as string,
    markedByUserId: req.user.userId,
  });
  res.status(201).json(record);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();

  if (req.user.roleCode === "candidate") {
    res.json(await service.listOwnRecords(req.user.userId, { batchId: req.query.batchId as string | undefined }));
    return;
  }

  if (!["super_admin", "admin", "manager", "workshop_manager", "trainer"].includes(req.user.roleCode)) {
    throw ApiError.forbidden();
  }

  res.json(
    await service.listProjectRecords(resolveProjectId(req), {
      batchId: req.query.batchId as string | undefined,
      candidateUserId: req.query.candidateUserId as string | undefined,
    }),
  );
});
