import { Router } from "express";
import * as controller from "../controllers/project.controller";
import { requireAuth, requirePermission, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createProjectSchema, updateProjectSchema } from "../validators/project.validators";
import { PERMISSIONS } from "../types/permissions";

export const projectRouter = Router();

// Projects are the tenant root, managed platform-wide by Super Admins only —
// intentionally NOT filtered by req.user.projectId (see design doc Part 03).
projectRouter.use(requireAuth, requireRole("super_admin"));

projectRouter.post("/", requirePermission(PERMISSIONS.PROJECT_CREATE), validate(createProjectSchema), controller.create);
projectRouter.get("/", controller.list);
projectRouter.get("/:id", controller.getById);
projectRouter.patch("/:id", requirePermission(PERMISSIONS.PROJECT_MANAGE), validate(updateProjectSchema), controller.update);
projectRouter.delete("/:id", requirePermission(PERMISSIONS.PROJECT_MANAGE), controller.remove);
