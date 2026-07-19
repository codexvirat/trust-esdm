import { Router } from "express";
import * as controller from "../controllers/feedbackQuestionBank.controller";
import { requireAuth, requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createFeedbackQuestionSchema, updateFeedbackQuestionSchema } from "../validators/feedbackQuestionBank.validators";
import { PERMISSIONS } from "../types/permissions";

export const feedbackQuestionBankRouter = Router();

feedbackQuestionBankRouter.use(requireAuth, requirePermission(PERMISSIONS.FEEDBACK_MANAGE));

feedbackQuestionBankRouter.get("/", controller.list);
feedbackQuestionBankRouter.post("/", validate(createFeedbackQuestionSchema), controller.create);
feedbackQuestionBankRouter.get("/:id", controller.getById);
feedbackQuestionBankRouter.patch("/:id", validate(updateFeedbackQuestionSchema), controller.update);
feedbackQuestionBankRouter.delete("/:id", controller.remove);
