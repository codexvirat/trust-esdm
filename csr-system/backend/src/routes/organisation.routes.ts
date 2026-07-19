import { Router } from "express";
import * as controller from "../controllers/organisation.controller";
import { requireAuth, requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createOrganisationSchema, updateOrganisationSchema } from "../validators/organisation.validators";
import { PERMISSIONS } from "../types/permissions";

export const organisationRouter = Router();

organisationRouter.use(requireAuth);

organisationRouter.get("/", requirePermission(PERMISSIONS.ORGANISATION_MANAGE), controller.list);
organisationRouter.get("/:id", requirePermission(PERMISSIONS.ORGANISATION_MANAGE), controller.getById);
organisationRouter.post("/", requirePermission(PERMISSIONS.ORGANISATION_MANAGE), validate(createOrganisationSchema), controller.create);
organisationRouter.patch("/:id", requirePermission(PERMISSIONS.ORGANISATION_MANAGE), validate(updateOrganisationSchema), controller.update);
organisationRouter.delete("/:id", requirePermission(PERMISSIONS.ORGANISATION_MANAGE), controller.remove);
