import type { NextFunction, Request, Response } from "express";
import { Batch } from "../models/Batch";
import { ApiError } from "../utils/ApiError";
import { resolveProjectId } from "../utils/tenantScope";

/**
 * Blocks every batch-scoped write once a batch is locked (see Batch.isLocked
 * and batch.service.ts#updateBatch) — applies to every role, including
 * admins, so the only way through is the dedicated unlock endpoint.
 * A missing batch is left for the controller's own lookup to 404.
 */
export function requireBatchNotLocked(req: Request, _res: Response, next: NextFunction): void {
  const batchId = req.params.batchId;
  Batch.findOne({ _id: batchId, projectId: resolveProjectId(req) })
    .select("isLocked")
    .then((batch) => {
      if (batch?.isLocked) {
        next(ApiError.forbidden("This batch is locked and read-only. Ask an admin to unlock it before making changes."));
        return;
      }
      next();
    })
    .catch(next);
}
