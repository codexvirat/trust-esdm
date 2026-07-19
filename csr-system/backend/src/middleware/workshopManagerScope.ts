import type { NextFunction, Request, Response } from "express";
import { WorkshopManagerAssignment } from "../models/WorkshopManagerAssignment";
import { ApiError } from "../utils/ApiError";

/**
 * Defense in depth beyond requirePermission: a workshop manager's ATTENDANCE_MARK /
 * ASSESSMENT_TOGGLE / FEEDBACK_TOGGLE etc. grants are project-wide permission
 * bits, but workshop managers should only be able to act on batches/workshops
 * they're actually assigned to — not every batch in the project. Admins,
 * Managers, and Super Admins bypass this (they already have project-wide authority).
 */
export function requireWorkshopManagerAssignedToBatch(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) throw ApiError.unauthorized();
  if (req.user.roleCode !== "workshop_manager") {
    next();
    return;
  }

  const batchId = req.params.batchId;
  WorkshopManagerAssignment.exists({ projectId: req.user.projectId, batchId, workshopManagerId: req.user.userId, status: "active" })
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
export function requireWorkshopManagerAssignedToWorkshop(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) throw ApiError.unauthorized();
  if (req.user.roleCode !== "workshop_manager") {
    next();
    return;
  }

  const workshopId = req.params.workshopId;
  WorkshopManagerAssignment.exists({ projectId: req.user.projectId, workshopId, workshopManagerId: req.user.userId, status: "active" })
    .then((assignment) => {
      if (!assignment) {
        next(ApiError.forbidden("You are not assigned to this workshop"));
        return;
      }
      next();
    })
    .catch(next);
}
