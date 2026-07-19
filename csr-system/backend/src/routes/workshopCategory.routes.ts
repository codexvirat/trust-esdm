import { Router } from "express";
import * as controller from "../controllers/workshopCategory.controller";
import { requireAuth, requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createWorkshopCategorySchema, updateWorkshopCategorySchema } from "../validators/workshopCategory.validators";
import { PERMISSIONS } from "../types/permissions";

export const workshopCategoryRouter = Router();

workshopCategoryRouter.use(requireAuth);

workshopCategoryRouter.get("/", controller.list);
workshopCategoryRouter.post("/", requirePermission(PERMISSIONS.WORKSHOP_CREATE), validate(createWorkshopCategorySchema), controller.create);
workshopCategoryRouter.patch("/:id", requirePermission(PERMISSIONS.WORKSHOP_EDIT), validate(updateWorkshopCategorySchema), controller.update);
workshopCategoryRouter.delete("/:id", requirePermission(PERMISSIONS.WORKSHOP_DELETE), controller.remove);
