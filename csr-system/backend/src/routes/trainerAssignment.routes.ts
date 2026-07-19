import { Router } from "express";
import * as controller from "../controllers/trainerAssignment.controller";
import { requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createTrainerAssignmentSchema } from "../validators/trainerAssignment.validators";
import { PERMISSIONS } from "../types/permissions";

// mergeParams so :workshopId/:batchId from the parent mounts are visible here.
export const trainerAssignmentRouter = Router({ mergeParams: true });

trainerAssignmentRouter.get("/", requirePermission(PERMISSIONS.WORKSHOP_VIEW), controller.list);
trainerAssignmentRouter.post(
  "/",
  requirePermission(PERMISSIONS.WORKSHOP_ASSIGN_TRAINER),
  validate(createTrainerAssignmentSchema),
  controller.assign,
);
trainerAssignmentRouter.delete("/:assignmentId", requirePermission(PERMISSIONS.WORKSHOP_ASSIGN_TRAINER), controller.remove);
