import { Router } from "express";
import * as controller from "../controllers/assessment.controller";
import * as attemptController from "../controllers/assessmentAttempt.controller";
import { requireAuth, requirePermission } from "../middleware/auth";
import { requireTrainerAssignedToWorkshop } from "../middleware/trainerScope";
import { validate } from "../middleware/validate";
import { createAssessmentSchema, updateAssessmentSchema, setAssessmentEnabledSchema, submitAttemptSchema } from "../validators/assessment.validators";
import { PERMISSIONS } from "../types/permissions";

// mergeParams so :workshopId from the parent /workshops/:workshopId mount is visible here.
export const assessmentRouter = Router({ mergeParams: true });

assessmentRouter.use(requireAuth);

// Visibility (sanitized-for-candidate vs full-for-staff) is resolved in the controller.
assessmentRouter.get("/", controller.list);
assessmentRouter.get("/:assessmentId", controller.getById);

assessmentRouter.post("/", requirePermission(PERMISSIONS.ASSESSMENT_MANAGE), validate(createAssessmentSchema), controller.create);
assessmentRouter.patch("/:assessmentId", requirePermission(PERMISSIONS.ASSESSMENT_MANAGE), validate(updateAssessmentSchema), controller.update);
assessmentRouter.delete("/:assessmentId", requirePermission(PERMISSIONS.ASSESSMENT_MANAGE), controller.remove);
assessmentRouter.patch(
  "/:assessmentId/enabled",
  requirePermission(PERMISSIONS.ASSESSMENT_TOGGLE),
  requireTrainerAssignedToWorkshop,
  validate(setAssessmentEnabledSchema),
  controller.setEnabled,
);

assessmentRouter.post("/:assessmentId/attempts", requirePermission(PERMISSIONS.ASSESSMENT_ATTEMPT), attemptController.start);
assessmentRouter.get("/:assessmentId/attempts/mine", requirePermission(PERMISSIONS.ASSESSMENT_ATTEMPT), attemptController.listOwn);
assessmentRouter.post(
  "/:assessmentId/attempts/:attemptId/submit",
  requirePermission(PERMISSIONS.ASSESSMENT_ATTEMPT),
  validate(submitAttemptSchema),
  attemptController.submit,
);
assessmentRouter.get(
  "/:assessmentId/attempts",
  requirePermission(PERMISSIONS.ASSESSMENT_VIEW_RESULTS),
  requireTrainerAssignedToWorkshop,
  attemptController.listForAssessment,
);
