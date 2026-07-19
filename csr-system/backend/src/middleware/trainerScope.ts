import type { NextFunction, Request, Response } from "express";
import { TrainerAssignment } from "../models/TrainerAssignment";
import { ApiError } from "../utils/ApiError";

/**
 * Defense in depth beyond requirePermission: a trainer's ATTENDANCE_MARK /
 * ASSESSMENT_TOGGLE / FEEDBACK_TOGGLE etc. grants are project-wide permission
 * bits, but trainers should only be able to act on batches/workshops they're
 * actually assigned to — not every batch in the project. Managers and
 * Super Admins bypass this (they already have project-wide authority).
 */
export function requireTrainerAssignedToBatch(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) throw ApiError.unauthorized();
  if (req.user.roleCode !== "trainer") {
    next();
    return;
  }

  const batchId = req.params.batchId;
  TrainerAssignment.exists({ projectId: req.user.projectId, batchId, trainerId: req.user.userId, status: "active" })
    .then((assignment) => {
      if (!assignment) {
        next(ApiError.forbidden("You are not assigned to this batch"));
        return;
      }
      next();
    })
    .catch(next);
}

/** Same idea, but for routes scoped by workshopId only (assessments, feedback forms) — any active assignment to a batch under that workshop qualifies. */
export function requireTrainerAssignedToWorkshop(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) throw ApiError.unauthorized();
  if (req.user.roleCode !== "trainer") {
    next();
    return;
  }

  const workshopId = req.params.workshopId;
  TrainerAssignment.exists({ projectId: req.user.projectId, workshopId, trainerId: req.user.userId, status: "active" })
    .then((assignment) => {
      if (!assignment) {
        next(ApiError.forbidden("You are not assigned to this workshop"));
        return;
      }
      next();
    })
    .catch(next);
}
