import { Router } from "express";
import * as controller from "../controllers/batch.controller";
import * as certificateController from "../controllers/certificate.controller";
import * as batchReportController from "../controllers/batchReport.controller";
import { requirePermission } from "../middleware/auth";
import { requireWorkshopManagerAssignedToBatch } from "../middleware/workshopManagerScope";
import { requireBatchNotLocked } from "../middleware/batchLock";
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

// Consolidated PDF report — batch details, enrollment/attendance/assessment/feedback summary, certificate
// status per candidate, and photos. Read-only, so no lock check needed.
batchRouter.get(
  "/:batchId/report",
  requirePermission(PERMISSIONS.WORKSHOP_VIEW),
  requireWorkshopManagerAssignedToBatch,
  batchReportController.generateReport,
);
batchRouter.patch(
  "/:batchId",
  requirePermission(PERMISSIONS.WORKSHOP_EDIT),
  requireWorkshopManagerAssignedToBatch,
  requireBatchNotLocked,
  validate(updateBatchSchema),
  controller.update,
);
batchRouter.delete("/:batchId", requirePermission(PERMISSIONS.WORKSHOP_DELETE), requireBatchNotLocked, controller.remove);

// The one write allowed on a locked batch — everything else stays blocked until this is called.
batchRouter.patch(
  "/:batchId/unlock",
  requirePermission(PERMISSIONS.WORKSHOP_EDIT),
  requireWorkshopManagerAssignedToBatch,
  controller.unlock,
);

batchRouter.post(
  "/:batchId/photos",
  requirePermission(PERMISSIONS.WORKSHOP_EDIT),
  requireWorkshopManagerAssignedToBatch,
  requireBatchNotLocked,
  uploadBatchPhoto.array("photos", 20),
  controller.uploadPhoto,
);
batchRouter.delete(
  "/:batchId/photos/:photoId",
  requirePermission(PERMISSIONS.WORKSHOP_EDIT),
  requireWorkshopManagerAssignedToBatch,
  requireBatchNotLocked,
  controller.removePhoto,
);

batchRouter.post(
  "/:batchId/day-plan",
  requirePermission(PERMISSIONS.WORKSHOP_DAY_PLAN_MANAGE),
  requireWorkshopManagerAssignedToBatch,
  requireBatchNotLocked,
  validate(createDayPlanEntrySchema),
  controller.addDayPlanEntry,
);
batchRouter.patch(
  "/:batchId/day-plan/:entryId",
  requirePermission(PERMISSIONS.WORKSHOP_DAY_PLAN_MANAGE),
  requireWorkshopManagerAssignedToBatch,
  requireBatchNotLocked,
  validate(updateDayPlanEntrySchema),
  controller.updateDayPlanEntry,
);
batchRouter.delete(
  "/:batchId/day-plan/:entryId",
  requirePermission(PERMISSIONS.WORKSHOP_DAY_PLAN_MANAGE),
  requireWorkshopManagerAssignedToBatch,
  requireBatchNotLocked,
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
  requireBatchNotLocked,
  validate(generateCertificatesForBatchSchema),
  certificateController.generateForBatch,
);

// Publishes every draft certificate in the batch: sends the candidate their email and marks the
// enrollment "certified" so it shows up on their dashboard.
batchRouter.post(
  "/:batchId/certificates/publish",
  requirePermission(PERMISSIONS.CERTIFICATE_ISSUE),
  requireWorkshopManagerAssignedToBatch,
  requireBatchNotLocked,
  certificateController.publishForBatch,
);

// Deletes every draft certificate in the batch so they can be regenerated (e.g. wrong template
// picked, layout needs fixing) — only touches drafts, never a published/issued certificate.
batchRouter.delete(
  "/:batchId/certificates/drafts",
  requirePermission(PERMISSIONS.CERTIFICATE_ISSUE),
  requireWorkshopManagerAssignedToBatch,
  requireBatchNotLocked,
  certificateController.discardDraftsForBatch,
);
