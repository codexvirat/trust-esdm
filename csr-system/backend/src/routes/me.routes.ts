import { Router } from "express";
import * as controller from "../controllers/me.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { updateCandidateProfileSchema, updateTrainerProfileSchema } from "../validators/profile.validators";

export const meRouter = Router();

meRouter.use(requireAuth);

meRouter.get("/", controller.getProfile);
meRouter.patch("/candidate-profile", validate(updateCandidateProfileSchema), controller.updateCandidateProfile);
meRouter.patch("/trainer-profile", validate(updateTrainerProfileSchema), controller.updateTrainerProfile);

// The candidate's own attendance badge (rendered as a QR by the frontend) —
// staff scan this to mark attendance; see routes/attendanceSession.routes.ts.
meRouter.get("/attendance-qr", controller.getAttendanceQr);
meRouter.post("/attendance-qr/regenerate", controller.regenerateAttendanceQr);

// A trainer's own dashboard home — every batch they're currently assigned to.
meRouter.get("/trainer-assignments", controller.getOwnTrainerAssignments);

// A workshop manager's own dashboard home — every batch they're currently assigned to.
meRouter.get("/workshop-manager-assignments", controller.getOwnWorkshopManagerAssignments);
