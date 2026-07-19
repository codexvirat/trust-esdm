import { Router } from "express";
import * as controller from "../controllers/workshop.controller";
import { requireAuth, requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createWorkshopSchema, updateWorkshopSchema, setWorkshopStatusSchema } from "../validators/workshop.validators";
import { PERMISSIONS } from "../types/permissions";
import { batchRouter } from "./batch.routes";
import { assessmentRouter } from "./assessment.routes";
import { feedbackFormRouter } from "./feedbackForm.routes";

export const workshopRouter = Router();

workshopRouter.use(requireAuth);

workshopRouter.get("/", requirePermission(PERMISSIONS.WORKSHOP_VIEW), controller.list);
workshopRouter.post("/", requirePermission(PERMISSIONS.WORKSHOP_CREATE), validate(createWorkshopSchema), controller.create);
workshopRouter.get("/:id", requirePermission(PERMISSIONS.WORKSHOP_VIEW), controller.getById);
workshopRouter.patch("/:id", requirePermission(PERMISSIONS.WORKSHOP_EDIT), validate(updateWorkshopSchema), controller.update);
workshopRouter.patch("/:id/status", requirePermission(PERMISSIONS.WORKSHOP_EDIT), validate(setWorkshopStatusSchema), controller.setStatus);
workshopRouter.delete("/:id", requirePermission(PERMISSIONS.WORKSHOP_DELETE), controller.remove);

// Nested resources: a batch, an assessment, and a feedback form always belong to one workshop.
workshopRouter.use("/:workshopId/batches", batchRouter);
workshopRouter.use("/:workshopId/assessments", assessmentRouter);
workshopRouter.use("/:workshopId/feedback-forms", feedbackFormRouter);
