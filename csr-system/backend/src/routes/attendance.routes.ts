import { Router } from "express";
import * as controller from "../controllers/attendanceRecord.controller";
import { requireAuth } from "../middleware/auth";

export const attendanceRouter = Router();

attendanceRouter.use(requireAuth);

// Marking always happens staff-side, nested under a specific session — see
// /workshops/:workshopId/batches/:batchId/attendance-sessions/:sessionId/scan-candidate
// in routes/attendanceSession.routes.ts. This top-level router is read-only.
// Visibility (own vs project-wide) is resolved inside the controller by req.user.roleCode.
attendanceRouter.get("/records", controller.list);
