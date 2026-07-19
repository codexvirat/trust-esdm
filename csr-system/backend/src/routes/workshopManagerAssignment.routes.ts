import { Router } from "express";
import * as controller from "../controllers/workshopManagerAssignment.controller";
import { requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createWorkshopManagerAssignmentSchema } from "../validators/workshopManagerAssignment.validators";
import { PERMISSIONS } from "../types/permissions";

// mergeParams so :workshopId/:batchId from the parent mounts are visible here.
export const workshopManagerAssignmentRouter = Router({ mergeParams: true });

workshopManagerAssignmentRouter.get("/", requirePermission(PERMISSIONS.WORKSHOP_VIEW), controller.list);
workshopManagerAssignmentRouter.post(
  "/",
  requirePermission(PERMISSIONS.WORKSHOP_ASSIGN_TRAINER),
  validate(createWorkshopManagerAssignmentSchema),
  controller.assign,
);
workshopManagerAssignmentRouter.delete(
  "/:assignmentId",
  requirePermission(PERMISSIONS.WORKSHOP_ASSIGN_TRAINER),
  controller.remove,
);
