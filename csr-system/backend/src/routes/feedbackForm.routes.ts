import { Router } from "express";
import * as controller from "../controllers/feedbackForm.controller";
import { requireAuth, requirePermission } from "../middleware/auth";
import { requireTrainerAssignedToWorkshop } from "../middleware/trainerScope";
import { validate } from "../middleware/validate";
import { createFeedbackFormSchema, updateFeedbackFormSchema, setFeedbackEnabledSchema, submitFeedbackSchema } from "../validators/feedback.validators";
import { PERMISSIONS } from "../types/permissions";

// mergeParams so :workshopId from the parent /workshops/:workshopId mount is visible here.
export const feedbackFormRouter = Router({ mergeParams: true });

feedbackFormRouter.use(requireAuth);

// Visibility (enabled-only-for-candidate vs everything-for-staff) resolved in the controller.
feedbackFormRouter.get("/", controller.list);
feedbackFormRouter.get("/:formId", controller.getById);

feedbackFormRouter.post("/", requirePermission(PERMISSIONS.FEEDBACK_MANAGE), validate(createFeedbackFormSchema), controller.create);
feedbackFormRouter.patch("/:formId", requirePermission(PERMISSIONS.FEEDBACK_MANAGE), validate(updateFeedbackFormSchema), controller.update);
feedbackFormRouter.patch(
  "/:formId/enabled",
  requirePermission(PERMISSIONS.FEEDBACK_TOGGLE),
  requireTrainerAssignedToWorkshop,
  validate(setFeedbackEnabledSchema),
  controller.setEnabled,
);

feedbackFormRouter.post("/:formId/responses", requirePermission(PERMISSIONS.FEEDBACK_SUBMIT), validate(submitFeedbackSchema), controller.submit);
feedbackFormRouter.get(
  "/:formId/responses",
  requirePermission(PERMISSIONS.FEEDBACK_VIEW),
  requireTrainerAssignedToWorkshop,
  controller.listResponses,
);
feedbackFormRouter.get("/:formId/responses/mine", requirePermission(PERMISSIONS.FEEDBACK_SUBMIT), controller.getOwnResponse);
