import { Router } from "express";
import * as controller from "../controllers/batch.controller";
import * as certificateController from "../controllers/certificate.controller";
import { requirePermission } from "../middleware/auth";
import { requireWorkshopManagerAssignedToBatch } from "../middleware/workshopManagerScope";
import { validate } from "../middleware/validate";
import { uploadBatchPhoto } from "../middleware/upload";
import { createBatchSchema, updateBatchSchema, createDayPlanEntrySchema, updateDayPlanEntrySchema } from "../validators/batch.validators";
import { generateCertificatesForBatchSchema } from "../validators/certificate.validators";
import { PERMISSIONS } from "../types/permissions";
import { trainerAssignmentRouter } from "./trainerAssignment.routes";
import { workshopManagerAssignmentRouter } from "./workshopManagerAssignment.routes";
import { attendanceSessionRouter } from "./attendanceSession.routes";

// mergeParams so :workshopId from the parent /workshops/:workshopId mount is visible here.
export const batchRouter = Router({ mergeParams: true });

batchRouter.get("/", requirePermission(PERMISSIONS.WORKSHOP_VIEW), controller.list);
batchRouter.post("/", requirePermission(PERMISSIONS.WORKSHOP_EDIT), validate(createBatchSchema), controller.create);
batchRouter.get("/:batchId", requirePermission(PERMISSIONS.WORKSHOP_VIEW), requireWorkshopManagerAssignedToBatch, controller.getById);
batchRouter.patch(
  "/:batchId",
  requirePermission(PERMISSIONS.WORKSHOP_EDIT),
  requireWorkshopManagerAssignedToBatch,
  validate(updateBatchSchema),
  controller.update,
);
batchRouter.delete("/:batchId", requirePermission(PERMISSIONS.WORKSHOP_DELETE), controller.remove);

batchRouter.post(
  "/:batchId/photos",
  requirePermission(PERMISSIONS.WORKSHOP_EDIT),
  requireWorkshopManagerAssignedToBatch,
  uploadBatchPhoto.single("photo"),
  controller.uploadPhoto,
);
batchRouter.delete(
  "/:batchId/photos/:photoId",
  requirePermission(PERMISSIONS.WORKSHOP_EDIT),
  requireWorkshopManagerAssignedToBatch,
  controller.removePhoto,
);

batchRouter.post(
  "/:batchId/day-plan",
  requirePermission(PERMISSIONS.WORKSHOP_DAY_PLAN_MANAGE),
  requireWorkshopManagerAssignedToBatch,
  validate(createDayPlanEntrySchema),
  controller.addDayPlanEntry,
);
batchRouter.patch(
  "/:batchId/day-plan/:entryId",
  requirePermission(PERMISSIONS.WORKSHOP_DAY_PLAN_MANAGE),
  requireWorkshopManagerAssignedToBatch,
  validate(updateDayPlanEntrySchema),
  controller.updateDayPlanEntry,
);
batchRouter.delete(
  "/:batchId/day-plan/:entryId",
  requirePermission(PERMISSIONS.WORKSHOP_DAY_PLAN_MANAGE),
  requireWorkshopManagerAssignedToBatch,
  controller.removeDayPlanEntry,
);

// A trainer assignment always belongs to one batch. A workshop manager may only
// manage trainer assignments within their own assigned batch(es).
batchRouter.use("/:batchId/trainer-assignments", requireWorkshopManagerAssignedToBatch, trainerAssignmentRouter);

// A workshop manager assignment always belongs to one batch.
batchRouter.use("/:batchId/workshop-manager-assignments", workshopManagerAssignmentRouter);

// An attendance session (and its QR) always belongs to one batch.
batchRouter.use("/:batchId/attendance-sessions", attendanceSessionRouter);

// Bulk-issues certificates for every eligible, not-yet-certified enrollment in the batch at once —
// saved as drafts (rendered, downloadable, but not emailed or visible to candidates yet).
batchRouter.post(
  "/:batchId/certificates/generate",
  requirePermission(PERMISSIONS.CERTIFICATE_ISSUE),
  requireWorkshopManagerAssignedToBatch,
  validate(generateCertificatesForBatchSchema),
  certificateController.generateForBatch,
);

// Publishes every draft certificate in the batch: sends the candidate their email and marks the
// enrollment "certified" so it shows up on their dashboard.
batchRouter.post(
  "/:batchId/certificates/publish",
  requirePermission(PERMISSIONS.CERTIFICATE_ISSUE),
  requireWorkshopManagerAssignedToBatch,
  certificateController.publishForBatch,
);
