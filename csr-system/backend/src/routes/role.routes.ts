import { Router } from "express";
import * as controller from "../controllers/role.controller";
import { requireAuth, requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createRoleSchema } from "../validators/role.validators";
import { PERMISSIONS } from "../types/permissions";

export const roleRouter = Router();

roleRouter.use(requireAuth);

roleRouter.get("/", controller.list);
roleRouter.get("/permission-catalog", controller.catalog);
roleRouter.post("/", requirePermission(PERMISSIONS.ROLE_MANAGE), validate(createRoleSchema), controller.create);
