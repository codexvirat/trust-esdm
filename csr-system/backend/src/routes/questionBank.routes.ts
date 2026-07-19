import { Router } from "express";
import * as controller from "../controllers/questionBank.controller";
import { requireAuth, requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createQuestionSchema, updateQuestionSchema } from "../validators/questionBank.validators";
import { PERMISSIONS } from "../types/permissions";

export const questionBankRouter = Router();

questionBankRouter.use(requireAuth, requirePermission(PERMISSIONS.ASSESSMENT_MANAGE));

questionBankRouter.get("/", controller.list);
questionBankRouter.post("/", validate(createQuestionSchema), controller.create);
questionBankRouter.get("/:id", controller.getById);
questionBankRouter.patch("/:id", validate(updateQuestionSchema), controller.update);
questionBankRouter.delete("/:id", controller.remove);
