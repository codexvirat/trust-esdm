import { Router } from "express";
import * as sessionController from "../controllers/attendanceSession.controller";
import * as recordController from "../controllers/attendanceRecord.controller";
import { requirePermission } from "../middleware/auth";
import { requireTrainerAssignedToBatch } from "../middleware/trainerScope";
import { requireWorkshopManagerAssignedToBatch } from "../middleware/workshopManagerScope";
import { validate } from "../middleware/validate";
import { createAttendanceSessionSchema } from "../validators/attendanceSession.validators";
import { markAttendanceSchema, scanCandidateBadgeSchema } from "../validators/attendanceRecord.validators";
import { PERMISSIONS } from "../types/permissions";

// mergeParams so :workshopId/:batchId from the parent mounts are visible here.
export const attendanceSessionRouter = Router({ mergeParams: true });

attendanceSessionRouter.get(
  "/",
  requirePermission(PERMISSIONS.ATTENDANCE_VIEW),
  requireTrainerAssignedToBatch,
  requireWorkshopManagerAssignedToBatch,
  sessionController.list,
);
attendanceSessionRouter.post(
  "/",
  requirePermission(PERMISSIONS.ATTENDANCE_GENERATE_QR),
  requireTrainerAssignedToBatch,
  requireWorkshopManagerAssignedToBatch,
  validate(createAttendanceSessionSchema),
  sessionController.create,
);
attendanceSessionRouter.get(
  "/:sessionId",
  requirePermission(PERMISSIONS.ATTENDANCE_VIEW),
  requireTrainerAssignedToBatch,
  requireWorkshopManagerAssignedToBatch,
  sessionController.getById,
);
attendanceSessionRouter.patch(
  "/:sessionId/close",
  requirePermission(PERMISSIONS.ATTENDANCE_GENERATE_QR),
  requireTrainerAssignedToBatch,
  requireWorkshopManagerAssignedToBatch,
  sessionController.close,
);

// Staff scans the candidate's personal badge QR to mark them present —
// candidates never self-mark (see GET /me/attendance-qr for the badge itself).
attendanceSessionRouter.post(
  "/:sessionId/scan-candidate",
  requirePermission(PERMISSIONS.ATTENDANCE_MARK),
  requireTrainerAssignedToBatch,
  requireWorkshopManagerAssignedToBatch,
  validate(scanCandidateBadgeSchema),
  recordController.scanCandidateBadge,
);

// Manual override with no scan at all (candidate has no badge handy, forgot it, etc.)
attendanceSessionRouter.post(
  "/:sessionId/records",
  requirePermission(PERMISSIONS.ATTENDANCE_MARK),
  requireTrainerAssignedToBatch,
  requireWorkshopManagerAssignedToBatch,
  validate(markAttendanceSchema),
  recordController.markManually,
);
